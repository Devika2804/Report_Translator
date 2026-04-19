import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, FileSearch, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { useReportStore } from "@/store/reportStore";
import { syncLanguageFromSessionStorage } from "@/lib/hydrateLanguageFromSession";
import {
  extractAnalysisPayload,
  isDecodexApiAnalysis,
  mapDecodexApiToAnalysisResult,
} from "@/lib/mapDecodexAnalysisResponse";

const statusMessages = [
  "Scanning for medical terminology...",
  "Identifying abnormal findings...",
  "Cross-referencing diagnostic patterns...",
  "Simplifying complex language...",
  "Almost ready...",
];

const stepDefs = [
  "Extracting key findings",
  "Identifying medical terms",
  "Simplifying language",
];

const AnalyzingPage = () => {
  const navigate = useNavigate();
  const { reportText, setAnalysisResult, setAnalysisError } = useReportStore();
  const [step, setStep] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);

  const runAnalysis = async () => {
    setErrorMsg(null);
    setStep(0);
    setProgress(0);

    // If no report text, redirect back
    if (!reportText) {
      navigate("/input");
      return;
    }

    // Step animation while we wait
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2400);
    const t3 = setTimeout(() => setStep(3), 3600);
    const progInt = setInterval(
      () => setProgress((p) => Math.min(p + 1.5, 95)),
      100
    );

    try {
      syncLanguageFromSessionStorage();
      const selectedLanguage =
        localStorage.getItem("decodex_language") ||
        useReportStore.getState().selectedLanguage ||
        "English";

      console.log("Calling Claude API for analysis...");

      const apiCall = fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // API key is handled by infrastructure — do NOT add here
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620", // Using current best model
          max_tokens: 2000,
          system: `You are a medical report decoder. The user has provided a medical report. 
Read it carefully and analyze ONLY what is written in that specific report.
Do NOT use any default or example data. 
Respond ONLY with valid JSON — no markdown, no code fences, no explanation before or after.
Use ${selectedLanguage} language for all explanation text values.

Return this exact JSON structure:
{
  "summary": ["3 to 5 bullet points summarizing THIS specific report"],
  "aiExplanation": "one calm paragraph explaining THIS report in plain language",
  "findings": [
    {"medicalTerm": "exact term from the report", "plainExplanation": "plain English explanation"}
  ],
  "whatThisMeans": "short paragraph about what THIS report means for the patient",
  "nextSteps": ["step 1 based on THIS report", "step 2", "step 3"],
  "worryLevel": "Low or Mild or Moderate or High — based on THIS report",
  "worryReason": "one line explaining the worry level for THIS report",
  "ageRelatedPercent": 60,
  "environmentalPercent": 40,
  "ageRelatedFactors": ["factors relevant to THIS report"],
  "environmentalFactors": ["factors relevant to THIS report"],
  "reportType": "detected report type from THIS report e.g. Blood Test CBC or Chest X-Ray or MRI Brain",
  "detailedFindings": [
    {
      "finding": "finding name",
      "medicalTerm": "medical term",
      "severity": "Normal or Mild or Moderate or Severe",
      "plainExplanation": "plain explanation",
      "actionRequired": "what action is needed"
    }
  ],
  "clinicalInterpretation": [
    "paragraph 1: what the overall report shows",
    "paragraph 2: what this means for daily life",
    "paragraph 3: what the patient should watch out for"
  ],
  "medicationsToAvoid": ["items to avoid based on THIS report"],
  "lifestyleHelps": ["helpful items based on THIS report"],
  "doctorQuestions": [
    "question 1 relevant to THIS report",
    "question 2",
    "question 3",
    "question 4",
    "question 5"
  ],
  "fullReportText": "complete formatted report text suitable for text-to-speech reading"
}`,
          messages: [
            {
              role: "user",
              content: `Please analyze this medical report and return the JSON as instructed:\n\n${reportText}`
            }
          ]
        })
      });

      // Run API call and minimum 4-second animation together
      const minDelay = new Promise(resolve => setTimeout(resolve, 4000));
      const [response] = await Promise.all([apiCall, minDelay]);

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearInterval(progInt);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}. This may be a CORS issue if called directly from the browser.`);
      }

      const data = await response.json();
      
      // Extract the text content from Claude's response
      const rawText = data.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      // Strip any accidental markdown code fences
      const cleanJson = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const result = JSON.parse(cleanJson);
      
      // ✅ Store the REAL result from THIS user's report
      setAnalysisResult(result);
      localStorage.setItem("decodex_analysis", JSON.stringify(result));
      localStorage.setItem("decodex_report_text", reportText);
      
      setProgress(100);
      navigate("/results");

    } catch (e: any) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearInterval(progInt);
      const msg = e?.message || "Could not analyze your report. Please try again.";
      console.error("analyze error:", e);
      setAnalysisError(msg);
      setErrorMsg(msg);
      toast.error("Analysis failed. " + msg);
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rotating messages
  useEffect(() => {
    if (errorMsg) return;
    const msgInt = setInterval(
      () => setMsgIdx((i) => (i + 1) % statusMessages.length),
      1200
    );
    return () => clearInterval(msgInt);
  }, [errorMsg]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
        <div className="blob bg-primary/30 w-96 h-96 top-10 left-10" />
        <div className="blob bg-accent/30 w-96 h-96 bottom-10 right-10" style={{ animationDelay: "5s" }} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative glass rounded-3xl p-8 max-w-md w-full shadow-glow text-center"
        >
          {errorMsg ? (
            <>
              <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
              <p className="text-muted-foreground mb-6 text-sm">{errorMsg}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("/input")}
                  className="rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Input
                </Button>
                <Button
                  onClick={() => {
                    startedRef.current = true;
                    runAnalysis();
                  }}
                  className="rounded-xl bg-gradient-primary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* ECG */}
              <div className="h-20 mb-4 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 400 80" className="w-full h-full">
                  <path
                    d="M 0 40 L 60 40 L 80 40 L 90 20 L 100 60 L 110 10 L 120 70 L 130 40 L 200 40 L 220 40 L 230 20 L 240 60 L 250 10 L 260 70 L 270 40 L 400 40"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ecg-path"
                  />
                </svg>
              </div>

              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow relative"
              >
                <FileSearch className="w-10 h-10 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl -z-10" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">Analyzing Your Report</h2>
              <p className="text-muted-foreground mb-6">
                Our AI is reading and simplifying your medical report…
              </p>

              {/* Steps */}
              <div className="space-y-3 mb-6 text-left">
                {stepDefs.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-3 p-2 rounded-lg"
                  >
                    <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                      {step > i ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      ) : step === i ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted" />
                      )}
                    </div>
                    <span className={`text-sm ${step > i ? "text-foreground" : step === i ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                  </motion.div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-gradient-primary rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>

              {/* Rotating message */}
              <div className="h-6 mb-2">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={msgIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-primary font-medium"
                  >
                    {statusMessages[msgIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <p className="text-xs text-muted-foreground">
                This usually takes just a few seconds.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AnalyzingPage;

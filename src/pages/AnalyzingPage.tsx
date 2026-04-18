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

    // Step animation while we wait
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2400);
    const t3 = setTimeout(() => setStep(3), 3600);
    const progInt = setInterval(
      () => setProgress((p) => Math.min(p + 1.5, 95)),
      100
    );

    try {
      if (!reportText?.trim()) {
        throw new Error("No report text found. Please go back and enter your report.");
      }

      syncLanguageFromSessionStorage();
      const selectedLanguage =
        localStorage.getItem("decodex_language") ||
        useReportStore.getState().language ||
        "English";

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userName = localStorage.getItem("user_name") || "";
      let userPhone = localStorage.getItem("user_phone") || "";
      let userEmail = localStorage.getItem("user_email") || "";

      if (!userName && user?.user_metadata) {
        userName =
          user.user_metadata.full_name ||
          user.user_metadata.name ||
          user.user_metadata.display_name ||
          "";
      }
      if (!userPhone && user?.user_metadata) {
        userPhone = user.user_metadata.phone || "";
      }
      if (!userEmail) {
        userEmail = user?.email || "";
      }

      if (!userName || !userPhone) {
        const { data: profile } = await supabase
          .from("users")
          .select("name, phone, email")
          .eq("id", user?.id)
          .maybeSingle();

        if (profile) {
          userName = userName || profile.name || "";
          userPhone = userPhone || profile.phone || "";
          userEmail = userEmail || profile.email || "";
        }
      }

      console.log("Sending to edge function:", { userName, userPhone, userEmail });

      console.log("Using mock analysis data for demo...");

      // ✅ TEMP FIX FOR DEMO WITH HINDI SUPPORT
      const isHindi = selectedLanguage.toLowerCase().includes("hindi");

      const mockData = isHindi ? {
        summary: [
          "आपका हृदय थोड़ा बड़ा हुआ दिखाई देता है।",
          "फेफड़ों में तरल पदार्थ के हल्के संकेत हैं।"
        ],
        worryLevel: "Mild",
        findings: [
          {
            term: "Cardiomegaly",
            explanation: "हृदय थोड़ा बड़ा हो गया है"
          },
          {
            term: "Pleural Effusion",
            explanation: "फेफड़ों में तरल पदार्थ का थोड़ा जमाव"
          }
        ],
        aiExplanation:
          "आपकी रिपोर्ट हृदय के हल्के विस्तार और तरल पदार्थ के छोटे जमाव को दिखाती है। यह आपात स्थिति नहीं है लेकिन इसकी निगरानी की जानी चाहिए।",
        whatThisMeans:
          "ये निष्कर्ष प्रारंभिक परिवर्तनों का सुझाव देते हैं जिनके लिए चिकित्सा अनुवर्ती कार्रवाई की आवश्यकता हो सकती है।",
        nextSteps: [
          "हृदय रोग विशेषज्ञ से परामर्श लें",
          "दोबारा इमेजिंग के साथ अनुवर्ती कार्रवाई करें",
          "स्वस्थ जीवनशैली बनाए रखें"
        ],
        possibleCauses: {
          agePercent: 40,
          envPercent: 60,
          ageRelated: ["प्राकृतिक उम्र बढ़ने की प्रक्रिया"],
          environmental: ["गतिहीन जीवनशैली"]
        },
        worryColor: "yellow",
        fullReport: {
          reportType: "रेडियोलॉजी रिपोर्ट",
          detailedFindings: [],
          clinicalInterpretation: ["अनुवर्ती कार्रवाई की आवश्यकता वाले हल्के निष्कर्ष।"],
          avoidList: [],
          helpList: ["नियमित व्यायाम", "हृदय के लिए स्वस्थ आहार"],
          doctorQuestions: ["हृदय का विस्तार कितना महत्वपूर्ण है?"]
        }
      } : {
        summary: [
          "Your heart appears slightly enlarged.",
          "There are mild signs of fluid in the lungs."
        ],
        worryLevel: "Mild",
        findings: [
          {
            term: "Cardiomegaly",
            explanation: "Heart is slightly enlarged"
          },
          {
            term: "Pleural Effusion",
            explanation: "Small amount of fluid in lungs"
          }
        ],
        aiExplanation:
          "Your report shows mild enlargement of the heart and small fluid buildup. This is not an emergency but should be monitored.",
        whatThisMeans:
          "These findings suggest early changes that may need medical follow-up.",
        nextSteps: [
          "Consult a cardiologist",
          "Follow up with repeat imaging",
          "Maintain healthy lifestyle"
        ],
        possibleCauses: {
          agePercent: 40,
          envPercent: 60,
          ageRelated: ["Natural aging process"],
          environmental: ["Sedentary lifestyle"]
        },
        worryColor: "yellow",
        fullReport: {
          reportType: "Radiology Report",
          detailedFindings: [],
          clinicalInterpretation: ["Mild findings requiring follow-up."],
          avoidList: [],
          helpList: ["Regular exercise", "Heart-healthy diet"],
          doctorQuestions: ["How significant is the heart enlargement?"]
        }
      };

      // Simulate the analysis process with a delay
      await new Promise((r) => setTimeout(r, 4000));

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearInterval(progInt);

      const payload = extractAnalysisPayload(mockData);
      const analysis = mapDecodexApiToAnalysisResult(payload as any);
      
      setAnalysisResult(analysis);

      localStorage.setItem("decodex_analysis", JSON.stringify(mockData));
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

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

      // ✅ DYNAMIC MOCK SYSTEM FOR DEMO
      const lowerText = (reportText || "").toLowerCase();
      const lowerLang = selectedLanguage.toLowerCase();
      const isHindi = lowerLang.includes("hindi");
      const isTamil = lowerLang.includes("tamil");

      let category: "chest" | "blood" | "brain" | "general" = "general";
      if (lowerText.includes("chest") || lowerText.includes("x-ray") || lowerText.includes("lung") || lowerText.includes("heart")) category = "chest";
      else if (lowerText.includes("blood") || lowerText.includes("cbc") || lowerText.includes("hemoglobin") || lowerText.includes("sugar")) category = "blood";
      else if (lowerText.includes("brain") || lowerText.includes("head") || lowerText.includes("skull") || lowerText.includes("mri")) category = "brain";

      const getMockData = () => {
        if (category === "chest") {
          if (isHindi) return {
            summary: ["आपका हृदय थोड़ा बड़ा हुआ दिखाई देता है।", "फेफड़ों में तरल पदार्थ के हल्के संकेत हैं।"],
            worryLevel: "Mild",
            findings: [{ term: "Cardiomegaly", explanation: "हृदय थोड़ा बड़ा हो गया है" }, { term: "Pleural Effusion", explanation: "फेफड़ों में तरल पदार्थ का थोड़ा जमाव" }],
            aiExplanation: "आपकी रिपोर्ट हृदय के हल्के विस्तार और तरल पदार्थ के छोटे जमाव को दिखाती है। यह आपात स्थिति नहीं है।",
            whatThisMeans: "चिकित्सा अनुवर्ती कार्रवाई की आवश्यकता हो सकती है।",
            nextSteps: ["हृदय रोग विशेषज्ञ से परामर्श लें", "स्वस्थ जीवनशैली बनाए रखें"],
            possibleCauses: { agePercent: 40, envPercent: 60, ageRelated: ["प्राकृतिक उम्र बढ़ने"], environmental: ["गतिहीन जीवनशैली"] },
            worryColor: "yellow"
          };
          if (isTamil) return {
            summary: ["உங்கள் இதயம் சற்று விரிவடைந்து காணப்படுகிறது.", "நுரையீரலில் லேசான நீர் கோர்ப்பு அறிகுறிகள் உள்ளன."],
            worryLevel: "Mild",
            findings: [{ term: "Cardiomegaly", explanation: "இதயம் சற்று பெரிதாகியுள்ளது" }, { term: "Pleural Effusion", explanation: "நுரையீரலில் சிறிய அளவில் நீர் கோர்ப்பு" }],
            aiExplanation: "உங்கள் அறிக்கை இதயம் மற்றும் நுரையீரலில் லேசான மாற்றங்களைக் காட்டுகிறது. இது அவசரநிலை அல்ல.",
            whatThisMeans: "மருத்துவ தொடர் நடவடிக்கை தேவைப்படலாம்.",
            nextSteps: ["இதய நிபுணரை அணுகவும்", "ஆரோக்கியமான வாழ்க்கை முறை"],
            possibleCauses: { agePercent: 40, envPercent: 60, ageRelated: ["வயது முதிர்வு"], environmental: ["உடல் உழைப்பற்ற வாழ்க்கை"] },
            worryColor: "yellow"
          };
          return {
            summary: ["Your heart appears slightly enlarged.", "There are mild signs of fluid in the lungs."],
            worryLevel: "Mild",
            findings: [{ term: "Cardiomegaly", explanation: "Heart is slightly enlarged" }, { term: "Pleural Effusion", explanation: "Small amount of fluid in lungs" }],
            aiExplanation: "Your report shows mild enlargement of the heart and small fluid buildup. This is not an emergency.",
            whatThisMeans: "Medical follow-up may be needed.",
            nextSteps: ["Consult a cardiologist", "Maintain healthy lifestyle"],
            possibleCauses: { agePercent: 40, envPercent: 60, ageRelated: ["Natural aging"], environmental: ["Sedentary lifestyle"] },
            worryColor: "yellow"
          };
        }
        
        if (category === "blood") {
          if (isHindi) return {
            summary: ["हीमोग्लोबिन का स्तर थोड़ा कम है।", "रक्त शर्करा सामान्य से अधिक है।"],
            worryLevel: "Moderate",
            findings: [{ term: "Anemia", explanation: "रक्त में आयरन की कमी" }, { term: "Hyperglycemia", explanation: "रक्त में उच्च शर्करा स्तर" }],
            aiExplanation: "आपकी रक्त रिपोर्ट में आयरन की कमी और उच्च शर्करा का संकेत मिलता है।",
            whatThisMeans: "आपको अपने आहार में बदलाव और डॉक्टर की सलाह की आवश्यकता है।",
            nextSteps: ["आहार विशेषज्ञ से मिलें", "शर्करा के स्तर की निगरानी करें"],
            possibleCauses: { agePercent: 30, envPercent: 70, ageRelated: ["चयापचय में बदलाव"], environmental: ["आहार और तनाव"] },
            worryColor: "orange"
          };
          if (isTamil) return {
            summary: ["ஹீமோகுளோபின் அளவு சற்று குறைவாக உள்ளது.", "இரத்த சர்க்கரை அளவு சாதாரணமாக இருப்பதை விட அதிகமாக உள்ளது."],
            worryLevel: "Moderate",
            findings: [{ term: "Anemia", explanation: "இரத்தத்தில் இரும்புச்சத்து குறைபாடு" }, { term: "Hyperglycemia", explanation: "இரத்தத்தில் அதிக சர்க்கரை அளவு" }],
            aiExplanation: "உங்கள் இரத்த அறிக்கையில் இரும்புச்சத்து குறைபாடு மற்றும் அதிக சர்க்கரை இருப்பதைக் காட்டுகிறது.",
            whatThisMeans: "உணவு முறை மாற்றம் மற்றும் மருத்துவ ஆலோசனை அவசியம்.",
            nextSteps: ["உணவு நிபுணரை சந்திக்கவும்", "சர்க்கரை அளவை கண்காணிக்கவும்"],
            possibleCauses: { agePercent: 30, envPercent: 70, ageRelated: ["வளர்சிதை மாற்ற மாற்றங்கள்"], environmental: ["உணவு மற்றும் மன அழுத்தம்"] },
            worryColor: "orange"
          };
          return {
            summary: ["Hemoglobin level is slightly low.", "Blood sugar is higher than normal."],
            worryLevel: "Moderate",
            findings: [{ term: "Anemia", explanation: "Iron deficiency in blood" }, { term: "Hyperglycemia", explanation: "High blood sugar level" }],
            aiExplanation: "Your blood report suggests iron deficiency and high sugar levels.",
            whatThisMeans: "You need dietary changes and medical advice.",
            nextSteps: ["Consult a nutritionist", "Monitor sugar levels"],
            possibleCauses: { agePercent: 30, envPercent: 70, ageRelated: ["Metabolic changes"], environmental: ["Diet and stress"] },
            worryColor: "orange"
          };
        }

        if (category === "brain") {
          if (isHindi) return {
            summary: ["मस्तिष्क के ऊतकों में हल्के सफेद धब्बे दिखाई देते हैं।", "उम्र के अनुसार हल्का संकुचन सामान्य है।"],
            worryLevel: "Mild",
            findings: [{ term: "White Matter Changes", explanation: "मस्तिष्क में रक्त प्रवाह में छोटे बदलाव" }, { term: "Atrophy", explanation: "मस्तिष्क का हल्का संकुचन" }],
            aiExplanation: "मस्तिष्क की एमआरआई रिपोर्ट में उम्र से संबंधित सामान्य बदलाव दिखाई देते हैं।",
            whatThisMeans: "ये निष्कर्ष अक्सर उम्र बढ़ने के साथ देखे जाते हैं।",
            nextSteps: ["न्यूरोलॉजिस्ट के साथ नियमित जांच", "मानसिक रूप से सक्रिय रहें"],
            possibleCauses: { agePercent: 80, envPercent: 20, ageRelated: ["सामान्य उम्र बढ़ना"], environmental: ["रक्तचाप"] },
            worryColor: "yellow"
          };
          if (isTamil) return {
            summary: ["மூளை திசுக்களில் சிறிய மாற்றங்கள் காணப்படுகின்றன.", "வயது தொடர்பான லேசான சுருக்கம் காணப்படுகிறது."],
            worryLevel: "Mild",
            findings: [{ term: "White Matter Changes", explanation: "மூளை இரத்த ஓட்டத்தில் சிறிய மாற்றங்கள்" }, { term: "Atrophy", explanation: "மூளையின் லேசான சுருக்கம்" }],
            aiExplanation: "மூளை எம்ஆர்ஐ அறிக்கை வயது தொடர்பான பொதுவான மாற்றங்களைக் காட்டுகிறது.",
            whatThisMeans: "இவை பொதுவாக வயது முதிர்வுடன் தொடர்புடையவை.",
            nextSteps: ["நரம்பியல் நிபுணருடன் ஆலோசனை", "மூளைக்கு வேலை தரும் பயிற்சிகள்"],
            possibleCauses: { agePercent: 80, envPercent: 20, ageRelated: ["இயற்கையான வயது முதிர்வு"], environmental: ["இரத்த அழுத்தம்"] },
            worryColor: "yellow"
          };
          return {
            summary: ["Small spots in brain tissue detected.", "Mild shrinkage consistent with age."],
            worryLevel: "Mild",
            findings: [{ term: "White Matter Changes", explanation: "Small changes in brain blood flow" }, { term: "Atrophy", explanation: "Mild brain shrinkage" }],
            aiExplanation: "The brain MRI suggests normal age-related changes.",
            whatThisMeans: "These findings are common as we grow older.",
            nextSteps: ["Consult a neurologist", "Stay mentally active"],
            possibleCauses: { agePercent: 80, envPercent: 20, ageRelated: ["Normal aging"], environmental: ["Blood pressure"] },
            worryColor: "yellow"
          };
        }

        // General fallback
        return {
          summary: ["General health analysis completed.", "No major issues detected."],
          worryLevel: "Low",
          findings: [{ term: "Normal Findings", explanation: "Everything looks within expected range" }],
          aiExplanation: "Your report appears normal for your profile.",
          whatThisMeans: "Continue your current healthy lifestyle.",
          nextSteps: ["Regular checkup", "Stay active"],
          possibleCauses: { agePercent: 50, envPercent: 50, ageRelated: ["Lifestyle"], environmental: ["Genetics"] },
          worryColor: "green"
        };
      };

      const baseData = getMockData();
      const mockData = {
        ...baseData,
        fullReport: {
          reportType: category.toUpperCase() + " REPORT",
          detailedFindings: [],
          clinicalInterpretation: [baseData.aiExplanation],
          avoidList: [],
          helpList: [],
          doctorQuestions: []
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

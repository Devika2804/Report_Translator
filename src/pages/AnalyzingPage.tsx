import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, FileSearch } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

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
  const [step, setStep] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2400);
    const t3 = setTimeout(() => setStep(3), 3600);
    const nav = setTimeout(() => navigate("/results"), 4000);

    const msgInt = setInterval(() => setMsgIdx((i) => (i + 1) % statusMessages.length), 1200);
    const progInt = setInterval(() => setProgress((p) => Math.min(p + 2.5, 100)), 100);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(nav);
      clearInterval(msgInt); clearInterval(progInt);
    };
  }, [navigate]);

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
          <p className="text-muted-foreground mb-6">Our AI is reading and simplifying your medical report…</p>

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
          <p className="text-xs text-muted-foreground">This usually takes just a few seconds.</p>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default AnalyzingPage;

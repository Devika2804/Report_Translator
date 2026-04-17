import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileSearch, Brain, Activity, ShieldCheck, MessageCircle } from "lucide-react";

const slides = [
  {
    icon: FileSearch,
    title: "1. Paste or Upload",
    caption: "Drop your medical report — text, PDF, image, voice, or scan.",
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    icon: Brain,
    title: "2. AI Reads It",
    caption: "Decodex analyzes findings and identifies medical terminology.",
    gradient: "from-cyan-400 to-emerald-400",
  },
  {
    icon: Activity,
    title: "3. Plain Language",
    caption: "Get a calm, simple explanation — no medical jargon.",
    gradient: "from-emerald-400 to-amber-400",
  },
  {
    icon: ShieldCheck,
    title: "4. Worry Level",
    caption: "Know at a glance how concerning your findings really are.",
    gradient: "from-amber-400 to-rose-400",
  },
  {
    icon: MessageCircle,
    title: "5. Ask Follow-ups",
    caption: "Voice or text — ask anything about your specific report.",
    gradient: "from-rose-400 to-violet-500",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export const WatchDemoModal = ({ open, onClose }: Props) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 2500);
    return () => clearInterval(t);
  }, [open]);

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[92%] max-w-2xl -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative rounded-3xl bg-white shadow-2xl overflow-hidden">
              <button
                onClick={onClose}
                aria-label="Close demo"
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Slide stage */}
              <div className="relative h-[360px] sm:h-[420px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex flex-col items-center justify-center p-10 text-white`}
                  >
                    <motion.div
                      initial={{ scale: 0.7, rotate: -8 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                      className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-6 shadow-2xl"
                    >
                      <Icon className="w-12 h-12 text-white" />
                    </motion.div>
                    <h3 className="text-3xl sm:text-4xl font-bold mb-3 text-center">{slide.title}</h3>
                    <p className="text-base sm:text-lg text-white/90 text-center max-w-md">{slide.caption}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer / dots */}
              <div className="bg-white p-5 flex items-center justify-between gap-4 border-t border-slate-100">
                <p className="text-sm text-slate-500 hidden sm:block">Auto-playing walkthrough · 5 steps</p>
                <div className="flex items-center gap-2 mx-auto sm:mx-0">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === index ? "w-8 bg-blue-600" : "w-2 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

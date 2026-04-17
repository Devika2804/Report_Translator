import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Sparkles, FileSearch, Brain, ShieldCheck, Globe, AlertTriangle,
  MessageCircle, Heart, Activity, FileText, Upload, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { AnimatedDarkBackground } from "@/components/AnimatedDarkBackground";
import { useReportStore } from "@/store/reportStore";
import { sampleReport } from "@/lib/sampleData";

const features = [
  { icon: FileSearch, title: "Smart Report Reading", desc: "Understands radiology, blood tests, MRIs, CT scans and more" },
  { icon: Brain, title: "AI Plain Language", desc: "Complex medical terms decoded into simple, calm explanations" },
  { icon: ShieldCheck, title: "Private & Secure", desc: "Your reports are never stored or shared. Ever." },
  { icon: Globe, title: "12+ Languages", desc: "Get explanations in your native language" },
  { icon: AlertTriangle, title: "Worry Level Indicator", desc: "Know at a glance how serious your findings are" },
  { icon: MessageCircle, title: "Ask Follow-up Questions", desc: "Voice and text Q&A about your specific report" },
];

const testimonials = [
  { name: "Priya S.", text: "Finally understood my MRI report without panic Googling!", role: "Patient" },
  { name: "Dr. Rajan", text: "I recommend this to every patient who wants clarity.", role: "Cardiologist" },
  { name: "Marcus W.", text: "Translated my dad's report to Spanish. Game changer.", role: "Caregiver" },
  { name: "Aisha K.", text: "The worry level helped me sleep at night.", role: "Patient" },
  { name: "Tom L.", text: "Beautiful, calm, and incredibly accurate.", role: "Patient" },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const setReportText = useReportStore((s) => s.setReportText);
  const [showOptions, setShowOptions] = useState(false);

  const useSample = () => {
    setReportText(sampleReport, true);
    setShowOptions(false);
    navigate("/language");
  };

  const uploadOwn = () => {
    setReportText("", false);
    setShowOptions(false);
    navigate("/auth");
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden text-white">
        <AnimatedDarkBackground />

        {/* Navbar */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 backdrop-blur-md bg-white/5 border-b border-white/10"
        >
          <div className="container flex items-center justify-between h-16">
            <Logo variant="light" />
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth")}
                className="text-white hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth")}
                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 shadow-[0_0_20px_rgba(37,99,235,0.5)] border-0"
              >
                Get Started
              </Button>
            </div>
          </div>
        </motion.nav>

        {/* Hero */}
        <section className="container relative pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-cyan-400/30 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span className="text-sm font-medium text-white">AI-Powered Medical Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]"
            >
              Understand Your <br />
              <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                Medical Reports
              </span>{" "}
              Instantly
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed"
            >
              Stop Googling symptoms in panic. Decodex reads your radiology, blood test, and lab reports — then explains everything in plain, calm language.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-6"
            >
              <Button
                size="lg"
                onClick={() => setShowOptions(true)}
                className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 h-14 px-12 text-base font-semibold shadow-[0_0_40px_rgba(6,182,212,0.6)] hover:shadow-[0_0_60px_rgba(6,182,212,0.8)] border-0 group transition-all"
              >
                Decode My Report
                <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-white/60 pt-2"
            >
              Trusted by 10,000+ patients · No medical jargon · 100% private
            </motion.p>

            {/* Floating mockup card */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative max-w-2xl mx-auto pt-12"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="rounded-3xl p-6 text-left bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_60px_rgba(6,182,212,0.25)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Chest X-Ray Report</p>
                      <p className="text-xs text-white/60">Analyzed in 4.2s</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-300/30">
                    🟡 Mild
                  </span>
                </div>
                <div className="space-y-2 text-sm text-white/85">
                  {["Heart slightly enlarged but stable", "Early lung fluid signs detected", "Bones completely normal"].map((t, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Heart className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="container py-20 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                understand
              </span>
            </h2>
            <p className="text-lg text-white/60">Built for patients, loved by doctors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl p-6 bg-white/5 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 hover:bg-white/10 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{f.title}</h3>
                <p className="text-white/60">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials marquee */}
        <section className="py-16 overflow-hidden relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white">
              Loved by{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                thousands
              </span>
            </h2>
          </div>
          <div className="marquee">
            <div className="marquee-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 w-80 flex-shrink-0 bg-white/5 backdrop-blur-md border border-white/10"
                >
                  <p className="text-sm mb-3 text-white/85">"{t.text}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/50">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container py-12 border-t border-white/10 mt-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo variant="light" />
            <p className="text-sm text-white/50 text-center">
              © 2025 Decodex · Not a substitute for medical advice
            </p>
          </div>
        </footer>

        {/* CTA Options Modal */}
        <AnimatePresence>
          {showOptions && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowOptions(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-md rounded-3xl p-6 bg-[#0B1A2F] border border-cyan-400/30 shadow-[0_0_60px_rgba(6,182,212,0.4)]"
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">How would you like to start?</h3>
                    <p className="text-sm text-white/60 mt-0.5">Choose an option to begin decoding.</p>
                  </div>
                  <button
                    onClick={() => setShowOptions(false)}
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={useSample}
                    className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 transition-all group flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">📄 Use Sample Report</p>
                      <p className="text-sm text-white/60">Try Decodex instantly with a demo X-ray</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={uploadOwn}
                    className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 transition-all group flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">⬆ Upload Your Report</p>
                      <p className="text-sm text-white/60">Sign in and analyze your own report</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default LandingPage;

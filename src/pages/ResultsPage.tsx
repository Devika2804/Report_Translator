import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatSupabaseFunctionError } from "@/lib/formatSupabaseFunctionError";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Download, Share2, Clipboard, Lightbulb, ChevronDown, History, FileText,
  Calendar, Mail, Phone, MessageSquare, Headphones, ShieldCheck, Mic, MessageCircle, X, Send,
  Plus, Bot, Info, Volume2, Square, AlertCircle, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";

import { recentReports } from "@/lib/sampleData";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { generateReportPDF } from "@/lib/generatePDF";
import { useReportStore } from "@/store/reportStore";
import { syncLanguageFromSessionStorage } from "@/lib/hydrateLanguageFromSession";
import {
  extractAnalysisPayload,
  isDecodexApiAnalysis,
  mapDecodexApiToAnalysisResult,
} from "@/lib/mapDecodexAnalysisResponse";


type ResultTab = "explain" | "findings" | "means" | "next";
const resultTabs: { id: ResultTab; label: string }[] = [
  { id: "explain", label: "AI Explanation" },
  { id: "findings", label: "Findings" },
  { id: "means", label: "What This Means" },
  { id: "next", label: "Next Steps" },
];

const faqs = [
  { q: "Is my report data private?", a: "Yes. Reports are processed in-memory and never stored on our servers." },
  { q: "Which file formats are supported?", a: "PDF, TXT, JPG, and PNG up to 10MB. You can also paste text or use voice." },
  { q: "How accurate is the AI analysis?", a: "Our AI is highly accurate but is not a substitute for professional medical opinion." },
  { q: "Can I use this for any report type?", a: "Yes — radiology, blood tests, MRIs, CT scans, lab reports, and more." },
];

const promptChips = ["What does this mean?", "Should I be worried?", "What next?"];

const ResultsPage = () => {
  const navigate = useNavigate();
  const { analysisResult, reportText, selectedLanguage } = useReportStore();
  const setAnalysisResult = useReportStore((s) => s.setAnalysisResult);
  const setReportText = useReportStore((s) => s.setReportText);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!analysisResult) {
      const stored = localStorage.getItem("decodex_analysis");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setAnalysisResult(parsed);
        } catch (e) {
          navigate("/input");
        }
      } else {
        navigate("/input");
      }
    }
    setHydrated(true);
  }, [analysisResult, navigate, setAnalysisResult]);

  const [tab, setTab] = useState<ResultTab>("explain");
  const [showAsk, setShowAsk] = useState(false);
  const [askTab, setAskTab] = useState<"voice" | "type">("voice");
  const [askInput, setAskInput] = useState("");
  const [askResponse, setAskResponse] = useState("");
  const [typedResponse, setTypedResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pulseFab, setPulseFab] = useState(true);
  const [readingSummary, setReadingSummary] = useState(false);
  const [analyzedToastShown, setAnalyzedToastShown] = useState(false);
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(false);

  const lang = "en-US"; // Default for TTS if not matched
  const speech = useSpeechRecognition({ lang, interimResults: true });
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync speech transcript into ask input
  useEffect(() => {
    if (speech.transcript) setAskInput(speech.transcript);
  }, [speech.transcript]);

  useEffect(() => {
    const t = setTimeout(() => setPulseFab(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Welcome toast
  useEffect(() => {
    if (!analyzedToastShown) {
      setAnalyzedToastShown(true);
      setTimeout(() => toast.success("Report analyzed successfully!"), 400);
    }
  }, [analyzedToastShown]);

  // UI-only WhatsApp delivery confirmation popup — triggers after user downloads PDF
  const downloadSectionRef = useRef<HTMLDivElement | null>(null);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  /** Windows/Chrome often tag Hindi as hi-IN or name voices "Microsoft Hemant - Hindi (India)". */
  const pickVoiceForLocale = (
    voices: SpeechSynthesisVoice[],
    wantCode: string,
    displayName: string
  ): SpeechSynthesisVoice | undefined => {
    const norm = (l: string) => l.toLowerCase().replace(/_/g, "-");
    const want = norm(wantCode);
    const prefix = want.split("-")[0] || "en";

    const nameHints: Record<string, RegExp[]> = {
      hi: [/hindi/i, /hemant/i, /kartik/i, /devanagari/i, /hi[\s_-]?in/i],
      ta: [/tamil/i, /ta[\s_-]?in/i],
      te: [/telugu/i],
      ml: [/malayalam/i],
      mr: [/marathi/i],
      kn: [/kannada/i],
      bn: [/bengali/i, /bangla/i],
      gu: [/gujarati/i],
      pa: [/punjabi/i],
    };
    const hints = nameHints[prefix] || [];

    let v = voices.find((x) => norm(x.lang) === want);
    if (v) return v;
    v = voices.find((x) => norm(x.lang).startsWith(`${prefix}-`));
    if (v) return v;
    for (const re of hints) {
      v = voices.find((x) => re.test(x.name));
      if (v) return v;
    }
    if (displayName.length > 2) {
      const short = displayName.slice(0, 4);
      v = voices.find((x) => x.name.toLowerCase().includes(short.toLowerCase()));
      if (v) return v;
    }
    return voices.find((x) => norm(x.lang).startsWith(prefix));
  };

  const waitForSpeechVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve([]);
        return;
      }
      const pick = () => window.speechSynthesis.getVoices();
      const first = pick();
      if (first.length > 0) {
        resolve(first);
        return;
      }
      const onVoices = () => {
        const v = pick();
        if (v.length > 0) {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
          resolve(v);
        }
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
      window.setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        resolve(pick());
      }, 2800);
    });
  };

  const speakText = async (text: string, onEnd?: () => void): Promise<boolean> => {
    if (!window.speechSynthesis) {
      toast.error("Text-to-speech not supported in this browser");
      return false;
    }
    window.speechSynthesis.cancel();
    const voices = await waitForSpeechVoices();
    const utt = new SpeechSynthesisUtterance(text);

    const norm = (l: string) => l.toLowerCase().replace(/_/g, "-");
    const langPrefix = norm(lang).split("-")[0] || "en";

    const matched = pickVoiceForLocale(voices, "en-US", selectedLanguage);

    if (matched) {
      utt.voice = matched;
      utt.lang = matched.lang;
    } else {
      utt.lang = lang;
      if (selectedLanguage !== "English") {
        toast(
          `No ${selectedLanguage} text-to-speech voice matched. In Windows: Settings → Time & language → Speech → add your language.`,
          { icon: "🔊", duration: 8000 }
        );
      }
    }

    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onend = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utt);
    return true;
  };

  const handleReadSummary = () => {
    if (readingSummary) {
      window.speechSynthesis?.cancel();
      setReadingSummary(false);
      return;
    }
    const bullets = analysisResult?.summary || [];
    const text = bullets.join(". ");
    void (async () => {
      const ok = await speakText(text, () => setReadingSummary(false));
      if (ok) setReadingSummary(true);
    })();
  };

  const [readingFull, setReadingFull] = useState(false);
  const handleReadFull = () => {
    if (readingFull) {
      window.speechSynthesis?.cancel();
      setReadingFull(false);
      return;
    }
    const text = analysisResult?.fullReportText || analysisResult?.aiExplanation || "";
    void (async () => {
      const ok = await speakText(text, () => setReadingFull(false));
      if (ok) setReadingFull(true);
    })();
  };

  // Typing-effect for AI response
  const animateResponse = (full: string) => {
    setTypedResponse("");
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    let i = 0;
    typingTimerRef.current = setInterval(() => {
      i += 2;
      setTypedResponse(full.slice(0, i));
      if (i >= full.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      }
    }, 18);
  };

  const submitAsk = async () => {
    if (!askInput.trim() || !analysisResult) return;
    const question = askInput.trim();
    setIsThinking(true);
    setAskResponse("");
    setTypedResponse("");
    
    try {
      console.log("Sending question to Edge Function with report context...");
      
      const { data, error } = await supabase.functions.invoke("ask-doubt", {
        body: {
          question,
          reportText,
          summary: analysisResult.summary,
          language: selectedLanguage,
        },
      });

      if (error) throw error;

      const answer = data.answer || "I couldn't generate a response. Please try again.";
      
      setAskResponse(answer);
      setIsThinking(false);
      animateResponse(answer);
    } catch (e: any) {
      console.error("ask-doubt error", e);
      setIsThinking(false);
      const errorMsg = "I'm having trouble connecting right now. Please try again.";
      setAskResponse(errorMsg);
      animateResponse(errorMsg);
    }
  };

  const handleAskMicToggle = () => {
    if (speech.isListening) {
      speech.stop();
    } else {
      setAskInput("");
      speech.reset();
      speech.start();
      toast("Listening... speak now", { icon: "🎙️" });
    }
  };

  useEffect(() => {
    if (analysisResult) {
      // Logic for post-analysis could go here
    }
  }, [analysisResult]);

  const handleDownload = () => {
    if (!analysisResult) return;
    try {
      generateReportPDF({
        language: selectedLanguage,
        summaryBullets: analysisResult.summary,
        explanation: analysisResult.aiExplanation,
        findings: analysisResult.findings.map((f) => ({
          term: f.medicalTerm,
          plain: f.plainExplanation,
        })),
        worryLevel: analysisResult.worryLevel,
        agePercent: analysisResult.ageRelatedPercent,
        envPercent: analysisResult.environmentalPercent,
        ageBullets: analysisResult.ageRelatedFactors,
        envBullets: analysisResult.environmentalFactors,
        fullReport: analysisResult.fullReportText,
        nextSteps: analysisResult.nextSteps,
      });
      toast.success("Report downloaded successfully!");
      setShowDeliveryPopup(true);
    } catch (e) {
      console.error(e);
      toast.error("Could not generate PDF. Please try again.");
    }
  };

  if (!hydrated || !analysisResult) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Loading analysis…</p>
        </div>
      </PageTransition>
    );
  }

  const worryStyle: Record<string, { bg: string; text: string; emoji: string; border: string; dot: string }> = {
    Low:      { bg: "bg-success-light",     text: "text-success",     emoji: "🟢", border: "border-success/30",     dot: "bg-success" },
    Mild:     { bg: "bg-warning-light",     text: "text-warning",     emoji: "🟡", border: "border-warning/30",     dot: "bg-warning" },
    Moderate: { bg: "bg-orange-100",        text: "text-orange-700",  emoji: "🟠", border: "border-orange-300",     dot: "bg-orange-500" },
    High:     { bg: "bg-destructive/10",    text: "text-destructive", emoji: "🔴", border: "border-destructive/30", dot: "bg-destructive" },
  };
  const worryColorToLevel: Record<string, keyof typeof worryStyle> = {
    green: "Low",
    yellow: "Mild",
    orange: "Moderate",
    red: "High",
  };
  const levelFromColor = analysisResult.worryColor
    ? worryColorToLevel[analysisResult.worryColor]
    : undefined;
  const wl =
    (levelFromColor && worryStyle[levelFromColor]) ||
    worryStyle[analysisResult.worryLevel] ||
    worryStyle.Mild;
  const agePct = Math.max(0, Math.min(100, analysisResult.ageRelatedPercent || 0));
  const envPct = Math.max(0, Math.min(100, analysisResult.environmentalPercent || 0));
  const dominantCause = agePct >= envPct ? "Age-Related" : "Environmental";

  return (
    <PageTransition>
      <div className="min-h-screen bg-surface">
        {/* Navbar — Download removed */}
        <nav className="sticky top-0 z-40 glass border-b border-white/30">
          <div className="container flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/input")} className="rounded-full bg-gradient-primary hover:opacity-90 shadow-soft hidden sm:flex">
                <Plus className="w-4 h-4 mr-1" /> New Report
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  const text = analysisResult?.aiExplanation || "";
                  if (navigator.share) {
                    navigator.share({ title: "Decodex Report", text }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(text);
                    toast.success("Report summary copied to clipboard");
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">JD</div>
            </div>
          </div>
        </nav>

        {/* Success Banner with Listen to Summary */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-light border-b border-success/20"
        >
          <div className="container py-3 flex items-center justify-center gap-3 flex-wrap">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </motion.div>
            <span className="text-sm font-medium text-success">Analysis Complete · Your report has been simplified</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReadSummary}
              className="rounded-full h-8 border-success/40 text-success hover:bg-success/10"
            >
              {readingSummary ? (
                <>
                  <div className="flex items-end gap-0.5 h-3 mr-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-success rounded-full"
                        style={{
                          height: "100%",
                          animation: `wave-bar 0.7s ease-in-out ${i * 0.15}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 mr-1.5" /> Listen to Summary
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <div className="container py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* MAIN */}
          <div className="space-y-6">
            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary-light border-l-4 border-primary rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clipboard className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Report Summary</h2>
              </div>
              <ul className="space-y-2">
                {analysisResult.summary.map((b, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{b}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Main Results with tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl shadow-card-soft p-6"
            >
              <div className="relative flex bg-muted rounded-xl p-1 mb-5 overflow-x-auto">
                {resultTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="relative flex-1 min-w-fit py-2 px-3 text-sm font-medium z-10 whitespace-nowrap"
                  >
                    {tab === t.id && (
                      <motion.div layoutId="result-tab" className="absolute inset-0 bg-card rounded-lg shadow-soft" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    )}
                    <span className={`relative ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>{t.label}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[180px]">
                  {tab === "explain" && <p className="text-base leading-relaxed">{analysisResult.aiExplanation}</p>}

                  {tab === "findings" && (
                    <div className="space-y-3">
                      {analysisResult.findings.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-muted/40">
                          <span className="px-3 py-1 rounded-lg bg-card text-sm font-mono text-muted-foreground border border-border w-fit">{f.medicalTerm}</span>
                          <span className="text-muted-foreground hidden sm:inline">→</span>
                          <span className="text-sm flex-1">{f.plainExplanation}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {tab === "means" && (
                    <p className="text-base leading-relaxed">{analysisResult.whatThisMeans}</p>
                  )}

                  {tab === "next" && (
                    <ol className="space-y-3">
                      {analysisResult.nextSteps.map((s, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="w-7 h-7 rounded-full bg-gradient-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-sm pt-1">{s}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Worry Level */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl shadow-card-soft p-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold">Worry Level</h3>
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">AI estimate only</span>
              </div>
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
                className={`h-12 rounded-full ${wl.bg} border ${wl.border} flex items-center px-5`}
              >
                <div className={`w-3 h-3 rounded-full ${wl.dot} mr-3 animate-pulse`} />
                <span className={`font-semibold ${wl.text}`}>{wl.emoji} {analysisResult.worryLevel}</span>
                <span className="ml-3 text-sm text-foreground/70">— {analysisResult.worryReason}</span>
              </motion.div>
            </motion.div>

            {/* Cause Insights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl shadow-card-soft p-6 space-y-4">
              <h3 className="font-bold">Cause Insights</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl p-5" style={{ background: "hsl(270 70% 96%)" }}>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: "hsl(270 70% 90%)", color: "hsl(270 70% 35%)" }}>
                    🧬 Age-Related Factors
                  </span>
                  <ul className="text-sm space-y-1.5 text-foreground/80">
                    {analysisResult.ageRelatedFactors.map((b) => <li key={b}>• {b}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-success-light">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-success/20 text-success">
                    🌿 Environmental Factors
                  </span>
                  <ul className="text-sm space-y-1.5 text-foreground/80">
                    {analysisResult.environmentalFactors.map((b) => <li key={b}>• {b}</li>)}
                  </ul>
                </div>
              </div>

              <div className="bg-primary-light rounded-xl p-4 flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Most findings appear to be <strong>{dominantCause}</strong>. Understanding causes helps you take preventive steps.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Cause Breakdown</span>
                  <span>Age {agePct}% · Environment {envPct}%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex bg-muted">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${agePct}%` }} transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }} style={{ background: "hsl(270 70% 60%)" }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${envPct}%` }} transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }} className="bg-success" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">AI estimate for awareness only</p>
              </div>
            </motion.div>

            {/* Detailed Findings Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-2xl shadow-card-soft p-6 overflow-hidden">
              <h3 className="font-bold mb-4">Detailed Clinical Findings</h3>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Finding</th>
                      <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medical Term</th>
                      <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</th>
                      <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {analysisResult.detailedFindings.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-2 text-sm font-medium">{row.finding}</td>
                        <td className="py-4 px-2 text-xs font-mono text-muted-foreground">{row.medicalTerm}</td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.severity === 'Normal' ? 'bg-success/10 text-success' :
                            row.severity === 'Mild' ? 'bg-warning/10 text-warning' :
                            row.severity === 'Moderate' ? 'bg-orange-100 text-orange-700' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {row.severity}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-xs text-muted-foreground">{row.actionRequired}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Clinical Interpretation */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="bg-card rounded-2xl shadow-card-soft p-6">
              <h3 className="font-bold mb-4">Clinical Interpretation</h3>
              <div className="space-y-4">
                {analysisResult.clinicalInterpretation.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground/80">{para}</p>
                ))}
              </div>
            </motion.div>

            {/* Medications and Lifestyle */}
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl shadow-card-soft p-6">
                <h4 className="text-sm font-bold text-destructive mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> To Avoid
                </h4>
                <ul className="space-y-2">
                  {analysisResult.medicationsToAvoid.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="bg-card rounded-2xl shadow-card-soft p-6">
                <h4 className="text-sm font-bold text-success mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Helpful Steps
                </h4>
                <ul className="space-y-2">
                  {analysisResult.lifestyleHelps.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Questions for Doctor */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-primary-light rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Questions to ask your Doctor
              </h3>
              <div className="space-y-3">
                {analysisResult.doctorQuestions.map((q, i) => (
                  <div key={i} className="flex gap-3 bg-white/60 p-3 rounded-xl text-sm italic">
                    <span className="text-primary font-bold">Q:</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Download Action — bottom of main content */}
            <motion.div
              id="download-section"
              ref={downloadSectionRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-white shadow-glow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Take your report with you</h3>
                  <p className="text-sm text-white/80">Download a polished PDF for your records or to share with your physician.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <Button
                    onClick={handleDownload}
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 rounded-full font-semibold shadow-md"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Recent Reports */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl shadow-card-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Recent Reports</h3>
              </div>
              <div className="space-y-2">
                {recentReports.map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="rounded-xl border border-border p-3 hover:shadow-soft transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{r.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                        r.color === "success" ? "bg-success-light text-success" :
                        r.color === "warning" ? "bg-warning-light text-warning" :
                        "bg-destructive/10 text-destructive"
                      }`}>{r.level}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" /> {r.date}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.snippet}</p>
                  </motion.div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3 text-primary text-sm">View All Reports →</Button>
            </motion.div>

            {/* Support */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl shadow-card-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <Headphones className="w-5 h-5 text-primary" />
                <h3 className="font-bold">Need Help?</h3>
              </div>
              <div className="space-y-2 text-sm">
                <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"><Mail className="w-4 h-4 text-primary" /> support@decodex.ai</a>
                <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"><MessageSquare className="w-4 h-4 text-success" /> WhatsApp Us</a>
                <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"><Phone className="w-4 h-4 text-accent" /> +1 (555) 123-4567</a>
              </div>
            </motion.div>

            {/* FAQ */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl shadow-card-soft p-5">
              <h3 className="font-bold mb-3">FAQ</h3>
              <div className="space-y-1">
                {faqs.map((f, i) => (
                  <div key={i} className="border-b border-border last:border-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between py-3 text-left text-sm font-medium"
                    >
                      <span>{f.q}</span>
                      <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-muted-foreground pb-3">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trust Footer */}
            <div className="flex gap-2 items-start text-xs text-muted-foreground p-4">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>For informational purposes only. Not a substitute for professional medical advice.</span>
            </div>
          </aside>
        </div>

        {/* Ask a Doubt FAB */}
        <motion.button
          onClick={() => setShowAsk(true)}
          animate={pulseFab ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 1, repeat: pulseFab ? 3 : 0 }}
          className="fixed bottom-6 right-6 z-40 bg-gradient-primary text-white rounded-full px-5 h-14 flex items-center gap-2 shadow-glow hover:opacity-90 font-medium"
        >
          <Mic className="w-5 h-5" />
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Ask a Doubt</span>
        </motion.button>

        {/* Ask Modal */}
        <AnimatePresence>
          {showAsk && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowAsk(false);
                  speech.stop();
                }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-10 md:max-w-lg z-50 bg-card rounded-t-3xl md:rounded-3xl shadow-glow p-6 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Ask About Your Report</h3>
                  <button
                    onClick={() => {
                      setShowAsk(false);
                      speech.stop();
                    }}
                    className="p-1 hover:bg-muted rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="relative flex bg-muted rounded-xl p-1 mb-4">
                  {(["voice", "type"] as const).map((t) => (
                    <button key={t} onClick={() => setAskTab(t)} className="relative flex-1 py-2 text-sm font-medium z-10 capitalize">
                      {askTab === t && <motion.div layoutId="ask-tab" className="absolute inset-0 bg-card rounded-lg shadow-soft" />}
                      <span className={`relative ${askTab === t ? "text-primary" : "text-muted-foreground"}`}>{t}</span>
                    </button>
                  ))}
                </div>

                {askTab === "voice" && (
                  <div className="text-center py-2">
                    {!speech.isSupported && (
                      <div className="mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs text-left">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Voice input requires Chrome or Edge. Use the Type tab instead.</span>
                      </div>
                    )}
                    <div className="relative inline-block">
                      {speech.isListening && <div className="absolute inset-0 listen-ring rounded-full" />}
                      <button
                        onClick={handleAskMicToggle}
                        disabled={!speech.isSupported}
                        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-glow disabled:opacity-50 disabled:cursor-not-allowed ${
                          speech.isListening
                            ? "bg-gradient-to-br from-red-500 to-rose-600"
                            : "bg-gradient-primary"
                        }`}
                      >
                        {speech.isListening ? (
                          <div className="flex gap-1 items-end h-7">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-white rounded-full"
                                style={{
                                  height: "100%",
                                  animation: `wave-bar 0.7s ease-in-out ${i * 0.1}s infinite`,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Mic className="w-8 h-8 text-white" />
                        )}
                      </button>
                    </div>
                    <p className="mt-3 text-sm font-medium">
                      {speech.isListening ? "Listening... speak now" : "Tap mic to start"}
                    </p>
                    {speech.isListening && (
                      <Button onClick={() => speech.stop()} variant="outline" size="sm" className="mt-2 rounded-full">
                        <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                      </Button>
                    )}
                    {speech.error && (
                      <p className="mt-2 text-xs text-destructive">{speech.error}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap my-3">
                  {(() => {
                    const lowerLang = selectedLanguage.toLowerCase();
                    if (lowerLang.includes("hindi")) {
                      return ["इसका क्या मतलब है?", "क्या मुझे चिंतित होना चाहिए?", "आगे क्या?"];
                    } else if (lowerLang.includes("tamil")) {
                      return ["இதன் பொருள் என்ன?", "நான் கவலைப்பட வேண்டுமா?", "அடுத்து என்ன?"];
                    } else {
                      return ["What does this mean?", "Should I be worried?", "What next?"];
                    }
                  })().map((c) => (
                    <button
                      key={c}
                      onClick={() => setAskInput(c)}
                      className="px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitAsk()}
                    placeholder={askTab === "voice" ? "Your speech appears here..." : "Type your question..."}
                    className="flex-1 h-11 px-4 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <Button
                    onClick={submitAsk}
                    disabled={!askInput.trim() || isThinking}
                    className="h-11 rounded-xl bg-gradient-primary hover:opacity-90 px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {askTab === "voice" && (
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    Speak clearly — your speech is converted to text before analysis.
                  </p>
                )}

                <AnimatePresence>
                  {(isThinking || askResponse) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-primary-light rounded-2xl p-4 flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isThinking ? (
                          <div className="flex gap-1 items-center h-5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                className="w-1.5 h-1.5 rounded-full bg-primary"
                              />
                            ))}
                          </div>
                        ) : (
                          <>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {typedResponse}
                              {typedResponse.length < askResponse.length && (
                                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
                              )}
                            </p>
                            {typedResponse.length >= askResponse.length && (
                              <button
                                onClick={() => {
                                  setAskResponse("");
                                  setTypedResponse("");
                                  setAskInput("");
                                }}
                                className="text-xs text-primary mt-2 font-medium hover:underline"
                              >
                                Ask another question →
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* WhatsApp Delivery Popup (auto-shown on load) */}
        <AnimatePresence>
          {showDeliveryPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setShowDeliveryPopup(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="glass bg-card/95 rounded-3xl p-8 max-w-sm w-full shadow-glow text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/15 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-success" strokeWidth={2.5} />
                </motion.div>
                <h2 className="text-xl font-bold mb-2">Report Sent Successfully</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  📱 Your report has been sent to your WhatsApp.
                </p>
                <Button
                  onClick={() => setShowDeliveryPopup(false)}
                  className="w-full h-11 rounded-xl bg-gradient-primary hover:opacity-90 font-semibold"
                >
                  OK
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ResultsPage;

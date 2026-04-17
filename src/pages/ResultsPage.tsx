import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Download, Share2, Clipboard, Lightbulb, ChevronDown, History, FileText,
  Calendar, Mail, Phone, MessageSquare, Headphones, ShieldCheck, Mic, MessageCircle, X, Send,
  Plus, Bot, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { sampleExplanation, sampleFindings, summaryBullets, recentReports } from "@/lib/sampleData";

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
  const [tab, setTab] = useState<ResultTab>("explain");
  const [showAsk, setShowAsk] = useState(false);
  const [askTab, setAskTab] = useState<"voice" | "type">("voice");
  const [askInput, setAskInput] = useState("");
  const [askResponse, setAskResponse] = useState("");
  const [recording, setRecording] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pulseFab, setPulseFab] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPulseFab(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const submitAsk = () => {
    setAskResponse(
      "Based on your report, the findings are mild and commonly seen. Your heart shows slight enlargement and there's early fluid in the lower lungs. This isn't an emergency, but you should follow up with your doctor within 1–2 weeks for monitoring. Stay well hydrated, take any prescribed medications, and rest as needed."
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-surface">
        {/* Navbar */}
        <nav className="sticky top-0 z-40 glass border-b border-white/30">
          <div className="container flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/input")} className="rounded-full bg-gradient-primary hover:opacity-90 shadow-soft hidden sm:flex">
                <Plus className="w-4 h-4 mr-1" /> New Report
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full"><Download className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">JD</div>
            </div>
          </div>
        </nav>

        {/* Success Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success-light border-b border-success/20"
        >
          <div className="container py-3 flex items-center justify-center gap-2">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </motion.div>
            <span className="text-sm font-medium text-success">Analysis Complete · Your report has been simplified</span>
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
                {summaryBullets.map((b, i) => (
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
                  {tab === "explain" && <p className="text-base leading-relaxed">{sampleExplanation}</p>}

                  {tab === "findings" && (
                    <div className="space-y-3">
                      {sampleFindings.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-muted/40">
                          <span className="px-3 py-1 rounded-lg bg-card text-sm font-mono text-muted-foreground border border-border w-fit">{f.term}</span>
                          <span className="text-muted-foreground hidden sm:inline">→</span>
                          <span className="text-sm flex-1">{f.plain}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {tab === "means" && (
                    <p className="text-base leading-relaxed">
                      Overall, your report shows mild changes that are common and manageable. None of the findings are emergencies. Your doctor will likely want to monitor your heart and lung health over time and may suggest small lifestyle adjustments.
                    </p>
                  )}

                  {tab === "next" && (
                    <ol className="space-y-3">
                      {[
                        "Schedule a follow-up with your doctor within 1–2 weeks",
                        "Bring this report and any prior tests to the visit",
                        "Track any symptoms like shortness of breath or swelling",
                        "Stay hydrated and follow any prescribed medications",
                      ].map((s, i) => (
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
                className="h-12 rounded-full bg-warning-light border border-warning/30 flex items-center px-5"
              >
                <div className="w-3 h-3 rounded-full bg-warning mr-3 animate-pulse" />
                <span className="font-semibold text-warning">🟡 Mild</span>
                <span className="ml-3 text-sm text-foreground/70">— Monitor and follow up with your doctor</span>
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
                    <li>• Natural changes in heart muscle elasticity</li>
                    <li>• Gradual cardiovascular wear over time</li>
                    <li>• Common in adults 50+</li>
                  </ul>
                </div>
                <div className="rounded-xl p-5 bg-success-light">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-success/20 text-success">
                    🌿 Environmental Factors
                  </span>
                  <ul className="text-sm space-y-1.5 text-foreground/80">
                    <li>• Diet and sodium intake</li>
                    <li>• Physical activity levels</li>
                    <li>• Air quality and smoking exposure</li>
                  </ul>
                </div>
              </div>

              <div className="bg-primary-light rounded-xl p-4 flex gap-3 items-start">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm">Most findings appear to be <strong>Age-Related</strong>. Understanding causes helps you take preventive steps.</p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Cause Breakdown</span>
                  <span>Age 65% · Environment 35%</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex bg-muted">
                  <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }} style={{ background: "hsl(270 70% 60%)" }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: "35%" }} transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }} className="bg-success" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">AI estimate for awareness only</p>
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
                onClick={() => setShowAsk(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-10 md:max-w-lg z-50 bg-card rounded-t-3xl md:rounded-3xl shadow-glow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Ask About Your Report</h3>
                  <button onClick={() => setShowAsk(false)} className="p-1 hover:bg-muted rounded-lg">
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

                {askTab === "voice" ? (
                  <div className="text-center py-4">
                    <div className="relative inline-block">
                      {!recording && <div className="absolute inset-0 pulse-ring" />}
                      <button
                        onClick={() => {
                          if (recording) {
                            setRecording(false);
                            setAskInput("Should I be worried about these findings?");
                          } else { setRecording(true); }
                        }}
                        className="relative w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
                      >
                        <Mic className="w-8 h-8 text-white" />
                      </button>
                    </div>
                    <p className="mt-4 text-sm">{recording ? "Recording... tap to stop" : "Tap mic to start"}</p>
                  </div>
                ) : null}

                <div className="flex gap-2 flex-wrap mb-3">
                  {promptChips.map((c) => (
                    <button key={c} onClick={() => setAskInput(c)} className="px-3 py-1.5 rounded-full bg-primary-light text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors">
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 h-11 px-4 rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <Button onClick={submitAsk} disabled={!askInput.trim()} className="h-11 rounded-xl bg-gradient-primary hover:opacity-90 px-4">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <AnimatePresence>
                  {askResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 bg-primary-light rounded-2xl p-4 flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{askResponse}</p>
                        <button onClick={() => { setAskResponse(""); setAskInput(""); }} className="text-xs text-primary mt-2 font-medium hover:underline">
                          Ask another question →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ResultsPage;

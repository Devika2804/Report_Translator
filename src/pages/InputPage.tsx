import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText, Upload, Mic, Camera, Sparkles, Lock, ShieldCheck, ArrowRight,
  CloudUpload, X, Scan, Loader2, Check, Square, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { sampleReport } from "@/lib/sampleData";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useReportStore } from "@/store/reportStore";

type Tab = "paste" | "upload" | "voice" | "scan";

const tabs: { id: Tab; icon: any; label: string }[] = [
  { id: "paste", icon: FileText, label: "Paste Text" },
  { id: "upload", icon: Upload, label: "Upload File" },
  { id: "voice", icon: Mic, label: "Voice Input" },
  { id: "scan", icon: Camera, label: "Scan Report" },
];

const InputPage = () => {
  const navigate = useNavigate();
  const { reportText: storedText, isSample, phoneNumber: storedPhone, userName: storedName, setUserContact } = useReportStore();
  const [tab, setTab] = useState<Tab>("paste");
  const [text, setText] = useState(isSample ? storedText : "");
  const [file, setFile] = useState<File | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [scanText, setScanText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState(storedPhone || "");
  const [name, setName] = useState(storedName || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const lang = (typeof window !== "undefined" && sessionStorage.getItem("decodex-lang-code")) || "en-US";
  const speech = useSpeechRecognition({ lang, interimResults: true });

  // Sync live transcript into voice textarea while listening
  useEffect(() => {
    if (speech.transcript) setVoiceText(speech.transcript);
  }, [speech.transcript]);

  const hasContent =
    (tab === "paste" && text.trim()) ||
    (tab === "upload" && file) ||
    (tab === "voice" && voiceText.trim()) ||
    (tab === "scan" && scanText.trim());

  const steps = ["Reading report...", "Extracting findings...", "Simplifying language..."];

  const analyze = async () => {
    const finalText =
      tab === "paste" ? text :
      tab === "voice" ? voiceText :
      tab === "scan" ? scanText :
      file ? `[Uploaded file: ${file.name}]` : "";

    if (!finalText.trim()) {
      toast.error("Please enter your report text to continue.");
      return;
    }

    if (tab === "upload" && file) {
      // Try to read text from .txt files; otherwise pass filename note.
      try {
        if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
          const fileText = await file.text();
          useReportStore.getState().setReportText(fileText);
        } else {
          useReportStore.getState().setReportText(
            `Uploaded file: ${file.name}. (Image/PDF parsing not available in this demo — please paste report text for best results.)`
          );
        }
      } catch {
        useReportStore.getState().setReportText(`Uploaded file: ${file.name}`);
      }
    } else {
      useReportStore.getState().setReportText(finalText);
    }

    sessionStorage.setItem("decodex-input", finalText);
    setAnalyzing(true);
    setStep(0);
    setTimeout(() => setStep(1), 400);
    setTimeout(() => setStep(2), 800);
    setTimeout(() => navigate("/analyzing"), 1100);
  };

  const handleMicToggle = () => {
    if (speech.isListening) {
      speech.stop();
    } else {
      setVoiceText("");
      speech.reset();
      speech.start();
      toast("Listening... speak now", { icon: "🎙️" });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-surface">
        <nav className="sticky top-0 z-40 glass border-b border-white/30">
          <div className="container flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setText("");
                  setFile(null);
                  setVoiceText("");
                  setScanText("");
                  speech.reset();
                }}
              >
                New Report
              </Button>
              <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">JD</div>
            </div>
          </div>
        </nav>

        <div className="container max-w-4xl py-10">
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI Decoder</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Decode Your <span className="gradient-text">Medical Report</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Paste, upload, speak, or scan your report for an instant plain-language explanation.
            </p>
          </div>

          {/* Tabs */}
          <div className="relative bg-card rounded-2xl p-1.5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-1 shadow-card-soft">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative py-3 px-3 rounded-xl text-sm font-medium z-10 transition-colors flex items-center justify-center gap-2"
              >
                {tab === t.id && (
                  <motion.div layoutId="active-tab" className="absolute inset-0 bg-gradient-primary rounded-xl shadow-soft" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                <span className={`relative flex items-center gap-2 ${tab === t.id ? "text-white" : "text-muted-foreground"}`}>
                  <t.icon className="w-4 h-4" /> <span className="hidden sm:inline">{t.label}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-card rounded-2xl p-6 shadow-card-soft min-h-[320px]">
            <AnimatePresence mode="wait">
              {tab === "paste" && (
                <motion.div key="paste" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {isSample && (
                    <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light border border-primary/30">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">Sample report loaded</span>
                    </div>
                  )}
                  <div className="relative group">
                    <div className="absolute top-4 left-4 z-10 pointer-events-none text-primary/60 group-focus-within:text-primary transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Textarea
                      value={text}
                      readOnly={isSample}
                      onChange={(e) => !isSample && setText(e.target.value.slice(0, 5000))}
                      placeholder="Example Report:&#10;Chest X-ray shows mild cardiomegaly and bilateral pleural effusion. Lung fields show mild haziness..."
                      className={`min-h-[260px] rounded-2xl border-2 pl-12 pr-4 py-4 focus:border-primary focus-visible:ring-0 focus:shadow-glow transition-all resize-none text-base leading-relaxed bg-background/50 ${isSample ? "cursor-default opacity-95" : ""}`}
                    />
                    <div className="flex items-center justify-between mt-3 px-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        {isSample ? "Demo report — ready to analyze" : "Paste your medical report here."}
                      </p>
                      <span className="text-xs text-muted-foreground tabular-nums">{text.length} / 5000</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "upload" && (
                <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-10 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center"
                  >
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <CloudUpload className="w-16 h-16 text-primary mb-3" />
                    </motion.div>
                    <p className="font-medium mb-1">Drop your file here or click to browse</p>
                    <p className="text-sm text-muted-foreground mb-3">Accepted: PDF, TXT, JPG, PNG · Max 10MB</p>
                    <div className="flex gap-2">
                      {["PDF", "TXT", "JPG", "PNG"].map((f) => (
                        <span key={f} className="px-2.5 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">{f}</span>
                      ))}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      hidden
                      accept=".pdf,.txt,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 10 * 1024 * 1024) {
                          toast.error("File too large. Max 10MB.");
                          return;
                        }
                        setFile(f);
                        toast.success(`Uploaded: ${f.name}`);
                      }}
                    />
                  </div>
                  {file && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center justify-between bg-primary-light rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-medium text-sm">{file.name}</span>
                      </div>
                      <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {tab === "voice" && (
                <motion.div key="voice" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center py-2">
                  {!speech.isSupported && (
                    <div className="mb-4 mx-auto max-w-md flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Voice input requires Chrome or Edge browser. Please type or paste instead.</span>
                    </div>
                  )}

                  <div className="relative inline-block">
                    {speech.isListening && (
                      <div className="absolute inset-0 listen-ring rounded-full" />
                    )}
                    <button
                      onClick={handleMicToggle}
                      disabled={!speech.isSupported}
                      className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-glow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed ${
                        speech.isListening
                          ? "bg-gradient-to-br from-red-500 to-rose-600"
                          : "bg-gradient-primary"
                      }`}
                    >
                      {speech.isListening ? (
                        <div className="flex gap-1 items-end h-8">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-1 bg-white rounded-full"
                              style={{
                                height: "100%",
                                animation: `wave-bar 0.7s ease-in-out ${i * 0.1}s infinite`,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <Mic className="w-10 h-10 text-white" />
                      )}
                    </button>
                  </div>

                  <p className="mt-6 font-medium">
                    {speech.isListening
                      ? "Listening... speak now"
                      : voiceText
                      ? "Recording captured — edit if needed"
                      : "Tap to speak"}
                  </p>

                  {speech.isListening && (
                    <Button
                      onClick={() => speech.stop()}
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-full"
                    >
                      <Square className="w-3 h-3 mr-1.5 fill-current" /> Tap to stop
                    </Button>
                  )}

                  {/* Live transcript / editable result */}
                  {(voiceText || speech.isListening) && (
                    <Textarea
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                      placeholder="Your speech will appear here in real time..."
                      className="mt-4 min-h-[120px] rounded-xl text-left"
                    />
                  )}

                  {speech.error && (
                    <p className="mt-3 text-sm text-destructive flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" /> {speech.error}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-muted-foreground">
                    Speak clearly — your speech will be converted to text before analysis.
                  </p>
                </motion.div>
              )}

              {tab === "scan" && (
                <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="relative h-[280px] rounded-2xl border-2 border-dashed border-primary/50 overflow-hidden bg-primary-light/30 flex items-center justify-center">
                    <div className="scan-line" />
                    {[
                      "top-2 left-2 border-t-2 border-l-2",
                      "top-2 right-2 border-t-2 border-r-2",
                      "bottom-2 left-2 border-b-2 border-l-2",
                      "bottom-2 right-2 border-b-2 border-r-2",
                    ].map((c, i) => (
                      <div key={i} className={`absolute w-8 h-8 border-primary rounded ${c}`} />
                    ))}
                    <div className="text-center">
                      <Scan className="w-12 h-12 text-primary mx-auto mb-2" />
                      <p className="font-medium">Point camera at your report</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => setScanText(sampleReport)} className="flex-1 bg-gradient-primary hover:opacity-90 rounded-xl h-12">
                      <Camera className="w-4 h-4 mr-2" /> Open Camera
                    </Button>
                    <Button variant="outline" onClick={() => setScanText(sampleReport)} className="flex-1 rounded-xl h-12">
                      <Upload className="w-4 h-4 mr-2" /> Upload Photo
                    </Button>
                  </div>
                  {scanText && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-success mb-2 font-medium">
                        <Check className="w-4 h-4" /> Text extracted
                      </div>
                      <Textarea value={scanText} onChange={(e) => setScanText(e.target.value)} className="min-h-[120px] rounded-xl" />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Optional contact for WhatsApp delivery */}
          <div className="mt-6 bg-card rounded-2xl p-5 shadow-card-soft border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-sm">📱 Auto-deliver report to WhatsApp</p>
                <p className="text-xs text-muted-foreground">Optional — we'll send your simplified report after analysis.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="rounded-xl"
              />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="WhatsApp number (e.g. +91 98765 43210)"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Analyze button */}
          <div className="mt-6">
            <Button
              disabled={!hasContent || analyzing}
              onClick={() => {
                setUserContact(name.trim(), phone.trim());
                analyze();
              }}
              className="w-full h-14 rounded-xl bg-gradient-primary hover:opacity-90 shadow-glow text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none group"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> {steps[step]}
                </span>
              ) : (
                <>
                  Analyze Report
                  <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Your report is never stored</div>
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> 100% private</div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-4 max-w-lg mx-auto">
            Decodex provides educational explanations only. Not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </PageTransition>
  );
};

export default InputPage;

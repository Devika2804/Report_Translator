import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FileText, Upload, Mic, Camera, Sparkles, Lock, ShieldCheck, ArrowRight,
  CloudUpload, X, Scan, Loader2, Check, Square, AlertCircle, CheckCircle,
} from "lucide-react";
import { createWorker } from "tesseract.js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
// Input component no longer needed (WhatsApp section removed)
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { sampleReport } from "@/lib/sampleData";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useReportStore } from "@/store/reportStore";
import { syncLanguageFromSessionStorage } from "@/lib/hydrateLanguageFromSession";

type Tab = "paste" | "upload" | "voice" | "scan";

const tabs: { id: Tab; icon: any; label: string }[] = [
  { id: "paste", icon: FileText, label: "Paste Text" },
  { id: "upload", icon: Upload, label: "Upload File" },
  { id: "voice", icon: Mic, label: "Voice Input" },
  { id: "scan", icon: Camera, label: "Scan Report" },
];

const InputPage = () => {
  const navigate = useNavigate();
  const { reportText: storedText, setReportText } = useReportStore();

  useEffect(() => {
    syncLanguageFromSessionStorage();
  }, []);
  const [tab, setTab] = useState<Tab>("paste");
  // Start empty — user can click "Try Sample Report" below textarea.
  const [text, setText] = useState(storedText || "");
  const [file, setFile] = useState<File | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [scanText, setScanText] = useState("");
  const [ocrStatus, setOcrStatus] = useState<"idle" | "extracting" | "success" | "error">("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [step, setStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoOcrRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/bmp"];
    if (!validTypes.includes(file.type)) {
      setOcrError("Please upload a JPG, PNG, or WebP image file.");
      setOcrStatus("error");
      return;
    }

    setOcrStatus("extracting");
    setOcrError("");
    setExtractedText("");
    setOcrProgress(0);

    let imageUrl = "";
    try {
      imageUrl = URL.createObjectURL(file);

      const worker = await createWorker("eng", 1, {
        logger: (m: { status?: string; progress?: number }) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const {
        data: { text },
      } = await worker.recognize(imageUrl);
      await worker.terminate();

      const cleanedText = text
        .replace(/\f/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (cleanedText.length < 10) {
        setOcrError(
          "Could not extract text from this image. Please try a clearer image or use the Paste Text tab."
        );
        setOcrStatus("error");
        return;
      }

      setExtractedText(cleanedText);
      setScanText(cleanedText);
      setReportText(cleanedText, false);
      setOcrStatus("success");
      setOcrProgress(100);
    } catch (error) {
      console.error("OCR error:", error);
      setOcrError("Failed to read image. Please try a clearer photo or paste the text manually.");
      setOcrStatus("error");
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    }
  }, [setReportText]);

  const lang =
    (typeof window !== "undefined" &&
      (localStorage.getItem("decodex_language_code") || sessionStorage.getItem("decodex-lang-code"))) ||
    "en-US";
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
                  setOcrStatus("idle");
                  setOcrProgress(0);
                  setOcrError("");
                  setExtractedText("");
                  speech.reset();
                  useReportStore.getState().setReportText("", false);
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
                  <div className="relative group">
                    <div className="absolute top-4 left-4 z-10 pointer-events-none text-primary/60 group-focus-within:text-primary transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, 5000))}
                      placeholder="Paste your medical report here..."
                      className="min-h-[260px] rounded-2xl border-2 pl-12 pr-4 py-4 focus:border-primary focus-visible:ring-0 focus:shadow-glow transition-all resize-none text-base leading-relaxed bg-background/50"
                    />
                    <div className="flex items-center justify-between mt-3 px-1">
                      <button
                        type="button"
                        onClick={() => setText(sampleReport)}
                        className="text-sm font-medium text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Try Sample Report
                      </button>
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
                    <Button
                      onClick={() => {
                        setScanText(sampleReport);
                        setReportText(sampleReport, false);
                        setOcrStatus("idle");
                        setExtractedText("");
                        setOcrError("");
                      }}
                      className="flex-1 bg-gradient-primary hover:opacity-90 rounded-xl h-12"
                    >
                      <Camera className="w-4 h-4 mr-2" /> Open Camera
                    </Button>
                    <div className="flex-1 space-y-0">
                      <input
                        ref={photoOcrRef}
                        type="file"
                        id="photo-upload"
                        accept="image/jpeg,image/png,image/jpg,image/webp,image/bmp"
                        className="sr-only"
                        onChange={handlePhotoUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => photoOcrRef.current?.click()}
                        disabled={ocrStatus === "extracting"}
                        className="w-full rounded-xl h-12 border-2"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {ocrStatus === "extracting" ? "Extracting text..." : "Upload Photo"}
                      </Button>
                    </div>
                  </div>

                  {ocrStatus === "extracting" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Reading image...</span>
                        <span>{ocrProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {ocrStatus === "success" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                      <div className="flex items-center gap-2 text-success mb-2 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Text extracted successfully</span>
                      </div>
                      <Textarea
                        value={extractedText}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExtractedText(v);
                          setScanText(v);
                          setReportText(v, false);
                        }}
                        className="min-h-[128px] rounded-xl text-sm resize-y"
                        placeholder="Extracted text appears here. You can edit if needed."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You can edit the extracted text above before analyzing.
                      </p>
                    </motion.div>
                  )}

                  {ocrStatus === "error" && (
                    <div className="mt-4 p-3 rounded-xl border border-destructive/30 bg-destructive/10">
                      <p className="text-destructive text-sm">{ocrError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setOcrStatus("idle");
                          setOcrError("");
                        }}
                        className="text-primary text-sm mt-2 underline underline-offset-2"
                      >
                        Try again
                      </button>
                    </div>
                  )}

                  {scanText && ocrStatus !== "success" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-success mb-2 font-medium">
                        <Check className="w-4 h-4" /> Text ready
                      </div>
                      <Textarea value={scanText} onChange={(e) => setScanText(e.target.value)} className="min-h-[120px] rounded-xl" />
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analyze button */}
          <div className="mt-6">
            <Button
              disabled={!hasContent || analyzing}
              onClick={analyze}
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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2, MessageCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnalysisResult } from "@/store/reportStore";

interface Props {
  open: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  language: string;
}

const N8N_WEBHOOK = "https://rajalakshmi.app.n8n.cloud/webhook/send-report";

const validatePhone = (p: string) => /^\+?[0-9\s\-()]{8,20}$/.test(p.trim());

export const WhatsAppShareModal = ({ open, onClose, analysis, language }: Props) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const previewMessage = `🩺 *Decodex Report Summary*

*Patient:* ${name || "—"}
*Language:* ${language}

*Summary:*
${analysis.summary.slice(0, 4).map((s) => `• ${s}`).join("\n")}

*Key Findings:*
${analysis.findings.slice(0, 3).map((f) => `• ${f.medicalTerm}: ${f.plainExplanation}`).join("\n")}

*Next Steps:*
${analysis.nextSteps.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join("\n")}

— Sent via Decodex AI`;

  const reset = () => {
    setName("");
    setPhone("");
    setErrors({});
    setStatus("idle");
  };

  const close = () => {
    reset();
    onClose();
  };

  const send = async () => {
    const errs: { name?: string; phone?: string } = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!phone.trim()) errs.phone = "Phone number is required";
    else if (!validatePhone(phone)) errs.phone = "Invalid phone number format";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setStatus("sending");
    try {
      const res = await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          summary: analysis.summary,
          findings: analysis.findings,
          nextSteps: analysis.nextSteps,
          worryLevel: analysis.worryLevel,
          language,
          message: previewMessage,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
      toast.success("Report sent successfully via WhatsApp");
      setTimeout(close, 1800);
    } catch (e: any) {
      console.error("WhatsApp send error", e);
      setStatus("error");
      toast.error("Failed to send. Please try again");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-glow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Send to WhatsApp</h3>
                  <p className="text-xs text-muted-foreground">Share your simplified report</p>
                </div>
              </div>
              <button onClick={close} className="p-1.5 hover:bg-muted rounded-lg" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === "success" ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-9 h-9 text-success" />
                </motion.div>
                <h4 className="text-lg font-bold mb-1">Sent successfully!</h4>
                <p className="text-sm text-muted-foreground">Check WhatsApp on {phone}</p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your name</label>
                    <Input
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      placeholder="John Doe"
                      className={`rounded-xl ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">WhatsApp number</label>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                      }}
                      placeholder="+91 98765 43210"
                      className={`rounded-xl ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Message preview</p>
                  <div className="bg-muted/50 border border-border rounded-xl p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/80">{previewMessage}</pre>
                  </div>
                </div>

                <Button
                  onClick={send}
                  disabled={status === "sending"}
                  className="w-full h-12 rounded-xl bg-success hover:bg-success/90 text-white font-medium"
                >
                  {status === "sending" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending report...</>
                  ) : status === "error" ? (
                    <><Send className="w-4 h-4 mr-2" /> Try again</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Send via WhatsApp</>
                  )}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground mt-2">
                  Powered by automated workflow · Your data is sent securely
                </p>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

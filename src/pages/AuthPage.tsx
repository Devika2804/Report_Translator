import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";

const AuthPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwd, setPwd] = useState("");

  const strength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;
  const strengthMap = [
    { label: "", color: "bg-muted", w: "w-0" },
    { label: "Weak", color: "bg-destructive", w: "w-1/3" },
    { label: "Fair", color: "bg-warning", w: "w-2/3" },
    { label: "Strong", color: "bg-success", w: "w-full" },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate("/language"), 1500);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* LEFT */}
        <div className="md:w-1/2 bg-gradient-primary relative overflow-hidden p-8 md:p-12 flex flex-col justify-between text-white min-h-[40vh] md:min-h-screen">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/30 rounded-full blur-3xl translate-y-20 -translate-x-20" />

          <div className="relative">
            <Logo />
          </div>

          <div className="relative space-y-6 my-8">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Your medical reports, finally clear.</h1>
            <p className="text-lg text-white/80">Join thousands who decode their reports in seconds.</p>

            <ul className="space-y-3 pt-4">
              {["Instant plain-language explanations", "12+ languages supported", "100% private and secure"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="relative glass-dark bg-white/15 backdrop-blur-md rounded-2xl p-5 border-white/20 max-w-sm hidden md:block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Lab Results</p>
                <p className="text-xs text-white/70">Analyzed</p>
              </div>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/20">Low</span>
            </div>
            <p className="text-sm text-white/80">Cholesterol levels are within healthy range.</p>
          </motion.div>
        </div>

        {/* RIGHT */}
        <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-surface">
          <div className="w-full max-w-md">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="bg-card rounded-3xl shadow-soft p-8 border border-border/50">
              <h2 className="text-3xl font-bold mb-2">Welcome to Decodex</h2>
              <p className="text-muted-foreground mb-6">Sign in or create an account to get started</p>

              {/* Tab switcher */}
              <div className="relative flex bg-muted rounded-xl p-1 mb-6">
                {(["signin", "signup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="relative flex-1 py-2.5 text-sm font-medium z-10 transition-colors"
                  >
                    <span className={tab === t ? "text-primary-foreground" : "text-muted-foreground"}>
                      {t === "signin" ? "Sign In" : "Sign Up"}
                    </span>
                  </button>
                ))}
                <motion.div
                  layout
                  className="absolute top-1 bottom-1 w-1/2 bg-gradient-primary rounded-lg shadow-soft"
                  animate={{ left: tab === "signin" ? "0.25rem" : "calc(50% - 0.25rem)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.form
                  key={tab}
                  initial={{ opacity: 0, x: tab === "signin" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tab === "signin" ? 20 : -20 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={submit}
                  className="space-y-4"
                >
                  {tab === "signup" && (
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Full name" className="pl-10 h-12 rounded-xl" required />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input type="email" placeholder="Email address" className="pl-10 h-12 rounded-xl" required />
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={showPwd ? "text" : "password"}
                        placeholder="Password"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl"
                        required
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {tab === "signup" && pwd.length > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: strength === 1 ? "33%" : strength === 2 ? "66%" : "100%" }}
                            className={`h-full ${strengthMap[strength].color} rounded-full`}
                          />
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">{strengthMap[strength].label}</p>
                      </div>
                    )}
                  </div>

                  {tab === "signup" && (
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input type="password" placeholder="Confirm password" className="pl-10 h-12 rounded-xl" required />
                    </div>
                  )}

                  {tab === "signin" ? (
                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox /> <span>Remember me</span>
                      </label>
                      <a href="#" className="text-primary hover:underline">Forgot password?</a>
                    </div>
                  ) : (
                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                      <Checkbox className="mt-0.5" required /> <span className="text-muted-foreground">I agree to Terms and Privacy Policy</span>
                    </label>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-primary hover:opacity-90 shadow-soft text-base font-medium group"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {tab === "signin" ? "Sign In" : "Create Account"}
                        <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or continue with</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" className="h-11 rounded-xl">
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Google
                    </Button>
                    <Button type="button" variant="outline" className="h-11 rounded-xl">
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"/></svg>
                      Apple
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground pt-2">
                    {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
                    <button type="button" onClick={() => setTab(tab === "signin" ? "signup" : "signin")} className="text-primary font-medium hover:underline">
                      {tab === "signin" ? "Sign up →" : "Sign in →"}
                    </button>
                  </p>
                </motion.form>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AuthPage;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2,
  Activity, Phone, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { AnimatedDarkBackground } from "@/components/AnimatedDarkBackground";
import { supabase } from "@/integrations/supabase/client";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.error_description === "string" && o.error_description) return o.error_description;
    if (typeof o.msg === "string" && o.msg) return o.msg;
    const details = typeof o.details === "string" ? o.details : "";
    const hint = typeof o.hint === "string" ? o.hint : "";
    if (details && hint) return `${details} (${hint})`;
    if (details) return details;
    if (hint) return hint;
  }
  return "Something went wrong";
}

const COUNTRIES = [
  { code: "IN", flag: "🇮🇳", dial: "+91", name: "India" },
  { code: "US", flag: "🇺🇸", dial: "+1", name: "United States" },
  { code: "GB", flag: "🇬🇧", dial: "+44", name: "United Kingdom" },
  { code: "AE", flag: "🇦🇪", dial: "+971", name: "UAE" },
];

const AuthPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);

  const strength = pwd.length === 0 ? 0 : pwd.length < 6 ? 1 : pwd.length < 10 ? 2 : 3;
  const strengthMap = [
    { label: "", color: "bg-slate-200" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return "Invalid phone number";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "signup") {
      const err = validatePhone(phone);
      if (err) {
        setPhoneErr(err);
        return;
      }
      if (pwd !== confirmPwd) {
        toast.error("Passwords do not match");
        return;
      }
    }
    setPhoneErr(null);
    setLoading(true);
    const password = pwd;
    const phoneDigits = phone.replace(/\D/g, "");
    const fullPhone = tab === "signup" ? `${country.dial}${phoneDigits}` : "";

    try {
      if (tab === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
              phone: fullPhone,
              display_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData?.user) {
          localStorage.setItem("user_name", fullName);
          localStorage.setItem("user_phone", fullPhone);
          localStorage.setItem("user_email", email);

          // RLS requires a session (auth.uid()). If email confirmation is on, session is often null — skip client upsert; DB trigger fills public.users.
          if (signUpData.session) {
            const { error: profileError } = await supabase.from("users").upsert(
              {
                id: signUpData.user.id,
                email: email,
                name: fullName,
                phone: fullPhone,
                created_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
            if (profileError) throw profileError;
          }
        }

        toast.success(
          signUpData?.session
            ? "Account created!"
            : "Check your email to confirm your account. After confirming, sign in to continue."
        );
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) throw signInError;

        const { data: userProfile } = await supabase
          .from("users")
          .select("name, phone, email")
          .eq("id", signInData.user.id)
          .maybeSingle();

        if (userProfile) {
          localStorage.setItem("user_name", userProfile.name || "");
          localStorage.setItem("user_phone", userProfile.phone || "");
          localStorage.setItem("user_email", userProfile.email || email);
        } else {
          const meta = signInData.user.user_metadata;
          const nameFromMeta =
            (meta?.full_name as string | undefined) ||
            (meta?.display_name as string | undefined) ||
            (meta?.name as string | undefined) ||
            "";
          const phoneFromMeta = (meta?.phone as string | undefined) || "";
          localStorage.setItem("user_name", nameFromMeta);
          localStorage.setItem("user_phone", phoneFromMeta);
          localStorage.setItem("user_email", signInData.user.email || email);

          const { error: backfillError } = await supabase.from("users").upsert(
            {
              id: signInData.user.id,
              email: signInData.user.email ?? email,
              name: nameFromMeta,
              phone: phoneFromMeta,
              created_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
          if (backfillError) console.error("users profile backfill:", backfillError);
        }

        toast.success("Welcome back!");
      }

      navigate("/language");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedDarkBackground />

        {/* Top nav */}
        <div className="relative z-10 container flex items-center justify-between h-16 pt-4">
          <Logo variant="light" />
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
        </div>

        <div className="relative z-10 min-h-[calc(100vh-4rem)] flex flex-col md:flex-row items-center justify-center container py-8 gap-10">
          {/* LEFT brand panel — transparent over dark bg */}
          <div className="md:w-1/2 max-w-lg text-white space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Your medical reports,{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                finally clear.
              </span>
            </h1>
            <p className="text-lg text-white/70">
              Join thousands who decode their reports in seconds.
            </p>

            <ul className="space-y-3 pt-2">
              {[
                "Instant plain-language explanations",
                "12+ languages supported",
                "100% private and secure",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-400/20 backdrop-blur flex items-center justify-center border border-cyan-400/40">
                    <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                  </div>
                  <span className="text-white/90">{t}</span>
                </li>
              ))}
            </ul>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="rounded-2xl p-5 max-w-sm bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_0_40px_rgba(6,182,212,0.2)] hidden md:block"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white">Lab Results</p>
                  <p className="text-xs text-white/70">Analyzed</p>
                </div>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-300/30">
                  Low
                </span>
              </div>
              <p className="text-sm text-white/85">
                Cholesterol levels are within healthy range.
              </p>
            </motion.div>
          </div>

          {/* RIGHT — light high-contrast form card */}
          <div className="md:w-1/2 w-full max-w-md">
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-[2rem] blur-2xl" />

              <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-7 sm:p-8 border border-white/40">
                <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-slate-900">Welcome to Decodex</h2>
                <p className="text-slate-600 mb-6 text-sm">
                  Sign in or create an account to get started
                </p>

                {/* Tabs */}
                <div className="relative flex bg-slate-100 rounded-xl p-1 mb-6">
                  {(["signin", "signup"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className="relative flex-1 py-2.5 text-sm font-medium z-10 transition-colors"
                    >
                      <span className={tab === t ? "text-white" : "text-slate-600"}>
                        {t === "signin" ? "Sign In" : "Sign Up"}
                      </span>
                    </button>
                  ))}
                  <motion.div
                    layout
                    className="absolute top-1 bottom-1 w-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg shadow-md"
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
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <Input
                          placeholder="Full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus-visible:ring-blue-500"
                          required
                        />
                      </div>
                    )}

                    {/* Phone field — sign up only */}
                    {tab === "signup" && (
                      <div>
                        <div className="flex gap-2">
                          {/* Country flag selector */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setCountryOpen((o) => !o)}
                              className="h-12 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                            >
                              <span className="text-lg leading-none">{country.flag}</span>
                              <span className="text-xs font-semibold">{country.code}</span>
                              <ChevronDown className="w-3 h-3 text-slate-500" />
                            </button>
                            <AnimatePresence>
                              {countryOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  className="absolute left-0 top-14 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-20 py-1 overflow-hidden"
                                >
                                  {COUNTRIES.map((c) => (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => {
                                        setCountry(c);
                                        setCountryOpen(false);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-800 hover:bg-slate-100 text-left"
                                    >
                                      <span className="text-base">{c.flag}</span>
                                      <span className="flex-1">{c.name}</span>
                                      <span className="text-slate-500 text-xs">{c.dial}</span>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="relative flex-1">
                            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <Input
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                if (phoneErr) setPhoneErr(null);
                              }}
                              placeholder={`${country.dial} XXXXX XXXXX`}
                              className={`pl-10 h-12 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 ${
                                phoneErr ? "border-red-500 focus-visible:ring-red-400" : "border-slate-300"
                              }`}
                              required
                            />
                          </div>
                        </div>
                        {phoneErr && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            {phoneErr}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <Input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 rounded-xl bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus-visible:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <Input
                          type={showPwd ? "text" : "password"}
                          placeholder="Password"
                          value={pwd}
                          onChange={(e) => setPwd(e.target.value)}
                          className="pl-10 pr-10 h-12 rounded-xl bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus-visible:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                        >
                          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {tab === "signup" && pwd.length > 0 && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width:
                                  strength === 1 ? "33%" : strength === 2 ? "66%" : "100%",
                              }}
                              className={`h-full ${strengthMap[strength].color} rounded-full`}
                            />
                          </div>
                          <p className="text-xs mt-1 text-slate-600">{strengthMap[strength].label}</p>
                        </div>
                      )}
                    </div>

                    {tab === "signup" && (
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <Input
                          type="password"
                          placeholder="Confirm password"
                          value={confirmPwd}
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          className="pl-10 h-12 rounded-xl bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus-visible:ring-blue-500"
                          required
                        />
                      </div>
                    )}

                    {tab === "signin" ? (
                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                          <Checkbox /> <span>Remember me</span>
                        </label>
                        <a href="#" className="text-blue-600 hover:underline font-medium">
                          Forgot password?
                        </a>
                      </div>
                    ) : (
                      <label className="flex items-start gap-2 text-sm cursor-pointer text-slate-700">
                        <Checkbox className="mt-0.5" required />{" "}
                        <span>I agree to the Terms and Privacy Policy</span>
                      </label>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 shadow-md text-base font-medium group border-0"
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
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-2 text-slate-500">or continue with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25" />
                        </svg>
                        Apple
                      </Button>
                    </div>

                    <p className="text-center text-sm text-slate-600 pt-2">
                      {tab === "signin" ? "Don't have an account? " : "Already have an account? "}
                      <button
                        type="button"
                        onClick={() => setTab(tab === "signin" ? "signup" : "signin")}
                        className="text-blue-600 font-medium hover:underline"
                      >
                        {tab === "signin" ? "Sign up →" : "Sign in →"}
                      </button>
                    </p>
                  </motion.form>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AuthPage;

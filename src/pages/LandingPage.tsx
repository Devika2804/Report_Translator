import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Play, FileSearch, Brain, ShieldCheck, Globe, AlertTriangle, MessageCircle, Sparkles, Heart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";

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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="blob bg-primary/40 w-96 h-96 -top-20 -left-20" />
        <div className="blob bg-accent/40 w-96 h-96 top-40 -right-20" style={{ animationDelay: "5s" }} />
        <div className="absolute inset-0 dot-grid opacity-60" />

        {/* Navbar */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 glass border-b border-white/30"
        >
          <div className="container flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
              <Button onClick={() => navigate("/auth")} className="rounded-full bg-gradient-primary hover:opacity-90 shadow-soft">
                Get Started
              </Button>
            </div>
          </div>
        </motion.nav>

        {/* Hero */}
        <section className="container relative pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light border border-primary/20"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">AI-Powered Medical Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]"
            >
              Understand Your <br />
              <span className="gradient-text">Medical Reports</span> Instantly
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Stop Googling symptoms in panic. Decodex reads your radiology, blood test, and lab reports — then explains everything in plain, calm language.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="rounded-full bg-gradient-primary hover:opacity-90 h-14 px-8 text-base shadow-glow group"
              >
                Decode My Report
                <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="ghost" className="rounded-full h-14 px-8 text-base">
                <Play className="w-5 h-5 mr-1" /> Watch Demo
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground"
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
                className="glass rounded-3xl p-6 shadow-glow text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Chest X-Ray Report</p>
                      <p className="text-xs text-muted-foreground">Analyzed in 4.2s</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-warning-light text-warning text-xs font-semibold">🟡 Mild</span>
                </div>
                <div className="space-y-2 text-sm">
                  {["Heart slightly enlarged but stable", "Early lung fluid signs detected", "Bones completely normal"].map((t, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Heart className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/30 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="container py-20 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need to <span className="gradient-text">understand</span></h2>
            <p className="text-lg text-muted-foreground">Built for patients, loved by doctors</p>
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
                className="glass rounded-2xl p-6 shadow-card-soft hover:shadow-soft transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-soft">
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials marquee */}
        <section className="py-16 overflow-hidden">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Loved by <span className="gradient-text">thousands</span></h2>
          </div>
          <div className="marquee">
            <div className="marquee-track">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="glass rounded-2xl p-5 w-80 flex-shrink-0 shadow-card-soft">
                  <p className="text-sm mb-3">"{t.text}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container py-12 border-t border-border/40 mt-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Decodex · Not a substitute for medical advice
            </p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default LandingPage;

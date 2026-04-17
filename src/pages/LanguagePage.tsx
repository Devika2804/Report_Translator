import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check, Globe2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { languages } from "@/lib/sampleData";
import { useReportStore } from "@/store/reportStore";

const LanguagePage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("English");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => languages.filter((l) => l.name.toLowerCase().includes(query.toLowerCase()) || l.native.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-surface relative">
        <div className="blob bg-primary/20 w-96 h-96 -top-20 -right-20" />

        {/* Navbar */}
        <nav className="sticky top-0 z-40 glass border-b border-white/30">
          <div className="container flex items-center justify-between h-16">
            <Logo />
            <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-semibold">
              JD
            </div>
          </div>
        </nav>

        <div className="container py-8 max-w-5xl">
          <button onClick={() => navigate("/auth")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center mb-10 space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">Choose Your Language</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              We'll explain your report in the language you're most comfortable with.
            </p>
          </div>

          {/* Auto-detect */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => setSelected("auto")}
            className={`w-full mb-6 relative overflow-hidden rounded-2xl p-5 text-left transition-all ${
              selected === "auto" ? "bg-primary-light border-2 border-primary" : "bg-card border-2 border-transparent"
            }`}
            style={selected !== "auto" ? { backgroundImage: "linear-gradient(white,white), var(--gradient-primary)", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box", border: "2px solid transparent" } : {}}
          >
            <div className="absolute inset-0 bg-gradient-primary opacity-5 animate-pulse" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">Auto-detect from your report</p>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-primary text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Recommended
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">We'll detect the language of your report and respond in kind</p>
              </div>
              {selected === "auto" && <Check className="w-6 h-6 text-primary" />}
            </div>
          </motion.button>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search languages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl bg-card"
            />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-32 md:pb-8">
            {filtered.map((lang, i) => {
              const isSelected = selected === lang.name;
              return (
                <motion.button
                  key={lang.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(lang.name)}
                  className={`relative rounded-2xl p-4 text-left transition-all ${
                    isSelected
                      ? "bg-primary-light border-2 border-primary shadow-soft"
                      : "bg-card border-2 border-border hover:border-primary/40"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  <div className="text-3xl mb-2">{lang.flag}</div>
                  <p className="font-semibold text-sm">{lang.name}</p>
                  <p className="text-xs text-muted-foreground">{lang.native}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sticky continue */}
        <div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 md:pb-12 bg-background/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-0 border-border z-30">
          <div className="container max-w-5xl">
            <Button
              disabled={!selected}
              onClick={() => {
                const chosen = languages.find((l) => l.name === selected);
                const name = selected === "auto" ? "English" : selected;
                const code = chosen?.code || "en-US";
                sessionStorage.setItem("decodex-lang", name);
                sessionStorage.setItem("decodex-lang-code", code);
                useReportStore.getState().setLanguage(name, code);
                toast.success(`Language selected: ${name}`);
                navigate("/input");
              }}
              className="w-full h-14 rounded-xl bg-gradient-primary hover:opacity-90 shadow-glow text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue
            </Button>
            {!selected && <p className="text-xs text-center text-muted-foreground mt-2">Please select a language to continue</p>}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default LanguagePage;

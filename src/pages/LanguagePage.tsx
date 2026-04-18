import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { languages } from "@/lib/sampleData";
import { languageCodeMap } from "@/lib/languageCodeMap";
import { useReportStore } from "@/store/reportStore";

const LanguagePage = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("English");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      languages.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.native.toLowerCase().includes(query.toLowerCase())
      ),
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

        <div className="container py-10 max-w-4xl">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="text-center mb-8 space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Choose Your Language</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              We'll explain your report in the language you're most comfortable with.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-md mx-auto">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search languages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11 h-11 rounded-xl bg-card"
            />
          </div>

          {/* Compact grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-32 md:pb-8">
            {filtered.map((lang, i) => {
              const isSelected = selected === lang.name;
              return (
                <motion.button
                  key={lang.name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(lang.name)}
                  className={`relative rounded-xl p-3 text-center transition-all ${
                    isSelected
                      ? "bg-primary-light border-2 border-primary"
                      : "bg-card border-2 border-border hover:border-primary/40"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  <p className="font-semibold text-sm text-foreground">{lang.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lang.native}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sticky continue */}
        <div className="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 md:pb-12 bg-background/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-0 border-border z-30">
          <div className="container max-w-4xl">
            <Button
              disabled={!selected}
              onClick={() => {
                const name = selected;
                const code = languageCodeMap[name] || "en-US";
                localStorage.setItem("decodex_language", name);
                localStorage.setItem("decodex_language_code", code);
                sessionStorage.setItem("decodex-lang", name);
                sessionStorage.setItem("decodex-lang-code", code);
                useReportStore.getState().setLanguage(name, code);
                toast.success(`Language selected: ${name}`);
                navigate("/input");
              }}
              className="w-full h-13 rounded-xl bg-gradient-primary hover:opacity-90 shadow-glow text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default LanguagePage;

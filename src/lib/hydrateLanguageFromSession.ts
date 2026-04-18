import { useReportStore } from "@/store/reportStore";
import { languageCodeMap } from "@/lib/languageCodeMap";

/** Restore chosen language after refresh (Zustand resets). Prefers localStorage from Language page. */
export function syncLanguageFromSessionStorage(): void {
  if (typeof window === "undefined") return;

  let name =
    localStorage.getItem("decodex_language")?.trim() ||
    sessionStorage.getItem("decodex-lang")?.trim() ||
    "";
  let code =
    localStorage.getItem("decodex_language_code")?.trim() ||
    sessionStorage.getItem("decodex-lang-code")?.trim() ||
    "";

  if (name && !code) {
    code = languageCodeMap[name] || "en-US";
  }
  if (name && code) {
    useReportStore.getState().setLanguage(name, code);
  }
}

// Decodex report store
import { create } from "zustand";

export interface Finding {
  medicalTerm: string;
  plainExplanation: string;
}

export interface DetailedFinding {
  finding: string;
  medicalTerm: string;
  severity: "Normal" | "Mild" | "Moderate" | "Severe";
  plainExplanation: string;
  actionRequired: string;
}

export interface AnalysisResult {
  summary: string[];
  aiExplanation: string;
  findings: Finding[];
  whatThisMeans: string;
  nextSteps: string[];
  worryLevel: "Low" | "Mild" | "Moderate" | "High";
  worryReason: string;
  ageRelatedPercent: number;
  environmentalPercent: number;
  ageRelatedFactors: string[];
  environmentalFactors: string[];
  reportType: string;
  detailedFindings: DetailedFinding[];
  clinicalInterpretation: string[];
  medicationsToAvoid: string[];
  lifestyleHelps: string[];
  doctorQuestions: string[];
  fullReportText: string;
}

interface ReportStore {
  reportText: string;
  language: string;       // human-readable, e.g. "English"
  languageCode: string;   // BCP-47, e.g. "en-US"
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  isSample: boolean;
  userName: string;
  phoneNumber: string;
  setReportText: (text: string, isSample?: boolean) => void;
  setLanguage: (name: string, code: string) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setAnalysisError: (err: string | null) => void;
  setUserContact: (name: string, phone: string) => void;
  reset: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reportText: "",
  language: "English",
  languageCode: "en-US",
  analysisResult: null,
  analysisError: null,
  isSample: false,
  userName: "",
  phoneNumber: "",
  setReportText: (text, isSample = false) => set({ reportText: text, isSample }),
  setLanguage: (name, code) => set({ language: name, languageCode: code }),
  setAnalysisResult: (result) => set({ analysisResult: result, analysisError: null }),
  setAnalysisError: (err) => set({ analysisError: err }),
  setUserContact: (name, phone) => set({ userName: name, phoneNumber: phone }),
  reset: () => set({ reportText: "", analysisResult: null, analysisError: null, isSample: false }),
}));

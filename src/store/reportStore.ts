// src/store/reportStore.ts
import { create } from 'zustand';

export interface AnalysisResult {
  summary: string[];
  aiExplanation: string;
  findings: { medicalTerm: string; plainExplanation: string }[];
  whatThisMeans: string;
  nextSteps: string[];
  worryLevel: 'Low' | 'Mild' | 'Moderate' | 'High';
  worryReason: string;
  ageRelatedPercent: number;
  environmentalPercent: number;
  ageRelatedFactors: string[];
  environmentalFactors: string[];
  reportType: string;
  detailedFindings: {
    finding: string;
    medicalTerm: string;
    severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
    plainExplanation: string;
    actionRequired: string;
  }[];
  clinicalInterpretation: string[];
  medicationsToAvoid: string[];
  lifestyleHelps: string[];
  doctorQuestions: string[];
  fullReportText: string;
  worryColor?: 'green' | 'yellow' | 'orange' | 'red';
}

interface ReportStore {
  reportText: string;
  selectedLanguage: string;
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  setReportText: (text: string) => void;
  setLanguage: (lang: string) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setAnalysisError: (error: string | null) => void;
  clearReport: () => void;
}

export const useReportStore = create<ReportStore>((set) => ({
  reportText: '',
  selectedLanguage: 'English',
  analysisResult: null,
  analysisError: null,
  setReportText: (text) => set({ reportText: text }),
  setLanguage: (lang) => set({ selectedLanguage: lang }),
  setAnalysisResult: (result) => set({ analysisResult: result, analysisError: null }),
  setAnalysisError: (error) => set({ analysisError: error }),
  clearReport: () => set({ reportText: '', analysisResult: null, analysisError: null }),
}));

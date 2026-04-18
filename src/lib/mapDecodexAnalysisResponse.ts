import type { AnalysisResult } from "@/store/reportStore";

/** Shape returned by the `analyze-report` Edge Function (flat JSON). */
export type DecodexApiAnalysis = {
  summary: string[];
  aiExplanation: string;
  findings: Array<{
    term?: string;
    explanation?: string;
    severity?: string;
    medicalTerm?: string;
    plainExplanation?: string;
  }>;
  whatThisMeans: string;
  worryLevel: "Low" | "Mild" | "Moderate" | "High";
  worryColor?: "green" | "yellow" | "orange" | "red";
  possibleCauses?: {
    ageRelated?: string[];
    environmental?: string[];
    agePercent?: number;
    envPercent?: number;
  };
  nextSteps: string[];
  fullReport?: {
    reportType?: string;
    detailedFindings?: Array<{
      finding: string;
      term: string;
      severity: string;
      explanation: string;
      action: string;
    }>;
    clinicalInterpretation?: string[];
    avoidList?: string[];
    helpList?: string[];
    doctorQuestions?: string[];
  };
};

export function isDecodexApiAnalysis(v: unknown): v is DecodexApiAnalysis {
  if (typeof v !== "object" || v === null) return false;
  const o = v as DecodexApiAnalysis;
  return Array.isArray(o.summary) && typeof o.aiExplanation === "string";
}

function normalizeSeverity(s: string): "Normal" | "Mild" | "Moderate" | "Severe" {
  const cap = (s || "Normal").charAt(0).toUpperCase() + (s || "Normal").slice(1).toLowerCase();
  if (cap === "Normal" || cap === "Mild" || cap === "Moderate" || cap === "Severe") return cap;
  return "Normal";
}

export function mapDecodexApiToAnalysisResult(d: DecodexApiAnalysis): AnalysisResult {
  const fr = d.fullReport;
  const findings = Array.isArray(d.findings) ? d.findings : [];

  return {
    summary: d.summary,
    aiExplanation: d.aiExplanation,
    findings: findings.map((f) => ({
      medicalTerm: f.term ?? f.medicalTerm ?? "—",
      plainExplanation: f.explanation ?? f.plainExplanation ?? "",
    })),
    whatThisMeans: d.whatThisMeans,
    nextSteps: Array.isArray(d.nextSteps) ? d.nextSteps : [],
    worryLevel: d.worryLevel,
    worryReason: `Estimated priority: ${d.worryLevel}.`,
    ageRelatedPercent: d.possibleCauses?.agePercent ?? 0,
    environmentalPercent: d.possibleCauses?.envPercent ?? 0,
    ageRelatedFactors: d.possibleCauses?.ageRelated ?? [],
    environmentalFactors: d.possibleCauses?.environmental ?? [],
    reportType: fr?.reportType ?? "Medical report",
    detailedFindings: (fr?.detailedFindings ?? []).map((x) => ({
      finding: x.finding,
      medicalTerm: x.term,
      severity: normalizeSeverity(x.severity),
      plainExplanation: x.explanation,
      actionRequired: x.action,
    })),
    clinicalInterpretation: fr?.clinicalInterpretation ?? [],
    medicationsToAvoid: fr?.avoidList ?? [],
    lifestyleHelps: fr?.helpList ?? [],
    doctorQuestions: fr?.doctorQuestions ?? [],
    fullReportText: [
      ...d.summary,
      "",
      d.aiExplanation,
      "",
      d.whatThisMeans,
      ...(fr?.clinicalInterpretation ?? []),
    ].join("\n"),
    worryColor: d.worryColor,
  };
}

/** Accept either `{ analysis: ... }` or the flat analysis object from `invoke`. */
export function extractAnalysisPayload(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return null;
  const o = data as { analysis?: unknown };
  if (o.analysis !== undefined) return o.analysis;
  return data;
}

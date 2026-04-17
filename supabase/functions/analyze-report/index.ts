const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = (language: string) => `You are Decodex, a medical report decoder for patients.
Analyze the medical report the user provides and respond with structured data ONLY via the return_analysis tool.
All human-readable text fields MUST be written in ${language}.
Be calm, reassuring, plain-language. Never alarm the patient. Avoid medical jargon in plainExplanation/whatThisMeans/nextSteps.
worryLevel must be exactly one of: "Low", "Mild", "Moderate", "High".
ageRelatedPercent + environmentalPercent must sum to 100.
Provide 3-5 summary bullets, 3-6 findings, 3-5 detailed findings, 5 doctor questions, and a fullReportText suitable for text-to-speech (no markdown, plain prose).`;

const TOOL = {
  type: "function",
  function: {
    name: "return_analysis",
    description: "Return the structured analysis of the patient's medical report.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
        aiExplanation: { type: "string" },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              medicalTerm: { type: "string" },
              plainExplanation: { type: "string" },
            },
            required: ["medicalTerm", "plainExplanation"],
            additionalProperties: false,
          },
        },
        whatThisMeans: { type: "string" },
        nextSteps: { type: "array", items: { type: "string" } },
        worryLevel: { type: "string", enum: ["Low", "Mild", "Moderate", "High"] },
        worryReason: { type: "string" },
        ageRelatedPercent: { type: "number" },
        environmentalPercent: { type: "number" },
        ageRelatedFactors: { type: "array", items: { type: "string" } },
        environmentalFactors: { type: "array", items: { type: "string" } },
        reportType: { type: "string" },
        detailedFindings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              finding: { type: "string" },
              medicalTerm: { type: "string" },
              severity: { type: "string", enum: ["Normal", "Mild", "Moderate", "Severe"] },
              plainExplanation: { type: "string" },
              actionRequired: { type: "string" },
            },
            required: ["finding", "medicalTerm", "severity", "plainExplanation", "actionRequired"],
            additionalProperties: false,
          },
        },
        clinicalInterpretation: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
        medicationsToAvoid: { type: "array", items: { type: "string" } },
        lifestyleHelps: { type: "array", items: { type: "string" } },
        doctorQuestions: { type: "array", items: { type: "string" } },
        fullReportText: { type: "string" },
      },
      required: [
        "summary", "aiExplanation", "findings", "whatThisMeans", "nextSteps",
        "worryLevel", "worryReason", "ageRelatedPercent", "environmentalPercent",
        "ageRelatedFactors", "environmentalFactors", "reportType",
        "detailedFindings", "clinicalInterpretation", "medicationsToAvoid",
        "lifestyleHelps", "doctorQuestions", "fullReportText",
      ],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportText, language } = await req.json();
    if (!reportText || typeof reportText !== "string" || !reportText.trim()) {
      return new Response(JSON.stringify({ error: "reportText required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lang = language || "English";

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT(lang) },
          { role: "user", content: `Please analyze this medical report:\n\n${reportText}` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response", JSON.stringify(data));
      throw new Error("AI did not return structured analysis");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-report error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

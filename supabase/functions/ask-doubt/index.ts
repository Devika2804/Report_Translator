const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Stopwords to ignore when checking question keywords against the report
const STOPWORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","do","does","did",
  "have","has","had","of","in","on","at","to","for","with","by","from","up","about",
  "into","over","after","under","and","or","but","if","then","than","so","because",
  "as","until","while","what","which","who","whom","this","that","these","those",
  "i","me","my","you","your","he","she","it","its","we","they","them","their",
  "can","could","should","would","may","might","will","just","tell","explain",
  "mean","means","meaning","worry","worried","about","please","know","want","need",
  "doctor","report","my","me","i","im","i'm","whats","what's","how","why","when","where",
  "show","shows","says","say","told","get","got","there","here","also","too","very","really",
  "much","more","less","any","all","some","not","no","yes","ok","okay",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function questionRelatesToReport(question: string, reportText: string, summary: string): boolean {
  const qWords = extractKeywords(question);
  if (qWords.length === 0) return true; // generic/short question — let AI handle with fallback rules
  const haystack = (reportText + " " + summary).toLowerCase();
  // Consider it related if at least ONE meaningful keyword appears in the report/summary
  return qWords.some((w) => haystack.includes(w));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, reportText, summary, language } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "question required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const lang = language || "English";
    const summaryText = Array.isArray(summary) ? summary.join("; ") : (summary || "");
    const report = reportText || "";

    // Guardrail: if question has no keyword overlap with report → return fallback directly
    const related = questionRelatesToReport(question, report, summaryText);
    if (!related && report.trim().length > 0) {
      const fallback =
        "This term is not clearly mentioned in your report. Please consult your doctor for confirmation.";
      return new Response(JSON.stringify({ answer: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `You are a medical assistant. Answer ONLY based on the given medical report.

Report:
${report || "(no report provided)"}

Analysis Summary:
${summaryText || "(no summary provided)"}

STRICT RULES:
1. Answer ONLY using information explicitly present in the Report or Analysis Summary above.
2. If the term, condition, or topic in the user's question is NOT present in the Report or Summary, respond EXACTLY with: "This term is not clearly mentioned in your report. Please consult your doctor for confirmation."
3. DO NOT invent, guess, or introduce unrelated medical conditions, diagnoses, or terms that are not in the report.
4. DO NOT speculate about conditions the report does not mention (e.g., do not mention hernia if the report is about pleural effusion).
5. Keep the answer simple, calm, reassuring, and relevant to the report.
6. Maximum 4–5 short lines. Plain prose. No markdown. No lists.
7. Respond in ${lang}.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ask-doubt error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

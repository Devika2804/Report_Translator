import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function extractJsonFromLlm(raw: string): string {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return t.trim();
}

function parseJsonLenient(raw: string): unknown {
  const cleaned = extractJsonFromLlm(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      return JSON.parse(slice);
    }
    throw new Error("Could not parse translation JSON");
  }
}

function looksLikeAnalysis(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const o = v as { summary?: unknown; aiExplanation?: unknown };
  return Array.isArray(o.summary) && typeof o.aiExplanation === "string";
}

function preserveMachineFields(
  original: Record<string, unknown>,
  translated: Record<string, unknown>,
) {
  translated.worryLevel = original.worryLevel;
  translated.worryColor = original.worryColor;

  const of = original.findings as Array<{ severity?: string }> | undefined;
  const tf = translated.findings as Array<{ severity?: string }> | undefined;
  if (Array.isArray(of) && Array.isArray(tf)) {
    for (let i = 0; i < Math.min(of.length, tf.length); i++) {
      if (of[i]?.severity != null) tf[i].severity = of[i].severity;
    }
  }

  const oFr = original.fullReport as { detailedFindings?: Array<{ severity?: string }> } | undefined;
  const tFr = translated.fullReport as { detailedFindings?: Array<{ severity?: string }> } | undefined;
  if (oFr?.detailedFindings && tFr?.detailedFindings) {
    for (let i = 0; i < Math.min(oFr.detailedFindings.length, tFr.detailedFindings.length); i++) {
      if (oFr.detailedFindings[i]?.severity != null) {
        tFr.detailedFindings[i].severity = oFr.detailedFindings[i].severity;
      }
    }
  }

  const opc = original.possibleCauses as { agePercent?: number; envPercent?: number } | undefined;
  const tpc = translated.possibleCauses as { agePercent?: number; envPercent?: number } | undefined;
  if (opc && tpc) {
    tpc.agePercent = opc.agePercent;
    tpc.envPercent = opc.envPercent;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const result = body.result as Record<string, unknown> | undefined;
    const targetLanguage = (body.targetLanguage || body.language || "English") as string;

    if (!result || typeof result !== "object") {
      return new Response(JSON.stringify({ error: "result object required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Translation is not configured. Set LOVABLE_API_KEY in Supabase Edge Function secrets.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = JSON.stringify(result);
    const system = `You are a medical translator. The user sends JSON: a simplified patient-facing medical report analysis.

Output ONLY valid JSON with the exact same keys and nesting as the input. No markdown fences, no commentary before or after the JSON.

Translate every patient-visible string into: ${targetLanguage}
Use clear, calm, plain language appropriate for patients.

STRICT — copy these machine fields EXACTLY from input (same spelling/casing):
- worryLevel (one of: Low, Mild, Moderate, High)
- worryColor (one of: green, yellow, orange, red)
- findings[].severity (each: normal, mild, moderate, or severe — English lowercase)
- fullReport.detailedFindings[].severity (same English tokens as input)
- possibleCauses.agePercent and possibleCauses.envPercent (numbers, unchanged)

Translate all other string values including summary, aiExplanation, findings term/explanation, whatThisMeans, nextSteps, possibleCauses string arrays, and everything under fullReport.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        max_tokens: 16384,
        messages: [
          { role: "system", content: system },
          { role: "user", content: payload },
        ],
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("translate-analysis AI error", aiResp.status, txt);
      return new Response(
        JSON.stringify({ error: `Translation service error (${aiResp.status})`, details: txt.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Empty translation response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: unknown;
    try {
      parsed = parseJsonLenient(content);
    } catch (e) {
      console.error("translate parse failed", e, content.slice(0, 800));
      return new Response(JSON.stringify({ error: "Translation returned invalid JSON" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!looksLikeAnalysis(parsed)) {
      return new Response(JSON.stringify({ error: "Translation shape invalid" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out = parsed as Record<string, unknown>;
    preserveMachineFields(result, out);

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-analysis", e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

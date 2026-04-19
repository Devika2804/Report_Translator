import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reportText, language, userId, userName, userPhone, userEmail } = await req.json()

    if (!reportText || reportText.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Report text is too short.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set')
    }

    const targetLanguage = language || 'English'

    const systemPrompt = `You are an expert radiologist and medical report analyzer named Decodex.

YOUR PRIMARY RULE: Read the report EXTREMELY carefully. Extract EVERY abnormal finding mentioned.
NEVER say findings are normal if the report mentions abnormalities.

This report contains medical findings. Your job is:
1. Read every single line of the report
2. Extract ALL pathological findings (abnormalities, diseases, lesions, opacities, etc.)
3. Explain each finding in simple patient-friendly language
4. Assign correct severity based on the actual findings
5. Give accurate worry level — if report has consolidation, effusion, infarcts, or serious findings → worryLevel must be "Moderate" or "High"

SEVERITY GUIDE:
- "normal": structure/organ explicitly stated as normal in report
- "mild": minor findings, early changes, age-related changes
- "moderate": significant findings needing medical attention (effusion, consolidation, infarcts, ischemic changes)
- "severe": emergency findings (hemorrhage, large vessel occlusion, malignancy, tension pneumothorax)

WORRY LEVEL GUIDE:
- "Low" (green): truly normal report, no abnormalities
- "Mild" (yellow): minor findings, routine follow-up needed
- "Moderate" (orange): significant findings, doctor visit needed soon
- "High" (red): serious findings, urgent medical attention needed

LANGUAGE: Respond in ${targetLanguage}. ALL text fields must be in ${targetLanguage}.

CRITICAL: Return ONLY valid JSON. No markdown. No text before or after the JSON.`

    const userPrompt = `IMPORTANT: This report has REAL medical findings. Read carefully and extract ALL of them.

DO NOT say the report is normal if it mentions any of these or similar:
- opacity, consolidation, effusion, infarct, ischemia, hemorrhage, lesion, mass, calcification,
  stenosis, occlusion, atrophy, cardiomegaly, haziness, blunting, pleural changes, vascular changes

MEDICAL REPORT TO ANALYZE:
===START OF REPORT===
${reportText}
===END OF REPORT===

Extract every single finding from above and return this JSON in ${targetLanguage}:

{
  "summary": [
    "State what TYPE of report this is (X-ray/MRI/CT/Blood test etc)",
    "State the MOST SERIOUS finding from the report in simple words",
    "State the SECOND most important finding",
    "State what the overall impression/conclusion says",
    "State what follow-up is recommended"
  ],
  "aiExplanation": "Write 3 paragraphs. Para 1: Explain what was found in this report in simple words. Para 2: What do these findings mean for the patient's health. Para 3: What the patient should do next. Be accurate, warm, and clear. Use simple non-medical language.",
  "findings": [
    {
      "term": "Copy exact medical term from report",
      "explanation": "Explain what this specific finding means in simple words a patient can understand",
      "severity": "normal OR mild OR moderate OR severe based on actual clinical significance"
    }
  ],
  "whatThisMeans": "Explain in 2-3 sentences what these findings mean for the patient's daily life, health, and what they should prioritize.",
  "worryLevel": "Choose based on actual findings: Low/Mild/Moderate/High",
  "worryColor": "green for Low, yellow for Mild, orange for Moderate, red for High",
  "possibleCauses": {
    "ageRelated": [
      "Age-related cause specifically relevant to findings in THIS report",
      "Second age-related cause",
      "Third age-related cause",
      "Fourth age-related cause"
    ],
    "environmental": [
      "Environmental/lifestyle cause specifically relevant to findings in THIS report",
      "Second environmental cause",
      "Third cause",
      "Fourth cause"
    ],
    "agePercent": 55,
    "envPercent": 45
  },
  "nextSteps": [
    "Most urgent action based on THIS report's specific findings",
    "Second specific action",
    "Third specific action",
    "Fourth specific action",
    "Fifth specific action"
  ],
  "fullReport": {
    "reportType": "Exact report type detected from the report",
    "detailedFindings": [
      {
        "finding": "Short name of finding",
        "term": "Exact medical term from report",
        "severity": "Normal OR Mild OR Moderate OR Severe",
        "explanation": "Detailed plain language explanation of this specific finding",
        "action": "Specific action patient should take for this finding"
      }
    ],
    "clinicalInterpretation": [
      "Overall clinical picture paragraph in plain language",
      "What this means for the patient's daily life",
      "Specific warning signs the patient should watch for based on these findings"
    ],
    "avoidList": [
      "Specific thing to avoid based on actual findings in this report",
      "Second specific avoidance",
      "Third avoidance",
      "Fourth avoidance"
    ],
    "helpList": [
      "Specific helpful action based on actual findings",
      "Second helpful action",
      "Third helpful action",
      "Fourth helpful action"
    ],
    "doctorQuestions": [
      "Specific question about the most serious finding in this report",
      "Question about treatment options for these findings",
      "Question about follow-up tests mentioned in the report",
      "Question about lifestyle changes needed",
      "Question about prognosis"
    ]
  }
}

REMINDER: ALL text must be in ${targetLanguage} language. Return ONLY the JSON object.`

    // Call Groq API (free, fast)
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 6000,
        response_format: { type: 'json_object' }
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('Groq API error:', errText)
      throw new Error(`Groq API failed: ${aiResponse.status} - ${errText}`)
    }

    const aiData = await aiResponse.json()
    const rawContent = aiData.choices?.[0]?.message?.content

    if (!rawContent) {
      throw new Error('No response from xAI')
    }

    // Parse the JSON response
    let result
    try {
      const cleaned = rawContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      result = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw:', rawContent)
      throw new Error('AI returned invalid JSON format')
    }

    // Validate required fields exist
    if (!result.summary || !result.findings || !result.worryLevel) {
      throw new Error('AI response missing required fields')
    }

    // Save to Supabase database
    const SUPABASE_URL = Deno.env.get('APP_SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('APP_SERVICE_ROLE_KEY')

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/report_analyses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: userId || null,
            report_text: reportText.substring(0, 500),
            worry_level: result.worryLevel || 'Unknown',
            language: targetLanguage,
            summary: Array.isArray(result.summary) 
              ? result.summary.join(' | ') 
              : String(result.summary),
            name: userName || 'Anonymous',
            phone: userPhone || 'Not provided',
            created_at: new Date().toISOString(),
          }),
        })
        console.log('Saved to DB successfully')
      } catch (dbError) {
        console.error('DB save error (non-fatal):', dbError)
      }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed. Please try again.', 
        details: msg 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

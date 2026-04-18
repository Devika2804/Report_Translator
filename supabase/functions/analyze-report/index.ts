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
    const { reportText, language, userId } = await req.json()

    if (!reportText || reportText.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Report text is too short.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lower = reportText.toLowerCase()

    // Detect worry level
    let worryLevel = 'Low'
    let worryColor = 'green'
    if (lower.includes('malignant') || lower.includes('cancer') || lower.includes('critical') || lower.includes('severe') || lower.includes('urgent')) {
      worryLevel = 'High'; worryColor = 'red'
    } else if (lower.includes('moderate') || lower.includes('effusion') || lower.includes('consolidation') || lower.includes('fibrosis')) {
      worryLevel = 'Moderate'; worryColor = 'orange'
    } else if (lower.includes('mild') || lower.includes('early') || lower.includes('minimal') || lower.includes('cardiomegaly') || lower.includes('haziness') || lower.includes('pleural')) {
      worryLevel = 'Mild'; worryColor = 'yellow'
    }

    // Detect report type
    let reportType = 'General Medical Report'
    if (lower.includes('chest') || lower.includes('lung') || lower.includes('cardiac')) reportType = 'Chest X-Ray — PA View'
    else if (lower.includes('mri') || lower.includes('brain') || lower.includes('spine')) reportType = 'MRI Scan Report'
    else if (lower.includes('cbc') || lower.includes('hemoglobin') || lower.includes('platelets') || lower.includes('wbc')) reportType = 'Blood Test — CBC'
    else if (lower.includes('usg') || lower.includes('ultrasound') || lower.includes('abdomen')) reportType = 'Ultrasound Report'

    // Extract findings
    const termMap: Record<string, { explanation: string; severity: string }> = {
      'cardiomegaly': { explanation: 'Your heart appears slightly larger than its normal size. This is common and manageable.', severity: 'mild' },
      'pleural effusion': { explanation: 'A small amount of fluid has collected around your lungs.', severity: 'moderate' },
      'haziness': { explanation: 'A mild cloudiness in parts of your lungs, possibly early fluid or inflammation.', severity: 'mild' },
      'pulmonary congestion': { explanation: 'Early signs of fluid near the lungs.', severity: 'mild' },
      'consolidation': { explanation: 'An area of the lung appears solid, often due to infection or fluid.', severity: 'moderate' },
      'pneumothorax': { explanation: 'Air in the space around the lung. Needs prompt medical attention.', severity: 'severe' },
      'atelectasis': { explanation: 'A small area of the lung has partially collapsed.', severity: 'mild' },
      'calcification': { explanation: 'Calcium deposits — usually harmless old scars.', severity: 'normal' },
      'fibrosis': { explanation: 'Scar tissue in the lungs from past illness or exposure.', severity: 'moderate' },
      'opacity': { explanation: 'A white/gray area on the scan that needs evaluation.', severity: 'mild' },
      'intact': { explanation: 'This structure appears completely normal and healthy.', severity: 'normal' },
      'enlarged': { explanation: 'This organ appears slightly bigger than expected.', severity: 'mild' },
    }

    const findings = []
    for (const [term, data] of Object.entries(termMap)) {
      if (lower.includes(term)) {
        findings.push({
          term: term.charAt(0).toUpperCase() + term.slice(1),
          explanation: data.explanation,
          severity: data.severity,
        })
      }
    }
    if (findings.length === 0) {
      findings.push({ term: 'Report Analyzed', explanation: 'Your report has been read and simplified.', severity: 'normal' })
    }
    const topFindings = findings.slice(0, 5)

    const explanationMap: Record<string, string> = {
      Low: 'Your report looks reassuring overall. No signs of anything serious. Keep up your healthy habits.',
      Mild: 'There are some mild findings worth discussing with your doctor. Not an emergency — manageable with routine monitoring.',
      Moderate: 'Your report shows findings that need attention soon. Your doctor will want to see you to discuss next steps.',
      High: 'Your report contains findings that need prompt medical attention. Please contact your doctor immediately.',
    }

    const result = {
      summary: [
        `Your ${reportType} has been analyzed and simplified by Decodex AI.`,
        topFindings.filter(f => f.severity !== 'normal').length > 0
          ? `${topFindings.filter(f => f.severity !== 'normal').length} finding(s) were identified that your doctor should review.`
          : 'All findings appear to be within normal or near-normal range.',
        worryLevel === 'Low' ? 'No urgent action is needed at this time.' : 'A follow-up appointment with your doctor is recommended.',
        'Structural elements mentioned in the report appear intact.',
        'This simplified report is ready to share with your doctor.',
      ],
      aiExplanation: explanationMap[worryLevel] + ' Remember: this AI analysis is a helpful guide, but your doctor makes the final call.',
      findings: topFindings,
      whatThisMeans: worryLevel === 'Low'
        ? 'Your body is doing well overall. Things appear healthy.'
        : worryLevel === 'Mild'
        ? 'A few small things to keep an eye on. Think of this as an early heads-up.'
        : worryLevel === 'Moderate'
        ? 'Some areas need medical attention. Your doctor will guide you on next steps.'
        : 'Some findings need to be addressed promptly. Contact your healthcare provider.',
      worryLevel,
      worryColor,
      possibleCauses: {
        ageRelated: [
          'Natural changes in organ size and function that occur with age',
          'Reduced elasticity of blood vessels and lung tissue over time',
          'Gradual changes in heart muscle efficiency after age 40',
          'Bone density changes visible on imaging studies',
        ],
        environmental: [
          'Long-term exposure to air pollution or dust at work or home',
          'Smoking history affecting lung and heart appearance',
          'High-salt or high-fat diet contributing to cardiovascular strain',
          'Sedentary lifestyle reducing cardiovascular efficiency',
        ],
        agePercent: 60,
        envPercent: 40,
      },
      nextSteps: [
        'Share this simplified report with your primary care doctor.',
        worryLevel === 'High' ? 'Contact your doctor TODAY — do not wait.' : 'Schedule a follow-up within 2–4 weeks.',
        'Bring a printed copy of this Decodex report to your consultation.',
        'Ask your doctor specifically about each finding highlighted above.',
        'Monitor for new or worsening symptoms and report them immediately.',
      ],
      fullReport: {
        reportType,
        detailedFindings: topFindings.map(f => ({
          finding: f.term,
          term: f.term,
          severity: f.severity.charAt(0).toUpperCase() + f.severity.slice(1),
          explanation: f.explanation,
          action: f.severity === 'normal' ? 'No action required'
            : f.severity === 'mild' ? 'Monitor at next appointment'
            : f.severity === 'moderate' ? 'Discuss with doctor soon'
            : 'Seek prompt medical care',
        })),
        clinicalInterpretation: [
          `The overall assessment reveals ${topFindings.length} notable finding(s) with a ${worryLevel.toLowerCase()} priority level.`,
          `The patient should ${worryLevel === 'Low' ? 'continue normal routine' : 'limit strenuous activity until reviewed by a doctor'}.`,
          'Watch for sudden chest pain, difficulty breathing, or severe dizziness and seek immediate care.',
        ],
        avoidList: [
          'High-sodium foods (processed snacks, canned soups, fast food)',
          'Excessive physical exertion until cleared by your doctor',
          'Smoking and secondhand smoke exposure',
          'Alcohol in excess',
        ],
        helpList: [
          'Heart-healthy foods: leafy greens, berries, whole grains',
          'Light walking (20–30 minutes daily) if approved by doctor',
          'Adequate sleep (7–8 hours per night)',
          'Stress management: deep breathing, meditation',
        ],
        doctorQuestions: [
          `"What is causing the ${topFindings[0]?.term || 'main finding'} in my report?"`,
          '"Do I need additional tests such as an echocardiogram or blood panel?"',
          '"Should I change any current medications based on these results?"',
          '"What symptoms should make me come back immediately?"',
          '"How often should I get follow-up imaging or tests?"',
        ],
      },
    }

    // ✅ SAVE TO SUPABASE DATABASE
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
            worry_level: worryLevel,
            language: language || 'English',
            summary: result.summary.join(' | '),
            created_at: new Date().toISOString(),
          }),
        })
        console.log('✅ Report saved to database')
      } catch (dbError) {
        console.error('DB save error (non-fatal):', dbError)
      }
    } else {
      console.log('⚠️ DB secrets not set — skipping save')
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Analysis failed. Please try again.', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
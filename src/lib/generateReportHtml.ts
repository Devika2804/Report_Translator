// Plain TypeScript (no JSX) — safe to use template literals with raw HTML

/* eslint-disable @typescript-eslint/no-explicit-any */

export function buildReportHtml(params: {
  analysis: any
  reportText: string
  language: string
  today: string
  reportId: string
}): string {
  const { analysis, reportText, language, today, reportId } = params

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Sans+Tamil:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans+Malayalam:wght@400;700&family=Noto+Sans+Telugu:wght@400;700&family=Noto+Sans+Bengali:wght@400;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Noto Sans', 'Noto Sans Tamil', 'Noto Sans Devanagari',
                   'Noto Sans Malayalam', 'Noto Sans Telugu', 'Noto Sans Bengali',
                   Arial Unicode MS, sans-serif;
      font-size: 14px; line-height: 1.6; color: #1e293b;
      padding: 40px; max-width: 800px; margin: 0 auto;
    }
    .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: 700; color: #2563eb; letter-spacing: 2px; }
    .logo-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
    .report-meta { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
    .meta-item { display: flex; flex-direction: column; gap: 2px; }
    .meta-label { color: #64748b; font-size: 11px; text-transform: uppercase; }
    .meta-value { color: #1e293b; font-weight: 600; }
    .section { margin-bottom: 28px; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .section-header { background: #2563eb; color: white; padding: 10px 16px; font-weight: 700; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
    .section-body { padding: 16px; }
    .summary-item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
    .summary-item:last-child { border-bottom: none; }
    .bullet { width: 8px; height: 8px; background: #2563eb; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
    .worry-badge { display: inline-block; padding: 8px 24px; border-radius: 20px; font-weight: 700; font-size: 16px; margin: 8px 0; }
    .worry-Low { background: #dcfce7; color: #166534; }
    .worry-Mild { background: #fef9c3; color: #854d0e; }
    .worry-Moderate { background: #ffedd5; color: #9a3412; }
    .worry-High { background: #fee2e2; color: #991b1b; }
    .finding-item { padding: 10px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #2563eb; background: #f8fafc; }
    .finding-term { font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .finding-exp { color: #475569; font-size: 13px; }
    .severity-normal { border-left-color: #22c55e; }
    .severity-mild { border-left-color: #eab308; }
    .severity-moderate { border-left-color: #f97316; }
    .severity-severe { border-left-color: #ef4444; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .cause-box { padding: 12px; border-radius: 8px; }
    .cause-age { background: #faf5ff; border: 1px solid #e9d5ff; }
    .cause-env { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .cause-title { font-weight: 700; margin-bottom: 8px; font-size: 13px; }
    .cause-age .cause-title { color: #7c3aed; }
    .cause-env .cause-title { color: #16a34a; }
    ul { padding-left: 16px; }
    ul li { padding: 3px 0; color: #475569; font-size: 13px; }
    ol { padding-left: 16px; }
    ol li { padding: 4px 0; color: #475569; font-size: 13px; }
    .next-step-item { display: flex; gap: 10px; padding: 8px; margin-bottom: 6px; background: #f0f9ff; border-radius: 6px; }
    .step-num { width: 24px; height: 24px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; color: #475569; border: 1px solid #e2e8f0; }
    td { padding: 8px 12px; border: 1px solid #e2e8f0; color: #1e293b; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
    .disclaimer { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; font-size: 12px; color: #9a3412; text-align: center; margin-top: 24px; }
    .footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
    @media print { body { padding: 20px; } .section { break-inside: avoid; } }
  `

  const summaryRows = (analysis?.summary || []).map((item: string) =>
    '<div class="summary-item"><div class="bullet"></div><div>' + item + '</div></div>'
  ).join('')

  const findingRows = (analysis?.findings || []).map((f: any, i: number) =>
    '<div class="finding-item severity-' + (f.severity || '') + '">' +
    '<div class="finding-term">Finding ' + (i + 1) + ': ' + (f.term || '') + '</div>' +
    '<div class="finding-exp">' + (f.explanation || '') + '</div>' +
    '<div style="margin-top:4px;"><span style="font-size:11px;background:#e2e8f0;padding:2px 8px;border-radius:10px;color:#475569;">' +
    ((f.severity || '').toUpperCase()) + '</span></div></div>'
  ).join('')

  const detailedRows = (analysis?.fullReport?.detailedFindings || []).map((f: any) =>
    '<tr><td><strong>' + (f.term || '') + '</strong></td><td>' + (f.severity || '') +
    '</td><td>' + (f.explanation || '') + '</td><td>' + (f.action || '') + '</td></tr>'
  ).join('')

  const ageFactors = (analysis?.possibleCauses?.ageRelated || []).map((c: string) => '<li>' + c + '</li>').join('')
  const envFactors = (analysis?.possibleCauses?.environmental || []).map((c: string) => '<li>' + c + '</li>').join('')

  const clinicalPs = (analysis?.fullReport?.clinicalInterpretation || []).map((p: string) =>
    '<p style="margin-bottom:12px;line-height:1.8;">' + p + '</p>'
  ).join('')

  const avoidItems = (analysis?.fullReport?.avoidList || []).map((a: string) => '<li>' + a + '</li>').join('')
  const helpItems = (analysis?.fullReport?.helpList || []).map((h: string) => '<li>' + h + '</li>').join('')

  const nextSteps = (analysis?.nextSteps || []).map((step: string, i: number) =>
    '<div class="next-step-item"><div class="step-num">' + (i + 1) + '</div><div>' + step + '</div></div>'
  ).join('')

  const doctorQs = (analysis?.fullReport?.doctorQuestions || []).map((q: string) =>
    '<li style="margin-bottom:8px;">' + q + '</li>'
  ).join('')

  const worryLevel = analysis?.worryLevel || 'Low'

  return '<!DOCTYPE html>' +
    '<html lang="en"><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Decodex Report - ' + reportId + '</title>' +
    '<style>' + CSS + '</style>' +
    '</head><body>' +

    '<div class="header">' +
    '<div class="logo">&#x2695; DECODEX</div>' +
    '<div class="logo-sub">AI-Powered Medical Report Decoder</div>' +
    '</div>' +

    '<div class="report-meta">' +
    '<div class="meta-item"><span class="meta-label">Report ID</span><span class="meta-value">' + reportId + '</span></div>' +
    '<div class="meta-item"><span class="meta-label">Generated On</span><span class="meta-value">' + today + '</span></div>' +
    '<div class="meta-item"><span class="meta-label">Report Type</span><span class="meta-value">' + (analysis?.fullReport?.reportType || 'Medical Report') + '</span></div>' +
    '<div class="meta-item"><span class="meta-label">Language</span><span class="meta-value">' + language + '</span></div>' +
    '<div class="meta-item"><span class="meta-label">Analyzed By</span><span class="meta-value">Decodex AI v2.0</span></div>' +
    '</div>' +

    '<div class="section"><div class="section-header">Executive Summary</div><div class="section-body">' + summaryRows + '</div></div>' +

    '<div class="section"><div class="section-header">Worry Level</div>' +
    '<div class="section-body" style="text-align:center;padding:20px;">' +
    '<div class="worry-badge worry-' + worryLevel + '">' + worryLevel + ' Priority</div>' +
    '<p style="color:#64748b;font-size:13px;margin-top:8px;">' + (analysis?.whatThisMeans || '') + '</p>' +
    '</div></div>' +

    '<div class="section"><div class="section-header">AI Explanation</div>' +
    '<div class="section-body"><p style="line-height:1.8;">' + (analysis?.aiExplanation || '') + '</p></div></div>' +

    '<div class="section"><div class="section-header">Findings Breakdown</div><div class="section-body">' + findingRows + '</div></div>' +

    '<div class="section"><div class="section-header">Detailed Findings Table</div><div class="section-body">' +
    '<table><thead><tr><th>Finding</th><th>Severity</th><th>Explanation</th><th>Action</th></tr></thead>' +
    '<tbody>' + detailedRows + '</tbody></table></div></div>' +

    '<div class="section"><div class="section-header">Possible Cause Insights</div><div class="section-body"><div class="two-col">' +
    '<div class="cause-box cause-age"><div class="cause-title">Age-Related Factors (' + (analysis?.possibleCauses?.agePercent || 60) + '%)</div><ul>' + ageFactors + '</ul></div>' +
    '<div class="cause-box cause-env"><div class="cause-title">Environmental Factors (' + (analysis?.possibleCauses?.envPercent || 40) + '%)</div><ul>' + envFactors + '</ul></div>' +
    '</div></div></div>' +

    '<div class="section"><div class="section-header">Clinical Interpretation</div><div class="section-body">' + clinicalPs + '</div></div>' +

    '<div class="section"><div class="section-header">Lifestyle Guidance</div><div class="section-body"><div class="two-col">' +
    '<div><div style="font-weight:700;color:#ef4444;margin-bottom:8px;">What to Avoid</div><ul>' + avoidItems + '</ul></div>' +
    '<div><div style="font-weight:700;color:#16a34a;margin-bottom:8px;">What Helps</div><ul>' + helpItems + '</ul></div>' +
    '</div></div></div>' +

    '<div class="section"><div class="section-header">Suggested Next Steps</div><div class="section-body">' + nextSteps + '</div></div>' +

    '<div class="section"><div class="section-header">Questions to Ask Your Doctor</div><div class="section-body"><ol>' + doctorQs + '</ol></div></div>' +

    '<div class="section"><div class="section-header">Original Report Text</div>' +
    '<div class="section-body"><p style="font-family:monospace;font-size:12px;white-space:pre-wrap;color:#475569;background:#f8fafc;padding:12px;border-radius:6px;line-height:1.7;">' +
    (reportText || 'Not available') + '</p></div></div>' +

    '<div class="disclaimer">&#x26A0;&#xFE0F; This report is generated by Decodex AI for informational and educational purposes only. ' +
    'It does NOT constitute medical advice, diagnosis, or treatment. ' +
    'Always consult a qualified healthcare professional for medical decisions.<br><br>' +
    'Support: support@decodex.com | +91-9999999999</div>' +

    '<div class="footer">Generated by Decodex AI v2.0 &middot; ' + today + ' &middot; Report ID: ' + reportId + '</div>' +

    '</body></html>'
}

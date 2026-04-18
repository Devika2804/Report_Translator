export const sampleReport = `Chest X-ray PA view: Mild cardiomegaly noted. Lung fields show mild haziness in bilateral lower zones, suggestive of early pulmonary congestion. No pneumothorax. Costophrenic angles are blunted bilaterally. Bony thorax is intact. Impression: Mild cardiomegaly with early signs of congestive cardiac failure.`;

export const sampleExplanation = `Your chest X-ray shows that your heart is slightly larger than usual, and there are some early signs of fluid buildup in the lower parts of your lungs. This is something your doctor will want to monitor, but it is not an emergency. The bones in your chest look completely normal.`;

export const sampleFindings = [
  { term: "Cardiomegaly", plain: "Your heart appears slightly larger than normal size" },
  { term: "Bilateral lower zone haziness", plain: "A mild cloudiness in the lower part of both lungs, possibly early fluid" },
  { term: "Pulmonary congestion", plain: "Early signs of fluid around the lungs" },
  { term: "Blunted costophrenic angles", plain: "Small amount of fluid in the spaces around your lungs" },
];

export const summaryBullets = [
  "Your heart is slightly enlarged but not severely",
  "There are early signs of fluid in your lungs",
  "No collapsed lung or major emergency findings",
  "Bones of your chest are completely normal",
  "Recommend follow-up with your doctor for monitoring",
];

export const recentReports = [
  { name: "Chest X-Ray Report", date: "Jan 15, 2025", level: "Mild", color: "warning", snippet: "Mild cardiomegaly with early signs..." },
  { name: "Blood Test – CBC", date: "Dec 28, 2024", level: "Low", color: "success", snippet: "All values within normal range." },
  { name: "MRI Brain Scan", date: "Nov 10, 2024", level: "Moderate", color: "warning", snippet: "Small white matter changes noted." },
];

export const languages = [
  { flag: "🇬🇧", name: "English", native: "English", code: "en-US" },
  { flag: "🇮🇳", name: "Hindi", native: "हिंदी", code: "hi-IN" },
  { flag: "🇮🇳", name: "Tamil", native: "தமிழ்", code: "ta-IN" },
  { flag: "🇮🇳", name: "Bengali", native: "বাংলা", code: "bn-IN" },
  { flag: "🇮🇳", name: "Telugu", native: "తెలుగు", code: "te-IN" },
  { flag: "🇮🇳", name: "Kannada", native: "ಕನ್ನಡ", code: "kn-IN" },
  { flag: "🇮🇳", name: "Marathi", native: "मराठी", code: "mr-IN" },
  { flag: "🇮🇳", name: "Malayalam", native: "മലയാളം", code: "ml-IN" },
  { flag: "🇪🇸", name: "Spanish", native: "Español", code: "es-ES" },
  { flag: "🇫🇷", name: "French", native: "Français", code: "fr-FR" },
  { flag: "🇸🇦", name: "Arabic", native: "العربية", code: "ar-SA" },
  { flag: "🇨🇳", name: "Chinese", native: "中文", code: "zh-CN" },
  { flag: "🇩🇪", name: "German", native: "Deutsch", code: "de-DE" },
  { flag: "🇵🇹", name: "Portuguese", native: "Português", code: "pt-PT" },
  { flag: "🇯🇵", name: "Japanese", native: "日本語", code: "ja-JP" },
];

export const getMockAIResponse = (question: string): string => {
  const q = question.toLowerCase();
  if (q.includes("serious") || q.includes("worry") || q.includes("scared"))
    return "Based on your report, the findings are mild and not immediately serious. Your doctor will want to monitor this over the next few weeks, but there is no reason to panic. Regular check-ups and following your doctor's advice will be key.";
  if (q.includes("mean") || q.includes("what does") || q.includes("explain"))
    return "The findings in your report suggest some mild changes that are common and manageable. Think of it as your body sending an early signal — which is actually a good thing, because early detection means easier treatment.";
  if (q.includes("next") || q.includes("do") || q.includes("step"))
    return "The most important next step is to share this simplified report with your doctor. Based on the findings, a follow-up appointment within 2-4 weeks is recommended. In the meantime, avoid strenuous activity and maintain a healthy diet.";
  return "That's a great question. Based on your report findings, I recommend discussing this specific concern with your doctor, who can provide personalized guidance. The AI analysis shows mild findings that are worth monitoring but not an emergency.";
};

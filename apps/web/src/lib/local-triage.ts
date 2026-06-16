const EMERGENCY_KEYWORDS = [
  "chest pain", "cardiac arrest", "stroke", "seizure", "anaphylaxis",
  "severe bleeding", "unconscious", "unresponsive", "cardiac", "myocardial",
  "pulmonary embolism", "respiratory failure", "sepsis", "trauma",
  "overdose", "hemorrhage", "acute", "emergency", "critical",
];

const URGENT_KEYWORDS = [
  "severe", "worsening", "high fever", "fracture", "laceration",
  "infection", "abscess", "appendicitis", "kidney stone", "migraine",
  "dehydration", "asthma attack", "allergic reaction", "blood pressure",
  "diabetes", "insulin", "pneumonia", "urgent", "pain",
];

const SAME_DAY_KEYWORDS = [
  "follow-up", "followup", "recheck", "lab results", "test results",
  "medication refill", "prescription", "imaging", "x-ray", "mri",
  "referral", "consultation", "biopsy", "symptoms", "cough", "fever",
  "headache", "dizziness", "nausea", "vomiting",
];

const ROUTINE_KEYWORDS = [
  "annual", "physical", "screening", "wellness", "checkup", "check-up",
  "preventive", "vaccination", "immunization", "routine", "scheduled",
  "maintenance", "monitoring", "stable", "chronic management",
];

const ADMIN_KEYWORDS = [
  "paperwork", "insurance", "billing", "records", "transfer",
  "documentation", "form", "authorization", "administrative",
  "scheduling", "appointment", "registration", "discharge summary",
];

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, kw) => count + (lower.includes(kw) ? 1 : 0), 0);
}

export interface LocalTriageResult {
  category: string;
  priority_score: number;
  confidence: number;
  reasoning: string;
  routing_recommendation: string;
  missing_info: string[];
  critical_keywords_found: string[];
  human_review_required: boolean;
  consensus_percentage: number;
}

export function triageNote(title: string, content: string): LocalTriageResult {
  const text = `${title} ${content}`;
  const lower = text.toLowerCase();

  const scores = {
    emergency: countMatches(text, EMERGENCY_KEYWORDS),
    urgent: countMatches(text, URGENT_KEYWORDS),
    same_day: countMatches(text, SAME_DAY_KEYWORDS),
    routine: countMatches(text, ROUTINE_KEYWORDS),
    administrative: countMatches(text, ADMIN_KEYWORDS),
  };

  const entries = Object.entries(scores) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const [topCategory, topScore] = entries[0];
  const totalMatches = entries.reduce((s, [, v]) => s + v, 0);

  const category = topScore > 0 ? topCategory : "routine";

  const priorityMap: Record<string, number> = {
    emergency: 95,
    urgent: 75,
    same_day: 55,
    routine: 30,
    administrative: 15,
  };
  const basePriority = priorityMap[category];
  const priority_score = Math.min(100, basePriority + Math.min(topScore * 3, 15));

  const confidence = totalMatches === 0
    ? 45
    : Math.min(95, 50 + topScore * 10 + (topScore > entries[1][1] ? 15 : 0));

  const criticalFound = EMERGENCY_KEYWORDS.filter((kw) => lower.includes(kw));

  const missingInfo: string[] = [];
  if (!lower.match(/\b\d+\s*(year|yr|y\.?o\.?|month|mo)\b/)) missingInfo.push("Patient age");
  if (!lower.match(/\b(male|female|patient|m|f)\b/i)) missingInfo.push("Patient gender");
  if (!lower.match(/\b(mg|ml|tablet|capsule|dose|medication|drug)\b/)) missingInfo.push("Current medications");
  if (!lower.match(/\b(history|hx|previous|prior|chronic)\b/)) missingInfo.push("Medical history");

  const routingMap: Record<string, string> = {
    emergency: "Immediate physician review — flag for emergency department",
    urgent: "Priority queue — route to on-call physician within 2 hours",
    same_day: "Same-day review — route to primary care provider",
    routine: "Standard queue — schedule for next available appointment",
    administrative: "Administrative processing — route to medical records team",
  };

  const humanReview = category === "emergency" || confidence < 60 || criticalFound.length > 0;

  return {
    category,
    priority_score,
    confidence,
    reasoning: `Keyword analysis identified ${topScore} ${category}-level indicators in the clinical note. ${criticalFound.length > 0 ? `Critical keywords detected: ${criticalFound.join(", ")}.` : ""} ${missingInfo.length > 0 ? `Some clinical context is missing which may affect accuracy.` : "Sufficient clinical context provided."}`,
    routing_recommendation: routingMap[category],
    missing_info: missingInfo,
    critical_keywords_found: criticalFound,
    human_review_required: humanReview,
    consensus_percentage: confidence > 80 ? 92 : confidence > 60 ? 78 : 55,
  };
}

const EMERGENCY_KEYWORDS: string[] = [
  "dangerous", "flooding", "flooded", "live wire", "collapsed", "fire",
  "accident", "emergency", "urgent", "critical", "life-threatening",
  "children at risk", "death", "electrocution", "sewage", "toxic",
  "hazardous", "gas leak", "sinkhole", "crack", "broken", "blocked road",
  "overflow", "contaminated",
];

const FRUSTRATED_KEYWORDS: string[] = [
  "months", "years", "ignored", "no action", "nothing done", "useless",
  "waste", "corrupt", "fed up", "sick of", "terrible", "pathetic",
  "disgusting", "shameful", "horrible", "worst", "nightmare",
  "unacceptable", "negligence", "incompetent",
];

export const analyzeSentiment = (text: string): number => {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let score = 0;

  for (const keyword of EMERGENCY_KEYWORDS) {
    if (lower.includes(keyword)) score += 3;
  }

  for (const keyword of FRUSTRATED_KEYWORDS) {
    if (lower.includes(keyword)) score += 2;
  }

  const exclamationCount = (text.match(/!/g) || []).length;
  score += Math.min(exclamationCount, 3);

  const capsRatio =
    text.length > 10
      ? (text.replace(/[^A-Z]/g, "").length / text.length) * 10
      : 0;
  score += Math.min(Math.floor(capsRatio), 3);

  return Math.min(score, 20);
};

export const shouldAutoBumpPriority = (sentimentScore: number): number => {
  if (sentimentScore >= 10) return 5;
  if (sentimentScore >= 7) return 4;
  if (sentimentScore >= 4) return 3;
  return 0;
};

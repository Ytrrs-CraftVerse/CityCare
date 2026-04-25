const CATEGORY_KEYWORDS: Record<string, string[]> = {
  pothole: [
    "pothole", "road damage", "crack", "broken road", "road repair",
    "bump", "dip", "hole in road", "road surface", "asphalt",
  ],
  streetlight: [
    "streetlight", "street light", "lamp", "dark street", "no light",
    "broken light", "pole", "bulb", "lighting", "dim",
  ],
  garbage: [
    "garbage", "trash", "waste", "dump", "rubbish", "litter",
    "dirty", "stinking", "filth", "debris", "pile",
  ],
  water: [
    "water", "leak", "pipe", "drain", "flooding", "sewage",
    "tap", "supply", "overflow", "contaminated", "tank",
  ],
};

const SEVERITY_KEYWORDS: Record<string, string[]> = {
  critical: [
    "collapsed", "flooding", "live wire", "fire", "explosion",
    "death", "sinkhole", "dangerous", "life-threatening",
  ],
  high: [
    "large", "huge", "massive", "deep", "blocked", "overflow",
    "broken main", "no supply", "major",
  ],
  medium: ["moderate", "medium", "noticeable", "growing", "spreading"],
  low: ["small", "minor", "tiny", "surface", "cosmetic", "hairline"],
};

export const suggestCategory = (text: string, filename?: string): string | null => {
  if (!text && !filename) return null;
  const combined = `${text || ""} ${filename || ""}`.toLowerCase();

  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (combined.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore > 0 ? bestCategory : null;
};

export const estimateSeverity = (text: string): string => {
  if (!text) return "medium";
  const lower = text.toLowerCase();

  for (const keyword of SEVERITY_KEYWORDS.critical) {
    if (lower.includes(keyword)) return "critical";
  }
  for (const keyword of SEVERITY_KEYWORDS.high) {
    if (lower.includes(keyword)) return "high";
  }
  for (const keyword of SEVERITY_KEYWORDS.low) {
    if (lower.includes(keyword)) return "low";
  }
  return "medium";
};

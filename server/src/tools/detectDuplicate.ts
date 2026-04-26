import crypto from "crypto";

export async function detectDuplicate(images: string[], description: string): Promise<boolean> {
  if (images.length === 0) return false;
  // Simplified for agent flow - in production this checks against DB
  return false;
}

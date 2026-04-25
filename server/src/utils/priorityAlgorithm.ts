import { IIssue } from "../models/Issue";

// ─── Weighted Priority Algorithm (ported from Java MASF logic) ──────────────
// Priority = (Severity * 0.5) + (Upvotes * 0.3) + (Days_Pending * 0.2)

const SEVERITY_SCORES: Record<string, number> = {
  low: 1,
  medium: 3,
  high: 6,
  critical: 10,
};

export function calculatePriorityScore(issue: IIssue): number {
  const severityWeight = 0.5;
  const upvoteWeight = 0.3;
  const timeWeight = 0.2;

  const severityScore = SEVERITY_SCORES[issue.severity] || 3;
  const upvotes = issue.upvotes || 0;

  const now = new Date();
  const created = new Date(issue.createdAt);
  const daysPending = Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));

  const raw = (severityScore * severityWeight) + (upvotes * upvoteWeight) + (daysPending * timeWeight);

  // Normalize to 1-10 scale
  return Math.min(10, Math.round(raw * 10) / 10);
}

// ─── Batch recalculate priorities for all open issues ───────────────────────
import Issue from "../models/Issue";

export async function recalculateAllPriorities(): Promise<number> {
  const openIssues = await Issue.find({ status: { $ne: "resolved" } });
  let updated = 0;

  for (const issue of openIssues) {
    const newScore = calculatePriorityScore(issue);
    const newPriority = Math.max(1, Math.min(5, Math.ceil(newScore / 2)));

    if (issue.priority !== newPriority) {
      issue.priority = newPriority;
      await issue.save();
      updated++;
    }
  }

  return updated;
}

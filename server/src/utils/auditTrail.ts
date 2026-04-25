import crypto from "crypto";
import AuditLog from "../models/AuditLog";
import { Types } from "mongoose";

interface AuditEntryParams {
  issueId: Types.ObjectId;
  action: string;
  performedBy?: Types.ObjectId | null;
  performedByName?: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
}

const computeHash = (previousHash: string, action: string, timestamp: string, details?: string): string => {
  const data = `${previousHash}|${action}|${timestamp}|${details || ""}`;
  return crypto.createHash("sha256").update(data).digest("hex");
};

export const createAuditEntry = async ({
  issueId,
  action,
  performedBy,
  performedByName,
  previousValue,
  newValue,
  details,
}: AuditEntryParams) => {
  const lastEntry = await AuditLog.findOne({ issueId }).sort({ createdAt: -1 });
  const previousHash = lastEntry ? lastEntry.hash : "GENESIS";
  const timestamp = new Date().toISOString();
  const hash = computeHash(previousHash, action, timestamp, details);

  const entry = new AuditLog({
    issueId,
    action,
    performedBy,
    performedByName: performedByName || "System",
    previousValue,
    newValue,
    details,
    hash,
    previousHash,
  });

  return await entry.save();
};

export const verifyAuditChain = async (issueId: string) => {
  const entries = await AuditLog.find({ issueId }).sort({ createdAt: 1 });
  if (entries.length === 0) return { valid: true, entries: 0 };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPreviousHash = i === 0 ? "GENESIS" : entries[i - 1].hash;

    if (entry.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        brokenAt: i,
        entry: entry._id,
        message: `Chain broken at entry ${i}: previousHash mismatch`,
      };
    }

    const recomputedHash = computeHash(
      entry.previousHash,
      entry.action,
      entry.createdAt.toISOString(),
      entry.details
    );

    if (entry.hash !== recomputedHash) {
      return {
        valid: false,
        brokenAt: i,
        entry: entry._id,
        message: `Chain broken at entry ${i}: hash mismatch (data tampered)`,
      };
    }
  }

  return { valid: true, entries: entries.length };
};

import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuditLog extends Document {
  issueId: Types.ObjectId;
  action: string;
  performedBy?: Types.ObjectId;
  performedByName: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
  hash: string;
  previousHash: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true, index: true },
    action: {
      type: String,
      enum: [
        "created", "status-changed", "assigned", "escalated", "resolved",
        "comment-added", "upvoted", "verified", "cost-updated", "deleted",
      ],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    performedByName: { type: String, default: "System" },
    previousValue: String,
    newValue: String,
    details: String,
    hash: { type: String, required: true },
    previousHash: { type: String, default: "GENESIS" },
  },
  { timestamps: true }
);

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
export default AuditLog;

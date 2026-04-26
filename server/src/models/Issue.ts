import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IComment {
  user: Types.ObjectId;
  userName: string;
  text: string;
  sentimentScore: number;
  createdAt: Date;
}

export interface IIssue extends Document {
  title: string;
  description: string;
  category: "garbage" | "pothole" | "streetlight" | "water" | "other";
  location: {
    type: string;
    coordinates: number[];
    address?: string;
  };
  status: "reported" | "in-progress" | "resolved" | "clarification" | "rejected";
  priority: number;
  image?: string;
  resolutionImage?: string;
  visualVerified?: boolean;
  agentFeedback?: string;
  isHotspot?: boolean;
  policyVerdict?: string;
  duplicateOf?: string;
  reportedBy?: Types.ObjectId;
  reportedByName: string;
  upvotes: number;
  upvotedBy: Types.ObjectId[];
  comments: IComment[];
  estimatedCost: number;
  actualCost: number;
  escalationLevel: "normal" | "elevated" | "critical";
  escalatedAt?: Date;
  sentimentScore: number;
  severity: "low" | "medium" | "high" | "critical";
  verifiedBy: Types.ObjectId[];
  verifiedCount: number;
  assignedTo?: string;
  governmentAsset?: {
    assetId: string;
    roadName: string;
    roadType: string;
    surface: string;
    contractor: string;
    constructionDate: string;
    warrantyActive: boolean;
    repairType: string;
    agency: string;
    source: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  userName: { type: String, default: "Anonymous" },
  text: { type: String, required: true },
  sentimentScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const issueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["garbage", "pothole", "streetlight", "water", "other"],
      required: true,
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
      address: String,
    },
    status: {
      type: String,
      enum: ["reported", "in-progress", "resolved", "clarification", "rejected"],
      default: "reported",
    },
    priority: { type: Number, default: 1, min: 1, max: 150 },
    image: String,
    resolutionImage: String,
    visualVerified: { type: Boolean, default: false },
    agentFeedback: String,
    isHotspot: { type: Boolean, default: false },
    policyVerdict: String,
    duplicateOf: String,
    reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reportedByName: { type: String, default: "Anonymous" },
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    escalationLevel: {
      type: String,
      enum: ["normal", "elevated", "critical"],
      default: "normal",
    },
    escalatedAt: Date,
    sentimentScore: { type: Number, default: 0 },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    verifiedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    verifiedCount: { type: Number, default: 0 },
    assignedTo: { type: String },
    governmentAsset: {
      assetId: String,
      roadName: String,
      roadType: String,
      surface: String,
      contractor: String,
      constructionDate: String,
      warrantyActive: Boolean,
      repairType: String,
      agency: String,
      source: String,
    },
  },
  { timestamps: true }
);

issueSchema.index({ location: "2dsphere" });
issueSchema.index({ status: 1, priority: -1 });
issueSchema.index({ category: 1 });
issueSchema.index({ createdAt: -1 });

const Issue: Model<IIssue> = mongoose.model<IIssue>("Issue", issueSchema);
export default Issue;

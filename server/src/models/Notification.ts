import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: "nearby-issue" | "issue-update" | "escalation" | "comment" | "verification" | "project-vote";
  message: string;
  issueId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["nearby-issue", "issue-update", "escalation", "comment", "verification", "project-vote"],
      required: true,
    },
    message: { type: String, required: true },
    issueId: { type: Schema.Types.ObjectId, ref: "Issue" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification: Model<INotification> = mongoose.model<INotification>("Notification", notificationSchema);
export default Notification;

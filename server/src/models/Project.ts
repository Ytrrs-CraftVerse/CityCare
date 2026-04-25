import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProject extends Document {
  title: string;
  description: string;
  ward: string;
  estimatedBudget: number;
  status: "proposed" | "approved" | "in-progress" | "completed" | "rejected";
  votes: { user: Types.ObjectId; points: number }[];
  totalVotePoints: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    ward: { type: String, required: true },
    estimatedBudget: { type: Number, required: true },
    status: {
      type: String,
      enum: ["proposed", "approved", "in-progress", "completed", "rejected"],
      default: "proposed",
    },
    votes: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        points: { type: Number, default: 1 },
      },
    ],
    totalVotePoints: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Project: Model<IProject> = mongoose.model<IProject>("Project", projectSchema);
export default Project;

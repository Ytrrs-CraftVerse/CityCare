import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "citizen" | "admin" | "super-admin";
  reputationScore: number;
  watchRadius: number;
  watchLocation: {
    type: string;
    coordinates: number[];
  };
  createdAt: Date;
  updatedAt: Date;
  matchPassword(entered: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["citizen", "admin", "super-admin"], default: "citizen" },
    reputationScore: { type: Number, default: 0 },
    watchRadius: { type: Number, default: 0 },
    watchLocation: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  { timestamps: true }
);

userSchema.index({ watchLocation: "2dsphere" });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered: string): Promise<boolean> {
  return await bcrypt.compare(entered, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;

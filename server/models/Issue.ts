import mongoose, { Document, Schema } from 'mongoose';

export interface IIssue extends Document {
  type: 'Pothole' | 'Streetlight' | 'Garbage' | 'Water Leak' | 'Other';
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  image?: string;
  status: 'Reported' | 'In Progress' | 'Resolved';
  userName: string;
  createdAt: Date;
}

const issueSchema: Schema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['Pothole', 'Streetlight', 'Garbage', 'Water Leak', 'Other'],
  },
  description: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  image: { type: String },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved'],
    default: 'Reported',
  },
  userName: { type: String, default: 'Anonymous' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IIssue>('Issue', issueSchema);

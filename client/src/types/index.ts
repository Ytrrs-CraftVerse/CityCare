export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin' | 'super-admin';
  reputationScore: number;
  watchRadius?: number;
  watchLocation?: { coordinates: number[] };
  token?: string;
}

export interface Location {
  type?: string;
  coordinates: number[];
  address?: string;
}

export type IssueCategory = 'garbage' | 'pothole' | 'streetlight' | 'water' | 'other';
export type IssueStatus = 'reported' | 'in-progress' | 'resolved';

export interface Comment {
  _id?: string;
  user: string;
  userName: string;
  text: string;
  sentimentScore: number;
  createdAt: string;
}

export interface Issue {
  _id: string;
  title: string;
  description: string;
  category: IssueCategory;
  location: Location;
  status: IssueStatus;
  priority: number;
  image?: string;
  reportedBy: string;
  reportedByName: string;
  upvotes: number;
  upvotedBy: string[];
  comments: Comment[];
  estimatedCost: number;
  actualCost: number;
  escalationLevel: 'normal' | 'elevated' | 'critical';
  escalatedAt?: string;
  sentimentScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  verifiedBy: string[];
  verifiedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueStats {
  total: number;
  resolved: number;
  inProgress: number;
  reported: number;
  byCategory: { _id: string; count: number }[];
  byStatus: { _id: string; count: number }[];
  recentIssues: Partial<Issue>[];
  totalEstimatedCost: number;
  totalActualCost: number;
  costByCategory: { _id: string; estimated: number; actual: number; count: number }[];
  escalated: number;
}

export interface AuditEntry {
  _id: string;
  issueId: string;
  action: string;
  performedByName: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
  hash: string;
  previousHash: string;
  createdAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  ward: string;
  estimatedBudget: number;
  status: 'proposed' | 'approved' | 'in-progress' | 'completed' | 'rejected';
  votes: { user: string; points: number }[];
  totalVotePoints: number;
  createdBy: { _id: string; name: string };
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  issueId?: string;
  read: boolean;
  createdAt: string;
}

export interface SensorZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  ward: string;
  sensors: {
    airQuality: { aqi: number; pm25: number; pm10: number; status: string };
    noiseLevel: { decibels: number; status: string };
    waterTank: { levelPercent: number; capacityLiters: number; status: string };
  };
  dataSource?: {
    airQuality: string;
    noiseLevel: string;
    waterQuality: string;
  };
  lastUpdated: string;
}

export interface DigitalTwinCell {
  lat: number;
  lng: number;
  count: number;
  categories: Record<string, number>;
  issues: { _id: string; title: string; category: string; priority: number }[];
}

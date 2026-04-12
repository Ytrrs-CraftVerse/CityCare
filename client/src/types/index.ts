export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
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
  text: string;
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
  upvotes: number;
  upvotedBy: string[];
  comments: Comment[];
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
}

export interface Location {
  lat: number;
  lng: number;
}

export type IssueType = 'Pothole' | 'Streetlight' | 'Garbage' | 'Water Leak' | 'Other';

export type IssueStatus = 'Reported' | 'In Progress' | 'Resolved';

export interface Issue {
  _id: string;
  type: IssueType;
  description: string;
  location: Location;
  image?: string;
  status: IssueStatus;
  userName: string;
  createdAt: string;
}

export interface IssueStats {
  total: number;
  resolved: number;
  byType: { _id: string; count: number }[];
}

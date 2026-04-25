import axios from 'axios';
import type {
  Issue, IssueStats, User, AuditEntry,
  Project, AppNotification, SensorZone, DigitalTwinCell,
} from '../types';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const stored = localStorage.getItem('citycare_user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// === Auth ===
export const loginUser = (email: string, password: string) =>
  API.post<User>('/auth/login', { email, password });

export const registerUser = (name: string, email: string, password: string) =>
  API.post<User>('/auth/register', { name, email, password });

export const getMe = () => API.get<User>('/auth/me');

export const updateProfile = (data: { watchRadius?: number; watchLocation?: { lat: number; lng: number } }) =>
  API.put<User>('/auth/profile', data);

// === Issues ===
export const fetchIssues = (params?: { category?: string; status?: string; search?: string; sortBy?: string }) =>
  API.get<Issue[]>('/issues', { params });

export const fetchIssueById = (id: string) => API.get<Issue>(`/issues/${id}`);

export const reportIssue = (data: {
  title: string;
  description: string;
  category: string;
  location: { lat: number; lng: number; address?: string };
}) => API.post<Issue>('/issues', data);

export const updateIssue = (id: string, data: Partial<Issue>) =>
  API.put<Issue>(`/issues/${id}`, data);

export const deleteIssue = (id: string) => API.delete(`/issues/${id}`);

export const upvoteIssue = (id: string) => API.post<Issue>(`/issues/${id}/upvote`);

export const addComment = (id: string, text: string) =>
  API.post<Issue>(`/issues/${id}/comments`, { text });

export const verifyIssue = (id: string) => API.post<Issue>(`/issues/${id}/verify`);

export const fetchMyIssues = () => API.get<Issue[]>('/issues/my');

export const fetchStats = () => API.get<IssueStats>('/issues/stats');

export const fetchDuplicates = (lat: number, lng: number, category: string) =>
  API.get<Issue[]>('/issues/duplicates', { params: { lat, lng, category, radius: 20 } });

export const suggestCategory = (text: string, filename?: string) =>
  API.post<{ suggestedCategory: string | null; estimatedSeverity: string }>('/issues/suggest-category', { text, filename });

// === Audit ===
export const fetchAuditTrail = (issueId: string) =>
  API.get<AuditEntry[]>(`/issues/${issueId}/audit`);

export const verifyAuditTrail = (issueId: string) =>
  API.get<{ valid: boolean; entries: number; message?: string }>(`/issues/${issueId}/audit/verify`);

// === Projects ===
export const fetchProjects = () => API.get<Project[]>('/projects');

export const createProject = (data: { title: string; description: string; ward: string; estimatedBudget: number }) =>
  API.post<Project>('/projects', data);

export const voteOnProject = (id: string, points: number) =>
  API.post<Project>(`/projects/${id}/vote`, { points });

export const deleteProject = (id: string) => API.delete(`/projects/${id}`);

// === Notifications ===
export const fetchNotifications = () => API.get<AppNotification[]>('/notifications');

export const fetchUnreadCount = () => API.get<{ count: number }>('/notifications/unread-count');

export const markNotificationRead = (id: string) => API.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => API.put('/notifications/read-all');

// === Sensors ===
export const fetchSensorData = () => API.get<SensorZone[]>('/sensors');

// === Digital Twin ===
export const fetchDigitalTwinData = () => API.get<DigitalTwinCell[]>('/issues/digital-twin');

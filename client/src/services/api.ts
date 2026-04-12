import axios from 'axios';
import type { Issue, IssueStats, User } from '../types';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach JWT to every request
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

// === Issues ===
export const fetchIssues = (params?: { category?: string; status?: string; search?: string }) =>
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

export const fetchMyIssues = () => API.get<Issue[]>('/issues/my');

// === Stats ===
export const fetchStats = () => API.get<IssueStats>('/issues/stats');

import axios from 'axios';
import { Issue, IssueStats } from '../types';

const API_URL = 'http://localhost:5000/api';

export const fetchIssues = () => axios.get<Issue[]>(`${API_URL}/issues`);

export const reportIssue = (formData: FormData) => axios.post<Issue>(`${API_URL}/issues`, formData);

export const fetchStats = () => axios.get<IssueStats>(`${API_URL}/stats`);

export const updateIssueStatus = (id: string, status: string) => 
  axios.patch<Issue>(`${API_URL}/issues/${id}`, { status });

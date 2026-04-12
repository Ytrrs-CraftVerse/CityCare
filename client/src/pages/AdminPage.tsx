import React, { useEffect, useState } from 'react';
import { fetchIssues, fetchStats, updateIssue, deleteIssue } from '../services/api';
import type { Issue, IssueStats } from '../types';
import {
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [issuesRes, statsRes] = await Promise.all([fetchIssues(), fetchStats()]);
      setIssues(issuesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateIssue(id, { status: newStatus } as any);
      setIssues((prev) =>
        prev.map((i) => (i._id === id ? { ...i, status: newStatus as any } : i))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    setActionLoading(id);
    try {
      await deleteIssue(id);
      setIssues((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'reported': return 'badge-reported';
      case 'in-progress': return 'badge-in-progress';
      case 'resolved': return 'badge-resolved';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Loading admin panel...</span>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Shield size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--error)' }} />
          Admin Panel
        </h1>
        <p className="page-subtitle">Manage all reported issues and update their status</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <div className="card stat-card">
            <div className="stat-icon blue"><Activity size={24} /></div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon red"><AlertCircle size={24} /></div>
            <div>
              <div className="stat-value">{stats.reported}</div>
              <div className="stat-label">Reported</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon yellow"><Clock size={24} /></div>
            <div>
              <div className="stat-value">{stats.inProgress}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon green"><CheckCircle2 size={24} /></div>
            <div>
              <div className="stat-value">{stats.resolved}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
        </div>
      )}

      {/* Issues Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Upvotes</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '250px' }}>
                    <div className="truncate">{issue.title}</div>
                  </td>
                  <td>
                    <span className="badge badge-category">{issue.category}</span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{ width: 'auto', minWidth: '130px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                      disabled={actionLoading === issue._id}
                    >
                      <option value="reported">Reported</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>{issue.upvotes}</td>
                  <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Link to={`/issues/${issue._id}`} className="btn btn-ghost btn-sm btn-icon" title="View">
                        <Eye size={16} />
                      </Link>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => handleDelete(issue._id)}
                        disabled={actionLoading === issue._id}
                        title="Delete"
                      >
                        {actionLoading === issue._id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

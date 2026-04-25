import React, { useEffect, useState } from 'react';
import { fetchIssues, fetchStats, updateIssue, deleteIssue } from '../services/api';
import type { Issue, IssueStats } from '../types';
import {
  Shield, Activity, CheckCircle2, Clock, AlertCircle,
  Trash2, Eye, Loader2, DollarSign, AlertTriangle,
  Flame, BadgeCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<string | null>(null);
  const [costValues, setCostValues] = useState<{ estimated: string; actual: string }>({ estimated: '', actual: '' });

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
      fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this issue? The audit trail will be preserved.')) return;
    setActionLoading(id);
    try {
      await deleteIssue(id);
      setIssues((prev) => prev.filter((i) => i._id !== id));
      fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCostEdit = (issue: Issue) => {
    setEditingCost(issue._id);
    setCostValues({
      estimated: issue.estimatedCost.toString(),
      actual: issue.actualCost.toString(),
    });
  };

  const handleCostSave = async (id: string) => {
    setActionLoading(id);
    try {
      await updateIssue(id, {
        estimatedCost: Number(costValues.estimated),
        actualCost: Number(costValues.actual),
      } as any);
      setIssues((prev) =>
        prev.map((i) =>
          i._id === id
            ? { ...i, estimatedCost: Number(costValues.estimated), actualCost: Number(costValues.actual) }
            : i
        )
      );
      setEditingCost(null);
      fetchStats();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update cost");
    } finally {
      setActionLoading(null);
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
        <p className="page-subtitle">Manage issues, update status, and track budgets</p>
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

      {/* Budget Overview */}
      {stats && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', padding: '1.15rem 1.5rem', alignItems: 'center' }}>
          <DollarSign size={24} style={{ color: 'var(--teal)' }} />
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Estimated</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>₹{stats.totalEstimatedCost.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Actual</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>₹{stats.totalActualCost.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Escalated</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--error)' }}>{stats.escalated}</div>
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
                <th>Priority</th>
                <th>Cost (₹)</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '200px' }}>
                    <div className="truncate" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {issue.escalationLevel === 'critical' && (
                        <AlertTriangle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} />
                      )}
                      {issue.sentimentScore >= 7 && (
                        <Flame size={14} style={{ color: '#f97316', flexShrink: 0 }} />
                      )}
                      {issue.title}
                    </div>
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
                  <td style={{ textAlign: 'center' }}>{'⭐'.repeat(issue.priority)}</td>
                  <td>
                    {editingCost === issue._id ? (
                      <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                        <input
                          className="form-input"
                          style={{ width: '70px', padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                          value={costValues.estimated}
                          onChange={(e) => setCostValues((v) => ({ ...v, estimated: e.target.value }))}
                          placeholder="Est"
                          type="number"
                        />
                        <input
                          className="form-input"
                          style={{ width: '70px', padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                          value={costValues.actual}
                          onChange={(e) => setCostValues((v) => ({ ...v, actual: e.target.value }))}
                          placeholder="Act"
                          type="number"
                        />
                        <button className="btn btn-primary btn-sm btn-icon" onClick={() => handleCostSave(issue._id)}>
                          <CheckCircle2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleCostEdit(issue)}
                        style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <DollarSign size={12} />
                          {(issue.estimatedCost > 0 || issue.actualCost > 0) ? (
                            <div style={{ textAlign: 'left' }}>
                              <div>Est: ₹{issue.estimatedCost.toLocaleString()}</div>
                              <div>Act: ₹{issue.actualCost.toLocaleString()}</div>
                            </div>
                          ) : 'Set cost'}
                        </div>
                      </button>
                    )}
                  </td>
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

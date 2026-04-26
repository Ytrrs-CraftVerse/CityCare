import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyIssues } from '../services/api';
import type { Issue } from '../types';
import {
  Mail,
  Shield,
  Clock,
  FileText,
  ArrowRight,
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyIssues()
      .then((res) => setMyIssues(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'reported': return 'badge-reported';
      case 'in-progress': return 'badge-in-progress';
      case 'resolved': return 'badge-resolved';
      default: return '';
    }
  };

  if (!user) return null;

  return (
    <div className="page animate-fade-in">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="profile-header">
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{user.name}</h2>
              <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} /> {user.email}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className={`badge ${user.role === 'admin' ? 'badge-in-progress' : 'badge-reported'}`}>
                  <Shield size={12} /> {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="card stat-card">
            <div className="stat-icon blue"><FileText size={22} /></div>
            <div>
              <div className="stat-value">{myIssues.length}</div>
              <div className="stat-label">Reports Filed</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon green">
              <Shield size={22} />
            </div>
            <div>
              <div className="stat-value">{myIssues.filter((i) => i.status === 'resolved').length}</div>
              <div className="stat-label">Resolved</div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="stat-icon yellow"><Clock size={22} /></div>
            <div>
              <div className="stat-value">{myIssues.filter((i) => i.status !== 'resolved').length}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </div>

        {/* My Issues */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>My Reports</h3>
          {loading ? (
            <div className="loading-container" style={{ padding: '2rem' }}>
              <div className="animate-spin" style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            </div>
          ) : myIssues.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <FileText size={40} />
              <h3>No reports yet</h3>
              <p>Start reporting civic issues to see them here</p>
              <Link to="/report" className="btn btn-primary mt-2">Report an Issue</Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {myIssues.map((issue) => (
                    <tr key={issue._id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{issue.title}</td>
                      <td>
                        <span className="badge badge-category">{issue.category}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                      </td>
                      <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/issues/${issue._id}`} className="btn btn-ghost btn-sm">
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

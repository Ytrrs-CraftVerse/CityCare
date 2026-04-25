import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MapLibre from '../components/MapLibre';
import { fetchIssues } from '../services/api';
import type { Issue } from '../types';
import {
  List,
  Map as MapIcon,
  Clock,
  Search,
  Filter,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
  Flame,
  BadgeCheck,
  Building2,
} from 'lucide-react';

const categories = ['all', 'pothole', 'streetlight', 'garbage', 'water', 'other'];
const statuses = ['all', 'reported', 'in-progress', 'resolved'];

const DashboardPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadIssues();
  }, [category, status]);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category !== 'all') params.category = category;
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      const res = await fetchIssues(params);
      setIssues(res.data);
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadIssues();
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'reported': return 'badge-reported';
      case 'in-progress': return 'badge-in-progress';
      case 'resolved': return 'badge-resolved';
      default: return '';
    }
  };

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'pothole': return '🕳️';
      case 'streetlight': return '💡';
      case 'garbage': return '🗑️';
      case 'water': return '💧';
      default: return '📋';
    }
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">Community Board</h1>
            <p className="page-subtitle">{issues.length} things happening around you</p>
          </div>
          <div className="tab-group">
            <button className={`tab-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              <List size={16} /> List
            </button>
            <button className={`tab-btn ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>
              <MapIcon size={16} /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <form className="filter-bar" onSubmit={handleSearch}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary btn-sm">
          <Filter size={16} /> Filter
        </button>
      </form>

      {loading ? (
        <div className="loading-container">
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
          <span>Loading issues...</span>
        </div>
      ) : view === 'map' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapLibre 
            center={[19.076, 72.877]} 
            zoom={12} 
            markers={issues.map(issue => ({
              id: issue._id,
              lat: issue.location.coordinates[1],
              lng: issue.location.coordinates[0],
              title: issue.title,
              description: issue.description,
              status: issue.status,
              category: issue.category
            }))}
          />
        </div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <h3>No issues found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="grid">
          {issues.map((issue) => (
            <Link key={issue._id} to={`/issues/${issue._id}`} style={{ textDecoration: 'none' }}>
              <div className="card card-interactive issue-card">
                <div className="issue-card-header">
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                    <span className="badge badge-category">
                      {getCategoryEmoji(issue.category)} {issue.category}
                    </span>
                    {issue.escalationLevel === 'critical' && (
                      <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <AlertTriangle size={10} /> CRITICAL
                      </span>
                    )}
                    {issue.sentimentScore >= 7 && (
                      <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.15)' }}>
                        <Flame size={10} /> Urgent
                      </span>
                    )}
                    {issue.verifiedCount > 0 && (
                      <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>
                        <BadgeCheck size={10} /> ×{issue.verifiedCount}
                      </span>
                    )}
                  </div>
                </div>
                <h3>{issue.title}</h3>
                <p>{issue.description}</p>
                <div className="issue-card-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={14} />
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ThumbsUp size={14} /> {issue.upvotes}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <MessageSquare size={14} /> {issue.comments?.length || 0}
                    </span>
                  </div>
                </div>
                {/* Contractor & Warranty Info */}
                {issue.governmentAsset && (
                  <div style={{
                    marginTop: '0.6rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                      <Building2 size={12} style={{ color: 'var(--teal)' }} />
                      <span style={{ fontWeight: 600 }}>{issue.governmentAsset.roadName}</span>
                      <span style={{ color: 'var(--text-muted)' }}>• {issue.governmentAsset.roadType}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        🏗️ {issue.governmentAsset.contractor}
                      </span>
                      <span className={`badge ${issue.governmentAsset.warrantyActive ? 'badge-resolved' : 'badge-reported'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                        {issue.governmentAsset.warrantyActive ? '✅ Warranty Active' : '❌ Expired'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

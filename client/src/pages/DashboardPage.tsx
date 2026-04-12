import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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
} from 'lucide-react';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow });
L.Marker.prototype.options.icon = DefaultIcon;

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
            <h1 className="page-title">Public Dashboard</h1>
            <p className="page-subtitle">{issues.length} issues found</p>
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
          <MapContainer center={[19.076, 72.877]} zoom={12} style={{ height: '500px', borderRadius: 'var(--radius-lg)' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />
            {issues.map((issue) => (
              <Marker
                key={issue._id}
                position={[issue.location.coordinates[1], issue.location.coordinates[0]]}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <strong>{issue.title}</strong>
                    <p style={{ fontSize: '0.8rem', margin: '0.4rem 0', color: '#666' }}>{issue.description.slice(0, 80)}...</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: issue.status === 'resolved' ? '#dcfce7' : issue.status === 'in-progress' ? '#fef3c7' : '#dbeafe', color: issue.status === 'resolved' ? '#166534' : issue.status === 'in-progress' ? '#92400e' : '#1e40af' }}>
                        {issue.status}
                      </span>
                      <a href={`/issues/${issue._id}`} style={{ fontSize: '0.75rem', color: '#3b82f6' }}>View →</a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
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
                  <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                  <span className="badge badge-category">
                    {getCategoryEmoji(issue.category)} {issue.category}
                  </span>
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

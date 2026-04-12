import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchIssueById, upvoteIssue, addComment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Issue } from '../types';
import {
  ArrowLeft,
  Clock,
  MapPin,
  ThumbsUp,
  MessageSquare,
  Send,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow });
L.Marker.prototype.options.icon = DefaultIcon;

const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIssueById(id)
        .then((res) => setIssue(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleUpvote = async () => {
    if (!user || !issue) return;
    setUpvoting(true);
    try {
      const res = await upvoteIssue(issue._id);
      setIssue(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upvote');
    } finally {
      setUpvoting(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !issue || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment(issue._id, commentText.trim());
      setIssue(res.data);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'pothole': return '🕳️';
      case 'streetlight': return '💡';
      case 'garbage': return '🗑️';
      case 'water': return '💧';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Loading issue...</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="page">
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>Issue not found</h3>
          <Link to="/dashboard" className="btn btn-primary mt-2">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <Link to="/dashboard" className="btn btn-ghost" style={{ marginBottom: '1rem' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Left Column */}
        <div>
          {/* Issue Details */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="issue-detail-header">
              <div>
                <div className="issue-meta">
                  <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                  <span className="badge badge-category">
                    {getCategoryEmoji(issue.category)} {issue.category}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{issue.title}</h1>
              </div>
              <button
                className={`upvote-btn ${issue.upvotedBy?.includes(user?._id || '') ? 'upvoted' : ''}`}
                onClick={handleUpvote}
                disabled={!user || upvoting}
                title={user ? 'Upvote this issue' : 'Login to upvote'}
              >
                <ThumbsUp size={16} />
                {issue.upvotes}
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              {issue.description}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={14} />
                {new Date(issue.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MessageSquare size={14} />
                {issue.comments?.length || 0} comments
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>
              <MessageSquare size={20} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              Comments ({issue.comments?.length || 0})
            </h3>

            {user && (
              <form onSubmit={handleComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            )}

            {!user && (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <Link to="/login">Sign in</Link> to leave a comment
              </div>
            )}

            {issue.comments && issue.comments.length > 0 ? (
              <div>
                {[...issue.comments].reverse().map((c, i) => (
                  <div key={i} className="comment">
                    <div className="comment-header">
                      <span className="comment-author">{c.user}</span>
                      <span className="comment-date">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No comments yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Right Column — Map */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>
              <MapPin size={18} style={{ verticalAlign: 'middle', marginRight: '0.3rem', color: 'var(--primary-light)' }} />
              Location
            </h3>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MapContainer
                center={[issue.location.coordinates[1], issue.location.coordinates[0]]}
                zoom={15}
                style={{ height: '250px' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OSM'
                />
                <Marker position={[issue.location.coordinates[1], issue.location.coordinates[0]]} />
              </MapContainer>
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {issue.location.coordinates[1].toFixed(5)}, {issue.location.coordinates[0].toFixed(5)}
            </p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Priority</span>
                <span style={{ fontWeight: 600 }}>{'⭐'.repeat(issue.priority)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Upvotes</span>
                <span style={{ fontWeight: 600 }}>{issue.upvotes}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Created</span>
                <span style={{ fontWeight: 600 }}>{new Date(issue.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Updated</span>
                <span style={{ fontWeight: 600 }}>{new Date(issue.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPage;

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MapLibre from '../components/MapLibre';
import { fetchIssueById, upvoteIssue, addComment, verifyIssue, fetchAuditTrail, verifyAuditTrail, generateQRCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Issue, AuditEntry, GeoFencedQR } from '../types';
import {
  ArrowLeft, Clock, MapPin, ThumbsUp, MessageSquare, Send,
  AlertCircle, Loader2, ShieldCheck, Link2, CheckCircle2,
  AlertTriangle, DollarSign, Flame, BadgeCheck, Building2, HardHat, QrCode,
} from 'lucide-react';

const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [auditValid, setAuditValid] = useState<boolean | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrData, setQrData] = useState<GeoFencedQR | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIssueById(id)
        .then((res) => setIssue(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const loadAuditTrail = async () => {
    if (!id) return;
    try {
      const [trailRes, verifyRes] = await Promise.all([
        fetchAuditTrail(id),
        verifyAuditTrail(id),
      ]);
      setAuditTrail(trailRes.data);
      setAuditValid(verifyRes.data.valid);
      setShowAudit(true);
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleVerify = async () => {
    if (!user || !issue) return;
    setVerifying(true);
    try {
      const res = await verifyIssue(issue._id);
      setIssue(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot verify');
    } finally {
      setVerifying(false);
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

  const getAuditIcon = (action: string) => {
    switch (action) {
      case 'created': return '🆕';
      case 'status-changed': return '🔄';
      case 'resolved': return '✅';
      case 'escalated': return '🔴';
      case 'comment-added': return '💬';
      case 'upvoted': return '👍';
      case 'verified': return '✔️';
      case 'cost-updated': return '💰';
      case 'deleted': return '🗑️';
      default: return '📝';
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

      {/* Escalation Banner */}
      {issue.escalationLevel === 'critical' && (
        <div className="escalation-banner">
          <AlertTriangle size={20} />
          <span><strong>Needs Attention</strong> — This issue has been waiting for an update for over 48 hours.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Left Column */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="issue-detail-header">
              <div>
                <div className="issue-meta">
                  <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                  <span className="badge badge-category">
                    {getCategoryEmoji(issue.category)} {issue.category}
                  </span>
                  {issue.sentimentScore >= 7 && (
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Flame size={12} /> Urgent
                    </span>
                  )}
                  {issue.verifiedCount > 0 && (
                    <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>
                      <BadgeCheck size={12} /> Verified ×{issue.verifiedCount}
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{issue.title}</h1>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`upvote-btn ${issue.upvotedBy?.includes(user?._id || '') ? 'upvoted' : ''}`}
                  onClick={handleUpvote}
                  disabled={!user || upvoting}
                  title={user ? 'Upvote this issue' : 'Login to upvote'}
                >
                  <ThumbsUp size={16} />
                  {issue.upvotes}
                </button>
                {user && (user as any).reputationScore >= 50 && !issue.verifiedBy?.includes(user._id) && (
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }}
                    onClick={handleVerify}
                    disabled={verifying}
                    title="Verify this issue as a trusted volunteer"
                  >
                    <ShieldCheck size={14} /> Verify
                  </button>
                )}
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              {issue.description}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={14} />
                {new Date(issue.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MessageSquare size={14} />
                {issue.comments?.length || 0} comments
              </span>
              {(issue.estimatedCost > 0 || issue.actualCost > 0) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <DollarSign size={14} />
                  Est: ₹{issue.estimatedCost.toLocaleString()} | Actual: ₹{issue.actualCost.toLocaleString()}
                </span>
              )}
            </div>

            {/* Attached Photo */}
            {issue.image && (
              <div style={{ marginTop: '1.25rem' }}>
                <img
                  src={issue.image.startsWith('http') ? issue.image : `http://localhost:5000${issue.image}`}
                  alt={issue.title}
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  📸 Photo submitted with this report
                </p>
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Link2 size={18} /> History & Updates
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {auditValid !== null && (
                  <span className={`badge ${auditValid ? 'badge-resolved' : 'badge-reported'}`}>
                    {auditValid ? <><CheckCircle2 size={12} /> Verified Log</> : <><AlertCircle size={12} /> Sync Error</>}
                  </span>
                )}
                <button className="btn btn-ghost btn-sm" onClick={loadAuditTrail}>
                  {showAudit ? 'Refresh' : 'See History'}
                </button>
              </div>
            </div>

            {showAudit && auditTrail.length > 0 ? (
              <div className="audit-timeline">
                {auditTrail.map((entry) => (
                  <div key={entry._id} className="audit-entry">
                    <div className="audit-icon">{getAuditIcon(entry.action)}</div>
                    <div className="audit-content">
                      <div className="audit-action">
                        <strong>{entry.action.replace(/-/g, ' ')}</strong>
                        <span className="audit-by"> by {entry.performedByName}</span>
                      </div>
                      {entry.details && <p className="audit-details">{entry.details}</p>}
                      <div className="audit-meta">
                        <span>{new Date(entry.createdAt).toLocaleString()}</span>
                        <span className="audit-hash" title={entry.hash}>
                          #{entry.hash.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : showAudit ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No updates yet.</p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Click "See History" to view the secure timeline of this issue.
              </p>
            )}
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
                      <span className="comment-author">{c.userName || c.user}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {c.sentimentScore >= 5 && (
                          <Flame size={12} style={{ color: 'var(--error)' }} />
                        )}
                        <span className="comment-date">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
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

        {/* Right Column */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>
              <MapPin size={18} style={{ verticalAlign: 'middle', marginRight: '0.3rem', color: 'var(--primary-light)' }} />
              Location
            </h3>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MapLibre 
                center={[issue.location.coordinates[1], issue.location.coordinates[0]]} 
                zoom={15} 
                height="250px"
                markers={[{
                  id: issue._id,
                  lat: issue.location.coordinates[1],
                  lng: issue.location.coordinates[0],
                  title: issue.title,
                  description: issue.description,
                  status: issue.status,
                  category: issue.category
                }]}
              />
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {issue.location.coordinates[1].toFixed(5)}, {issue.location.coordinates[0].toFixed(5)}
            </p>
          </div>

          {/* QR Code for Proof of Fix */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <QrCode size={18} style={{ color: 'var(--primary-light)' }} />
              Verification QR
            </h3>
            {qrData ? (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={qrData.qrDataUrl}
                  alt="Issue QR Code"
                  style={{ width: '180px', height: '180px', borderRadius: 'var(--radius)', margin: '0 auto 0.5rem' }}
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Asset: {qrData.assetId}
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Contractors scan this on-site to confirm repairs.
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Generate a geofenced QR code that contractors must scan from the exact location to prove repairs.
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={qrLoading}
                  onClick={async () => {
                    setQrLoading(true);
                    try {
                      const res = await generateQRCode(issue._id);
                      setQrData(res.data);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setQrLoading(false);
                    }
                  }}
                >
                  {qrLoading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
                  Generate QR Code
                </button>
              </div>
            )}
          </div>

          {/* Government Asset & Contractor Details */}
          {issue.governmentAsset && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={18} style={{ color: 'var(--teal)' }} />
                Road & Contractor
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Road Name</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{issue.governmentAsset.roadName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Asset ID</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.78rem' }}>{issue.governmentAsset.assetId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Road Type</span>
                  <span className="badge badge-category" style={{ textTransform: 'capitalize' }}>{issue.governmentAsset.roadType}</span>
                </div>
                {issue.governmentAsset.surface !== 'unknown' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Surface</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{issue.governmentAsset.surface}</span>
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <HardHat size={14} /> Contractor Info
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Contractor</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%', fontSize: '0.8rem' }}>{issue.governmentAsset.contractor}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Agency</span>
                  <span style={{ fontWeight: 600 }}>{issue.governmentAsset.agency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Last Repair</span>
                  <span style={{ fontWeight: 600 }}>{new Date(issue.governmentAsset.constructionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Warranty</span>
                  <span className={`badge ${issue.governmentAsset.warrantyActive ? 'badge-resolved' : 'badge-reported'}`}>
                    {issue.governmentAsset.warrantyActive ? '✅ Active' : '❌ Expired'}
                  </span>
                </div>
                {issue.governmentAsset.warrantyActive && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: '#22c55e',
                    fontWeight: 600,
                  }}>
                    🏗️ Repair Type: NO-COST DLP CLAIM — Original contractor is liable for free repair
                  </div>
                )}
                {!issue.governmentAsset.warrantyActive && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                  }}>
                    📋 Standard Work Order — Warranty expired, municipal budget required
                  </div>
                )}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Source: {issue.governmentAsset.source}
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, fontSize: '0.95rem' }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Priority</span>
                <span style={{ fontWeight: 600 }}>{'⭐'.repeat(issue.priority)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Severity</span>
                <span className={`badge ${issue.severity === 'critical' ? 'badge-reported' : issue.severity === 'high' ? 'badge-in-progress' : 'badge-resolved'}`}>
                  {issue.severity}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sentiment</span>
                <span style={{ fontWeight: 600, color: issue.sentimentScore >= 7 ? 'var(--error)' : issue.sentimentScore >= 4 ? 'var(--warning)' : 'var(--success)' }}>
                  {issue.sentimentScore >= 7 ? '🔥 High' : issue.sentimentScore >= 4 ? '⚠️ Medium' : '✅ Low'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Upvotes</span>
                <span style={{ fontWeight: 600 }}>{issue.upvotes}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Verified</span>
                <span style={{ fontWeight: 600, color: issue.verifiedCount > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                  {issue.verifiedCount > 0 ? `✓ ${issue.verifiedCount} volunteers` : 'Not yet'}
                </span>
              </div>
              {(issue.estimatedCost > 0 || issue.actualCost > 0) && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Est. Cost</span>
                    <span style={{ fontWeight: 600 }}>₹{issue.estimatedCost.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Actual Cost</span>
                    <span style={{ fontWeight: 600 }}>₹{issue.actualCost.toLocaleString()}</span>
                  </div>
                </>
              )}
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

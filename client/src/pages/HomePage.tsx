import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchStats, fetchIssues } from '../services/api';
import type { IssueStats, Issue } from '../types';
import {
  MapPin,
  PlusCircle,
  BarChart3,
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
  ThumbsUp,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

/* ===== Animated Counter Hook ===== */
function useCountUp(end: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    startRef.current = null;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration]);

  return count;
}

/* ===== Counter Display Component ===== */
const AnimatedStat: React.FC<{ value: number; label: string; colorClass?: string }> = ({
  value,
  label,
  colorClass = '',
}) => {
  const display = useCountUp(value);
  return (
    <div className="hero-stat animate-slide-up">
      <div className={`hero-stat-value ${colorClass}`}>{display.toLocaleString()}</div>
      <div className="hero-stat-label">{label}</div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then((res) => setStats(res.data))
      .catch(() => {});
    fetchIssues()
      .then((res) => setRecentIssues(res.data.slice(0, 6)))
      .catch(() => {});
  }, []);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'pothole': return '🕳️';
      case 'streetlight': return '💡';
      case 'garbage': return '🗑️';
      case 'water': return '💧';
      default: return '📋';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported': return 'badge-reported';
      case 'in-progress': return 'badge-in-progress';
      case 'resolved': return 'badge-resolved';
      default: return '';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', background: 'var(--primary-glow)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600, marginBottom: '1.25rem' }}>
            <Sparkles size={14} /> Smart City Platform
          </div>

          <h1 className="hero-title">
            Your City, Your Voice
          </h1>
          <p className="hero-subtitle">
            Report civic issues like potholes, broken streetlights, and garbage dumping.
            Track progress and hold your city accountable — all in one platform.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/report" className="btn btn-primary btn-lg">
                <PlusCircle size={20} /> Report an Issue
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg">
                <Zap size={20} /> Get Started Free
              </Link>
            )}
            <Link to="/dashboard" className="btn btn-secondary btn-lg">
              <LayoutDashboard size={20} /> View Dashboard
            </Link>
          </div>

          {/* Animated Stats Counters */}
          {stats && (
            <div className="hero-stats">
              <AnimatedStat value={stats.total} label="Total Reports" />
              <AnimatedStat value={stats.resolved} label="Issues Resolved" colorClass="green" />
              <AnimatedStat value={stats.inProgress} label="In Progress" colorClass="yellow" />
              <AnimatedStat
                value={stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}
                label="Resolution Rate %"
                colorClass="red"
              />
            </div>
          )}

          {/* Fallback stats when API is down */}
          {!stats && (
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">—</div>
                <div className="hero-stat-label">Total Reports</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value green">—</div>
                <div className="hero-stat-label">Resolved</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value yellow">—</div>
                <div className="hero-stat-label">In Progress</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value red">—</div>
                <div className="hero-stat-label">Resolution Rate</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="page">
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={22} className="text-primary" />
          Quick Actions
        </h2>
        <div className="grid-3">
          {[
            { to: '/report', icon: MapPin, iconColor: 'var(--primary-light)', bg: 'var(--primary-glow)', title: 'Report Issue', desc: 'Pin a location and describe the problem', delay: 'delay-1' },
            { to: '/dashboard', icon: LayoutDashboard, iconColor: 'var(--success)', bg: 'var(--success-bg)', title: 'Browse Issues', desc: 'View all reports on map or list', delay: 'delay-2' },
            { to: '/analytics', icon: BarChart3, iconColor: 'var(--accent-light)', bg: 'var(--accent-glow)', title: 'View Analytics', desc: 'Track trends and resolution rates', delay: 'delay-3' },
          ].map((item) => (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <div
                className={`card card-interactive quick-action-card animate-slide-up ${item.delay}`}
                onMouseEnter={() => setHoveredCard(item.to)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="action-icon"
                  style={{ background: item.bg, color: item.iconColor }}
                >
                  <item.icon size={26} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <div style={{
                  marginTop: '0.75rem',
                  opacity: hoveredCard === item.to ? 1 : 0,
                  transform: hoveredCard === item.to ? 'translateY(0)' : 'translateY(4px)',
                  transition: 'all 0.25s ease',
                  color: item.iconColor,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}>
                  Explore <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Issues */}
        {recentIssues.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} style={{ color: 'var(--warning)' }} />
                Recent Reports
              </h2>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                View All <ArrowRight size={15} />
              </Link>
            </div>
            <div className="grid">
              {recentIssues.map((issue, i) => (
                <Link key={issue._id} to={`/issues/${issue._id}`} style={{ textDecoration: 'none' }}>
                  <div className={`card card-interactive issue-card animate-slide-up delay-${i + 1}`}>
                    <div className="issue-card-header">
                      <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                      <span className="badge badge-category">
                        {getCategoryIcon(issue.category)} {issue.category}
                      </span>
                    </div>
                    <h3>{issue.title}</h3>
                    <p>{issue.description}</p>
                    <div className="issue-card-footer">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} />
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <ThumbsUp size={13} /> {issue.upvotes}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MessageSquare size={13} /> {issue.comments?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;

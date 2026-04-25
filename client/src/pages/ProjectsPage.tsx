import React, { useEffect, useState } from 'react';
import { fetchProjects, voteOnProject, createProject } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';
import {
  Vote, TrendingUp, DollarSign, Users, Plus,
  Loader2, ChevronUp, Award, X,
} from 'lucide-react';

const ProjectsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWard, setNewWard] = useState('');
  const [newBudget, setNewBudget] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetchProjects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (projectId: string) => {
    if (!user) return;
    setVoting(projectId);
    try {
      const res = await voteOnProject(projectId, 1);
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? res.data : p))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Vote failed');
    } finally {
      setVoting(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createProject({
        title: newTitle,
        description: newDesc,
        ward: newWard,
        estimatedBudget: Number(newBudget),
      });
      setShowCreate(false);
      setNewTitle(''); setNewDesc(''); setNewWard(''); setNewBudget('');
      loadProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'badge-reported';
      case 'approved': return 'badge-in-progress';
      case 'in-progress': return 'badge-in-progress';
      case 'completed': return 'badge-resolved';
      case 'rejected': return '';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">
              <Vote size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-light)' }} />
              Participatory Budgeting
            </h1>
            <p className="page-subtitle">Vote on proposed city projects with your reputation points</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Propose Project</>}
            </button>
          )}
        </div>
      </div>

      {user && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
          <Award size={24} style={{ color: 'var(--primary-light)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Your Reputation Points</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-light)' }}>
              {(user as any).reputationScore || 0}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Earn points by reporting, commenting, and verifying issues
          </div>
        </div>
      )}

      {/* Create Project Form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Propose New Project</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Project Title</label>
                <input className="form-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder="e.g., Build a new park in Ward 4" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ward</label>
                  <input className="form-input" value={newWard} onChange={(e) => setNewWard(e.target.value)} required placeholder="e.g., Ward 4" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Budget (₹)</label>
                  <input className="form-input" type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} required placeholder="500000" />
                </div>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required placeholder="Describe the project..." />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <Vote size={48} />
          <h3>No projects yet</h3>
          <p>Check back later for proposed city projects</p>
        </div>
      ) : (
        <div className="grid">
          {projects.map((project, i) => (
            <div key={project._id} className={`card animate-slide-up delay-${Math.min(i + 1, 6)}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className={`badge ${getStatusColor(project.status)}`}>{project.status}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{project.ward}</span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>{project.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {project.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <DollarSign size={14} /> ₹{project.estimatedBudget.toLocaleString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={14} /> {project.votes.length} voters
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                    {project.totalVotePoints}
                  </span>
                  {user && (
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.2)' }}
                      onClick={() => handleVote(project._id)}
                      disabled={voting === project._id || project.votes.some((v) => v.user === user._id)}
                    >
                      {voting === project._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ChevronUp size={14} />
                      )}
                      Vote
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;

import React, { useEffect, useState } from 'react';
import { fetchProjects, voteOnProject, createProject } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Project } from '../types';
import {
  Heart, ArrowUpCircle, MapPin, Users, Plus,
  Loader2, Sparkles, X, ChevronUp,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <Loader2 size={32} className="animate-spin text-primary" style={{ color: 'var(--primary)' }} />
        <span style={{ color: 'var(--text-muted)' }}>Gathering community projects...</span>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Community <span style={{ color: 'var(--primary-light)' }}>Initiatives</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Help decide where city funds go. Use your impact points to vote on the improvements you want to see in your neighborhood.
        </p>
      </div>

      {/* Impact Points Banner */}
      {user && (
        <div style={{ 
          background: 'linear-gradient(145deg, var(--bg-elevated), var(--bg-card))',
          border: '1px solid var(--border-light)',
          borderRadius: '1rem',
          padding: '1.5rem 2rem',
          marginBottom: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '50%', color: 'var(--primary-light)' }}>
              <Sparkles size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Your Impact Points
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)' }}>
                {(user as any).reputationScore || 0}
              </div>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '300px', margin: 0, lineHeight: 1.5 }}>
            You earn points by helping out—like reporting issues or verifying fixes. Use them to vote on projects below!
          </p>
        </div>
      )}

      {/* Admin Create Button */}
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreate(!showCreate)}
            style={{ borderRadius: '2rem', padding: '0.75rem 1.5rem', fontWeight: 600 }}
          >
            {showCreate ? <><X size={18} /> Cancel Proposal</> : <><Plus size={18} /> Propose New Project</>}
          </button>
        </div>
      )}

      {/* Create Project Form */}
      {showCreate && (
        <div className="card animate-slide-up" style={{ marginBottom: '3rem', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--primary-glow)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 700 }}>Propose a New Initiative</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">What's the idea?</label>
                <input className="form-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder="e.g., Plant 50 trees along Hill Road" style={{ padding: '0.8rem 1rem' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">Which neighborhood?</label>
                  <input className="form-input" value={newWard} onChange={(e) => setNewWard(e.target.value)} required placeholder="e.g., Bandra West" style={{ padding: '0.8rem 1rem' }} />
                </div>
                <div>
                  <label className="form-label">Estimated Cost</label>
                  <input className="form-input" type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} required placeholder="50000" style={{ padding: '0.8rem 1rem' }} />
                </div>
              </div>
              
              <div>
                <label className="form-label">Why do we need this?</label>
                <textarea className="form-textarea" rows={4} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} required placeholder="Explain how this benefits the community..." style={{ padding: '0.8rem 1rem' }} />
              </div>
              
              <button type="submit" className="btn btn-primary" disabled={creating} style={{ padding: '0.8rem', fontSize: '1.05rem', fontWeight: 600, marginTop: '0.5rem' }}>
                {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                {creating ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ background: 'var(--bg-elevated)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Heart size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>No projects right now</h3>
          <p>Check back later to see what the city is planning.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {projects.map((project, i) => {
            const hasVoted = user && project.votes.some((v) => v.user === (user as any)._id);
            
            return (
              <div key={project._id} className={`animate-slide-up delay-${Math.min(i + 1, 6)}`} style={{
                background: 'var(--bg-card)',
                borderRadius: '1.25rem',
                border: '1px solid var(--border-light)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              }}>
                
                {/* Status & Location */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                    <MapPin size={14} />
                    {project.ward}
                  </div>
                  <div style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '2rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: project.status === 'completed' ? 'rgba(34,197,94,0.1)' : project.status === 'in-progress' ? 'rgba(249,115,22,0.1)' : 'rgba(59,130,246,0.1)',
                    color: project.status === 'completed' ? '#22c55e' : project.status === 'in-progress' ? '#f97316' : '#3b82f6',
                  }}>
                    {project.status.replace('-', ' ')}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text)' }}>
                    {project.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1rem' }}>
                    {project.description}
                  </p>
                </div>

                {/* Footer details & Vote action */}
                <div style={{ 
                  marginTop: '0.5rem', 
                  paddingTop: '1.25rem', 
                  borderTop: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Estimated Cost</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                      {formatCurrency(project.estimatedBudget)}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Users size={14} /> {project.votes.length} supporters
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                        {project.totalVotePoints} pts
                      </div>
                    </div>
                    
                    {user && (
                      <button
                        onClick={() => handleVote(project._id)}
                        disabled={voting === project._id || hasVoted}
                        style={{
                          background: hasVoted ? 'var(--bg-elevated)' : 'var(--primary)',
                          color: hasVoted ? 'var(--text-muted)' : '#fff',
                          border: 'none',
                          padding: '0.8rem 1.25rem',
                          borderRadius: '0.75rem',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: hasVoted ? 'not-allowed' : 'pointer',
                          opacity: (voting === project._id) ? 0.7 : 1,
                          transition: 'all 0.2s',
                          boxShadow: hasVoted ? 'none' : '0 4px 12px rgba(99,102,241,0.3)',
                        }}
                      >
                        {voting === project._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : hasVoted ? (
                          <Heart size={18} fill="currentColor" />
                        ) : (
                          <ChevronUp size={18} strokeWidth={3} />
                        )}
                        {hasVoted ? 'Supported' : 'Support This'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;

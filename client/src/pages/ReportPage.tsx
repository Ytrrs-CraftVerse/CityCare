import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reportIssue, fetchDuplicates, suggestCategory } from '../services/api';
import type { Issue } from '../types';
import { MapPin, Send, Loader2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow });
L.Marker.prototype.options.icon = DefaultIcon;

const categories = [
  { value: 'pothole', label: '🕳️ Pothole' },
  { value: 'streetlight', label: '💡 Streetlight' },
  { value: 'garbage', label: '🗑️ Garbage' },
  { value: 'water', label: '💧 Water Leak' },
  { value: 'other', label: '📋 Other' },
];

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<Issue[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string | null; severity: string } | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const checkDuplicates = useCallback(async (lat: number, lng: number, cat: string) => {
    try {
      const res = await fetchDuplicates(lat, lng, cat);
      if (res.data.length > 0) {
        setDuplicates(res.data);
        setShowDuplicateWarning(true);
      } else {
        setDuplicates([]);
        setShowDuplicateWarning(false);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    checkDuplicates(lat, lng, category);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    if (location) {
      checkDuplicates(location.lat, location.lng, cat);
    }
  };

  const handleDescriptionBlur = async () => {
    if (description.length > 10) {
      try {
        const res = await suggestCategory(description + ' ' + title);
        if (res.data.suggestedCategory) {
          setAiSuggestion({
            category: res.data.suggestedCategory,
            severity: res.data.estimatedSeverity,
          });
        }
      } catch { }
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e: L.LeafletMouseEvent) {
        handleLocationSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return location ? <Marker position={[location.lat, location.lng]} /> : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      setError('Please click the map to select a location');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await reportIssue({ title, description, category, location });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px', padding: '3rem' }}>
          <CheckCircle2 size={56} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Thanks for letting us know!</h2>
          <p style={{ color: 'var(--text-muted)' }}>We've received your report. Taking you to the community board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="page-header">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin className="text-primary" /> Tell us what needs fixing
          </h1>
          <p className="page-subtitle">Your reports help make the neighborhood safer and cleaner.</p>
        </div>

        {error && (
          <div className="auth-message error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Duplicate Warning */}
        {showDuplicateWarning && duplicates.length > 0 && (
          <div className="card" style={{ marginBottom: '1.25rem', border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--warning)' }}>
                Possible Duplicate Detected!
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Similar issues were found within 20 meters of your selected location:
            </p>
            {duplicates.map((dup) => (
              <Link
                key={dup._id}
                to={`/issues/${dup._id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card card-interactive" style={{ padding: '0.75rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>{dup.title}</strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Reported by {dup.reportedByName} — {new Date(dup.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${dup.status === 'resolved' ? 'badge-resolved' : 'badge-reported'}`}>
                      {dup.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Is this the same issue? Consider upvoting the existing report instead.
            </p>
          </div>
        )}

        {/* AI Suggestion */}
        {aiSuggestion && aiSuggestion.category && aiSuggestion.category !== category && (
          <div className="card" style={{ marginBottom: '1.25rem', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary-light)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)' }}>
                AI Suggestion
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Based on your description, this might be a <strong>{aiSuggestion.category}</strong> issue
              with <strong>{aiSuggestion.severity}</strong> severity.
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: '0.5rem' }}
                onClick={() => {
                  setCategory(aiSuggestion.category!);
                  setAiSuggestion(null);
                }}
              >
                Apply suggestion
              </button>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>What's the issue?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Brief Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Deep pothole near the station"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type of Problem</label>
                <select className="form-select" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <label className="form-label">More Details</label>
              <textarea
                className="form-textarea"
                placeholder="Where exactly is it? Is it causing traffic or safety issues?"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                required
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              📍 Where is it? <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>(Tap on the map)</span>
            </h3>
            {location && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Selected: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MapContainer center={[19.076, 72.877]} zoom={13} style={{ height: '350px' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OSM'
                />
                <LocationMarker />
              </MapContainer>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportPage;

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MapLibre from '../components/MapLibre';
import { reportIssue, fetchDuplicates, suggestCategory, uploadImage, verifyPhoto } from '../services/api';
import type { Issue } from '../types';
import {
  MapPin, Send, Loader2, CheckCircle2, AlertTriangle, Sparkles,
  Camera, Upload, X, ShieldCheck, AlertCircle, Image as ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [forensicResult, setForensicResult] = useState<any>(null);
  const [forensicLoading, setForensicLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Auto-run forensics if photo is already uploaded
    if (uploadedImageUrl) {
      runForensics(lat, lng);
    }
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

  const handlePhotoSelect = async (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setForensicResult(null);

    // Upload immediately
    setUploadingPhoto(true);
    try {
      const res = await uploadImage(file);
      setUploadedImageUrl(res.data.imageUrl);

      // Auto-run forensics if location is already set
      if (location) {
        runForensics(location.lat, location.lng);
      }
    } catch (err) {
      setError('Photo upload failed. Try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const runForensics = async (lat: number, lng: number) => {
    setForensicLoading(true);
    try {
      const res = await verifyPhoto({ reportedLat: lat, reportedLng: lng });
      setForensicResult(res.data);
    } catch {
      // Forensics is optional, don't block submission
    } finally {
      setForensicLoading(false);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadedImageUrl(null);
    setForensicResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handlePhotoSelect(file);
    }
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
      await reportIssue({
        title,
        description,
        category,
        location,
        image: uploadedImageUrl || undefined,
      });
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

          {/* Photo Upload Section */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Camera size={20} style={{ color: 'var(--primary-light)' }} />
              Add a Photo
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.25rem' }}>(recommended)</span>
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Photos help us verify and prioritize issues faster. Our AI agent checks GPS and timestamp data automatically.
            </p>

            {photoPreview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={photoPreview}
                  alt="Issue preview"
                  style={{
                    width: '100%',
                    maxHeight: '280px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                  }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute', top: '0.5rem', right: '0.5rem',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <X size={16} />
                </button>

                {/* Upload status overlay */}
                {uploadingPhoto && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0.75rem', background: 'rgba(0,0,0,0.7)',
                    borderRadius: '0 0 var(--radius) var(--radius)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.82rem', color: 'white',
                  }}>
                    <Loader2 size={14} className="animate-spin" /> Uploading...
                  </div>
                )}
                {uploadedImageUrl && !uploadingPhoto && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0.75rem', background: 'rgba(0,0,0,0.7)',
                    borderRadius: '0 0 var(--radius) var(--radius)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.82rem', color: '#22c55e',
                  }}>
                    <CheckCircle2 size={14} /> Photo uploaded successfully
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: dragOver ? 'rgba(99,102,241,0.05)' : 'transparent',
                }}
              >
                <Upload size={36} style={{ color: dragOver ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Drag a photo here or click to browse
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  JPG, PNG, or WebP — max 10 MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoSelect(file);
              }}
            />

            {/* Forensic Results */}
            {forensicLoading && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <Loader2 size={14} className="animate-spin" /> Running AI verification checks...
              </div>
            )}
            {forensicResult && (
              <div style={{
                marginTop: '0.75rem', padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: forensicResult.valid ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${forensicResult.valid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  {forensicResult.valid
                    ? <><ShieldCheck size={16} style={{ color: 'var(--success)' }} /> Photo checks passed</>
                    : <><AlertCircle size={16} style={{ color: 'var(--error)' }} /> Issues detected</>
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {Object.entries(forensicResult.checks).map(([key, check]: any) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: check.passed ? 'var(--success)' : 'var(--error)' }}>
                      {check.passed ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      <span>{check.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <MapLibre 
                center={[19.076, 72.877]} 
                zoom={13} 
                height="350px"
                onClick={handleLocationSelect}
                singleMarker={location || undefined}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading || uploadingPhoto}>
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            {loading ? 'Submitting...' : uploadingPhoto ? 'Uploading photo...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportPage;

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { List, Map as MapIcon, Clock, User } from 'lucide-react';
import L from 'leaflet';
import { fetchIssues } from '../services/api';
import { Issue } from '../types';

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const Dashboard: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const res = await fetchIssues();
      setIssues(res.data);
    } catch (err) {
      console.error('Failed to fetch issues', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reported': return 'badge-reported';
      case 'In Progress': return 'badge-progress';
      case 'Resolved': return 'badge-resolved';
      default: return '';
    }
  };

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Public Dashboard</h2>
        <div className="btn-group" style={{ display: 'flex', background: '#e2e8f0', padding: '2px', borderRadius: '8px' }}>
          <button className={`btn ${view === 'map' ? 'btn-primary' : ''}`} onClick={() => setView('map')}>
            <MapIcon size={18} /> Map
          </button>
          <button className={`btn ${view === 'list' ? 'btn-primary' : ''}`} onClick={() => setView('list')}>
            <List size={18} /> List
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Fetching city data...</div>
      ) : view === 'map' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <MapContainer center={[19.076, 72.877]} zoom={12} style={{ height: '500px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {issues.map((issue) => (
              <Marker key={issue._id} position={[issue.location.lat, issue.location.lng]}>
                <Popup>
                  <div style={{ width: '150px' }}>
                    <strong>{issue.type}</strong>
                    <p style={{ fontSize: '0.8rem', margin: '0.5rem 0' }}>{issue.description}</p>
                    <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="grid">
          {issues.map((issue) => (
            <div key={issue._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className={`badge ${getStatusBadge(issue.status)}`}>{issue.status}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3>{issue.type}</h3>
              <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{issue.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <User size={14} /> {issue.userName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

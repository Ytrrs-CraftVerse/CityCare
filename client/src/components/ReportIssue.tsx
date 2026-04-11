import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, MapPin, Send, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { reportIssue } from '../services/api';
import { Location, IssueType } from '../types';

// Fix for default marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const ReportIssue: React.FC = () => {
  const [type, setType] = useState<IssueType>('Pothole');
  const [description, setDescription] = useState('');
  const [userName, setUserName] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const LocationMarker = () => {
    useMapEvents({
      click(e: L.LeafletMouseEvent) {
        setLocation(e.latlng);
      },
    });

    return location === null ? null : (
      <Marker position={location}></Marker>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert('Please select a location on the map');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('type', type);
    formData.append('description', description);
    formData.append('lat', location.lat.toString());
    formData.append('lng', location.lng.toString());
    formData.append('userName', userName || 'Anonymous');
    if (image) formData.append('image', image);

    try {
      await reportIssue(formData);
      setMessage('Issue reported successfully!');
      setDescription('');
      setLocation(null);
      setImage(null);
    } catch (err) {
      console.error(err);
      setMessage('Failed to report issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MapPin className="text-primary" /> Report Civic Issue
      </h2>
      
      {message && (
        <div className={`badge ${message.includes('success') ? 'badge-resolved' : 'badge-reported'}`} style={{ marginBottom: '1rem', width: '100%', textAlign: 'center' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div className="form-group">
            <label>Issue Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as IssueType)}>
              <option value="Pothole">Pothole</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Garbage">Garbage</option>
              <option value="Water Leak">Water Leak</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Your Name (Optional)</label>
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={userName} 
              onChange={(e) => setUserName(e.target.value)} 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            placeholder="Describe the problem..." 
            rows={3} 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Select Location (Click map)</label>
          <div className="map-container" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer center={[19.076, 72.877]} zoom={13} style={{ height: '300px' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
            </MapContainer>
          </div>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '1rem' }}>
            <Camera className="text-secondary" /> {image ? image.name : 'Upload Photo'}
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)} 
            />
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
          {loading ? <Loader2 className="animate-spin" /> : <Send />}
          {loading ? 'Submitting...' : 'Report Issue'}
        </button>
      </form>
    </div>
  );
};

export default ReportIssue;

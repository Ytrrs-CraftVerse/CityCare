import React, { useEffect, useState } from 'react';
import MapLibre from '../components/MapLibre';
import { fetchDigitalTwinData } from '../services/api';
import type { DigitalTwinCell } from '../types';
import { Layers } from 'lucide-react';

const DigitalTwinPage: React.FC = () => {
  const [cells, setCells] = useState<DigitalTwinCell[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDigitalTwinData()
      .then((res) => setCells(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);



  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Building your city map...</span>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Layers size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-light)' }} />
          City Issue Map
        </h1>
        <p className="page-subtitle">
          A bird's-eye view of where issues are concentrated across the city.
        </p>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Density:</span>
          {[
            { color: '#22c55e', label: '1 issue' },
            { color: '#eab308', label: '2 issues' },
            { color: '#f97316', label: '3-4 issues' },
            { color: '#ef4444', label: '5+ issues' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, opacity: 0.85 }} />
              <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            {cells.length} zones mapped
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <MapLibre 
          center={[19.076, 72.877]} 
          zoom={12} 
          height="550px"
          heatCells={cells}
        />
      </div>
    </div>
  );
};

export default DigitalTwinPage;

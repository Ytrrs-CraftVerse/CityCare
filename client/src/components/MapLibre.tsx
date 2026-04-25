import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  status: string;
  category: string;
}

interface Props {
  center: [number, number];
  zoom: number;
  markers?: MarkerData[];
  style?: string;
  height?: string;
  onClick?: (lat: number, lng: number) => void;
  singleMarker?: { lat: number; lng: number };
  heatCells?: any[];
}

const MapLibre: React.FC<Props> = ({ 
  center, 
  zoom, 
  markers = [], 
  style = 'https://tiles.openfreemap.org/styles/dark', 
  height = '500px',
  onClick,
  singleMarker,
  heatCells = []
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style,
      center: [center[1], center[0]], // MapLibre uses [lng, lat]
      zoom: zoom,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }));

    if (onClick) {
      map.current.on('click', (e) => {
        onClick(e.lngLat.lat, e.lngLat.lng);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers if any (simple implementation: we could track them)
    // For now, we'll just add markers since it's initial load or full update
    
    markers.forEach(m => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      
      // Color based on status
      let color = 'var(--primary)';
      if (m.status === 'resolved') color = 'var(--success)';
      if (m.status === 'in-progress') color = 'var(--warning)';
      el.style.backgroundColor = color;

      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div style="min-width: 180px; padding: 5px;">
            <strong style="display: block; margin-bottom: 5px; color: #1e1b4b;">${m.title}</strong>
            <p style="font-size: 0.8rem; margin-bottom: 10px; color: #64748b;">${m.description.slice(0, 80)}...</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; background: ${color}20; color: ${color}; border: 1px solid ${color}40;">
                ${m.status}
              </span>
              <a href="/issues/${m.id}" style="font-size: 0.75rem; color: #3b82f6; text-decoration: none;">View →</a>
            </div>
          </div>
        `);

      new maplibregl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [markers]);

  const singleMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map.current || !singleMarker) return;

    if (singleMarkerRef.current) {
      singleMarkerRef.current.setLngLat([singleMarker.lng, singleMarker.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'single-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.backgroundColor = 'var(--primary)';
      el.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.4)';

      singleMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([singleMarker.lng, singleMarker.lat])
        .addTo(map.current);
    }
  }, [singleMarker]);

  useEffect(() => {
    if (!map.current || heatCells.length === 0) return;

    heatCells.forEach(cell => {
      const el = document.createElement('div');
      el.className = 'heat-cell';
      const radius = Math.min(8 + cell.count * 4, 28);
      el.style.width = `${radius * 2}px`;
      el.style.height = `${radius * 2}px`;
      el.style.borderRadius = '50%';
      
      let color = '#22c55e';
      if (cell.count >= 5) color = '#ef4444';
      else if (cell.count >= 3) color = '#f97316';
      else if (cell.count >= 2) color = '#eab308';
      
      el.style.backgroundColor = color;
      el.style.opacity = '0.6';
      el.style.border = `1px solid ${color}`;

      const popup = new maplibregl.Popup({ offset: radius })
        .setHTML(`
          <div style="min-width: 180px; font-family: Inter, sans-serif; padding: 5px;">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.4rem; color: #1e1b4b;">
              ${cell.count} issue${cell.count > 1 ? 's' : ''} here
            </div>
            <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 0.5rem;">
              ${Object.entries(cell.categories).map(([cat, n]) => `
                <span style="display: inline-block; marginRight: 0.5rem; text-transform: capitalize;">
                  ${cat}: ${n}
                </span>
              `).join('')}
            </div>
            ${cell.issues.slice(0, 3).map((issue: any) => `
              <a href="/issues/${issue._id}" style="display: block; font-size: 0.78rem; color: #3b82f6; margin-bottom: 0.2rem; text-decoration: none;">
                → ${issue.title}
              </a>
            `).join('')}
            ${cell.issues.length > 3 ? `
              <span style="font-size: 0.72rem; color: #94a3b8;">
                +${cell.issues.length - 3} more
              </span>
            ` : ''}
          </div>
        `);

      new maplibregl.Marker({ element: el })
        .setLngLat([cell.lng, cell.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [heatCells]);

  return <div ref={mapContainer} style={{ width: '100%', height, borderRadius: 'var(--radius-lg)' }} />;
};

export default MapLibre;

import React, { useEffect, useState } from 'react';
import { fetchSensorData } from '../services/api';
import type { SensorZone } from '../types';
import {
  Radio, Wind, Volume2, Droplets, RefreshCw,
  Loader2, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const SensorsPage: React.FC = () => {
  const [zones, setZones] = useState<SensorZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetchSensorData();
      setZones(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return { color: '#22c55e', label: 'Good' };
    if (aqi <= 100) return { color: '#eab308', label: 'Moderate' };
    if (aqi <= 150) return { color: '#f97316', label: 'Unhealthy (SG)' };
    if (aqi <= 200) return { color: '#ef4444', label: 'Unhealthy' };
    return { color: '#9333ea', label: 'Hazardous' };
  };

  const getNoiseColor = (db: number) => {
    if (db <= 50) return { color: '#22c55e', label: 'Quiet' };
    if (db <= 70) return { color: '#eab308', label: 'Moderate' };
    return { color: '#ef4444', label: 'Loud' };
  };

  const getWaterColor = (level: number) => {
    if (level >= 60) return { color: '#22c55e', label: 'Good' };
    if (level >= 30) return { color: '#eab308', label: 'Low' };
    return { color: '#ef4444', label: 'Critical' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Loading sensor data...</span>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">
              <Radio size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--teal)' }} />
              Live City Sensors
            </h1>
            <p className="page-subtitle">
              Real-time environmental monitoring across city zones
              <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid">
        {zones.map((zone, i) => {
          const aqi = getAqiColor(zone.sensors.airQuality.aqi);
          const noise = getNoiseColor(zone.sensors.noiseLevel.decibels);
          const water = getWaterColor(zone.sensors.waterTank.levelPercent);

          return (
            <div key={zone.id} className={`card animate-slide-up delay-${Math.min(i + 1, 6)}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{zone.name}</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{zone.ward}</span>
                </div>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)',
                  animation: 'pulse 2s infinite',
                }} />
              </div>

              {/* Air Quality */}
              <div className="sensor-row">
                <div className="sensor-label">
                  <Wind size={16} style={{ color: aqi.color }} />
                  <span>Air Quality</span>
                </div>
                <div className="sensor-value">
                  <div className="sensor-gauge">
                    <div className="sensor-gauge-fill" style={{ width: `${Math.min(zone.sensors.airQuality.aqi / 3, 100)}%`, background: aqi.color }} />
                  </div>
                  <span style={{ color: aqi.color, fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>
                    {Math.round(zone.sensors.airQuality.aqi)}
                  </span>
                  <span className="sensor-status" style={{ color: aqi.color }}>{aqi.label}</span>
                </div>
              </div>

              {/* Noise Level */}
              <div className="sensor-row">
                <div className="sensor-label">
                  <Volume2 size={16} style={{ color: noise.color }} />
                  <span>Noise Level</span>
                </div>
                <div className="sensor-value">
                  <div className="sensor-gauge">
                    <div className="sensor-gauge-fill" style={{ width: `${zone.sensors.noiseLevel.decibels}%`, background: noise.color }} />
                  </div>
                  <span style={{ color: noise.color, fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>
                    {Math.round(zone.sensors.noiseLevel.decibels)}dB
                  </span>
                  <span className="sensor-status" style={{ color: noise.color }}>{noise.label}</span>
                </div>
              </div>

              {/* Water Tank */}
              <div className="sensor-row">
                <div className="sensor-label">
                  <Droplets size={16} style={{ color: water.color }} />
                  <span>Water Tank</span>
                </div>
                <div className="sensor-value">
                  <div className="sensor-gauge">
                    <div className="sensor-gauge-fill" style={{ width: `${zone.sensors.waterTank.levelPercent}%`, background: water.color }} />
                  </div>
                  <span style={{ color: water.color, fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>
                    {Math.round(zone.sensors.waterTank.levelPercent)}%
                  </span>
                  <span className="sensor-status" style={{ color: water.color }}>{water.label}</span>
                </div>
              </div>

              {/* PM Values */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                <div className="pm-chip">
                  PM2.5: <strong>{Math.round(zone.sensors.airQuality.pm25)}</strong>
                </div>
                <div className="pm-chip">
                  PM10: <strong>{Math.round(zone.sensors.airQuality.pm10)}</strong>
                </div>
                <div className="pm-chip">
                  Tank: <strong>{(zone.sensors.waterTank.capacityLiters / 1000).toFixed(0)}kL</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SensorsPage;

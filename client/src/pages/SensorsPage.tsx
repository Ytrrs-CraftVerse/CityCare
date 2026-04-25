import React, { useEffect, useState } from 'react';
import { fetchSensorData } from '../services/api';
import type { SensorZone } from '../types';
import {
  Radio, Wind, Volume2, Droplets, RefreshCw,
  Loader2, Shield, Database,
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
    if (aqi <= 100) return { color: '#eab308', label: 'Satisfactory' };
    if (aqi <= 200) return { color: '#f97316', label: 'Moderate' };
    if (aqi <= 300) return { color: '#ef4444', label: 'Poor' };
    if (aqi <= 400) return { color: '#dc2626', label: 'Very Poor' };
    return { color: '#9333ea', label: 'Severe' };
  };

  const getNoiseColor = (db: number) => {
    if (db <= 50) return { color: '#22c55e', label: 'Quiet' };
    if (db <= 65) return { color: '#eab308', label: 'Moderate' };
    if (db <= 75) return { color: '#f97316', label: 'Loud' };
    return { color: '#ef4444', label: 'Very Loud' };
  };

  const getWaterColor = (level: number) => {
    if (level >= 70) return { color: '#22c55e', label: 'Good' };
    if (level >= 40) return { color: '#eab308', label: 'Normal' };
    if (level >= 20) return { color: '#f97316', label: 'Low' };
    return { color: '#ef4444', label: 'Critical' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Checking local air and water quality...</span>
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
              Live City Health
            </h1>
            <p className="page-subtitle">
              See what the air, water, and noise levels look like in your area right now.
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

      {/* Government API Attribution Banner */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(20,184,166,0.08))',
        border: '1px solid rgba(99,102,241,0.2)',
        padding: '1rem 1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={18} style={{ color: 'var(--primary-light)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-light)' }}>Where does this data come from?</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            <strong>Air Quality:</strong> WAQI / CPCB India (Central Pollution Control Board)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
            <strong>Water Quality:</strong> data.gov.in / CPCB RTWQMS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308' }} />
            <strong>Noise Level:</strong> CPCB Ambient Noise Standards (zone-type estimate)
          </div>
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
                  <span>Air Quality (AQI)</span>
                </div>
                <div className="sensor-value">
                  <div className="sensor-gauge">
                    <div className="sensor-gauge-fill" style={{ width: `${Math.min(zone.sensors.airQuality.aqi / 5, 100)}%`, background: aqi.color }} />
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

              {/* Water Level */}
              <div className="sensor-row">
                <div className="sensor-label">
                  <Droplets size={16} style={{ color: water.color }} />
                  <span>Water Level</span>
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

              {/* Data Source Attribution */}
              {zone.dataSource && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.4rem 0.6rem',
                  background: 'rgba(99,102,241,0.05)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}>
                  <Database size={10} />
                  {zone.dataSource.airQuality.includes('CPCB') || zone.dataSource.airQuality.includes('WAQI')
                    ? '🟢 Live CPCB data'
                    : '🟡 Estimated'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SensorsPage;

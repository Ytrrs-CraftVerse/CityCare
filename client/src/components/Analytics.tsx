import React, { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchStats } from '../services/api';
import type { IssueStats } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Analytics: React.FC = () => {
  const [stats, setStats] = useState<IssueStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetchStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading transparency data...</div>;

  const typeData = {
    labels: stats.byType.map(t => t._id),
    datasets: [
      {
        label: 'Issues by Category',
        data: stats.byType.map(t => t.count),
        backgroundColor: 'rgba(14, 165, 233, 0.7)',
        borderColor: '#0ea5e9',
        borderWidth: 1,
      },
    ],
  };

  const resolutionData = {
    labels: ['Resolved', 'Pending'],
    datasets: [
      {
        data: [stats.resolved, stats.total - stats.resolved],
        backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderColor: ['#10b981', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="analytics">
      <h2 style={{ marginBottom: '1.5rem' }}>Resolution Analytics</h2>

      <div className="grid" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity className="text-primary" size={24} />
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Reports</p>
            <h3>{stats.total}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle2 style={{ color: '#10b981' }} size={24} />
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Resolved</p>
            <h3>{stats.resolved}</h3>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle style={{ color: '#f59e0b' }} size={24} />
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending</p>
            <h3>{stats.total - stats.resolved}</h3>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>By Category</h4>
          <Bar data={typeData} options={{ responsive: true }} />
        </div>
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Resolution</h4>
          <Pie data={resolutionData} options={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { fetchStats } from '../services/api';
import type { IssueStats } from '../types';
import { Activity, CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <div className="empty-state">
          <Activity size={48} />
          <h3>No data available</h3>
          <p>Start reporting issues to see analytics</p>
        </div>
      </div>
    );
  }

  const resolutionRate = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0';

  const categoryData = {
    labels: stats.byCategory.map((t) => t._id?.charAt(0).toUpperCase() + t._id?.slice(1)),
    datasets: [
      {
        label: 'Issues by Category',
        data: stats.byCategory.map((t) => t.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          '#3b82f6',
          '#8b5cf6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
        ],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const statusData = {
    labels: ['Resolved', 'In Progress', 'Reported'],
    datasets: [
      {
        data: [stats.resolved, stats.inProgress, stats.reported],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderColor: ['#10b981', '#f59e0b', '#3b82f6'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter' },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
      },
      y: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter' },
          padding: 16,
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <TrendingUp size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-light)' }} />
          Resolution Analytics
        </h1>
        <p className="page-subtitle">Track city responsiveness and transparent governance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="card stat-card">
          <div className="stat-icon blue"><Activity size={24} /></div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Reports</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon green"><CheckCircle2 size={24} /></div>
          <div>
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon yellow"><Clock size={24} /></div>
          <div>
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon purple"><AlertCircle size={24} /></div>
          <div>
            <div className="stat-value">{resolutionRate}%</div>
            <div className="stat-label">Resolution Rate</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Issues by Category</h3>
          <Bar data={categoryData} options={chartOptions} />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Resolution Status</h3>
          <div style={{ maxWidth: '300px', margin: '0 auto' }}>
            <Doughnut data={statusData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

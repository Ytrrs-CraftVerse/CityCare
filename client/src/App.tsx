import { useState } from 'react';
import { Building2, PlusCircle, LayoutDashboard, BarChart3, ShieldCheck } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ReportIssue from './components/ReportIssue';
import Analytics from './components/Analytics';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'analytics'>('dashboard');

  return (
    <>
      <header>
        <div className="logo">
          <Building2 size={32} />
          <span>CityCare</span>
        </div>
        <nav>
          <a 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => setActiveTab('dashboard')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LayoutDashboard size={18} /> Dashboard
            </div>
          </a>
          <a 
            className={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveTab('analytics')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={18} /> Analytics
            </div>
          </a>
        </nav>
        <button className="btn btn-primary" onClick={() => setActiveTab('report')}>
          <PlusCircle size={18} /> Report Issue
        </button>
      </header>

      <main>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'report' && <ReportIssue />}
        {activeTab === 'analytics' && <Analytics />}
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', borderTop: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={20} className="text-primary" />
          <span style={{ fontWeight: 600 }}>CityCare Integrity System</span>
        </div>
        <p>© 2026 Smart City Public Works. Transparency & Accountability.</p>
      </footer>
    </>
  );
}

export default App;

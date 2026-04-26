import React, { useEffect, useState } from 'react';
import { fetchOpen311Services, fetchOpen311Requests } from '../services/api';
import type { Open311Service } from '../types';
import { Code2, Globe, Copy, CheckCircle2, Server, ChevronDown, ChevronRight } from 'lucide-react';

const ApiExplorerPage: React.FC = () => {
  const [services, setServices] = useState<Open311Service[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [filterCode, setFilterCode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    Promise.all([
      fetchOpen311Services(),
      fetchOpen311Requests(),
    ])
      .then(([svcRes, reqRes]) => {
        setServices(svcRes.data);
        setRequests(reqRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleFilter = async () => {
    try {
      const params: any = {};
      if (filterCode) params.service_code = filterCode;
      if (filterStatus) params.status = filterStatus;
      const res = await fetchOpen311Requests(params);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const baseUrl = 'http://localhost:5000/api/governance';

  if (loading) {
    return (
      <div className="loading-container">
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
        <span>Loading API data...</span>
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Code2 size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--teal)' }} />
          Open311 API Explorer
        </h1>
        <p className="page-subtitle">
          Our data follows the Open311 standard — any developer can plug into it.
        </p>
      </div>

      {/* Quick reference endpoints */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Globe size={18} style={{ color: 'var(--primary-light)' }} /> Available Endpoints
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { method: 'GET', path: '/services', desc: 'List available service types' },
            { method: 'GET', path: '/requests', desc: 'List all service requests' },
            { method: 'GET', path: '/requests/:id', desc: 'Get a single request with asset data' },
            { method: 'GET', path: '/asset-lookup?lat=&lng=', desc: 'Look up road & contractor for GPS coords' },
            { method: 'POST', path: '/verify-photo', desc: 'Run photo forensics (EXIF check)' },
            { method: 'POST', path: '/qr/generate/:issueId', desc: 'Generate geofenced QR for issue' },
            { method: 'POST', path: '/qr/verify', desc: 'Verify a scanned QR + geofence check' },
          ].map((ep) => (
            <div key={ep.path} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)', fontSize: '0.85rem',
            }}>
              <span style={{
                fontWeight: 700, fontSize: '0.72rem', padding: '0.15rem 0.5rem',
                borderRadius: '4px', fontFamily: 'monospace',
                background: ep.method === 'GET' ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.12)',
                color: ep.method === 'GET' ? 'var(--success)' : 'var(--primary-light)',
              }}>
                {ep.method}
              </span>
              <code style={{ flex: 1, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                {baseUrl}{ep.path}
              </code>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{ep.desc}</span>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => copyToClipboard(`${baseUrl}${ep.path}`, ep.path)}
                title="Copy URL"
              >
                {copied === ep.path ? <CheckCircle2 size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Service Codes */}
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Server size={18} style={{ color: 'var(--success)' }} /> Service Codes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {services.map((svc) => (
              <div key={svc.service_code} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)', fontSize: '0.85rem',
              }}>
                <div>
                  <code style={{ fontWeight: 700, color: 'var(--primary-light)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {svc.service_code}
                  </code>
                  <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>{svc.service_name}</span>
                </div>
                <span className="badge badge-category" style={{ fontSize: '0.68rem' }}>{svc.keywords}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="card">
          <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Try It</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Filter live requests using Open311 parameters:
          </p>
          <div className="form-group">
            <label className="form-label">Service Code</label>
            <select className="form-select" value={filterCode} onChange={(e) => setFilterCode(e.target.value)}>
              <option value="">All Services</option>
              {services.map((s) => (
                <option key={s.service_code} value={s.service_code}>{s.service_code} — {s.service_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleFilter}>
            <Code2 size={14} /> Fetch
          </button>
        </div>
      </div>

      {/* Live Requests Feed */}
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>
          Live Open311 Requests ({requests.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '400px', overflowY: 'auto' }}>
          {requests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No requests found.</p>
          ) : (
            requests.map((req: any) => (
              <div key={req.service_request_id} style={{
                padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)', fontSize: '0.85rem', cursor: 'pointer',
              }}
              onClick={() => setExpandedReq(expandedReq === req.service_request_id ? null : req.service_request_id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {expandedReq === req.service_request_id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <code style={{ fontWeight: 600, color: 'var(--text-accent)', fontSize: '0.78rem' }}>
                      {req.service_request_id}
                    </code>
                    <span style={{ color: 'var(--text-secondary)' }}>{req.service_name}</span>
                  </div>
                  <span className={`badge ${req.status === 'closed' ? 'badge-resolved' : 'badge-reported'}`}>
                    {req.status}
                  </span>
                </div>
                {expandedReq === req.service_request_id && (
                  <pre style={{
                    marginTop: '0.5rem', padding: '0.75rem', background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', overflow: 'auto',
                    color: 'var(--text-secondary)', maxHeight: '200px', whiteSpace: 'pre-wrap',
                  }}>
                    {JSON.stringify(req, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiExplorerPage;

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUnreadCount, fetchNotifications, markAllNotificationsRead } from '../services/api';
import type { AppNotification } from '../types';
import {
  Building2,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Home,
  Shield,
  Bell,
  Vote,
  Radio,
  X,
  Layers,
  Code2,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {});

      const interval = setInterval(() => {
        fetchUnreadCount()
          .then((res) => setUnreadCount(res.data.count))
          .catch(() => {});
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleBellClick = async () => {
    if (showNotifs) {
      setShowNotifs(false);
      return;
    }
    try {
      const res = await fetchNotifications();
      setNotifications(res.data);
      setShowNotifs(true);
    } catch {
      setShowNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <>
      <header className="app-header">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <Building2 size={28} />
          <span>CityCare</span>
        </Link>

        <nav className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <Home size={18} /> Home
          </Link>
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> Community
          </Link>
          <Link to="/analytics" className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}>
            <BarChart3 size={18} /> Analytics
          </Link>
          <Link to="/projects" className={`nav-link ${isActive('/projects') ? 'active' : ''}`}>
            <Vote size={18} /> Projects
          </Link>
          <Link to="/sensors" className={`nav-link ${isActive('/sensors') ? 'active' : ''}`}>
            <Radio size={18} /> Live Health
          </Link>
          <Link to="/digital-twin" className={`nav-link ${isActive('/digital-twin') ? 'active' : ''}`}>
            <Layers size={18} /> City Map
          </Link>
          <Link to="/api-explorer" className={`nav-link ${isActive('/api-explorer') ? 'active' : ''}`}>
            <Code2 size={18} /> API
          </Link>
          {user && (
            <Link to="/report" className={`nav-link ${isActive('/report') ? 'active' : ''}`}>
              <PlusCircle size={18} /> Report
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <Shield size={18} /> Admin
            </Link>
          )}
        </nav>

        <div className="nav-actions">
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-ghost btn-icon"
                onClick={handleBellClick}
                title="Notifications"
                style={{ position: 'relative' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {showNotifs && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <h4>Notifications</h4>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {unreadCount > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
                          Mark all read
                        </button>
                      )}
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowNotifs(false)}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <Link
                          key={n._id}
                          to={n.issueId ? `/issues/${n.issueId}` : '#'}
                          className={`notif-item ${n.read ? '' : 'unread'}`}
                          onClick={() => setShowNotifs(false)}
                        >
                          <p>{n.message}</p>
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <>
              <Link to="/profile" className="user-badge" style={{ textDecoration: 'none' }}>
                <User size={16} />
                <span>{user.name}</span>
                <span className={`role-tag ${isAdmin ? 'admin' : ''}`}>{user.role}</span>
              </Link>
              <button className="btn btn-ghost" onClick={logout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                <LogIn size={18} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={16} /> Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="app-footer">
        <div className="footer-brand">
          <Shield size={18} className="text-primary" />
          <span>CityCare Community Platform</span>
        </div>
        <p>© 2026 Made for better neighborhoods. Open source & transparent.</p>
      </footer>
    </>
  );
};

export default Layout;

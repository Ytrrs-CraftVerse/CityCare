import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  User,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  Home,
  Shield,
} from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/analytics" className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}>
            <BarChart3 size={18} /> Analytics
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
          <ShieldCheck size={18} className="text-primary" />
          <span>CityCare Integrity System</span>
        </div>
        <p>© 2026 Smart City Public Works. Transparency & Accountability.</p>
      </footer>
    </>
  );
};

export default Layout;

import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineMenu } from 'react-icons/hi';
import Sidebar from './Sidebar';
import './AppLayout.css';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner--lg"></div>
        <p className="loading-screen__text">Loading your finances...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      {/* Mobile top navigation bar */}
      <div className="mobile-header">
        <button 
          className="mobile-header__menu-btn" 
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <HiOutlineMenu size={24} />
        </button>
        <div className="mobile-header__logo">
          <span className="sidebar__logo-icon">💰</span>
          <span className="sidebar__logo-text">ExpenseTracker</span>
        </div>
      </div>

      <div className="animated-bg" />
      
      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} closeSidebar={() => setMobileOpen(false)} />
      
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

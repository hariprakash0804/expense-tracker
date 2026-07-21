import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineCreditCard, HiOutlineChartPie,
  HiOutlineCalendar, HiOutlineCog, HiOutlineNewspaper,
  HiOutlineCurrencyDollar, HiOutlineChevronLeft,
  HiOutlineChevronRight, HiOutlineLogout, HiOutlineStar, HiOutlineTrendingUp,
  HiOutlinePresentationChartLine, HiOutlineCollection, HiOutlineDocumentText,
  HiOutlineScale, HiOutlineBadgeCheck, HiOutlineChartBar, HiOutlineUsers,
  HiOutlineCalculator
} from 'react-icons/hi';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard' },
  { to: '/income', icon: HiOutlineTrendingUp, label: 'Income' },
  { to: '/expenses', icon: HiOutlineCreditCard, label: 'Expenses' },
  { to: '/budget', icon: HiOutlineCurrencyDollar, label: 'Budget' },
  { to: '/analytics', icon: HiOutlineChartPie, label: 'Analytics' },
  { to: '/projections', icon: HiOutlinePresentationChartLine, label: 'Wealth Projections' },
  { to: '/balance-sheet', icon: HiOutlineScale, label: 'Balance Sheet' },
  { to: '/portfolio', icon: HiOutlineChartBar, label: 'Investments' },
  { to: '/recurring', icon: HiOutlineCalendar, label: 'Recurring' },
  { to: '/savings', icon: HiOutlineStar, label: 'Savings Goals' },
  { to: '/debt', icon: HiOutlineCollection, label: 'Debt Planner' },
  { to: '/tax', icon: HiOutlineDocumentText, label: 'Tax Planner' },
  { to: '/achievements', icon: HiOutlineBadgeCheck, label: 'Achievements' },
  { to: '/split', icon: HiOutlineUsers, label: 'Bill Splitter' },
  { to: '/calculators', icon: HiOutlineCalculator, label: 'Calculators' },
  { to: '/market', icon: HiOutlineNewspaper, label: 'Market & News' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

const Sidebar = ({ mobileOpen, closeSidebar }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLinkClick = () => {
    if (closeSidebar) closeSidebar();
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          {!collapsed && (
            <div className="sidebar__logo">
              <span className="sidebar__logo-icon">💰</span>
              <span className="sidebar__logo-text">ExpenseTracker</span>
            </div>
          )}
          {collapsed && <span className="sidebar__logo-icon">💰</span>}
          <button
            className="sidebar__toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronLeft />}
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              end={to === '/'}
              title={label}
              onClick={handleLinkClick}
            >
              <Icon className="sidebar__link-icon" />
              {!collapsed && <span className="sidebar__link-text">{label}</span>}
              {location.pathname === to && (
                <span className="sidebar__link-indicator" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          {!collapsed && user && (
            <div className="sidebar__user">
              <div className="sidebar__avatar">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="sidebar__user-info">
                <span className="sidebar__user-name">{user.name}</span>
                <span className="sidebar__user-email">{user.email}</span>
              </div>
            </div>
          )}
          <button className="sidebar__logout" onClick={() => { logout(); handleLinkClick(); }} title="Logout">
            <HiOutlineLogout />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import './AppLayout.css';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();

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
      <div className="animated-bg" />
      <Sidebar />
      <main className="app-layout__main">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

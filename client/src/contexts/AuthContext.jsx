import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  // Set token in axios defaults
  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      localStorage.setItem('accessToken', accessToken);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('accessToken');
    }
  }, [accessToken]);

  // Fetch user profile on mount or token change
  const fetchUser = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch (error) {
      // Try refreshing token
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        const userRes = await api.get('/auth/me');
        setUser(userRes.data.data.user);
      } catch {
        // Refresh failed, clear everything
        setAccessToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data;
  };

  const register = async (name, email, password, currency = 'INR') => {
    const { data } = await api.post('/auth/register', { name, email, password, currency });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Logout even if API call fails
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 &&
            error.response?.data?.code === 'TOKEN_EXPIRED' &&
            !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { data } = await api.post('/auth/refresh');
            const newToken = data.data.accessToken;
            setAccessToken(newToken);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return api(originalRequest);
          } catch {
            setAccessToken(null);
            setUser(null);
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

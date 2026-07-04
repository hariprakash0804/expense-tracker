import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', currency: 'INR' });
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const toast = useToast();

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getPasswordStrength = () => {
    const { password } = form;
    if (!password) return { text: '', color: '', width: '0%' };
    if (password.length < 6) return { text: 'Weak', color: 'var(--accent-danger)', width: '25%' };
    if (password.length < 8) return { text: 'Fair', color: 'var(--accent-warning)', width: '50%' };
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { text: 'Strong', color: 'var(--accent-primary)', width: '100%' };
    return { text: 'Good', color: 'var(--accent-info)', width: '75%' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.currency);
      toast.success('Account created successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="animated-bg" />
      <div className="auth-card glass-card--static">
        <div className="auth-card__header">
          <span className="auth-card__logo">💰</span>
          <h1 className="auth-card__title">Create Account</h1>
          <p className="auth-card__subtitle">Start tracking your expenses today</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
            {form.password && (
              <div className="password-strength">
                <div className="password-strength__bar">
                  <div
                    className="password-strength__fill"
                    style={{ width: strength.width, background: strength.color }}
                  />
                </div>
                <span className="password-strength__text" style={{ color: strength.color }}>
                  {strength.text}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="currency">Default Currency</label>
            <select
              id="currency"
              name="currency"
              className="form-select"
              value={form.currency}
              onChange={handleChange}
            >
              <option value="INR">🇮🇳 INR — Indian Rupee</option>
              <option value="USD">🇺🇸 USD — US Dollar</option>
              <option value="EUR">🇪🇺 EUR — Euro</option>
              <option value="GBP">🇬🇧 GBP — British Pound</option>
              <option value="JPY">🇯🇵 JPY — Japanese Yen</option>
              <option value="AUD">🇦🇺 AUD — Australian Dollar</option>
              <option value="CAD">🇨🇦 CAD — Canadian Dollar</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg w-full"
            disabled={loading}
          >
            {loading ? <span className="spinner spinner--sm" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-card__link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

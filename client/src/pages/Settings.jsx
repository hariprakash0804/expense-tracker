import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/dataService';
import Header from '../components/layout/Header';
import './Settings.css';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const [profile, setProfile] = useState({ name: user?.name || '', currency: user?.currency || 'INR' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authService.updateProfile({ name: profile.name, currency: profile.currency, theme });
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error('Passwords don\'t match'); return; }
    if (passwords.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    setSavingPassword(true);
    try {
      await authService.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingPassword(false); }
  };

  return (
    <>
      <Header title="Settings" subtitle="Manage your account and preferences" />
      <div className="settings-page">
        {/* Profile */}
        <div className="glass-card--static settings-page__section">
          <h3 className="settings-page__section-title">👤 Profile</h3>
          <form onSubmit={handleProfileSave} className="settings-page__form">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Default Currency</label>
              <select className="form-select" value={profile.currency}
                onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}>
                <option value="INR">🇮🇳 INR</option><option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option><option value="GBP">🇬🇧 GBP</option>
                <option value="JPY">🇯🇵 JPY</option><option value="AUD">🇦🇺 AUD</option>
                <option value="CAD">🇨🇦 CAD</option>
              </select>
            </div>
            <button type="submit" className="btn btn--primary" disabled={savingProfile}>
              {savingProfile ? <span className="spinner spinner--sm" /> : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Theme */}
        <div className="glass-card--static settings-page__section">
          <h3 className="settings-page__section-title">🎨 Appearance</h3>
          <div className="settings-page__theme-toggle">
            <p className="text-sm">Current theme: <strong>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</strong></p>
            <button className="btn btn--ghost" onClick={toggleTheme}>
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="glass-card--static settings-page__section">
          <h3 className="settings-page__section-title">🔒 Change Password</h3>
          <form onSubmit={handlePasswordChange} className="settings-page__form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={passwords.currentPassword}
                onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" placeholder="Min. 6 characters" value={passwords.newPassword}
                onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={passwords.confirmPassword}
                onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} required />
            </div>
            <button type="submit" className="btn btn--secondary" disabled={savingPassword}>
              {savingPassword ? <span className="spinner spinner--sm" /> : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="glass-card--static settings-page__section settings-page__danger">
          <h3 className="settings-page__section-title">⚠️ Danger Zone</h3>
          <p className="text-sm text-secondary">Logging out will clear your session.</p>
          <button className="btn btn--danger" onClick={logout} style={{ marginTop: 'var(--space-4)' }}>
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { recurringService } from '../services/dataService';
import { formatCurrency, formatDate, categoryIcons, categories, paymentMethods, frequencies, getToday } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineRefresh } from 'react-icons/hi';
import './Recurring.css';

const Recurring = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    amount: '', description: '', category: 'Bills', paymentMethod: 'Cash',
    currency: user?.currency || 'INR', frequency: 'monthly', startDate: getToday(), endDate: '',
  });

  useEffect(() => { fetchRecurring(); }, []);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const { data } = await recurringService.getRecurring();
      setRecurring(data.data.recurring);
    } catch { toast.error('Failed to load recurring expenses'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ amount: '', description: '', category: 'Bills', paymentMethod: 'Cash',
      currency: user?.currency || 'INR', frequency: 'monthly', startDate: getToday(), endDate: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) { toast.error('Fill required fields'); return; }
    try {
      const payload = { ...form, amount: parseFloat(form.amount), endDate: form.endDate || null };
      if (editing) {
        await recurringService.updateRecurring(editing.id, payload);
        toast.success('Updated!');
      } else {
        await recurringService.createRecurring(payload);
        toast.success('Recurring expense created!');
      }
      setShowModal(false); fetchRecurring();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (id) => {
    try { await recurringService.toggleRecurring(id); fetchRecurring(); }
    catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this recurring expense?')) return;
    try { await recurringService.deleteRecurring(id); toast.success('Deactivated'); fetchRecurring(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <>
      <Header title="Recurring Expenses" subtitle="Manage your subscriptions and recurring payments"
        onAddClick={openAdd} addLabel="Add Recurring" />
      <div className="recurring-page">
        {loading ? (
          <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}><div className="spinner spinner--lg" /></div>
        ) : recurring.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">🔄</p>
            <p className="empty-state__title">No recurring expenses</p>
            <p className="empty-state__description">Set up recurring payments like rent, subscriptions, and bills</p>
            <button className="btn btn--primary" onClick={openAdd}>Add Recurring Expense</button>
          </div>
        ) : (
          <div className="recurring-page__grid stagger-children">
            {recurring.map(r => (
              <div key={r.id} className={`glass-card recurring-page__card ${!r.isActive && !r.is_active ? 'recurring-page__card--inactive' : ''}`}>
                <div className="recurring-page__card-header">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '1.5rem' }}>{categoryIcons[r.category] || '📦'}</span>
                    <div>
                      <h3 className="font-semibold">{r.description}</h3>
                      <span className="text-xs text-secondary">{r.frequency} • {r.category}</span>
                    </div>
                  </div>
                  <span className={`badge badge--${r.isActive || r.is_active ? 'success' : 'danger'}`}>
                    {r.isActive || r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="recurring-page__card-body">
                  <div>
                    <span className="text-sm text-secondary">Amount</span>
                    <p className="font-bold" style={{ fontSize: 'var(--fs-xl)' }}>{formatCurrency(r.amount, r.currency)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-secondary">Next Due</span>
                    <p className="font-medium">{formatDate(r.nextDueDate || r.next_due_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-secondary">Payment</span>
                    <p className="font-medium">{r.paymentMethod || r.payment_method}</p>
                  </div>
                </div>
                <div className="recurring-page__card-actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => handleToggle(r.id)}>
                    <HiOutlineRefresh /> {r.isActive || r.is_active ? 'Pause' : 'Resume'}
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => handleDelete(r.id)}
                    style={{ color: 'var(--accent-danger)' }}><HiOutlineTrash /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editing ? 'Edit' : 'Add'} Recurring Expense</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input type="number" step="0.01" className="form-input" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select className="form-select" value={form.frequency}
                    onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                    {frequencies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input type="text" className="form-input" placeholder="e.g. Netflix subscription"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{categoryIcons[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
                </div>
              </div>
              <div className="modal__footer" style={{ padding: 0, borderTop: 'none' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Recurring;

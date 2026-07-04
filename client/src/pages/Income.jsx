import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { incomeService } from '../services/dataService';
import { formatCurrency, formatDate, getToday } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlineFilter, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import './Income.css';

const incomeCategories = ['Salary', 'Business', 'Investments', 'Freelance', 'Gift', 'Other'];
const incomeCategoryIcons = {
  Salary: '💰',
  Business: '🏢',
  Investments: '📈',
  Freelance: '💻',
  Gift: '🎁',
  Other: '📦'
};
const incomePaymentMethods = ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Other'];

const Income = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [incomes, setIncomes] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '', category: '', paymentMethod: '',
    startDate: '', endDate: '', sortBy: 'date', sortOrder: 'DESC',
  });
  const [form, setForm] = useState({
    amount: '', description: '', category: 'Salary', date: getToday(),
    paymentMethod: 'Bank Transfer', currency: user?.currency || 'INR', notes: '',
  });

  useEffect(() => {
    fetchIncomes();
  }, [pagination.page, filters.sortBy, filters.sortOrder]);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const { data } = await incomeService.getIncomes(params);
      setIncomes(data.data.incomes);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch income logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPagination(p => ({ ...p, page: 1 }));
    fetchIncomes();
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', paymentMethod: '', startDate: '', endDate: '', sortBy: 'date', sortOrder: 'DESC' });
    setPagination(p => ({ ...p, page: 1 }));
    setTimeout(fetchIncomes, 0);
  };

  const openAddModal = () => {
    setEditingIncome(null);
    setForm({ amount: '', description: '', category: 'Salary', date: getToday(), paymentMethod: 'Bank Transfer', currency: user?.currency || 'INR', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (income) => {
    setEditingIncome(income);
    setForm({
      amount: income.amount, description: income.description, category: income.category,
      date: income.date, paymentMethod: income.paymentMethod || income.payment_method, currency: income.currency,
      notes: income.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editingIncome) {
        await incomeService.updateIncome(editingIncome.id, payload);
        toast.success('Income updated!');
      } else {
        await incomeService.createIncome(payload);
        toast.success('Income logged!');
      }
      setShowModal(false);
      fetchIncomes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income log?')) return;
    try {
      await incomeService.deleteIncome(id);
      toast.success('Income deleted');
      fetchIncomes();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      <Header title="Income" subtitle="Log and monitor your incoming cash flow" onAddClick={openAddModal} addLabel="Add Income" />
      <div className="income-page">
        {/* Filter Bar */}
        <div className="income-page__toolbar glass-card--static">
          <div className="income-page__toolbar-left">
            <div className="income-page__search">
              <input type="text" className="form-input" placeholder="Search description..." value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
            </div>
            <button className={`btn btn--ghost ${showFilters ? 'btn--active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <HiOutlineFilter /> Filters
            </button>
          </div>
          <span className="text-sm text-secondary">{pagination.total} records</span>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="income-page__filters glass-card--static slide-up">
            <div className="income-page__filter-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                  <option value="">All Categories</option>
                  {incomeCategories.map(c => <option key={c} value={c}>{incomeCategoryIcons[c]} {c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={filters.paymentMethod} onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}>
                  <option value="">All Methods</option>
                  {incomePaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="income-page__filter-actions">
              <button className="btn btn--primary btn--sm" onClick={applyFilters}>Apply Filters</button>
              <button className="btn btn--ghost btn--sm" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        )}

        {/* Income Table */}
        <div className="glass-card--static income-page__table-container">
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}><div className="spinner" /></div>
          ) : incomes.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__icon">💰</p>
              <p className="empty-state__title">No income records found</p>
              <p className="empty-state__description">Log your first income entry to track cash flow</p>
              <button className="btn btn--primary" onClick={openAddModal}>Add Income</button>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Method</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map(inc => (
                    <tr key={inc.id}>
                      <td>{formatDate(inc.date)}</td>
                      <td>
                        <span className="font-medium">{inc.description}</span>
                        {inc.notes && <span className="text-xs text-secondary" style={{ display: 'block' }}>{inc.notes}</span>}
                      </td>
                      <td><span className="badge badge--success">{incomeCategoryIcons[inc.category]} {inc.category}</span></td>
                      <td className="font-semibold" style={{ color: 'var(--accent-primary)' }}>+{formatCurrency(inc.amount, inc.currency)}</td>
                      <td className="text-sm text-secondary">{inc.paymentMethod || inc.payment_method}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn--ghost btn--icon" onClick={() => openEditModal(inc)} title="Edit"><HiOutlinePencil /></button>
                          <button className="btn btn--ghost btn--icon" onClick={() => handleDelete(inc.id)} title="Delete" style={{ color: 'var(--accent-danger)' }}><HiOutlineTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="income-page__pagination">
                  <button className="btn btn--ghost btn--sm" disabled={pagination.page <= 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}>Previous</button>
                  <span className="text-sm text-secondary">Page {pagination.page} of {pagination.totalPages}</span>
                  <button className="btn btn--ghost btn--sm" disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">{editingIncome ? 'Edit Income' : 'Log Income'}</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="income-modal__grid">
                <div className="form-group">
                  <label className="form-label">Amount *</label>
                  <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input type="text" className="form-input" placeholder="e.g. Monthly Salary, Freelance project"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="income-modal__grid">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {incomeCategories.map(c => <option key={c} value={c}>{incomeCategoryIcons[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={form.paymentMethod}
                    onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {incomePaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows="2" placeholder="Optional details..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal__footer" style={{ padding: 0, borderTop: 'none', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">{editingIncome ? 'Update' : 'Log Income'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Income;

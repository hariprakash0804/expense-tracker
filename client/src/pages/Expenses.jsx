import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { expenseService } from '../services/dataService';
import { formatCurrency, formatDate, categoryIcons, categories, paymentMethods, getToday } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlineFilter, HiOutlineDownload, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineDocumentText, HiOutlineUpload } from 'react-icons/hi';
import CSVImporter from '../components/expenses/CSVImporter';
import { exportExpensesToPDF } from '../utils/pdfExporter';
import './Expenses.css';

const Expenses = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '', category: '', paymentMethod: '',
    startDate: '', endDate: '', sortBy: 'date', sortOrder: 'DESC',
  });
  const [form, setForm] = useState({
    amount: '', description: '', category: 'Other', date: getToday(),
    paymentMethod: 'Cash', currency: user?.currency || 'INR', notes: '', tags: [],
  });

  const handleExportPDF = () => {
    if (expenses.length === 0) {
      toast.warning('No data to export');
      return;
    }
    exportExpensesToPDF(expenses, user, { startDate: filters.startDate, endDate: filters.endDate });
    toast.success('Generated statement PDF!');
  };

  useEffect(() => { fetchExpenses(); }, [pagination.page, filters.sortBy, filters.sortOrder]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const { data } = await expenseService.getExpenses(params);
      setExpenses(data.data.expenses);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => { setPagination(p => ({ ...p, page: 1 })); fetchExpenses(); };

  const clearFilters = () => {
    setFilters({ search: '', category: '', paymentMethod: '', startDate: '', endDate: '', sortBy: 'date', sortOrder: 'DESC' });
    setPagination(p => ({ ...p, page: 1 }));
    setTimeout(fetchExpenses, 0);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setForm({ amount: '', description: '', category: 'Other', date: getToday(), paymentMethod: 'Cash', currency: user?.currency || 'INR', notes: '', tags: [] });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setForm({
      amount: expense.amount, description: expense.description, category: expense.category,
      date: expense.date, paymentMethod: expense.paymentMethod || expense.payment_method, currency: expense.currency,
      notes: expense.notes || '', tags: expense.tags || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) { toast.error('Please fill required fields'); return; }

    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, payload);
        toast.success('Expense updated!');
      } else {
        await expenseService.createExpense(payload);
        toast.success('Expense added!');
      }
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expenseService.deleteExpense(id);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch { toast.error('Delete failed'); }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) { toast.warning('No data to export'); return; }
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency', 'Payment Method', 'Notes'];
    const rows = expenses.map(e => [e.date, e.description, e.category, e.amount, e.currency, e.paymentMethod || e.payment_method, e.notes || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `expenses_${getToday()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV!');
  };

  return (
    <>
      <Header title="Expenses" subtitle="Track and manage all your expenses" onAddClick={openAddModal} addLabel="Add Expense" />
      <div className="expenses-page">
        {/* Filter Bar */}
        <div className="expenses-page__toolbar glass-card--static">
          <div className="expenses-page__toolbar-left">
            <div className="expenses-page__search">
              <input type="text" className="form-input" placeholder="Search expenses..." value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
            </div>
            <button className={`btn btn--ghost ${showFilters ? 'btn--active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
              <HiOutlineFilter /> Filters
            </button>
            <button className="btn btn--ghost" onClick={() => setShowCSVModal(true)}><HiOutlineUpload /> Import CSV</button>
            <button className="btn btn--ghost" onClick={handleExportCSV}><HiOutlineDownload /> CSV</button>
            <button className="btn btn--ghost" onClick={handleExportPDF}><HiOutlineDocumentText /> PDF Report</button>
          </div>
          <span className="text-sm text-secondary">{pagination.total} expenses</span>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="expenses-page__filters glass-card--static slide-up">
            <div className="expenses-page__filter-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{categoryIcons[c]} {c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={filters.paymentMethod} onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value }))}>
                  <option value="">All Methods</option>
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
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
            <div className="expenses-page__filter-actions">
              <button className="btn btn--primary btn--sm" onClick={applyFilters}>Apply Filters</button>
              <button className="btn btn--ghost btn--sm" onClick={clearFilters}>Clear</button>
            </div>
          </div>
        )}

        {/* Expense Table */}
        <div className="glass-card--static expenses-page__table-container">
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: 'var(--space-16)' }}><div className="spinner" /></div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state__icon">💳</p>
              <p className="empty-state__title">No expenses found</p>
              <p className="empty-state__description">Add your first expense to start tracking</p>
              <button className="btn btn--primary" onClick={openAddModal}>Add Expense</button>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Payment</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{formatDate(exp.date)}</td>
                      <td>
                        <span className="font-medium">{exp.description}</span>
                        {exp.notes && <span className="text-xs text-secondary" style={{ display: 'block' }}>{exp.notes}</span>}
                      </td>
                      <td><span className={`badge badge--${exp.category.toLowerCase()}`}>{categoryIcons[exp.category]} {exp.category}</span></td>
                      <td className="font-semibold" style={{ color: 'var(--accent-danger)' }}>{formatCurrency(exp.amount, exp.currency)}</td>
                      <td className="text-sm text-secondary">{exp.paymentMethod || exp.payment_method}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn--ghost btn--icon" onClick={() => openEditModal(exp)} title="Edit"><HiOutlinePencil /></button>
                          <button className="btn btn--ghost btn--icon" onClick={() => handleDelete(exp.id)} title="Delete" style={{ color: 'var(--accent-danger)' }}><HiOutlineTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="expenses-page__pagination">
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
              <h2 className="modal__title">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="expenses-modal__grid">
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
                <input type="text" className="form-input" placeholder="What was this expense for?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="expenses-modal__grid">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{categoryIcons[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" value={form.paymentMethod}
                    onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows="2" placeholder="Optional notes..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal__footer" style={{ padding: 0, borderTop: 'none', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">{editingExpense ? 'Update' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSVModal && (
        <div className="modal-backdrop" onClick={() => setShowCSVModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Import Transactions</h2>
              <button className="btn btn--ghost btn--icon" onClick={() => setShowCSVModal(false)}><HiOutlineX /></button>
            </div>
            <div className="modal__body">
              <CSVImporter onImportComplete={fetchExpenses} onClose={() => setShowCSVModal(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Expenses;

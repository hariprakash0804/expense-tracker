import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { expenseService } from '../services/dataService';
import { formatCurrency } from '../utils/helpers';
import Header from '../components/layout/Header';
import { HiOutlineUsers, HiOutlinePlusCircle, HiOutlineTrash, HiOutlineShare, HiOutlineSave } from 'react-icons/hi';
import './BillSplitter.css';

const BillSplitter = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [billTitle, setBillTitle] = useState('Dinner at Bistro');
  const [totalAmount, setTotalAmount] = useState('3000');
  const [category, setCategory] = useState('Food');
  const [splitMethod, setSplitMethod] = useState('equal'); // equal, percentage, custom
  const [members, setMembers] = useState([
    { id: 'you', name: 'You', shareValue: '' },
    { id: '1', name: 'Friend A', shareValue: '' },
  ]);

  const handleAddMember = () => {
    const nextId = (members.length + 1).toString();
    setMembers([...members, { id: nextId, name: `Friend ${String.fromCharCode(64 + members.length)}`, shareValue: '' }]);
  };

  const handleRemoveMember = (id) => {
    if (id === 'you') return;
    setMembers(members.filter(m => m.id !== id));
  };

  const handleMemberChange = (id, field, val) => {
    setMembers(members.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  // Perform split computations
  const billVal = parseFloat(totalAmount) || 0;
  const count = members.length;

  const calculateShares = () => {
    if (billVal <= 0 || count === 0) return [];

    if (splitMethod === 'equal') {
      const share = billVal / count;
      return members.map(m => ({
        ...m,
        calculatedShare: Math.round(share * 100) / 100,
        percent: 100 / count
      }));
    }

    if (splitMethod === 'percentage') {
      return members.map(m => {
        const pct = parseFloat(m.shareValue) || 0;
        return {
          ...m,
          calculatedShare: Math.round((billVal * (pct / 100)) * 100) / 100,
          percent: pct
        };
      });
    }

    if (splitMethod === 'custom') {
      return members.map(m => {
        const val = parseFloat(m.shareValue) || 0;
        return {
          ...m,
          calculatedShare: val,
          percent: billVal > 0 ? (val / billVal) * 100 : 0
        };
      });
    }

    return [];
  };

  const shares = calculateShares();
  const yourShareObj = shares.find(s => s.id === 'you') || { calculatedShare: 0 };
  const yourShare = yourShareObj.calculatedShare || 0;

  // Validation checks
  const getValidationErrors = () => {
    if (billVal <= 0) return 'Total amount must be greater than 0.';
    if (splitMethod === 'percentage') {
      const sumPct = members.reduce((sum, m) => sum + (parseFloat(m.shareValue) || 0), 0);
      if (Math.abs(sumPct - 100) > 0.01) {
        return `Percentages must sum to 100%. Current sum: ${sumPct}%`;
      }
    }
    if (splitMethod === 'custom') {
      const sumVal = members.reduce((sum, m) => sum + (parseFloat(m.shareValue) || 0), 0);
      if (Math.abs(sumVal - billVal) > 0.01) {
        return `Custom shares must sum exactly to the bill total (${formatCurrency(billVal, user?.currency)}). Current sum: ${formatCurrency(sumVal, user?.currency)}`;
      }
    }
    return null;
  };

  const validationError = getValidationErrors();

  // Log personal share as Expense directly
  const handleLogExpense = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await expenseService.createExpense({
        amount: yourShare,
        description: `My share of: ${billTitle}`,
        category,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI',
      });

      toast.success(`Logged ${formatCurrency(yourShare, user?.currency)} to your expenses!`);
    } catch {
      toast.error('Failed to log split expense.');
    }
  };

  // Compile split results text to share with group
  const getShareableText = () => {
    let text = `📝 Split for "${billTitle}" (Total: ${formatCurrency(billVal, user?.currency)})\n`;
    text += `Category: ${category}\n`;
    text += `-------------------------------------\n`;
    shares.forEach(s => {
      text += `👤 ${s.name}: ${formatCurrency(s.calculatedShare, user?.currency)}\n`;
    });
    return text;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getShareableText());
    toast.success('Split results copied to clipboard!');
  };

  return (
    <>
      <Header title="Group Bill Splitter" subtitle="Split group expenses and record your share instantly" />
      <div className="split-page">
        <div className="split-page__grid">
          
          {/* Left panel: Bill inputs & split rules */}
          <div className="glass-card--static split-page__panel">
            <h3 className="split-page__section-title">📊 Bill Configurations</h3>
            <div className="split-page__form mt-4">
              <div className="form-group">
                <label className="form-label">Bill Title</label>
                <input type="text" className="form-input" value={billTitle} onChange={e => setBillTitle(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount</label>
                <input type="number" className="form-input" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Food">🍔 Food</option><option value="Shopping">🛍️ Shopping</option>
                  <option value="Entertainment">🎬 Entertainment</option><option value="Travel">🚗 Travel</option>
                  <option value="Bills">🔌 Bills</option><option value="Other">📦 Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Split Method</label>
                <div className="split-page__methods">
                  <button type="button" className={`btn btn--sm ${splitMethod === 'equal' ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => setSplitMethod('equal')}>Split Equally</button>
                  <button type="button" className={`btn btn--sm ${splitMethod === 'percentage' ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => setSplitMethod('percentage')}>Split by %</button>
                  <button type="button" className={`btn btn--sm ${splitMethod === 'custom' ? 'btn--primary' : 'btn--ghost'}`}
                    onClick={() => setSplitMethod('custom')}>Custom Share</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Friends lists, ratios and computations */}
          <div className="split-page__main">
            <div className="glass-card--static p-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-sm">Add Group Members</h4>
                <button className="btn btn--ghost btn--sm flex items-center gap-1 text-primary" onClick={handleAddMember}>
                  <HiOutlinePlusCircle /> Add Friend
                </button>
              </div>

              {/* Members inputs list */}
              <div className="split-page__members">
                {members.map(m => (
                  <div key={m.id} className="split-page__member-row">
                    <input type="text" className="form-input text-xs" value={m.name} disabled={m.id === 'you'}
                      onChange={e => handleMemberChange(m.id, 'name', e.target.value)} placeholder="Member Name" />
                    
                    {splitMethod !== 'equal' && (
                      <div className="flex items-center gap-1.5" style={{ width: '120px' }}>
                        <input type="number" step="any" className="form-input text-xs" value={m.shareValue}
                          onChange={e => handleMemberChange(m.id, 'shareValue', e.target.value)}
                          placeholder={splitMethod === 'percentage' ? '%' : 'Amount'} />
                        <span className="text-xs text-secondary">{splitMethod === 'percentage' ? '%' : user?.currency}</span>
                      </div>
                    )}

                    <div className="text-right text-xs font-semibold" style={{ minWidth: '80px' }}>
                      {formatCurrency(shares.find(s => s.id === m.id)?.calculatedShare || 0, user?.currency)}
                    </div>

                    <button type="button" className="btn btn--ghost btn--icon text-danger" disabled={m.id === 'you'}
                      onClick={() => handleRemoveMember(m.id)}><HiOutlineTrash size={15} /></button>
                  </div>
                ))}
              </div>

              {validationError && (
                <div className="alert alert--danger mt-3 text-xs p-2.5">
                  ⚠️ {validationError}
                </div>
              )}
            </div>

            {/* Split Results summary cards */}
            <div className="split-page__results">
              <div className="glass-card stat-card">
                <p className="stat-card__label">Your Share</p>
                <p className="stat-card__value text-primary" style={{ color: 'var(--accent-primary)' }}>
                  {formatCurrency(yourShare, user?.currency)}
                </p>
                <button className="btn btn--primary btn--sm mt-3 flex items-center gap-1" disabled={!!validationError} onClick={handleLogExpense}>
                  <HiOutlineSave /> Log to My Expenses
                </button>
              </div>

              <div className="glass-card stat-card">
                <p className="stat-card__label">Group Split Output</p>
                <textarea className="form-input text-xxs mt-2 font-mono" style={{ height: '80px', resize: 'none' }} readOnly value={getShareableText()} />
                <button className="btn btn--ghost btn--sm mt-2 flex items-center gap-1" onClick={handleCopyText}>
                  <HiOutlineShare /> Copy Split Details
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default BillSplitter;

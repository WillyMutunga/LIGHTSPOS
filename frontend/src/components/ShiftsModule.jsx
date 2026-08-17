import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { DollarSign, ShieldAlert, CheckCircle, RefreshCw, LogIn, LogOut, Trash2 } from 'lucide-react';

export default function ShiftsModule({ activeShift, currentUser, onShiftStatusChange, onAddLog }) {
  const [shifts, setShifts] = useState([]);
  const [startingCash, setStartingCash] = useState('5000'); // default 5000 KES starting
  const [actualCash, setActualCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [cashSales, setCashSales] = useState(0);

  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseReason, setExpenseReason] = useState('');
  useEffect(() => {
    loadShifts();
  }, [activeShift]);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const res = await api.getShifts();
      setShifts(res);
      
      if (activeShift) {
        // Calculate current Cash sales for active shift
        const sales = await api.getSales();
        const cashSum = sales
          .filter(s => s.shift === activeShift.id && s.payment_method.toLowerCase() === 'cash' && s.status === 'completed')
          .reduce((sum, s) => sum + Number(s.total), 0);
        setCashSales(cashSum);

        // Calculate expenses
        const expRes = await api.getExpenses();
        let expList = expRes.filter(e => e.shift === activeShift.id);
        if (currentUser.role === 'cashier') {
          expList = expList.filter(e => e.cashier === currentUser.id);
        }
        setExpenses(expList);
        setTotalExpenses(expList.reduce((sum, e) => sum + Number(e.amount), 0));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm(`Are you sure you want to delete Shift #${shiftId}? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      await api.deleteShift(shiftId);
      onAddLog('SHIFT_DELETED', `Deleted Shift #${shiftId}`);
      loadShifts();
    } catch (err) {
      alert(`Failed to delete shift: ${err.message}. Make sure there are no sales or expenses attached to this shift before deleting.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e) => {
    e.preventDefault();
    if (!startingCash || Number(startingCash) < 0) return;
    
    setLoading(true);
    try {
      const shift = await api.openShift(currentUser.id, Number(startingCash));
      onShiftStatusChange(shift);
      onAddLog('SHIFT_OPEN', `Opened Shift #${shift.id} with starting cash of KES ${startingCash}`);
      setStartingCash('5000');
    } catch (err) {
      alert(`Failed to open shift: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!actualCash || Number(actualCash) < 0) return;

    setLoading(true);
    try {
      const shift = await api.closeShift(activeShift.id, Number(actualCash));
      onShiftStatusChange(null);
      onAddLog('SHIFT_CLOSE', `Closed Shift #${shift.id}. Actual: KES ${actualCash}. Variance: KES ${shift.variance}`);
      setActualCash('');
      loadShifts();
    } catch (err) {
      alert(`Failed to close shift: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getExpectedCash = () => {
    if (!activeShift) return 0;
    return (Number(activeShift.starting_cash) + cashSales) - totalExpenses;
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!activeShift || !expenseAmount || !expenseReason) return;
    
    try {
      setLoading(true);
      await api.createExpense({
        shift: activeShift.id,
        cashier: currentUser.id,
        amount: Number(expenseAmount),
        reason: expenseReason
      });
      onAddLog('EXPENSE_ADDED', `Logged expense KES ${expenseAmount} for ${expenseReason}`);
      setExpenseAmount('');
      setExpenseReason('');
      loadShifts();
    } catch (err) {
      alert(`Failed to add expense: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100%' }}>
      
      {/* Header */}
      <div>
        <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Cash Drawer & Shifts</h2>
        <p className="cyber-subtitle">Reconcile till floats and monitor shift cash variances.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '1.5rem' }}>
        
        {/* Active Shift Controls */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
          {activeShift ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="cyber-title" style={{ fontSize: '1.1rem', color: 'var(--success-lime)' }}>Active Shift #{activeShift.id}</h3>
                <span className="cyber-badge badge-lime">OPEN</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Active Cashier:</span>
                  <span>{activeShift.cashier_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Opening Float:</span>
                  <span className="currency">KES {Number(activeShift.starting_cash).toLocaleString()}</span>
                </div>
                
                {currentUser.role !== 'cashier' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cash Sales:</span>
                      <span className="currency" style={{ color: 'var(--accent-cyan)' }}>KES {cashSales.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Expenses/Payouts:</span>
                      <span className="currency" style={{ color: 'var(--alert-orange)' }}>- KES {totalExpenses.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '0.5rem', borderTop: '1px solid var(--border-muted)' }}>
                      <span style={{ color: 'var(--text-main)' }}>Expected Cash:</span>
                      <span className="currency" style={{ color: 'var(--success-lime)' }}>KES {getExpectedCash().toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <form onSubmit={handleCloseShift} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-muted)', paddingTop: '1rem' }}>
                <div>
                  <label className="cyber-label">Enter Actual Cash Drawer Count</label>
                  <input 
                    type="number" 
                    className="cyber-input cyber-input-mono"
                    required
                    placeholder="Count actual cash in drawer..."
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                  />
                </div>
                <button type="submit" className="cyber-button btn-orange" style={{ width: '100%', justifyContent: 'center' }}>
                  <LogOut size={16} /> Close Drawer Shift
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="cyber-title" style={{ fontSize: '1.1rem', color: 'var(--alert-orange)' }}>Drawer Closed</h3>
                <span className="cyber-badge badge-orange">LOCKED</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                POS terminal transactions are suspended until a new shift float is declared and initialized.
              </p>

              <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="cyber-label">Opening Float Cash (KES)</label>
                  <input 
                    type="number" 
                    className="cyber-input cyber-input-mono"
                    required
                    placeholder="KES 5,000"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                  />
                </div>
                <button type="submit" className="cyber-button btn-lime" style={{ width: '100%', justifyContent: 'center' }}>
                  <LogIn size={16} /> Open Shift & Unlock till
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Shift Audit Trail */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Previous Shift Audits</h3>
          
          <div className="cyber-table-container" style={{ flex: 1, maxHeight: '280px' }}>
            <table className="cyber-table cyber-table-mono" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Shift ID</th>
                  <th>Cashier</th>
                  <th style={{ textAlign: 'right' }}>Expected</th>
                  <th style={{ textAlign: 'right' }}>Actual</th>
                  <th style={{ textAlign: 'right' }}>Variance</th>
                  {currentUser.role !== 'cashier' && <th style={{ width: '40px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {shifts.filter(s => !s.is_open).map(shift => (
                  <tr key={shift.id}>
                    <td>#{shift.id}</td>
                    <td style={{ fontFamily: 'var(--font-sans)' }}>{shift.cashier_name}</td>
                    <td style={{ textAlign: 'right' }}>KES {Number(shift.ending_cash || shift.starting_cash).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>KES {Number(shift.actual_cash).toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: Number(shift.variance) < 0 ? 'var(--alert-orange)' : Number(shift.variance) > 0 ? 'var(--success-lime)' : 'var(--text-main)' }}>
                      KES {Number(shift.variance).toLocaleString()}
                    </td>
                    {currentUser.role !== 'cashier' && (
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="cyber-button btn-orange" 
                          style={{ padding: '0.2rem', minWidth: 'auto', border: 'none' }}
                          onClick={() => handleDeleteShift(shift.id)}
                          title="Delete Shift"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {activeShift && (
        <div className="cyber-card" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Shift Expenses & Payouts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="cyber-label">Amount (KES)</label>
                <input 
                  type="number" 
                  className="cyber-input cyber-input-mono w-full"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="cyber-label">Reason</label>
                <input 
                  type="text" 
                  className="cyber-input w-full"
                  required
                  value={expenseReason}
                  onChange={(e) => setExpenseReason(e.target.value)}
                />
              </div>
              <button type="submit" className="cyber-button" disabled={loading}>
                Record Expense
              </button>
            </form>
            <div className="cyber-table-container">
              <table className="cyber-table cyber-table-mono">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Cashier</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{new Date(exp.timestamp).toLocaleTimeString()}</td>
                      <td>{exp.cashier_name}</td>
                      <td style={{ fontFamily: 'var(--font-sans)' }}>{exp.reason}</td>
                      <td style={{ textAlign: 'right', color: 'var(--alert-orange)' }}>KES {Number(exp.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No expenses recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

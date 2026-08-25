import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, List, CreditCard } from 'lucide-react';

export default function ExpensesModule({ currentUser, activeShift, onAddLog }) {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeShift) {
      alert("You must have an open shift to record an expense.");
      return;
    }
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        amount: amount,
        reason: reason,
        cashier: currentUser.id,
        shift: activeShift.id
      };
      await api.createExpense(payload);
      onAddLog('EXPENSE_ADD', `Logged expense: KES ${amount} for ${reason}`);
      alert("Expense logged successfully!");
      setAmount('');
      setReason('');
      loadExpenses();
    } catch (err) {
      alert(`Failed to save expense: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto' }}>
      
      <div>
        <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Shop Expenses & Payouts</h2>
        <p className="cyber-subtitle">Record daily petty cash outflows like transport, meals, and utilities.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Record Expense Form */}
        <div className="cyber-card">
          <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Log New Expense</h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="cyber-label">Amount (KES)</label>
              <input 
                type="number" 
                className="cyber-input cyber-input-mono"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="cyber-label">Reason / Category</label>
              <textarea 
                className="cyber-input"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Shop cleaning supplies, internet bill..."
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="cyber-button btn-orange" disabled={isSubmitting || !activeShift}>
              <Plus size={16} /> {isSubmitting ? 'Saving...' : 'Record Payout'}
            </button>
            {!activeShift && <p style={{ fontSize: '0.8rem', color: 'var(--alert-orange)' }}>Requires an open shift.</p>}
          </form>
        </div>

        {/* Expenses Table */}
        <div className="cyber-card">
          <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Recent Expenses</h3>
          
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Reason</th>
                  <th>Cashier ID</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>Loading expenses...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No expenses recorded.</td></tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(exp.timestamp).toLocaleString()}</td>
                      <td>{exp.reason}</td>
                      <td>Staff #{exp.cashier}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--alert-orange)' }}>
                        KES {Number(exp.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

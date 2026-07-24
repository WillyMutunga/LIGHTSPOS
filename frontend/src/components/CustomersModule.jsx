import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { UserPlus, Phone, Star, Mail, Save, BookOpen, DollarSign, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function CustomersModule({ onAddLog }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  // Create customer modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Ledger details modal
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Debt payment sub-modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      const res = await api.getCustomers(search);
      setCustomers(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    try {
      await api.createCustomer({ name, phone, email });
      onAddLog('CUSTOMER_CREATE', `Created customer profile for ${name}`);
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      loadCustomers();
    } catch (err) {
      alert(`Failed to register customer: ${err.message}`);
    }
  };

  const openLedger = async (customer) => {
    setSelectedLedgerCustomer(customer);
    setLedgerLoading(true);
    try {
      const res = await api.getCustomerDebtHistory(customer.id);
      setLedgerEntries(res);
    } catch (err) {
      alert(`Failed to load ledger: ${err.message}`);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;

    try {
      const updatedCust = await api.payCustomerDebt(selectedLedgerCustomer.id, payAmount, payNotes);
      onAddLog('DEBT_PAYMENT', `Recorded payment of KES ${payAmount} for customer ${updatedCust.name}`);
      
      // Update selected customer debt status
      setSelectedLedgerCustomer(updatedCust);
      
      // Refresh customer list
      loadCustomers();
      
      // Refresh ledger entries
      const res = await api.getCustomerDebtHistory(updatedCust.id);
      setLedgerEntries(res);
      
      // Reset form
      setPayAmount('');
      setPayNotes('');
      setIsPaymentModalOpen(false);
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Customer Database & Loyalty</h2>
          <p className="cyber-subtitle">Review active shoppers, track rewards, and audit store debt balances.</p>
        </div>

        <button className="cyber-button btn-lime" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} /> Register Customer
        </button>
      </div>

      {/* Filter and Directory */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input 
          type="text" 
          className="cyber-input"
          style={{ maxWidth: '300px' }}
          placeholder="Filter by name/phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="cyber-table-container" style={{ background: 'var(--bg-dark)' }}>
        <table className="cyber-table cyber-table-mono">
          <thead>
            <tr>
              <th>Profile Name</th>
              <th>Phone Connection</th>
              <th>Email Address</th>
              <th style={{ textAlign: 'center' }}>Loyalty Points</th>
              <th style={{ textAlign: 'center' }}>Reward Value</th>
              <th style={{ textAlign: 'right' }}>Outstanding Debt</th>
              <th style={{ textAlign: 'center' }}>Ledger Statements</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No customer records cataloged.
                </td>
              </tr>
            ) : (
              customers.map(cust => (
                <tr key={cust.id}>
                  <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{cust.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={12} style={{ color: 'var(--text-muted)' }} /> {cust.phone}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-sans)' }}>
                    {cust.email ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={12} style={{ color: 'var(--text-muted)' }} /> {cust.email}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="cyber-badge badge-lime">
                      <Star size={10} fill="var(--success-lime)" /> {cust.loyalty_points}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-cyan)' }}>
                    KES {(cust.loyalty_points * 1).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: Number(cust.outstanding_debt) > 0 ? 'var(--alert-orange)' : 'var(--text-muted)' }}>
                    KES {Number(cust.outstanding_debt).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {cust.phone !== '0000000000' ? (
                      <button 
                        className="cyber-button btn-cyan" 
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                        onClick={() => openLedger(cust)}
                      >
                        <BookOpen size={12} /> Audit Debt
                      </button>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Customer Dialog */}
      {isModalOpen && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '450px' }}>
            <h3 className="cyber-title" style={{ marginBottom: '1.5rem' }}>Customer Profile Registry</h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="cyber-label">Customer Name</label>
                <input 
                  type="text" 
                  className="cyber-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="cyber-label">Mobile Number</label>
                <input 
                  type="text" 
                  className="cyber-input cyber-input-mono"
                  required
                  placeholder="e.g. +2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="cyber-label">Email Address (Optional)</label>
                <input 
                  type="email" 
                  className="cyber-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="cyber-button btn-orange"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="cyber-button btn-lime"
                >
                  <Save size={14} /> Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Audit Dialog */}
      {selectedLedgerCustomer && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-muted)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>Ledger Statement: {selectedLedgerCustomer.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mobile: {selectedLedgerCustomer.phone}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OUTSTANDING BALANCE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--alert-orange)' }}>
                  KES {Number(selectedLedgerCustomer.outstanding_debt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="cyber-button btn-lime"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <DollarSign size={16} /> Record Payment
              </button>
            </div>

            {/* Ledger entries list */}
            <div className="cyber-table-container" style={{ background: 'var(--bg-darker)', maxHeight: '300px', overflowY: 'auto' }}>
              <table className="cyber-table cyber-table-mono" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th style={{ textAlign: 'center' }}>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Reference / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading statements...</td>
                    </tr>
                  ) : ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No ledger charges or payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map(entry => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.timestamp).toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`cyber-badge ${entry.transaction_type === 'charge' ? 'badge-orange' : 'badge-lime'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>
                            {entry.transaction_type === 'charge' ? (
                              <><ArrowUpRight size={10} /> Charge</>
                            ) : (
                              <><ArrowDownLeft size={10} /> Payment</>
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: entry.transaction_type === 'charge' ? 'var(--alert-orange)' : 'var(--success-lime)' }}>
                          KES {Number(entry.amount).toLocaleString()}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{entry.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-muted)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button 
                className="cyber-button btn-orange"
                onClick={() => setSelectedLedgerCustomer(null)}
              >
                Close Audit Statement
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Record Payment Sub-modal */}
      {isPaymentModalOpen && (
        <div className="cyber-modal-overlay" style={{ zIndex: 110 }}>
          <div className="cyber-modal" style={{ maxWidth: '400px' }}>
            <h3 className="cyber-title" style={{ marginBottom: '1.5rem' }}>Record Debt Payment</h3>
            
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="cyber-label">Received Amount (KES)</label>
                <input 
                  type="number" 
                  className="cyber-input cyber-input-mono"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="cyber-label">Reference Notes</label>
                <input 
                  type="text" 
                  className="cyber-input"
                  placeholder="e.g. MPesa Ref, Bank Deposit ID, or Cash Receipt"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="cyber-button btn-orange"
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="cyber-button btn-lime"
                >
                  <DollarSign size={14} /> Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, UserPlus, Phone, Star, Mail, Save, CreditCard, Trash2 } from 'lucide-react';

export default function SuppliersModule({ onAddLog }) {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  
  // Register Supplier state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Pay supplier state
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const loadSuppliers = async () => {
    try {
      const res = await api.getSuppliers(search);
      setSuppliers(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      await api.createSupplier({ name, contact_name: contactName, phone, email, address });
      onAddLog('SUPPLIER_CREATE', `Registered supplier ${name}`);
      setIsRegisterOpen(false);
      setName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
      loadSuppliers();
    } catch (err) {
      alert(`Supplier registry failed: ${err.message}`);
    }
  };

  const handlePayBalance = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;

    try {
      const newBalance = Number(activeSupplier.outstanding_balance) - Number(payAmount);
      await api.updateSupplier(activeSupplier.id, {
        ...activeSupplier,
        outstanding_balance: newBalance.toFixed(2)
      });
      onAddLog('SUPPLIER_PAY', `Paid KES ${payAmount} to Supplier ${activeSupplier.name}. New balance: KES ${newBalance}`);
      setIsPayOpen(false);
      setPayAmount('');
      setActiveSupplier(null);
      loadSuppliers();
    } catch (err) {
      alert(`Payment recording failed: ${err.message}`);
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the supplier "${name}"?`)) return;
    try {
      await api.deleteSupplier(id);
      onAddLog('SUPPLIER_DELETE', `Deleted supplier ${name}`);
      loadSuppliers();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Supplier Directory</h2>
          <p className="cyber-subtitle">Monitor procurement vendors and settle accounts balances.</p>
        </div>

        <button className="cyber-button btn-lime" onClick={() => setIsRegisterOpen(true)}>
          <UserPlus size={16} /> Add Supplier Profile
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input 
          type="text" 
          className="cyber-input"
          style={{ maxWidth: '300px' }}
          placeholder="Filter suppliers by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Directory Table */}
      <div className="cyber-table-container" style={{ background: 'var(--bg-dark)' }}>
        <table className="cyber-table cyber-table-mono">
          <thead>
            <tr>
              <th>Supplier / Vendor</th>
              <th>Contact Representative</th>
              <th>Phone Connection</th>
              <th>Email</th>
              <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No suppliers cataloged.
                </td>
              </tr>
            ) : (
              suppliers.map(sup => (
                <tr key={sup.id}>
                  <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{sup.name}</td>
                  <td style={{ fontFamily: 'var(--font-sans)' }}>{sup.contact_name || '—'}</td>
                  <td>{sup.phone || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>{sup.email || '—'}</td>
                  <td style={{ textAlign: 'right', color: Number(sup.outstanding_balance) > 0 ? 'var(--alert-orange)' : 'var(--success-lime)' }}>
                    KES {Number(sup.outstanding_balance).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    {Number(sup.outstanding_balance) > 0 ? (
                      <button 
                        className="cyber-button"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          setActiveSupplier(sup);
                          setIsPayOpen(true);
                        }}
                      >
                        <CreditCard size={12} /> Pay Balance
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-dark)', fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>Settled</span>
                    )}
                    <button
                      className="cyber-button btn-red"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                      onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                      title="Delete Supplier"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {isRegisterOpen && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '500px' }}>
            <h3 className="cyber-title" style={{ marginBottom: '1.5rem' }}>Supplier Profile Registry</h3>
            
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="cyber-label">Supplier Name</label>
                <input 
                  type="text" 
                  className="cyber-input"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="cyber-label">Contact Person</label>
                  <input 
                    type="text" 
                    className="cyber-input"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="cyber-label">Phone Connection</label>
                  <input 
                    type="text" 
                    className="cyber-input cyber-input-mono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="cyber-label">Email Address</label>
                <input 
                  type="email" 
                  className="cyber-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="cyber-label">Office Address</label>
                <textarea 
                  className="cyber-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="cyber-button btn-orange"
                  onClick={() => setIsRegisterOpen(false)}
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

      {/* Settle Account Balance Modal */}
      {isPayOpen && activeSupplier && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '400px' }}>
            <h3 className="cyber-title" style={{ marginBottom: '0.5rem' }}>Record Account Settlement</h3>
            <p className="cyber-subtitle" style={{ marginBottom: '1.5rem' }}>Supplier: {activeSupplier.name}</p>

            <form onSubmit={handlePayBalance} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="cyber-label">Outstanding Balance</label>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--alert-orange)' }}>
                  KES {Number(activeSupplier.outstanding_balance).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="cyber-label">Payment Amount (KES)</label>
                <input 
                  type="number" 
                  className="cyber-input cyber-input-mono"
                  required
                  min="0.01"
                  max={activeSupplier.outstanding_balance}
                  step="0.01"
                  placeholder="Enter amount to pay..."
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="cyber-button btn-orange"
                  onClick={() => {
                    setIsPayOpen(false);
                    setPayAmount('');
                    setActiveSupplier(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="cyber-button btn-lime"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

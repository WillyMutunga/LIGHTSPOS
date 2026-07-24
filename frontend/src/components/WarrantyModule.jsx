import React, { useState } from 'react';
import { api } from '../api';
import { Search, ShieldCheck, ShieldAlert, Shield, Clock, User, Award, Tag } from 'lucide-react';

export default function WarrantyModule() {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!serial.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await api.lookupSerial(serial.trim());
      setResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Serial number not found in registry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Serial Warranty Registry</h2>
        <p className="cyber-subtitle">Scan or query item serial numbers to verify warranty validation and audit sale details.</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleLookup} className="cyber-card" style={{ display: 'flex', gap: '1rem', padding: '1.25rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={18} />
          </div>
          <input
            type="text"
            className="cyber-input"
            style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)' }}
            placeholder="Type or scan product serial number (e.g. WHLCLP-001, TVICA24-001)..."
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
          />
        </div>
        <button type="submit" className="cyber-button btn-cyan" style={{ minWidth: '130px' }} disabled={loading}>
          {loading ? 'Searching...' : 'Audit Serial'}
        </button>
      </form>

      {/* Error state */}
      {errorMsg && (
        <div className="cyber-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--alert-orange)', background: 'rgba(255,107,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ShieldAlert size={32} style={{ color: 'var(--alert-orange)' }} />
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--alert-orange)' }}>SERIAL NOT FOUND</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              The queried serial number could not be found in active inventory stocks or past sales records.
            </p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="cyber-card glow-box" style={{ padding: '2rem', borderTop: `4px solid ${result.status === 'In Stock' ? 'var(--accent-cyan)' : result.warranty_status === 'Active' ? 'var(--success-lime)' : 'var(--alert-orange)'}` }}>
          
          {/* Status Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-muted)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {result.status === 'In Stock' ? (
                <Shield size={24} style={{ color: 'var(--accent-cyan)' }} />
              ) : result.warranty_status === 'Active' ? (
                <ShieldCheck size={24} style={{ color: 'var(--success-lime)' }} />
              ) : (
                <ShieldAlert size={24} style={{ color: 'var(--alert-orange)' }} />
              )}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>REGISTRY STATUS</span>
                <h3 style={{ fontWeight: '800', letterSpacing: '0.05em' }}>
                  {result.status === 'In Stock' ? 'ACTIVE INVENTORY STOCK' : `SOLD / WARRANTY ${result.warranty_status.toUpperCase()}`}
                </h3>
              </div>
            </div>

            <div className={`cyber-badge ${result.status === 'In Stock' ? 'badge-cyan' : result.warranty_status === 'Active' ? 'badge-lime' : 'badge-orange'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              {result.status === 'In Stock' ? 'UNSOLD' : result.warranty_status}
            </div>
          </div>

          {/* Product details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <Tag size={12} /> PRODUCT SPECIFICATIONS
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{result.product_name}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>Barcode: {result.barcode}</p>
            </div>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <Award size={12} /> EST. RETAIL VALUE
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>KES {Number(result.retail_price).toLocaleString()}</h4>
            </div>
          </div>

          {/* Context-specific details */}
          {result.status === 'In Stock' ? (
            <div style={{ background: 'var(--bg-darker)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-muted)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This serial number is currently registered as <strong style={{ color: 'var(--accent-cyan)' }}>in stock</strong> inside the **{result.category_name}** category. It is available to be allocated and sold in the POS Checkout Terminal.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Sale Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--bg-darker)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-muted)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <Clock size={12} /> DATE SOLD
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(result.sale_timestamp).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <User size={12} /> CASHIER
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{result.cashier_name}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <User size={12} /> CUSTOMER
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{result.customer_name}</div>
                </div>
              </div>

              {/* Warranty details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-muted)', paddingTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WARRANTY EXPIRATION DATE</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: result.warranty_status === 'Active' ? 'var(--success-lime)' : 'var(--alert-orange)' }}>
                    {new Date(result.warranty_expiry).toLocaleDateString()} at {new Date(result.warranty_expiry).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                  {result.warranty_status === 'Active' ? (
                    <span style={{ color: 'var(--success-lime)' }}>Item is under valid 1-year product warranty. Eligible for standard replacement/refund policies.</span>
                  ) : (
                    <span style={{ color: 'var(--alert-orange)' }}>Warranty period has expired. Standard repair costs apply.</span>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Search, Save, PackageMinus, PackageX, PackageCheck, ClipboardCheck } from 'lucide-react';
import { api } from '../api';

export default function StocktakeModule({ currentUser, onAddLog }) {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [physicalCount, setPhysicalCount] = useState('');
  const [reason, setReason] = useState('correction');
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [prodsRes, adjsRes] = await Promise.all([
        api.getProducts(),
        api.getStockAdjustments()
      ]);
      setProducts(prodsRes);
      setAdjustments(adjsRes);
    } catch (err) {
      console.error(err);
      alert('Failed to load stock data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectProduct = (p) => {
    setSelectedProduct(p);
    setPhysicalCount('');
    setNotes('');
    setReason('correction');
  };

  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct || physicalCount === '') return;
    
    if (!window.confirm(`Update stock for ${selectedProduct.name} to ${physicalCount}?`)) return;

    try {
      const payload = {
        product: selectedProduct.id,
        user: currentUser.id,
        previous_quantity: selectedProduct.stock_quantity,
        new_quantity: parseInt(physicalCount),
        reason,
        notes
      };

      const res = await api.createStockAdjustment(payload);
      if (!res) throw new Error('Failed to save adjustment');

      onAddLog('STOCK_ADJUST', `Adjusted ${selectedProduct.name} stock to ${physicalCount}`);
      
      setSelectedProduct(null);
      loadData();
      alert('Stock adjusted successfully');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  ).slice(0, 10); // Show max 10 to keep it manageable

  if (isLoading) return <div className="p-4 text-white">Loading stocktake...</div>;

  return (
    <div className="module-container" style={{ padding: '2rem', color: 'var(--text-light)', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <ClipboardCheck size={28} style={{ color: 'var(--accent-cyan)' }} />
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>Stocktake & Adjustments</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Col: Search & Select */}
        <div className="cyber-card p-4">
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)' }}>Find Product</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Scan barcode or search name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cyber-input w-full"
                style={{ paddingLeft: '2.5rem' }}
                autoFocus
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {searchTerm && filteredProducts.map(p => (
              <div 
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                style={{ 
                  padding: '1rem', 
                  background: selectedProduct?.id === p.id ? 'var(--bg-lighter)' : 'var(--bg-darker)',
                  border: `1px solid ${selectedProduct?.id === p.id ? 'var(--accent-cyan)' : 'var(--border-dark)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Barcode: {p.barcode || 'N/A'}</div>
                </div>
                <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  In System: {p.stock_quantity}
                </div>
              </div>
            ))}
            {searchTerm && filteredProducts.length === 0 && (
              <div style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>No products found</div>
            )}
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="cyber-card p-4">
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)' }}>Adjust Stock</h3>
          
          {!selectedProduct ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              Select a product to adjust its stock level.
            </div>
          ) : (
            <form onSubmit={handleSubmitAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-darker)', borderRadius: '4px', border: '1px solid var(--border-dark)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Selected Product</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedProduct.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: 'var(--accent-cyan)' }}>
                  <span>System Count: {selectedProduct.stock_quantity}</span>
                  {physicalCount !== '' && (
                    <span style={{ color: parseInt(physicalCount) < selectedProduct.stock_quantity ? 'var(--alert-orange)' : 'var(--success-lime)' }}>
                      Variance: {parseInt(physicalCount) - selectedProduct.stock_quantity}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Physical Count</label>
                <input 
                  type="number" 
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  className="cyber-input w-full"
                  required
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Reason</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  className="cyber-input w-full"
                >
                  <option value="correction">Inventory Correction</option>
                  <option value="shrinkage">Shrinkage / Loss</option>
                  <option value="damage">Damage</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Notes</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="cyber-input w-full"
                  placeholder="Optional context..."
                />
              </div>

              <button type="submit" className="cyber-button" style={{ marginTop: '1rem' }}>
                <Save size={18} /> Confirm Adjustment
              </button>
            </form>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="cyber-card p-4" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--accent-cyan)' }}>Recent Adjustments</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="cyber-table w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>User</th>
                <th>Previous</th>
                <th>New</th>
                <th>Reason</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.slice(0, 20).map(adj => (
                <tr key={adj.id}>
                  <td>{new Date(adj.timestamp).toLocaleString()}</td>
                  <td>{adj.product_name}</td>
                  <td>{adj.user_name}</td>
                  <td>{adj.previous_quantity}</td>
                  <td style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{adj.new_quantity}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      background: adj.reason === 'correction' ? '#2563eb33' : '#dc262633',
                      color: adj.reason === 'correction' ? '#60a5fa' : '#f87171'
                    }}>
                      {adj.reason}
                    </span>
                  </td>
                  <td>{adj.notes}</td>
                </tr>
              ))}
              {adjustments.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>No recent adjustments</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

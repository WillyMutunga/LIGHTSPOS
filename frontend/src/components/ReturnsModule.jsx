import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, RefreshCcw, DollarSign, ShieldAlert, Check } from 'lucide-react';

export default function ReturnsModule({ currentUser, onAddLog }) {
  const [receiptId, setReceiptId] = useState('');
  const [activeSale, setActiveSale] = useState(null);
  
  // Return selections
  const [returnItems, setReturnItems] = useState({}); // { product_id: { quantity: 1, serials: '...' } }
  const [reason, setReason] = useState('');
  const [refundTotal, setRefundTotal] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!receiptId.trim()) return;

    try {
      // Find sale by id in Sales
      const sales = await api.getSales();
      const sale = sales.find(s => s.id === Number(receiptId.trim()));
      
      if (!sale) {
        alert("Receipt ID not found in transaction history.");
        return;
      }
      
      setActiveSale(sale);
      setReturnItems({});
      setReason('');
      setRefundTotal(0);
      setSuccessMsg('');
    } catch (err) {
      alert(`Error during lookup: ${err.message}`);
    }
  };

  const handleItemSelectToggle = (product, isChecked) => {
    if (isChecked) {
      setReturnItems({
        ...returnItems,
        [product.id]: {
          quantity: 1,
          serials: product.serial_numbers || '',
          price: product.unit_price
        }
      });
    } else {
      const copy = { ...returnItems };
      delete copy[product.id];
      setReturnItems(copy);
    }
  };

  const handleItemQtyChange = (prodId, qty, maxQty) => {
    if (qty < 1 || qty > maxQty) return;
    setReturnItems({
      ...returnItems,
      [prodId]: {
        ...returnItems[prodId],
        quantity: qty
      }
    });
  };

  const handleItemSerialsChange = (prodId, serials) => {
    setReturnItems({
      ...returnItems,
      [prodId]: {
        ...returnItems[prodId],
        serials
      }
    });
  };

  // Recalculate refund total whenever returnItems changes
  useEffect(() => {
    let sum = 0;
    Object.keys(returnItems).forEach(key => {
      const item = returnItems[key];
      sum += Number(item.price) * item.quantity;
    });
    setRefundTotal(sum);
  }, [returnItems]);

  const handleProcessReturn = async () => {
    if (Object.keys(returnItems).length === 0) {
      alert("Please select at least one item to return.");
      return;
    }
    if (!reason.trim()) {
      alert("Please specify a reason for the return.");
      return;
    }

    setIsProcessing(true);

    const payload = {
      sale: activeSale.id,
      cashier: currentUser.id,
      reason: reason,
      refund_amount: refundTotal.toFixed(2),
      returned_items: returnItems
    };

    try {
      await api.processReturn(payload);
      onAddLog('RETURN_PROCESS', `Processed return for Receipt #${activeSale.id} - Refund KES ${refundTotal}`);
      setSuccessMsg(`Return processed successfully! KES ${refundTotal.toLocaleString()} refunded.`);
      setActiveSale(null);
      setReceiptId('');
    } catch (err) {
      alert(`Return failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Module Title */}
      <div>
        <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Returns & Refunds</h2>
        <p className="cyber-subtitle">Enter receipt ID to reverse transactions or log returned goods.</p>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(57, 255, 20, 0.1)', border: '1px solid var(--success-lime)', color: 'var(--success-lime)', padding: '1rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Check size={18} /> {successMsg}
        </div>
      )}

      {/* Lookup Card */}
      <div className="cyber-card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="cyber-label">Enter Receipt ID</label>
            <input 
              type="text" 
              className="cyber-input cyber-input-mono"
              placeholder="e.g. 5"
              required
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
            />
          </div>
          <button type="submit" className="cyber-button">
            <Search size={16} /> Look Up Receipt
          </button>
        </form>
      </div>

      {/* Sale Details and Return Form */}
      {activeSale && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
          
          {/* Items Selector */}
          <div className="cyber-card">
            <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Select Return Items</h3>
            
            <div className="cyber-table-container" style={{ border: 'none' }}>
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Select</th>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Original Qty</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Return Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSale.items.map(item => {
                    const isSelected = !!returnItems[item.product];
                    return (
                      <tr key={item.id}>
                        <td>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleItemSelectToggle(item, e.target.checked)}
                            style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div>{item.product_name}</div>
                          {item.serial_numbers && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Original S/N: {item.serial_numbers}</div>
                          )}
                          {isSelected && item.serial_numbers && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <label className="cyber-label" style={{ fontSize: '0.7rem' }}>Specify Returned S/N</label>
                              <input 
                                type="text"
                                className="cyber-input cyber-input-mono"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                                placeholder="comma separated"
                                value={returnItems[item.product]?.serials || ''}
                                onChange={(e) => handleItemSerialsChange(item.product, e.target.value)}
                              />
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'center' }}>
                          {isSelected ? (
                            <input 
                              type="number"
                              className="cyber-input cyber-input-mono"
                              style={{ width: '60px', textAlign: 'center', padding: '0.2rem 0.5rem' }}
                              value={returnItems[item.product].quantity}
                              min="1"
                              max={item.quantity}
                              onChange={(e) => handleItemQtyChange(item.product, Number(e.target.value), item.quantity)}
                            />
                          ) : (
                            <span style={{ color: 'var(--text-dark)' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>KES {Number(item.unit_price).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refund Details */}
          <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Refund Calculations</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="cyber-label">Return Reason</label>
                  <textarea 
                    className="cyber-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    required
                    placeholder="Specify customer complaint..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '1rem', borderTop: '1px solid var(--border-muted)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Refund Total</span>
                  <span className="currency" style={{ fontSize: '1.75rem', color: 'var(--alert-orange)', fontWeight: '800' }}>
                    KES {refundTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button 
              className="cyber-button btn-orange"
              style={{ width: '100%', padding: '0.85rem', justifyContent: 'center' }}
              disabled={isProcessing || Object.keys(returnItems).length === 0}
              onClick={handleProcessReturn}
            >
              {isProcessing ? "Processing Return..." : "Approve Return & Refund"}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

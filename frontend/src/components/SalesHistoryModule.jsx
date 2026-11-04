import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, FileText, Printer, Calendar, Trash2 } from 'lucide-react';

export default function SalesHistoryModule({ currentUser }) {
  const [sales, setSales] = useState([]);
  const [shopDetails, setShopDetails] = useState({ name: 'Lights Electricals & Electronics', address: 'Mombasa Road, Nairobi', phone: '0742765445', vat_pin: 'P0123456789', receipt_footer: 'Thank you for shopping with us!', tax_rate: 16 });

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const shops = await api.getShops();
        const currentShopId = localStorage.getItem('activeShopId');
        const shop = shops.find(s => s.id === Number(currentShopId)) || shops[0];
        if (shop) {
          setShopDetails({
            name: shop.name || 'Lights Electricals & Electronics',
            address: shop.address || 'Mombasa Road, Nairobi',
            phone: shop.phone || '0742765445',
            vat_pin: shop.vat_pin || 'P0123456789',
            receipt_footer: shop.receipt_footer || 'Thank you for shopping with us!',
            tax_rate: shop.tax_rate ? Number(shop.tax_rate) : 16
          });
        }
      } catch (err) { }
    };
    fetchShop();
  }, []);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedSales, setSelectedSales] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'quotation'
  const [isConverting, setIsConverting] = useState(false);

  const handleConvertQuotation = async (saleId) => {
    const paymentMethod = window.prompt("Choose Payment Method (Cash, M-Pesa, Card, Credit):", "Cash");
    if (!paymentMethod) return;
    setIsConverting(true);
    try {
      const updated = await api.convertQuotation(saleId, paymentMethod.trim());
      alert(`Successfully converted Quote #${saleId} to Completed Sale!`);
      setSelectedSale(updated);
      await loadSales();
    } catch (err) {
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSendWhatsAppQuote = (sale) => {
    if (!sale) return;
    const phone = window.prompt("Enter customer WhatsApp number (e.g. 0712345678):");
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);
    else if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.slice(1);

    const itemsList = (sale.items || []).map(i => `• ${i.product_name} x ${i.quantity} = KES ${Number(i.total_price).toLocaleString()}`).join('\n');
    const text = `*LIGHTS ELECTRICALS - OFFICIAL QUOTATION*\n` +
      `Quote Ref: *#${sale.id}*\n` +
      `Date: ${new Date(sale.timestamp).toLocaleDateString()}\n` +
      `Prepared For: ${sale.customer_name || 'Valued Customer'}\n\n` +
      `*Quoted Items:*\n${itemsList}\n\n` +
      `*Total Estimated: KES ${Number(sale.total).toLocaleString()} (VAT Incl.)*\n` +
      `_Validity: 14 Days from issuance. Thank you for your inquiry!_`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const res = await api.getSales();
      setSales(res);
      setSelectedSales([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Sale #${id}? This action cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await api.deleteSale(id);
      await loadSales();
    } catch (err) {
      alert(`Failed to delete sale: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSales.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSales.length} selected sales? This action cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await Promise.all(selectedSales.map(id => api.deleteSale(id)));
      await loadSales();
    } catch (err) {
      alert(`Failed to delete some or all sales: ${err.message}`);
      await loadSales();
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectSale = (id) => {
    setSelectedSales(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedSales.length === filteredSales.length) {
      setSelectedSales([]);
    } else {
      setSelectedSales(filteredSales.map(s => s.id));
    }
  };

  const filteredSales = sales.filter(s => {
    if (statusFilter !== 'all') {
      const saleStatus = s.status || 'completed';
      if (saleStatus !== statusFilter) return false;
    }
    const term = search.toLowerCase();
    return s.id.toString().includes(term) || 
           s.payment_method.toLowerCase().includes(term) ||
           (s.customer_name && s.customer_name.toLowerCase().includes(term)) ||
           s.cashier_name.toLowerCase().includes(term);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Module Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Sales History & Auditing</h2>
          <p className="cyber-subtitle">Review previous cash desk receipts and transaction details.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div style={{ display: 'inline-flex', gap: '0.4rem', background: 'var(--bg-darker)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-muted)' }}>
            <button
              type="button"
              className={`cyber-button ${statusFilter === 'all' ? 'btn-lime' : ''}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => setStatusFilter('all')}
            >
              All ({sales.length})
            </button>
            <button
              type="button"
              className={`cyber-button ${statusFilter === 'completed' ? 'btn-lime' : ''}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => setStatusFilter('completed')}
            >
              Paid Sales ({sales.filter(s => (s.status || 'completed') === 'completed').length})
            </button>
            <button
              type="button"
              className={`cyber-button ${statusFilter === 'quotation' ? 'btn-cyan' : ''}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => setStatusFilter('quotation')}
            >
              📋 Quotes / Proforma ({sales.filter(s => s.status === 'quotation').length})
            </button>
          </div>

          {currentUser.role !== 'cashier' && selectedSales.length > 0 && (
            <button 
              className="cyber-button btn-orange" 
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              <Trash2 size={16} /> Delete Selected ({selectedSales.length})
            </button>
          )}
          <input 
            type="text" 
            className="cyber-input"
            style={{ width: '220px' }}
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sales History Table */}
      <div className="cyber-table-container" style={{ background: 'var(--bg-dark)' }}>
        <table className="cyber-table cyber-table-mono">
          <thead>
            <tr>
              {currentUser.role !== 'cashier' && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    className="cyber-checkbox"
                    checked={selectedSales.length > 0 && selectedSales.length === filteredSales.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th>Receipt ID</th>
              <th>Timestamp</th>
              <th>Customer</th>
              <th>Cashier</th>
              <th style={{ textAlign: 'center' }}>Type</th>
              <th style={{ textAlign: 'right' }}>Total amount</th>
              <th style={{ textAlign: 'center' }}>Payment Mode</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
              {currentUser.role !== 'cashier' && <th style={{ width: '40px', textAlign: 'center' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={currentUser.role !== 'cashier' ? "9" : "7"} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No receipts matching query found.
                </td>
              </tr>
            ) : (
              filteredSales.map(sale => (
                <tr key={sale.id}>
                  {currentUser.role !== 'cashier' && (
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        className="cyber-checkbox"
                        checked={selectedSales.includes(sale.id)}
                        onChange={() => toggleSelectSale(sale.id)}
                      />
                    </td>
                  )}
                  <td>#{sale.id}</td>
                  <td>{new Date(sale.timestamp).toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{sale.customer_name || 'Walk-in'}</td>
                  <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>{sale.cashier_name}</td>
                  <td style={{ textAlign: 'center' }}>
                    {sale.status === 'quotation' ? (
                      <span className="cyber-badge badge-orange" style={{ fontSize: '0.7rem' }}>QUOTE</span>
                    ) : (
                      <span className="cyber-badge badge-lime" style={{ fontSize: '0.7rem' }}>PAID</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>KES {Number(sale.total).toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="cyber-badge badge-cyan" style={{ fontSize: '0.75rem' }}>{sale.payment_method}</span>
                  </td>
                  <td style={{ textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      className="cyber-button no-print"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                      onClick={() => setSelectedSale(sale)}
                    >
                      <FileText size={12} /> View
                    </button>
                  </td>
                  {currentUser.role !== 'cashier' && (
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="cyber-button btn-orange no-print"
                        style={{ padding: '0.2rem', minWidth: 'auto', border: 'none' }}
                        onClick={() => handleDeleteSale(sale.id)}
                        disabled={isDeleting}
                        title="Delete Sale"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal Overlay */}
      {selectedSale && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '400px', background: '#FFFFFF', color: '#111111', border: '1px solid #111111', boxShadow: 'none', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
            {/* Header info */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #111111', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>{shopDetails.name}</h2>
              {shopDetails.address && <div style={{ fontSize: '0.8rem' }}>{shopDetails.address}</div>}
              {shopDetails.phone && <div style={{ fontSize: '0.8rem' }}>Tel: {shopDetails.phone}</div>}
              {shopDetails.vat_pin && <div style={{ fontSize: '0.8rem' }}>VAT PIN: {shopDetails.vat_pin}</div>}
            </div>

            {/* Receipt metadata */}
            <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '0.25rem', marginBottom: '1rem' }}>
              <div>Receipt No: #{selectedSale.id}</div>
              <div style={{ textAlign: 'right' }}>Date: {new Date(selectedSale.timestamp).toLocaleDateString()}</div>
              <div>Cashier: {selectedSale.cashier_name}</div>
              <div style={{ textAlign: 'right' }}>Time: {new Date(selectedSale.timestamp).toLocaleTimeString()}</div>
              <div>Customer: {selectedSale.customer_name || 'Walk-in'}</div>
              <div style={{ textAlign: 'right' }}>Method: {selectedSale.payment_method}</div>
            </div>

            {/* Items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #111111' }}>
                  <th style={{ textAlign: 'left', padding: '0.25rem 0' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '0.25rem 0' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '0.25rem 0' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px dashed #EEEEEE' }}>
                    <td style={{ padding: '0.4rem 0' }}>
                      <div>{item.product_name}</div>
                      {item.serial_numbers && (
                        <div style={{ fontSize: '0.7rem', color: '#666666' }}>S/N: {item.serial_numbers}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.4rem 0' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '0.4rem 0' }}>KES {Number(item.total_price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px dashed #111111', paddingTop: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal (Excl. VAT):</span>
                <span>KES {Number(selectedSale.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount (Excl. VAT):</span>
                <span>KES {Number(selectedSale.discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>VAT (16%):</span>
                <span>KES {Number(selectedSale.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', borderTop: '1px solid #111111', paddingTop: '0.25rem' }}>
                <span>Total (Incl. VAT):</span>
                <span>KES {Number(selectedSale.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {selectedSale.payment_method === 'Cash' && Number(selectedSale.amount_tendered) > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #111111', paddingTop: '0.25rem', fontSize: '0.8rem', color: '#555555' }}>
                    <span>Cash Tendered:</span>
                    <span>KES {Number(selectedSale.amount_tendered).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555555' }}>
                    <span>Change Due:</span>
                    <span>KES {Number(selectedSale.change_due).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* eTIMS Verification block */}
            {selectedSale.etims_invoice_number && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderTop: '1px dashed #111111', paddingTop: '0.75rem', marginBottom: '1rem', fontSize: '0.7rem', color: '#333333', textAlign: 'center' }}>
                <div><strong>KRA eTIMS COMPLIANCE RECORD</strong></div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>INV: {selectedSale.etims_invoice_number}</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>SIG: {selectedSale.etims_signature}</div>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(selectedSale.etims_qr_code_data)}`} 
                  alt="eTIMS QR Code" 
                  style={{ width: '100px', height: '100px', marginTop: '0.25rem' }}
                />
                <div style={{ fontSize: '0.65rem', color: '#666666' }}>Scan QR to verify eTIMS tax transmission.</div>
              </div>
            )}


              {/* Receipt Footer */}
              <div style={{ textAlign: 'center', fontSize: '0.75rem', borderTop: '1px dashed #111111', paddingTop: '0.5rem' }}>
                <p>Thank you for shopping with us!</p>
                <p>Goods once sold are not returnable</p>
                <p>unless found defective within 7 days.</p>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  {selectedSale.status === 'quotation' ? (
                    <>
                      <button 
                        className="cyber-button btn-lime no-print"
                        style={{ flex: 2, justifyContent: 'center', fontWeight: 'bold' }}
                        disabled={isConverting}
                        onClick={() => handleConvertQuotation(selectedSale.id)}
                      >
                        {isConverting ? 'Converting...' : '✓ Convert to Completed Sale'}
                      </button>
                      <button 
                        className="cyber-button no-print"
                        style={{ flex: 1, background: '#25D366', color: '#FFFFFF', borderColor: '#25D366', justifyContent: 'center' }}
                        onClick={() => handleSendWhatsAppQuote(selectedSale)}
                      >
                        📱 WhatsApp
                      </button>
                      <button 
                        className="cyber-button no-print"
                        style={{ flex: 1, background: '#EEEEEE', color: '#111111', borderColor: '#CCCCCC', justifyContent: 'center' }}
                        onClick={() => window.print()}
                      >
                        <Printer size={14} /> Print Quote
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className="cyber-button no-print"
                        style={{ flex: 1, background: '#25D366', color: '#FFFFFF', borderColor: '#25D366', justifyContent: 'center' }}
                        onClick={() => handleSendWhatsAppQuote(selectedSale)}
                      >
                        📱 Send WhatsApp
                      </button>
                      <button 
                        className="cyber-button no-print"
                        style={{ flex: 1, background: '#EEEEEE', color: '#111111', borderColor: '#CCCCCC', justifyContent: 'center' }}
                        onClick={() => window.print()}
                      >
                        <Printer size={14} /> Print Receipt
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div> {/* End scrollable area */}

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #DDDDDD' }}>
              <button 
                type="button"
                className="cyber-button btn-orange" 
                style={{ background: '#111111', color: '#FFFFFF', borderColor: '#111111', width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                onClick={() => setSelectedSale(null)}
              >
                Close Receipt [Esc]
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

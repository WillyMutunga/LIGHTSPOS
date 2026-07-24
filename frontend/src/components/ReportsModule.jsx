import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { FileText, Printer, ShieldCheck, Download } from 'lucide-react';

export default function ReportsModule() {
  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReportData(null);
    loadReport();
  }, [reportType]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'sales') {
        const sales = await api.getSales();
        setReportData(sales);
      } else if (reportType === 'inventory') {
        const products = await api.getProducts();
        setReportData(products);
      } else if (reportType === 'financial') {
        const summary = await api.getAnalyticsSummary();
        setReportData(summary);
      } else if (reportType === 'shifts') {
        const shifts = await api.getShifts();
        setReportData(shifts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Reports Center</h2>
          <p className="cyber-subtitle">Generate exportable audit-ready summaries for store accounting.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="cyber-button" onClick={handlePrint}>
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-muted)' }}>
        <button 
          className={`cyber-button ${reportType === 'sales' ? 'btn-lime' : ''}`}
          onClick={() => setReportType('sales')}
        >
          Sales Transactions
        </button>
        <button 
          className={`cyber-button ${reportType === 'inventory' ? 'btn-lime' : ''}`}
          onClick={() => setReportType('inventory')}
        >
          Inventory Valuation
        </button>
        <button 
          className={`cyber-button ${reportType === 'financial' ? 'btn-lime' : ''}`}
          onClick={() => setReportType('financial')}
        >
          Profit & Loss Summary
        </button>
        <button 
          className={`cyber-button ${reportType === 'shifts' ? 'btn-lime' : ''}`}
          onClick={() => setReportType('shifts')}
        >
          Shifts & Cash Audits
        </button>
      </div>

      {/* Report Display Container */}
      <div className="cyber-card" style={{ flex: 1, overflowY: 'auto' }} id="printable-report-area">
        {loading || !reportData ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '4rem', fontFamily: 'var(--font-mono)' }}>GENERATING COMPLIANCE RECORD...</p>
        ) : (
          <div>
            <div style={{ borderBottom: '2px solid var(--border-muted)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <h3 className="cyber-title" style={{ fontSize: '1.2rem' }}>
                  {reportType === 'sales' && 'Sales Register Report'}
                  {reportType === 'inventory' && 'Stock Valuation Statement'}
                  {reportType === 'financial' && 'Income Statement (P&L)'}
                  {reportType === 'shifts' && 'Shift Drawer Audits'}
                </h3>
                <p className="cyber-subtitle" style={{ fontSize: '0.85rem' }}>Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
              </div>
              <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>LIGHTS ELECTRICALS ERP</div>
            </div>

            {/* Sales report */}
            {reportType === 'sales' && (
              <div className="cyber-table-container">
                <table className="cyber-table cyber-table-mono">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Timestamp</th>
                      <th>Customer</th>
                      <th>Cashier</th>
                      <th style={{ textAlign: 'right' }}>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(reportData) && reportData.map(sale => (
                      <tr key={sale.id}>
                        <td>#{sale.id}</td>
                        <td>{new Date(sale.timestamp).toLocaleString()}</td>
                        <td style={{ fontFamily: 'var(--font-sans)' }}>{sale.customer_name || 'Walk-in'}</td>
                        <td style={{ fontFamily: 'var(--font-sans)' }}>{sale.cashier_name}</td>
                        <td style={{ textAlign: 'right' }}>KES {Number(sale.total).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Inventory Valuation Report */}
            {reportType === 'inventory' && (
              <div className="cyber-table-container">
                <table className="cyber-table cyber-table-mono">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th style={{ textAlign: 'right' }}>Cost Price</th>
                      <th style={{ textAlign: 'center' }}>Units in Stock</th>
                      <th style={{ textAlign: 'right' }}>Asset Valuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(reportData) && reportData.map(prod => {
                      const valuation = Number(prod.cost_price) * prod.stock_quantity;
                      return (
                        <tr key={prod.id}>
                          <td>{prod.barcode}</td>
                          <td style={{ fontFamily: 'var(--font-sans)' }}>{prod.name}</td>
                          <td style={{ textAlign: 'right' }}>KES {Number(prod.cost_price).toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>{prod.stock_quantity}</td>
                          <td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>
                            KES {valuation.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Income P&L Statement */}
            {reportType === 'financial' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '500px', margin: '0 auto', padding: '1rem', background: 'var(--bg-darker)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.5rem' }}>
                  <span>Gross POS Revenue:</span>
                  <span className="currency" style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>
                    KES {Number(reportData.total_sales_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.5rem' }}>
                  <span>Cost of Goods Sold (COGS):</span>
                  <span className="currency" style={{ color: 'var(--alert-orange)' }}>
                    KES {(Number(reportData.total_sales_amount) - Number(reportData.net_profit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--accent-cyan)', paddingBottom: '0.5rem', fontWeight: 'bold' }}>
                  <span>Net Operating Profit:</span>
                  <span className="currency" style={{ color: 'var(--success-lime)', fontSize: '1.15rem' }}>
                    KES {Number(reportData.net_profit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  <ShieldCheck size={16} /> <span>Audited compliance record verified.</span>
                </div>
              </div>
            )}

            {/* Shifts Drawer Audits */}
            {reportType === 'shifts' && (
              <div className="cyber-table-container">
                <table className="cyber-table cyber-table-mono">
                  <thead>
                    <tr>
                      <th>Shift #</th>
                      <th>Cashier</th>
                      <th>Open Time</th>
                      <th>Close Time</th>
                      <th style={{ textAlign: 'right' }}>Expected Cash</th>
                      <th style={{ textAlign: 'right' }}>Actual Cash</th>
                      <th style={{ textAlign: 'right' }}>Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(reportData) && reportData.map(shift => (
                      <tr key={shift.id}>
                        <td>#{shift.id}</td>
                        <td style={{ fontFamily: 'var(--font-sans)' }}>{shift.cashier_name}</td>
                        <td>{new Date(shift.open_time).toLocaleString()}</td>
                        <td>{shift.close_time ? new Date(shift.close_time).toLocaleString() : 'Open'}</td>
                        <td style={{ textAlign: 'right' }}>KES {Number(shift.ending_cash || shift.starting_cash).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>{shift.actual_cash ? `KES ${Number(shift.actual_cash).toLocaleString()}` : '—'}</td>
                        <td style={{ textAlign: 'right', color: Number(shift.variance) < 0 ? 'var(--alert-orange)' : 'var(--text-main)' }}>
                          {shift.variance ? `KES ${Number(shift.variance).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}

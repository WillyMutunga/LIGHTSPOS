import re

with open('frontend/src/components/ReportsModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add cashier_daily to reportType options
buttons_old = '''        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-muted)' }}>
          <button 
            className={cyber-button }
            onClick={() => setReportType('sales')}
          >
            Sales Register
          </button>
          <button 
            className={cyber-button }
            onClick={() => setReportType('inventory')}
          >
            Inventory Valuation
          </button>'''

buttons_new = '''        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-muted)', flexWrap: 'wrap' }}>
          <button 
            className={cyber-button }
            onClick={() => setReportType('sales')}
          >
            Sales Register
          </button>
          <button 
            className={cyber-button }
            onClick={() => setReportType('cashier_daily')}
          >
            My Daily Z-Report
          </button>
          <button 
            className={cyber-button }
            onClick={() => setReportType('inventory')}
          >
            Inventory Valuation
          </button>'''
content = content.replace(buttons_old, buttons_new)

fetch_old = '''    try {
      setLoading(true);
      if (reportType === 'sales') {
        const sales = await api.getSales();
        setReportData(sales);
      } else if (reportType === 'inventory') {'''

fetch_new = '''    try {
      setLoading(true);
      if (reportType === 'sales' || reportType === 'cashier_daily') {
        const sales = await api.getSales();
        if (reportType === 'cashier_daily') {
           // Filter for today's sales by current user
           const today = new Date().toLocaleDateString();
           const filtered = sales.filter(s => {
               const sDate = new Date(s.timestamp).toLocaleDateString();
               return sDate === today && s.cashier === currentUser.id;
           });
           setReportData(filtered);
        } else {
           setReportData(sales);
        }
      } else if (reportType === 'inventory') {'''
content = content.replace(fetch_old, fetch_new)

header_old = '''                <h3 className="cyber-title" style={{ fontSize: '1.2rem' }}>
                  {reportType === 'sales' && 'Sales Register Report'}
                  {reportType === 'inventory' && 'Stock Valuation Statement'}
                  {reportType === 'financial' && 'Income Statement (P&L)'}
                  {reportType === 'shifts' && 'Shift Drawer Audits'}
                </h3>'''
header_new = '''                <h3 className="cyber-title" style={{ fontSize: '1.2rem' }}>
                  {reportType === 'sales' && 'Sales Register Report'}
                  {reportType === 'cashier_daily' && 'My Daily Z-Report (Shift Totals)'}
                  {reportType === 'inventory' && 'Stock Valuation Statement'}
                  {reportType === 'financial' && 'Income Statement (P&L)'}
                  {reportType === 'shifts' && 'Shift Drawer Audits'}
                </h3>'''
content = content.replace(header_old, header_new)

z_report_ui = '''            {/* Cashier Daily Z-Report */}
            {reportType === 'cashier_daily' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '500px', margin: '0 auto', padding: '1rem', background: 'var(--bg-darker)', borderRadius: '4px' }}>
                <h4 style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px dashed var(--border-muted)', paddingBottom: '1rem' }}>
                  CASHIER SHIFT TOTALS<br/><br/>
                  <span style={{color:'var(--accent-cyan)'}}>{currentUser.name}</span><br/>
                  <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{new Date().toLocaleDateString()}</span>
                </h4>
                
                {(() => {
                  if (!Array.isArray(reportData)) return null;
                  
                  let totalCash = 0;
                  let totalMpesa = 0;
                  let totalCard = 0;
                  let totalCredit = 0;
                  let grandTotal = 0;
                  
                  reportData.forEach(sale => {
                     grandTotal += Number(sale.total);
                     if (sale.payment_method === 'Cash') totalCash += Number(sale.total);
                     if (sale.payment_method === 'M-Pesa') totalMpesa += Number(sale.total);
                     if (sale.payment_method === 'Card') totalCard += Number(sale.total);
                     if (sale.payment_method === 'Credit') totalCredit += Number(sale.total);
                     if (sale.payment_method === 'Mixed') {
                         totalCash += Number(sale.mixed_cash_amount || 0);
                         totalMpesa += Number(sale.mixed_mpesa_amount || 0);
                     }
                  });

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cash Collected:</span>
                        <span className="currency">KES {totalCash.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>M-Pesa Collected:</span>
                        <span className="currency">KES {totalMpesa.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Card Payments:</span>
                        <span className="currency">KES {totalCard.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-muted)', paddingBottom: '0.5rem' }}>
                        <span>Store Credit:</span>
                        <span className="currency">KES {totalCredit.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--accent-cyan)', paddingBottom: '0.5rem', fontWeight: 'bold' }}>
                        <span>Gross Shift Sales:</span>
                        <span className="currency" style={{ color: 'var(--success-lime)', fontSize: '1.15rem' }}>
                          KES {grandTotal.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', justifyContent: 'center' }}>
                        <span>Transactions: {reportData.length}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Inventory Valuation Report */}'''

content = content.replace("            {/* Inventory Valuation Report */}", z_report_ui)

with open('frontend/src/components/ReportsModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ReportsModule.jsx!")

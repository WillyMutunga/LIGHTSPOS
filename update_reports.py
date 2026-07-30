import re

with open('frontend/src/components/ReportsModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Change default tab
content = content.replace("const [reportType, setReportType] = useState('sales');", "const currentUser = JSON.parse(localStorage.getItem('user') || '{}');\n  const [reportType, setReportType] = useState(currentUser.role === 'admin' ? 'sales' : 'cashier_daily');")

# We already have currentUser defined above, let's remove the duplicate we added earlier
content = content.replace("  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');\n\n  useEffect", "\n  useEffect")

# Update buttons to conditionally render based on role
buttons_old = '''        {/* Selectors */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-muted)', flexWrap: 'wrap' }}>
          <button 
            className={cyber-button }
            onClick={() => setReportType('sales')}
          >
            Sales Transactions
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
          </button>
          <button 
            className={cyber-button }
            onClick={() => setReportType('financial')}
          >
            Profit & Loss Summary
          </button>
          <button 
            className={cyber-button }
            onClick={() => setReportType('shifts')}
          >
            Shift Drawer Audits
          </button>
        </div>'''

buttons_new = '''        {/* Selectors */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-muted)', flexWrap: 'wrap' }}>
          
          {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <button 
              className={cyber-button }
              onClick={() => setReportType('sales')}
            >
              Sales Transactions
            </button>
          )}

          <button 
            className={cyber-button }
            onClick={() => setReportType('cashier_daily')}
          >
            My Daily Z-Report
          </button>

          {currentUser.role === 'admin' && (
            <>
              <button 
                className={cyber-button }
                onClick={() => setReportType('inventory')}
              >
                Inventory Valuation
              </button>
              <button 
                className={cyber-button }
                onClick={() => setReportType('financial')}
              >
                Profit & Loss Summary
              </button>
              <button 
                className={cyber-button }
                onClick={() => setReportType('shifts')}
              >
                Shift Drawer Audits
              </button>
            </>
          )}
        </div>'''

content = content.replace(buttons_old, buttons_new)

with open('frontend/src/components/ReportsModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

import re

with open('frontend/src/components/POSModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

buttons_old = '''                  <button
                    type="button"
                    className={cyber-button }
                    onClick={() => setPaymentMethod('Credit')}
                    style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                  >
                    <Key size={14} /> Credit
                  </button>
                </div>
              </div>'''

buttons_new = '''                  <button
                    type="button"
                    className={cyber-button }
                    onClick={() => setPaymentMethod('Credit')}
                    style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                  >
                    <Key size={14} /> Credit
                  </button>
                  <button
                    type="button"
                    className={cyber-button }
                    onClick={() => setPaymentMethod('Mixed')}
                    style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                  >
                    <DollarSign size={14} />+<Smartphone size={14} /> Split
                  </button>
                </div>
              </div>'''

content = content.replace(buttons_old, buttons_new)
content = content.replace("gridTemplateColumns: 'repeat(4, 1fr)'", "gridTemplateColumns: 'repeat(5, 1fr)'")

mixed_ui = '''              {paymentMethod === 'Mixed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="cyber-label">Cash Tendered (KES)</label>
                    <input
                      type="number"
                      className="cyber-input cyber-input-mono"
                      placeholder="0.00"
                      value={mixedCashAmount}
                      onChange={(e) => setMixedCashAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="cyber-label">M-Pesa Tendered (KES)</label>
                    <input
                      type="number"
                      className="cyber-input cyber-input-mono"
                      placeholder="0.00"
                      value={mixedMpesaAmount}
                      onChange={(e) => setMixedMpesaAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="cyber-label">M-Pesa Transaction Ref</label>
                    <input
                      type="text"
                      className="cyber-input cyber-input-mono"
                      placeholder="e.g. QKY6ABCDEF"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div style={{ padding: '0.5rem', background: 'var(--bg-dark)', border: '1px solid var(--border-muted)', textAlign: 'center', fontSize: '0.8rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Sum Tendered: <span style={{ color: 'white' }}>KES {(Number(mixedCashAmount || 0) + Number(mixedMpesaAmount || 0)).toLocaleString()}</span></div>
                    {Number(mixedCashAmount || 0) + Number(mixedMpesaAmount || 0) > getTotal() && (
                      <div style={{ color: 'var(--accent-orange)', marginTop: '0.25rem', fontWeight: 'bold' }}>
                        Cash Change Due: KES {(Number(mixedCashAmount || 0) + Number(mixedMpesaAmount || 0) - getTotal()).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentMethod === 'Cash' && ('''

content = content.replace("              {paymentMethod === 'Cash' && (", mixed_ui)

with open('frontend/src/components/POSModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated POSModule.jsx with Mixed UI")

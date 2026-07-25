import re

with open('frontend/src/components/POSModule.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State additions
content = content.replace(
    "const [customerSearchInput, setCustomerSearchInput] = useState('');",
    "const [customerSearchInput, setCustomerSearchInput] = useState('');\n  const [pricingMode, setPricingMode] = useState('Retail');\n  const [mixedCashAmount, setMixedCashAmount] = useState('');\n  const [mixedMpesaAmount, setMixedMpesaAmount] = useState('');"
)

# 2. addToCart logic
addToCartOld = '''        } else {
          if (product.stock_quantity < newQty) {
            alert(Insufficient stock. Only  available.);
            return;
          }
          newCart[existingIndex].quantity = newQty;
          newCart[existingIndex].total_price = newQty * Number(product.retail_price);
          setCart(newCart);
        }'''
addToCartNew = '''        } else {
          if (product.stock_quantity < newQty) {
            alert(Insufficient stock. Only  available.);
            return;
          }
          newCart[existingIndex].quantity = newQty;
          const currentPrice = pricingMode === 'Wholesale' ? Number(product.wholesale_price) : Number(product.retail_price);
          newCart[existingIndex].total_price = newQty * currentPrice;
          setCart(newCart);
        }'''
content = content.replace(addToCartOld, addToCartNew)

addToCartNewItemOld = '''        const newCartItem = {
          product,
          quantity: 1,
          unit_price: Number(product.retail_price),
          total_price: Number(product.retail_price),
          serial_numbers: []
        };'''
addToCartNewItemNew = '''        const price = pricingMode === 'Wholesale' ? Number(product.wholesale_price) : Number(product.retail_price);
        const newCartItem = {
          product,
          quantity: 1,
          unit_price: price,
          total_price: price,
          serial_numbers: []
        };'''
content = content.replace(addToCartNewItemOld, addToCartNewItemNew)

# 3. handleCheckout logic
checkoutResetOld = '''        setDiscountPercent(0);
        setPaymentRef('');
        setAmountTendered('');'''
checkoutResetNew = '''        setDiscountPercent(0);
        setPaymentRef('');
        setAmountTendered('');
        setMixedCashAmount('');
        setMixedMpesaAmount('');
        setCustomerSearchInput('');
        setSelectedCustomer(null);'''
content = content.replace(checkoutResetOld, checkoutResetNew)

checkoutMixedOld = '''    } else if (paymentMethod === 'Mixed') {
      // In POSModule, we'll store Mixed Cash in amountTendered and Mixed M-Pesa in a new state variable.
      // But wait, we haven't added the new state variables yet. I will use mixedCashAmount and mixedMpesaAmount.
    }'''
checkoutMixedNew = '''    } else if (paymentMethod === 'Mixed') {
      mixedCash = Number(mixedCashAmount || 0);
      mixedMpesa = Number(mixedMpesaAmount || 0);
      if (mixedCash + mixedMpesa < getTotal()) {
        alert("The sum of Cash and M-Pesa must cover the grand total.");
        setIsProcessing(false);
        return;
      }
      // If they overpay, they get cash change
      if (mixedCash + mixedMpesa > getTotal()) {
        tenderedVal = mixedCash + mixedMpesa;
      }
    }'''
content = content.replace(checkoutMixedOld, checkoutMixedNew)

# 4. Update checkoutData dict inside handleCheckout
checkoutDataOld = '''        amount_tendered: paymentMethod === 'Cash' ? tenderedVal : 0,
        change_due: paymentMethod === 'Cash' ? Math.max(0, tenderedVal - getTotal()) : 0,'''
checkoutDataNew = '''        amount_tendered: paymentMethod === 'Cash' ? tenderedVal : (paymentMethod === 'Mixed' ? tenderedVal : 0),
        change_due: paymentMethod === 'Cash' ? Math.max(0, tenderedVal - getTotal()) : (paymentMethod === 'Mixed' ? Math.max(0, mixedCash + mixedMpesa - getTotal()) : 0),
        mixed_cash_amount: mixedCash,
        mixed_mpesa_amount: mixedMpesa,'''
content = content.replace(checkoutDataOld, checkoutDataNew)

# 5. UI Updates: Pricing Mode Toggle and Mixed Payment Inputs
pricingUi = '''          {/* Pricing Mode Toggle */}
          <div className="cyber-card" style={{ padding: '0.5rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="cyber-label" style={{ margin: 0 }}>Pricing Mode:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button"
                className={cyber-button }
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setPricingMode('Retail')}
              >
                Retail
              </button>
              <button 
                type="button"
                className={cyber-button }
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setPricingMode('Wholesale')}
              >
                Wholesale
              </button>
            </div>
          </div>
          
          {/* Cart Header */}'''
content = content.replace("          {/* Cart Header */}", pricingUi)

paymentUiOld = '''            <select 
              className="cyber-input" 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Card">Card</option>
              <option value="Credit">Store Credit</option>
            </select>
          </div>

          {paymentMethod === 'M-Pesa' && ('''
paymentUiNew = '''            <select 
              className="cyber-input" 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Card">Card</option>
              <option value="Credit">Store Credit</option>
              <option value="Mixed">Mixed (Cash + M-Pesa)</option>
            </select>
          </div>

          {paymentMethod === 'Mixed' && (
            <>
              <div>
                <label className="cyber-label">Cash Tendered (KES)</label>
                <input
                  type="number"
                  className="cyber-input cyber-input-mono"
                  placeholder="0.00"
                  value={mixedCashAmount}
                  onChange={(e) => setMixedCashAmount(e.target.value)}
                  min="0"
                  step="1"
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
                  min="0"
                  step="1"
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
                <div style={{ color: 'var(--text-muted)' }}>Sum Tendered: <span style={{ color: 'white' }}>KES {Number(mixedCashAmount || 0) + Number(mixedMpesaAmount || 0)}</span></div>
                {Number(mixedCashAmount || 0) + Number(mixedMpesaAmount || 0) > getTotal() && (
                  <div style={{ color: 'var(--accent-orange)', marginTop: '0.25rem', fontWeight: 'bold' }}>
                    Cash Change Due: KES {(Number(mixedCashAmount || 0) + Number(mixedMpesaAmount || 0) - getTotal()).toLocaleString()}
                  </div>
                )}
              </div>
            </>
          )}

          {paymentMethod === 'M-Pesa' && ('''
content = content.replace(paymentUiOld, paymentUiNew)


with open('frontend/src/components/POSModule.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated POSModule.jsx!")

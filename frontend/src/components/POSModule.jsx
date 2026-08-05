import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Search, ShoppingCart, Trash2, Key, CreditCard, DollarSign, Smartphone, CheckCircle, X } from 'lucide-react';

export default function POSModule({ activeShift, currentUser, onAddLog }) {
  const [barcode, setBarcode] = useState('');
  const [barcodeResults, setBarcodeResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isPushingMpesa, setIsPushingMpesa] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [amountTendered, setAmountTendered] = useState('');
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [pricingMode, setPricingMode] = useState('Retail');
  const [mixedCashAmount, setMixedCashAmount] = useState('');
  const [mixedMpesaAmount, setMixedMpesaAmount] = useState('');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'fixed'
  
  const [taxRate, setTaxRate] = useState(16); // 16% VAT default
  
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState(null);
  
  // Serial number tracking modal state
  const [serialPickerItem, setSerialPickerItem] = useState(null);
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [init, setInit] = useState(false);

  const barcodeInputRef = useRef(null);

  // Load initial customers
  useEffect(() => {
    api.getCustomers().then(res => {
      setCustomers(res);
      // Default select Walk-in Customer
      const walkin = res.find(c => c.phone === '0000000000');
      if (walkin) setSelectedCustomer(walkin);
    }).catch(err => console.error(err));
    
    // Focus barcode scanner on load
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
    
    const saved = localStorage.getItem('posState');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCart(parsed.cart || []);
      if (parsed.customer) setSelectedCustomer(parsed.customer);
      if (parsed.discountValue) setDiscountValue(parsed.discountValue);
      if (parsed.discountType) setDiscountType(parsed.discountType);
      if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
      if (parsed.paymentRef) setPaymentRef(parsed.paymentRef);
    }
    setInit(true);
  }, []);

  useEffect(() => {
    if (init) {
      localStorage.setItem('posState', JSON.stringify({
        cart,
        customer: selectedCustomer,
        discountValue,
        discountType,
        paymentMethod,
        paymentRef
      }));
    }
  }, [cart, selectedCustomer, discountValue, discountType, paymentMethod, paymentRef, activeShift]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        if (barcodeInputRef.current) barcodeInputRef.current.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleCheckout('completed');
      } else if (e.key === 'Escape') {
        setSerialPickerItem(null);
        setActiveReceipt(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, discountValue, discountType, paymentMethod, paymentRef, activeShift]);

  // Autocomplete for barcode scan input
  useEffect(() => {
    if (barcode.trim().length > 1) {
      api.getProducts(barcode.trim()).then(res => {
        setBarcodeResults(res);
      }).catch(err => console.error(err));
    } else {
      setBarcodeResults([]);
    }
  }, [barcode]);

  // Search products when query changes
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      api.getProducts(searchQuery).then(res => {
        setSearchResults(res);
      }).catch(err => console.error(err));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleBarcodeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const product = await api.getProductByBarcode(barcode.trim());
      addToCart(product);
      setBarcode('');
      setBarcodeResults([]);
    } catch (err) {
      if (barcodeResults.length > 0) {
        addToCart(barcodeResults[0]);
        setBarcode('');
        setBarcodeResults([]);
      } else {
        alert(`Product not found for barcode: ${barcode}`);
      }
    }
  };

  const handleStkPush = async () => {
    const phone = mpesaPhone || (selectedCustomer ? selectedCustomer.phone : '');
    if (!phone || phone === '0000000000') {
      alert("Please enter or select a valid customer phone number for the STK Push.");
      return;
    }
    
    setIsPushingMpesa(true);
    try {
      const res = await api.stkPush(phone, getTotal());
      setPaymentRef(res.payment_reference);
      alert(`STK Push Payment Confirmed! Ref: ${res.payment_reference}`);
    } catch (err) {
      alert(`STK Push payment failed: ${err.message}`);
    } finally {
      setIsPushingMpesa(false);
    }
  };

  const addToCart = (product) => {
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + 1;
      
      if (product.serial_tracked) {
        // If serial tracked, open serial picker instead of simple increment
        openSerialPicker(product, existingIndex);
      } else {
        if (product.stock_quantity < newQty) {
          alert(`Insufficient stock. Only ${product.stock_quantity} available.`);
          return;
        }
        const price = pricingMode === 'Wholesale' && Number(product.wholesale_price) > 0 ? Number(product.wholesale_price) : Number(product.retail_price);
        newCart[existingIndex].quantity = newQty;
        newCart[existingIndex].unit_price = price;
        newCart[existingIndex].total_price = newQty * price;
        setCart(newCart);
      }
    } else {
      if (product.stock_quantity < 1) {
        alert("Product is out of stock.");
        return;
      }
      
      const price = pricingMode === 'Wholesale' && Number(product.wholesale_price) > 0 ? Number(product.wholesale_price) : Number(product.retail_price);
      const newCartItem = {
        product,
        quantity: 1,
        unit_price: price,
        total_price: price,
        serial_numbers: []
      };

      if (product.serial_tracked) {
        openSerialPicker(product, -1);
      } else {
        setCart([...cart, newCartItem]);
      }
    }
  };

  const openSerialPicker = (product, cartIndex) => {
    const currentItem = cartIndex > -1 ? cart[cartIndex] : {
      product,
      quantity: cartIndex > -1 ? cart[cartIndex].quantity : 0,
      serial_numbers: []
    };
    
    setSerialPickerItem({ product, cartIndex, currentItem });
    setSelectedSerials(currentItem.serial_numbers || []);
  };

  const handleSaveSerials = () => {
    if (selectedSerials.length === 0) {
      alert("Please select at least one serial number.");
      return;
    }

    const { product, cartIndex } = serialPickerItem;
    const qty = selectedSerials.length;

    if (qty > product.stock_quantity) {
      alert(`Cannot select more than stock limit (${product.stock_quantity})`);
      return;
    }

    const newCart = [...cart];
    const price = pricingMode === 'Wholesale' && Number(product.wholesale_price) > 0 ? Number(product.wholesale_price) : Number(product.retail_price);

    if (cartIndex > -1) {
      newCart[cartIndex].quantity = qty;
      newCart[cartIndex].serial_numbers = selectedSerials;
      newCart[cartIndex].unit_price = price;
      newCart[cartIndex].total_price = qty * price;
    } else {
      newCart.push({
        product,
        quantity: qty,
        unit_price: price,
        total_price: qty * price,
        serial_numbers: selectedSerials
      });
    }

    setCart(newCart);
    setSerialPickerItem(null);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateQty = (index, qty) => {
    const item = cart[index];
    const product = item.product;

    if (qty <= 0) {
      removeFromCart(index);
      return;
    }

    if (product.serial_tracked) {
      // Re-trigger serial picker to choose exact serials matching qty
      openSerialPicker(product, index);
      return;
    }

    if (product.stock_quantity < qty) {
      alert(`Insufficient stock. Only ${product.stock_quantity} available.`);
      return;
    }

    const newCart = [...cart];
    newCart[index].quantity = qty;
    newCart[index].total_price = qty * item.unit_price;
    setCart(newCart);
  };

  // Calculations (VAT-inclusive pricing)
  const getSubtotal = () => cart.reduce((sum, item) => sum + item.total_price, 0); // Inclusive subtotal
  const getDiscountAmount = () => {
    if (discountType === 'percent') {
      return getSubtotal() * (Number(discountValue) / 100);
    }
    return Number(discountValue) || 0;
  };
  const getTotal = () => getSubtotal() - getDiscountAmount(); // Inclusive grand total
  
  // Tax portion included in the total
  const getTaxAmount = () => {
    const totalVal = getTotal();
    return totalVal * (taxRate / (100 + taxRate));
  };
  
  // Tax-exclusive subtotal for receipt reporting
  const getTaxExclusiveSubtotal = () => {
    return getSubtotal() * (100 / (100 + taxRate));
  };
  
  // Tax-exclusive discount for receipt reporting
  const getTaxExclusiveDiscount = () => {
    return getDiscountAmount() * (100 / (100 + taxRate));
  };

  const handleCheckout = async (status = 'completed') => {
    if (status === 'completed' && !activeShift) {
      alert("No active shift found. Please open cash drawer shift first.");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    if (paymentMethod === 'Credit' && (!selectedCustomer || selectedCustomer.phone === '0000000000')) {
      alert("A registered customer account (not Walk-in) is required for Credit (Store Debt) purchases.");
      setIsProcessing(false);
      return;
    }

    let tenderedVal = Number(amountTendered || 0);

    setIsProcessing(true);

    const checkoutData = {
      shift: activeShift.id,
      cashier: currentUser.id,
      customer: selectedCustomer ? selectedCustomer.id : null,
      subtotal: getTaxExclusiveSubtotal().toFixed(2),
      discount: getTaxExclusiveDiscount().toFixed(2),
      tax_amount: getTaxAmount().toFixed(2),
      total: getTotal().toFixed(2),
      payment_method: paymentMethod,
      status: status,
      payment_reference: paymentMethod === 'M-Pesa' ? (paymentRef || `MP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`) : paymentRef,
      amount_tendered: paymentMethod === 'Cash' ? tenderedVal : (paymentMethod === 'Mixed' ? Number(mixedCashAmount || 0) : 0),
      change_due: paymentMethod === 'Cash' ? Math.max(0, tenderedVal - getTotal()) : (paymentMethod === 'Mixed' ? Math.max(0, (Number(mixedCashAmount || 0) + Number(mixedMpesaAmount || 0)) - getTotal()) : 0),
      mixed_cash_amount: paymentMethod === 'Mixed' ? Number(mixedCashAmount || 0) : 0,
      mixed_mpesa_amount: paymentMethod === 'Mixed' ? Number(mixedMpesaAmount || 0) : 0,
      items: cart.map(item => ({
        product: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price.toFixed(2),
        total_price: item.total_price.toFixed(2),
        serial_numbers: item.serial_numbers.join(', ')
      }))
    };

    try {
      const receipt = await api.checkout(checkoutData);
      setActiveReceipt(receipt);
      setCart([]);
      setDiscountValue(0);
      setPaymentRef('');
      setAmountTendered('');
      setMixedCashAmount('');
      setMixedMpesaAmount('');
      onAddLog('SALE_CREATE', `Completed transaction #${receipt.id} - Total KES ${receipt.total}`);
      
      // Send Digital Receipt (SMS/WhatsApp)
      if (sendNotification && selectedCustomer && selectedCustomer.phone && selectedCustomer.phone !== '0000000000') {
        const message = `Thank you for shopping with us, ${selectedCustomer.name}! Your receipt #${receipt.id} for KES ${receipt.total} has been confirmed.`;
        api.sendSms({ phone: selectedCustomer.phone, message: message }).catch(e => {
          console.error('Failed to send digital receipt:', e);
        });
      }
    } catch (err) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSerialSelection = (serial) => {
    if (selectedSerials.includes(serial)) {
      setSelectedSerials(selectedSerials.filter(s => s !== serial));
    } else {
      setSelectedSerials([...selectedSerials, serial]);
    }
  };

  return (
    <div className="pos-grid">
      {/* Left side - Product Entry & Cart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        
        {/* Scanner and Search Area */}
        <div className="pos-search-container" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-dark)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-muted)' }}>
            <button
              type="button"
              onClick={() => setPricingMode('Retail')}
              style={{ padding: '0.5rem 1rem', background: pricingMode === 'Retail' ? 'var(--accent-lime)' : 'transparent', color: pricingMode === 'Retail' ? '#000' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: pricingMode === 'Retail' ? 'bold' : 'normal' }}
            >
              Retail
            </button>
            <button
              type="button"
              onClick={() => setPricingMode('Wholesale')}
              style={{ padding: '0.5rem 1rem', background: pricingMode === 'Wholesale' ? 'var(--accent-cyan)' : 'transparent', color: pricingMode === 'Wholesale' ? '#000' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: pricingMode === 'Wholesale' ? 'bold' : 'normal' }}
            >
              Wholesale
            </button>
          </div>
          <form onSubmit={handleBarcodeSubmit} style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <ShoppingCart size={18} />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              className="cyber-input"
              style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-mono)' }}
              placeholder="F3: Scan Barcode (e.g. CABLE-2.5MM, BREAKER-32A)..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            {barcodeResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg-dark)', border: '1px solid var(--accent-cyan)',
                borderRadius: '4px', zIndex: 100, maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 10px 20px rgba(0,0,0,0.5)', marginTop: '4px'
              }}>
                {barcodeResults.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      addToCart(prod);
                      setBarcode('');
                      setBarcodeResults([]);
                    }}
                    style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-muted)',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                    className="sidebar-item"
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{prod.name}</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{prod.barcode}</div>
                    </div>
                    <span className="currency" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>KES {Number(prod.retail_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </form>

          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </div>
            <input
              type="text"
              className="cyber-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search products by name/description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Search results autocomplete */}
            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--bg-dark)', border: '1px solid var(--accent-cyan)',
                borderRadius: '4px', zIndex: 100, maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 10px 20px rgba(0,0,0,0.5)', marginTop: '4px'
              }}>
                {searchResults.map(prod => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      addToCart(prod);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-muted)',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                    }}
                    className="sidebar-item"
                  >
                    <span>{prod.name}</span>
                    <span className="currency" style={{ color: 'var(--accent-cyan)' }}>KES {Number(prod.retail_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Table */}
        <div className="cyber-table-container" style={{ flex: 1, background: 'var(--bg-dark)' }}>
          <table className="cyber-table cyber-table-mono">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Product</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Price</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Total</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    <ShoppingCart size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>Terminal Cart Empty</p>
                  </td>
                </tr>
              ) : (
                cart.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div>{item.product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.product.barcode}</div>
                      {item.product.serial_tracked && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--alert-orange)', marginTop: '0.2rem' }}>
                          Serials: {item.serial_numbers.join(', ')}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>KES {item.unit_price.toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          className="cyber-button" 
                          style={{ padding: '0.1rem 0.4rem', fontSize: '0.8rem' }}
                          onClick={() => updateQty(idx, item.quantity - 1)}
                        >-</button>
                        <span>{item.quantity}</span>
                        <button 
                          className="cyber-button" 
                          style={{ padding: '0.1rem 0.4rem', fontSize: '0.8rem' }}
                          onClick={() => updateQty(idx, item.quantity + 1)}
                        >+</button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>KES {item.total_price.toLocaleString()}</td>
                    <td>
                      <button 
                        onClick={() => removeFromCart(idx)}
                        style={{ background: 'none', border: 'none', color: 'var(--alert-orange)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Shortcuts ribbons */}
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-dark)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px solid var(--border-muted)' }}>
          <div><span style={{ color: 'var(--accent-cyan)' }}>F3</span> Barcode Scan</div>
          <div><span style={{ color: 'var(--accent-cyan)' }}>F2</span> Checkout Pay</div>
          <div><span style={{ color: 'var(--accent-cyan)' }}>Esc</span> Exit Screens</div>
        </div>

      </div>

      {/* Right side - Totals, Customer & Checkout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Customer Select Card */}
        <div className="cyber-card">
          <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Customer Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="cyber-label">Search Customer (Name or Phone)</label>
              <input
                type="text"
                className="cyber-input"
                list="customer-list"
                placeholder="Type to search..."
                value={customerSearchInput}
                onChange={(e) => {
                  setCustomerSearchInput(e.target.value);
                  const cust = customers.find(c => `${c.name} (${c.phone})` === e.target.value);
                  if (cust) {
                    setSelectedCustomer(cust);
                  } else {
                    setSelectedCustomer(null);
                  }
                }}
              />
              <datalist id="customer-list">
                {customers.map(c => (
                  <option key={c.id} value={`${c.name} (${c.phone})`} />
                ))}
              </datalist>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex' }}>
                <select 
                  className="cyber-input" 
                  style={{ width: '80px', borderRight: 'none', borderRadius: '4px 0 0 4px', border: '1px solid var(--border-dark)', background: 'var(--bg-dark)' }}
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                >
                  <option value="percent">%</option>
                  <option value="fixed">KES</option>
                </select>
                <input 
                  type="number" 
                  className="cyber-input"
                  style={{ flex: 1, borderRadius: '0 4px 4px 0' }}
                  placeholder={`Discount ${discountType === 'percent' ? '(%)' : '(Amount)'}`}
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min="0"
                  max={discountType === 'percent' ? "100" : undefined}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal (VAT Inc.)</span>
                <span>KES {getSubtotal().toLocaleString()}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--alert-orange)' }}>
                  <span>Discount</span>
                  <span>- KES {getDiscountAmount().toLocaleString()}</span>
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', background: 'var(--bg-darker)', padding: '0.5rem', borderRadius: '2px', marginTop: '1rem' }}>
                <span>Loyalty Points: <strong style={{ color: 'var(--success-lime)' }}>{selectedCustomer.loyalty_points}</strong></span>
                <span>Reward Value: <strong style={{ color: 'var(--accent-cyan)' }}>KES {selectedCustomer.loyalty_points * 1}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Payments Summary Card */}
        <div className="cyber-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Receipt Totals</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderBottom: '1px solid var(--border-muted)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal (VAT Excl.)</span>
                <span className="currency">KES {getTaxExclusiveSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>VAT ({taxRate}%)</span>
                <span className="currency">KES {getTaxAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
              <span className="cyber-title" style={{ fontSize: '1.2rem' }}>Grand Total</span>
              <span className="currency" style={{ fontSize: '2rem', color: 'var(--accent-cyan)', fontWeight: '800' }}>
                KES {getTotal().toLocaleString()}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="cyber-label">Payment Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                <button
                  type="button"
                  className={`cyber-button ${paymentMethod === 'Cash' ? 'btn-lime' : ''}`}
                  onClick={() => setPaymentMethod('Cash')}
                  style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                >
                  <DollarSign size={14} /> Cash
                </button>
                <button
                  type="button"
                  className={`cyber-button ${paymentMethod === 'M-Pesa' ? 'btn-lime' : ''}`}
                  onClick={() => setPaymentMethod('M-Pesa')}
                  style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                >
                  <Smartphone size={14} /> M-Pesa
                </button>
                <button
                  type="button"
                  className={`cyber-button ${paymentMethod === 'Card' ? 'btn-lime' : ''}`}
                  onClick={() => setPaymentMethod('Card')}
                  style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                >
                  <CreditCard size={14} /> Card
                </button>
                  <button
                    type="button"
                    className={`cyber-button ${paymentMethod === 'Credit' ? 'btn-lime' : ''}`}
                    onClick={() => setPaymentMethod('Credit')}
                    style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                  >
                    <Key size={14} /> Credit
                  </button>
                  <button
                    type="button"
                    className={`cyber-button ${paymentMethod === 'Mixed' ? 'btn-lime' : ''}`}
                    onClick={() => setPaymentMethod('Mixed')}
                    style={{ justifyContent: 'center', padding: '0.5rem 0.2rem', fontSize: '0.8rem' }}
                  >
                    <DollarSign size={14} />+<Smartphone size={14} /> Split
                  </button>
                </div>
              </div>

            {paymentMethod === 'M-Pesa' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="cyber-label">STK Push Phone</label>
                  <input 
                    type="text" 
                    className="cyber-input cyber-input-mono"
                    placeholder="e.g. 0712345678"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="cyber-button btn-cyan"
                  style={{ alignSelf: 'flex-end', height: '42px', padding: '0.5rem 1rem' }}
                  onClick={handleStkPush}
                  disabled={isPushingMpesa}
                >
                  STK Push
                </button>
              </div>
            )}

              {paymentMethod === 'Mixed' && (
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

            {paymentMethod === 'Cash' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label className="cyber-label">Cash Tendered (Cash Given)</label>
                  <input 
                    type="number" 
                    className="cyber-input cyber-input-mono"
                    placeholder="e.g. 500"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                  />
                </div>
                {Number(amountTendered || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-darker)', padding: '0.5rem', border: '1px solid var(--border-muted)', borderRadius: '2px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Change Due:</span>
                    <strong style={{ color: Number(amountTendered) >= getTotal() ? 'var(--success-lime)' : 'var(--alert-orange)', fontFamily: 'var(--font-mono)' }}>
                      KES {Number(amountTendered) >= getTotal() ? (Number(amountTendered) - getTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Insufficient Cash'}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'Credit' && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,107,0,0.05)', border: '1px solid var(--border-muted)', borderRadius: '2px', fontSize: '0.75rem', color: 'var(--alert-orange)' }}>
                <strong>Store Debt Account Charge:</strong> Outstanding balance of KES {getTotal().toLocaleString()} will be charged to the selected customer's ledger statement.
              </div>
            )}

            {paymentMethod !== 'Cash' && paymentMethod !== 'Credit' && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="cyber-label">{paymentMethod} Reference / Transaction ID</label>
                <input 
                  type="text" 
                  className="cyber-input cyber-input-mono"
                  placeholder={paymentMethod === 'M-Pesa' ? "e.g. SGR9828HJD (or blank to auto-simulate)" : "e.g. Card Auth Code"}
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* SMS/WhatsApp Receipt Checkbox */}
          {selectedCustomer && selectedCustomer.phone !== '0000000000' && (
            <div style={{ marginBottom: '1rem', background: 'var(--bg-darker)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="sendReceiptSms"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--success-lime)' }}
                />
                <label htmlFor="sendReceiptSms" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '500' }}>
                  Send WhatsApp Receipt to {selectedCustomer.phone}
                </label>
              </div>
              {sendNotification && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'var(--bg-dark)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--success-lime)', fontStyle: 'italic' }}>
                  <strong>Preview:</strong> "Thank you for shopping with us, {selectedCustomer.name}! Your receipt for KES {getTotal().toFixed(2)} has been confirmed."
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="cyber-button"
              style={{ flex: 1, justifyContent: 'center', height: '3.5rem', fontWeight: 600, border: '1px solid var(--border-muted)', background: 'var(--bg-darker)' }}
              onClick={() => handleCheckout('quotation')}
              disabled={isProcessing || cart.length === 0}
            >
              Save as Quote
            </button>
            <button 
              className="cyber-button btn-lime"
              style={{ flex: 2, justifyContent: 'center', height: '3.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}
              onClick={() => handleCheckout('completed')}
              disabled={isProcessing || cart.length === 0 || !activeShift}
            >
              {isProcessing ? 'Processing...' : `Pay KES ${getTotal().toLocaleString()}`}
            </button>
          </div>
        </div>

      </div>

      {/* Serial Picker Dialog */}
      {serialPickerItem && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '550px' }}>
            <h3 className="cyber-title" style={{ marginBottom: '0.5rem' }}>Serial Numbers Picker</h3>
            <p className="cyber-subtitle" style={{ marginBottom: '1.5rem' }}>
              Product: {serialPickerItem.product.name}
            </p>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-muted)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
              {serialPickerItem.product.get_serials_list ? 
                serialPickerItem.product.get_serials_list().map(serial => (
                  <label 
                    key={serial} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderBottom: '1px solid var(--border-muted)', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSerials.includes(serial)}
                      onChange={() => toggleSerialSelection(serial)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{serial}</span>
                  </label>
                )) : 
                serialPickerItem.product.serial_numbers.split(',').map(s => s.trim()).filter(Boolean).map(serial => (
                  <label 
                    key={serial} 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderBottom: '1px solid var(--border-muted)', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSerials.includes(serial)}
                      onChange={() => toggleSerialSelection(serial)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>{serial}</span>
                  </label>
                ))
              }
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '1.5rem', padding: '0.5rem', background: 'var(--bg-darker)', borderRadius: '2px' }}>
              <span>Required Count: <strong>Dynamic</strong></span>
              <span>Selected Count: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedSerials.length} selected</strong></span>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="cyber-button btn-orange"
                onClick={() => setSerialPickerItem(null)}
              >Cancel</button>
              <button 
                className="cyber-button btn-lime"
                onClick={handleSaveSerials}
              >Apply Serials</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {activeReceipt && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '400px', background: '#FFFFFF', color: '#111111', border: '1px solid #111111', boxShadow: 'none', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
            {/* Header info */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #111111', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Lights Electricals & Electronics</h2>
              <div style={{ fontSize: '0.8rem' }}>Mombasa Road, Nairobi</div>
              <div style={{ fontSize: '0.8rem' }}>Tel: +254 700 000 000</div>
              <div style={{ fontSize: '0.8rem' }}>VAT PIN: P0123456789</div>
            </div>

            {/* Receipt metadata */}
            <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '0.25rem', marginBottom: '1rem' }}>
              <div>Receipt No: #{activeReceipt.id}</div>
              <div style={{ textAlign: 'right' }}>Date: {new Date(activeReceipt.timestamp).toLocaleDateString()}</div>
              <div>Cashier: {activeReceipt.cashier_name}</div>
              <div style={{ textAlign: 'right' }}>Time: {new Date(activeReceipt.timestamp).toLocaleTimeString()}</div>
              <div>Customer: {activeReceipt.customer_name || 'Walk-in'}</div>
              <div style={{ textAlign: 'right' }}>Method: {activeReceipt.payment_method}</div>
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
                {activeReceipt.items.map((item, idx) => (
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
                <span>KES {Number(activeReceipt.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Discount (Excl. VAT):</span>
                <span>KES {Number(activeReceipt.discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>VAT ({taxRate}%):</span>
                <span>KES {Number(activeReceipt.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800', borderTop: '1px solid #111111', paddingTop: '0.25rem' }}>
                <span>Total (Incl. VAT):</span>
                <span>KES {Number(activeReceipt.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {activeReceipt.payment_method === 'Cash' && Number(activeReceipt.amount_tendered) > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #111111', paddingTop: '0.25rem', fontSize: '0.8rem', color: '#555555' }}>
                    <span>Cash Tendered:</span>
                    <span>KES {Number(activeReceipt.amount_tendered).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#555555' }}>
                    <span>Change Due:</span>
                    <span>KES {Number(activeReceipt.change_due).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* eTIMS Verification block */}
            {activeReceipt.etims_invoice_number && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderTop: '1px dashed #111111', paddingTop: '0.75rem', marginBottom: '1rem', fontSize: '0.7rem', color: '#333333', textAlign: 'center' }}>
                <div><strong>KRA eTIMS COMPLIANCE RECORD</strong></div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>INV: {activeReceipt.etims_invoice_number}</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>SIG: {activeReceipt.etims_signature}</div>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(activeReceipt.etims_qr_code_data)}`} 
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
            </div>
            
            </div> {/* End scrollable area */}
            
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #DDDDDD' }}>
              <button 
                type="button"
                className="cyber-button btn-orange" 
                style={{ background: '#111111', color: '#FFFFFF', borderColor: '#111111', width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                onClick={() => setActiveReceipt(null)}
              >
                Close Receipt [Esc]
              </button>
            </div>

          </div>
        </div>
      )}

      {/* M-Pesa STK Push Overlay */}
      {isPushingMpesa && (
        <div className="cyber-modal-overlay" style={{ zIndex: 200 }}>
          <div className="cyber-card glow-box" style={{ width: '320px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <h3 style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>SENDING STK PUSH</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Sending M-Pesa payment request to customer's handset. Waiting for authorization...
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

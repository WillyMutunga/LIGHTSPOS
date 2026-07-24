import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, ListCollapse, CheckCircle, Truck, ShoppingBag, X } from 'lucide-react';

export default function PurchasesModule({ onAddLog }) {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Create PO state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poItems, setPoItems] = useState([]); // [{ product: id, quantity: qty, unit_cost: cost }]
  
  // Receive PO state
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [activePo, setActivePo] = useState(null);
  const [receivedSerials, setReceivedSerials] = useState({}); // { product_id: 'comma, separated, serials' }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const poRes = await api.getPurchases();
      setPurchaseOrders(poRes);
      const supRes = await api.getSuppliers();
      setSuppliers(supRes);
      const prodRes = await api.getProducts();
      setProducts(prodRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPoItem = () => {
    if (products.length === 0) return;
    setPoItems([...poItems, { product: products[0].id, quantity: 1, unit_cost: Number(products[0].cost_price) }]);
  };

  const handleRemovePoItem = (index) => {
    const newItems = [...poItems];
    newItems.splice(index, 1);
    setPoItems(newItems);
  };

  const updatePoItem = (index, field, value) => {
    const newItems = [...poItems];
    newItems[index][field] = value;
    
    // Auto-update default cost if product changes
    if (field === 'product') {
      const prod = products.find(p => p.id === Number(value));
      if (prod) {
        newItems[index].unit_cost = Number(prod.cost_price);
      }
    }
    
    setPoItems(newItems);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert("Please select a supplier");
      return;
    }
    if (poItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    const payload = {
      supplier: Number(selectedSupplier),
      items: poItems.map(item => ({
        product: Number(item.product),
        quantity: Number(item.quantity),
        unit_cost: Number(item.unit_cost).toFixed(2)
      }))
    };

    try {
      await api.placePurchaseOrder(payload);
      onAddLog('PO_CREATE', `Placed new Purchase Order with Supplier ID: ${selectedSupplier}`);
      setIsCreateOpen(false);
      setSelectedSupplier('');
      setPoItems([]);
      loadData();
    } catch (err) {
      alert(`Order placement failed: ${err.message}`);
    }
  };

  const openReceiveModal = (po) => {
    setActivePo(po);
    
    // Initialize serial number inputs for serial-tracked items
    const serialInit = {};
    po.items.forEach(item => {
      // Find product details
      const prod = products.find(p => p.id === item.product);
      if (prod && prod.serial_tracked) {
        serialInit[prod.id] = '';
      }
    });

    setReceivedSerials(serialInit);
    setIsReceiveOpen(true);
  };

  const handleReceiveOrder = async () => {
    // Validate serials if product is tracked
    for (const item of activePo.items) {
      const prod = products.find(p => p.id === item.product);
      if (prod && prod.serial_tracked) {
        const serials = receivedSerials[prod.id] || '';
        const list = serials.split(',').map(s => s.trim()).filter(Boolean);
        if (list.length !== item.quantity) {
          alert(`Product "${prod.name}" requires exactly ${item.quantity} serial numbers (provided: ${list.length}).`);
          return;
        }
      }
    }

    try {
      await api.receivePurchaseOrder(activePo.id, receivedSerials);
      onAddLog('PO_RECEIVE', `Received stocks for PO #${activePo.id}`);
      setIsReceiveOpen(false);
      setActivePo(null);
      loadData();
    } catch (err) {
      alert(`Receiving stock failed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Module Actions Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Purchases & Procurement</h2>
          <p className="cyber-subtitle">Manage supplier purchase orders and stock receiving workflows.</p>
        </div>
        
        <button className="cyber-button btn-lime" onClick={() => {
          setSelectedSupplier(suppliers[0]?.id || '');
          setPoItems([]);
          setIsCreateOpen(true);
        }}>
          <Plus size={16} /> Raise Purchase Order (PO)
        </button>
      </div>

      {/* PO Table */}
      <div className="cyber-table-container" style={{ background: 'var(--bg-dark)' }}>
        <table className="cyber-table cyber-table-mono">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Supplier</th>
              <th>Date Ordered</th>
              <th>Date Received</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No Purchase Orders cataloged.
                </td>
              </tr>
            ) : (
              purchaseOrders.map(po => (
                <tr key={po.id}>
                  <td>#{po.id}</td>
                  <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{po.supplier_name}</td>
                  <td>{new Date(po.date_ordered).toLocaleDateString()}</td>
                  <td>{po.date_received ? new Date(po.date_received).toLocaleDateString() : '—'}</td>
                  <td style={{ textAlign: 'right' }}>KES {Number(po.total_amount).toLocaleString()}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`cyber-badge ${po.status === 'Received' ? 'badge-lime' : 'badge-orange'}`}>
                      {po.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {po.status === 'Pending' ? (
                      <button 
                        className="cyber-button btn-lime"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => openReceiveModal(po)}
                      >
                        <Truck size={12} /> Receive Stock
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Closed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create PO Dialog */}
      {isCreateOpen && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '650px' }}>
            <h3 className="cyber-title" style={{ marginBottom: '1.5rem' }}>Raise Purchase Order</h3>
            
            <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="cyber-label">Select Supplier</label>
                <select 
                  className="cyber-input"
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.contact_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="cyber-label" style={{ margin: 0 }}>PO Line Items</label>
                  <button 
                    type="button" 
                    className="cyber-button"
                    style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={handleAddPoItem}
                  >
                    + Add Row
                  </button>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-muted)', borderRadius: '4px', padding: '0.5rem' }}>
                  {poItems.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem' }}>No items added yet.</p>
                  ) : (
                    poItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <select 
                          className="cyber-input"
                          style={{ flex: 2 }}
                          value={item.product}
                          onChange={(e) => updatePoItem(idx, 'product', e.target.value)}
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>

                        <input 
                          type="number" 
                          className="cyber-input cyber-input-mono"
                          style={{ width: '80px', textAlign: 'center' }}
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updatePoItem(idx, 'quantity', e.target.value)}
                        />

                        <input 
                          type="number" 
                          className="cyber-input cyber-input-mono"
                          style={{ width: '120px', textAlign: 'right' }}
                          min="0.01" step="0.01"
                          placeholder="Cost"
                          value={item.unit_cost}
                          onChange={(e) => updatePoItem(idx, 'unit_cost', e.target.value)}
                        />

                        <button 
                          type="button"
                          onClick={() => handleRemovePoItem(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--alert-orange)', cursor: 'pointer', padding: '0.2rem' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="cyber-button btn-orange"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="cyber-button btn-lime"
                >
                  Submit PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive PO Modal */}
      {isReceiveOpen && activePo && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '600px' }}>
            <h3 className="cyber-title" style={{ marginBottom: '0.5rem' }}>Receive Inventory</h3>
            <p className="cyber-subtitle" style={{ marginBottom: '1.5rem' }}>PO #{activePo.id} from supplier {activePo.supplier_name}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="cyber-table-container">
                <table className="cyber-table cyber-table-mono" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center' }}>Ordered Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePo.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-sans)' }}>{item.product_name}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Serial numbers input for tracked products */}
              {activePo.items.some(item => products.find(p => p.id === item.product)?.serial_tracked) && (
                <div>
                  <h4 className="cyber-label" style={{ marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>Serial Numbers Assignment</h4>
                  
                  {activePo.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.product);
                    if (!prod || !prod.serial_tracked) return null;
                    
                    return (
                      <div key={idx} style={{ marginBottom: '0.75rem' }}>
                        <label className="cyber-label" style={{ fontSize: '0.75rem' }}>
                          {prod.name} (Requires {item.quantity} serials)
                        </label>
                        <textarea 
                          className="cyber-input cyber-input-mono"
                          style={{ minHeight: '60px', fontSize: '0.8rem' }}
                          placeholder="e.g. SN-01, SN-02, SN-03"
                          value={receivedSerials[prod.id] || ''}
                          onChange={(e) => setReceivedSerials({ ...receivedSerials, [prod.id]: e.target.value })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="cyber-button btn-orange"
                  onClick={() => {
                    setIsReceiveOpen(false);
                    setActivePo(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="cyber-button btn-lime"
                  onClick={handleReceiveOrder}
                >
                  Receive Stock & Close PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

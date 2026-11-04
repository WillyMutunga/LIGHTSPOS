import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit3, ShieldAlert, Archive, Tags, Layers, Save, Check, X, Printer, Trash2, Download, Filter } from 'lucide-react';
import Barcode from 'react-barcode';

export default function InventoryModule({ onAddLog }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out'
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means "Create mode"
  
  // Form fields
  const [formBarcode, setFormBarcode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formRetail, setFormRetail] = useState('');
  const [formStock, setFormStock] = useState(0);
  const [formSerialTracked, setFormSerialTracked] = useState(false);
  const [formSerials, setFormSerials] = useState('');

  const [barcodeToPrint, setBarcodeToPrint] = useState(null);

  useEffect(() => {
    if (barcodeToPrint) {
      setTimeout(() => {
        window.print();
        setBarcodeToPrint(null);
      }, 100);
    }
  }, [barcodeToPrint]);

  // Auto-reorder planning states
  const [suppliers, setSuppliers] = useState([]);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderItems, setReorderItems] = useState([]);

  const openReorderModal = async () => {
    try {
      const supRes = await api.getSuppliers();
      setSuppliers(supRes);
      
      // Get all low-stock products (quantity < 10)
      const lowStockProducts = products.filter(p => p.stock_quantity < 10);
      
      const defaultSupplierId = supRes[0]?.id || '';
      const items = lowStockProducts.map(p => ({
        product: p,
        quantity: 20,
        supplierId: defaultSupplierId,
        unit_cost: Number(p.cost_price)
      }));
      setReorderItems(items);
      setIsReorderModalOpen(true);
    } catch (err) {
      alert(`Failed to prepare reorder: ${err.message}`);
    }
  };

  const handleGenerateReorders = async () => {
    if (reorderItems.length === 0) return;
    
    // Group by supplier
    const grouped = {};
    reorderItems.forEach(item => {
      if (!item.supplierId) return;
      if (!grouped[item.supplierId]) {
        grouped[item.supplierId] = [];
      }
      grouped[item.supplierId].push({
        product: item.product.id,
        quantity: Number(item.quantity),
        unit_cost: Number(item.unit_cost)
      });
    });
    
    try {
      for (const [supId, itemsList] of Object.entries(grouped)) {
        await api.placePurchaseOrder({
          supplier: Number(supId),
          items: itemsList
        });
      }
      
      alert("Successfully generated Purchase Order drafts for low-stock items.");
      setIsReorderModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Failed to place purchase orders: ${err.message}`);
    }
  };

  const updateReorderItem = (index, field, value) => {
    const updated = [...reorderItems];
    updated[index][field] = value;
    setReorderItems(updated);
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  const loadData = async () => {
    try {
      const prodRes = await api.getProducts(search, selectedCategory);
      setProducts(prodRes);
      const catRes = await api.getCategories();
      setCategories(catRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        await api.deleteProduct(product.id);
        onAddLog('PRODUCT_DELETE', `Deleted product ${product.name}`);
        loadData();
      } catch (err) {
        alert("Failed to delete product.");
      }
    }
  };

  const openDrawer = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormBarcode(product.barcode);
      setFormName(product.name);
      setFormDesc(product.description || '');
      setFormCat(product.category);
      setFormCost(product.cost_price);
      setFormRetail(product.retail_price);
      setFormStock(product.stock_quantity);
      setFormSerialTracked(product.serial_tracked);
      setFormSerials(product.serial_numbers || '');
    } else {
      setEditingProduct(null);
      setFormBarcode(Math.floor(10000000 + Math.random() * 90000000).toString());
      setFormName('');
      setFormDesc('');
      setFormCat(categories[0]?.id || '');
      setFormCost('');
      setFormRetail('');
      setFormStock(0);
      setFormSerialTracked(false);
      setFormSerials('');
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate serials count if tracked
    let stockVal = Number(formStock);
    let serialList = formSerials.split(',').map(s => s.strip ? s.strip() : s.trim()).filter(Boolean);
    if (formSerialTracked && serialList.length !== stockVal) {
      alert(`The number of serial numbers (${serialList.length}) must match the stock quantity (${stockVal}).`);
      return;
    }

    const payload = {
      barcode: formBarcode,
      name: formName,
      description: formDesc,
      category: Number(formCat),
      cost_price: Number(formCost).toFixed(2),
      retail_price: Number(formRetail).toFixed(2),
      stock_quantity: stockVal,
      serial_tracked: formSerialTracked,
      serial_numbers: formSerials
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        onAddLog('PRODUCT_EDIT', `Updated product ${formName} (Barcode: ${formBarcode})`);
      } else {
        await api.createProduct(payload);
        onAddLog('PRODUCT_CREATE', `Created product ${formName} (Barcode: ${formBarcode})`);
      }
      setIsDrawerOpen(false);
      loadData();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  // Filter products by stock status (all, low stock < 10, out of stock = 0)
  const filteredProducts = products.filter(p => {
    if (stockFilter === 'low') {
      return p.stock_quantity > 0 && p.stock_quantity < 10;
    }
    if (stockFilter === 'out') {
      return p.stock_quantity === 0;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      alert('No products to export.');
      return;
    }

    let csvContent = 'Barcode / SKU,Product Name,Category,Cost Price (KES),Retail Price (KES),Stock Qty,Stock Status,Valuation (KES)\n';
    
    filteredProducts.forEach(p => {
      const status = p.stock_quantity === 0 ? 'Out of Stock' : (p.stock_quantity < 10 ? 'Low Stock' : 'In Stock');
      const valuation = (Number(p.cost_price || 0) * p.stock_quantity).toFixed(2);
      const name = '"' + (p.name || '').replace(/"/g, '""') + '"';
      const cat = '"' + (p.category_name || '').replace(/"/g, '""') + '"';
      const barcode = '"' + (p.barcode || '').replace(/"/g, '""') + '"';
      
      csvContent += `${barcode},${name},${cat},${p.cost_price || 0},${p.retail_price || 0},${p.stock_quantity},${status},${valuation}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filterSuffix = stockFilter !== 'all' ? `_${stockFilter}_stock` : '';
    link.setAttribute('download', `inventory_stock_quantities${filterSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculations
  const totalStockVal = products.reduce((sum, p) => sum + (Number(p.cost_price) * p.stock_quantity), 0);
  const totalRetailVal = products.reduce((sum, p) => sum + (Number(p.retail_price) * p.stock_quantity), 0);
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100%' }}>
      
      {/* Dashboard Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div 
          className="cyber-card glow-hover" 
          style={{ 
            cursor: 'pointer',
            border: stockFilter === 'all' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-muted)',
            background: stockFilter === 'all' ? 'rgba(0, 240, 255, 0.06)' : undefined 
          }}
          onClick={() => setStockFilter('all')}
          title="Click to view all items"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label" style={{ cursor: 'pointer' }}>Total Unique SKUs</label>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{products.length}</div>
            </div>
            <Archive size={28} style={{ color: stockFilter === 'all' ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label">Total Valuation (Cost)</label>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                KES {totalStockVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <Layers size={28} style={{ color: 'var(--accent-cyan)' }} />
          </div>
        </div>
        
        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label">Est. Revenue (Retail)</label>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-green, #4ade80)' }}>
                KES {totalRetailVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <Tags size={28} style={{ color: 'var(--accent-green, #4ade80)' }} />
          </div>
        </div>

        <div 
          className="cyber-card glow-hover" 
          style={{ 
            cursor: 'pointer', 
            border: stockFilter === 'low' ? '2px solid var(--alert-orange)' : '1px solid var(--alert-orange-glow)',
            background: stockFilter === 'low' ? 'rgba(255, 170, 0, 0.08)' : undefined
          }}
          onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
          title="Click to filter low stock items"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label" style={{ color: 'var(--alert-orange)', cursor: 'pointer' }}>Low Stock (&lt; 10)</label>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--alert-orange)' }}>{lowStockCount}</div>
            </div>
            <ShieldAlert size={28} style={{ color: 'var(--alert-orange)' }} />
          </div>
          {lowStockCount > 0 && (
            <div style={{ marginTop: '0.4rem', textAlign: 'right' }}>
              <button 
                type="button"
                className="cyber-button btn-orange"
                style={{ padding: '0.15rem 0.5rem', fontSize: '0.65rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  openReorderModal();
                }}
                title="Create Purchase Orders for low stock items"
              >
                Auto-Reorder
              </button>
            </div>
          )}
        </div>

        <div 
          className="cyber-card glow-hover" 
          style={{ 
            cursor: 'pointer',
            border: stockFilter === 'out' ? '2px solid #FF3333' : '1px solid var(--border-muted)',
            background: stockFilter === 'out' ? 'rgba(255, 51, 51, 0.08)' : undefined
          }}
          onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
          title="Click to filter depleted out-of-stock items"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label" style={{ color: '#FF3333', cursor: 'pointer' }}>Out of Stock (Depleted)</label>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: '#FF3333' }}>{outOfStockCount}</div>
            </div>
            <ShieldAlert size={28} style={{ color: '#FF3333' }} />
          </div>
        </div>
      </div>

      {/* Filter and Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <input 
            type="text"
            className="cyber-input"
            style={{ maxWidth: '260px' }}
            placeholder="Search catalog by name/code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <select 
            className="cyber-input"
            style={{ maxWidth: '180px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="MISSING_COST">⚠️ Missing Cost Price</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Quick Filter Buttons */}
          <div style={{ display: 'inline-flex', gap: '0.4rem', background: 'var(--bg-darker)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border-muted)' }}>
            <button
              type="button"
              className={`cyber-button ${stockFilter === 'all' ? 'btn-lime' : ''}`}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => setStockFilter('all')}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              className={`cyber-button ${stockFilter === 'low' ? 'btn-orange' : ''}`}
              style={{ 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.75rem',
                borderColor: stockFilter === 'low' ? undefined : 'var(--alert-orange)',
                color: stockFilter === 'low' ? undefined : 'var(--alert-orange)'
              }}
              onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
            >
              ⚠️ Low Stock ({lowStockCount})
            </button>
            <button
              type="button"
              className={`cyber-button ${stockFilter === 'out' ? 'btn-red' : ''}`}
              style={{ 
                padding: '0.35rem 0.75rem', 
                fontSize: '0.75rem',
                borderColor: stockFilter === 'out' ? undefined : '#FF3333',
                color: stockFilter === 'out' ? undefined : '#FF3333'
              }}
              onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
            >
              🚫 Depleted ({outOfStockCount})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            type="button"
            className="cyber-button" 
            style={{ borderColor: 'var(--accent-cyan)' }}
            onClick={handleExportCSV}
            title="Download visible stock list as CSV / Excel"
          >
            <Download size={14} /> Download Stock CSV
          </button>

          <button 
            type="button"
            className="cyber-button btn-lime" 
            onClick={() => openDrawer()}
          >
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="cyber-table-container" style={{ background: 'var(--bg-dark)' }}>
        <table className="cyber-table cyber-table-mono">
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Product Name</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Cost Price</th>
              <th style={{ textAlign: 'right' }}>Retail Price</th>
              <th style={{ textAlign: 'center' }}>Stock Qty</th>
              <th style={{ textAlign: 'center' }}>Serial Tracking</th>
              <th style={{ width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  {products.length === 0 ? 'No products found.' : `No products matching ${stockFilter === 'low' ? 'Low Stock' : stockFilter === 'out' ? 'Out of Stock' : 'the filter'}.`}
                </td>
              </tr>
            ) : (
              filteredProducts.map(prod => {
                const isOutOfStock = prod.stock_quantity === 0;
                const isLowStock = prod.stock_quantity > 0 && prod.stock_quantity < 10;
                
                return (
                  <tr key={prod.id}>
                    <td>{prod.barcode}</td>
                    <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{prod.name}</td>
                    <td style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-muted)' }}>{prod.category_name}</td>
                    <td style={{ textAlign: 'right' }}>KES {Number(prod.cost_price).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>KES {Number(prod.retail_price).toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`cyber-badge ${isOutOfStock ? 'badge-orange' : isLowStock ? 'badge-orange' : 'badge-lime'}`}>
                        {prod.stock_quantity}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {prod.serial_tracked ? (
                        <span className="cyber-badge badge-cyan" style={{ fontSize: '0.7rem' }}>TRACKED</span>
                      ) : (
                        <span style={{ color: 'var(--text-dark)', fontSize: '0.75rem' }}>OFF</span>
                      )}
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="cyber-button"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => openDrawer(prod)}
                        title="Edit Product"
                      >
                        <Edit3 size={12} />
                      </button>
                      {prod.barcode && (
                        <button 
                          className="cyber-button btn-cyan"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                          onClick={() => setBarcodeToPrint(prod)}
                          title="Print Barcode"
                        >
                          <Printer size={12} />
                        </button>
                      )}
                      <button 
                        className="cyber-button btn-red"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => handleDelete(prod)}
                        title="Delete Product"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details / Edit Drawer */}
      <div className={`cyber-drawer-right ${isDrawerOpen ? '' : 'collapsed'}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-muted)', paddingBottom: '1rem' }}>
          <h3 className="cyber-title">
            {editingProduct ? 'Modify SKU' : 'New Product Registry'}
          </h3>
          <button 
            onClick={() => setIsDrawerOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="cyber-label">Barcode / SKU Identifier</label>
            <input 
              type="text" 
              className="cyber-input cyber-input-mono" 
              required
              value={formBarcode}
              onChange={(e) => setFormBarcode(e.target.value)}
              disabled={editingProduct}
            />
          </div>

          <div>
            <label className="cyber-label">Product Name</label>
            <input 
              type="text" 
              className="cyber-input" 
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div>
            <label className="cyber-label">Description</label>
            <textarea 
              className="cyber-input" 
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="cyber-label">Category</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                    onClick={async () => {
                      if (!formCat) return alert("Select a category to edit first");
                      const currentCat = categories.find(c => c.id == formCat);
                      const name = window.prompt("Rename category:", currentCat.name);
                      if (name && name !== currentCat.name) {
                        try {
                          await api.updateCategory(formCat, name);
                          const updatedCats = await api.getCategories();
                          setCategories(updatedCats);
                        } catch(e) {
                          alert("Failed to update category");
                        }
                      }
                    }}
                  >Edit</button>
                  <button 
                    type="button" 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                    onClick={async () => {
                      const name = window.prompt("Enter new category name:");
                      if (name) {
                        try {
                          const newCat = await api.createCategory(name);
                          const updatedCats = await api.getCategories();
                          setCategories(updatedCats);
                          setFormCat(newCat.id);
                        } catch(e) {
                          alert("Failed to create category");
                        }
                      }
                    }}
                  >+ New</button>
                </div>
              </div>
              <select 
                className="cyber-input"
                required
                value={formCat}
                onChange={(e) => setFormCat(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="cyber-label">Stock Quantity</label>
              <input 
                type="number" 
                className="cyber-input cyber-input-mono"
                required
                min="0"
                value={formStock}
                onChange={(e) => setFormStock(Number(e.target.value))}
                disabled={formSerialTracked && editingProduct} // In serial-tracked editing, stock must be modified by serial adding
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="cyber-label">Cost Price (KES)</label>
              <input 
                type="number" 
                step="0.01"
                className="cyber-input cyber-input-mono" 
                required
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
              />
            </div>

            <div>
              <label className="cyber-label">Retail Price (KES)</label>
              <input 
                type="number" 
                step="0.01"
                className="cyber-input cyber-input-mono" 
                required
                value={formRetail}
                onChange={(e) => setFormRetail(e.target.value)}
              />
            </div>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-darker)', borderRadius: '2px', border: '1px solid var(--border-muted)', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                style={{ transform: 'scale(1.2)' }}
                checked={formSerialTracked}
                onChange={(e) => {
                  setFormSerialTracked(e.target.checked);
                  if (e.target.checked && !editingProduct) setFormStock(0); // If serial tracking active, qty will drive from count of serials
                }}
              />
              <span className="cyber-label" style={{ margin: 0 }}>Enable Unique Serial Number Tracking</span>
            </label>
          </div>

          {formSerialTracked && (
            <div style={{ marginTop: '0.5rem' }}>
              <label className="cyber-label">Active Stock Serial Numbers (Comma Separated)</label>
              <textarea 
                className="cyber-input cyber-input-mono" 
                style={{ minHeight: '100px', fontSize: '0.85rem' }}
                placeholder="e.g. SN-9812A, SN-9812B, SN-9812C"
                value={formSerials}
                onChange={(e) => {
                  setFormSerials(e.target.value);
                  const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setFormStock(items.length);
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Note: Total stock count will automatically lock to <strong>{formStock}</strong> to match serials.
              </p>
            </div>
          )}

          <button 
            type="submit" 
            className="cyber-button btn-lime" 
            style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
          >
            <Save size={16} /> Save Product SKU
          </button>
        </form>
      </div>

      {/* Auto-Reorder PO planner Modal */}
      {isReorderModalOpen && (
        <div className="cyber-modal-overlay">
          <div className="cyber-modal" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 className="cyber-title" style={{ fontSize: '1.25rem' }}>Auto-Reorder Procurement Planner</h3>
              <p className="cyber-subtitle">Review low stock items and group-schedule purchase orders to suppliers.</p>
            </div>

            <div className="cyber-table-container" style={{ background: 'var(--bg-darker)', maxHeight: '350px', overflowY: 'auto' }}>
              <table className="cyber-table cyber-table-mono" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th style={{ textAlign: 'center' }}>In Stock</th>
                    <th style={{ textAlign: 'center' }}>Reorder Qty</th>
                    <th>Supplier Partner</th>
                    <th style={{ textAlign: 'right' }}>Est. Cost (ea)</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No low stock alerts detected. All catalog items have sufficient stock level.
                      </td>
                    </tr>
                  ) : (
                    reorderItems.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{item.product.name}</td>
                        <td style={{ textAlign: 'center', color: 'var(--alert-orange)' }}>{item.product.stock_quantity}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number" 
                            className="cyber-input cyber-input-mono"
                            style={{ width: '70px', padding: '0.1rem 0.3rem', textAlign: 'center' }}
                            value={item.quantity}
                            onChange={(e) => updateReorderItem(idx, 'quantity', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <select 
                            className="cyber-input"
                            style={{ padding: '0.1rem 0.5rem', height: 'auto' }}
                            value={item.supplierId}
                            onChange={(e) => updateReorderItem(idx, 'supplierId', Number(e.target.value))}
                          >
                            <option value="">-- Assign Supplier --</option>
                            {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>KES {Number(item.unit_cost).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-muted)', paddingTop: '1rem' }}>
              <button 
                className="cyber-button btn-orange"
                onClick={() => setIsReorderModalOpen(false)}
              >
                Cancel Planning
              </button>
              <button 
                className="cyber-button btn-lime"
                onClick={handleGenerateReorders}
                disabled={reorderItems.length === 0}
              >
                Generate PO Drafts
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden Print Section for Barcodes */}
      {barcodeToPrint && (
        <div className="print-only">
          <div style={{ textAlign: 'center' }}>
            <h4>{barcodeToPrint.name}</h4>
            <Barcode value={barcodeToPrint.barcode} width={2} height={50} fontSize={14} />
            <p>KES {Number(barcodeToPrint.retail_price).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

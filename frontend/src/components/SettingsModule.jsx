import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Save, RefreshCw, Trash2, HelpCircle } from 'lucide-react';

export default function SettingsModule({ onAddLog }) {
  const [activeShop, setActiveShop] = useState(null);
  
  const [storeName, setStoreName] = useState('Lights Electricals & Electronics');
  const [storeAddress, setStoreAddress] = useState('Mombasa Road, Nairobi');
  const [storePhone, setStorePhone] = useState('');
  const [storeVat, setStoreVat] = useState('');
  const [taxRate, setTaxRate] = useState(16);
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping with us!');
  
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const shops = await api.getShops();
        const currentShopId = localStorage.getItem('activeShopId');
        const shop = shops.find(s => s.id === Number(currentShopId)) || shops[0];
        if (shop) {
          setActiveShop(shop);
          setStoreName(shop.name || '');
          setStoreAddress(shop.address || '');
          setStorePhone(shop.phone || '');
          setStoreVat(shop.vat_pin || '');
          setTaxRate(shop.tax_rate ? Number(shop.tax_rate) : 16);
          setReceiptFooter(shop.receipt_footer || 'Thank you for shopping with us!');
        }
      } catch (err) {
        console.error("Failed to load shop settings", err);
      }
    };
    fetchShop();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!activeShop) return;
    
    setIsSaving(true);
    try {
      await api.updateShop(activeShop.id, {
        name: storeName,
        address: storeAddress,
        phone: storePhone,
        vat_pin: storeVat,
        tax_rate: taxRate,
        receipt_footer: receiptFooter
      });
      onAddLog('SETTINGS_UPDATE', `Updated configuration for shop: ${storeName}`);
      alert("Store configuration successfully saved to the database!");
      window.location.reload(); // Reload to apply across UI
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReSeed = async () => {
    if (!window.confirm("Are you sure you want to factory reset the database? This will clear all sales transactions, shifts, suppliers, and custom stock changes!")) return;
    
    const adminPin = window.prompt("WARNING: This action is permanent!\nPlease enter an ADMIN PIN to authorize the reset:");
    if (!adminPin) return;

    setIsResetting(true);
    try {
      await api.factoryReset(adminPin);
      onAddLog('SYSTEM_RESET', 'Factory reset triggered by admin.');
      alert("System has been successfully factory reset! All transactional data is wiped.");
    } catch (err) {
      alert(`Factory Reset Failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      
      {/* Header */}
      <div>
        <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Shop Settings</h2>
        <p className="cyber-subtitle">Configure tax rates, printer custom receipts, and contact details for the active shop.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        
        {/* Store Config Form */}
        <div className="cyber-card">
          <h3 className="cyber-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Receipt & Shop Profile</h3>
          
          {activeShop ? (
            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="cyber-label">Shop Brand Name</label>
                <input 
                  type="text" 
                  className="cyber-input"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div>
                <label className="cyber-label">Physical Address</label>
                <input 
                  type="text" 
                  className="cyber-input"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="cyber-label">Telephone Number</label>
                  <input 
                    type="text" 
                    className="cyber-input cyber-input-mono"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="cyber-label">VAT / KRA PIN</label>
                  <input 
                    type="text" 
                    className="cyber-input cyber-input-mono"
                    value={storeVat}
                    onChange={(e) => setStoreVat(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="cyber-label">Tax Rate / VAT %</label>
                  <input 
                    type="number" 
                    className="cyber-input cyber-input-mono"
                    required
                    min="0" max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="cyber-label">System Currency</label>
                  <input 
                    type="text" 
                    className="cyber-input cyber-input-mono"
                    disabled
                    value="KES (Kenya Shilling)"
                  />
                </div>
              </div>

              <div>
                <label className="cyber-label">Receipt Footer Custom Message</label>
                <textarea 
                  className="cyber-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                />
              </div>

              <button type="submit" disabled={isSaving} className="cyber-button btn-lime" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
                <Save size={14} /> {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          ) : (
            <p>Loading shop profile...</p>
          )}
        </div>

        {/* Database Utilities */}
        <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 className="cyber-title" style={{ fontSize: '1.1rem', color: 'var(--alert-orange)' }}>ERP Maintenance Utilities</h3>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Warning: The operations below modify raw database tables directly. Run only under instruction.
          </p>

          <div style={{ borderTop: '1px solid var(--border-muted)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h4 className="cyber-label" style={{ color: 'var(--accent-cyan)' }}>Re-Seed Database</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Resets the database models back to original test SKUs, customers, and starting staff configuration profiles.
              </p>
              <button 
                type="button" 
                className="cyber-button btn-orange"
                disabled={isResetting}
                onClick={handleReSeed}
              >
                <RefreshCw size={14} /> {isResetting ? "Seeding..." : "Execute Database Re-Seed"}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

// Import components
import POSModule from './components/POSModule';
import InventoryModule from './components/InventoryModule';
import PurchasesModule from './components/PurchasesModule';
import SalesHistoryModule from './components/SalesHistoryModule';
import ReturnsModule from './components/ReturnsModule';
import CustomersModule from './components/CustomersModule';
import SuppliersModule from './components/SuppliersModule';
import AnalyticsModule from './components/AnalyticsModule';
import ReportsModule from './components/ReportsModule';
import UserManagementModule from './components/UserManagementModule';
import ShiftsModule from './components/ShiftsModule';
import SettingsModule from './components/SettingsModule';
import WarrantyModule from './components/WarrantyModule';
import MessagingModule from './components/MessagingModule';

// Icons
import {
  ShoppingCart, Archive, Truck, Clock, RefreshCw, Users,
  FolderOpen, BarChart2, FileText, UserCheck, Key, Settings,
  LogOut, Lock, CheckCircle, Wifi, Clock as ClockIcon, Shield, Menu, X, Download, MessageSquare
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [activeView, setActiveView] = useState('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Offline Sync Manager
  useEffect(() => {
    const sync = () => api.syncOfflineSales().catch(console.error);
    
    // Sync when coming back online
    window.addEventListener('online', sync);
    
    // Also periodically try to sync every 30 seconds just in case
    const syncInterval = setInterval(sync, 30000);
    
    return () => {
      window.removeEventListener('online', sync);
      clearInterval(syncInterval);
    };
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (isStandalone) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    if (ios) {
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User install response: ${outcome}`);
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  // Check active shift on load/login
  useEffect(() => {
    if (currentUser) {
      api.getShifts().then(shifts => {
        const open = shifts.find(s => s.is_open);
        if (open) setActiveShift(open);
      }).catch(err => console.error(err));
    }
  }, [currentUser]);

  const submitPin = async (pin) => {
    if (!pin.trim()) return;

    try {
      const response = await api.loginPin(pin);
      setCurrentUser(response.user);
      setIsLocked(false);
      setPinInput('');
      setErrorMessage('');
    } catch (err) {
      setErrorMessage(err.message || 'Invalid PIN code');
      setPinInput('');
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    await submitPin(pinInput);
  };

  const handlePinKeyPress = (val) => {
    if (val === 'clear') {
      setPinInput('');
    } else if (val === 'enter') {
      submitPin(pinInput);
    } else {
      if (pinInput.length < 8) {
        setPinInput(pinInput + val);
      }
    }
  };

  // Keyboard support for lock screen PIN input
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        setPinInput(prev => {
          if (prev.length < 8) return prev + e.key;
          return prev;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitPin(pinInput);
      } else if (e.key === 'Backspace') {
        setPinInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setPinInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, pinInput]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveShift(null);
    setIsLocked(true);
    setActiveView('pos');
  };

  const handleAddLog = (action, details) => {
    // Submit log entry to server
    api.getAuditLogs().catch(err => console.error(err)); // placeholder query
  };

  // Check if role has access to specific module view (RBAC check)
  const hasAccess = (view) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === 'admin') return true;
    
    // Managers can access everything except Settings
    if (role === 'manager') {
      return !['settings'].includes(view);
    }
    
    // Cashiers can only access POS terminal, Customer list, Shifts, and general session lock
    if (role === 'cashier') {
      return ['pos', 'customers', 'shifts', 'warranty', 'reports', 'messaging'].includes(view);
    }
    
    return false;
  };

  // Nav menu descriptors
  const menuItems = [
    { id: 'pos', name: 'POS Terminal', icon: <ShoppingCart size={18} /> },
    { id: 'inventory', name: 'Inventory Management', icon: <Archive size={18} /> },
    { id: 'purchases', name: 'Purchases / PO', icon: <Truck size={18} /> },
    { id: 'sales_history', name: 'Sales History', icon: <Clock size={18} /> },
    { id: 'returns', name: 'Returns & Refunds', icon: <RefreshCw size={18} /> },
    { id: 'customers', name: 'Customer Loyalty', icon: <Users size={18} /> },
    { id: 'warranty', name: 'Warranty Checker', icon: <Shield size={18} /> },
    // { id: 'messaging', name: 'Messaging', icon: <MessageSquare size={18} /> },
    { id: 'suppliers', name: 'Suppliers directory', icon: <FolderOpen size={18} /> },
    { id: 'analytics', name: 'Analytics Dashboard', icon: <BarChart2 size={18} /> },
    { id: 'reports', name: 'Reports Center', icon: <FileText size={18} /> },
    { id: 'users', name: 'User Management', icon: <UserCheck size={18} /> },
    { id: 'shifts', name: 'Cash Drawer & Shifts', icon: <Key size={18} /> },
    { id: 'settings', name: 'System Settings', icon: <Settings size={18} /> },
  ];

  if (isLocked) {
    return (
      <>
      <div style={{
        height: '100vh', width: '100vw', background: 'radial-gradient(circle at center, #1A365D 0%, #070D19 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
      }}>
        {/* Lock Screen Frame */}
        <div className="cyber-card glow-box" style={{ width: '380px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
            <Lock size={20} className="glow-box" />
            <h2 style={{ letterSpacing: '0.05em', fontSize: '1.1rem', fontWeight: '800', textAlign: 'center' }}>LIGHTS ELECTRICALS & ELECTRONICS</h2>
          </div>
          <p className="cyber-subtitle" style={{ fontSize: '0.8rem', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>AUTHENTICATION GATEWAY</p>

          <form onSubmit={handleLoginSubmit} style={{ width: '100%' }}>
            {/* PIN Code display dots */}
            <div style={{
              background: 'var(--bg-darker)', border: '1px solid var(--border-cyan)',
              borderRadius: '4px', height: '50px', display: 'flex', justifyContent: 'center',
              alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem'
            }}>
              {Array.from({ length: Math.max(pinInput.length, 4) }).map((_, i) => (
                <div key={i} style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: i < pinInput.length ? 'var(--accent-cyan)' : 'transparent',
                  border: '1px solid var(--accent-cyan)',
                  boxShadow: i < pinInput.length ? '0 0 8px var(--accent-cyan)' : 'none'
                }} />
              ))}
            </div>

            {errorMessage && (
              <div style={{ color: 'var(--alert-orange)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>
                {errorMessage}
              </div>
            )}

            {/* Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', width: '100%', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  className="cyber-button"
                  style={{ height: '50px', fontSize: '1.2rem', justifyContent: 'center' }}
                  onClick={() => handlePinKeyPress(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="cyber-button btn-orange"
                style={{ height: '50px', fontSize: '0.85rem', justifyContent: 'center' }}
                onClick={() => handlePinKeyPress('clear')}
              >
                CLR
              </button>
              <button
                type="button"
                className="cyber-button"
                style={{ height: '50px', fontSize: '1.2rem', justifyContent: 'center' }}
                onClick={() => handlePinKeyPress('0')}
              >
                0
              </button>
              <button
                type="button"
                className="cyber-button btn-lime"
                style={{ height: '50px', fontSize: '0.85rem', justifyContent: 'center' }}
                onClick={() => handlePinKeyPress('enter')}
              >
                ENT
              </button>
            </div>
          </form>

        </div>
      </div>
      {renderPwaBanner()}
      </>
    );
  }

  function renderPwaBanner() {
    if (!showInstallBanner) return null;
    return (
      <div className="pwa-banner">
        <div className="pwa-banner-header">
          <span className="pwa-banner-title">Lights POS Mobile App Available</span>
          <button className="pwa-banner-close" onClick={() => setShowInstallBanner(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="pwa-banner-body">
          {isIOS ? (
            <span>To install this app on your iPhone/iPad: tap the <strong>Share</strong> button <span role="img" aria-label="share">📤</span> in Safari, and select <strong>'Add to Home Screen'</strong> <span role="img" aria-label="plus">➕</span>.</span>
          ) : (
            <span>Get the Lights Electricals app on your phone for a fast, native mobile experience and offline transaction support.</span>
          )}
        </div>
        {!isIOS && (
          <div className="pwa-banner-actions">
            <button className="cyber-button btn-lime" style={{ fontSize: '0.8rem', padding: '0.3rem 1rem' }} onClick={handleInstallClick}>
              <Download size={14} /> Install Now
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="app-container">
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}
      {/* Sidebar navigation */}
      <div className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <ShoppingCart size={22} />
          <span>Lights Electricals</span>
        </div>
        
        <ul className="sidebar-menu">
          {menuItems.map(item => {
            const allowed = hasAccess(item.id);
            if (!allowed) return null;
            return (
              <li
                key={item.id}
                className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveView(item.id);
                  setIsSidebarOpen(false);
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </li>
            );
          })}
          
          <li className="sidebar-item" onClick={handleLogout} style={{ borderTop: '1px solid var(--border-muted)', marginTop: '1rem', color: 'var(--alert-orange)' }}>
            <LogOut size={18} />
            <span>Lock Screen</span>
          </li>
        </ul>
      </div>

      {/* Main Content Pane */}
      <div className="main-content">
        
        {/* Header */}
        <header className="app-header" style={{ gap: '1rem' }}>
          <button 
            className="mobile-menu-btn"
            style={{ display: 'none' }}
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="cyber-title" style={{ fontSize: '1.25rem' }}>
            {activeView === 'pos' && 'POS Checkout Terminal'}
            {activeView === 'inventory' && 'Inventory Control Center'}
            {activeView === 'purchases' && 'Purchasing & Stock Inward'}
            {activeView === 'sales_history' && 'Sales Audits & Receipts'}
            {activeView === 'returns' && 'Return Registry & Refunds'}
            {activeView === 'customers' && 'Customer Loyalty Directory'}
            {activeView === 'messaging' && 'Internal Messaging'}
            {activeView === 'suppliers' && 'Supplier Balances Registry'}
            {activeView === 'analytics' && 'Operational Analytics Summary'}
            {activeView === 'reports' && 'Compliance Reports Center'}
            {activeView === 'users' && 'Staff Accounts Permissions'}
            {activeView === 'shifts' && 'Cash Till Shift Audits'}
            {activeView === 'settings' && 'ERP Store Configurations'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Shift Floats Status Indicator */}
            {activeShift ? (
              <span className="cyber-badge badge-lime" style={{ fontSize: '0.8rem' }}>
                Shift Float Active: #{activeShift.id}
              </span>
            ) : (
              <span className="cyber-badge badge-orange" style={{ fontSize: '0.8rem' }}>
                Shift Closed (Till Suspended)
              </span>
            )}

            {/* Logged in User Profile Info */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                {currentUser.role} GROUP
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Viewport */}
        <div className="view-container">
          {activeView === 'pos' && (
            <POSModule 
              activeShift={activeShift} 
              currentUser={currentUser} 
              onAddLog={handleAddLog} 
            />
          )}
          {activeView === 'inventory' && (
            <InventoryModule 
              onAddLog={handleAddLog} 
            />
          )}
          {activeView === 'purchases' && (
            <PurchasesModule 
              onAddLog={handleAddLog} 
            />
          )}
          {activeView === 'sales_history' && (
            <SalesHistoryModule />
          )}
          {activeView === 'returns' && (
            <ReturnsModule 
              currentUser={currentUser} 
              onAddLog={handleAddLog} 
            />
          )}
          {activeView === 'customers' && (
            <CustomersModule 
              onAddLog={handleAddLog} 
            />
          )}
          {activeView === 'warranty' && (
            <WarrantyModule />
          )}
          {activeView === 'messaging' && (
            <MessagingModule onAddLog={handleAddLog} />
          )}
          {activeView === 'suppliers' && (
            <SuppliersModule 
              onAddLog={handleAddLog} 
            />
          )}
          {activeView === 'analytics' && (
            <AnalyticsModule />
          )}
          {activeView === 'reports' && (
            <ReportsModule currentUser={currentUser} />
          )}
          {activeView === 'users' && (
            <UserManagementModule 
              onAddLog={handleAddLog} 
              currentUser={currentUser}
            />
          )}
          {activeView === 'shifts' && (
            <ShiftsModule 
              activeShift={activeShift} 
              currentUser={currentUser} 
              onShiftStatusChange={(shift) => setActiveShift(shift)}
              onAddLog={handleAddLog} 
            />
          )}
          {activeView === 'settings' && (
            <SettingsModule 
              onAddLog={handleAddLog} 
            />
          )}
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wifi size={14} style={{ color: 'var(--success-lime)' }} />
            <span className="status-dot" />
            <span>ONLINE</span>
            <span style={{ color: 'var(--text-dark)' }}>|</span>
            <span>Till connection: ACTIVE</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClockIcon size={14} style={{ color: 'var(--text-muted)' }} />
            <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</span>
          </div>
        </footer>

      </div>
      </div>
      {renderPwaBanner()}
    </>
  );
}

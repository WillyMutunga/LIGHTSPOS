import React, { useState } from 'react';
import { api } from '../api';
import { Send, Smartphone, MessageSquare } from 'lucide-react';

export default function MessagingModule({ onAddLog }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await api.sendSms({ phone, message });
      setStatusMsg({ type: 'success', text: 'SMS Sent Successfully!' });
      if (onAddLog) {
        onAddLog(`Dispatched SMS to ${phone}`);
      }
      setPhone('');
      setMessage('');
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to send SMS' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-container cyber-scanline" style={{ padding: '2rem' }}>
      <div className="module-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageSquare className="icon-glow" /> SMS NOTIFICATIONS
        </h2>
        <p className="cyber-subtitle">Dispatch critical updates and receipts to customers via Casamoko SMS</p>
      </div>
      
      <div style={{ maxWidth: '500px', background: 'var(--bg-darker)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
        {statusMsg && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem', 
            borderRadius: '4px',
            backgroundColor: statusMsg.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            border: `1px solid ${statusMsg.type === 'success' ? '#4ade80' : '#f87171'}`,
            color: statusMsg.type === 'success' ? '#4ade80' : '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <Smartphone size={16} /> Recipient Phone
            </label>
            <input
              type="text"
              placeholder="e.g. 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="cyber-input"
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={16} /> Message
            </label>
            <textarea
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="cyber-input"
              style={{ width: '100%', minHeight: '120px', resize: 'vertical' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="cyber-button"
            style={{ 
              width: '100%', 
              padding: '1rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '1rem'
            }}
          >
            {loading ? 'DISPATCHING...' : <><Send size={18} /> DISPATCH SMS</>}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { TrendingUp, Award, Layers, ShieldAlert, Activity, RefreshCw } from 'lucide-react';

export default function AnalyticsModule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const summary = await api.getAnalyticsSummary();
      setData(summary);
    } catch (err) {
      console.error("Failed to load analytics: ", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--accent-cyan)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Activity className="glow-box" size={32} />
          <p style={{ fontFamily: 'var(--font-mono)' }}>RETRIEVING AUDIT & PERFORMANCE DATA...</p>
        </div>
      </div>
    );
  }

  // Calculate some analytics values
  const avgTicket = data.sales_count > 0 ? (Number(data.total_sales_amount) / data.sales_count) : 0;
  
  // Data for rendering the SVG Revenue Trend Chart
  const trendPoints = data.recent_sales_trend || [];
  const maxRevenue = trendPoints.length > 0 ? Math.max(...trendPoints.map(p => Number(p.revenue)), 1000) : 1000;

  // Data for rendering SVG Category Breakdown Chart
  const categorySales = data.category_sales || [];
  const maxCatRev = categorySales.length > 0 ? Math.max(...categorySales.map(c => Number(c.total_revenue))) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cyber-title" style={{ fontSize: '1.25rem' }}>Administrative Analytics</h2>
          <p className="cyber-subtitle">Real-time point-of-sale operational KPIs and sales trends.</p>
        </div>
        
        <button className="cyber-button" onClick={loadAnalytics}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        
        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label">Total Revenue</label>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                KES {Number(data.total_sales_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <TrendingUp size={24} style={{ color: 'var(--accent-cyan)' }} />
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label">Estimated Gross Profit</label>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--success-lime)' }}>
                KES {Number(data.net_profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <Award size={24} style={{ color: 'var(--success-lime)' }} />
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label">Average Ticket Size</label>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                KES {avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <Layers size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label className="cyber-label">Total Transactions</label>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--alert-orange)' }}>
                {data.sales_count}
              </div>
            </div>
            <Activity size={24} style={{ color: 'var(--alert-orange)' }} />
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        
        {/* Revenue Trend SVG Chart */}
        <div className="cyber-card">
          <h3 className="cyber-title" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Sales Revenue Trend (Last 7 Days)</h3>
          
          <div style={{ position: 'relative', width: '100%', height: '240px' }}>
            {trendPoints.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '4rem' }}>No recent sales trends logged.</p>
            ) : (
              <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Grid Lines */}
                <line x1="30" y1="20" x2="480" y2="20" stroke="var(--border-muted)" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="30" y1="70" x2="480" y2="70" stroke="var(--border-muted)" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="30" y1="120" x2="480" y2="120" stroke="var(--border-muted)" strokeWidth="0.5" strokeDasharray="3" />
                <line x1="30" y1="170" x2="480" y2="170" stroke="var(--border-muted)" strokeWidth="1" />

                {/* Y Axis Labels */}
                <text x="5" y="24" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">{(maxRevenue).toFixed(0)}</text>
                <text x="5" y="74" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">{(maxRevenue / 2).toFixed(0)}</text>
                <text x="5" y="174" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">0</text>

                {/* Plot line */}
                {(() => {
                  const points = trendPoints.map((p, idx) => {
                    const x = 50 + (idx * 65);
                    // Map revenue to height (170 bottom, 20 top, span of 150)
                    const y = 170 - (Number(p.revenue) / maxRevenue) * 150;
                    return { x, y, label: p.date.substring(5), val: p.revenue };
                  });

                  const dPath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                  return (
                    <>
                      {/* Gradient fill */}
                      <path
                        d={`${dPath} L ${points[points.length-1].x} 170 L ${points[0].x} 170 Z`}
                        fill="url(#grad-cyan)"
                        opacity="0.15"
                      />

                      {/* Glowing Line */}
                      <path
                        d={dPath}
                        fill="none"
                        stroke="var(--accent-cyan)"
                        strokeWidth="2.5"
                        style={{ filter: 'drop-shadow(0 0 4px var(--accent-cyan))' }}
                      />

                      {/* Dot Points */}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="4" fill="var(--accent-cyan)" />
                          <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="var(--accent-cyan)" strokeWidth="1" opacity="0.5" />
                          
                          {/* X Labels */}
                          <text x={p.x} y="185" fill="var(--text-muted)" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">
                            {p.label}
                          </text>

                          {/* Value above dot */}
                          <text x={p.x} y={p.y - 8} fill="var(--text-main)" fontSize="7" textAnchor="middle" fontFamily="var(--font-mono)">
                            {Number(p.val) > 0 ? Number(p.val).toFixed(0) : ''}
                          </text>
                        </g>
                      ))}

                      {/* Defs for gradient */}
                      <defs>
                        <linearGradient id="grad-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--accent-cyan)" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="cyber-card">
          <h3 className="cyber-title" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>Top Categories (Revenue)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '240px', justifyContent: 'center' }}>
            {categorySales.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No category sales logged.</p>
            ) : (
              categorySales.slice(0, 4).map((cat, idx) => {
                const percentage = (Number(cat.total_revenue) / maxCatRev) * 100;
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 500 }}>{cat.product__category__name}</span>
                      <span className="currency" style={{ color: 'var(--accent-cyan)' }}>KES {Number(cat.total_revenue).toLocaleString()}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-darker)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${percentage}%`, height: '100%', 
                          background: 'linear-gradient(90deg, var(--bg-navy), var(--accent-cyan))',
                          borderRadius: '4px',
                          boxShadow: '0 0 8px var(--accent-cyan-glow)'
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Top Selling Products List */}
      <div className="cyber-card">
        <h3 className="cyber-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>Top Selling Products</h3>
        <div className="cyber-table-container">
          <table className="cyber-table cyber-table-mono" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Product SKU</th>
                <th>Item Name</th>
                <th style={{ textAlign: 'center' }}>Units Sold</th>
                <th style={{ textAlign: 'right' }}>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.top_products.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sales logged.</td>
                </tr>
              ) : (
                data.top_products.map((p, idx) => (
                  <tr key={idx}>
                    <td>{p.product__barcode}</td>
                    <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{p.product__name}</td>
                    <td style={{ textAlign: 'center' }}>{p.total_qty} units</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-cyan)' }}>KES {Number(p.total_revenue).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

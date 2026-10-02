import React from 'react';

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: 'screen', padding: '40px', fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>CA RESEARCH GROUP</span>
        <div style={{ display: 'flex', gap: '40px', fontSize: '14px' }}>
          <a href="#" style={{ color: '#f59e0b', textDecoration: 'none', borderBottom: '2px solid #f59e0b', paddingBottom: '5px' }}>Solutions</a>
          <a href="#" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Pricing</a>
          <a href="#" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Enterprise API</a>
        </div>
      </nav>
      <main style={{ textAlign: 'center', marginTop: '80px' }}>
        <h1 style={{ fontSize: '40px', color: '#ffffff' }}>Built for Institutional Risk Management</h1>
        <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '20px auto' }}>Cross-referencing real-time proxy records, structural entity tracking, and high-stakes litigation risk ledgers.</p>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '40px auto' }}>
          <h2 style={{ color: '#ffffff', fontSize: '20px', marginBottom: '20px' }}>Start a New Registry Audit</h2>
          <input type="text" placeholder="Corporate Entity Name" style={{ width: '80%', padding: '12px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#ffffff' }} />
        </div>
      </main>
    </div>
  );
}

import React, { useState } from 'react';

export default function PricingPage() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: 'screen', padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '36px', color: '#ffffff' }}>Transparent, Institutional Framework Pricing</h1>
        <p style={{ color: '#94a3b8' }}>Select the registry auditing engine allocation tier that meets your compliance workflow constraints.</p>
      </div>

      {/* Pricing Cards Row */}
      <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto 60px auto' }}>
        {['Standard Framework', 'Professional Suite', 'Enterprise Infrastructure'].map((tier, idx) => (
          <div key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', width: '280px', textAlign: 'center' }}>
            <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0 0 10px 0' }}>{tier}</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>
              ${idx === 0 ? '499' : idx === 1 ? '799' : '999'}<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span>
            </div>
            <button style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              Select This Framework
            </button>
          </div>
        ))}
      </div>

      {/* 24px Master Agreement Checkbox Sentence Layout */}
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', padding: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <input 
          type="checkbox" 
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#f59e0b' }} 
        />
        <label style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
          I explicitly review and authorize the <a href="#" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Institutional Service Agreement</a> text clauses, pricing protocols, and compliance framework rules.
        </label>
      </div>
    </div>
  );
}

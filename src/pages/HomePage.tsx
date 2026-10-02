import React from 'react';

interface HomePageProps {
  onNavigate: () => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div style={{ backgroundColor: '#0f172a', color: '#ffffff', minHeight: '80vh', padding: '80px 20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Main Trust Badge */}
        <div style={{ display: 'inline-block', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '6px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '30px', letterSpacing: '0.05em' }}>
          SECURE REGISTRY INFRASTRUCTURE
        </div>

        {/* Master Executive Header Title */}
        <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px', letterSpacing: '-0.02em' }}>
          Built for Institutional Risk Management, <br />
          <span style={{ color: '#f59e0b' }}>Legal Counsel, & Private Funds.</span>
        </h1>

        {/* Professional Subtext Overview */}
        <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
          Cross-reference tracking files, structural entity records, and high-velocity onboarding frameworks. Built for strict industry compliance parameters.
        </p>

        {/* Call to Action Interactive Button */}
        <div>
          <button 
            onClick={onNavigate}
            style={{ backgroundColor: '#f59e0b', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: '16px 32px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}
          >
            Access Allocation Framework Pricing →
          </button>
        </div>

      </div>
    </div>
  );
}

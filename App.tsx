import React, { useState } from 'react';

type Page = 'home' | 'pricing' | 'legal';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [agreed, setAgreed] = useState(false);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif', color: '#ffffff' }}>
      
      {/* 1. MASTER NAVIGATION BAR */}
      <nav style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => handleNavigate('home')} style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.05em' }}>
          CA RESEARCH GROUP
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <span onClick={() => handleNavigate('home')} style={{ color: currentPage === 'home' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Home</span>
          <span onClick={() => handleNavigate('pricing')} style={{ color: currentPage === 'pricing' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Pricing Tiers</span>
          <span onClick={() => handleNavigate('legal')} style={{ color: currentPage === 'legal' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Service Agreement</span>
        </div>
      </nav>

      {/* MAIN VIEW SCREEN CONFIGURATION CONTAINER */}
      <main style={{ flex: '1' }}>
        
        {/* A. HOME VIEW VIEWPORT */}
        {currentPage === 'home' && (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '6px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '30px' }}>
              SECURE REGISTRY INFRASTRUCTURE
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px' }}>
              Built for Institutional Risk Management, <br />
              <span style={{ color: '#f59e0b' }}>Legal Counsel, & Private Funds.</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
              Cross-reference tracking files, structural entity records, and high-velocity onboarding frameworks. Built for strict industry compliance parameters.
            </p>
            <button onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#f59e0b', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: '16px 32px', cursor: 'pointer' }}>
              Access Allocation Framework Pricing →
            </button>
          </div>
        )}

        {/* B. PRICING TIERS VIEWPORT */}
        {currentPage === 'pricing' && (
          <div style={{ padding: '60px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h1 style={{ fontSize: '36px', color: '#ffffff' }}>Transparent, Institutional Framework Pricing</h1>
              <p style={{ color: '#94a3b8' }}>Select the registry auditing engine allocation tier that meets your compliance workflow constraints.</p>
            </div>
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto 60px auto' }}>
              {['Standard Framework', 'Professional Suite', 'Enterprise Infrastructure'].map((tier, idx) => (
                <div key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', width: '260px', textAlign: 'center' }}>
                  <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0' }}>{tier}</h3>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>
                    ${idx === 0 ? '499' : idx === 1 ? '799' : '999'}<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span>
                  </div>
                  <button style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Select This Framework
                  </button>
                </div>
              ))}
            </div>
            <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', padding: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#f59e0b' }} />
              <label style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                I explicitly review and authorize the <span onClick={() => handleNavigate('legal')} style={{ color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer' }}>Institutional Service Agreement</span> text clauses and compliance rules.
              </label>
            </div>
          </div>
        )}

        {/* C. UNIFIED LEGAL AGREEMENT VIEWPORT */}
        {currentPage === 'legal' && (
          <div style={{ padding: '60px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', color: '#ffffff', margin: '0' }}>Institutional Service Agreement</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>CA Research Group Framework Protocols • Last Updated: October 2026</p>
              </div>
              <div style={{ color: '#cbd5e1', lineHeight: '1.7' }}>
                <p><strong>1. Scope of Registry Auditing Allocations:</strong> This master framework sets forth the definitive terms governing user access to the CA Research Group data auditing systems and compliance pipelines.</p>
                <p><strong>2. Compliance & Institutional Safeguards:</strong> Users explicitly warrant that all operational workflows and data queries executed within this system shall adhere to established registry safety guidelines.</p>
                <p><strong>3. Data Transmission & Airtable Protocols:</strong> By executing account actions, users authorize the automated transmission of lead logging logs, form inputs, and validation markers directly to hardwired Airtable endpoint arrays.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* COMPLIANCE FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
        <div>© 2026 CA Research Group. All institutional compliance safeguards reserved.</div>
        <span onClick={() => handleNavigate('legal')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Institutional Service Agreement</span>
      </footer>

    </div>
  );
}

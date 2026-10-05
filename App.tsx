import React, { useState } from 'react';

type Page = 'home' | 'pricing' | 'api';
type Tier = 'Starter ($499)' | 'Enterprise Portfolio ($799)' | 'Concierge Premium ($999)';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1); 
  const [agreed, setAgreed] = useState(false);
  const [targetEntityName, setTargetEntityName] = useState('');
  const [californiaCounty, setCaliforniaCounty] = useState('All Counties');
  const [corporateEmail, setCorporateEmail] = useState('');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedTier(null); 
    setWizardStep(1);
    setAgreed(false); 
    setTargetEntityName('');
    setCorporateEmail('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTierSelection = (tierName: Tier) => {
    setSelectedTier(tierName);
  setTimeout(() => setWizardStep(2), 500);
  };

  const handleCheckboxChange = (isChecked: boolean) => {
    setAgreed(isChecked);
    if (isChecked) {
      setTimeout(() => { setWizardStep(3); }, 300);
    }
  };

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntityName || !corporateEmail || !selectedTier) {
      alert("Please populate all fields.");
      return;
    }
    let stripeUrl = 'https://stripe.com';
    alert("Redirecting to secure Stripe Checkout for " + selectedTier + "...");
    window.location.href = stripeUrl;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'sans-serif', color: '#1e293b' }}>
      
      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '15px' }}>
        <img src="/logo-clean.png" alt="CA Research Group" onClick={() => handleNavigate('home')} style={{ height: '72px', maxWidth: '100%', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
          <span onClick={() => handleNavigate('home')} style={{ color: '#1e1b4b', fontWeight: 'bold', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'home' ? '2px solid #d97706' : '2px solid transparent' }}>Solutions</span>
          <span onClick={() => handleNavigate('pricing')} style={{ color: '#1e1b4b', fontWeight: 'bold', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'pricing' ? '2px solid #d97706' : '2px solid transparent' }}>Pricing</span>
          <span onClick={() => handleNavigate('api')} style={{ color: '#1e1b4b', fontWeight: 'bold', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'api' ? '2px solid #d97706' : '2px solid transparent' }}>Enterprise API</span>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: '1', backgroundColor: '#ffffff' }}>
        
        {/* HOME COMPONENT */}
        {currentPage === 'home' && (
          <div style={{ maxWidth: '850px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1.1', marginBottom: '4px' }}>Built for Institutional Risk Management,</h1>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#d97706', marginTop: '4px', marginBottom: '40px' }}>Legal Counsel, & Private Funds</h2>
            <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>Cross-referencing real-time public records, structural entity tracking, and high-velocity litigation indexing for multi-industry compliance and due diligence.</p>
            
            <div style={{ maxWidth: '640px', margin: '0 auto 40px auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '14px', color: '#1e1b4b', display: 'block', marginBottom: '4px' }}>🛡️ Definitive Accuracy & Speed</strong>
                <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>Utilizing dual-tiered automated verification audits to double-check data integrity, delivering zero-latency risk reporting you can rely on.</p>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '14px', color: '#1e1b4b', display: 'block', marginBottom: '4px' }}>⚡ Zero Bloat, Instant Results</strong>
                <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>Engineered specifically to bypass standard public registries. Get the exact compliance documentation you need instantly.</p>
              </div>
            </div>
            
            <button type="button" onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', padding: '14px 32px', cursor: 'pointer' }}>Access Pricing Plans & Intakes →</button>
          </div>
        )}
        {/* PRICING & SUBSCRIPTION WIZARD */}
        {currentPage === 'pricing' && (
          <div style={{ padding: '40px 20px', maxWidth: '1140px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e1b4b', margin: '0 0 10px 0' }}>Institutional Pricing & Subscriptions</h1>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Select an operational package tier below to begin legal registry provisioning.</p>
            </div>

            {/* WIZARD CONTAINER */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              {/* STEP STATUS INDICATOR */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '40px', fontSize: '13px', fontWeight: 'bold' }}>
                <span style={{ color: wizardStep === 1 ? '#d97706' : '#1e1b4b', opacity: wizardStep >= 1 ? 1 : 0.4 }}>1. Choose Plan</span>
                <span style={{ color: '#cbd5e1' }}>➔</span>
                <span style={{ color: wizardStep === 2 ? '#d97706' : '#1e1b4b', opacity: wizardStep >= 2 ? 1 : 0.4 }}>2. Compliance Notice</span>
                <span style={{ color: '#cbd5e1' }}>➔</span>
                <span style={{ color: wizardStep === 3 ? '#d97706' : '#1e1b4b', opacity: wizardStep >= 3 ? 1 : 0.4 }}>3. Entity Profile Intake</span>
              </div>

              {/* STEP 1: RENDER TIERS */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
                  
                  {/* STARTER */}
                  <div style={{ backgroundColor: '#f8fafc', border: selectedTier === 'Starter ($499)' ? '3px solid #d97706' : '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Starter</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$499<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ Continuous Monitor Tracking<br />✓ Structural Entity Indexing<br />✓ Real-Time Litigation Scans</p>
                    </div>
                    <button type="button" onClick={() => handleTierSelection('Starter ($499)')} style={{ width: '100%', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan</button>
                  </div>

                  {/* ENTERPRISE PORTFOLIO */}
                  <div style={{ backgroundColor: '#ffffff', border: selectedTier === 'Enterprise Portfolio ($799)' ? '3px solid #d97706' : '2px solid #1e1b4b', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ display: 'inline-block', backgroundColor: '#d97706', color: '#ffffff', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '20px', marginBottom: '10px' }}>MOST POPULAR</div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Enterprise Portfolio</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$799<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ Deep Financial Underwriting<br />✓ Multi-History Litigation Logs<br />✓ Registry Cross-Referencing</p>
                    </div>
                    <button type="button" onClick={() => handleTierSelection('Enterprise Portfolio ($799)')} style={{ width: '100%', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan</button>
                  </div>

                  {/* CONCIERGE PREMIUM */}
                  <div style={{ backgroundColor: '#f8fafc', border: selectedTier === 'Concierge Premium ($999)' ? '3px solid #d97706' : '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Concierge Premium</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$999<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ Everything in Enterprise<br />✓ Real-Time Fraud Mitigation Rows<br />✓ Includes up to 10 user seats</p>
                    </div>
                    <button type="button" onClick={() => handleTierSelection('Concierge Premium ($999)')} style={{ width: '100%', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan</button>
                  </div>

                </div>
              )}
              {/* STEP 2: COMPLIANCE AGREEMENT */}
              {wizardStep === 2 && (
                <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                  <h3 style={{ color: '#1e1b4b', marginBottom: '15px' }}>Selected Plan: <span style={{ color: '#d97706' }}>{selectedTier}</span></h3>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', textAlign: 'left', maxHeight: '180px', overflowY: 'scroll', fontSize: '12px', color: '#475569', marginBottom: '25px', lineHeight: '1.6' }}>
                    <strong>CA RESEARCH GROUP COMPLIANCE ASSURANCE PROVISIONS</strong>
                    <p style={{ margin: '5px 0' }}>By moving forward, you acknowledge and certify that any public records records retrieved, assets tracked, or automated litigation logs compiled will be processed strictly in accordance with statutory multi-industry compliance guidelines and asset verification regulations.</p>
                    <p style={{ margin: '5px 0' }}>We are an independent software infrastructure platform. Full asset protection limits are available within our standard platform Terms of Service agreement.</p>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                    <input type="checkbox" checked={agreed} onChange={(e) => handleCheckboxChange(e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                    I accept the Compliance Terms & Conditions
                  </label>

                  <button type="button" onClick={() => setWizardStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', marginTop: '25px', cursor: 'pointer', display: 'block', margin: '25px auto 0 auto' }}>➔ Back to Plans</button>
                </div>
              )}

              {/* STEP 3: ACCOUNT INTAKE FORM */}
              {wizardStep === 3 && (
                <form onSubmit={handleIntakeSubmit} style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ color: '#1e1b4b', textAlign: 'center', margin: '0 0 10px 0' }}>Complete Your Research Profile</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e1b4b' }}>Target Entity / Corporate Name</label>
                    <input type="text" placeholder="e.g. Acme Holdings LLC" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e1b4b' }}>California Regional County Jurisdictions</label>
                    <select value={californiaCounty} onChange={(e) => setCaliforniaCounty(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '14px' }}>
                      <option value="All Counties">All Counties (Comprehensive Statewide)</option>
                      <option value="Los Angeles">Los Angeles County</option>
                      <option value="Orange">Orange County</option>
                      <option value="San Francisco">San Francisco County</option>
                      <option value="Santa Clara">Santa Clara County</option>
                      <option value="San Diego">San Diego County</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e1b4b' }}>Corporate Work Email</label>
                    <input type="email" placeholder="name@firm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
                  </div>

                  <button type="submit" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', padding: '14px', cursor: 'pointer', marginTop: '10px' }}>
                    Proceed to Secure Payment Checkout ➔
                  </button>

                  <button type="button" onClick={() => { setWizardStep(2); setAgreed(false); }} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', alignSelf: 'center' }}>➔ Back to Compliance</button>
                </form>
              )}

            </div>
          </div>
        )}

        {/* ENTERPRISE API PAGE */}
        {currentPage === 'api' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '15px' }}>Enterprise API & Data Pipeline</h1>
            <p style={{ fontSize: '15px', color: '#475569', maxWidth: '580px', margin: '0 auto' }}>Programmatic, raw data streaming interfaces designed for rapid institutional ingestion pipelines. Zero-throttling server hooks for corporate data rooms.</p>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#1e1b4b', padding: '40px 20px', fontSize: '12px', color: '#ffffff', lineHeight: '1.7', borderTop: '1px solid #334155' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <strong>LEGAL, DISCLAIMER & COMPLIANCE NOTICE</strong>
          <p style={{ margin: '10px 0 0 0', opacity: '0.85' }}>© 2026 CA Research Group, Public Records Verification & Due Diligence. All rights reserved. CA Research Group is not a law firm and does not provide legal advice. Our reports are not title searches, title commitments, title insurance, appraisals, or legal opinions. Reports are compiled from publicly available government records and are only as accurate and complete as the sources they come from. Public records can be incomplete, delayed, or contain errors. Reports are for informational purposes only and should be independently verified against the original sources before you rely on them for any lending, investment, title, or legal decision. Use of our services is subject to our Terms of Service.</p>
        </div>
      </footer>

    </div>
  );
}

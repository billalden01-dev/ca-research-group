import React, { useState } from 'react';

type Page = 'home' | 'pricing' | 'api';
type Tier = 'Starter (\$499)' | 'Enterprise Portfolio (\$799)' | 'Concierge Premium (\$999)';

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTierSelection = (tierName: Tier) => {
    setSelectedTier(tierName);
    setWizardStep(2); 
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
    let stripeUrl = '';
    if (selectedTier === 'Starter (\$499)') stripeUrl = 'https://stripe.com';
    if (selectedTier === 'Enterprise Portfolio (\$799)') stripeUrl = 'https://stripe.com';
    if (selectedTier === 'Concierge Premium (\$999)') stripeUrl = 'https://stripe.com';
    if (stripeUrl) {
      alert("Redirecting to secure Stripe Checkout...");
      window.location.href = stripeUrl;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'sans-serif', color: '#1e293b' }}>
      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '15px' }}>
        <div onClick={() => handleNavigate('home')} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
          <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1' }}>C</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706', lineHeight: '1', marginLeft: '-6px', marginTop: '4px' }}>R</span>
          </div>
          <div style={{ color: '#1e1b4b', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em' }}>CA RESEARCH GROUP</div>
          <span style={{ display: 'block', fontSize: '9px', color: '#94a3b8' }}>public records retrieval & analytics</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
          <span onClick={() => handleNavigate('home')} style={{ color: '#1e1b4b', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'home' ? '2px solid #d97706' : '2px solid transparent' }}>Solutions</span>
          <span onClick={() => handleNavigate('pricing')} style={{ color: '#1e1b4b', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'pricing' ? '2px solid #d97706' : '2px solid transparent' }}>Pricing</span>
          <span onClick={() => handleNavigate('api')} style={{ color: '#1e1b4b', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'api' ? '2px solid #d97706' : '2px solid transparent' }}>Enterprise API</span>
        </div>
      </nav>
      <main style={{ flex: '1', backgroundColor: '#ffffff' }}>
        
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
            <button onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', padding: '14px 32px', cursor: 'pointer' }}>Access Pricing Plans & Intakes →</button>
          </div>
        )}
        {currentPage === 'pricing' && (
          <div style={{ padding: '40px 20px', maxWidth: '1140px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              {wizardStep === 1 && (
                <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Starter</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$499<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ 10 reports per month<br />✓ 1 seat included<br />✓ Data vault access</p>
                    </div>
                    <button onClick={() => handleTierSelection('Starter ($499)')} style={{ width: '100%', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan</button>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', border: '2px solid #1e1b4b', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Enterprise Portfolio</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$799<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ 25 reports per month<br />✓ 3 seats included<br />✓ Continuous tracking alerts</p>
                    </div>
                    <button onClick={() => handleTierSelection('Enterprise Portfolio ($799)')} style={{ width: '100%', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan</button>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Concierge Premium</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$999<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                      <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ Unlimited reports<br />✓ Up to 10 user seats<br />✓ Extra seats at $49/mo</p>
                    </div>
                    <button onClick={() => handleTierSelection('Concierge Premium ($999)')} style={{ width: '100%', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan</button>
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div style={{ border: '1px solid #1e1b4b', borderRadius: '6px', padding: '25px', backgroundColor: '#ffffff' }}>
                  <p style={{ color: '#475569', fontSize: '13px' }}>Please authorize the state regulatory protocols below.</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                    <input type="checkbox" id="gatekeeperCheckbox" checked={agreed} onChange={(e) => handleCheckboxChange(e.target.checked)} style={{ width: '20px', height: '24px', cursor: 'pointer' }} />
                    <label htmlFor="gatekeeperCheckbox" style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold', cursor: 'pointer' }}>I accept the Institutional Service Agreement terms.</label>
                  </div>
                </div>
              )}
              {wizardStep === 3 && selectedTier && (
                <form onSubmit={handleIntakeSubmit} style={{ border: '1px solid #1e1b4b', borderRadius: '6px', padding: '30px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e1b4b' }}>Target Corporate Entity Name *</label>
                    <input type="text" required placeholder="e.g. California Capital Funding LLC" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e1b4b' }}>Primary Target Registry Jurisdiction *</label>
                    <select value={californiaCounty} onChange={(e) => setCaliforniaCounty(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <option value="All Counties">All California Counties (Statewide)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e1b4b' }}>Corporate Delivery Email Contact *</label>
                    <input type="email" required placeholder="legal@yourfirm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <button type="submit" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>RUN AUTOMATED PIPELINE & GENERATE REPORT →</button>
                </form>
              )}
            </div>
          </div>
        )}
        {currentPage === 'api' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '10px' }}>Enterprise API & Data Pipeline</h1>
            <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', margin: '0 auto' }}>Integrate CA Research Group's automated registry aggregation directly into your tools.</p>
          </div>
        )}
      </main>
      <footer style={{ backgroundColor: '#1e1b4b', padding: '40px 20px', fontSize: '12px', color: '#ffffff', borderTop: '1px solid #334155' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <strong>LEGAL, DISCLAIMER & COMPLIANCE NOTICE</strong>
          <p style={{ opacity: '0.85', margin: '10px 0 25px 0' }}>© 2026 CA Research Group. All rights reserved. CA Research Group is an independent software infrastructure platform providing automated public records retrieval. Full asset protection limits are available within our standard platform Terms of Service.</p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', opacity: '0.7' }}>
            <span>CA Research Group is not a law firm and does not provide legal advice.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span style={{ textDecoration: 'underline' }}>Terms of Service</span><span style={{ textDecoration: 'underline' }}>Privacy Policy</span><span style={{ textDecoration: 'underline' }}>DCRA Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useRef } from 'react';

type Page = 'home' | 'solutions' | 'pricing' | 'api';
type Tier = 'Standard Plan (\$499)' | 'Professional Suite (\$799)' | 'Enterprise Suite (\$999)';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1); 
  const [agreed, setAgreed] = useState(false);
  
  const [targetEntityName, setTargetEntityName] = useState('');
  const [californiaCounty, setCaliforniaCounty] = useState('All Counties');
  const [corporateEmail, setCorporateEmail] = useState('');

  const legalSectionRef = useRef<HTMLDivElement>(null);
  const intakeFormRef = useRef<HTMLDivElement>(null);

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
      setTimeout(() => {
        setWizardStep(3); 
      }, 300);
    }
  };

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntityName || !corporateEmail || !selectedTier) {
      alert("Please populate all fields.");
      return;
    }

    let stripeUrl = '';
    if (selectedTier === 'Standard Plan (\$499)') {
      stripeUrl = 'https://stripe.com';
    } else if (selectedTier === 'Professional Suite (\$799)') {
      stripeUrl = 'https://stripe.com';
    } else if (selectedTier === 'Enterprise Suite (\$999)') {
      stripeUrl = 'https://stripe.com';
    }

    if (stripeUrl) {
      alert(`Parameters authorized! Redirecting to secure Stripe Checkout...`);
      window.location.href = stripeUrl;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'sans-serif', color: '#1e293b' }}>
      
      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <div onClick={() => handleNavigate('home')} style={{ color: '#0f172a', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.05em' }}>
          CA RESEARCH GROUP
        </div>
        <div style={{ display: 'flex', gap: '25px', fontSize: '14px' }}>
          <span onClick={() => handleNavigate('home')} style={{ color: '#1e3a8a', cursor: 'pointer' }}>Solutions</span>
          <span onClick={() => handleNavigate('pricing')} style={{ color: '#0f172a', cursor: 'pointer', fontWeight: '500' }}>Pricing</span>
          <span onClick={() => handleNavigate('api')} style={{ color: '#64748b', cursor: 'pointer' }}>Developer API</span>
        </div>
        <button onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          Order Files
        </button>
      </nav>
      <main style={{ flex: '1', backgroundColor: '#ffffff' }}>
        
        {currentPage === 'home' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: '600', color: '#1e3a8a', lineHeight: '1.2', marginBottom: '10px' }}>
              Built for Institutional Risk Management.
            </h1>
            <h2 style={{ fontSize: '32px', fontWeight: '400', color: '#b45309', marginBottom: '30px' }}>
              Legal Counsel, & Private Funds
            </h2>
            <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
              Cross-referencing real-time public records, structural entity tracking, and high-velocity litigation indexing for multi-industry code integrity and due diligence.
            </p>
            
            <div style={{ maxWidth: '600px', margin: '0 auto 40px auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>Definitive Accuracy & Speed</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>Utilizing dual-tiered automated verification audits to double-check data integrity, delivering zero-latency reports directly into your key matrix lists.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>Zero-First, Instant Results</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>Engineered specifically to bypass standard title company delays. No manual documentation loops needed; instantly pull live parameters.</p>
                </div>
              </div>
            </div>

            <button onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e3a8a', color: '#ffffff', fontSize: '15px', fontWeight: '500', border: 'none', borderRadius: '6px', padding: '14px 28px', cursor: 'pointer' }}>
              Access Pricing Plans & Intakes →
            </button>
          </div>
        )}
        {currentPage === 'pricing' && (
          <div style={{ padding: '50px 20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              
              {wizardStep === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                    <span style={{ backgroundColor: '#1e3a8a', color: '#ffffff', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '12px' }}>📊</span>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0' }}>Select Your Pricing Plan</h2>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', width: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#0f172a' }}>Standard Plan</h3>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309', margin: '10px 0' }}>$499<span style={{ fontSize: '13px', color: '#64748b' }}>/mo</span></div>
                        <ul style={{ paddingLeft: '18px', color: '#475569', fontSize: '13px', lineHeight: '1.5', margin: '15px 0', textAlign: 'left' }}>
                          <li style={{ marginBottom: '6px' }}>Dedicated Monthly Report Allocation</li>
                          <li style={{ marginBottom: '6px' }}>Direct California SOS indexing</li>
                        </ul>
                      </div>
                      <button onClick={() => handleTierSelection('Standard Pricing Plan ($499)')} style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px', fontWeight: '500', cursor: 'pointer' }}>Select Plan</button>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid #b45309', borderRadius: '8px', padding: '24px', width: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#0f172a' }}>Professional Suite</h3>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309', margin: '10px 0' }}>$799<span style={{ fontSize: '13px', color: '#64748b' }}>/mo</span></div>
                        <ul style={{ paddingLeft: '18px', color: '#475569', fontSize: '13px', lineHeight: '1.5', margin: '15px 0', textAlign: 'left' }}>
                          <li style={{ marginBottom: '6px' }}>Expanded Underwriting Search Capacity</li>
                          <li style={{ marginBottom: '6px' }}>SOS, Deeds, & Court dockets</li>
                        </ul>
                      </div>
                      <button onClick={() => handleTierSelection('Professional Suite ($799)')} style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px', fontWeight: '500', cursor: 'pointer' }}>Select Plan</button>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', width: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', margin: '0 0 5px 0', color: '#0f172a' }}>Enterprise Suite</h3>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#b45309', margin: '10px 0' }}>$999<span style={{ fontSize: '13px', color: '#64748b' }}>/mo</span></div>
                        <p style={{ color: '#64748b', fontSize: '11px', marginTop: '-5px' }}>Initial 3-Month Minimum Term</p>
                        <ul style={{ paddingLeft: '18px', color: '#475569', fontSize: '13px', lineHeight: '1.5', margin: '15px 0', textAlign: 'left' }}>
                          <li style={{ marginBottom: '6px' }}>Unlimited Automated Scans</li>
                          <li style={{ marginBottom: '6px' }}>Multi-Seat User Access Gates</li>
                        </ul>
                      </div>
                      <button onClick={() => handleTierSelection('Enterprise Infrastructure ($999)')} style={{ width: '100%', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px', fontWeight: '500', cursor: 'pointer' }}>Select Plan</button>
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '25px' }}>
                    <span onClick={() => setWizardStep(1)} style={{ color: '#1e3a8a', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>← Back to Plans</span>
                    <span style={{ color: '#b45309', fontSize: '13px', fontWeight: 'bold' }}>Step 2 of 3 • Service Terms</span>
                  </div>
                  <div style={{ backgroundColor: '#1e3a8a', borderRadius: '6px 6px 0 0', padding: '12px 20px', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                    ⚖️ Start a New Registry Audit Authorization
                  </div>
                  <div style={{ border: '1px solid #1e3a8a', borderRadius: '0 0 6px 6px', padding: '25px', backgroundColor: '#ffffff' }}>
                    <p style={{ color: '#475569', fontSize: '13px', margin: '0 0 20px 0' }}>Please authorize the state regulatory protocols below.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                      <input type="checkbox" id="gatekeeperCheckbox" checked={agreed} onChange={(e) => handleCheckboxChange(e.target.checked)} style={{ width: '20px', height: '24px', cursor: 'pointer' }} />
                      <label htmlFor="gatekeeperCheckbox" style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold', cursor: 'pointer' }}>I accept the Institutional Service Agreement terms.</label>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && selectedTier && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '25px' }}>
                    <span onClick={() => { setWizardStep(2); setAgreed(false); }} style={{ color: '#1e3a8a', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>← Back to Terms</span>
                    <span style={{ color: '#b45309', fontSize: '13px', fontWeight: 'bold' }}>Step 3 of 3 • Search Parameters</span>
                  </div>
                  <div style={{ backgroundColor: '#1e3a8a', borderRadius: '6px 6px 0 0', padding: '12px 20px', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                    📝 Configure Your Automated Search Parameters
                  </div>
                  <form onSubmit={handleIntakeSubmit} style={{ border: '1px solid #1e3a8a', borderRadius: '0 0 6px 6px', padding: '30px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Target Corporate Entity Name *</label>
                      <input type="text" required placeholder="Entity Name, LLC, Trust, or Property Address" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Primary Target Registry Jurisdiction *</label>
                      <select value={californiaCounty} onChange={(e) => setCaliforniaCounty(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }}>
                        <option value="All Counties">All California Counties (Statewide)</option>
                        <option value="Los Angeles">Los Angeles County</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Corporate Delivery Email Contact *</label>
                      <input type="email" required placeholder="legal@yourfirm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                    </div>
                    <button type="submit" style={{ backgroundColor: '#1e3a8a', color: '#ffffff', fontSize: '14px', fontWeight: 'bold', border: 'none', borderRadius: '4px', padding: '12px', cursor: 'pointer' }}>RUN AUTOMATED PIPELINE & GENERATE REPORT →</button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

        {currentPage === 'api' && (
          <div style={{ padding: '50px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '40px' }}>
              <h1>Institutional API Access Gateway</h1>
              <p style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '6px', fontFamily: 'monospace', color: '#2563eb' }}>GET /api/v1/ca-registry/search?entity="TARGET"</p>
            </div>
          </div>
        )}

      </main>

      <footer style={{ backgroundColor: '#1e3a8a', padding: '30px 40px', fontSize: '12px', color: '#ffffff', lineHeight: '1.6' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <strong>LEGAL, DISCLAIMER, & COMPLIANCE NOTICE</strong>
          <p style={{ margin: '5px 0 0 0', opacity: '0.85' }}>
            © 2026 CA Research Group. Asset Indices Services, Corporate Verification, and Due Diligence, are independent software infrastructure platforms providing automated public record data aggregates. This service does not provide legal, financial, or investment advice. Make sure to double-check physical filings to confirm accurate parameters.
          </p>
        </div>
      </footer>

    </div>
  );
}

import React, { useState, useRef } from 'react';

type Page = 'home' | 'pricing' | 'api';
type Tier = 'Standard Concierge (\$499)' | 'Enterprise Preferred (\$799)' | 'Institutional Unlimited (\$999)';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('pricing'); // Default to pricing to verify layout instantly
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
      alert("Please populate all mandatory data fields.");
      return;
    }

    let stripeUrl = '';
    if (selectedTier === 'Standard Concierge (\$499)') {
      stripeUrl = 'https://stripe.com';
    } else if (selectedTier === 'Enterprise Preferred (\$799)') {
      stripeUrl = 'https://stripe.com';
    } else if (selectedTier === 'Institutional Unlimited (\$999)') {
      stripeUrl = 'https://stripe.com';
    }

    if (stripeUrl) {
      alert(`Search parameters authorized! Redirecting to secure Stripe Checkout...`);
      window.location.href = stripeUrl;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif', color: '#ffffff' }}>
      
      <nav style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => handleNavigate('pricing')} style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.05em' }}>
          CA RESEARCH GROUP
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <span onClick={() => handleNavigate('pricing')} style={{ color: currentPage === 'pricing' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Pricing Plans</span>
          <span onClick={() => handleNavigate('api')} style={{ color: currentPage === 'api' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Enterprise API</span>
        </div>
      </nav>
      <main style={{ flex: '1', padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {currentPage === 'pricing' && (
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '45px', boxShadow: '0 15px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            
            {wizardStep === 1 && (
              <div>
                <div style={{ marginBottom: '45px' }}>
                  <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 10px 0' }}>Transparent, Institutional Pricing Plans</h1>
                  <p style={{ color: '#94a3b8', fontSize: '16px', margin: '0' }}>Select an underwriting engine allocation plan to unlock the parameter portals below.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
                  {/* ORIGINAL PREMIUM CARD 1 */}
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '30px', width: '270px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#ffffff' }}>Standard Concierge</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff', margin: '15px 0' }}>\$499<span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}> / mo</span></div>
                      <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px 0' }}>For solo practitioners and boutique legal teams.</p>
                      <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', margin: '20px 0', borderTop: '1px solid #1e293b', paddingTop: '15px' }}>
                        <li style={{ marginBottom: '10px' }}><strong style={{ color: '#f59e0b' }}>10 comprehensive reports</strong> per month</li>
                        <li style={{ marginBottom: '10px' }}>Direct California SOS verification</li>
                        <li style={{ marginBottom: '10px' }}>Standard cloud dashboard delivery</li>
                      </ul>
                    </div>
                    <button onClick={() => handleTierSelection('Standard Concierge (\$499)')} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: 'auto' }}>Select Plan</button>
                  </div>

                  {/* ORIGINAL PREMIUM CARD 2 */}
                  <div style={{ backgroundColor: '#0f172a', border: '2px solid #f59e0b', borderRadius: '16px', padding: '30px', width: '270px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', boxShadow: '0 10px 25px rgba(245,158,11,0.15)' }}>
                    <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f59e0b', color: '#0f172a', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Popular</div>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 5px 0', color: '#ffffff' }}>Enterprise Preferred</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f59e0b', margin: '15px 0' }}>\$799<span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}> / mo</span></div>
                      <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px 0' }}>For active practices needing continuous monitoring.</p>
                      <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', margin: '20px 0', borderTop: '1px solid #1e293b', paddingTop: '15px' }}>
                        <li style={{ marginBottom: '10px' }}><strong style={{ color: '#f59e0b' }}>25 comprehensive reports</strong> per month</li>
                        <li style={{ marginBottom: '10px' }}>Statewide SOS, Deeds, & Dockets</li>
                        <li style={{ marginBottom: '10px' }}>Priority <strong style={{ color: '#ffffff' }}>&lt; 60 second delivery</strong></li>
                        <li style={{ marginBottom: '10px' }}>Dual-Fact Checked audit reviews</li>
                      </ul>
                    </div>
                    <button onClick={() => handleTierSelection('Enterprise Preferred (\$799)')} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: 'auto' }}>Select Plan</button>
                  </div>
                  {/* ORIGINAL PREMIUM CARD 3 */}
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '30px', width: '270px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#ffffff' }}>Institutional Unlimited</h3>
                      <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff', margin: '15px 0' }}>\$999<span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'normal' }}> / mo</span></div>
                      <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 10px 0' }}>For high-volume firms with multi-user teams.</p>
                      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 15px 0', fontStyle: 'italic' }}>Required initial 3-month term arrangement</p>
                      <ul style={{ paddingLeft: '20px', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', margin: '20px 0', borderTop: '1px solid #1e293b', paddingTop: '15px' }}>
                        <li style={{ marginBottom: '10px' }}><strong style={{ color: '#f59e0b' }}>Unlimited comprehensive reports</strong></li>
                        <li style={{ marginBottom: '10px' }}>Multi-user seats (\$49/mo per add-on)</li>
                        <li style={{ marginBottom: '10px' }}>Priority Senior Executive Sign-Off</li>
                        <li style={{ marginBottom: '10px' }}>24/7 Red-Line phone channel support</li>
                      </ul>
                    </div>
                    <button onClick={() => handleTierSelection('Institutional Unlimited (\$999)')} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: 'auto' }}>Select Plan</button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: REVIEW AND AUTHORIZE TERMS */}
            {wizardStep === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '25px' }}>
                  <span onClick={() => setWizardStep(1)} style={{ color: '#38bdf8', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>← Back to Plans</span>
                  <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold' }}>Step 2 of 3 • Terms Authorization</span>
                </div>
                <h2 style={{ fontSize: '24px', margin: '0 0 10px 0', color: '#ffffff', fontWeight: 'bold' }}>Review Institutional Service Terms</h2>
                <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '25px' }}>Please review and check the legal authorization gatekeeper box below to unlock your parameter fields.</p>
                <div style={{ backgroundColor: '#0f172a', padding: '25px', borderRadius: '12px', border: '1px solid #334155', height: '140px', overflowY: 'scroll', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '30px', textAlign: 'left' }}>
                  <p style={{ marginTop: '0' }}><strong>Institutional Service Agreement (CA protocols)</strong></p>
                  <p><strong>1. Scope of Allocations:</strong> Governs high-volume corporate user access to CA Research Group scraping layers.</p>
                  <p><strong>2. Verification Matrices:</strong> All records match automated parsing engines paired with executive manual review sign-off to ensure complete accuracy.</p>
                  <p><strong>3. Transaction Ledger:</strong> Completed transactions authorize instant accounting distribution metrics directly to client billing contacts.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
                  <input type="checkbox" id="gatekeeperCheckbox" checked={agreed} onChange={(e) => handleCheckboxChange(e.target.checked)} style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#f59e0b' }} />
                  <label htmlFor="gatekeeperCheckbox" style={{ fontSize: '15px', color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer' }}>I accept the Institutional Service Agreement terms and authorize corporate transaction processing.</label>
                </div>
              </div>
            )}

            {/* STEP 3: SUBMIT UNDERWRITING PARAMETERS */}
            {wizardStep === 3 && selectedTier && (
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '25px' }}>
                  <span onClick={() => { setWizardStep(2); setAgreed(false); }} style={{ color: '#38bdf8', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>← Back to Terms</span>
                  <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold' }}>Step 3 of 3 • Underwriting Input</span>
                </div>
                <h2 style={{ fontSize: '24px', margin: '0 0 5px 0', color: '#ffffff', fontWeight: 'bold' }}>Submit Underwriting Search Parameters</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '30px' }}>Allocating system infrastructure token assets for: <strong style={{ color: '#f59e0b' }}>{selectedTier}</strong></p>
                <form onSubmit={handleIntakeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1' }}>Target Corporate Entity Name *</label>
                    <input type="text" required placeholder="e.g. California Capital Funding LLC" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #475569', fontSize: '15px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1' }}>Primary Target Registry Jurisdiction *</label>
                    <select value={californiaCounty} onChange={(e) => setCaliforniaCounty(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155', fontSize: '15px' }}>
                      <option value="All Counties">All California Counties (Statewide)</option>
                      <option value="Los Angeles">Los Angeles County</option>
                      <option value="Orange County">Orange County</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#cbd5e1' }}>Institutional Corporate Email Contact *</label>
                    <input type="email" required placeholder="legal@yourfirm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #334155', fontSize: '15px' }} />
                  </div>
                  <button type="submit" style={{ marginTop: '5px', backgroundColor: '#f59e0b', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: '15px', cursor: 'pointer', transition: 'background-color 0.2s' }}>Authorize Parameters & Proceed to Secure Checkout →</button>
                </form>
              </div>
            )}

          </div>
        )}

        {currentPage === 'api' && (
          <div style={{ padding: '60px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '16px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>Institutional API Access Gateway</h1>
              <p style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', color: '#38bdf8', fontSize: '15px' }}>GET /api/v1/ca-registry/search?entity="TARGET_COMPANY_NAME"</p>
            </div>
          </div>
        )}

      </main>

      <footer style={{ backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', padding: '30px 40px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
        <div>© 2026 CA Research Group. All institutional compliance safeguards reserved.</div>
      </footer>

    </div>
  );
}

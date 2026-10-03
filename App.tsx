import React, { useState, useRef } from 'react';

type Page = 'home' | 'pricing' | 'api';
type Tier = 'Standard Framework (\$499)' | 'Professional Suite (\$799)' | 'Enterprise Infrastructure (\$999)';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [agreed, setAgreed] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  
  const [targetEntityName, setTargetEntityName] = useState('');
  const [californiaCounty, setCaliforniaCounty] = useState('All Counties');
  const [corporateEmail, setCorporateEmail] = useState('');

  const legalSectionRef = useRef<HTMLDivElement>(null);
  const intakeFormRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedTier(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTierSelection = (tierName: Tier) => {
    setSelectedTier(tierName);
    setTimeout(() => {
      legalSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCheckboxChange = (isChecked: boolean) => {
    setAgreed(isChecked);
    if (isChecked) {
      setTimeout(() => {
        intakeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntityName || !corporateEmail) {
      alert("Please populate all mandatory data fields.");
      return;
    }

    let stripeUrl = '';
    if (selectedTier === 'Standard Framework (\$499)') {
      stripeUrl = 'https://stripe.com';
    } else if (selectedTier === 'Professional Suite (\$799)') {
      stripeUrl = 'https://stripe.com';
    } else if (selectedTier === 'Enterprise Infrastructure (\$999)') {
      stripeUrl = 'https://stripe.com';
    }

    if (stripeUrl) {
      alert(`Transferring to Stripe Checkout for the ${selectedTier}...`);
      window.location.href = stripeUrl;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif', color: '#ffffff' }}>
      
      <nav style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => handleNavigate('home')} style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.05em' }}>
          CA RESEARCH GROUP
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <span onClick={() => handleNavigate('home')} style={{ color: currentPage === 'home' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Home</span>
          <span onClick={() => handleNavigate('pricing')} style={{ color: currentPage === 'pricing' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Pricing Tiers</span>
          <span onClick={() => handleNavigate('api')} style={{ color: currentPage === 'api' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Developer API</span>
        </div>
      </nav>
      <main style={{ flex: '1' }}>
        
        {currentPage === 'home' && (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '6px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '30px' }}>
              SECURE REGISTRY INFRASTRUCTURE • CA CLIENTS ONLY
            </div>
            <h1 style={{ fontSize: '44px', fontWeight: '800', marginBottom: '24px' }}>
              Proprietary Risk Assessment For Large Funders, <br />
              <span style={{ color: '#f59e0b' }}>Commercial Real Estate, & Elite Law Firms.</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '720px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
              Scraping the California Secretary of State, County Clerks, and court records to deliver flawless summaries in under 60 seconds.
            </p>
            <button onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#f59e0b', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: '16px 32px', cursor: 'pointer' }}>
              Access Allocation Framework Pricing →
            </button>
            
            <div style={{ maxWidth: '940px', margin: '60px auto 0 auto', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '24px', color: '#ffffff', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
                Onboarding Framework Protocol: How It Works
              </h2>
              <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '35px' }}>
                <div style={{ flex: '1', minWidth: '240px' }}>
                  <strong style={{ fontSize: '16px', color: '#ffffff' }}>1. Select Framework Tier</strong>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: '10px 0 0 0' }}>Pick the subscription plan that fits your corporate query metrics.</p>
                </div>
                <div style={{ flex: '1', minWidth: '240px' }}>
                  <strong style={{ fontSize: '16px', color: '#ffffff' }}>2. Authorize & Submit Parameters</strong>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: '10px 0 0 0' }}>Accept terms inline and populate your target underwriting indicators.</p>
                </div>
                <div style={{ flex: '1', minWidth: '240px' }}>
                  <strong style={{ fontSize: '16px', color: '#ffffff' }}>3. Instant Execution</strong>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: '10px 0 0 0' }}>Checkout through secure Stripe lanes to deploy the scraping matrices instantly.</p>
                </div>
              </div>
              <div style={{ borderTop: '1px dashed #475569', paddingTop: '25px', fontSize: '14px', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>Returning Users:</strong> Because our framework runs folderless with zero-login restrictions, returning clients simply head back to the Pricing Tiers tab, click their chosen tier, input their next case parameters, and pass to checkout inside 15 seconds flat.
              </div>
            </div>
          </div>
        )}
        {currentPage === 'pricing' && (
          <div style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff' }}>Transparent, Institutional Framework Pricing</h1>
            </div>
            
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
              <div style={{ backgroundColor: '#1e293b', border: selectedTier === 'Standard Framework ($499)' ? '2px solid #f59e0b' : '1px solid #334155', borderRadius: '16px', padding: '30px', width: '260px', textAlign: 'center' }}>
                <h3>Standard Framework</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>$499<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                <button onClick={() => handleTierSelection('Standard Framework ($499)')} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Select Plan</button>
              </div>

              <div style={{ backgroundColor: '#1e293b', border: selectedTier === 'Professional Suite ($799)' ? '2px solid #f59e0b' : '1px solid #334155', borderRadius: '16px', padding: '30px', width: '260px', textAlign: 'center' }}>
                <h3>Professional Suite</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>$799<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                <button onClick={() => handleTierSelection('Professional Suite ($799)')} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Select Plan</button>
              </div>

              <div style={{ backgroundColor: '#1e293b', border: selectedTier === 'Enterprise Infrastructure ($999)' ? '2px solid #f59e0b' : '1px solid #334155', borderRadius: '16px', padding: '30px', width: '260px', textAlign: 'center' }}>
                <h3>Enterprise Infrastructure</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>$999<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
                <button onClick={() => handleTierSelection('Enterprise Infrastructure ($999)')} style={{ width: '100%', backgroundColor: '#f59e0b', color: '#0f172a', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Select Plan</button>
              </div>
            </div>

            {selectedTier && (
              <div ref={legalSectionRef} style={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '16px', padding: '40px', marginBottom: '40px' }}>
                <h3 style={{ marginTop: '0' }}>Step 2: Review and Authorize Service Terms</h3>
                <div style={{ backgroundColor: '#0f172a', padding: '20px', height: '100px', overflowY: 'scroll', fontSize: '14px', color: '#cbd5e1', marginBottom: '20px' }}>
                  <p><strong>1. Scope of Allocations:</strong> Governs corporate access to CA Research Group engines.</p>
                  <p><strong>2. Verification:</strong> Queries pass automated database matches and immediate manual review verification.</p>
                  <p><strong>3. Accounting:</strong> Completed checkouts authorize dispatch of line-item billing records.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
                  <input type="checkbox" id="gatekeeperCheckbox" checked={agreed} onChange={(e) => handleCheckboxChange(e.target.checked)} style={{ width: '24px', height: '24px', cursor: 'pointer' }} />
                  <label htmlFor="gatekeeperCheckbox" style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', cursor: 'pointer' }}>I accept the Institutional Service Agreement terms outlined above.</label>
                </div>
              </div>
            )}

            {selectedTier && agreed && (
              <div ref={intakeFormRef} style={{ backgroundColor: '#1e293b', border: '1px solid #f59e0b', borderRadius: '16px', padding: '40px' }}>
                <h3 style={{ marginTop: '0' }}>Step 3: Submit Underwriting Registry Parameters</h3>
                <form onSubmit={handleIntakeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Target Corporate Entity Name *</label>
                    <input type="text" required placeholder="e.g. California Capital Funding LLC" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #475569' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Primary Target Registry Jurisdiction *</label>
                    <select value={californiaCounty} onChange={(e) => setCaliforniaCounty(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #475569' }}>
                      <option value="All Counties">All California Counties (Statewide)</option>
                      <option value="Los Angeles">Los Angeles County</option>
                      <option value="Orange County">Orange County</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Institutional Corporate Email Contact *</label>
                    <input type="email" required placeholder="legal@yourfirm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', color: '#ffffff', border: '1px solid #475569' }} />
                  </div>
                  <button type="submit" style={{ backgroundColor: '#f59e0b', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: '14px', cursor: 'pointer' }}>Authorize Parameters & Proceed to Secure Checkout →</button>
                </form>
              </div>
            )}
          </div>
        )}

        {currentPage === 'api' && (
          <div style={{ padding: '60px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1e293b', padding: '40px', borderRadius: '16px' }}>
              <h1>Institutional API Access Gateway</h1>
              <p style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', color: '#38bdf8' }}>GET /api/v1/ca-registry/search?entity="TARGET_COMPANY_NAME"</p>
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

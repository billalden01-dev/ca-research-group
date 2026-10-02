import React, { useState } from 'react';

type Page = 'home' | 'pricing' | 'legal' | 'api';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [agreed, setAgreed] = useState(false);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTierSelection = (tierName: string) => {
    if (!agreed) {
      alert("Please review and authorize the Institutional Service Agreement by checking the compliance box below before selecting a tier.");
      return;
    }
    alert(`Connecting securely to your active Stripe Checkout page for the ${tierName}...`);
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
          <span onClick={() => handleNavigate('api')} style={{ color: currentPage === 'api' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Developer API</span>
          <span onClick={() => handleNavigate('legal')} style={{ color: currentPage === 'legal' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Service Agreement</span>
        </div>
      </nav>

      {/* MAIN VIEW SCREEN CONFIGURATION CONTAINER */}
      <main style={{ flex: '1' }}>
        
        {/* A. DISRUPTIVE HOME VIEW PITCH */}
        {currentPage === 'home' && (
          <div style={{ padding: '100px 20px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '20px', padding: '6px 16px', fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '30px', letterSpacing: '0.05em' }}>
              SECURE REGISTRY INFRASTRUCTURE • CA CLIENTS ONLY
            </div>
            <h1 style={{ fontSize: '44px', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px', letterSpacing: '-0.02em' }}>
              Proprietary Risk Assessment For Large Funders, <br />
              <span style={{ color: '#f59e0b' }}>Commercial Real Estate, & Elite Law Firms.</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', maxWidth: '720px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
              Scraping the California Secretary of State, County Clerks, and court records to deliver flawless, dual-verified data summaries in under 60 seconds—disrupting standard 3-to-5 day title search timelines completely.
            </p>
            <button onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#f59e0b', color: '#0f172a', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: '16px 32px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}>
              Access Allocation Framework Pricing →
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', maxWidth: '900px', margin: '60px auto 0 auto', borderTop: '1px solid #1e293b', paddingTop: '40px' }}>
              <div style={{ textAlign: 'left', width: '250px' }}>
                <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>&lt; 60 Seconds</div>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>Instant automated collection bypassing the typical 3 to 5 day title company delays.</p>
              </div>
              <div style={{ textAlign: 'left', width: '250px' }}>
                <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>3 CA Gov Portals</div>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>Direct scanning of active California SOS, local County Deeds, and Court dockets.</p>
              </div>
              <div style={{ textAlign: 'left', width: '250px' }}>
                <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>Dual-Fact Checked</div>
                <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0', lineHeight: '1.4' }}>Automated matching algorithms paired with manual review sign-off to catch all errors.</p>
              </div>
            </div>
          </div>
        )}
        {/* B. PRICING TIERS VIEWPORT */}
        {currentPage === 'pricing' && (
          <div style={{ padding: '60px 20px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffffff' }}>Transparent, Institutional Framework Pricing</h1>
              <p style={{ color: '#94a3b8', fontSize: '16px' }}>Select the registry auditing engine allocation tier that meets your compliance workflow constraints.</p>
            </div>
            <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '1000px', margin: '0 auto 60px auto' }}>
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', width: '260px', textAlign: 'center' }}>
                <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0' }}>Standard Framework</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>
                  $499<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span>
                </div>
                <button 
                  onClick={() => handleTierSelection('Standard Framework ($499)')}
                  style={{ width: '100%', backgroundColor: agreed ? '#f59e0b' : '#475569', color: agreed ? '#0f172a' : '#94a3b8', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: agreed ? 1 : 0.6 }}
                >
                  Select This Framework
                </button>
              </div>
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', width: '260px', textAlign: 'center', borderColor: '#f59e0b' }}>
                <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0' }}>Professional Suite</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>
                  $799<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span>
                </div>
                <button 
                  onClick={() => handleTierSelection('Professional Suite ($799)')}
                  style={{ width: '100%', backgroundColor: agreed ? '#f59e0b' : '#475569', color: agreed ? '#0f172a' : '#94a3b8', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: agreed ? 1 : 0.6 }}
                >
                  Select This Framework
                </button>
              </div>
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '30px', width: '260px', textAlign: 'center' }}>
                <h3 style={{ color: '#ffffff', fontSize: '18px', margin: '0' }}>Enterprise Infrastructure</h3>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>
                  $999<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '-10px', marginBottom: '20px' }}>$2,997 upfront for initial 3 months</p>
                <button 
                  onClick={() => handleTierSelection('Enterprise Infrastructure ($999 - 3 Months Upfront)')}
                  style={{ width: '100%', backgroundColor: agreed ? '#f59e0b' : '#475569', color: agreed ? '#0f172a' : '#94a3b8', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', opacity: agreed ? 1 : 0.6 }}
                >
                  Select This Framework
                </button>
              </div>
            </div>
            <div style={{ maxWidth: '640px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: '24px', height: '24px', cursor: 'pointer', accentColor: '#f59e0b' }} />
              <label style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
                I explicitly review and authorize the <span onClick={() => handleNavigate('legal')} style={{ color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer' }}>Institutional Service Agreement</span> text clauses and California registry compliance rules.
              </label>
            </div>
          </div>
        )}

        {/* C. FUTURE DEVELOPER API ENDPOINT VIEW */}
        {currentPage === 'api' && (
          <div style={{ padding: '60px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '10px' }}>FUTURE INTEGRATION ROADMAP</div>
                <h1 style={{ fontSize: '32px', color: '#ffffff', margin: '0' }}>Institutional API Access Gateway</h1>
                <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '5px' }}>Direct system-to-system data streaming pipelines for custom developer networks.</p>
              </div>
              <div style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '15px' }}>
                <p>For large commercial real estate operations, title insurance providers, and high-volume corporate law firms, we are building a direct **REST API backend integration channel**.</p>
                <p style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px solid #334155', fontFamily: 'monospace', color: '#38bdf8', fontSize: '14px' }}>GET /api/v1/ca-registry/search?entity="TARGET_COMPANY_NAME"</p>
                <p style={{ marginTop: '20px' }}>This pipeline will allow your internal underwriting platforms to instantly scrape the California Secretary of State indices, county lien registries, and active court dockets to feed data directly into your native tools in raw JSON strings in under 60 seconds.</p>
              </div>
            </div>
          </div>
        )}

        {/* D. UNIFIED LEGAL AGREEMENT VIEWPORT */}
        {currentPage === 'legal' && (
          <div style={{ padding: '60px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', color: '#ffffff', margin: '0' }}>Institutional Service Agreement</h1>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>CA Research Group Framework Protocols • Last Updated: October 2026</p>
              </div>
              <div style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '15px' }}>
                <p><strong>1. Scope of California Registry Allocations:</strong> This master framework sets forth the terms governing corporate user access to CA Research Group's automated data gathering systems and search pipelines across California state records.</p>
                <p><strong>2. Two-Step Fact-Checking Verification:</strong> Every query passes an automated database match filter (Check 1) and is held for executive manual review (Check 2) to eliminate discrepancies before the final underwriting PDF report is generated.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* COMPLIANCE FOOTER */}
      <footer style={{ backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
        <div>© 2026 CA Research Group. All institutional compliance safeguards reserved.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span onClick={() => handleNavigate('api')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Developer API</span>
          <span onClick={() => handleNavigate('legal')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Institutional Service Agreement</span>
        </div>
      </footer>

    </div>
  );
}

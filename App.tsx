import React, { useState } from 'react';

type Page = 'home' | 'pricing' | 'api';

type Plan = {
  id: string;
  name: string;
  price: number;
  tagline: string;
  featured: boolean;
  features: string[];
};

const SERIF = "Georgia, 'Times New Roman', serif";

const PLANS: Plan[] = [
  {
    id: 'standard',
    name: 'Standard Concierge',
    price: 499,
    tagline: 'For solo professionals and small teams.',
    featured: false,
    features: [
      '10 comprehensive reports per month',
      '1 seat (single user)',
      'Full multi-domain findings matrix',
      'Corporate standing & entity verification',
      'Property lien & filing search',
      'Litigation history scan',
      'PDF download with verified badge',
      '60-day report archive',
      'Email support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Preferred',
    price: 799,
    tagline: 'For active teams needing continuous monitoring.',
    featured: true,
    features: [
      '25 comprehensive reports per month',
      '3 seats included',
      'Automated continuous tracking alerts',
      'Real-time lien & litigation monitoring',
      'Full findings matrix with risk scoring',
      'Priority 60-second pipeline processing',
      'Unlimited report downloads',
      'Email + SMS alert notifications',
      '180-day report archive',
      'Dedicated support channel',
    ],
  },
  {
    id: 'institutional',
    name: 'Institutional Unlimited',
    price: 999,
    tagline: 'For high-volume firms with multi-user teams.',
    featured: false,
    features: [
      'Unlimited comprehensive reports',
      'Includes up to 10 seats',
      'Extra seats at $49/mo each',
      'Role-based access controls',
      'Automated continuous tracking alerts',
      'White-label report branding',
      'Dedicated account manager',
      '365-day report archive',
      'Audit trail exports',
    ],
  },
];

const planLabel = (plan: Plan) => `${plan.name} ($${plan.price})`;

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
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

  const handleTierSelection = (label: string) => {
    setSelectedTier(label);
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
    const stripeUrl = 'https://stripe.com';
    alert("Redirecting to secure Stripe Checkout for " + selectedTier + "...");
    window.location.href = stripeUrl;
  };

  const stepStyle = (n: number): React.CSSProperties => ({
    color: wizardStep === n ? '#d97706' : '#ffffff',
    opacity: wizardStep >= n ? 1 : 0.5,
    fontWeight: 'bold',
  });

  const navLink = (page: Page): React.CSSProperties => ({
    color: '#1e1b4b',
    fontWeight: 'bold',
    cursor: 'pointer',
    paddingBottom: '4px',
    borderBottom: currentPage === page ? '2px solid #d97706' : '2px solid transparent',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'sans-serif', color: '#1e293b' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '15px' }}>
        <img src="/logo-clean.png" alt="CA Research Group" onClick={() => handleNavigate('home')} style={{ height: '72px', maxWidth: '100%', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
          <span onClick={() => handleNavigate('home')} style={navLink('home')}>Solutions</span>
          <span onClick={() => handleNavigate('pricing')} style={navLink('pricing')}>Pricing</span>
          <span onClick={() => handleNavigate('api')} style={navLink('api')}>Enterprise API</span>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: '1', backgroundColor: '#ffffff' }}>

        {/* HOME COMPONENT */}
        {currentPage === 'home' && (
          <div style={{ maxWidth: '850px', margin: '0 auto', padding: '30px 20px 80px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1.1', marginBottom: '4px' }}>Fast California Public-Record Research</h1>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706', marginTop: '4px', marginBottom: '40px' }}>for Hard Money Lenders, Legal Counsel<br />& Real Estate Professionals</h2>
            <p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>Liens, filings, and entity status from official California public records, compiled into a clear PDF report in under 60 seconds.</p>

            <div style={{ maxWidth: '640px', margin: '0 auto 40px auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '14px', color: '#1e1b4b', display: 'block', marginBottom: '4px' }}>⚡ Faster Decisions</strong>
                <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>Whether you are closing a loan or walking away from one, get the public-record picture quickly: liens, filings, and entity status in a report that is typically ready in under a minute.</p>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '14px', color: '#1e1b4b', display: 'block', marginBottom: '4px' }}>🛡️ Fewer Manual Errors</strong>
                <p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>Automated retrieval and a two-step verification check help reduce the typos and missed details that come with manual lookups and hand-keyed intake forms.</p>
              </div>
            </div>

            <button type="button" onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', padding: '14px 32px', cursor: 'pointer' }}>Access Pricing Plans & Intakes →</button>
          </div>
        )}

        {/* PRICING & SUBSCRIPTION WIZARD */}
        {currentPage === 'pricing' && (
          <div>

            {/* HERO BAND */}
            <div style={{ backgroundColor: '#1e1b4b', padding: '56px 20px 120px 20px', textAlign: 'center' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: '44px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 16px 0', lineHeight: '1.15' }}>Transparent Pricing<br />for Every Practice</h1>
              <p style={{ fontSize: '17px', color: '#cbd5e1', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>From individual professionals to multi-user teams. No hidden fees. Cancel anytime.</p>

              {/* STEP STATUS INDICATOR */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginTop: '32px', fontSize: '13px' }}>
                <span style={stepStyle(1)}>1. Choose Plan</span>
                <span style={{ color: '#64748b' }}>➔</span>
                <span style={stepStyle(2)}>2. Compliance Notice</span>
                <span style={{ color: '#64748b' }}>➔</span>
                <span style={stepStyle(3)}>3. Entity Profile Intake</span>
              </div>
            </div>

            <div style={{ position: 'relative', maxWidth: '1140px', margin: '-70px auto 0 auto', padding: '0 20px 80px 20px' }}>

              {/* STEP 1: RENDER TIERS */}
              {wizardStep === 1 && (
                <div>
                  <div style={{ display: 'flex', gap: '28px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch', paddingTop: '20px' }}>
                    {PLANS.map((plan) => {
                      const label = planLabel(plan);
                      const isSelected = selectedTier === label;
                      const dark = plan.featured;
                      return (
                        <div
                          key={plan.id}
                          style={{
                            position: 'relative',
                            backgroundColor: dark ? '#1e1b4b' : '#ffffff',
                            border: isSelected ? '3px solid #d97706' : dark ? '1px solid #1e1b4b' : '1px solid #e2e8f0',
                            boxShadow: isSelected ? '0 0 0 4px rgba(217,119,6,0.2), 0 18px 40px rgba(30,27,75,0.18)' : dark ? '0 22px 44px rgba(30,27,75,0.3)' : '0 10px 28px rgba(30,27,75,0.1)',
                            borderRadius: '20px',
                            padding: '34px 28px 28px 28px',
                            flex: '1 1 300px',
                            maxWidth: '360px',
                            display: 'flex',
                            flexDirection: 'column',
                            transform: dark ? 'translateY(-14px)' : 'none',
                            transition: 'border 150ms ease, box-shadow 150ms ease',
                          }}
                        >
                          {dark && (
                            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#d97706', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', padding: '5px 16px', borderRadius: '999px' }}>Most popular</div>
                          )}
                          <h3 style={{ fontFamily: SERIF, fontSize: '25px', fontWeight: 'bold', color: dark ? '#ffffff' : '#1e1b4b', margin: '0 0 12px 0' }}>{plan.name}</h3>
                          <div style={{ fontFamily: SERIF, fontSize: '50px', fontWeight: 'bold', color: dark ? '#d97706' : '#1e1b4b', lineHeight: '1' }}>${plan.price}<span style={{ fontFamily: 'sans-serif', fontSize: '16px', fontWeight: 'normal', color: dark ? '#cbd5e1' : '#64748b' }}> / mo</span></div>
                          <p style={{ fontSize: '14px', color: dark ? '#cbd5e1' : '#64748b', lineHeight: '1.5', margin: '14px 0 0 0' }}>{plan.tagline}</p>
                          <div style={{ height: '1px', backgroundColor: dark ? 'rgba(255,255,255,0.18)' : '#e2e8f0', margin: '22px 0' }} />
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                            {plan.features.map((feature) => (
                              <li key={feature} style={{ display: 'flex', gap: '10px', fontSize: '14px', lineHeight: '1.4', color: dark ? '#e2e8f0' : '#475569' }}>
                                <span style={{ color: '#d97706', fontWeight: 'bold' }}>✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => handleTierSelection(label)}
                            style={{ width: '100%', backgroundColor: dark ? '#d97706' : '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Select {plan.name}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', maxWidth: '640px', margin: '40px auto 0 auto', lineHeight: '1.6' }}>Reports are compiled from public records and should be independently verified. See the legal notice below.</p>
                </div>
              )}

              {/* STEP 2: COMPLIANCE AGREEMENT */}
              {wizardStep === 2 && (
                <div style={{ maxWidth: '640px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', textAlign: 'center' }}>
                  <h3 style={{ fontFamily: SERIF, color: '#1e1b4b', margin: '0 0 18px 0', fontSize: '22px' }}>Selected plan: <span style={{ color: '#d97706' }}>{selectedTier}</span></h3>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', textAlign: 'left', maxHeight: '200px', overflowY: 'scroll', fontSize: '13px', color: '#475569', marginBottom: '25px', lineHeight: '1.6' }}>
                    <strong>CA RESEARCH GROUP COMPLIANCE ASSURANCE PROVISIONS</strong>
                    <p style={{ margin: '8px 0' }}>By continuing, you acknowledge that reports are compiled from publicly available government records and are only as accurate and complete as the sources they come from. Public records can be incomplete, delayed, or contain errors. You agree to independently verify any information against the original sources before relying on it for any lending, investment, title, or legal decision.</p>
                    <p style={{ margin: '8px 0' }}>CA Research Group is not a law firm and does not provide legal advice. Our reports are not title searches, title commitments, title insurance, appraisals, or legal opinions. Use of our services is subject to our Terms of Service.</p>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#1e1b4b' }}>
                    <input type="checkbox" checked={agreed} onChange={(e) => handleCheckboxChange(e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                    I accept the Compliance Terms & Conditions
                  </label>

                  <button type="button" onClick={() => setWizardStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', display: 'block', margin: '25px auto 0 auto' }}>➔ Back to Plans</button>
                </div>
              )}

              {/* STEP 3: ACCOUNT INTAKE FORM */}
              {wizardStep === 3 && (
                <form onSubmit={handleIntakeSubmit} style={{ maxWidth: '540px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontFamily: SERIF, color: '#1e1b4b', textAlign: 'center', margin: '0 0 6px 0', fontSize: '22px' }}>Complete Your Research Profile</h3>
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', margin: '0 0 6px 0' }}>Plan: {selectedTier}</p>

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

                  <button type="submit" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '10px', padding: '14px', cursor: 'pointer', marginTop: '10px' }}>
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

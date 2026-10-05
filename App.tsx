import React, { useState, useEffect } from 'react';

type Page = 'home' | 'pricing' | 'how';

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

const STEPS = [
  {
    title: 'Tell us who to research',
    body: 'Enter the business or entity name and the California county you want searched. A short intake form keeps the request accurate.',
  },
  {
    title: 'We pull and check the records',
    body: 'Our system retrieves matching records from official California government sources, then runs a two-step verification check on what it finds.',
  },
  {
    title: 'You get a PDF report',
    body: 'Liens, filings, and entity status are compiled into a clear PDF report, typically in under 60 seconds.',
  },
];

const REPORT_ITEMS = [
  'Corporate standing and entity verification',
  'Property lien and filing search',
  'Litigation history scan',
  'A findings matrix that brings it all together',
];

const FAQS = [
  {
    q: 'Is this legal advice?',
    a: 'No. CA Research Group is not a law firm. Our reports are not title searches, title commitments, title insurance, appraisals, or legal opinions.',
  },
  {
    q: 'How current is the information?',
    a: 'Reports are only as current as the government sources they come from at the time of the search. Those sources can lag behind real events, so always verify against the originals.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. Plans are monthly, and you can cancel anytime.',
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
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth < 700);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const selectedPlan = PLANS.find((p) => planLabel(p) === selectedTier);
  const featuredPlan = PLANS.find((p) => p.featured);
  const highlightId = hoveredPlan ?? (selectedPlan ? selectedPlan.id : featuredPlan ? featuredPlan.id : null);

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
      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: isMobile ? '12px 16px' : '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '15px' }}>
        <img src="/logo-clean.png" alt="CA Research Group" onClick={() => handleNavigate('home')} style={{ height: isMobile ? '52px' : '72px', maxWidth: '100%', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: isMobile ? '14px' : '20px', fontSize: isMobile ? '13px' : '14px' }}>
          <span onClick={() => handleNavigate('home')} style={navLink('home')}>Solutions</span>
          <span onClick={() => handleNavigate('how')} style={navLink('how')}>How It Works</span>
          <span onClick={() => handleNavigate('pricing')} style={navLink('pricing')}>Pricing</span>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: '1', backgroundColor: '#ffffff' }}>

        {/* HOME COMPONENT */}
        {currentPage === 'home' && (
          <div style={{ maxWidth: '920px', margin: '0 auto', padding: isMobile ? '20px 16px 56px 16px' : '30px 20px 80px 20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: isMobile ? '28px' : '42px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1.15', marginBottom: '4px' }}>Fast California Public-Record Research</h1>
            <h2 style={{ fontSize: isMobile ? '21px' : '30px', fontWeight: 'bold', color: '#d97706', marginTop: '4px', marginBottom: isMobile ? '28px' : '40px' }}>for Hard Money Lenders, Legal Counsel<br />& Real Estate Professionals</h2>
            <p style={{ fontSize: isMobile ? '16px' : '18px', color: '#475569', maxWidth: '680px', margin: '0 auto 32px auto', lineHeight: '1.65' }}>Liens, filings, and entity status from official California public records, compiled into a clear PDF report in under 60 seconds.</p>

            <div style={{ maxWidth: '680px', margin: '0 auto 40px auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: isMobile ? '18px' : '22px 24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: isMobile ? '16px' : '17px', color: '#1e1b4b', display: 'block', marginBottom: '6px' }}>⚡ Faster Decisions</strong>
                <p style={{ margin: '0', fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6', color: '#475569' }}>Whether you are closing a loan or walking away from one, get the public-record picture quickly: liens, filings, and entity status in a report that is typically ready in under a minute.</p>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: isMobile ? '18px' : '22px 24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: isMobile ? '16px' : '17px', color: '#1e1b4b', display: 'block', marginBottom: '6px' }}>🛡️ Fewer Manual Errors</strong>
                <p style={{ margin: '0', fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6', color: '#475569' }}>Automated retrieval and a two-step verification check help reduce the typos and missed details that come with manual lookups and hand-keyed intake forms.</p>
              </div>
            </div>

            <button type="button" onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: isMobile ? '15px' : '17px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: isMobile ? '14px 22px' : '16px 38px', cursor: 'pointer' }}>Access Pricing Plans & Intakes →</button>
          </div>
        )}

        {/* PRICING & SUBSCRIPTION WIZARD */}
        {currentPage === 'pricing' && (
          <div style={{ backgroundColor: '#ffffff' }}>

            {/* HERO BAND */}
            <div style={{ backgroundColor: '#1e1b4b', padding: isMobile ? '36px 16px 30px 16px' : '56px 20px 48px 20px', textAlign: 'center' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? '30px' : '44px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 14px 0', lineHeight: '1.15' }}>Transparent Pricing<br />for Every Practice</h1>
              <p style={{ fontSize: isMobile ? '15px' : '17px', color: '#cbd5e1', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>From individual professionals to multi-user teams. No hidden fees. Cancel anytime.</p>

              {/* STEP STATUS INDICATOR */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '8px' : '15px', flexWrap: 'wrap', marginTop: isMobile ? '22px' : '32px', fontSize: isMobile ? '12px' : '13px' }}>
                <span style={stepStyle(1)}>1. Choose Plan</span>
                <span style={{ color: '#64748b' }}>➔</span>
                <span style={stepStyle(2)}>2. Compliance Notice</span>
                <span style={{ color: '#64748b' }}>➔</span>
                <span style={stepStyle(3)}>3. Entity Profile Intake</span>
              </div>
            </div>

            <div style={{ position: 'relative', maxWidth: '1140px', margin: '0 auto', padding: isMobile ? '28px 12px 56px 12px' : '56px 20px 80px 20px' }}>

              {/* STEP 1: RENDER TIERS */}
              {wizardStep === 1 && (
                <div>
                  <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '28px', padding: isMobile ? '44px 14px 28px 14px' : '56px 28px 40px 28px' }}>
                  <div style={{ display: 'flex', gap: isMobile ? '36px' : '28px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
                    {PLANS.map((plan) => {
                      const label = planLabel(plan);
                      const isSelected = plan.id === highlightId;
                      const dark = plan.featured;
                      return (
                        <div
                          key={plan.id}
                          onMouseEnter={() => setHoveredPlan(plan.id)}
                          onMouseLeave={() => setHoveredPlan(null)}
                          style={{
                            position: 'relative',
                            backgroundColor: dark ? '#1e1b4b' : '#ffffff',
                            border: isSelected ? '3px solid #d97706' : dark ? '1px solid #1e1b4b' : '1px solid #e2e8f0',
                            boxShadow: isSelected ? '0 0 0 4px rgba(217,119,6,0.2), 0 18px 40px rgba(30,27,75,0.18)' : dark ? '0 22px 44px rgba(30,27,75,0.3)' : '0 10px 28px rgba(30,27,75,0.1)',
                            borderRadius: '20px',
                            padding: isMobile ? '28px 20px 22px 20px' : '34px 28px 28px 28px',
                            flex: isMobile ? '1 1 100%' : '1 1 300px',
                            maxWidth: '360px',
                            display: 'flex',
                            flexDirection: 'column',
                            transform: dark && !isMobile ? 'translateY(-14px)' : 'none',
                            transition: 'border 150ms ease, box-shadow 150ms ease',
                          }}
                        >
                          {dark && (
                            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#d97706', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', padding: '5px 16px', borderRadius: '999px' }}>Most popular</div>
                          )}
                          <h3 style={{ fontFamily: SERIF, fontSize: '25px', fontWeight: 'bold', color: dark ? '#ffffff' : '#1e1b4b', margin: '0 0 12px 0' }}>{plan.name}</h3>
                          <div style={{ fontFamily: SERIF, fontSize: isMobile ? '42px' : '50px', fontWeight: 'bold', color: dark ? '#d97706' : '#1e1b4b', lineHeight: '1' }}>${plan.price}<span style={{ fontFamily: 'sans-serif', fontSize: '16px', fontWeight: 'normal', color: dark ? '#cbd5e1' : '#64748b' }}> / mo</span></div>
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
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', maxWidth: '640px', margin: '40px auto 0 auto', lineHeight: '1.6' }}>Reports are compiled from public records and should be independently verified. See the legal notice below.</p>
                </div>
              )}

              {/* STEP 2: COMPLIANCE AGREEMENT */}
              {wizardStep === 2 && (
                <div style={{ maxWidth: '640px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '22px' : '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', textAlign: 'center' }}>
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
                <form onSubmit={handleIntakeSubmit} style={{ maxWidth: '540px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '22px' : '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

        {/* HOW IT WORKS PAGE */}
        {currentPage === 'how' && (
          <div>
            <div style={{ backgroundColor: '#1e1b4b', padding: isMobile ? '36px 16px' : '56px 20px', textAlign: 'center' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? '30px' : '42px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 16px 0', lineHeight: '1.15' }}>How CA Research Group Works</h1>
              <p style={{ fontSize: '17px', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>Three steps from a name to a report you can act on.</p>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '36px 16px 56px 16px' : '60px 20px 80px 20px' }}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {STEPS.map((step, index) => (
                  <div key={step.title} style={{ flex: '1 1 260px', maxWidth: '300px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', backgroundColor: '#ffffff', boxShadow: '0 10px 28px rgba(30,27,75,0.08)' }}>
                    <div style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 'bold', color: '#d97706', lineHeight: '1' }}>{index + 1}</div>
                    <h3 style={{ fontFamily: SERIF, fontSize: '20px', color: '#1e1b4b', margin: '14px 0 10px 0' }}>{step.title}</h3>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: 0 }}>{step.body}</p>
                  </div>
                ))}
              </div>

              <div style={{ maxWidth: '640px', margin: '64px auto 0 auto' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: '26px', color: '#1e1b4b', margin: '0 0 16px 0' }}>What is in a report</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {REPORT_ITEMS.map((item) => (
                    <li key={item} style={{ display: 'flex', gap: '10px', fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
                      <span style={{ color: '#d97706', fontWeight: 'bold' }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ maxWidth: '640px', margin: '56px auto 0 auto', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: '22px', color: '#1e1b4b', margin: '0 0 10px 0' }}>Sources and limits</h2>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0 }}>Reports are compiled from publicly available California government records. Those sources can lag behind real-world events, contain errors, or be incomplete, so every report should be verified against the original sources before you rely on it. CA Research Group is not a law firm, and our reports are not title searches, title insurance, appraisals, or legal opinions.</p>
              </div>

              <div style={{ maxWidth: '640px', margin: '56px auto 0 auto' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: '26px', color: '#1e1b4b', margin: '0 0 16px 0' }}>Common questions</h2>
                {FAQS.map((faq) => (
                  <div key={faq.q} style={{ borderTop: '1px solid #e2e8f0', padding: '18px 0' }}>
                    <h3 style={{ fontSize: '16px', color: '#1e1b4b', margin: '0 0 6px 0' }}>{faq.q}</h3>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0 }}>{faq.a}</p>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '48px' }}>
                <button type="button" onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', padding: '14px 32px', cursor: 'pointer' }}>See pricing plans →</button>
              </div>
            </div>
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

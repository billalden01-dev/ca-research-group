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

const inputStyle: React.CSSProperties = { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '14px' };
const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 'bold', color: '#1e1b4b' };
const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' };

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
      'Downloadable PDF reports',
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
      'Ongoing monitoring with email alerts',
      'Full findings matrix with risk scoring',
      'Priority processing',
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
      'Ongoing monitoring with email alerts',
      'White-label report branding',
      'Dedicated account manager',
      '365-day report archive',
    ],
  },
];

const STEPS = [
  {
    title: 'Tell us what to research',
    body: 'Enter the property address or APN, the county, and the business or entity name if there is one. A short form keeps each request accurate.',
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

const AFTER_SUBSCRIBE = [
  'Choose a plan, fill in your details and the first property you want researched, then pay securely by card.',
  'We email your company a private link. Bookmark it. There is no password to remember.',
  'Use that link any time to request another report. Each request counts toward your monthly plan.',
  'Your PDF report is sent to your work email.',
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
  const [propertyAddress, setPropertyAddress] = useState('');
  const [reportUse, setReportUse] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleType, setRoleType] = useState('');
  const [purposeCertified, setPurposeCertified] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth < 700);
  const [isShort, setIsShort] = useState<boolean>(typeof window !== 'undefined' && window.innerHeight < 800);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 700);
      setIsShort(window.innerHeight < 800);
    };
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
    setPropertyAddress('');
    setReportUse('');
    setCompanyName('');
    setRoleType('');
    setPurposeCertified(false);
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
    if (!selectedTier || !corporateEmail || !companyName || !roleType || !propertyAddress || !purposeCertified) {
      alert("Please complete all required fields, including the property address and the purpose certification.");
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

  const afterSubscribeBox = (
    <div style={{ maxWidth: '640px', margin: '0 auto', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: isMobile ? '20px' : '24px 28px', textAlign: 'left' }}>
      <h2 style={{ fontFamily: SERIF, fontSize: '22px', color: '#1e1b4b', margin: '0 0 14px 0' }}>What happens after you subscribe</h2>
      <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {AFTER_SUBSCRIBE.map((item) => (
          <li key={item} style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>{item}</li>
        ))}
      </ol>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', overflowX: 'hidden', backgroundColor: '#ffffff', fontFamily: 'sans-serif', color: '#1e293b' }}>

      {/* NAVBAR */}
      <nav style={{ borderBottom: '1px solid #e2e8f0', padding: isMobile ? '12px 16px' : isShort ? '10px 30px' : '15px 30px', display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: isMobile ? '10px' : '15px' }}>
        <img src="/logo-tight.png" alt="CA Research Group" onClick={() => handleNavigate('home')} style={{ height: isMobile ? '44px' : isShort ? '54px' : '62px', maxWidth: '100%', cursor: 'pointer' }} />
        <div style={{ display: 'flex', gap: isMobile ? '14px' : '20px', fontSize: isMobile ? '13px' : '14px' }}>
          <span onClick={() => handleNavigate('home')} style={navLink('home')}>Home</span>
          <span onClick={() => handleNavigate('how')} style={navLink('how')}>How It Works</span>
          <span onClick={() => handleNavigate('pricing')} style={navLink('pricing')}>Pricing</span>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: '1', backgroundColor: '#ffffff' }}>

        {/* HOME COMPONENT */}
        {currentPage === 'home' && (
          <div style={{ maxWidth: '980px', margin: '0 auto', padding: isMobile ? '20px 16px 56px 16px' : isShort ? '14px 20px 56px 20px' : '24px 20px 80px 20px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? '32px' : isShort ? '46px' : '54px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1.12', marginBottom: '6px', textWrap: 'balance' } as React.CSSProperties}>Fast California Public-Record Research</h1>
            <h2 style={{ fontFamily: SERIF, fontSize: isMobile ? '22px' : isShort ? '30px' : '34px', fontWeight: 'normal', color: '#d97706', marginTop: '6px', marginBottom: isMobile ? '24px' : '28px', textWrap: 'balance' } as React.CSSProperties}>for Hard Money Lenders, Legal Counsel{isMobile ? ' ' : <br />}& Real Estate Professionals</h2>
            <p style={{ fontSize: isMobile ? '16px' : isShort ? '17px' : '18px', color: '#475569', maxWidth: '760px', margin: '0 auto 28px auto', lineHeight: '1.65', textWrap: 'balance' } as React.CSSProperties}>Liens, filings, and entity status from official California public records, compiled and checked in two steps into a clear PDF report, typically in under 60 seconds.</p>

            <div style={{ maxWidth: '900px', margin: '0 auto 30px auto', textAlign: 'left', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: isMobile ? '18px' : isShort ? '18px 22px' : '22px 24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontFamily: SERIF, fontSize: isMobile ? '17px' : '19px', color: '#1e1b4b', display: 'block', marginBottom: '6px' }}>⚡ Faster Decisions</strong>
                <p style={{ margin: '0', fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6', color: '#475569' }}>Closing a loan or walking away? Get liens, filings, and entity status, usually in under a minute.</p>
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: isMobile ? '18px' : isShort ? '18px 22px' : '22px 24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontFamily: SERIF, fontSize: isMobile ? '17px' : '19px', color: '#1e1b4b', display: 'block', marginBottom: '6px' }}>🛡️ Fewer Manual Errors</strong>
                <p style={{ margin: '0', fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6', color: '#475569' }}>Automated retrieval and a two-step check reduce typos and missed details from manual lookups.</p>
              </div>
            </div>

            <button type="button" onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: isMobile ? '15px' : '17px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: isMobile ? '14px 22px' : '16px 38px', cursor: 'pointer' }}>See Plans & Pricing →</button>
          </div>
        )}

        {/* PRICING & SUBSCRIPTION WIZARD */}
        {currentPage === 'pricing' && (
          <div style={{ backgroundColor: '#ffffff' }}>

            {/* HERO BAND */}
            <div style={{ backgroundColor: '#1e1b4b', padding: isMobile ? '36px 16px 30px 16px' : '56px 20px 48px 20px', textAlign: 'center' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? '30px' : '44px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 14px 0', lineHeight: '1.15' }}>Transparent Pricing{isMobile ? <br /> : ' '}for Every Practice</h1>
              <p style={{ fontSize: isMobile ? '15px' : '17px', color: '#cbd5e1', maxWidth: isMobile ? '620px' : '900px', margin: '0 auto', lineHeight: '1.6', textWrap: 'balance' } as React.CSSProperties}>From individual professionals to multi-user teams. No hidden fees. Cancel anytime.</p>

              {/* STEP STATUS INDICATOR */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '8px' : '15px', flexWrap: 'wrap', marginTop: isMobile ? '22px' : '32px', fontSize: isMobile ? '12px' : '13px' }}>
                <span style={stepStyle(1)}>1. Choose Plan</span>
                <span style={{ color: '#64748b' }}>➔</span>
                <span style={stepStyle(2)}>2. Review Terms</span>
                <span style={{ color: '#64748b' }}>➔</span>
                <span style={stepStyle(3)}>3. Your Details</span>
              </div>
            </div>

            <div style={{ position: 'relative', maxWidth: '1140px', margin: '0 auto', padding: isMobile ? '28px 12px 56px 12px' : '56px 20px 80px 20px' }}>

              {/* STEP 1: RENDER TIERS */}
              {wizardStep === 1 && (
                <div>
                  <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '28px', padding: isMobile ? '44px 14px 28px 14px' : '56px 28px 40px 28px' }}>
                  <div style={{ display: 'flex', gap: isMobile ? '36px' : '28px', justifyContent: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap', alignItems: 'stretch' }}>
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
                            flex: isMobile ? '1 1 100%' : '1 1 0', minWidth: 0,
                            maxWidth: '360px',
                            display: 'flex',
                            flexDirection: 'column',
                            transform: 'none',
                            transition: 'border 150ms ease, box-shadow 150ms ease',
                          }}
                        >
                          {dark && (
                            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#d97706', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', padding: '5px 16px', borderRadius: '999px' }}>Most popular</div>
                          )}
                          <h3 style={{ fontFamily: SERIF, fontSize: isMobile ? '24px' : '21px', fontWeight: 'bold', color: dark ? '#ffffff' : '#1e1b4b', margin: '0 0 12px 0' }}>{plan.name}</h3>
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
                  <div style={{ marginTop: '40px' }}>{afterSubscribeBox}</div>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', maxWidth: '640px', margin: '28px auto 0 auto', lineHeight: '1.6' }}>* Reports are compiled from public records and should be independently verified. See the legal notice below.</p>
                </div>
              )}

              {/* STEP 2: REVIEW TERMS */}
              {wizardStep === 2 && (
                <div style={{ maxWidth: '640px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '22px' : '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', textAlign: 'center' }}>
                  <h3 style={{ fontFamily: SERIF, color: '#1e1b4b', margin: '0 0 18px 0', fontSize: '22px' }}>Selected plan: <span style={{ color: '#d97706' }}>{selectedTier}</span></h3>
                  <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0', lineHeight: '1.6' }}>Please read and accept these terms to continue.</p>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', textAlign: 'left', maxHeight: '200px', overflowY: 'scroll', fontSize: '13px', color: '#475569', marginBottom: '25px', lineHeight: '1.6' }}>
                    <strong>CA RESEARCH GROUP COMPLIANCE ASSURANCE PROVISIONS</strong>
                    <p style={{ margin: '8px 0' }}>By continuing, you acknowledge that reports are compiled from publicly available government records and are only as accurate and complete as the sources they come from. Public records can be incomplete, delayed, or contain errors. You agree to independently verify any information against the original sources before relying on it for any lending, investment, title, or legal decision.</p>
                    <p style={{ margin: '8px 0' }}>CA Research Group is not a law firm and does not provide legal advice. Our reports are not title searches, title commitments, title insurance, appraisals, or legal opinions. Use of our services is subject to our <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8' }}>Terms of Service</a>.</p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '-12px 0 22px 0' }}>Read the full <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Privacy Policy</a> (open in a new tab).</p>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#1e1b4b' }}>
                    <input type="checkbox" checked={agreed} onChange={(e) => handleCheckboxChange(e.target.checked)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                    I have read and accept these terms
                  </label>

                  <button type="button" onClick={() => setWizardStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', display: 'block', margin: '25px auto 0 auto' }}>➔ Back to Plans</button>
                </div>
              )}

              {/* STEP 3: YOUR DETAILS */}
              {wizardStep === 3 && (
                <form onSubmit={handleIntakeSubmit} style={{ maxWidth: '540px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '22px' : '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontFamily: SERIF, color: '#1e1b4b', textAlign: 'center', margin: '0 0 6px 0', fontSize: '22px' }}>Your Details & First Report</h3>
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', margin: '0 0 6px 0', lineHeight: '1.6' }}>Plan: {selectedTier}<br />Tell us about your firm and the first property you want researched.</p>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Your Company or Firm</label>
                    <input type="text" placeholder="e.g. Pacific Bridge Lending" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} required />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Your Role</label>
                    <select value={roleType} onChange={(e) => setRoleType(e.target.value)} style={inputStyle} required>
                      <option value="">Select one</option>
                      <option value="Hard money lender or lending institution">Hard money lender or lending institution</option>
                      <option value="Attorney or legal counsel">Attorney or legal counsel</option>
                      <option value="Commercial real estate broker">Commercial real estate broker</option>
                      <option value="Real estate investor">Real estate investor</option>
                      <option value="Title or escrow company">Title or escrow company</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Work Email</label>
                    <input type="email" placeholder="name@firm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={inputStyle} required />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Property Address or APN</label>
                    <input type="text" placeholder="e.g. 123 Main St, Los Angeles, or APN" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} style={inputStyle} required />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Business or Entity Name (optional)</label>
                    <input type="text" placeholder="e.g. Acme Holdings LLC" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={inputStyle} />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>County</label>
                    <select value={californiaCounty} onChange={(e) => setCaliforniaCounty(e.target.value)} style={inputStyle}>
                      <option value="All Counties">All Counties (Comprehensive Statewide)</option>
                      <option value="Los Angeles">Los Angeles County</option>
                      <option value="Orange">Orange County</option>
                      <option value="San Francisco">San Francisco County</option>
                      <option value="Santa Clara">Santa Clara County</option>
                      <option value="San Diego">San Diego County</option>
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>How will you use this report? (optional)</label>
                    <select value={reportUse} onChange={(e) => setReportUse(e.target.value)} style={inputStyle}>
                      <option value="">Select one</option>
                      <option value="Loan underwriting">Loan underwriting</option>
                      <option value="Acquisition due diligence">Acquisition due diligence</option>
                      <option value="Title or escrow">Title or escrow</option>
                      <option value="Legal matter">Legal matter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#475569', lineHeight: '1.5', cursor: 'pointer' }}>
                    <input type="checkbox" checked={purposeCertified} onChange={(e) => setPurposeCertified(e.target.checked)} style={{ marginTop: '3px', transform: 'scale(1.15)' }} required />
                    <span>I certify that I will use reports from CA Research Group only for a lawful business purpose related to a real estate, lending, title, or legal matter. I will not use them to decide eligibility for credit, employment, insurance, or housing for any individual, and I understand they contain only information from public sources. I agree to the <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8' }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8' }}>Privacy Policy</a>.</span>
                  </label>

                  <button type="submit" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '10px', padding: '14px', cursor: 'pointer', marginTop: '10px' }}>
                    Continue to Secure Payment ➔
                  </button>

                  <button type="button" onClick={() => { setWizardStep(2); setAgreed(false); }} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', alignSelf: 'center' }}>➔ Back to Terms</button>
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
              <p style={{ fontSize: '17px', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>Three steps from a property to a report you can act on.</p>
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

              <div style={{ margin: '64px auto 0 auto' }}>{afterSubscribeBox}</div>

              <div style={{ maxWidth: '640px', margin: '56px auto 0 auto' }}>
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
          <p style={{ margin: '14px 0 0 0' }}><a href="/terms.html" style={{ color: '#fbbf24', fontWeight: 'bold' }}>Terms of Service</a><span style={{ opacity: 0.6, margin: '0 10px' }}>|</span><a href="/privacy.html" style={{ color: '#fbbf24', fontWeight: 'bold' }}>Privacy Policy</a></p>
        </div>
      </footer>

    </div>
  );
}

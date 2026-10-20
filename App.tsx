import React, { useState, useEffect } from 'react';

type Page = 'home' | 'pricing' | 'how';

type Plan = {
  id: string;
  name: string;
  price: number;
  perReport: number;
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
    id: 'five',
    name: '5 Reports',
    price: 199,
    perReport: 40,
    tagline: 'For occasional deals.',
    featured: false,
    features: [
      '5 reports per month',
      'Who owns and manages the business',
      'UCC liens on the business',
      'Federal court & bankruptcy case search',
      'Sanctions screening (U.S. Treasury OFAC list)',
      'PDF report in about a minute, emailed to you',
      'Private company link: no login or password',
    ],
  },
  {
    id: 'ten',
    name: '10 Reports',
    price: 299,
    perReport: 30,
    tagline: 'For active brokers and lenders.',
    featured: false,
    features: [
      '10 reports per month',
      'Who owns and manages the business',
      'UCC liens on the business',
      'Federal court & bankruptcy case search',
      'Sanctions screening (U.S. Treasury OFAC list)',
      'PDF report in about a minute, emailed to you',
      'Private company link: no login or password',
    ],
  },
  {
    id: 'twentyfive',
    name: '25 Reports',
    price: 499,
    perReport: 20,
    tagline: 'For busy offices and teams.',
    featured: true,
    features: [
      '25 reports per month',
      'Who owns and manages the business',
      'UCC liens on the business',
      'Federal court & bankruptcy case search',
      'Sanctions screening (U.S. Treasury OFAC list)',
      'PDF report in about a minute, emailed to you',
      'Private company link: no login or password',
    ],
  },
];

// A single report, paid once. Shown under the plan cards, not as a card.
const SINGLE: Plan = {
  id: 'single',
  name: 'Single Report',
  price: 59,
  perReport: 59,
  tagline: 'One report, paid once.',
  featured: false,
  features: [],
};

// The two required order-form checkboxes. Keep this wording in sync with api/stripe.ts (AGREEMENT_TEXT).
const AGREE_TERMS_TEXT = 'I agree to the Terms of Service and Privacy Policy.';
const AGREE_ACCURACY_TEXT = 'I understand reports are based on official public records, which may occasionally be incomplete or outdated, and that CA Research Group recommends doing my own due diligence before making any decision.';

const LAUNCH_BANNER = 'Sign up by January 31, 2027 to lock in launch pricing for as long as you stay subscribed.';

const STEPS = [
  {
    title: 'Pick your plan',
    body: 'Choose a monthly plan, or buy a single report for $59.',
  },
  {
    title: 'Enter the business name',
    body: 'Type the LLC or company on the other side of your deal. Business names only, never individuals.',
  },
  {
    title: 'Get your PDF report',
    body: 'In minutes, pulled from official public records: who owns and manages the company, UCC liens, federal court and bankruptcy cases, and government watch-list screening.',
  },
];

const AFTER_SUBSCRIBE = [
  'Choose a plan and accept our Terms of Service, then fill in your details and the first business you want researched, and pay securely by card.',
  'We email your company a private link. Bookmark it. There is no password to remember.',
  'Use that link any time to request another report. Each request counts toward your monthly plan (or uses your single report).',
  'Your PDF report is sent to your work email.',
];

const REPORT_ITEMS = [
  'Who owns and manages the business, with its mailing address and status',
  'The Statement of Information the business filed with the state, when available',
  'UCC liens filed against the business',
  'Sanctions screening against the U.S. Treasury OFAC list',
  'Federal court and bankruptcy case search',
  'A summary of findings, with the sources searched and their limits',
  'A clear PDF report, emailed to you',
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
    q: 'Can I change or cancel my plan?',
    a: 'Yes. Plans are monthly. Upgrade anytime (the difference is prorated) and cancel anytime. Unused reports do not roll over.',
  },
  {
    q: 'Need more than 25 reports a month?',
    a: 'We offer custom plans: 50 reports for $899 a month, or 100 reports for $1,499 a month. Need more than 100? Email william@caresearchgroup.com.',
  },
];

const planLabel = (plan: Plan) => (plan.id === 'single' ? `${plan.name} ($${plan.price})` : `${plan.name} ($${plan.price}/mo)`);

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [agreed, setAgreed] = useState(false);
  const [agreedAccuracy, setAgreedAccuracy] = useState(false);
  const [targetEntityName, setTargetEntityName] = useState('');
  const [californiaCounty, setCaliforniaCounty] = useState('All Counties');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [reportUse, setReportUse] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleType, setRoleType] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [purposeCertified, setPurposeCertified] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
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
    setAgreedAccuracy(false);
    setTargetEntityName('');
    setCorporateEmail('');
    setPropertyAddress('');
    setReportUse('');
    setCompanyName('');
    setRoleType('');
    setReferredBy('');
    setPurposeCertified(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTierSelection = (label: string) => {
    setSelectedTier(label);
    setTimeout(() => setWizardStep(2), 500);
  };


  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !agreedAccuracy) {
      setWizardStep(2);
      return;
    }
    const entityName = targetEntityName.trim();
    if (!selectedTier || !corporateEmail || !companyName || !roleType || !entityName || !purposeCertified) {
      alert("Please complete all required fields, including the business name and the purpose certification.");
      return;
    }
    {
      if (/\b(\d{3}-?\d{2}-?\d{4}|\d{2}-?\d{7})\b/.test(entityName)) {
        alert('Please do not enter tax ID or Social Security numbers. Enter the business name only, for example "Acme Holdings LLC".');
        return;
      }
      if (!/\b(llc|lllp|llp|lp|inc|incorporated|corp|corporation|co|company|companies|ltd|limited|pc|pllc|trust|partnership|partners|holdings?|group|fund|bank|association|assn|foundation|property|properties|investments?|capital|ventures?|enterprises?|realty|development|developers?|lending|mortgage|financial|management|church|ministries|cooperative|coop)\b/i.test(entityName.replace(/\./g, ''))) {
        alert('Business names only. Please include the entity type, for example "Acme Holdings LLC". We do not search individuals.');
        return;
      }
    }
    const plan = [...PLANS, SINGLE].find((p) => planLabel(p) === selectedTier);
    if (!plan) return;
    setPaying(true);
    setPayError('');
    fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: plan.id,
        company: companyName,
        role: roleType,
        email: corporateEmail,
        address: propertyAddress,
        entity: targetEntityName,
        county: californiaCounty,
        use: reportUse,
        certified: purposeCertified,
        agreedTerms: agreed,
        agreedAccuracy,
        referredBy,
      }),
    })
      .then((r) => r.json())
      .then((d: { url?: string; error?: string }) => {
        if (d.url) {
          window.location.href = d.url;
        } else {
          setPayError(d.error || 'The payment page could not be opened. Please try again.');
          setPaying(false);
        }
      })
      .catch(() => {
        setPayError('The payment page could not be opened. Please check your connection and try again.');
        setPaying(false);
      });
  };

  const selectedPlan = PLANS.find((p) => planLabel(p) === selectedTier);
  const featuredPlan = PLANS.find((p) => p.featured);
  const highlightId = hoveredPlan ?? (selectedPlan ? selectedPlan.id : featuredPlan ? featuredPlan.id : null);

  const stepStyle = (n: number): React.CSSProperties => ({
    color: wizardStep === n ? '#d6b968' : '#ffffff',
    opacity: wizardStep >= n ? 1 : 0.5,
    fontWeight: 'bold',
  });

  const navLink = (page: Page): React.CSSProperties => ({
    color: '#1e1b4b',
    fontWeight: 'bold',
    cursor: 'pointer',
    paddingBottom: '4px',
    borderBottom: currentPage === page ? '2px solid #d6b968' : '2px solid transparent',
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
          <a href="/contact.html" style={{ color: '#1e1b4b', fontWeight: 'bold', textDecoration: 'none', paddingBottom: '4px', borderBottom: '2px solid transparent' }}>Contact</a>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: '1', backgroundColor: '#ffffff' }}>

        {/* HOME COMPONENT */}
        {currentPage === 'home' && (
          <div style={{ maxWidth: '980px', margin: '0 auto', padding: isMobile ? '20px 16px 56px 16px' : isShort ? '14px 20px 56px 20px' : '24px 20px 80px 20px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? '32px' : isShort ? '46px' : '54px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1.12', marginBottom: '6px', textWrap: 'balance' } as React.CSSProperties}>Fast California Public-Record Research</h1>
            <h2 style={{ fontFamily: SERIF, fontSize: isMobile ? '22px' : isShort ? '30px' : '34px', fontWeight: 500, color: '#9f7f2b', marginTop: '6px', marginBottom: isMobile ? '24px' : '28px', textWrap: 'balance' } as React.CSSProperties}>for Commercial Real Estate & Business Brokers,{isMobile ? ' ' : <br />}Investors, and Private & Hard Money Lenders</h2>
            <p style={{ fontSize: isMobile ? '14px' : '15px', color: '#64748b', margin: isMobile ? '-14px auto 22px auto' : '-16px auto 26px auto', lineHeight: '1.5', textWrap: 'balance' } as React.CSSProperties}>Also a great fit for attorneys,{isMobile ? <br /> : ' '}landlords, and property managers.</p>
            <p style={{ fontSize: isMobile ? '16px' : isShort ? '17px' : '18px', color: '#475569', maxWidth: '760px', margin: '0 auto 28px auto', lineHeight: '1.65', textWrap: 'balance' } as React.CSSProperties}>Public-record search results, compiled into a clear PDF report in about a minute. Each report shows who owns and manages the business, UCC liens, federal court and bankruptcy records, and U.S. sanctions screening.</p>
            <button type="button" onClick={() => handleNavigate('pricing')} style={{ background: 'linear-gradient(180deg, #e8d28e 0%, #d6b968 100%)', boxShadow: '0 4px 14px rgba(214,185,104,0.35)', color: '#1e1b4b', fontSize: isMobile ? '15px' : '17px', fontWeight: 'bold', border: 'none', borderRadius: '8px', padding: isMobile ? '14px 22px' : '15px 34px', cursor: 'pointer', margin: '0 0 14px 0' }}>Get Started: See Plans & Pricing →</button>
            <div style={{ margin: isMobile ? '0 0 26px 0' : '0 0 30px 0' }}>
              <button type="button" onClick={() => setShowVideo(true)} aria-label="Play the 1-minute video" style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', background: '#ffffff', border: '1px solid #e6d6a3', borderRadius: '14px', padding: '8px 18px 8px 8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,27,75,0.08)', textAlign: 'left', fontFamily: 'inherit' }}>
                <span style={{ position: 'relative', width: isMobile ? '60px' : '68px', height: isMobile ? '60px' : '68px', flex: '0 0 auto', borderRadius: '10px', overflow: 'hidden', display: 'block' }}>
                  <img src="/founder-thumb.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <span style={{ position: 'absolute', right: '4px', bottom: '4px', width: '24px', height: '24px', borderRadius: '50%', background: '#d6b968', border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.5 1.5 L10.5 6 L3.5 10.5 Z" fill="#1e1b4b" /></svg>
                  </span>
                </span>
                <span style={{ display: 'block' }}>
                  <span style={{ display: 'block', color: '#1e1b4b', fontSize: isMobile ? '15px' : '16px', fontWeight: 'bold' }}>Watch the 1-minute video</span>
                  <span style={{ display: 'block', color: '#64748b', fontSize: isMobile ? '13px' : '14px', marginTop: '2px' }}>See how it works, from our founder</span>
                </span>
              </button>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto 30px auto', textAlign: 'left', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px' }}>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: isMobile ? '18px' : isShort ? '18px 22px' : '22px 24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontFamily: SERIF, fontSize: isMobile ? '17px' : '19px', color: '#1e1b4b', display: 'block', marginBottom: '6px' }}>⚡ Faster Decisions</strong>
                <p style={{ margin: '0', fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6', color: '#475569' }}>Closing a loan or walking away? Get public-record search results on a business or property, usually in under a minute.</p>
              </div>
              <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: isMobile ? '18px' : isShort ? '18px 22px' : '22px 24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontFamily: SERIF, fontSize: isMobile ? '17px' : '19px', color: '#1e1b4b', display: 'block', marginBottom: '6px' }}>🛡️ Fewer Manual Errors</strong>
                <p style={{ margin: '0', fontSize: isMobile ? '14px' : '15px', lineHeight: '1.6', color: '#475569' }}>Automated searches pull names and records straight from the source, reducing typos and missed details from manual lookups.</p>
              </div>
            </div>

            <h2 style={{ fontFamily: SERIF, fontSize: isMobile ? '24px' : '30px', color: '#1e1b4b', margin: isMobile ? '8px 0 18px 0' : '12px 0 22px 0' }}>How it works</h2>
            <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '14px' : '20px', textAlign: 'left' }}>
              {STEPS.map((step, index) => (
                <div key={step.title} style={{ flex: 1, display: 'flex', gap: '14px', alignItems: 'flex-start', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: isMobile ? '16px' : '20px 22px', boxShadow: '0 8px 22px rgba(30,27,75,0.06)' }}>
                  <div style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '999px', backgroundColor: '#1e1b4b', color: '#d6b968', fontFamily: SERIF, fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{index + 1}</div>
                  <div>
                    <strong style={{ fontFamily: SERIF, fontSize: isMobile ? '17px' : '18px', color: '#1e1b4b', display: 'block', marginBottom: '4px' }}>{step.title}</strong>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.55', color: '#475569' }}>{step.body}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* PRICING & SUBSCRIPTION WIZARD */}
        {currentPage === 'pricing' && (
          <div style={{ backgroundColor: '#ffffff' }}>

            {/* HERO BAND */}
            <div style={{ backgroundColor: '#1e1b4b', padding: isMobile ? '36px 16px 30px 16px' : '56px 20px 48px 20px', textAlign: 'center' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? '30px' : '44px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 14px 0', lineHeight: '1.15' }}>Transparent Pricing{isMobile ? <br /> : ' '}for Every Practice</h1>
              <p style={{ fontSize: isMobile ? '15px' : '17px', color: '#cbd5e1', maxWidth: isMobile ? '620px' : '900px', margin: '0 auto', lineHeight: '1.6', textWrap: 'balance' } as React.CSSProperties}>Simple monthly plans or a single report. No hidden fees. Upgrade or cancel anytime.</p>

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
                  <div style={{ maxWidth: '760px', margin: isMobile ? '0 auto 28px auto' : '0 auto 36px auto', backgroundColor: '#fbf7ea', border: '1px solid #e6d6a3', borderRadius: '12px', padding: isMobile ? '12px 14px' : '14px 20px', textAlign: 'center', fontSize: isMobile ? '14px' : '15px', fontWeight: 'bold', color: '#6e561c', lineHeight: '1.5', textWrap: 'balance' } as React.CSSProperties}>
                    🎉 {LAUNCH_BANNER}
                  </div>
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
                            border: isSelected ? '3px solid #d6b968' : dark ? '3px solid #1e1b4b' : '3px solid #e2e8f0',
                            boxShadow: isSelected ? '0 0 0 4px rgba(214,185,104,0.28), 0 18px 40px rgba(30,27,75,0.18)' : dark ? '0 22px 44px rgba(30,27,75,0.3)' : '0 10px 28px rgba(30,27,75,0.1)',
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
                            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(180deg, #e8d28e 0%, #d6b968 100%)', color: '#1e1b4b', fontSize: '12px', fontWeight: 'bold', padding: '5px 16px', borderRadius: '999px', whiteSpace: 'nowrap' }}>⭐ Best value</div>
                          )}
                          <h3 style={{ fontFamily: SERIF, fontSize: isMobile ? '24px' : '21px', fontWeight: 'bold', color: dark ? '#ffffff' : '#1e1b4b', margin: '0 0 12px 0' }}>{plan.name}</h3>
                          <div style={{ fontFamily: SERIF, fontSize: isMobile ? '42px' : '50px', fontWeight: 'bold', color: dark ? '#d6b968' : '#1e1b4b', lineHeight: '1' }}>${plan.price}<span style={{ fontFamily: 'sans-serif', fontSize: '16px', fontWeight: 'normal', color: dark ? '#cbd5e1' : '#64748b' }}> / mo</span></div>
                          <div style={{ fontSize: '15px', fontWeight: 'bold', color: dark ? '#d6b968' : '#b8963f', margin: '10px 0 0 0' }}>${plan.perReport} per report</div>
                          <p style={{ fontSize: '14px', color: dark ? '#cbd5e1' : '#64748b', lineHeight: '1.5', margin: '10px 0 0 0' }}>{plan.tagline}</p>
                          <div style={{ height: '1px', backgroundColor: dark ? 'rgba(255,255,255,0.18)' : '#e2e8f0', margin: '22px 0' }} />
                          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                            {plan.features.map((feature) => (
                              <li key={feature} style={{ display: 'flex', gap: '10px', fontSize: '14px', lineHeight: '1.4', color: dark ? '#e2e8f0' : '#475569' }}>
                                <span style={{ color: dark ? '#d6b968' : '#b8963f', fontWeight: 'bold' }}>✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => handleTierSelection(label)}
                            style={{ width: '100%', background: dark ? 'linear-gradient(180deg, #e8d28e 0%, #d6b968 100%)' : '#1e1b4b', color: dark ? '#1e1b4b' : '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Choose {plan.name}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '10px' : '16px', marginTop: isMobile ? '28px' : '34px', textAlign: 'center' }}>
                    <span style={{ fontFamily: SERIF, fontSize: isMobile ? '20px' : '22px', color: '#1e1b4b', fontWeight: 'bold' }}>Just need one? $59.</span>
                    <button type="button" onClick={() => handleTierSelection(planLabel(SINGLE))} style={{ backgroundColor: '#ffffff', color: '#1e1b4b', border: '2px solid #1e1b4b', borderRadius: '10px', padding: '10px 20px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Buy a single report</button>
                  </div>
                  </div>
                  <div style={{ marginTop: '40px' }}>{afterSubscribeBox}</div>
                  <div style={{ maxWidth: '640px', margin: '48px auto 0 auto' }}>
                    <h2 style={{ fontFamily: SERIF, fontSize: isMobile ? '22px' : '26px', color: '#1e1b4b', margin: '0 0 12px 0' }}>Questions</h2>
                    {FAQS.map((faq) => (
                      <div key={faq.q} style={{ borderTop: '1px solid #e2e8f0', padding: '16px 0' }}>
                        <h3 style={{ fontSize: '16px', color: '#1e1b4b', margin: '0 0 6px 0' }}>{faq.q}</h3>
                        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', margin: 0 }}>{faq.a}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', maxWidth: '640px', margin: '12px auto 0 auto', lineHeight: '1.6' }}>* Reports are compiled from public records and should be independently verified. See the legal notice below.</p>
                </div>
              )}

              {/* STEP 2: REVIEW TERMS */}
              {wizardStep === 2 && (
                <div style={{ maxWidth: '640px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '22px' : '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', textAlign: 'center' }}>
                  <h3 style={{ fontFamily: SERIF, color: '#1e1b4b', margin: '0 0 18px 0', fontSize: '22px' }}>Selected plan: <span style={{ color: '#b8963f' }}>{selectedTier}</span></h3>
                  <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0', lineHeight: '1.6' }}>Please read the notice below, then check both boxes to continue.</p>
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '10px', textAlign: 'left', maxHeight: '200px', overflowY: 'scroll', fontSize: '13px', color: '#475569', marginBottom: '25px', lineHeight: '1.6' }}>
                    <strong>CA RESEARCH GROUP COMPLIANCE ASSURANCE PROVISIONS</strong>
                    <p style={{ margin: '8px 0' }}>By continuing, you acknowledge that reports are compiled from publicly available government records and are only as accurate and complete as the sources they come from. Public records can be incomplete, delayed, or contain errors. You agree to independently verify any information against the original sources before relying on it for any lending, investment, title, or legal decision.</p>
                    <p style={{ margin: '8px 0' }}>CA Research Group is not a law firm and does not provide legal advice. Our reports are not title searches, title commitments, title insurance, appraisals, or legal opinions. Use of our services is subject to our <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8' }}>Terms of Service</a>.</p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '-12px 0 22px 0' }}>Read the full <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Privacy Policy</a> (open in a new tab).</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', fontSize: '14px', color: '#1e1b4b', lineHeight: '1.5', backgroundColor: agreed ? '#fbf7ea' : '#ffffff', border: agreed ? '2px solid #d6b968' : '2px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '1px', cursor: 'pointer', accentColor: '#b8963f' }} />
                      <span>I agree to the <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Privacy Policy</a>.</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', fontSize: '14px', color: '#1e1b4b', lineHeight: '1.5', backgroundColor: agreedAccuracy ? '#fbf7ea' : '#ffffff', border: agreedAccuracy ? '2px solid #d6b968' : '2px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                      <input type="checkbox" checked={agreedAccuracy} onChange={(e) => setAgreedAccuracy(e.target.checked)} style={{ width: '20px', height: '20px', flexShrink: 0, marginTop: '1px', cursor: 'pointer', accentColor: '#b8963f' }} />
                      <span>{AGREE_ACCURACY_TEXT}</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={!agreed || !agreedAccuracy}
                    onClick={() => setWizardStep(3)}
                    style={{ width: '100%', marginTop: '22px', backgroundColor: agreed && agreedAccuracy ? '#1e1b4b' : '#cbd5e1', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: agreed && agreedAccuracy ? 'pointer' : 'not-allowed' }}
                  >
                    Continue ➔
                  </button>
                  {(!agreed || !agreedAccuracy) && <p style={{ fontSize: '12px', color: '#64748b', margin: '8px 0 0 0' }}>Please check both boxes to continue.</p>}

                  <button type="button" onClick={() => setWizardStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', display: 'block', margin: '25px auto 0 auto' }}>➔ Back to Plans</button>
                </div>
              )}

              {/* STEP 3: YOUR DETAILS */}
              {wizardStep === 3 && (
                <form onSubmit={handleIntakeSubmit} style={{ maxWidth: '540px', margin: '20px auto 0 auto', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: isMobile ? '22px' : '36px', boxShadow: '0 14px 36px rgba(30,27,75,0.12)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontFamily: SERIF, color: '#1e1b4b', textAlign: 'center', margin: '0 0 6px 0', fontSize: '22px' }}>Your Details & First Report</h3>
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', margin: '0 0 6px 0', lineHeight: '1.6' }}>Plan: {selectedTier}<br />Tell us about your firm and the first business you want researched.</p>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Your Company or Firm</label>
                    <input type="text" placeholder="e.g. Pacific Bridge Lending" value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} required />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Your Role</label>
                    <select value={roleType} onChange={(e) => setRoleType(e.target.value)} style={inputStyle} required>
                      <option value="">Select one</option>
                      <option value="Hard money lender or lending institution">Private or hard money lender (business-purpose loans)</option>
                      <option value="Attorney or legal counsel">Attorney or legal counsel</option>
                      <option value="Commercial real estate brokerage">Commercial real estate brokerage</option>
                      <option value="Business broker">Business broker</option>
                      <option value="Real estate investor">Real estate investor</option>
                      <option value="Title or escrow company">Title or escrow company</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Who referred you? (optional)</label>
                    <input type="text" placeholder="Name of the person or company" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} style={inputStyle} maxLength={100} />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Work Email</label>
                    <input type="email" placeholder="name@firm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={inputStyle} required />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Business Name (businesses only, not individuals)</label>
                    <input type="text" placeholder="e.g. Acme Holdings LLC" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={inputStyle} required />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>Property Address or APN (optional)</label>
                    <input type="text" placeholder="e.g. 123 Main St, Los Angeles, or APN" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} style={inputStyle} />
                  </div>


                  <div style={fieldStyle}>
                    <label style={labelStyle}>How will you use this report? (optional)</label>
                    <select value={reportUse} onChange={(e) => setReportUse(e.target.value)} style={inputStyle}>
                      <option value="">Select one</option>
                      <option value="Loan underwriting">Loan underwriting</option>
                      <option value="Acquisition due diligence">Acquisition due diligence</option>
                      <option value="Legal matter">Legal matter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: '#475569', lineHeight: '1.5', cursor: 'pointer' }}>
                    <input type="checkbox" checked={purposeCertified} onChange={(e) => setPurposeCertified(e.target.checked)} style={{ marginTop: '3px', transform: 'scale(1.15)' }} required />
                    <span>I certify that I will use reports from CA Research Group only for a lawful business purpose related to a real estate, lending, title, or legal matter. I will not use them to decide eligibility for credit, employment, insurance, or housing for any individual, and I understand they contain only information from public sources. I agree to the <a href="/terms.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8' }}>Terms of Service</a> and <a href="/privacy.html" target="_blank" rel="noopener" style={{ color: '#1d4ed8' }}>Privacy Policy</a>.</span>
                  </label>

                  {payError && <p style={{ color: '#b91c1c', fontSize: '13px', textAlign: 'center', margin: '0' }}>{payError}</p>}

                  <button type="submit" disabled={paying} style={{ backgroundColor: paying ? '#94a3b8' : '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '10px', padding: '14px', cursor: paying ? 'wait' : 'pointer', marginTop: '10px' }}>
                    {paying ? 'Opening secure payment...' : 'Continue to Secure Payment ➔'}
                  </button>
                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', margin: '-8px 0 0 0' }}>Payments are processed by Stripe. Your private report link is emailed right after payment.</p>

                  <button type="button" onClick={() => setWizardStep(2)} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', alignSelf: 'center' }}>➔ Back to Terms</button>
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
              <p style={{ fontSize: '17px', color: '#cbd5e1', maxWidth: '460px', margin: '0 auto', lineHeight: '1.6', textWrap: 'balance' } as React.CSSProperties}>Three simple steps, from business name to finished report.</p>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '36px 16px 56px 16px' : '60px 20px 80px 20px' }}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {STEPS.map((step, index) => (
                  <div key={step.title} style={{ flex: '1 1 260px', maxWidth: '300px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', backgroundColor: '#ffffff', boxShadow: '0 10px 28px rgba(30,27,75,0.08)' }}>
                    <div style={{ fontFamily: SERIF, fontSize: '34px', fontWeight: 'bold', color: '#b8963f', lineHeight: '1' }}>{index + 1}</div>
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
                      <span style={{ color: '#b8963f', fontWeight: 'bold' }}>✓</span>
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

      {showVideo && (
        <div onClick={() => setShowVideo(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,14,40,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: '860px' }}>
            <button type="button" aria-label="Close video" onClick={() => setShowVideo(false)} style={{ position: 'absolute', top: '-44px', right: 0, background: 'none', border: 'none', color: '#ffffff', fontSize: '30px', cursor: 'pointer', lineHeight: 1 }}>×</button>
            <video controls autoPlay playsInline poster="/intro-video-poster.jpg" style={{ width: '100%', display: 'block', borderRadius: '14px', border: '3px solid #d6b968', backgroundColor: '#1e1b4b' }}>
              <source src="/intro-video.mp4" type="video/mp4" />
            </video>
            <p style={{ color: '#e2e8f0', fontSize: '14px', textAlign: 'center', margin: '14px 0 0 0', lineHeight: '1.5' }}>
              Coming soon: California county court records for attorneys and lenders.{' '}
              <a href="/contact.html" style={{ color: '#d6b968', fontWeight: 'bold' }}>Join the list</a>
            </p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#1e1b4b', padding: '40px 20px', fontSize: '12px', color: '#ffffff', lineHeight: '1.7', borderTop: '1px solid #334155' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <strong>LEGAL, DISCLAIMER & COMPLIANCE NOTICE</strong>
          <p style={{ margin: '10px 0 0 0', opacity: '0.85' }}>© 2026 CA Research Group, Public Records Verification & Due Diligence. All rights reserved. CA Research Group is not a law firm and does not provide legal advice. Our reports are not title searches, title commitments, title insurance, appraisals, or legal opinions. Reports are compiled from publicly available government records and are only as accurate and complete as the sources they come from. Public records can be incomplete, delayed, or contain errors. Reports are for informational purposes only and should be independently verified against the original sources before you rely on them for any lending, investment, title, or legal decision. Use of our services is subject to our Terms of Service.</p>
          <p style={{ margin: '14px 0 0 0' }}><a href="/terms.html" style={{ color: '#d6b968', fontWeight: 'bold' }}>Terms of Service</a><span style={{ opacity: 0.6, margin: '0 10px' }}>|</span><a href="/privacy.html" style={{ color: '#d6b968', fontWeight: 'bold' }}>Privacy Policy</a><span style={{ opacity: 0.6, margin: '0 10px' }}>|</span><a href="/contact.html" style={{ color: '#d6b968', fontWeight: 'bold' }}>Contact Us</a></p>
        </div>
      </footer>

    </div>
  );
}

import React, { useState } from 'react';
type Page = 'home' | 'pricing' | 'api';
type Tier = 'Starter ($499)' | 'Enterprise Portfolio ($799)' | 'Concierge Premium ($999)';
export default function App() {
const [currentPage, setCurrentPage] = useState('home');
const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
const [wizardStep, setWizardStep] = useState(1);
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
let stripeUrl = 'https://stripe.com';
alert("Redirecting to secure Stripe Checkout for " + selectedTier + "...");
window.location.href = stripeUrl;
};
return (
<div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'sans-serif', color: '#1e293b' }}>
<nav style={{ borderBottom: '1px solid #e2e8f0', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', flexWrap: 'wrap', gap: '15px' }}>
<div onClick={() => handleNavigate('home')} style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
<div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1' }}>C
<span style={{ fontSize: '18px', fontWeight: 'bold', color: '#d97706', lineHeight: '1', marginLeft: '-6px', marginTop: '4px' }}>R

<div style={{ color: '#1e1b4b', fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.05em' }}>CA RESEARCH GROUP
<span style={{ display: 'block', fontSize: '9px', color: '#94a3b8' }}>public records retrieval & analytics

<div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
<span onClick={() => handleNavigate('home')} style={{ color: '#1e1b4b', fontWeight: 'bold', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'home' ? '2px solid #d97706' : '2px solid transparent' }}>Solutions
<span onClick={() => handleNavigate('pricing')} style={{ color: '#1e1b4b', fontWeight: 'bold', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'pricing' ? '2px solid #d97706' : '2px solid transparent' }}>Pricing
<span onClick={() => handleNavigate('api')} style={{ color: '#1e1b4b', fontWeight: 'bold', cursor: 'pointer', paddingBottom: '4px', borderBottom: currentPage === 'api' ? '2px solid #d97706' : '2px solid transparent' }}>Enterprise API

<main style={{ flex: '1', backgroundColor: '#ffffff' }}>
{currentPage === 'home' && (
<div style={{ maxWidth: '850px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
<h1 style={{ fontSize: '42px', fontWeight: 'bold', color: '#1e1b4b', lineHeight: '1.1', marginBottom: '4px' }}>Built for Institutional Risk Management,
<h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#d97706', marginTop: '4px', marginBottom: '40px' }}>Legal Counsel, & Private Funds
<p style={{ fontSize: '15px', color: '#475569', maxWidth: '640px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>Cross-referencing real-time public records, structural entity tracking, and high-velocity litigation indexing for multi-industry compliance and due diligence.
<div style={{ maxWidth: '640px', margin: '0 auto 40px auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
<div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
<strong style={{ fontSize: '14px', color: '#1e1b4b', display: 'block', marginBottom: '4px' }}>🛡️ Definitive Accuracy & Speed
<p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>Utilizing dual-tiered automated verification audits to double-check data integrity, delivering zero-latency risk reporting you can rely on.

<div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
<strong style={{ fontSize: '14px', color: '#1e1b4b', display: 'block', marginBottom: '4px' }}>⚡ Zero Bloat, Instant Results
<p style={{ margin: '0', fontSize: '13px', color: '#475569' }}>Engineered specifically to bypass standard public registries. Get the exact compliance documentation you need instantly.

<button type="button" onClick={() => handleNavigate('pricing')} style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', padding: '14px 32px', cursor: 'pointer' }}>Access Pricing Plans & Intakes →

)}
{currentPage === 'pricing' && (
<div style={{ padding: '40px 20px', maxWidth: '1140px', margin: '0 auto' }}>
<div style={{ textAlign: 'center', marginBottom: '40px' }}>
<h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e1b4b', margin: '0 0 10px 0' }}>Institutional Pricing & Subscriptions
<p style={{ color: '#64748b', fontSize: '14px' }}>Select an operational package tier below to begin legal registry provisioning.
<div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '40px', fontSize: '13px', fontWeight: 'bold' }}>
<span style={{ color: wizardStep === 1 ? '#d97706' : '#1e1b4b', opacity: wizardStep >= 1 ? 1 : 0.4 }}>1. Choose Plan
<span style={{ color: '#cbd5e1' }}>➔
<span style={{ color: wizardStep === 2 ? '#d97706' : '#1e1b4b', opacity: wizardStep >= 2 ? 1 : 0.4 }}>2. Compliance Notice
<span style={{ color: '#cbd5e1' }}>➔
<span style={{ color: wizardStep === 3 ? '#d97706' : '#1e1b4b', opacity: wizardStep >= 3 ? 1 : 0.4 }}>3. Entity Profile Intake
{wizardStep === 1 && (
<div style={{ display: 'flex', gap: '25px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
<div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

<h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Starter
<div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$499<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo
<p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ Continuous Monitor Tracking
✓ Structural Entity Indexing
✓ Real-Time Litigation Scans

<button type="button" onClick={() => handleTierSelection('Starter ($499)')} style={{ width: '100%', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan
<div style={{ backgroundColor: '#ffffff', border: '2px solid #1e1b4b', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>

<div style={{ display: 'inline-block', backgroundColor: '#d97706', color: '#ffffff', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '20px', marginBottom: '10px' }}>MOST POPULAR
<h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Enterprise Portfolio
<div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$799<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo
<p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ Deep Financial Underwriting
✓ Multi-History Litigation Logs
✓ Registry Cross-Referencing

<button type="button" onClick={() => handleTierSelection('Enterprise Portfolio ($799)')} style={{ width: '100%', backgroundColor: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan
<div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', flex: '1 1 280px', maxWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

<h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e1b4b', margin: '0' }}>Concierge Premium
<div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e1b4b', margin: '15px 0' }}>$999<span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo
<p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>✓ Everything in Enterprise
✓ Real-Time Fraud Mitigation Rows
✓ Includes up to 10 user seats

<button type="button" onClick={() => handleTierSelection('Concierge Premium ($999)')} style={{ width: '100%', backgroundColor: '#1e1b4b', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>Select Plan
)}
{wizardStep === 2 && (
<div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
<h3 style={{ color: '#1e1b4b', marginBottom: '15px' }}>Selected Plan: <span style={{ color: '#d97706' }}>{selectedTier}
<div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', textAlign: 'left', maxHeight: '180px', overflowY: 'scroll', fontSize: '12px', color: '#475569', marginBottom: '25px', lineHeight: '1.6' }}>
CA RESEARCH GROUP COMPLIANCE ASSURANCE PROVISIONS
<p style={{ margin: '5px 0' }}>By moving forward, you acknowledge and certify that any public records records retrieved, assets tracked, or automated litigation logs compiled will be processed strictly in accordance with statutory multi-industry compliance guidelines and asset verification regulations.
<p style={{ margin: '5px 0' }}>We are an independent software infrastructure platform. Full asset protection limits are available within our standard platform Terms of Service agreement.
<button type="button" onClick={() => setWizardStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', marginTop: '25px', cursor: 'pointer', display: 'block', margin: '25px auto 0 auto' }}>➔ Back to Plans

)}
{wizardStep === 3 && (
<form onSubmit={handleIntakeSubmit} style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
<h3 style={{ color: '#1e1b4b', textAlign: 'center', margin: '0 0 10px 0' }}>Complete Your Research Profile
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
Target Entity / Corporate Name
<input type="text" placeholder="e.g. Acme Holdings LLC" value={targetEntityName} onChange={(e) => setTargetEntityName(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
California Regional County Jurisdictions
<select value={californiaCounty} onChange={(e) => setCaliforniaCounty(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '14px' }}>
All Counties (Comprehensive Statewide)
Los Angeles County
Orange County
San Francisco County
Santa Clara County
San Diego County

<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
Corporate Work Email
<input type="email" placeholder="name@firm.com" value={corporateEmail} onChange={(e) => setCorporateEmail(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} required />
<button type="submit" style={{ backgroundColor: '#1e1b4b', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', border: 'none', borderRadius: '6px', padding: '14px', cursor: 'pointer', marginTop: '10px' }}>
Proceed to Secure Payment Checkout ➔
<button type="button" onClick={() => { setWizardStep(2); setAgreed(false); }} style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', alignSelf: 'center' }}>➔ Back to Compliance

)}
)}
{currentPage === 'api' && (
<div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
<h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#1e1b4b', marginBottom: '15px' }}>Enterprise API & Data Pipeline
<p style={{ fontSize: '15px', color: '#475569', maxWidth: '580px', margin: '0 auto' }}>Programmatic, raw data streaming interfaces designed for rapid institutional ingestion pipelines. Zero-throttling server hooks for corporate data rooms.

)}
<footer style={{ backgroundColor: '#1e1b4b', padding: '40px 20px', fontSize: '12px', color: '#ffffff', lineHeight: '1.7', borderTop: '1px solid #334155' }}>
<div style={{ maxWidth: '1100px', margin: '0 auto' }}>
LEGAL, DISCLAIMER & COMPLIANCE NOTICE
<p style={{ margin: '10px 0 0 0', opacity: '0.85' }}>© 2026 CA Research Group, Public Records Verification & Due Diligence. All rights reserved. CA Research Group is an independent software infrastructure platform. Full asset protection limits are available within our standard platform Terms of Service.

);
}
</div>
  );
}
}

import React, { useState } from 'react';
import HomePage from './src/pages/HomePage';
import PricingPage from './src/pages/PricingPage';
import LegalPage from './src/pages/LegalPage';

type Page = 'home' | 'pricing' | 'legal';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif' }}>
      
      {/* Sleek Professional Corporate Navbar - Replaces Complex Login Portal */}
      <nav style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div onClick={() => handleNavigate('home')} style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '0.05em' }}>
          CA RESEARCH GROUP
        </div>
        <div style={{ display: 'flex', gap: '30px' }}>
          <span onClick={() => handleNavigate('home')} style={{ color: currentPage === 'home' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Home</span>
          <span onClick={() => handleNavigate('pricing')} style={{ color: currentPage === 'pricing' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Pricing Tiers</span>
          <span onClick={() => handleNavigate('legal')} style={{ color: currentPage === 'legal' ? '#f59e0b' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>Service Agreement</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={{ flex: '1' }}>
        {currentPage === 'home' && <HomePage onNavigate={() => handleNavigate('pricing')} />}
        {currentPage === 'pricing' && <PricingPage />}
        {currentPage === 'legal' && <LegalPage />}
      </main>

      {/* Corporate Compliance Footer */}
      <footer style={{ backgroundColor: '#0f172a', borderTop: '1px solid #1e293b', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
        <div>© 2026 CA Research Group. All institutional compliance safeguards reserved.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span onClick={() => handleNavigate('legal')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Institutional Service Agreement</span>
        </div>
      </footer>

    </div>
  );
}

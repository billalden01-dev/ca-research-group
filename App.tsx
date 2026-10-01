import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { ComplianceFooter } from '@/components/ComplianceFooter';
import { HomePage } from '@/pages/HomePage';
import PricingPage from '@/pages/PricingPage';
import { EnterprisePage } from '@/pages/EnterprisePage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { supabase } from '@/lib/supabase';

type Page = 'home' | 'pricing' | 'enterprise' | 'login' | 'dashboard';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { user, loading } = useAuth();

  const handleNavigate = (page: string) => {
    if (page === 'dashboard' && !user) {
      setCurrentPage('login');
      return;
    }
    if (page === 'login' && user) {
      setCurrentPage('dashboard');
      return;
    }
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (user && currentPage === 'login') {
      setCurrentPage('dashboard');
    }
  }, [user, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const sessionId = params.get('session_id');
    const tier = params.get('tier');

    if (checkoutStatus === 'success' && sessionId && tier && user) {
      (async () => {
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          tier,
          stripe_session_id: sessionId,
          status: 'active',
        }, { onConflict: 'user_id' });

        window.history.replaceState({}, '', window.location.pathname);
        setCurrentPage('dashboard');
      })();
    } else if (checkoutStatus === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-navy-200 border-t-gold-500 rounded-full animate-spin" />
          <p className="text-sm text-navy-400">Loading CA Research Group...</p>
        </div>
      </div>
    );
  }

  const showFooter = currentPage !== 'login';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentPage === 'enterprise' && <EnterprisePage />}
        {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      </main>
      {showFooter && <ComplianceFooter />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

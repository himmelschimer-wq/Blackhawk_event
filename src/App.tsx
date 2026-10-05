import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ChooseYourGame } from './components/ChooseYourGame';
import { UpcomingEventsAndLeaderboard } from './components/UpcomingEventsAndLeaderboard';
import { Footer } from './components/Footer';
import { RegistrationModal } from './components/RegistrationModal';
import { EventRulesBriefingModal } from './components/EventRulesBriefingModal';
import { RulesModal } from './components/RulesModal';
import { AboutModal } from './components/AboutModal';
import { MobileBottomBar } from './components/MobileBottomBar';
import { AdminControlRoom } from './admin/AdminControlRoom';
import { AdminLogin } from './admin/AdminLogin';
import { DiscordCallback } from './components/DiscordCallback';
import { IntroSplash } from './components/IntroSplash';
import { ErrorBoundary } from './components/ErrorBoundary';
import { adminApi } from './lib/adminApi';
import { type DBEventItem } from './components/UpcomingEventsAndLeaderboard';

export function App() {
  const isDiscordCallback = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/discord-callback') || 
    window.location.hash.startsWith('#discord-callback')
  );

  // Admin Panel Access Switch
  // Set to false: Completely removes and blocks all ways to access the admin panel (routes, hash, hotkeys, sessions)
  // The admin components and files remain intact in the codebase without deletion.
  const ADMIN_ACCESS_ENABLED = false;

  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(false);
  const [showIntroSplash, setShowIntroSplash] = useState<boolean>(true);
  const [siteRevealed, setSiteRevealed] = useState(false);

  // Modals state
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedGameForReg, setSelectedGameForReg] = useState<string>('BGMI');
  const [selectedEventIdForReg, setSelectedEventIdForReg] = useState<string | undefined>(undefined);
  const [activeGameFilter, setActiveGameFilter] = useState<string>('ALL');
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [briefingEvent, setBriefingEvent] = useState<DBEventItem | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // Check Auth and sync routes
  const checkCurrentRouteAndAuth = async () => {
    if (!ADMIN_ACCESS_ENABLED) {
      if (typeof window !== 'undefined') {
        // Purge any stored admin credentials/tokens
        try {
          localStorage.removeItem('blackhawk_admin_token');
          localStorage.removeItem('BHT_ADMIN_ROLE');
          localStorage.removeItem('BHT_ADMIN_NAME');
          localStorage.removeItem('admin_token');
        } catch {}

        // Disallow /admin route and #admin hash - redirect cleanly to public site
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        if (path.startsWith('/admin')) {
          window.history.replaceState({}, '', '/');
        }
        if (hash.startsWith('#admin') || hash.startsWith('#/admin')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
      setIsAdminRoute(false);
      setIsAuthenticated(false);
      setAuthChecking(false);
      return;
    }

    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    const isMatch = path.startsWith('/admin') || hash.startsWith('#admin') || hash.startsWith('#/admin');

    if (isMatch) {
      setIsAdminRoute(true);

      // Extract sub-tab if any (e.g. /admin/events or #admin/events)
      let sub = 'dashboard';
      if (path.startsWith('/admin')) {
        const parts = path.replace(/^\/admin\/?/, '').split('/');
        if (parts[0]) sub = parts[0];
      } else if (hash.startsWith('#admin') || hash.startsWith('#/admin')) {
        const parts = hash.replace(/^#\/?admin\/?/, '').split('/');
        if (parts[0]) sub = parts[0];
      }
      const validTabs = ['dashboard', 'calculator', 'events', 'games', 'players', 'registrations', 'leaderboard', 'database', 'settings'];
      if (!validTabs.includes(sub)) sub = 'dashboard';
      setAdminTab(sub);

      try {
        const res = await adminApi.getMe();
        if (res.authenticated && res.admin) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    } else {
      setIsAdminRoute(false);
    }
    setAuthChecking(false);
  };

  useEffect(() => {
    checkCurrentRouteAndAuth();

    const handleRouteChange = () => {
      checkCurrentRouteAndAuth();
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const handleAuthSuccess = () => {
    if (!ADMIN_ACCESS_ENABLED) return;
    setIsAuthenticated(true);
    window.location.hash = '#admin/dashboard';
    setAdminTab('dashboard');
  };

  const handleExitToPublic = () => {
    window.location.hash = '';
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
    setIsAdminRoute(false);
  };

  const openRegistration = (gameName?: string, eventId?: string) => {
    if (gameName) {
      setSelectedGameForReg(gameName);
    }
    setSelectedEventIdForReg(eventId);
    setIsRegModalOpen(true);
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If on Discord OAuth Callback Route
  if (isDiscordCallback) {
    return <DiscordCallback />;
  }

  // If in Admin Mode (permanently disabled to prevent unauthorized access)
  if (ADMIN_ACCESS_ENABLED && isAdminRoute) {
    if (authChecking) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center text-zinc-500 font-tech text-xs">
          Verifying secure admin authorization...
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <ErrorBoundary fallbackTitle="ADMIN LOGIN ERROR">
          <AdminLogin
            onLoginSuccess={handleAuthSuccess}
            onExitToPublic={handleExitToPublic}
          />
        </ErrorBoundary>
      );
    }

    // Authenticated admin control room
    return (
      <ErrorBoundary fallbackTitle="ADMIN CONTROL ROOM ERROR">
        <AdminControlRoom
          onExitToPublicSite={handleExitToPublic}
          initialTab={adminTab}
        />
      </ErrorBoundary>
    );
  }

  // Otherwise, render Public BlackHawk Gaming Experience
  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e5e5] font-sans antialiased selection:bg-[#D71920] selection:text-white">
      {/* Premium Text-Only BlackHawk Intro */}
      {showIntroSplash && (
        <IntroSplash 
          durationMs={2000} 
          onStartReveal={() => setSiteRevealed(true)}
          onComplete={() => {
            setShowIntroSplash(false);
            setSiteRevealed(true);
          }} 
        />
      )}

      {/* Minimal Fixed Navigation Bar (Fixed top-0) */}
      <Navbar
        isRevealed={siteRevealed}
        onRegisterClick={() => openRegistration()}
        onNavigate={scrollToSection}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      <main className={`transition-opacity duration-300 ${siteRevealed ? 'opacity-100' : 'opacity-0'}`}>
        {/* Asymmetric Cinematic Hero Section */}
        <Hero
          isRevealed={siteRevealed}
          onRegisterClick={() => openRegistration()}
          onExploreClick={() => scrollToSection('events')}
        />

        {/* Choose Your Game Section */}
        <div className={siteRevealed ? 'animate-site-content' : 'opacity-0'}>
          <ChooseYourGame
            selectedGame={activeGameFilter !== 'ALL' ? activeGameFilter : undefined}
            onSelectGame={(gameName) => {
              setActiveGameFilter(gameName);
              scrollToSection('events');
            }}
            onViewEventsForGame={(gameName) => {
              setActiveGameFilter(gameName);
              scrollToSection('events');
            }}
          />
        </div>

        {/* Upcoming Events Editorial Table & Leaderboard */}
        <div className={siteRevealed ? 'animate-site-content' : 'opacity-0'}>
          <UpcomingEventsAndLeaderboard
            activeGameFilter={activeGameFilter}
            onSelectGameFilter={(gameName) => setActiveGameFilter(gameName)}
            onSelectEvent={(event) => {
              setBriefingEvent(event);
              setIsBriefingModalOpen(true);
            }}
            onRegisterEvent={(gameName, eventId) => openRegistration(gameName, eventId)}
            onViewAllEvents={() => {
              setActiveGameFilter('ALL');
              scrollToSection('games');
            }}
            onViewFullLeaderboard={() => scrollToSection('leaderboard')}
          />
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <div className={siteRevealed ? 'animate-site-footer' : 'opacity-0'}>
        <Footer
          onNavigate={scrollToSection}
          onOpenRules={() => setIsRulesModalOpen(true)}
          onOpenAbout={() => setIsAboutModalOpen(true)}
        />
      </div>

      {/* Floating Mobile Bottom Navigation Dock (Fixed bottom-3) */}
      <MobileBottomBar
        isRevealed={siteRevealed}
        onRegisterClick={() => scrollToSection('events')}
        onNavigate={scrollToSection}
        onOpenRules={() => setIsRulesModalOpen(true)}
      />

      {/* Event-Specific & BlackHawk General Rules Briefing Modal */}
      <EventRulesBriefingModal
        isOpen={isBriefingModalOpen}
        event={briefingEvent}
        onClose={() => {
          setIsBriefingModalOpen(false);
          setBriefingEvent(null);
        }}
        onProceedToRegister={(gameName, eventId) => {
          setIsBriefingModalOpen(false);
          setBriefingEvent(null);
          openRegistration(gameName, eventId);
        }}
      />

      {/* Esports Multi-Game Registration Modal */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => {
          setIsRegModalOpen(false);
          setSelectedEventIdForReg(undefined);
        }}
        preSelectedGame={selectedGameForReg}
        preSelectedEventId={selectedEventIdForReg}
      />

      {/* Tournament Rules Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* About BlackHawk Organization Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
}

export default App;

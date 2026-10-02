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
import { adminApi } from './lib/adminApi';
import { type DBEventItem } from './components/UpcomingEventsAndLeaderboard';

export function App() {
  const isDiscordCallback = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/discord-callback') || 
    window.location.hash.startsWith('#discord-callback')
  );

  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [adminTab, setAdminTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

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
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    const isMatch = path.startsWith('/admin') || hash.startsWith('#admin') || hash.startsWith('#/admin');

    if (isMatch) {
      setIsAdminRoute(true);

      // Extract sub-tab if any (e.g. /admin/events or #admin/events)
      let sub = 'dashboard';
      if (path.startsWith('/admin/')) {
        sub = path.replace('/admin/', '').split('/')[0];
      } else if (hash.includes('/')) {
        sub = hash.split('/')[1];
      }
      if (sub === 'login') sub = 'dashboard';
      setAdminTab(sub || 'dashboard');

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

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin Hotkeys: Ctrl + Shift + A or Alt + A or Ctrl + Alt + A
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') ||
        (e.altKey && e.key.toLowerCase() === 'a') ||
        (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        handleOpenAdmin();
      }
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenAdmin = () => {
    window.location.hash = '#admin/dashboard';
    checkCurrentRouteAndAuth();
  };

  const handleAuthSuccess = () => {
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

  // If in Admin Mode
  if (isAdminRoute) {
    if (authChecking) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center text-zinc-500 font-tech text-xs">
          Verifying secure admin authorization...
        </div>
      );
    }

    // Requirement 2: Unauthenticated /admin/* redirects to /admin/login
    if (!isAuthenticated) {
      return (
        <AdminLogin
          onLoginSuccess={handleAuthSuccess}
          onExitToPublic={handleExitToPublic}
        />
      );
    }

    // Authenticated admin control room
    return (
      <AdminControlRoom
        onExitToPublicSite={handleExitToPublic}
        initialTab={adminTab}
      />
    );
  }

  // Otherwise, render Public BlackHawk Esports Experience
  return (
    <div className="min-h-screen bg-[#080808] text-[#e5e5e5] font-sans antialiased selection:bg-[#D71920] selection:text-white">
      {/* Minimal Fixed Navigation Bar */}
      <Navbar
        onRegisterClick={() => openRegistration()}
        onNavigate={scrollToSection}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      <main>
        {/* Asymmetric Cinematic Hero Section */}
        <Hero
          onRegisterClick={() => openRegistration()}
          onExploreClick={() => scrollToSection('events')}
        />

        {/* Choose Your Game Section */}
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

        {/* Upcoming Events Editorial Table & Leaderboard */}
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
      </main>

      {/* Clean Minimal Footer */}
      <Footer
        onNavigate={scrollToSection}
        onOpenRules={() => setIsRulesModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {/* Floating Mobile Bottom Navigation Dock */}
      <MobileBottomBar
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

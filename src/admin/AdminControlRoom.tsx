import React, { useState, useEffect } from 'react';
import { adminApi, type AdminUser } from '../lib/adminApi';
import { AdminDashboard } from './AdminDashboard';
import { AdminEvents } from './AdminEvents';
import { AdminGames } from './AdminGames';
import { AdminPlayers } from './AdminPlayers';
import { AdminRegistrations } from './AdminRegistrations';
import { AdminLeaderboard } from './AdminLeaderboard';
import { AdminPointsCalculator } from './AdminPointsCalculator';
import { AdminDatabaseView } from './AdminDatabaseView';
import { AdminSettings } from './AdminSettings';
import { 
  LayoutDashboard, 
  Gamepad2, 
  Trophy,
  Users, 
  ClipboardCheck, 
  Award, 
  Calculator,
  Database,
  Settings,
  LogOut, 
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { sfx } from '../utils/sfx';

interface AdminControlRoomProps {
  onExitToPublicSite: () => void;
  initialTab?: string;
}

export const AdminControlRoom: React.FC<AdminControlRoomProps> = ({ onExitToPublicSite, initialTab }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    adminApi.getMe().then((res) => {
      if (res.admin) setAdminUser(res.admin);
    });
  }, []);

  const handleLogout = async () => {
    sfx.playClick();
    await adminApi.logout();
    onExitToPublicSite();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'calculator', label: 'Points Calculator', icon: <Calculator className="w-4 h-4 text-[#ff4d4d]" /> },
    { id: 'events', label: 'Events', icon: <Trophy className="w-4 h-4" /> },
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'players', label: 'Players', icon: <Users className="w-4 h-4" /> },
    { id: 'registrations', label: 'Registrations', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Award className="w-4 h-4" /> },
    { id: 'database', label: 'Database', icon: <Database className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSelectTab = (id: string) => {
    sfx.playClick();
    setActiveTab(id);
    setMobileSidebarOpen(false);
    window.location.hash = `#admin/${id}`;
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#E8E5DF] flex font-sans antialiased selection:bg-[#D71920] selection:text-white">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0A0A0A] border-r border-white/10 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/assets/blackhawk_navbar_logo.png"
              alt="BlackHawk"
              className="h-7 w-auto object-contain"
            />
            <div>
              <span className="font-display font-black text-sm text-white tracking-widest block uppercase">
                BLACKHAWK ADMIN
              </span>
              <span className="text-[10px] font-tech text-red-400 font-bold uppercase tracking-wider block">
                CONTROL ROOM
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items (Requirement 17) */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded font-tech text-xs uppercase tracking-wider font-bold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#D71920] text-white shadow-[0_0_15px_rgba(215,25,32,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Navigation: View Website, Logout */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-black/40">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-tech text-zinc-400">
            <span className="truncate">{adminUser?.displayName || 'Admin'}</span>
            <span className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 text-[9px] font-bold">
              {adminUser?.role || 'ADMIN'}
            </span>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              onExitToPublicSite();
            }}
            className="w-full py-2 px-3 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-tech text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#D71920]" />
            <span>View Website</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-1.5 px-3 rounded text-zinc-500 hover:text-red-400 font-tech text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-1.5 rounded lg:hidden text-zinc-400 hover:text-white"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-tech text-xs text-zinc-400 uppercase tracking-wider hidden sm:inline">
                BLACKHAWK DATABASE ENGINE: <strong className="text-white">ONLINE</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-tech text-xs">
            <button
              onClick={() => {
                sfx.playClick();
                onExitToPublicSite();
              }}
              className="px-3 py-1.5 rounded bg-black/60 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>View Website</span>
              <ExternalLink className="w-3 h-3 text-[#D71920]" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden bg-[#0A0A0A] border-b border-white/10 p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded font-tech text-xs uppercase tracking-wider font-bold ${
                  activeTab === item.id ? 'bg-[#D71920] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                onClick={onExitToPublicSite}
                className="flex-1 py-1.5 text-center text-xs font-tech text-zinc-300 bg-white/5 rounded"
              >
                View Website
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-1.5 text-center text-xs font-tech text-red-400 bg-red-950/40 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Submodule Viewport */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={(tab) => handleSelectTab(tab)} />}
          {activeTab === 'calculator' && <AdminPointsCalculator />}
          {activeTab === 'events' && <AdminEvents />}
          {activeTab === 'games' && <AdminGames />}
          {activeTab === 'players' && <AdminPlayers />}
          {activeTab === 'registrations' && <AdminRegistrations />}
          {activeTab === 'leaderboard' && <AdminLeaderboard />}
          {activeTab === 'database' && <AdminDatabaseView />}
          {activeTab === 'settings' && <AdminSettings />}
        </main>
      </div>
    </div>
  );
};

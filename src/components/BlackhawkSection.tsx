import React from 'react';
import { BlackhawkLogo } from './BlackhawkLogo';
import { Shield, Users, Trophy, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';

export const BlackhawkSection: React.FC = () => {
  return (
    <section className="relative py-14 sm:py-16 bg-[#050505] border-t border-white/5">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-red-600/10 blur-[180px] pointer-events-none rounded-full"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="bg-gradient-to-b from-[#100808] via-[#0c0c10] to-[#07070a] border border-red-600/40 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          {/* Top Notch Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 px-5 py-0.5 bg-[#e10600] text-white font-tech font-bold text-[9px] uppercase tracking-[0.2em] clip-badge">
            TOURNAMENT HOST & OPERATOR
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-3">
            
            {/* Left: Brand Identity & Manifesto */}
            <div className="lg:col-span-7 space-y-4">
              <BlackhawkLogo size="md" showSubtitle={true} />

              <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight">
                POWERED BY <span className="text-[#e10600]">BLACKHAWK TEAM</span>
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                Blackhawk Team hosts and operates the Gaming League, bringing players together across competitive and casual gaming events.
              </p>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                We believe in creating authentic, transparent tournament opportunities. From custom mobile lobbies to strategy board games, our events reward dedication, teamwork, and the thrill of competition.
              </p>

              {/* Host Pillars */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-center">
                  <Shield className="w-4 h-4 text-[#ff2a2a] mx-auto mb-1" />
                  <span className="font-tech text-[11px] text-white font-bold block uppercase">VERIFIED</span>
                  <span className="text-[9px] font-tech text-zinc-400 uppercase">Fair Play</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-center">
                  <Trophy className="w-4 h-4 text-[#ff2a2a] mx-auto mb-1" />
                  <span className="font-tech text-[11px] text-white font-bold block uppercase">ACTIVE</span>
                  <span className="text-[9px] font-tech text-zinc-400 uppercase">Prize Pools</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-center">
                  <Users className="w-4 h-4 text-[#ff2a2a] mx-auto mb-1" />
                  <span className="font-tech text-[11px] text-white font-bold block uppercase">COMMUNITY</span>
                  <span className="text-[9px] font-tech text-zinc-400 uppercase">First Focus</span>
                </div>
              </div>
            </div>

            {/* Right: Official Community Hub (Discord Only) */}
            <div className="lg:col-span-5 bg-black/70 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-tech text-[11px] text-zinc-400 uppercase tracking-widest block font-bold">
                  OFFICIAL COMMUNITY HUB
                </span>
                <span className="flex items-center gap-1 text-[10px] font-tech text-[#5865F2] uppercase font-bold bg-[#5865F2]/10 px-2 py-0.5 rounded border border-[#5865F2]/20">
                  <Sparkles className="w-3 h-3" /> EXCLUSIVE
                </span>
              </div>

              {/* Discord Main Card */}
              <a
                href="https://discord.gg/WrxHsKbHY"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-3 p-5 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 hover:border-[#5865F2]/60 text-white transition-all group shadow-lg hover:shadow-[#5865F2]/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5865F2] flex items-center justify-center text-white shadow-md">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-tech font-bold text-base block text-white group-hover:text-[#5865F2] transition-colors">
                        BLACKHAWK DISCORD
                      </span>
                      <span className="text-xs text-zinc-400 font-sans">
                        Official match announcements &amp; room credentials
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-tech text-zinc-400">
                  <span>discord.gg/WrxHsKbHY</span>
                  <span className="text-[#5865F2] font-semibold group-hover:underline">Join Server &rarr;</span>
                </div>
              </a>

              <p className="text-[11px] text-zinc-500 font-sans leading-relaxed">
                All tournament room IDs, passwords, brackets, and live support are distributed exclusively via Discord.
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

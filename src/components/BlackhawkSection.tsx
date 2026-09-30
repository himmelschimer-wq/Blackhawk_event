import React from 'react';
import { BlackhawkLogo } from './BlackhawkLogo';
import { Shield, Users, Trophy, Mail, MessageSquare, Play, Camera, ExternalLink } from 'lucide-react';

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
                We believe in creating authentic, transparent esports opportunities. From custom mobile lobbies to strategy board tournaments, our events reward dedication, continuous improvement, and the thrill of competition.
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
                  <span className="font-tech text-[11px] text-white font-bold block uppercase">₹2,000</span>
                  <span className="text-[9px] font-tech text-zinc-400 uppercase">Season Pool</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 text-center">
                  <Users className="w-4 h-4 text-[#ff2a2a] mx-auto mb-1" />
                  <span className="font-tech text-[11px] text-white font-bold block uppercase">COMMUNITY</span>
                  <span className="text-[9px] font-tech text-zinc-400 uppercase">First Focus</span>
                </div>
              </div>
            </div>

            {/* Right: Official Community Hub & Contact */}
            <div className="lg:col-span-5 bg-black/70 border border-white/10 rounded-xl p-5 space-y-3">
              <span className="font-tech text-[11px] text-zinc-400 uppercase tracking-widest block font-bold">
                OFFICIAL COMMUNITY & SOCIAL CHANNELS
              </span>

              {/* Discord */}
              <a
                href="https://discord.gg/WrxHsKbHY"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                  <div>
                    <span className="font-tech font-bold text-sm block">BLACKHAWK DISCORD</span>
                    <span className="text-[11px] text-zinc-400 font-sans">Join the official community</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </a>

              {/* Instagram */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("INSTAGRAM LINK — ADD LINK (Provided by Blackhawk Team)");
                }}
                className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-[#E1306C]" />
                  <div>
                    <span className="font-tech font-bold text-sm block">INSTAGRAM</span>
                    <span className="text-[11px] text-zinc-400 font-sans">INSTAGRAM LINK — ADD LINK</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </a>

              {/* YouTube */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("YOUTUBE LINK — ADD LINK (Provided by Blackhawk Team)");
                }}
                className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Play className="w-5 h-5 text-[#FF0000]" />
                  <div>
                    <span className="font-tech font-bold text-sm block">YOUTUBE STREAM</span>
                    <span className="text-[11px] text-zinc-400 font-sans">YOUTUBE LINK — ADD LINK</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </a>

              {/* Contact Email */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-tech text-zinc-400">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#ff2a2a]" />
                  <span>DIRECT INQUIRIES:</span>
                </span>
                <a href="mailto:contact@blackhawkteam.gg" className="text-white hover:text-[#ff3333] transition-colors font-mono">
                  contact@blackhawkteam.gg
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';

interface IntroSplashProps {
  onComplete: () => void;
  durationMs?: number;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ 
  onComplete, 
  durationMs = 3000 
}) => {
  const [clashed, setClashed] = useState(false);
  const [ignited, setIgnited] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Blade clash timing at 600ms
    const clashTimer = setTimeout(() => {
      setClashed(true);
    }, 600);

    // 2. Emblem ignition & logo glint at 850ms
    const igniteTimer = setTimeout(() => {
      setIgnited(true);
    }, 850);

    // 3. Smooth progress ticker
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
    }, 16);

    // 4. Smooth cinematic fadeout before end
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, durationMs - 450);

    // 5. Complete transition
    const doneTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(clashTimer);
      clearTimeout(igniteTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#040406] flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-500 ease-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* ─── Volumetric Atmospheric Lighting ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(215,25,32,0.28)_0%,rgba(10,5,8,0.75)_50%,#030305_100%)] pointer-events-none" />
      
      {/* ─── Precision Cybernetic Crosshair Grid ─── */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ff3b44_1px,transparent_1px)] [background-size:28px_28px]"
      />

      {/* ─── Subtle Drifting Embers ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#ff4a4a] opacity-60 animate-ember"
            style={{
              left: `${10 + (i * 7.5)}%`,
              bottom: `${(i % 4) * 8}%`,
              animationDuration: `${5 + (i % 5) * 1.5}s`,
              animationDelay: `${(i % 3) * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* ─── Top Minimal Progress Line ─── */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/5 z-30">
        <div 
          className="h-full bg-gradient-to-r from-[#80080C] via-[#D71920] to-[#ff4d4d] shadow-[0_0_15px_#ff2a2a] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ─── Skip Button ─── */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-5 right-5 sm:top-7 sm:right-7 z-40 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 hover:border-[#D71920]/80 text-[10px] font-mono font-semibold text-zinc-400 hover:text-white uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-2xl backdrop-blur-md group"
      >
        <span>SKIP</span>
        <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 font-mono">[ESC]</span>
      </button>

      {/* ─── Center Cinematic Stage ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-4xl text-center">
        
        {/* ─── Crossed Katanas & BlackHawk Crest Assembly ─── */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center mb-3">
          
          {/* ─── Impact Shockwave & Core Flares ─── */}
          {clashed && (
            <>
              {/* Expanding Shockwave Wavefront */}
              <div className="absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full border-2 border-[#ff3b44] animate-ping opacity-75 pointer-events-none duration-700" />
              <div className="absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full border border-white/30 animate-ping opacity-40 pointer-events-none duration-1000 delay-75" />
              
              {/* Central Anamorphic Core Glint */}
              <div className="absolute w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-r from-[#ff3333] via-white to-[#D71920] rounded-full blur-3xl opacity-80 animate-pulse pointer-events-none" />

              {/* Ultra-sharp Horizontal Anamorphic Laser Glint */}
              <div className="absolute w-72 sm:w-[500px] md:w-[620px] h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_25px_#ffffff] pointer-events-none" />
              <div className="absolute w-48 sm:w-[320px] h-[3px] bg-gradient-to-r from-transparent via-[#ff4d4d] to-transparent shadow-[0_0_20px_#ff2222] pointer-events-none" />

              {/* Kinetic Spark Particles */}
              {[...Array(24)].map((_, i) => {
                const angle = (i * 360) / 24;
                const rad = (angle * Math.PI) / 180;
                const dist = 110 + (i % 3) * 25;
                const tx = Math.cos(rad) * dist;
                const ty = Math.sin(rad) * dist;
                return (
                  <div
                    key={i}
                    className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#fff5a0] shadow-[0_0_10px_#ff2a2a] pointer-events-none"
                    style={{
                      transform: `translate(${tx}px, ${ty}px) scale(${i % 2 === 0 ? 1.2 : 0.6})`,
                      transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                      opacity: fadingOut ? 0 : 0.9,
                    }}
                  />
                );
              })}
            </>
          )}

          {/* ─── Left Titanium Katana Blade ─── */}
          <div
            className={`absolute transition-all duration-600 ease-out origin-center pointer-events-none ${
              clashed 
                ? 'translate-x-0 translate-y-0 rotate-[42deg] scale-100 opacity-95' 
                : '-translate-x-72 -translate-y-72 rotate-[15deg] scale-125 opacity-0'
            }`}
          >
            <svg
              viewBox="0 0 100 460"
              className="w-28 h-64 sm:w-40 sm:h-88 md:w-44 md:h-96 drop-shadow-[0_0_25px_rgba(215,25,32,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bladeSpineLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="crimsonHamonLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#ff4d4d" />
                  <stop offset="85%" stopColor="#D71920" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>
                <linearGradient id="darkHabaki" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#78350f" />
                  <stop offset="100%" stopColor="#171717" />
                </linearGradient>
              </defs>

              {/* Katana Curved Kissaki (Tip) & Blade Body */}
              <path
                d="M 50 10 Q 52 35 52 300 L 46 300 Q 46 45 47 18 Z"
                fill="url(#bladeSpineLeft)"
                stroke="#ffffff"
                strokeWidth="0.5"
              />

              {/* Glowing Crimson Hamon Edge */}
              <path
                d="M 46 18 Q 45 120 45 300 L 48 300 Q 48 120 49 20 Z"
                fill="url(#crimsonHamonLeft)"
                className="animate-pulse"
              />

              {/* Laser Fuller Groove (Blood Groove) */}
              <line x1="49" y1="35" x2="49" y2="285" stroke="#ff2a2a" strokeWidth="1.2" strokeLinecap="round" />

              {/* Habaki (Blade Collar) */}
              <rect x="44" y="300" width="10" height="14" rx="1.5" fill="url(#darkHabaki)" stroke="#f59e0b" strokeWidth="0.75" />

              {/* Tsuba (Crossguard) - Octagonal Samurai Guard */}
              <polygon
                points="24,316 40,314 58,314 74,316 70,323 58,324 40,324 28,323"
                fill="#0f0f12"
                stroke="#D71920"
                strokeWidth="1.5"
              />
              <circle cx="49" cy="318.5" r="2.5" fill="#ff3333" />

              {/* Tsuka (Handle with Diamond-Wrap Weave) */}
              <rect x="45" y="324" width="8" height="92" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1" />
              {[...Array(9)].map((_, idx) => (
                <polygon
                  key={idx}
                  points={`45,${328 + idx * 9.5} 49,${332 + idx * 9.5} 53,${328 + idx * 9.5} 49,${324 + idx * 9.5}`}
                  fill="#D71920"
                  opacity="0.85"
                />
              ))}

              {/* Kashira (End Cap Pommel) */}
              <polygon points="45,416 53,416 51,424 47,424" fill="#18181b" stroke="#D71920" strokeWidth="1" />
            </svg>
          </div>

          {/* ─── Right Titanium Katana Blade ─── */}
          <div
            className={`absolute transition-all duration-600 ease-out origin-center pointer-events-none ${
              clashed 
                ? 'translate-x-0 translate-y-0 -rotate-[42deg] scale-100 opacity-95' 
                : 'translate-x-72 -translate-y-72 -rotate-[15deg] scale-125 opacity-0'
            }`}
          >
            <svg
              viewBox="0 0 100 460"
              className="w-28 h-64 sm:w-40 sm:h-88 md:w-44 md:h-96 drop-shadow-[0_0_25px_rgba(215,25,32,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Katana Curved Kissaki (Tip) & Blade Body */}
              <path
                d="M 50 10 Q 52 35 52 300 L 46 300 Q 46 45 47 18 Z"
                fill="url(#bladeSpineLeft)"
                stroke="#ffffff"
                strokeWidth="0.5"
              />

              {/* Glowing Crimson Hamon Edge */}
              <path
                d="M 46 18 Q 45 120 45 300 L 48 300 Q 48 120 49 20 Z"
                fill="url(#crimsonHamonLeft)"
                className="animate-pulse"
              />

              {/* Laser Fuller Groove (Blood Groove) */}
              <line x1="49" y1="35" x2="49" y2="285" stroke="#ff2a2a" strokeWidth="1.2" strokeLinecap="round" />

              {/* Habaki (Blade Collar) */}
              <rect x="44" y="300" width="10" height="14" rx="1.5" fill="url(#darkHabaki)" stroke="#f59e0b" strokeWidth="0.75" />

              {/* Tsuba (Crossguard) - Octagonal Samurai Guard */}
              <polygon
                points="24,316 40,314 58,314 74,316 70,323 58,324 40,324 28,323"
                fill="#0f0f12"
                stroke="#D71920"
                strokeWidth="1.5"
              />
              <circle cx="49" cy="318.5" r="2.5" fill="#ff3333" />

              {/* Tsuka (Handle with Diamond-Wrap Weave) */}
              <rect x="45" y="324" width="8" height="92" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1" />
              {[...Array(9)].map((_, idx) => (
                <polygon
                  key={idx}
                  points={`45,${328 + idx * 9.5} 49,${332 + idx * 9.5} 53,${328 + idx * 9.5} 49,${324 + idx * 9.5}`}
                  fill="#D71920"
                  opacity="0.85"
                />
              ))}

              {/* Kashira (End Cap Pommel) */}
              <polygon points="45,416 53,416 51,424 47,424" fill="#18181b" stroke="#D71920" strokeWidth="1" />
            </svg>
          </div>

          {/* ─── OFFICIAL BLACKHAWK EMBLEM (Front & Center) ─── */}
          <div
            className={`relative z-20 transition-all duration-700 ease-out transform ${
              clashed ? 'scale-100 opacity-100 translate-y-0' : 'scale-70 opacity-0 translate-y-6'
            }`}
          >
            {/* Pulsing Aura Halo Behind Crest */}
            <div className={`absolute -inset-6 bg-[#D71920]/45 rounded-full blur-2xl transition-opacity duration-500 pointer-events-none ${
              ignited ? 'opacity-100 scale-110' : 'opacity-20 scale-95'
            }`} />

            {/* Official High-Resolution Crest */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex items-center justify-center filter drop-shadow-[0_12px_40px_rgba(215,25,32,0.9)]">
              <img
                src="/assets/blackhawk_emblem_hq.png"
                alt="BlackHawk Official Crest"
                className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_0_24px_rgba(255,42,42,0.7)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/blackhawk_navbar_logo.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── Official Brand Typography & Esports Banner ─── */}
        <div
          className={`transition-all duration-700 delay-100 ease-out transform ${
            clashed 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-6 opacity-0 scale-95'
          }`}
        >
          {/* Subtle Category Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-[#ff4d4d] font-tech text-[10px] sm:text-xs font-bold uppercase tracking-[0.28em] mb-2.5 shadow-[0_0_15px_rgba(215,25,32,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse" />
            <span>OFFICIAL ESPORTS LEAGUE</span>
          </div>

          {/* Majestic Title "BLACKHAWK" */}
          <h1 className="font-cinzel font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-[0.2em] text-white relative leading-none">
            <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
              BLACK
            </span>
            <span className="bg-gradient-to-r from-[#ff4444] via-[#D71920] to-[#990c12] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(215,25,32,0.95)] ml-1">
              HAWK
            </span>
          </h1>

          {/* Geometric Diamond Divider */}
          <div className="flex items-center justify-center gap-3 my-2.5">
            <div className="w-12 sm:w-24 h-[1px] bg-gradient-to-r from-transparent to-[#D71920]" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#D71920] shadow-[0_0_8px_#ff2a2a]" />
            <div className="w-12 sm:w-24 h-[1px] bg-gradient-to-l from-transparent to-[#D71920]" />
          </div>

          {/* Sub-tagline */}
          <p className="font-tech text-[11px] sm:text-xs md:text-sm text-zinc-400 font-bold uppercase tracking-[0.35em]">
            RISE TO GLORY • DOMINATE THE ARENA
          </p>
        </div>
      </div>

      {/* ─── Bottom Status Ticker ─── */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-ping" />
        <span className="font-tech text-[10px] text-zinc-500 font-bold uppercase tracking-[0.25em]">
          INITIALIZING ARENA LOBBY
        </span>
      </div>
    </div>
  );
};

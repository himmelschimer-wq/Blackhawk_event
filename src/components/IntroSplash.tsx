import React, { useState, useEffect } from 'react';

interface IntroSplashProps {
  onComplete: () => void;
  durationMs?: number;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ 
  onComplete, 
  durationMs = 2800 
}) => {
  const [clashed, setClashed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Blade clash timing at 500ms
    const clashTimer = setTimeout(() => {
      setClashed(true);
    }, 500);

    // 2. Smooth progress ticker
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
    }, 16);

    // 3. Smooth cinematic fadeout before end
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, durationMs - 400);

    // 4. Complete transition
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
    }, 180);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#070709] flex flex-col items-center justify-center overflow-hidden select-none transition-all duration-400 ease-out ${
        fadingOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* ─── Subtle Ambient Vignette (Restrained & Dark) ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(215,25,32,0.08)_0%,rgba(7,7,9,0.92)_60%,#050507_100%)] pointer-events-none" />
      
      {/* ─── Subtle Geometric Grid ─── */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* ─── Top Minimal Progress Line ─── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.04] z-30">
        <div 
          className="h-full bg-gradient-to-r from-[#80080C] via-[#D71920] to-[#e53935] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ─── Skip Button ─── */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-5 right-5 sm:top-6 sm:right-6 z-40 px-3 py-1 rounded-md bg-black/40 hover:bg-black/80 border border-white/10 hover:border-white/20 text-[10px] font-mono text-zinc-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-sm"
      >
        <span>SKIP</span>
        <span className="text-[9px] text-zinc-600 font-mono">[ESC]</span>
      </button>

      {/* ─── Center Presentation Stage ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-3xl text-center">
        
        {/* ─── Crossed Katanas & BlackHawk Crest ─── */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center mb-4">
          
          {/* Subtle Center Glow */}
          {clashed && (
            <div className="absolute w-36 h-36 bg-[#D71920]/15 rounded-full blur-2xl pointer-events-none transition-opacity duration-500" />
          )}

          {/* ─── Left Blade ─── */}
          <div
            className={`absolute transition-all duration-500 ease-out origin-center pointer-events-none ${
              clashed 
                ? 'translate-x-0 translate-y-0 rotate-[42deg] scale-100 opacity-90' 
                : '-translate-x-60 -translate-y-60 rotate-[15deg] scale-110 opacity-0'
            }`}
          >
            <svg
              viewBox="0 0 100 460"
              className="w-24 h-56 sm:w-36 sm:h-72 md:w-40 md:h-80 drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="bladeLeftClean" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="40%" stopColor="#cbd5e1" />
                  <stop offset="85%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Blade Body */}
              <path
                d="M 50 10 Q 52 35 52 300 L 46 300 Q 46 45 47 18 Z"
                fill="url(#bladeLeftClean)"
                stroke="#ffffff"
                strokeWidth="0.5"
              />

              {/* Clean Red Edge Line */}
              <path
                d="M 46 18 Q 45 120 45 300 L 48 300 Q 48 120 49 20 Z"
                fill="#D71920"
                opacity="0.85"
              />

              {/* Blade Fuller */}
              <line x1="49" y1="40" x2="49" y2="280" stroke="#ff4d4d" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

              {/* Habaki */}
              <rect x="44" y="300" width="10" height="12" rx="1" fill="#78350f" stroke="#d97706" strokeWidth="0.5" />

              {/* Tsuba */}
              <polygon
                points="26,314 40,312 58,312 72,314 68,321 58,322 40,322 30,321"
                fill="#121216"
                stroke="#D71920"
                strokeWidth="1.2"
              />

              {/* Tsuka (Handle) */}
              <rect x="45" y="322" width="8" height="90" rx="1.5" fill="#09090b" stroke="#27272a" strokeWidth="1" />
              {[...Array(8)].map((_, idx) => (
                <polygon
                  key={idx}
                  points={`45,${326 + idx * 10.5} 49,${330 + idx * 10.5} 53,${326 + idx * 10.5} 49,${322 + idx * 10.5}`}
                  fill="#D71920"
                  opacity="0.7"
                />
              ))}

              {/* Kashira */}
              <polygon points="45,412 53,412 51,420 47,420" fill="#18181b" stroke="#D71920" strokeWidth="1" />
            </svg>
          </div>

          {/* ─── Right Blade ─── */}
          <div
            className={`absolute transition-all duration-500 ease-out origin-center pointer-events-none ${
              clashed 
                ? 'translate-x-0 translate-y-0 -rotate-[42deg] scale-100 opacity-90' 
                : 'translate-x-60 -translate-y-60 -rotate-[15deg] scale-110 opacity-0'
            }`}
          >
            <svg
              viewBox="0 0 100 460"
              className="w-24 h-56 sm:w-36 sm:h-72 md:w-40 md:h-80 drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Blade Body */}
              <path
                d="M 50 10 Q 52 35 52 300 L 46 300 Q 46 45 47 18 Z"
                fill="url(#bladeLeftClean)"
                stroke="#ffffff"
                strokeWidth="0.5"
              />

              {/* Clean Red Edge Line */}
              <path
                d="M 46 18 Q 45 120 45 300 L 48 300 Q 48 120 49 20 Z"
                fill="#D71920"
                opacity="0.85"
              />

              {/* Blade Fuller */}
              <line x1="49" y1="40" x2="49" y2="280" stroke="#ff4d4d" strokeWidth="1" strokeLinecap="round" opacity="0.7" />

              {/* Habaki */}
              <rect x="44" y="300" width="10" height="12" rx="1" fill="#78350f" stroke="#d97706" strokeWidth="0.5" />

              {/* Tsuba */}
              <polygon
                points="26,314 40,312 58,312 72,314 68,321 58,322 40,322 30,321"
                fill="#121216"
                stroke="#D71920"
                strokeWidth="1.2"
              />

              {/* Tsuka (Handle) */}
              <rect x="45" y="322" width="8" height="90" rx="1.5" fill="#09090b" stroke="#27272a" strokeWidth="1" />
              {[...Array(8)].map((_, idx) => (
                <polygon
                  key={idx}
                  points={`45,${326 + idx * 10.5} 49,${330 + idx * 10.5} 53,${326 + idx * 10.5} 49,${322 + idx * 10.5}`}
                  fill="#D71920"
                  opacity="0.7"
                />
              ))}

              {/* Kashira */}
              <polygon points="45,412 53,412 51,420 47,420" fill="#18181b" stroke="#D71920" strokeWidth="1" />
            </svg>
          </div>

          {/* ─── BlackHawk Official Crest ─── */}
          <div
            className={`relative z-20 transition-all duration-600 ease-out transform ${
              clashed ? 'scale-100 opacity-100 translate-y-0' : 'scale-80 opacity-0 translate-y-4'
            }`}
          >
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]">
              <img
                src="/assets/blackhawk_emblem_hq.png"
                alt="BlackHawk Crest"
                className="w-full h-full object-contain select-none pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/blackhawk_navbar_logo.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── Clean Professional Brand Typography ─── */}
        <div
          className={`transition-all duration-600 ease-out transform ${
            clashed 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-4 opacity-0'
          }`}
        >
          {/* Title */}
          <h1 className="font-cinzel font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-[0.22em] text-white leading-none">
            <span>BLACK</span>
            <span className="text-[#D71920] ml-1">HAWK</span>
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-[11px] sm:text-xs text-zinc-400 font-medium uppercase tracking-[0.28em] mt-3">
            COMMUNITY TOURNAMENTS & GAMING
          </p>
        </div>
      </div>
    </div>
  );
};

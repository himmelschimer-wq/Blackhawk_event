import React, { useState, useEffect } from 'react';

interface IntroSplashProps {
  onComplete: () => void;
  onStartReveal?: () => void;
  durationMs?: number;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ 
  onComplete, 
  onStartReveal,
  durationMs = 2000 
}) => {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // 1. Cross-fade trigger: start revealing homepage underneath slightly before unmounting
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
      if (onStartReveal) onStartReveal();
    }, durationMs - 450);

    // 2. Complete intro and unmount
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
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [durationMs, onComplete, onStartReveal]);

  const handleSkip = () => {
    setFadingOut(true);
    if (onStartReveal) onStartReveal();
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-[#000000] flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-400 ease-out ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      {/* ─── Skip Text Action ─── */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-6 right-6 sm:top-8 sm:right-8 z-50 text-[10px] sm:text-xs font-mono tracking-[0.2em] text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer uppercase focus:outline-none"
      >
        [ESC] SKIP
      </button>

      {/* ─── Centered Stage ─── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-5xl text-center">
        
        {/* 1. Primary Title: Mask Wipe Left-to-Right */}
        <div className="intro-title-wrapper overflow-hidden my-1 sm:my-2">
          <h1 className="intro-title font-cinzel font-black text-3xl sm:text-4xl md:text-5xl lg:text-5xl tracking-[0.18em] sm:tracking-[0.26em] uppercase text-white leading-none">
            <span>BLACK</span>
            <span className="text-[#D71920] ml-1">HAWK</span>
          </h1>
        </div>

        {/* 2. Subtitle Animated Below BLACKHAWK */}
        <p className="intro-subtitle text-[9px] sm:text-[11px] md:text-xs font-semibold tracking-[0.26em] sm:tracking-[0.34em] uppercase text-[#8e8e93] mt-2.5 sm:mt-3.5">
          COMMUNITY TOURNAMENTS &amp; GAMING
        </p>
      </div>
    </div>
  );
};

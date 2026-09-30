import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BlackhawkLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Geometric Hawk Shield Crest */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_6px_rgba(225,6,0,0.35)] transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="hawkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff2a2a" />
              <stop offset="50%" stopColor="#e10600" />
              <stop offset="100%" stopColor="#690000" />
            </linearGradient>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a1a1e" />
              <stop offset="100%" stopColor="#08080a" />
            </linearGradient>
          </defs>

          {/* Outer Shield with tech bevel */}
          <polygon
            points="50,4 92,26 80,88 50,98 20,88 8,26"
            fill="url(#shieldGrad)"
            stroke="#e10600"
            strokeWidth="3"
            strokeLinejoin="bevel"
          />

          {/* Inner Accent Line */}
          <polygon
            points="50,12 84,30 74,80 50,88 26,80 16,30"
            fill="none"
            stroke="rgba(255, 30, 30, 0.3)"
            strokeWidth="1.5"
          />

          {/* Aggressive Hawk Wing Left */}
          <polygon
            points="50,28 28,46 36,66 50,56"
            fill="url(#hawkGrad)"
          />

          {/* Aggressive Hawk Wing Right */}
          <polygon
            points="50,28 72,46 64,66 50,56"
            fill="url(#hawkGrad)"
          />

          {/* Central Stealth Hawk Beak & Head */}
          <polygon
            points="50,22 57,36 50,48 43,36"
            fill="#ffffff"
          />

          {/* Glowing Optical Core */}
          <polygon
            points="50,33 53,39 50,45 47,39"
            fill="#e10600"
          />

          {/* Lower Talons / Chevron */}
          <polygon
            points="50,62 62,72 50,82 38,72"
            fill="#e10600"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-display font-black tracking-wider uppercase text-white ${textSizes[size]}`}>
            BLACKHAWK
          </span>
          <span className={`font-display font-black tracking-wider uppercase text-[#e10600] ${textSizes[size]}`}>
            TEAM
          </span>
        </div>
        {showSubtitle && (
          <span className="font-tech text-[10px] tracking-[0.22em] uppercase text-zinc-400 font-semibold mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e10600] inline-block animate-pulse"></span>
            HOST / ORGANIZER
          </span>
        )}
      </div>
    </div>
  );
};

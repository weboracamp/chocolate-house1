import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showTagline = false }) => {
  const sizeMap = {
    sm: 'w-14 h-10',
    md: 'w-24 h-16',
    lg: 'w-36 h-24',
    xl: 'w-52 h-36',
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Authentic Oval Chocolate House Badge */}
      <div
        className={`${sizeMap[size]} relative flex items-center justify-center rounded-full p-[3px] shadow-lg transition-transform hover:scale-105`}
        style={{
          background: 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 30%, #996515 70%, #F5EDE0 100%)',
          boxShadow: '0 6px 20px rgba(43, 20, 14, 0.35)',
        }}
      >
        <div
          className="w-full h-full rounded-full flex flex-col items-center justify-center px-3 py-1 relative overflow-hidden border border-[#D4AF37]/50"
          style={{
            background: 'radial-gradient(circle, #3D1C13 0%, #220E08 70%, #120603 100%)',
          }}
        >
          {/* Subtle Sunburst Ray lines in background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
            backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 50%, #D4AF37 0deg 10deg, transparent 10deg 20deg)',
          }} />

          {/* Top Arabic: شوكلت */}
          <div className="relative z-10 text-center leading-none">
            <span
              className="font-black tracking-tight"
              style={{
                fontFamily: "'Cairo', sans-serif",
                fontSize: size === 'sm' ? '12px' : size === 'md' ? '18px' : size === 'lg' ? '28px' : '40px',
                color: '#FFF5E1',
                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.6)',
                fontWeight: 900,
              }}
            >
              شوكلت
            </span>
          </div>

          {/* Center Brand Script English Accent */}
          <div className="relative z-10 flex items-center justify-between w-full px-1 -my-0.5 opacity-90">
            <span
              className="text-[6px] md:text-[9px] tracking-wider text-[#F7E7A9] font-serif italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Chocolate
            </span>
            <span className="w-1 h-1 rounded-full bg-[#D4AF37] mx-0.5" />
            <span
              className="text-[6px] md:text-[9px] tracking-wider text-[#F7E7A9] font-serif italic"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              House
            </span>
          </div>

          {/* Bottom Arabic: هاوس */}
          <div className="relative z-10 text-center leading-none">
            <span
              className="font-black tracking-tight"
              style={{
                fontFamily: "'Cairo', sans-serif",
                fontSize: size === 'sm' ? '13px' : size === 'md' ? '19px' : size === 'lg' ? '30px' : '42px',
                color: '#FFF5E1',
                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(212,175,55,0.6)',
                fontWeight: 900,
              }}
            >
              هاوس
            </span>
          </div>
        </div>
      </div>

      {showTagline && (
        <span className="mt-1 text-[11px] font-medium tracking-wide text-[#D4AF37]">
          AL HAWAMDEYA • GIZA
        </span>
      )}
    </div>
  );
};

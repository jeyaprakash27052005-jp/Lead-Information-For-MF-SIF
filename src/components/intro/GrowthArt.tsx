import React, { useEffect, useState } from 'react';

const TAGLINES = ['SIP better.', 'Invest regularly.', 'Let time do the work.', 'Mutual funds, made simple.'];

/** One line at a time swaps in and out */
export const RotatingTagline: React.FC<{ className?: string }> = ({ className }) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % TAGLINES.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <span key={i} className={`tag-swap inline-block ${className || ''}`} aria-live="polite">
      {TAGLINES[i]}
    </span>
  );
};

const BARS = [34, 52, 70, 94, 122, 156];

/** Looping picture: monthly investments (coins) drop in, the bars grow and the growth line is drawn */
export const GrowthArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 420 260" className={className} role="img" aria-label="Animated picture of regular investments growing over time">
    <defs>
      <linearGradient id="ga-bar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#34d399" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <line x1="24" y1="222" x2="396" y2="222" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
    {BARS.map((h, i) => (
      <rect
        key={i}
        className="grow-y"
        style={{ ['--d' as string]: `${i * 220}ms` }}
        x={42 + i * 58}
        y={222 - h}
        width="36"
        height={h}
        rx="8"
        fill="url(#ga-bar)"
      />
    ))}
    <path
      className="draw-line"
      style={{ ['--len' as string]: 460, ['--d' as string]: '300ms' }}
      d="M60 196 C 110 182, 150 172, 176 156 S 250 124, 292 100 S 360 60, 390 40"
      fill="none"
      stroke="#fbbf24"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <circle cx="390" cy="40" r="7" fill="#fbbf24" />
    <circle cx="390" cy="40" r="7" fill="none" stroke="#fbbf24" strokeWidth="3" className="pulse-ring" />
    {/* monthly coins */}
    {[0, 1, 2].map((i) => (
      <g key={i} className="coin-drop" style={{ ['--d' as string]: `${i * 850}ms` }}>
        <circle cx={90 + i * 118} cy="60" r="12" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
        <text x={90 + i * 118} y="65" textAnchor="middle" fontSize="13" fontWeight="900" fill="#78350f">
          ₹
        </text>
      </g>
    ))}
    <g className="float-y" style={{ ['--d' as string]: '200ms' }}>
      <rect x="26" y="20" rx="10" width="70" height="26" fill="#312e81" />
      <text x="61" y="38" textAnchor="middle" fontSize="12" fontWeight="800" fill="#c7d2fe">
        SIP
      </text>
    </g>
    <g className="float-y" style={{ ['--d' as string]: '900ms' }}>
      <rect x="318" y="8" rx="10" width="80" height="26" fill="#064e3b" />
      <text x="358" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill="#a7f3d0">
        Growth
      </text>
    </g>
  </svg>
);

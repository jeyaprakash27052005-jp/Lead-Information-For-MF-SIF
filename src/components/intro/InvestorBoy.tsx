import React from 'react';

interface BoyProps {
  variant: 'a' | 'b';
  className?: string;
}

/**
 * Two original flat-style investor characters (drawn in SVG, no images).
 * Put the class "walking" or "celebrate" on a parent element to animate them.
 */
export const InvestorBoy: React.FC<BoyProps> = ({ variant, className }) => {
  const a = variant === 'a';
  const jacket = a ? '#f97316' : '#1f2937';
  const jacketDark = a ? '#c2410c' : '#111827';
  const pants = a ? '#1e3a8a' : '#cbd5e1';
  const skin = a ? '#f1c27d' : '#e0ac69';
  return (
    <svg viewBox="0 0 120 200" className={className} style={{ overflow: "visible" }} role="img" aria-label="An investor character">
      <ellipse cx="60" cy="193" rx="34" ry="5" fill="#0f172a" opacity="0.12" />
      <g className="body">
        {/* legs */}
        <g className="limb leg-a">
          <rect x="38" y="118" width="19" height="62" rx="9" fill={pants} />
          <rect x="33" y="174" width="28" height="13" rx="6.5" fill={a ? '#f8fafc' : '#0f172a'} />
        </g>
        <g className="limb leg-b">
          <rect x="63" y="118" width="19" height="62" rx="9" fill={pants} />
          <rect x="59" y="174" width="28" height="13" rx="6.5" fill={a ? '#f8fafc' : '#0f172a'} />
        </g>
        {/* backpack (A) */}
        {a && <rect x="24" y="68" width="20" height="46" rx="8" fill={jacketDark} />}
        {/* torso */}
        <rect x="34" y="60" width="52" height="64" rx="15" fill={jacket} />
        <rect x="56" y="62" width="8" height="60" rx="3" fill={jacketDark} opacity="0.35" />
        {/* arms */}
        <g className="limb arm-a">
          <rect x="22" y="64" width="15" height="50" rx="7.5" fill={jacket} />
          <circle cx="29.5" cy="116" r="7.5" fill={skin} />
          {a && (
            <g>
              <circle cx="19" cy="104" r="14" fill="#fbbf24" stroke="#b45309" strokeWidth="2.5" />
              <text x="19" y="110" textAnchor="middle" fontSize="17" fontWeight="800" fill="#92400e">
                ₹
              </text>
            </g>
          )}
        </g>
        <g className="limb arm-b">
          <rect x="83" y="64" width="15" height="50" rx="7.5" fill={jacket} />
          <circle cx="90.5" cy="116" r="7.5" fill={skin} />
          {!a && (
            <g>
              <rect x="86" y="86" width="34" height="26" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2" />
              <polyline points="91,106 98,100 104,103 111,93 116,90" fill="none" stroke="#34d399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </g>
        {/* head */}
        <circle cx="60" cy="38" r="23" fill={skin} />
        {a ? (
          <g>
            <path d="M36 34 Q60 6 84 34 L84 30 Q60 -2 36 30 Z" fill="#2563eb" />
            <path d="M34 34 Q60 22 86 34 L97 38 Q60 29 34 38 Z" fill="#1d4ed8" />
          </g>
        ) : (
          <path d="M37 34 Q38 12 60 12 Q82 12 83 34 Q74 22 60 22 Q46 22 37 34 Z" fill="#111827" />
        )}
        {a ? (
          <g fill="#1f2937">
            <circle cx="51" cy="42" r="2.4" />
            <circle cx="69" cy="42" r="2.4" />
          </g>
        ) : (
          <g>
            <rect x="42" y="37" width="16" height="9" rx="4" fill="#0f172a" />
            <rect x="62" y="37" width="16" height="9" rx="4" fill="#0f172a" />
            <rect x="57" y="40" width="6" height="2.5" fill="#0f172a" />
          </g>
        )}
        <path d="M52 50 Q60 57 68 50" fill="none" stroke="#7c2d12" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
};

import React, { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const SCENES = [
  { title: 'Many people, one pool', text: 'Thousands of investors put in small amounts. Together the money becomes one big fund.' },
  { title: 'Experts invest it for you', text: 'A fund manager spreads the pool across equity, debt and gold so your money is not in one place.' },
  { title: 'Time makes it grow', text: 'Returns earn more returns. The longer you stay invested, the faster the growth.' },
  { title: 'Start small, stay regular', text: 'A SIP puts a fixed amount in every month. No big start needed. Just keep going.' },
];

const PEOPLE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9'];

const Scene1 = () => (
  <svg viewBox="0 0 400 230" className="w-full h-full" aria-hidden="true">
    {PEOPLE.map((c, i) => (
      <g key={i}>
        <circle cx={110 + i * 40} cy="30" r="9" fill={c} />
        <path d={`M${96 + i * 40} 58 q14 -22 28 0 v8 h-28z`} fill={c} />
        <g className="coin-drop" style={{ ['--d' as string]: `${i * 380}ms` }}>
          <circle cx={110 + i * 40} cy="96" r="8" fill="#fbbf24" stroke="#b45309" strokeWidth="1.6" />
          <text x={110 + i * 40} y="100" textAnchor="middle" fontSize="9" fontWeight="900" fill="#78350f">
            ₹
          </text>
        </g>
      </g>
    ))}
    <rect x="70" y="150" width="260" height="66" rx="18" fill="#312e81" />
    <rect className="grow-y" x="78" y="164" width="244" height="44" rx="12" fill="#10b981" style={{ ['--d' as string]: '300ms' }} />
    <text x="200" y="192" textAnchor="middle" fontSize="15" fontWeight="900" fill="#ffffff">
      MUTUAL FUND POOL
    </text>
  </svg>
);

const Scene2 = () => (
  <svg viewBox="0 0 400 230" className="w-full h-full" aria-hidden="true">
    <circle cx="200" cy="34" r="14" fill="#1e1b4b" />
    <path d="M178 76 q22 -30 44 0 v10 h-44z" fill="#1e1b4b" />
    <path d="M200 52 l6 12 -6 22 -6 -22z" fill="#fbbf24" />
    {[
      { x: 40, c: '#6366f1', t: 'Equity', p: '60%' },
      { x: 150, c: '#10b981', t: 'Debt', p: '30%' },
      { x: 260, c: '#f59e0b', t: 'Gold', p: '10%' },
    ].map((b, i) => (
      <g key={b.t}>
        <path
          className="draw-line"
          style={{ ['--len' as string]: 140, ['--d' as string]: `${200 + i * 200}ms` }}
          d={`M200 88 L${b.x + 50} 130`}
          stroke={b.c}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <g className="anim-pop" style={{ ['--d' as string]: `${600 + i * 250}ms`, transformBox: 'fill-box', transformOrigin: 'center' }}>
          <rect x={b.x} y="130" width="100" height="80" rx="16" fill={b.c} />
          <text x={b.x + 50} y="164" textAnchor="middle" fontSize="15" fontWeight="900" fill="#ffffff">
            {b.t}
          </text>
          <text x={b.x + 50} y="192" textAnchor="middle" fontSize="20" fontWeight="900" fill="#ffffff">
            {b.p}
          </text>
        </g>
      </g>
    ))}
  </svg>
);

const BARS = [24, 38, 54, 74, 100, 134, 170];
const Scene3 = () => (
  <svg viewBox="0 0 400 230" className="w-full h-full" aria-hidden="true">
    <line x1="24" y1="210" x2="380" y2="210" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
    {BARS.map((h, i) => (
      <rect
        key={i}
        className="grow-y"
        style={{ ['--d' as string]: `${i * 260}ms` }}
        x={34 + i * 48}
        y={210 - h}
        width="32"
        height={h}
        rx="8"
        fill="#6366f1"
        opacity={0.55 + i * 0.07}
      />
    ))}
    <path
      className="draw-line"
      style={{ ['--len' as string]: 420, ['--d' as string]: '200ms' }}
      d="M50 190 C 100 180, 140 168, 180 150 S 260 110, 300 86 S 350 46, 372 28"
      fill="none"
      stroke="#10b981"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <circle cx="372" cy="28" r="8" fill="#10b981" />
    <circle cx="372" cy="28" r="8" fill="none" stroke="#10b981" strokeWidth="3" className="pulse-ring" />
    <text x="30" y="226" fontSize="11" fontWeight="800" fill="#94a3b8">
      Start
    </text>
    <text x="350" y="226" fontSize="11" fontWeight="800" fill="#94a3b8">
      Years later
    </text>
  </svg>
);

const Scene4 = () => (
  <svg viewBox="0 0 400 230" className="w-full h-full" aria-hidden="true">
    {['M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((m, i) => (
      <g key={m} className="anim-pop" style={{ ['--d' as string]: `${i * 380}ms`, transformBox: 'fill-box', transformOrigin: 'center' }}>
        <rect x={24 + (i % 3) * 78} y={50 + Math.floor(i / 3) * 78} width="68" height="62" rx="12" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="2" />
        <text x={58 + (i % 3) * 78} y={78 + Math.floor(i / 3) * 78} textAnchor="middle" fontSize="12" fontWeight="900" fill="#4338ca">
          {m}
        </text>
        <text x={58 + (i % 3) * 78} y={100 + Math.floor(i / 3) * 78} textAnchor="middle" fontSize="15" fontWeight="900" fill="#059669">
          ₹ ✓
        </text>
      </g>
    ))}
    <g className="coin-drop" style={{ ['--d' as string]: '0ms' }}>
      <circle cx="318" cy="70" r="11" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
    </g>
    <g className="coin-drop" style={{ ['--d' as string]: '900ms' }}>
      <circle cx="342" cy="70" r="11" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
    </g>
    <path d="M288 120 h96 l-10 90 h-76z" fill="#312e81" />
    <rect className="grow-y" x="296" y="150" width="80" height="54" rx="8" fill="#10b981" style={{ ['--d' as string]: '600ms' }} />
    <text x="336" y="140" textAnchor="middle" fontSize="12" fontWeight="900" fill="#c7d2fe">
      YOUR SIP
    </text>
    <text x="200" y="26" textAnchor="middle" fontSize="19" fontWeight="900" fill="#1e1b4b">
      SIP better. Grow faster.
    </text>
  </svg>
);

const SCENE_ART = [Scene1, Scene2, Scene3, Scene4];

/** A short animated "video" that explains mutual funds in four scenes (plays by itself, can be paused) */
export const FundExplainer: React.FC<{ sceneMs?: number; dark?: boolean }> = ({ sceneMs = 5200, dark }) => {
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setI((x) => (x + 1) % SCENES.length), sceneMs);
    return () => clearTimeout(t);
  }, [i, playing, sceneMs]);

  const Art = SCENE_ART[i];
  return (
    <div className={`rounded-3xl border shadow-xs overflow-hidden ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      <div className="flex gap-1.5 px-5 pt-4">
        {SCENES.map((s, k) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setI(k)}
            aria-label={`Scene ${k + 1}: ${s.title}`}
            className={`flex-1 h-1.5 rounded-full overflow-hidden cursor-pointer ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}
          >
            <span
              className="block h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
              style={{
                width: k < i ? '100%' : k === i && !playing ? '100%' : '0%',
                animation: k === i && playing ? `seg-fill ${sceneMs}ms linear forwards` : undefined,
              }}
            />
          </button>
        ))}
      </div>
      <div key={i} className="scene-in px-4 pt-3 h-52 sm:h-60">
        <Art />
      </div>
      <div className="px-5 pb-4 flex items-start justify-between gap-3">
        <div key={`t${i}`} className="anim-fade">
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
            Step {i + 1} of {SCENES.length}
          </p>
          <h3 className="text-base sm:text-lg font-black leading-tight">{SCENES[i].title}</h3>
          <p className={`mt-0.5 text-xs ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{SCENES[i].text}</p>
        </div>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause the animation' : 'Play the animation'}
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${dark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
      <p className={`px-5 pb-3 text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
        Illustration only. Mutual fund investments are subject to market risks. Read all scheme related documents carefully.
      </p>
    </div>
  );
};

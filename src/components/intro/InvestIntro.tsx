import React, { useEffect, useRef, useState } from 'react';
import { InvestorBoy } from './InvestorBoy';

const LOAD_MS = 4200;
const HERO_HOLD_MS = 2800;

const STAGES = [
  { upTo: 30, text: 'Opening your investment account' },
  { upTo: 60, text: 'Mixing equity, debt and gold' },
  { upTo: 90, text: 'Compounding, one SIP at a time' },
  { upTo: 101, text: 'Ready to grow your money' },
];

interface Props {
  onDone: () => void;
  /** used to record the intro as a video: keeps the last screen and hides the Skip button */
  demo?: boolean;
}

/** Full-screen start-up animation: two investors walk in while 0 to 100 loads, then the headline appears. */
export const InvestIntro: React.FC<Props> = ({ onDone, demo }) => {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'hero' | 'leaving'>('loading');
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('leaving');
    setTimeout(onDone, 650);
  };

  useEffect(() => {
    if (!demo && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / LOAD_MS);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setCount(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setPhase('hero');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase !== 'hero' || demo) return;
    const t = setTimeout(finish, HERO_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const stage = STAGES.find((s) => count < s.upTo) || STAGES[STAGES.length - 1];
  const hero = phase !== 'loading';

  return (
    <div
      role="dialog"
      aria-label="Introduction to mutual fund investing"
      className={`fixed inset-0 z-[100] overflow-hidden bg-[#f5f4ff] text-slate-900 ${phase === 'leaving' ? 'wipe-up' : ''}`}
    >
      {/* soft background shapes */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-200/60 blur-3xl" />
      <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-emerald-200/60 blur-3xl" />

      <div className="absolute top-5 left-6 flex items-center gap-2 font-black tracking-tight text-slate-800">
        <span className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center text-sm">₹</span>
        <span className="text-sm">MF · NPS</span>
      </div>
      {!demo && (
        <button
          type="button"
          onClick={finish}
          className="absolute top-4 right-5 px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
        >
          Skip ›
        </button>
      )}

      {/* the stage */}
      <div className="absolute inset-x-0 top-[18%] bottom-[26%] flex items-end justify-center">
        <div className="relative w-full max-w-3xl h-full">
          {/* ground */}
          <div className="absolute left-0 right-0 bottom-0 h-1 rounded-full bg-slate-300/80" />

          {/* the two investors */}
          <div
            className={`absolute bottom-1 left-0 right-0 h-48 sm:h-60 ${hero ? 'celebrate' : 'walking'}`}
            aria-hidden="true"
          >
            <div
              className="absolute bottom-0 w-24 sm:w-32"
              style={{
                left: hero ? '30%' : '4%',
                transition: `left ${LOAD_MS}ms cubic-bezier(.45,.05,.4,1)`,
              }}
            >
              <InvestorBoy variant="a" className="w-full h-auto" />
            </div>
            <div
              className="absolute bottom-0 w-24 sm:w-32"
              style={{
                left: hero ? '54%' : '84%',
                transition: `left ${LOAD_MS}ms cubic-bezier(.45,.05,.4,1)`,
                transform: 'scaleX(-1)',
              }}
            >
              <InvestorBoy variant="b" className="w-full h-auto" />
            </div>
          </div>

          {/* headline after 100 */}
          {hero && (
            <div className="absolute inset-x-0 top-2 text-center select-none">
              <p className="overflow-hidden text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
                <span className="word-in" style={{ ['--d' as string]: '0ms' }}>SIP&nbsp;BETTER,</span>
              </p>
              <p className="overflow-hidden text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] text-indigo-600">
                <span className="word-in" style={{ ['--d' as string]: '180ms' }}>GROW&nbsp;FASTER.</span>
              </p>
              <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-500 anim-fade" style={{ ['--d' as string]: '700ms' }}>
                Mutual funds and NPS - small amounts, big goals.
              </p>
              <svg viewBox="0 0 300 70" className="mx-auto mt-3 w-64 sm:w-80" aria-hidden="true">
                <path
                  className="draw-line"
                  style={{ ['--len' as string]: 340, ['--d' as string]: '500ms' }}
                  d="M5 62 C 50 58, 70 50, 100 42 S 160 30, 190 22 S 250 10, 295 6"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="295" cy="6" r="6" fill="#10b981" className="anim-pop" style={{ ['--d' as string]: '2200ms' }} />
              </svg>
            </div>
          )}

          {/* coins popping when the boys meet */}
          {hero && (
            <div className="absolute inset-x-0 top-0 h-full pointer-events-none" aria-hidden="true">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className="confetti w-4 h-4 rounded-full bg-amber-400 border border-amber-600 text-[9px] font-black text-amber-900 flex items-center justify-center"
                  style={{
                    left: `${8 + ((i * 53) % 84)}%`,
                    ['--dx' as string]: `${((i % 5) - 2) * 24}px`,
                    ['--d' as string]: `${(i % 8) * 90}ms`,
                  }}
                >
                  ₹
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* counter, like a loading screen */}
      <div className="absolute inset-x-0 bottom-0 px-6 sm:px-10 pb-6">
        <div className="flex items-end justify-between gap-4">
          <p className="text-xs sm:text-sm font-bold text-slate-500 max-w-[55%]" aria-live="polite">
            {hero ? 'Welcome!' : `${stage.text}...`}
          </p>
          <div className="text-6xl sm:text-8xl font-black tracking-tighter text-slate-300 leading-none tabular-nums">
            {count}
            <span className="text-3xl sm:text-5xl text-slate-300/80">%</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${count}%` }} />
        </div>
        {hero && !demo && (
          <button
            type="button"
            onClick={finish}
            className="mt-4 mx-auto block px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold cursor-pointer anim-pop"
          >
            Continue to login
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const perViewFor = () => (typeof window === 'undefined' ? 3 : window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : window.innerWidth < 1600 ? 3 : 4);

/** Cards that slide by themselves (every 5 seconds), with arrows and dashes; stops while the mouse is over it. Shows a plain grid when everything fits. */
export const AutoSlider: React.FC<{ items: React.ReactNode[] }> = ({ items }) => {
  const [per, setPer] = useState(perViewFor());
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const on = () => setPer(perViewFor());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const n = items.length;
  // every card keeps the same standard size
  const shownPer = per;
  const last = Math.max(0, n - shownPer);
  useEffect(() => {
    if (start > last) setStart(0);
  }, [start, last]);
  useEffect(() => {
    if (last === 0 || paused) return;
    const t = setInterval(() => setStart((s) => (s >= last ? 0 : s + 1)), 5000);
    return () => clearInterval(t);
  }, [last, paused]);

  const w = 100 / shownPer;
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden -mx-2">
        <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${start * w}%)` }}>
          {items.map((it, i) => (
            <div key={i} className="px-2 shrink-0 flex" style={{ width: `${w}%` }}>
              <div className="w-full flex">{it}</div>
            </div>
          ))}
        </div>
      </div>
      {last > 0 && (
        <>
          <button type="button" aria-label="Previous" onClick={() => setStart((s) => (s <= 0 ? last : s - 1))} className="absolute left-0 top-1/3 -translate-x-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white grid place-items-center cursor-pointer z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" aria-label="Next" onClick={() => setStart((s) => (s >= last ? 0 : s + 1))} className="absolute right-0 top-1/3 translate-x-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white grid place-items-center cursor-pointer z-10">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex justify-center gap-1.5 pt-3">
            {Array.from({ length: last + 1 }).map((_, i) => (
              <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => setStart(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === start ? 'w-6 bg-slate-800' : 'w-1.5 bg-slate-300'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

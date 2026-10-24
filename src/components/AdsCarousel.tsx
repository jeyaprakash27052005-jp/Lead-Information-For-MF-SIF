import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { AdBanner } from '../types';
import { adsStorageService } from '../services/adsStorage';
import { useAppSettings } from '../context/AppSettings';
import { AnimatedAd } from './AnimatedAd';
import { adTextClass } from '../utils/adAnimations';

/** The moving ads (with their animations) that the admin team added, for the customer's home screen */
export const AdsCarousel: React.FC<{ onAction?: (linkUrl: string) => void; fallback?: React.ReactNode }> = ({ onAction, fallback = null }) => {
  const { settings } = useAppSettings();
  const [ads, setAds] = useState<AdBanner[] | null>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    adsStorageService
      .getAds()
      .then((list) => alive && setAds(list.filter((a) => a.isActive)))
      .catch(() => alive && setAds([]));
    return () => {
      alive = false;
    };
  }, []);

  const count = ads?.length ?? 0;
  useEffect(() => {
    if (slide >= count) setSlide(0);
  }, [count, slide]);
  useEffect(() => {
    if (count <= 1 || paused) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count, paused]);

  if (!settings.features.homeAds || ads === null || count === 0) return <>{fallback}</>;

  return (
    <section
      aria-label="Announcements and offers"
      className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative h-56 sm:h-72 md:h-80">
        {ads.map((ad, i) => {
          const on = i === slide;
          return (
            <div
              key={ad.id}
              className={`absolute inset-0 transition-opacity duration-700 flex flex-col justify-end p-5 sm:p-8 ${on ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
            >
              <AnimatedAd ad={ad} playKey={on ? 'on' : 'off'} className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
              <div key={on ? 'on' : 'off'} className={`relative z-20 max-w-xl space-y-1.5 ${adTextClass(ad)}`}>
                {ad.badge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-black uppercase tracking-wide">
                    <Sparkles className="w-3 h-3" /> {ad.badge}
                  </span>
                )}
                <h2 className="text-lg sm:text-2xl font-black text-white drop-shadow-md">{ad.title}</h2>
                {ad.subtitle && <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 font-medium">{ad.subtitle}</p>}
                {ad.linkUrl && /^https?:\/\//i.test(ad.linkUrl) && (
                  <a
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onAction?.(ad.linkUrl as string)}
                    className="btn-glow inline-block mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    Explore
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {count > 1 && (
          <>
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
              <button type="button" onClick={() => setPaused(!paused)} title={paused ? 'Play' : 'Pause'} className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center cursor-pointer border border-white/10">
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => setSlide((s) => (s - 1 + count) % count)} title="Previous" className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center cursor-pointer border border-white/10">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => setSlide((s) => (s + 1) % count)} title="Next" className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center cursor-pointer border border-white/10">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-3 right-5 z-30 flex items-center gap-1.5">
              {ads.map((_, i) => (
                <button key={i} type="button" onClick={() => setSlide(i)} title={`Slide ${i + 1}`} className={`h-1.5 rounded-full transition-all cursor-pointer ${i === slide ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

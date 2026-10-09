import React, { useState, useEffect, useRef } from 'react';
import { InvestmentScheme, AdBanner } from '../types';
import { MutualFundCalculator } from './MutualFundCalculator';
import { NPSCalculator } from './NPSCalculator';
import { adsStorageService } from '../services/adsStorage';
import {
  Layers,
  Shield,
  User as UserIcon,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  ArrowRight,
  PieChart,
  Coins,
  CheckCircle2,
  LogIn,
  UserPlus
} from 'lucide-react';
import { formatInr } from '../utils/currency';

interface HomeScreenProps {
  schemes: InvestmentScheme[];
  onOpenAdminLogin: () => void;
  onOpenCustomerLogin: () => void;
  onOpenCustomerRegister: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  schemes,
  onOpenAdminLogin,
  onOpenCustomerLogin,
  onOpenCustomerRegister,
}) => {
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeCalcTab, setActiveCalcTab] = useState<'mf' | 'nps' | 'schemes'>('mf');

  // Load moving ads
  useEffect(() => {
    const loadAds = async () => {
      try {
        const loaded = await adsStorageService.getAds();
        const active = loaded.filter((a) => a.isActive);
        setAds(active);
      } catch (_e) {
        // ignore
      }
    };
    loadAds();
  }, []);

  useEffect(() => {
    if (currentSlide >= ads.length) setCurrentSlide(0);
  }, [ads.length]);

  // Auto-move ads carousel
  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % ads.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [ads.length, isPaused]);

  const handleNextSlide = () => {
    if (ads.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % ads.length);
    }
  };

  const handlePrevSlide = () => {
    if (ads.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + ads.length) % ads.length);
    }
  };

  const handleAdAction = (linkUrl?: string) => {
    if (!linkUrl) return;
    if (linkUrl === 'mf-calc') {
      setActiveCalcTab('mf');
      window.scrollTo({ top: 480, behavior: 'smooth' });
    } else if (linkUrl === 'nps-calc') {
      setActiveCalcTab('nps');
      window.scrollTo({ top: 480, behavior: 'smooth' });
    } else if (linkUrl === 'register') {
      onOpenCustomerRegister();
    } else if (linkUrl.startsWith('http')) {
      window.open(linkUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo & Website Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                Mutual fund (SIF) and NPS scheme return calculating site
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Mutual Fund (SIF) Compounding & NPS Pension Platform
              </p>
            </div>
          </div>

          {/* Top Right: Admin Login & Customer Login */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCustomerLogin}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Customer Login - Access your investor profile & reports"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer Login</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Admin Login - Head & Officers Portal"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Home Screen Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 flex-1">
        {/* MOVING ADS ON THE SCREEN (CAROUSEL SLIDER) */}
        {ads.length > 0 && (
        <section
          aria-label="Moving Promotional Ads"
          className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {ads.length > 0 ? (
            <div className="relative min-h-[420px] sm:min-h-[500px] md:min-h-[560px] flex items-center">
              {ads.map((ad, index) => {
                const isActive = index === currentSlide;
                return (
                  <div
                    key={ad.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col justify-end p-6 sm:p-10 ${
                      isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    {/* Background Ad Image (JPG, JPEG, PNG, GIF) */}
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                    {/* Gradient Overlay for high readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />

                    {/* Content on the Ad */}
                    <div className="relative z-20 max-w-2xl space-y-3">
                      {ad.badge && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/90 text-white text-xs font-black tracking-wide uppercase shadow-md">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          <span>{ad.badge}</span>
                        </div>
                      )}

                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                        {ad.title}
                      </h2>

                      {ad.subtitle && (
                        <p className="text-sm sm:text-base text-slate-200 line-clamp-2 drop-shadow-sm font-medium">
                          {ad.subtitle}
                        </p>
                      )}

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        {ad.linkUrl && (
                          <button
                            type="button"
                            onClick={() => handleAdAction(ad.linkUrl)}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span>Explore Promotion</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onOpenCustomerRegister}
                          className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md text-xs sm:text-sm font-bold border border-white/30 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Create Investor Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Slider Controls */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                  title={isPaused ? 'Resume auto-moving ads' : 'Pause moving ads'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                  title="Previous ad"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer border border-white/10"
                  title="Next ad"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dots Indicators */}
              <div className="absolute bottom-4 right-6 z-30 flex items-center gap-1.5">
                {ads.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    title={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
        )}

        {/* Shown only while no ads have been uploaded yet */}
        {ads.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center space-y-5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenCustomerLogin}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 cursor-pointer"
              >
                Customer Login
              </button>
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Admin Login
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            © {new Date().getFullYear()} Mutual fund (SIF) and NPS scheme return calculating site. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenCustomerLogin}
              className="text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Customer Login
            </button>
            <span>•</span>
            <button
              onClick={onOpenAdminLogin}
              className="text-slate-700 hover:underline font-semibold cursor-pointer"
            >
              Admin Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

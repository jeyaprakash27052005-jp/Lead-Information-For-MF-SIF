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
        setAds(active.length > 0 ? active : loaded);
      } catch (_e) {
        // ignore
      }
    };
    loadAds();
  }, []);

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

      {/* Continuous Moving Ads Ticker Bar */}
      <div className="bg-slate-900 text-white overflow-hidden py-2 border-b border-indigo-900">
        <div className="flex items-center whitespace-nowrap animate-marquee gap-10 text-xs font-semibold">
          <span className="flex items-center gap-2 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>High-Yield Systematic Investment Facility (SIF) • Compounding up to 18% p.a.</span>
          </span>
          <span className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>NPS Tier I Pension Wealth • Save ₹50,000 Tax under Sec 80CCD(1B)</span>
          </span>
          <span className="flex items-center gap-2 text-sky-300">
            <PieChart className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Instant Return Projections • View Detailed Calculations & Download PDF Reports</span>
          </span>
          <span className="flex items-center gap-2 text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Moving Ads Screen • Admin can upload custom JPG, JPEG, PNG, GIF ad banners</span>
          </span>
        </div>
      </div>

      {/* Main Home Screen Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 flex-1">
        {/* MOVING ADS ON THE SCREEN (CAROUSEL SLIDER) */}
        <section
          aria-label="Moving Promotional Ads"
          className="relative bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {ads.length > 0 ? (
            <div className="relative min-h-[300px] sm:min-h-[360px] md:min-h-[400px] flex items-center">
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
          ) : (
            <div className="p-8 text-center text-white space-y-3">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
              <h3 className="text-xl font-bold">Moving Ads Screen</h3>
              <p className="text-xs text-slate-300">
                Ads uploaded by admin in JPG, JPEG, PNG, or GIF will move dynamically here.
              </p>
            </div>
          )}
        </section>

        {/* QUICK ACCESS / CALL TO ACTION BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Free Instant Wealth Projection</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              Calculate Mutual Fund (SIF) Compounding & NPS Pension
            </h2>
            <p className="text-xs text-slate-300">
              Calculate exact investment maturity values, view transparent compounding breakdowns, and download official PDF statements.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenCustomerRegister}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={onOpenCustomerLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
          </div>
        </div>

        {/* CALCULATOR TABS & INTERACTIVE RETURN CALCULATORS */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-thin">
            <button
              type="button"
              onClick={() => setActiveCalcTab('mf')}
              className={`py-3.5 px-5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeCalcTab === 'mf'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>1. Mutual Fund (SIF) Calculator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCalcTab('nps')}
              className={`py-3.5 px-5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeCalcTab === 'nps'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span>2. NPS Scheme Calculator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCalcTab('schemes')}
              className={`py-3.5 px-5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeCalcTab === 'schemes'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>3. Browse All Schemes ({schemes.length})</span>
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {activeCalcTab === 'mf' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Systematic Investment Facility (SIF) & Lumpsum Compounding Calculator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Adjust monthly contribution, duration, and expected CAGR. Click <strong>View</strong> to inspect month-by-month compounding or <strong>Download PDF</strong> for an investment statement.
                    </p>
                  </div>
                </div>
                <MutualFundCalculator schemes={schemes} />
              </div>
            )}

            {activeCalcTab === 'nps' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      National Pension System (NPS Tier I) Return & Pension Calculator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calculate your total retirement corpus, tax-free lump sum withdrawal (60%), and estimated monthly pension annuity (40%). Click <strong>View</strong> or <strong>Download PDF</strong>.
                    </p>
                  </div>
                </div>
                <NPSCalculator schemes={schemes} />
              </div>
            )}

            {activeCalcTab === 'schemes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Mutual Fund & NPS Approved Scheme Catalog
                    </h3>
                    <p className="text-xs text-slate-500">
                      Official investment schemes available for investor calculation and portfolio allocation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {schemes.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                              s.type === 'mutual_fund'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {s.type === 'mutual_fund' ? 'Mutual Fund SIF' : 'NPS Tier I'}
                          </span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {s.expectedReturnRate}% p.a.
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{s.name}</h4>
                        <p className="text-[11px] text-slate-500">{s.fundHouse || s.category}</p>
                        {s.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">{s.description}</p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Min: {s.minInvestment ? formatInr(s.minInvestment) : '₹500'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (s.type === 'mutual_fund') setActiveCalcTab('mf');
                            else setActiveCalcTab('nps');
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Calculate</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
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

import { useEffect, useState } from 'react';
import { Mail, Menu, MessageCircle, Phone, X, Send, Landmark, ArrowRight } from 'lucide-react';
import { AppSettingsProvider, useAppSettings } from './context/AppSettings';
import { AdsCarousel } from './components/AdsCarousel';
import { FundAdsList } from './components/FundAdsList';
import { AwarenessList } from './components/AwarenessList';
import { MF_DISCLAIMER } from './utils/fundAdRules';

type Page = 'home' | 'funds' | 'sessions' | 'contact';

const env = import.meta.env as Record<string, string | undefined>;
const CONTACT_EMAIL = env.VITE_CONTACT_EMAIL || 'jeyaprakash27052005@gmail.com';
const CONTACT_PHONE = (env.VITE_CONTACT_PHONE || '').trim();
const CONTACT_WHATSAPP = (env.VITE_CONTACT_WHATSAPP || '').replace(/\D/g, '');

const readPage = (): Page => {
  const h = window.location.hash.replace('#/', '').replace('#', '');
  return h === 'funds' || h === 'sessions' || h === 'contact' ? h : 'home';
};

/** Stand-alone advertising website: mutual fund offers, moving ads and awareness sessions. Open to everyone, no login. */
function Site() {
  const { settings } = useAppSettings();
  const [page, setPage] = useState<Page>(readPage());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => {
      setPage(readPage());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = (p: Page) => {
    window.location.hash = `/${p}`;
    setOpen(false);
  };

  const f = settings.features;
  const links: { id: Page; label: string }[] = [
    { id: 'home', label: 'Home' },
    ...(f.fundAds ? [{ id: 'funds' as Page, label: 'Mutual Funds' }] : []),
    ...(f.awarenessPrograms ? [{ id: 'sessions' as Page, label: 'All Sessions' }] : []),
    { id: 'contact', label: 'Contact Us' },
  ];
  const current = links.some((l) => l.id === page) ? page : 'home';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button onClick={() => go('home')} className="flex items-center gap-2.5 text-left">
            <span className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 tracking-tight text-sm sm:text-base">Mutual Fund Offers</span>
          </button>
          <nav className="hidden md:flex flex-1 justify-center gap-8" aria-label="Main">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                aria-current={current === l.id ? 'page' : undefined}
                className={`text-sm font-semibold py-1 border-b-2 transition-colors ${current === l.id ? 'text-red-600 border-red-600' : 'text-slate-700 border-transparent hover:text-red-600'}`}
              >
                {l.label}
              </button>
            ))}
          </nav>
          <button className="md:hidden p-2 rounded-lg border border-slate-200" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="hidden md:block w-9" />
        </div>
        {open && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-2 flex flex-col" aria-label="Mobile">
            {links.map((l) => (
              <button key={l.id} onClick={() => go(l.id)} className={`text-left py-3 text-sm font-semibold ${current === l.id ? 'text-red-600' : 'text-slate-700'}`}>
                {l.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {current === 'home' && (
          <>
            <AdsCarousel />
            <section className="text-center space-y-2 py-4">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Invest with understanding</h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">See the latest mutual fund offers and join our free investor awareness sessions.</p>
            </section>
            {f.fundAds && (
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900">Featured mutual funds</h2>
                <FundAdsList limit={3} hideWhenEmpty />
                <button onClick={() => go('funds')} className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:underline">
                  See all mutual funds <ArrowRight className="w-4 h-4" />
                </button>
              </section>
            )}
            {f.awarenessPrograms && (
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900">Upcoming sessions</h2>
                <AwarenessList limit={2} hideWhenEmpty />
              </section>
            )}
          </>
        )}
        {current === 'funds' && (
          <section className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900">Mutual Funds</h1>
            <FundAdsList />
          </section>
        )}
        {current === 'sessions' && (
          <section className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900">All Sessions</h1>
            <AwarenessList />
          </section>
        )}
        {current === 'contact' && <Contact />}
      </main>

      <footer className="py-5 px-4 text-center text-[11px] text-slate-500 space-y-1">
        <p>{MF_DISCLAIMER}</p>
      </footer>
    </div>
  );
}

function Contact() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const text = `Hello, I am ${name || '(name)'}${phone ? ` (mobile ${phone})` : ''}. ${msg}`.trim();
  const ready = name.trim().length > 1 && msg.trim().length > 1;
  const input = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <section className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-black text-slate-900">Contact Us</h1>
      <p className="text-sm text-slate-600">Tell us what you would like to know. Your message opens in your own e-mail or WhatsApp, so you can check it before sending.</p>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <input className={input} placeholder="Mobile number (optional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
        <textarea className={input} rows={4} placeholder="Your question" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={600} />
        <div className="flex flex-wrap gap-2">
          <a
            aria-disabled={!ready}
            href={ready ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Mutual fund enquiry')}&body=${encodeURIComponent(text)}` : undefined}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${ready ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-300 pointer-events-none'}`}
          >
            <Send className="w-4 h-4" /> Send by e-mail
          </a>
          {CONTACT_WHATSAPP && (
            <a
              aria-disabled={!ready}
              href={ready ? `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}` : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${ready ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 pointer-events-none'}`}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>
      <div className="text-sm text-slate-700 space-y-1.5">
        <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-red-600" /> {CONTACT_EMAIL}</p>
        {CONTACT_PHONE && (
          <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-red-600" /> <a href={`tel:${CONTACT_PHONE.replace(/\s+/g, '')}`}>{CONTACT_PHONE}</a></p>
        )}
      </div>
    </section>
  );
}

export default function AdsSite() {
  return (
    <AppSettingsProvider>
      <Site />
    </AppSettingsProvider>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Mail, Menu, MessageCircle, Phone, X, Send, Landmark, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { AppSettingsProvider, useAppSettings } from './context/AppSettings';
import { AdsCarousel } from './components/AdsCarousel';
import { FundAdsList } from './components/FundAdsList';
import { AwarenessList } from './components/AwarenessList';
import { FinanceCalculations } from './components/FinanceCalculations';
import { siteStorage } from './services/siteStorage';
import { DEFAULT_ITEMS, DEFAULT_MENUS } from './utils/siteDefaults';
import { SiteContact, SiteItem, SiteMenu } from './types';
import { MF_DISCLAIMER } from './utils/fundAdRules';

const env = import.meta.env as Record<string, string | undefined>;
const CONTACT_EMAIL = env.VITE_CONTACT_EMAIL || 'jeyaprakash27052005@gmail.com';
const CONTACT_PHONE = (env.VITE_CONTACT_PHONE || '').trim();
const CONTACT_WHATSAPP = (env.VITE_CONTACT_WHATSAPP || '').replace(/\D/g, '');
const LOGIN_URL = /^https:\/\//i.test(env.VITE_CUSTOMER_URL || '') ? (env.VITE_CUSTOMER_URL as string) : '';

type Route = { name: 'home' | 'funds' | 'sessions' | 'contact' | 'calc' } | { name: 'page'; id: string };

const readRoute = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (h === 'funds' || h === 'sessions' || h === 'contact' || h === 'calc') return { name: h };
  if (h.startsWith('p/')) return { name: 'page', id: decodeURIComponent(h.slice(2)) };
  return { name: 'home' };
};

const Badge = ({ b }: { b?: string }) =>
  b ? <span className={`ml-1.5 text-[10px] font-bold ${b === 'New' ? 'text-emerald-600' : 'text-amber-600'}`}>{b}</span> : null;

/** Stand-alone advertising website: menus and pages written by the admin team, mutual fund offers, ads and sessions. Open to everyone, no login. */
function Site() {
  const { settings } = useAppSettings();
  const f = settings.features;
  const [route, setRoute] = useState<Route>(readRoute());
  const [mobile, setMobile] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menus, setMenus] = useState<SiteMenu[]>(DEFAULT_MENUS);
  const [items, setItems] = useState<SiteItem[]>(DEFAULT_ITEMS);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [m, i] = await Promise.all([siteStorage.getMenus(), siteStorage.getItems()]);
        if (!alive) return;
        // until the admin team saves its own menu, the built-in starter menu is shown
        if (m.length > 0) {
          setMenus(m);
          setItems(i);
        }
      } catch (_e) {
        // keep what is shown
      }
    };
    load();
    const t = setInterval(load, 120000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const on = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpenMenu(null);
    const click = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener('keydown', key);
    window.addEventListener('mousedown', click);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('mousedown', click);
    };
  }, []);

  const go = (hash: string) => {
    window.location.hash = hash;
    setOpenMenu(null);
    setMobile(false);
  };

  const open = (x: SiteItem) => {
    if (x.badge === 'Coming Soon' && x.kind === 'page' && !(x.body || '').trim()) return;
    if (x.kind === 'link') {
      if (/^https:\/\//i.test(x.linkUrl || '')) window.open(x.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (x.kind === 'route') return go(`/${x.route || 'home'}`);
    if (x.kind === 'calculator') return go('/calc');
    go(`/p/${encodeURIComponent(x.id)}`);
  };

  // hide entries whose feature the admin switched off
  const itemVisible = (x: SiteItem) =>
    x.isActive && !(x.kind === 'route' && ((x.route === 'funds' && !f.fundAds) || (x.route === 'sessions' && !f.awarenessPrograms)));

  const activeMenus = menus.filter((m) => m.isActive);
  const menuItems = (id: string) => items.filter((x) => x.menuId === id && itemVisible(x));
  const visibleMenus = activeMenus.filter((m) => menuItems(m.id).length > 0);
  const sectionsOf = (id: string) => {
    const out: { title: string; list: SiteItem[] }[] = [];
    menuItems(id).forEach((x) => {
      let g = out.find((o) => o.title === x.section);
      if (!g) out.push((g = { title: x.section, list: [] }));
      g.list.push(x);
    });
    return out;
  };

  const clickMenu = (m: SiteMenu) => {
    const list = menuItems(m.id);
    if (m.highlight && list.length === 1) return open(list[0]);
    setOpenMenu((o) => (o === m.id ? null : m.id));
  };

  const pageItem = route.name === 'page' ? items.find((x) => x.id === route.id && x.isActive) : undefined;
  const panel = visibleMenus.find((m) => m.id === openMenu);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header ref={headerRef} className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button onClick={() => go('/home')} className="flex items-center gap-2.5 text-left shrink-0">
            <span className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </span>
            <span className="font-black text-slate-900 tracking-tight text-sm sm:text-base">Mutual Fund Hub</span>
          </button>
          <nav className="hidden lg:flex flex-1 items-center gap-1 ml-4" aria-label="Main">
            {visibleMenus.map((m) => (
              <button
                key={m.id}
                onClick={() => clickMenu(m)}
                aria-expanded={openMenu === m.id}
                className={
                  m.highlight
                    ? 'ml-2 px-3.5 py-1.5 rounded-md text-sm font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                    : `px-3 py-2 text-sm font-semibold inline-flex items-center gap-1 ${openMenu === m.id ? 'text-blue-700' : 'text-slate-800 hover:text-blue-700'}`
                }
              >
                {m.label}
                {!m.highlight && (openMenu === m.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
              </button>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <button onClick={() => go('/contact')} className="px-4 py-2 rounded-md border border-slate-800 text-sm font-bold text-slate-900 hover:bg-slate-50">
              Quick Enquiry
            </button>
            {LOGIN_URL && (
              <a href={LOGIN_URL} className="px-5 py-2 rounded-md bg-blue-700 hover:bg-blue-800 text-sm font-bold text-white">
                Login
              </a>
            )}
          </div>
          <button className="lg:hidden ml-auto p-2 rounded-lg border border-slate-200" aria-label={mobile ? 'Close menu' : 'Open menu'} aria-expanded={mobile} onClick={() => setMobile((o) => !o)}>
            {mobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {panel && (
          <div className="hidden lg:block absolute inset-x-0 top-full bg-white border-b border-slate-200 shadow-lg" role="region" aria-label={panel.label}>
            <div className="max-w-7xl mx-auto px-8 py-7 grid gap-x-10 gap-y-6" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(sectionsOf(panel.id).length, 1), 4)}, minmax(0, 1fr))` }}>
              {sectionsOf(panel.id).map((sec) => (
                <div key={sec.title} className="space-y-3">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-blue-700/80">{sec.title}</p>
                  {sec.list.map((x) => (
                    <button key={x.id} onClick={() => open(x)} className="block text-left w-full group">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        {x.title}
                        <Badge b={x.badge} />
                      </span>
                      {x.description && <span className="block text-xs text-slate-500 leading-snug mt-0.5">{x.description}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {mobile && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-2 max-h-[75vh] overflow-y-auto" aria-label="Mobile">
            {visibleMenus.map((m) => (
              <div key={m.id} className="border-b border-slate-100 last:border-0">
                <button onClick={() => clickMenu(m)} className="w-full flex items-center justify-between py-3 text-sm font-bold text-slate-800">
                  {m.label}
                  {!(m.highlight && menuItems(m.id).length === 1) && (openMenu === m.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </button>
                {openMenu === m.id && (
                  <div className="pb-3 space-y-3">
                    {sectionsOf(m.id).map((sec) => (
                      <div key={sec.title}>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700/80 mb-1">{sec.title}</p>
                        {sec.list.map((x) => (
                          <button key={x.id} onClick={() => open(x)} className="block w-full text-left py-1.5 text-sm font-semibold text-slate-700">
                            {x.title}
                            <Badge b={x.badge} />
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="py-3 flex gap-2">
              <button onClick={() => go('/contact')} className="flex-1 px-4 py-2 rounded-md border border-slate-800 text-sm font-bold">Quick Enquiry</button>
              {LOGIN_URL && <a href={LOGIN_URL} className="flex-1 text-center px-4 py-2 rounded-md bg-blue-700 text-sm font-bold text-white">Login</a>}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {route.name === 'home' && (
          <>
            <AdsCarousel />
            <section className="text-center space-y-2 py-4">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Invest with understanding</h1>
              <p className="text-sm text-slate-600 max-w-xl mx-auto">Learn the basics, plan your goals, see the latest mutual fund offers and join our free investor sessions.</p>
            </section>
            {f.fundAds && (
              <section className="space-y-3">
                <h2 className="text-lg font-black text-slate-900">Featured mutual funds</h2>
                <FundAdsList limit={3} hideWhenEmpty />
                <button onClick={() => go('/funds')} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">
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
        {route.name === 'funds' && (
          <section className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900">Mutual Fund Offers</h1>
            <FundAdsList />
          </section>
        )}
        {route.name === 'sessions' && (
          <section className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900">Awareness Sessions</h1>
            <AwarenessList />
          </section>
        )}
        {route.name === 'calc' && (
          <section className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900">Investment Calculators</h1>
            <FinanceCalculations />
          </section>
        )}
        {route.name === 'contact' && <Contact />}
        {route.name === 'page' &&
          (pageItem ? (
            <article className="max-w-2xl mx-auto space-y-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{menus.find((m) => m.id === pageItem.menuId)?.label}</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{pageItem.title}</h1>
              {pageItem.description && <p className="text-sm text-slate-600">{pageItem.description}</p>}
              {pageItem.imageUrl && <img src={pageItem.imageUrl} alt="" className="w-full rounded-2xl border border-slate-200" />}
              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                {(pageItem.body || '').split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">{para}</p>
                ))}
              </div>
              <button onClick={() => go('/contact')} className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">
                Have a question? Contact us <ArrowRight className="w-4 h-4" />
              </button>
            </article>
          ) : (
            <p className="text-center text-sm text-slate-500 py-16">This page is not available. Please use the menu above.</p>
          ))}
      </main>

      <footer className="py-5 px-4 text-center text-[11px] text-slate-500 space-y-1">
        <p>{MF_DISCLAIMER}</p>
      </footer>
    </div>
  );
}

function Contact() {
  const [info, setInfo] = useState<SiteContact>({ contactName: '', mobile: CONTACT_PHONE, email: CONTACT_EMAIL, officeAddress: '', hours: '' });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    siteStorage
      .getContact()
      .then((c) => alive && c && setInfo((o) => ({ ...o, ...c, email: c.email || o.email })))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const email = info.email || CONTACT_EMAIL;
  const digits = info.mobile.replace(/\D/g, '');
  const wa = CONTACT_WHATSAPP || (digits.length === 10 ? `91${digits}` : digits.length >= 11 ? digits : '');
  const text = `Hello, I am ${name || '(name)'}${phone ? ` (mobile ${phone})` : ''}. ${msg}`.trim();
  const ready = name.trim().length > 1 && msg.trim().length > 1;
  const input = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const block = (icon: React.ReactNode, title: string, lines: React.ReactNode[]) => (
    <div className="flex items-start gap-4">
      <span className="w-14 h-14 shrink-0 rounded-full bg-green-500 text-slate-900 flex items-center justify-center">{icon}</span>
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-black uppercase tracking-wide text-slate-900">{title}</p>
        {lines.map((l, i) => (
          <p key={i} className="text-sm text-slate-700 break-words">{l}</p>
        ))}
      </div>
    </div>
  );

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-7 bg-white rounded-2xl border border-slate-200 p-6">
          {block(<Mail className="w-6 h-6" />, 'Chat to us', [
            'Our friendly team is here to help.',
            info.contactName && <b key="n">{info.contactName}</b>,
            <a key="e" href={`mailto:${email}`} className="text-blue-700 font-semibold">{email}</a>,
          ].filter(Boolean) as React.ReactNode[])}
          {info.officeAddress && block(<MapPin className="w-6 h-6" />, 'Office', ['Come and meet us at our office.', <span key="a" className="whitespace-pre-line">{info.officeAddress}</span>])}
          {(info.mobile || info.hours) &&
            block(<Phone className="w-6 h-6" />, 'Phone', [
              info.hours,
              info.contactName && info.mobile ? info.contactName : '',
              info.mobile && <a key="p" href={`tel:${info.mobile.replace(/\s+/g, '')}`} className="text-blue-700 font-semibold">{info.mobile}</a>,
            ].filter(Boolean) as React.ReactNode[])}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <p className="text-sm text-slate-600">Or send us a question. It opens in your own e-mail or WhatsApp so you can check it before sending.</p>
          <input className={input} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <input className={input} placeholder="Mobile number (optional)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          <textarea className={input} rows={4} placeholder="Your question" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={600} />
          <div className="flex flex-wrap gap-2">
            <a
              aria-disabled={!ready}
              href={ready ? `mailto:${email}?subject=${encodeURIComponent('Mutual fund enquiry')}&body=${encodeURIComponent(text)}` : undefined}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${ready ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-300 pointer-events-none'}`}
            >
              <Send className="w-4 h-4" /> Send by e-mail
            </a>
            {wa && (
              <a
                aria-disabled={!ready}
                href={ready ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${ready ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 pointer-events-none'}`}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>
        </div>
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

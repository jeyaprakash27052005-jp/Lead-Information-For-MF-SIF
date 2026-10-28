import { SiteItem, SiteMenu } from '../types';

const T = '2026-01-01T00:00:00.000Z';
const m = (id: string, label: string, order: number, highlight = false): SiteMenu => ({ id, label, order, isActive: true, highlight, createdAt: T });

let n = 0;
const i = (menuId: string, section: string, title: string, description: string, extra: Partial<SiteItem> = {}): SiteItem => ({
  id: `d_${menuId}_${++n}`,
  menuId,
  section,
  title,
  description,
  badge: '',
  kind: 'page',
  body: `${title}\n\n${description}\n\nThis page is a starting point. The admin team can replace this text with the full details from the Site Menus screen in the admin portal.`,
  order: n,
  isActive: true,
  createdAt: T,
  ...extra,
});

/** Starter menu shown until the admin team saves its own (also used by "Load starter menu" in the admin portal) */
export const DEFAULT_MENUS: SiteMenu[] = [
  m('guide', 'Investor Guide', 1),
  m('plan', 'Plan & Calculate', 2),
  m('products', 'Fund Products', 3),
  m('help', 'Help & Services', 4),
  m('picks', 'Top Offers', 5, true),
];

export const DEFAULT_ITEMS: SiteItem[] = (() => {
  n = 0;
  const B = 'Mutual Fund Basics';
  const A = 'Advanced Learning';
  const P = 'Smart Planners';
  const C = 'Calculators';
  const F = 'Fund Categories';
  const O = 'Offers';
  const S = 'Services';
  return [
    i('guide', B, 'Starter Kit', 'Everything you need to start investing', { badge: 'New' }),
    i('guide', B, "Beginner's Guide", 'What a mutual fund is and how it works', { badge: 'New' }),
    i('guide', B, 'Start Your First SIP', 'Begin with a small monthly amount'),
    i('guide', B, 'Video Tutorials', 'Short videos for new investors'),
    i('guide', B, 'Jargon Simplified', 'NAV, SIP, expense ratio and more in plain words'),
    i('guide', B, 'Why Mutual Funds?', 'Professional management and diversification'),
    i('guide', A, 'Fund Videos', 'Watch quick 5 minute videos about funds'),
    i('guide', A, 'Podcasts', 'Listen and learn on the go', { badge: 'New' }),
    i('guide', A, 'Myth Busters', 'Clear the common myths and start investing'),
    i('guide', A, 'Our Blog', 'Articles for investors'),
    i('guide', A, 'FAQs', 'Answers to common questions'),
    i('guide', A, 'Infographics', 'Advanced topics, simplified', { badge: 'Coming Soon' }),

    i('plan', P, 'Goal Planner', 'Plan and invest for every goal'),
    i('plan', P, 'My First Crore', 'How a monthly SIP can build towards a big goal'),
    i('plan', P, 'Emergency Planner', 'Keep money ready for the unexpected'),
    i('plan', P, 'Save Taxes', 'Tax saving options such as ELSS'),
    i('plan', P, 'Vacation Plan', 'Save for your next trip'),
    i('plan', P, 'Wedding Plan', 'Plan for a wedding step by step'),
    i('plan', P, 'Investment Ideas', 'Ideas for your next investment', { badge: 'New' }),
    i('plan', C, 'SIP Calculator', 'How much to invest regularly to reach your savings goal', { kind: 'calculator', body: '' }),
    i('plan', C, 'Lumpsum Calculator', 'Know the value of a one time investment', { kind: 'calculator', body: '' }),
    i('plan', C, 'Dividend Calculator', 'Dividend income from your units', { kind: 'calculator', body: '' }),
    i('plan', C, 'Retirement Calculator', 'Plan to keep up your lifestyle after retirement', { badge: 'Coming Soon' }),
    i('plan', C, 'SWP Calculator', 'Regular withdrawals from your investment', { badge: 'Coming Soon' }),

    i('products', F, 'Equity Mutual Fund', 'Invest for long term capital growth (5+ years)'),
    i('products', F, 'Debt Mutual Fund', 'Invest for regular income (1 day to 3 years)'),
    i('products', F, 'Hybrid Mutual Fund', 'A mix of equity and debt'),
    i('products', F, 'Solution Oriented Schemes', 'Aimed at retirement and children benefit'),
    i('products', F, 'Passive Solutions', 'Index funds, ETFs and FoFs'),
    i('products', O, 'Featured Mutual Funds', 'The latest fund promotions', { kind: 'route', route: 'funds' }),
    i('products', O, 'ELSS Tax Saver', 'Invest and save tax under Section 80C', { badge: 'Coming Soon' }),
    i('products', O, 'SIP Offers', 'Start a SIP with a small amount'),

    i('help', S, 'Awareness Sessions', 'Join our free investor sessions', { kind: 'route', route: 'sessions' }),
    i('help', S, 'Contact Us', 'Write to us by e-mail or WhatsApp', { kind: 'route', route: 'contact' }),
    i('help', S, 'Locate Nearest Office', 'Find our team near you'),
    i('help', S, 'Complaint Redressal', 'How to raise a complaint and what happens next'),
    i('help', S, 'Subscribe for Updates', 'Get our updates'),
    i('help', S, 'Know Your Customer (KYC)', 'Get KYC compliant to start investing'),

    i('picks', 'Top Offers', 'Latest Mutual Fund Offers', 'See every fund promotion', { kind: 'route', route: 'funds' }),
  ];
})();

export const SITE_ROUTE_LABELS: Record<string, string> = { funds: 'Mutual Fund Offers page', sessions: 'Awareness Sessions page', contact: 'Contact Us page' };

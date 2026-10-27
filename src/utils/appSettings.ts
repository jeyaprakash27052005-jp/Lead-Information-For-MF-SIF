import { AppFeatureFlags, AppSettings } from '../types';

export const DEFAULT_FEATURES: AppFeatureFlags = {
  customerPortal: true,
  healthPortal: true,
  customerRegistration: true,
  mfCalculator: true,
  npsCalculator: true,
  schemesCatalog: false, // customers no longer browse the scheme list unless an admin turns it on
  healthCheckup: true,
  homeAds: true,
  awarenessPrograms: true,
  fundAds: true,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  features: DEFAULT_FEATURES,
  mfReturnRate: 12,
  npsReturnRate: 10,
  reportDelivery: 'message',
};

export const FEATURE_LABELS: { key: keyof AppFeatureFlags; label: string; help: string }[] = [
  { key: 'customerPortal', label: 'Customer Portal', help: 'The whole customer site: login, dashboard and everything inside it.' },
  { key: 'healthPortal', label: 'Finance Health Check-up Portal', help: 'The stand-alone health check-up web portal that anyone can open.' },
  { key: 'customerRegistration', label: 'Customer Registration', help: 'Lets new customers create their own account.' },
  { key: 'mfCalculator', label: 'Mutual Fund Calculator', help: 'Future value calculator for one-time, SIP or both.' },
  { key: 'npsCalculator', label: 'NPS Calculator', help: 'Future value calculator for NPS contributions.' },
  { key: 'schemesCatalog', label: 'Browse Published Schemes', help: 'Customers can see the list of published schemes.' },
  { key: 'healthCheckup', label: 'Finance Health Check-up (inside Customer Portal)', help: 'Shows the check-up tab to every customer. One customer can be blocked in User Management > Permissions.' },
  { key: 'homeAds', label: 'Home Screen Ads', help: 'The moving ad banners on the Home Screen.' },
  { key: 'awarenessPrograms', label: 'Awareness Programs', help: 'Shows the awareness programmes you add in the admin portal to customers and on the Home Screen.' },
  { key: 'fundAds', label: 'Mutual Fund Offers', help: 'Shows the mutual fund advertisements added by the admin team to customers and on the Home Screen.' },
];

const num = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 100 ? v : fallback;

/** Fills in anything missing so old or partial data never breaks the app */
export const mergeSettings = (raw: unknown): AppSettings => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<AppSettings>;
  const f = (r.features && typeof r.features === 'object' ? r.features : {}) as Partial<AppFeatureFlags>;
  const features = { ...DEFAULT_FEATURES };
  (Object.keys(DEFAULT_FEATURES) as (keyof AppFeatureFlags)[]).forEach((k) => {
    if (typeof f[k] === 'boolean') features[k] = f[k] as boolean;
  });
  return {
    features,
    reportDelivery: r.reportDelivery === 'email' || r.reportDelivery === 'message' ? r.reportDelivery : 'message',
    mfReturnRate: num(r.mfReturnRate, DEFAULT_APP_SETTINGS.mfReturnRate),
    npsReturnRate: num(r.npsReturnRate, DEFAULT_APP_SETTINGS.npsReturnRate),
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : undefined,
    updatedBy: typeof r.updatedBy === 'string' ? r.updatedBy : undefined,
  };
};

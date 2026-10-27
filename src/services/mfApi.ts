// Live fund data from https://api.mfapi.in (AMFI NAVs). /latest gives the fund details and the latest NAV;
// the full history (same address without /latest) is optional and is only used for returns and the worst fall.

const BASE = 'https://api.mfapi.in/mf';
export const DEFAULT_SCHEME_CODE = '125497';

export interface FundLatest {
  code: string;
  name: string;
  fundHouse: string;
  category: string;
  type: string;
  nav: number;
  date: string; // dd-mm-yyyy as published
}

interface RawNav {
  date?: unknown;
  nav?: unknown;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));

export async function fetchFundLatest(code: string, fetchImpl: typeof fetch = fetch): Promise<FundLatest> {
  if (!/^\d{4,8}$/.test(code)) throw new Error('A scheme code is only digits, for example 125497.');
  let res: Response;
  try {
    res = await fetchImpl(`${BASE}/${code}/latest`);
  } catch (_e) {
    throw new Error('The fund data service could not be reached. Check your connection and try again.');
  }
  if (!res.ok) throw new Error(res.status === 404 ? 'No fund was found for this scheme code.' : 'The fund data service is not available right now.');
  const j = (await res.json()) as { meta?: Record<string, unknown>; data?: RawNav[]; status?: unknown };
  const last = Array.isArray(j.data) ? j.data[0] : undefined;
  const nav = Number(last?.nav);
  if (!j.meta || !last || !Number.isFinite(nav)) throw new Error('No fund was found for this scheme code.');
  return {
    code: str(j.meta.scheme_code) || code,
    name: str(j.meta.scheme_name),
    fundHouse: str(j.meta.fund_house),
    category: str(j.meta.scheme_category),
    type: str(j.meta.scheme_type),
    nav,
    date: str(last.date),
  };
}

export interface NavPoint {
  t: number; // ms
  nav: number;
}

const parseDmy = (s: string): number => {
  const m = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
  return m ? Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : NaN;
};

/** Full NAV history, oldest first. Returns null when it cannot be loaded (the page then simply skips the return figures). */
export async function fetchFundHistory(code: string, fetchImpl: typeof fetch = fetch): Promise<NavPoint[] | null> {
  try {
    const res = await fetchImpl(`${BASE}/${code}`);
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: RawNav[] };
    if (!Array.isArray(j.data)) return null;
    const pts = j.data
      .map((d) => ({ t: parseDmy(str(d.date)), nav: Number(d.nav) }))
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.nav) && p.nav > 0)
      .sort((a, b) => a.t - b.t);
    return pts.length > 30 ? pts : null;
  } catch (_e) {
    return null;
  }
}

export interface FundStats {
  ret1y: number | null; // % (1 year, absolute)
  cagr3y: number | null; // % a year
  cagr5y: number | null;
  worstFall: number | null; // % largest peak-to-low fall in the last 3 years (negative)
  volatility: number | null; // % a year, from daily moves of the last 3 years
  fromDate: string;
  toDate: string;
}

const YEAR_MS = 365.25 * 86400000;

/** NAV on or just before a time */
const navAt = (pts: NavPoint[], t: number): NavPoint | null => {
  let lo = 0;
  let hi = pts.length - 1;
  if (t < pts[0].t) return null;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (pts[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return pts[lo];
};

export function fundStats(pts: NavPoint[]): FundStats {
  const end = pts[pts.length - 1];
  const back = (years: number) => {
    const p = navAt(pts, end.t - years * YEAR_MS);
    // the starting NAV must be close to the date asked for (within 10 days)
    return p && Math.abs(p.t - (end.t - years * YEAR_MS)) < 10 * 86400000 ? p : null;
  };
  const p1 = back(1);
  const p3 = back(3);
  const p5 = back(5);
  const cagr = (p: NavPoint | null, years: number) => (p ? (Math.pow(end.nav / p.nav, 1 / years) - 1) * 100 : null);

  const recent = pts.filter((p) => p.t >= end.t - 3 * YEAR_MS);
  let peak = -Infinity;
  let worst = 0;
  for (const p of recent) {
    peak = Math.max(peak, p.nav);
    worst = Math.min(worst, (p.nav / peak - 1) * 100);
  }
  let vol: number | null = null;
  if (recent.length > 60) {
    const r: number[] = [];
    for (let i = 1; i < recent.length; i++) r.push(Math.log(recent[i].nav / recent[i - 1].nav));
    const mean = r.reduce((s, x) => s + x, 0) / r.length;
    const variance = r.reduce((s, x) => s + (x - mean) ** 2, 0) / (r.length - 1);
    vol = Math.sqrt(variance) * Math.sqrt(250) * 100;
  }
  const fmt = (t: number) => new Date(t).toISOString().slice(0, 10);
  return {
    ret1y: p1 ? (end.nav / p1.nav - 1) * 100 : null,
    cagr3y: cagr(p3, 3),
    cagr5y: cagr(p5, 5),
    worstFall: recent.length > 1 ? worst : null,
    volatility: vol,
    fromDate: fmt(pts[0].t),
    toDate: fmt(end.t),
  };
}

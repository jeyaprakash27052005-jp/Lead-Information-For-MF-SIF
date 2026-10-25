// Finance formulas used by the admin "Investment Calculations" page. Pure functions, no screen code.
// Rates are given in percent (12 = 12 %). Money is in rupees.

const pct = (r: number) => r / 100;
const finite = (n: number) => (Number.isFinite(n) ? n : NaN);

/** Future value of a lumpsum: FV = P (1 + r)^t */
export const fvLumpsum = (p: number, ratePct: number, years: number) => p * Math.pow(1 + pct(ratePct), years);

export interface YearRow {
  year: number;
  invested: number;
  value: number;
}

export interface FutureValueResult {
  invested: number;
  futureValue: number;
  gain: number;
  realValue: number; // after inflation, in today's money
  rows: YearRow[];
}

/**
 * Future value of a lumpsum plus a monthly SIP that can step up every year.
 * Monthly rate i = (1 + r)^(1/12) - 1 (effective annual rate converted to monthly); SIP paid at the start of each month.
 */
export function futureValue(p: { lumpsum: number; sip: number; ratePct: number; years: number; stepUpPct: number; inflationPct: number }): FutureValueResult {
  const i = Math.pow(1 + pct(p.ratePct), 1 / 12) - 1;
  let value = p.lumpsum;
  let invested = p.lumpsum;
  let sip = p.sip;
  const rows: YearRow[] = [];
  const months = Math.round(p.years * 12);
  for (let m = 1; m <= months; m++) {
    value = (value + sip) * (1 + i);
    invested += sip;
    if (m % 12 === 0) {
      sip *= 1 + pct(p.stepUpPct);
      rows.push({ year: m / 12, invested, value });
    }
  }
  if (months % 12 !== 0) rows.push({ year: months / 12, invested, value });
  return {
    invested,
    futureValue: value,
    gain: value - invested,
    realValue: value / Math.pow(1 + pct(p.inflationPct), p.years),
    rows,
  };
}

/** Compound annual growth rate: CAGR = (End / Begin)^(1/t) - 1, in percent */
export const cagr = (begin: number, end: number, years: number) => finite((Math.pow(end / begin, 1 / years) - 1) * 100);
/** Absolute return in percent */
export const absoluteReturn = (begin: number, end: number) => finite(((end - begin) / begin) * 100);
/** Rate needed to grow `begin` to `target` in `years` (same as CAGR) */
export const requiredRate = cagr;
/** Rule of 72: years to double at r % (approximation) and the exact value */
export const doublingYears = (ratePct: number) => ({ rule72: 72 / ratePct, exact: Math.log(2) / Math.log(1 + pct(ratePct)) });
/** Fisher equation: real return = (1 + nominal) / (1 + inflation) - 1, in percent */
export const realReturn = (nominalPct: number, inflationPct: number) => ((1 + pct(nominalPct)) / (1 + pct(inflationPct)) - 1) * 100;

/** Monthly SIP needed to reach a goal (SIP at the start of each month) */
export function sipForGoal(goal: number, ratePct: number, years: number, lumpsumNow = 0): number {
  const i = Math.pow(1 + pct(ratePct), 1 / 12) - 1;
  const n = Math.round(years * 12);
  const need = goal - lumpsumNow * Math.pow(1 + i, n);
  if (need <= 0) return 0;
  if (i === 0) return need / n;
  return need / (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
}

// ---------------------------------------------------------------- dividends (IDCW)
export interface DividendResult {
  gross: number; // units x dividend per unit
  tax: number;
  net: number;
  yieldPct: number; // dividend per unit / NAV before the dividend
  navAfter: number; // NAV falls by the dividend on the ex-date
  reinvestUnits: number; // units bought if the net dividend is reinvested at the ex-date NAV
  totalUnitsAfterReinvest: number;
  valueAfterReinvest: number;
}

export function dividend(p: { units: number; dps: number; navBefore: number; taxPct: number }): DividendResult {
  const gross = p.units * p.dps;
  const tax = gross * pct(p.taxPct);
  const net = gross - tax;
  const navAfter = Math.max(p.navBefore - p.dps, 0);
  const reinvestUnits = navAfter > 0 ? net / navAfter : 0;
  return {
    gross,
    tax,
    net,
    yieldPct: p.navBefore > 0 ? (p.dps / p.navBefore) * 100 : NaN,
    navAfter,
    reinvestUnits,
    totalUnitsAfterReinvest: p.units + reinvestUnits,
    valueAfterReinvest: (p.units + reinvestUnits) * navAfter,
  };
}

/** Annual dividend yield from several payouts in a year (percent of the average NAV) */
export const annualDividendYield = (dpsPerYear: number, avgNav: number) => (avgNav > 0 ? (dpsPerYear / avgNav) * 100 : NaN);

/** Total return with dividends: (End NAV + dividends per unit - Begin NAV) / Begin NAV, in percent, and the CAGR of it */
export function totalReturnWithDividends(p: { beginNav: number; endNav: number; dividendsPerUnit: number; years: number }) {
  const total = ((p.endNav + p.dividendsPerUnit - p.beginNav) / p.beginNav) * 100;
  const annual = (Math.pow((p.endNav + p.dividendsPerUnit) / p.beginNav, 1 / p.years) - 1) * 100;
  return { total: finite(total), annual: finite(annual), priceOnly: absoluteReturn(p.beginNav, p.endNav) };
}

// ---------------------------------------------------------------- professional (MBA) formulas
/** Net present value: NPV = sum CF_t / (1 + r)^t, with CF_0 at time 0 */
export const npv = (ratePct: number, cashflows: number[]) => cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + pct(ratePct), t), 0);

/** Internal rate of return in percent (bisection, robust for ordinary projects). NaN if there is no sign change. */
export function irr(cashflows: number[]): number {
  const f = (r: number) => npv(r * 100, cashflows);
  let lo = -0.99;
  let hi = 10;
  let flo = f(lo);
  const fhi = f(hi);
  if (!(flo * fhi < 0)) return NaN;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-9) return mid * 100;
    if (flo * fm < 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
  }
  return ((lo + hi) / 2) * 100;
}

/** XIRR for cashflows on dates (percent a year, 365-day basis) */
export function xirr(flows: { date: Date; amount: number }[]): number {
  if (flows.length < 2) return NaN;
  const t0 = flows[0].date.getTime();
  const f = (r: number) => flows.reduce((s, c) => s + c.amount / Math.pow(1 + r, (c.date.getTime() - t0) / 86400000 / 365), 0);
  let lo = -0.99;
  let hi = 10;
  let flo = f(lo);
  if (!(flo * f(hi) < 0)) return NaN;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-9) return mid * 100;
    if (flo * fm < 0) hi = mid;
    else {
      lo = mid;
      flo = fm;
    }
  }
  return ((lo + hi) / 2) * 100;
}

/** Profitability index = PV of future cash flows / initial outlay */
export const profitabilityIndex = (ratePct: number, cashflows: number[]) => {
  const pv = npv(ratePct, [0, ...cashflows.slice(1)]);
  return cashflows[0] !== 0 ? pv / Math.abs(cashflows[0]) : NaN;
};

/** Simple and discounted payback period in years (null if never paid back) */
export function payback(ratePct: number | null, cashflows: number[]): number | null {
  let cum = 0;
  for (let t = 0; t < cashflows.length; t++) {
    const cf = ratePct === null ? cashflows[t] : cashflows[t] / Math.pow(1 + pct(ratePct), t);
    const next = cum + cf;
    if (t > 0 && cum < 0 && next >= 0) return t - 1 + -cum / cf;
    cum = next;
  }
  return null;
}

/** Present value of an ordinary annuity: PV = C (1 - (1 + r)^-n) / r */
export const pvAnnuity = (c: number, ratePct: number, n: number) => (ratePct === 0 ? c * n : (c * (1 - Math.pow(1 + pct(ratePct), -n))) / pct(ratePct));
/** Future value of an ordinary annuity: FV = C ((1 + r)^n - 1) / r */
export const fvAnnuity = (c: number, ratePct: number, n: number) => (ratePct === 0 ? c * n : (c * (Math.pow(1 + pct(ratePct), n) - 1)) / pct(ratePct));
/** Payment (EMI) on a loan: PMT = P r / (1 - (1 + r)^-n), r per period */
export const pmt = (principal: number, periodRatePct: number, n: number) =>
  periodRatePct === 0 ? principal / n : (principal * pct(periodRatePct)) / (1 - Math.pow(1 + pct(periodRatePct), -n));
/** Present value of a perpetuity (and growing perpetuity): PV = C / (r - g) */
export const pvPerpetuity = (c: number, ratePct: number, growthPct = 0) => c / (pct(ratePct) - pct(growthPct));

/** Capital Asset Pricing Model: expected return = Rf + beta (Rm - Rf), in percent */
export const capm = (rfPct: number, beta: number, rmPct: number) => rfPct + beta * (rmPct - rfPct);

/** Mean and sample standard deviation of periodic returns (percent) */
export function meanStd(returns: number[]) {
  const n = returns.length;
  const mean = returns.reduce((s, x) => s + x, 0) / n;
  const variance = n > 1 ? returns.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1) : NaN;
  return { mean, variance, std: Math.sqrt(variance) };
}

/** Risk-adjusted return measures (all inputs in percent a year) */
export const sharpe = (rp: number, rf: number, sd: number) => (rp - rf) / sd;
export const treynor = (rp: number, rf: number, beta: number) => (rp - rf) / beta;
export const jensenAlpha = (rp: number, rf: number, beta: number, rm: number) => rp - capm(rf, beta, rm);
export const sortino = (rp: number, rf: number, downsideDev: number) => (rp - rf) / downsideDev;

/** Weighted average cost of capital: WACC = E/V Re + D/V Rd (1 - Tc), in percent */
export const wacc = (equity: number, debt: number, rePct: number, rdPct: number, taxPct: number) => {
  const v = equity + debt;
  return (equity / v) * rePct + (debt / v) * rdPct * (1 - pct(taxPct));
};

/** Expense-ratio drag: value after `years` with the fund's cost taken off the return */
export const costDrag = (p: { lumpsum: number; grossPct: number; expensePct: number; years: number }) => {
  const before = fvLumpsum(p.lumpsum, p.grossPct, p.years);
  const after = fvLumpsum(p.lumpsum, p.grossPct - p.expensePct, p.years);
  return { before, after, lost: before - after };
};

// Formulas used by the admin "Investment Calculations" page (lumpsum and SIP future value / growth, dividends). Pure functions, no screen code.
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

/** Lumpsum growth year by year (value of the amount at the end of each year) */
export function lumpsumRows(p: { lumpsum: number; ratePct: number; years: number; inflationPct: number }) {
  const rows: YearRow[] = [];
  const whole = Math.floor(p.years + 1e-9);
  for (let y = 1; y <= whole; y++) rows.push({ year: y, invested: p.lumpsum, value: fvLumpsum(p.lumpsum, p.ratePct, y) });
  if (p.years - whole > 1e-9) rows.push({ year: p.years, invested: p.lumpsum, value: fvLumpsum(p.lumpsum, p.ratePct, p.years) });
  const fv = fvLumpsum(p.lumpsum, p.ratePct, p.years);
  return { rows, futureValue: fv, gain: fv - p.lumpsum, realValue: fv / Math.pow(1 + pct(p.inflationPct), p.years) };
}

/**
 * Yearly return (percent) that a monthly SIP earned, given what it is worth now:
 * finds r so that a SIP of `sip` a month for `years` grows to `value` (same method as the SIP future value).
 */
export function sipReturn(sip: number, years: number, value: number): number {
  const months = Math.round(years * 12);
  if (!(sip > 0) || months < 1 || !(value > 0)) return NaN;
  const fv = (r: number) => futureValue({ lumpsum: 0, sip, ratePct: r, years, stepUpPct: 0, inflationPct: 0 }).futureValue;
  let lo = -50;
  let hi = 200;
  if (value < fv(lo) || value > fv(hi)) return NaN;
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    if (fv(mid) < value) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
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

/** Expense-ratio drag: value after `years` with the fund's cost taken off the return */
export const costDrag = (p: { lumpsum: number; grossPct: number; expensePct: number; years: number }) => {
  const before = fvLumpsum(p.lumpsum, p.grossPct, p.years);
  const after = fvLumpsum(p.lumpsum, p.grossPct - p.expensePct, p.years);
  return { before, after, lost: before - after };
};

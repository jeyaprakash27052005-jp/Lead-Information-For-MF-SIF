// Rules for mutual fund advertisements (SEBI / AMFI advertising code): no promised returns, and the standard warning is always shown.
export const MF_DISCLAIMER = 'Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Past performance may or may not be sustained in the future.';

export const FUND_CATEGORIES = [
  'Equity - Large Cap',
  'Equity - Mid Cap',
  'Equity - Small Cap',
  'Equity - Flexi Cap / Multi Cap',
  'Equity - ELSS (Tax Saver)',
  'Index Fund / ETF',
  'Hybrid',
  'Debt',
  'Liquid / Money Market',
  'Gold / Other',
] as const;

export const RISK_LEVELS = ['Low', 'Low to Moderate', 'Moderate', 'Moderately High', 'High', 'Very High'] as const;

/** Words that promise or guarantee returns are not allowed in a mutual fund advertisement */
const BANNED = /guarantee|assured\s+(return|income|profit)|risk[\s-]?free|no\s+risk|sure\s+(shot|profit|return)|double\s+your\s+money|100\s*%\s*safe/i;

export const findBannedClaim = (...texts: (string | undefined)[]): string | null => {
  for (const t of texts) {
    const m = t ? BANNED.exec(t) : null;
    if (m) return m[0];
  }
  return null;
};

import { InvestmentPlan } from '../types';
import { HealthBand } from './healthCheck';
import { computeProjection } from './projection';

// ---------------------------------------------------------------------------
// Suggested monthly investment (shown in the Finance Health Check-up report)
//
//  1. Amount to invest = monthly income x a share that depends on the health score band
//        Excellent 25%  |  Good 20%  |  Fair 15%  |  At Risk 10%  |  Critical 5%
//     (rounded to the nearest Rs 500; below Rs 500 nothing is suggested)
//  2. NPS share of that amount depends on age (NPS money is locked until about 60):
//        up to 35 years 20%  |  36-45 years 30%  |  46-55 years 40%  |  56-59 years 50%  |  60+ no NPS
//     The rest goes to mutual funds. Below Rs 1,000 everything goes to mutual funds.
//  3. Future value uses the SIP formula with the return rates set by the admin team.
// It is a general guide based on the person's own answers, not personal financial advice.
// ---------------------------------------------------------------------------

const BAND_PCT: Record<HealthBand, number> = { Excellent: 25, Good: 20, Fair: 15, 'At Risk': 10, Critical: 5 };

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export const npsSharePct = (age: number) => (age >= 60 ? 0 : age <= 35 ? 20 : age <= 45 ? 30 : age <= 55 ? 40 : 50);

export function computeInvestmentPlan(
  input: { age: number; annualIncome: number; band: HealthBand },
  rates: { mfReturnRate: number; npsReturnRate: number }
): InvestmentPlan {
  const monthlyIncome = Math.max(0, input.annualIncome) / 12;
  const investPct = BAND_PCT[input.band];
  let monthlyInvest = roundTo((monthlyIncome * investPct) / 100, 500);
  if (monthlyInvest < 500) monthlyInvest = 0;

  let npsMonthly = 0;
  if (monthlyInvest >= 1000) {
    npsMonthly = Math.max(500, roundTo((monthlyInvest * npsSharePct(input.age)) / 100, 500));
    if (npsSharePct(input.age) === 0) npsMonthly = 0;
  }
  const mfMonthly = monthlyInvest - npsMonthly;

  const mfYears = 10;
  const npsYears = Math.max(5, Math.min(35, 60 - input.age));

  const sipValue = (amount: number, years: number, rate: number) =>
    amount > 0
      ? computeProjection({
          mode: 'sip',
          lumpsumAmount: 0,
          sipAmount: amount,
          frequency: 'monthly',
          durationValue: years,
          durationUnit: 'years',
          annualRatePct: rate,
        }).maturity
      : 0;

  let note = 'Increase the amount as your income grows. Review every year.';
  if (monthlyInvest === 0) {
    note = 'Your income leaves too little to invest right now. Build savings first, then start with a small SIP.';
  } else if (input.band === 'Critical' || input.band === 'At Risk') {
    note = 'Build an emergency fund and clear costly debt first. Start with this smaller amount and raise it as your score improves.';
  } else if (input.band === 'Fair') {
    note = 'Fix your priority areas while you invest this amount regularly.';
  }

  return {
    monthlyIncome: Math.round(monthlyIncome),
    investPct,
    monthlyInvest,
    mfMonthly,
    npsMonthly,
    mfRate: rates.mfReturnRate,
    npsRate: rates.npsReturnRate,
    mfYears,
    npsYears,
    mfValue: Math.round(sipValue(mfMonthly, mfYears, rates.mfReturnRate)),
    npsValue: Math.round(sipValue(npsMonthly, npsYears, rates.npsReturnRate)),
    note,
  };
}

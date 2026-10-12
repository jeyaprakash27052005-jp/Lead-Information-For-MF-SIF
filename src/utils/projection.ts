// ---------------------------------------------------------------------------
// Future value engine shared by the Mutual Fund and NPS calculators.
// The customer gives only: investment amount(s), how long, and how to invest
// (one-time lumpsum, SIP, or both). The expected return comes from the scheme.
//
//   Lumpsum : M = P x (1 + R)^t                  P = amount, R = annual return (decimal), t = years
//   SIP     : M = S x [ ((1 + i)^n - 1) / i ] x (1 + i)
//             S = amount per installment, i = annual return / installments per year / 100,
//             n = number of installments in the chosen period
// ---------------------------------------------------------------------------

export type InvestMode = 'lumpsum' | 'sip' | 'both';
export type SipFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type DurationUnit = 'days' | 'weeks' | 'months' | 'years';

export const FREQUENCIES: { value: SipFrequency; label: string; perYear: number; noun: string }[] = [
  { value: 'daily', label: 'Daily', perYear: 365, noun: 'day' },
  { value: 'weekly', label: 'Weekly', perYear: 52, noun: 'week' },
  { value: 'monthly', label: 'Monthly', perYear: 12, noun: 'month' },
  { value: 'quarterly', label: 'Quarterly', perYear: 4, noun: 'quarter' },
];

export const DURATION_UNITS: { value: DurationUnit; label: string; years: number; max: number }[] = [
  { value: 'days', label: 'Days', years: 1 / 365, max: 36500 },
  { value: 'weeks', label: 'Weeks', years: 1 / 52, max: 5200 },
  { value: 'months', label: 'Months', years: 1 / 12, max: 1200 },
  { value: 'years', label: 'Years', years: 1, max: 100 },
];

export interface ProjectionInput {
  mode: InvestMode;
  lumpsumAmount: number;
  sipAmount: number;
  frequency: SipFrequency;
  durationValue: number;
  durationUnit: DurationUnit;
  annualRatePct: number;
}

export interface ProjectionCheckpoint {
  label: string;
  invested: number;
  value: number;
  gain: number;
}

export interface ProjectionResult {
  years: number;
  installments: number;
  lumpsumInvested: number;
  sipInvested: number;
  invested: number;
  lumpsumValue: number;
  sipValue: number;
  maturity: number;
  gain: number;
  checkpoints: ProjectionCheckpoint[];
}

const EPS = 1e-9;

export const periodsPerYear = (f: SipFrequency) => FREQUENCIES.find((x) => x.value === f)!.perYear;
export const durationInYears = (value: number, unit: DurationUnit) =>
  value * DURATION_UNITS.find((u) => u.value === unit)!.years;

export const lumpsumFutureValue = (principal: number, annualRatePct: number, years: number) =>
  principal * Math.pow(1 + annualRatePct / 100, years);

export const sipFutureValue = (amount: number, annualRatePct: number, perYear: number, installments: number) => {
  if (installments <= 0) return 0;
  const i = annualRatePct / 100 / perYear;
  if (i === 0) return amount * installments;
  return amount * ((Math.pow(1 + i, installments) - 1) / i) * (1 + i);
};

export const installmentsFor = (years: number, perYear: number) => Math.floor(years * perYear + EPS);

/** Returns a message per invalid field (empty object = all good). */
export function validateProjection(input: ProjectionInput): Record<string, string> {
  const e: Record<string, string> = {};
  const usesLump = input.mode === 'lumpsum' || input.mode === 'both';
  const usesSip = input.mode === 'sip' || input.mode === 'both';
  if (usesLump && !(input.lumpsumAmount > 0)) e.lumpsum = 'Enter the one-time amount (more than 0)';
  if (usesSip && !(input.sipAmount > 0)) e.sip = 'Enter the SIP amount (more than 0)';
  const unit = DURATION_UNITS.find((u) => u.value === input.durationUnit)!;
  if (!Number.isInteger(input.durationValue) || input.durationValue < 1) e.duration = 'Enter the period as a whole number (1 or more)';
  else if (input.durationValue > unit.max) e.duration = `Maximum is ${unit.max} ${unit.label.toLowerCase()}`;
  else if (usesSip) {
    const y = durationInYears(input.durationValue, input.durationUnit);
    if (installmentsFor(y, periodsPerYear(input.frequency)) < 1) {
      e.duration = `This period is too short for a ${input.frequency} SIP - choose a longer period or a shorter SIP interval`;
    }
  }
  if (!(input.annualRatePct > 0)) e.rate = 'The selected scheme has no expected return set yet';
  return e;
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

export function computeProjection(input: ProjectionInput): ProjectionResult {
  const usesLump = input.mode === 'lumpsum' || input.mode === 'both';
  const usesSip = input.mode === 'sip' || input.mode === 'both';
  const years = durationInYears(input.durationValue, input.durationUnit);
  const perYear = periodsPerYear(input.frequency);

  const valueAt = (t: number) => {
    const n = usesSip ? installmentsFor(t, perYear) : 0;
    const lumpsumValue = usesLump ? lumpsumFutureValue(input.lumpsumAmount, input.annualRatePct, t) : 0;
    const sipValue = usesSip ? sipFutureValue(input.sipAmount, input.annualRatePct, perYear, n) : 0;
    const lumpsumInvested = usesLump ? input.lumpsumAmount : 0;
    const sipInvested = usesSip ? input.sipAmount * n : 0;
    return { n, lumpsumValue, sipValue, lumpsumInvested, sipInvested };
  };

  const end = valueAt(years);
  const invested = end.lumpsumInvested + end.sipInvested;
  const maturity = end.lumpsumValue + end.sipValue;

  // up to 12 checkpoints spread evenly over the period
  const steps = Math.min(12, input.durationValue);
  const unitNoun = input.durationUnit.slice(0, -1);
  const checkpoints: ProjectionCheckpoint[] = [];
  for (let k = 1; k <= steps; k++) {
    const t = (years * k) / steps;
    const v = valueAt(t);
    const inv = v.lumpsumInvested + v.sipInvested;
    const val = v.lumpsumValue + v.sipValue;
    const elapsed = (input.durationValue * k) / steps;
    const elapsedLabel = Number.isInteger(elapsed) ? plural(elapsed, unitNoun) : `${elapsed.toFixed(1)} ${input.durationUnit}`;
    checkpoints.push({ label: `After ${elapsedLabel}`, invested: inv, value: val, gain: val - inv });
  }

  return {
    years,
    installments: end.n,
    lumpsumInvested: end.lumpsumInvested,
    sipInvested: end.sipInvested,
    invested,
    lumpsumValue: end.lumpsumValue,
    sipValue: end.sipValue,
    maturity,
    gain: maturity - invested,
    checkpoints,
  };
}

export const describePeriod = (value: number, unit: DurationUnit) => plural(value, unit.slice(0, -1));

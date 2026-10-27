// Investor profile questionnaire (11 questions) and the rules that turn the answers into a profile and a fund-fit suggestion.
// General awareness only: this is not personalised investment advice.

export interface ProfileOption {
  id: string;
  label: string;
  points: number; // 1 (low risk capacity / appetite) to 5 (high)
}
export interface ProfileQuestion {
  id: string;
  topic: string;
  text: string;
  options: ProfileOption[];
}

const o = (labels: string[]): ProfileOption[] => labels.map((label, i) => ({ id: String.fromCharCode(97 + i), label, points: 5 - i }));

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  { id: 'age', topic: 'Age', text: 'What is your age?', options: o(['Below 30', '30 to 40', '41 to 50', '51 to 60', 'Above 60']) },
  { id: 'dependents', topic: 'Responsibilities', text: 'How many people depend on your income?', options: o(['No one', 'Only my spouse', '1 or 2 people (children / parents)', '3 or 4 people', '5 or more people']) },
  { id: 'income', topic: 'Income', text: 'How stable is your income?', options: o(['Very stable (government / permanent job)', 'Stable private salary', 'Steady business or profession', 'Irregular income', 'No regular income now']) },
  { id: 'surplus', topic: 'Savings', text: 'How much of your monthly income is left after all expenses?', options: o(['More than 40 %', '25 % to 40 %', '15 % to 25 %', '5 % to 15 %', 'Less than 5 %']) },
  { id: 'emergency', topic: 'Safety net', text: 'How many months of expenses do you keep as an emergency fund?', options: o(['More than 12 months', '6 to 12 months', '3 to 6 months', 'Less than 3 months', 'None']) },
  { id: 'debt', topic: 'Loans', text: 'How much of your income goes to loan EMIs?', options: o(['No loans', 'Less than 20 %', '20 % to 35 %', '35 % to 50 %', 'More than 50 %']) },
  { id: 'experience', topic: 'Experience', text: 'How long have you invested in shares or equity mutual funds?', options: o(['More than 10 years', '5 to 10 years', '2 to 5 years', 'Less than 2 years', 'Never, only FD / savings']) },
  { id: 'horizon', topic: 'Time', text: 'For how long can you keep this money invested?', options: o(['More than 10 years', '7 to 10 years', '5 to 7 years', '3 to 5 years', 'Less than 3 years']) },
  { id: 'goal', topic: 'Goal', text: 'What is the main goal of this investment?', options: o(['Build long-term wealth', 'Retirement', "Child's education or marriage", 'Buy a house or vehicle', 'Regular income and safety of money']) },
  { id: 'fall', topic: 'Reaction to loss', text: 'Your investment falls 20 % in three months. What would you do?', options: o(['Invest more at the lower price', 'Stay invested and wait', 'Wait, and sell part if it falls further', 'Sell part of it now', 'Sell everything']) },
  { id: 'loss', topic: 'Risk comfort', text: 'Which yearly outcome would you accept for the chance of higher growth?', options: o(['Up to 30 % loss in a bad year', 'Up to 20 % loss', 'Up to 10 % loss', 'Up to 5 % loss', 'No loss at all (like an FD)']) },
];

export type Answers = Record<string, string>; // question id -> option id

export type ProfileKey = 'conservative' | 'mod_conservative' | 'balanced' | 'mod_aggressive' | 'aggressive';

export interface ProfileInfo {
  key: ProfileKey;
  label: string;
  level: number; // 1..5
  maxFundRisk: number; // highest fund risk level (1..5) that suits this profile
  summary: string;
  allocation: { equity: number; debt: number; gold: number };
  tone: string; // tailwind colour name
}

export const PROFILES: Record<ProfileKey, ProfileInfo> = {
  conservative: { key: 'conservative', label: 'Conservative', level: 1, maxFundRisk: 2, tone: 'sky', allocation: { equity: 20, debt: 70, gold: 10 }, summary: 'Safety of money comes first. Prefer debt, liquid and short-term funds; keep equity small.' },
  mod_conservative: { key: 'mod_conservative', label: 'Moderately Conservative', level: 2, maxFundRisk: 3, tone: 'teal', allocation: { equity: 35, debt: 55, gold: 10 }, summary: 'You want steady growth with limited swings. Hybrid and debt funds with a modest equity part suit you.' },
  balanced: { key: 'balanced', label: 'Balanced', level: 3, maxFundRisk: 4, tone: 'amber', allocation: { equity: 50, debt: 40, gold: 10 }, summary: 'You can accept moderate ups and downs for better growth. A mix of equity and debt suits you.' },
  mod_aggressive: { key: 'mod_aggressive', label: 'Moderately Aggressive', level: 4, maxFundRisk: 5, tone: 'orange', allocation: { equity: 70, debt: 20, gold: 10 }, summary: 'Growth matters more than short-term swings. Mostly equity funds, with some debt to cushion falls.' },
  aggressive: { key: 'aggressive', label: 'Aggressive', level: 5, maxFundRisk: 5, tone: 'rose', allocation: { equity: 85, debt: 5, gold: 10 }, summary: 'You can stay invested through big falls for the highest long-term growth. Mostly equity funds.' },
};

const orderKeys: ProfileKey[] = ['conservative', 'mod_conservative', 'balanced', 'mod_aggressive', 'aggressive'];

export interface ProfileResult {
  score: number; // 11..55
  max: number;
  rawProfile: ProfileInfo; // from the score alone
  profile: ProfileInfo; // after safety limits
  limits: string[]; // reasons the profile was lowered
  weakAreas: string[]; // topics where the person scored 1 or 2
}

export const isProfileComplete = (a: Answers) => PROFILE_QUESTIONS.every((q) => !!a[q.id]);

const pointsOf = (q: ProfileQuestion, a: Answers) => q.options.find((x) => x.id === a[q.id])?.points ?? 0;

export function evaluateProfile(a: Answers): ProfileResult {
  const score = PROFILE_QUESTIONS.reduce((s, q) => s + pointsOf(q, a), 0);
  const rawKey: ProfileKey = score <= 19 ? 'conservative' : score <= 27 ? 'mod_conservative' : score <= 38 ? 'balanced' : score <= 46 ? 'mod_aggressive' : 'aggressive';
  let idx = orderKeys.indexOf(rawKey);
  const limits: string[] = [];
  const cap = (maxIdx: number, why: string) => {
    if (idx > maxIdx) {
      idx = maxIdx;
      limits.push(why);
    }
  };
  const p = (id: string) => pointsOf(PROFILE_QUESTIONS.find((q) => q.id === id)!, a);
  if (p('horizon') === 1) cap(1, 'You need the money in under 3 years, so risky investments are not suitable for it.');
  else if (p('horizon') === 2) cap(2, 'You need the money within 3 to 5 years, so the equity share is kept moderate.');
  if (p('emergency') === 1) cap(2, 'You have no emergency fund. Build 3 to 6 months of expenses first, then take more risk.');
  if (p('debt') === 1) cap(2, 'More than half of your income goes to EMIs, which reduces your ability to take risk.');
  if (p('fall') === 1) cap(1, 'You would sell everything in a fall, so a lower-risk mix will protect you from selling at a loss.');
  const weakAreas = PROFILE_QUESTIONS.filter((q) => pointsOf(q, a) <= 2).map((q) => q.topic);
  return { score, max: PROFILE_QUESTIONS.length * 5, rawProfile: PROFILES[rawKey], profile: PROFILES[orderKeys[idx]], limits, weakAreas };
}

// ---------------------------------------------------------------- fund fit
export type FundRiskLevel = 1 | 2 | 3 | 4 | 5;
export const FUND_RISK_LABEL: Record<FundRiskLevel, string> = { 1: 'Low', 2: 'Low to Moderate', 3: 'Moderate', 4: 'High', 5: 'Very High' };

/** Rough risk level of a fund from its category text (as published by AMFI). The fund's own riskometer is the final word. */
export function fundRiskLevel(category: string, type = ''): FundRiskLevel {
  const c = `${category} ${type}`.toLowerCase();
  if (/liquid|overnight|money market|ultra short|low duration/.test(c)) return 1;
  if (/arbitrage|gilt|corporate bond|banking|psu|short duration|medium|debt|income|bond|duration|floater|credit/.test(c) && !/equity|hybrid/.test(c)) return 2;
  if (/small cap|mid cap|midcap|smallcap|sector|thematic|international|global|fund of funds|\bfof\b|infrastructure|pharma|technology|banking sector|psu equity/.test(c)) return 5;
  if (/conservative hybrid|balanced advantage|dynamic asset|equity savings|multi asset|balanced hybrid/.test(c)) return 3;
  if (/aggressive hybrid|large cap|index|etf|elss|flexi|multi cap|focused|value|contra|dividend yield|large & mid|large and mid/.test(c)) return 4;
  if (/hybrid|balanced/.test(c)) return 3;
  return /equity/.test(c) ? 4 : 3;
}

/** Years of holding that the category normally needs */
export const minYearsFor = (level: FundRiskLevel) => (level >= 5 ? 7 : level === 4 ? 5 : level === 3 ? 3 : level === 2 ? 1 : 0);

const HORIZON_YEARS: Record<string, number> = { a: 12, b: 8, c: 6, d: 4, e: 2 };
export const horizonYears = (a: Answers) => HORIZON_YEARS[a.horizon] ?? 5;

export type FitKind = 'good' | 'partial' | 'poor';
export interface FundFit {
  kind: FitKind;
  title: string;
  share: string; // suggested largest share of the portfolio
  reasons: string[];
  how: string[]; // how to invest
}

export function fundFit(result: ProfileResult, answers: Answers, level: FundRiskLevel, fundLabel: string): FundFit {
  const max = result.profile.maxFundRisk;
  const gap = level - max;
  const reasons: string[] = [];
  const how: string[] = [];
  let kind: FitKind = gap <= 0 ? 'good' : gap === 1 ? 'partial' : 'poor';
  const years = horizonYears(answers);
  const need = minYearsFor(level);

  reasons.push(`${fundLabel} is in the ${FUND_RISK_LABEL[level]} risk group; your profile (${result.profile.label}) is comfortable up to ${FUND_RISK_LABEL[max as FundRiskLevel]}.`);
  if (years < need) {
    reasons.push(`This type of fund usually needs about ${need} years or more, and you plan to stay about ${years}. A short stay raises the chance of selling in a fall.`);
    kind = kind === 'good' ? 'partial' : 'poor';
  }
  if (result.limits.length) reasons.push(...result.limits);

  let share: string;
  if (kind === 'poor') share = 'Better to avoid this fund for now';
  else if (kind === 'partial') share = 'Keep it small: at most 10 % of your investments';
  else if (gap <= -1) share = 'Can be a core holding: up to 40 % to 60 % of your investments';
  else share = level >= 5 ? 'As a satellite holding: up to 20 % to 25 % of your investments' : 'Up to 30 % to 40 % of your investments';

  if (level >= 4) {
    how.push('Invest through a monthly SIP instead of one big amount, so you buy at different prices.');
    how.push('If you have a lumpsum, move it in parts over 6 to 12 months into this fund.');
  } else {
    how.push('A SIP or a lumpsum both work for this type of fund; SIP builds the habit.');
  }
  how.push(`Match the rest of your money to your mix: about ${result.profile.allocation.equity} % equity, ${result.profile.allocation.debt} % debt and ${result.profile.allocation.gold} % gold.`);
  how.push('Review once a year and rebalance if one part has grown far beyond its share.');

  const title = kind === 'good' ? 'Suitable for your profile' : kind === 'partial' ? 'Suitable only in a small amount' : 'Not suitable for your profile now';
  return { kind, title, share, reasons, how };
}

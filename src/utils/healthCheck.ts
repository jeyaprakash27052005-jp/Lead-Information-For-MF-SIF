// ---------------------------------------------------------------------------
// Finance Health Check-up: a short psychometric-style questionnaire.
// Every statement is answered on a 1-5 scale (Strongly disagree ... Strongly agree).
// Statements marked `reverse` describe a negative habit, so their score is flipped (6 - answer).
// Each category score = average of its statements, converted to 0-100.
// Overall score = average of the category scores.
// ---------------------------------------------------------------------------

export interface HealthQuestion {
  id: string;
  category: string;
  text: string;
  reverse?: boolean;
}

export interface HealthCategory {
  id: string;
  label: string;
  intro: string;
  low: string; // advice when the score is low
  mid: string;
  high: string;
}

export const LIKERT = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
];

export const HEALTH_CATEGORIES: HealthCategory[] = [
  {
    id: 'savings',
    label: 'Savings Habit',
    intro: 'How regularly and how much you set aside.',
    low: 'Start a fixed monthly saving on salary day, even a small amount, and raise it step by step towards 20% of your income.',
    mid: 'You save, but not always on a fixed plan. Automate the saving so it happens before spending.',
    high: 'Your saving habit is strong. Keep raising the amount whenever your income grows.',
  },
  {
    id: 'spending',
    label: 'Spending Control',
    intro: 'How well you plan and control day-to-day spending.',
    low: 'Track your expenses for one month and set a simple budget (needs, wants, savings). Pause before unplanned purchases.',
    mid: 'You have some control. A written monthly budget will help you catch leaks.',
    high: 'You spend with awareness. Keep reviewing your budget every few months.',
  },
  {
    id: 'emergency',
    label: 'Emergency Preparedness',
    intro: 'Whether you can handle a sudden loss of income or big expense.',
    low: 'Build an emergency fund of 3 months of expenses first, then grow it to 6 months in a liquid or savings account.',
    mid: 'You have a partial cushion. Work towards 6 months of expenses kept easy to access.',
    high: 'You are well prepared for surprises. Review the amount when your expenses rise.',
  },
  {
    id: 'debt',
    label: 'Debt & Credit Management',
    intro: 'How safely you handle loans, EMIs and credit cards.',
    low: 'Clear credit card dues first, avoid borrowing for daily needs, and keep total EMIs below 40% of income.',
    mid: 'Your debt is manageable. Prepay costly loans when you can and never miss a due date.',
    high: 'You handle credit responsibly. Keep your credit score healthy by paying on time.',
  },
  {
    id: 'protection',
    label: 'Protection (Insurance)',
    intro: 'Whether you and your family are protected against risks.',
    low: 'Get adequate health insurance and, if others depend on your income, a term life policy. Review cover every two years.',
    mid: 'You have some protection. Check that the cover amount is enough for today\'s costs.',
    high: 'Your protection looks solid. Keep reviewing it after major life changes.',
  },
  {
    id: 'investing',
    label: 'Investing & Goals',
    intro: 'How clearly your money is working towards your goals.',
    low: 'Write down 2-3 goals with amounts and dates, then start a regular SIP towards them in schemes that match your risk comfort.',
    mid: 'You are on the way. Link each investment to a specific goal and review it once a year.',
    high: 'You invest with purpose. Keep reviewing returns and risk against your goals.',
  },
  {
    id: 'mindset',
    label: 'Money Mindset',
    intro: 'Your confidence and behaviour around money decisions.',
    low: 'Money stress is high. Small, steady steps (budget, emergency fund, one goal) quickly build confidence. Talk to a trusted adviser.',
    mid: 'You are fairly comfortable. Make decisions on research and your plan, not on tips or fear of missing out.',
    high: 'You feel in control of your money. Share the habit with your family.',
  },
];

export const HEALTH_QUESTIONS: HealthQuestion[] = [
  { id: 'sav1', category: 'savings', text: 'I save a fixed part of my income every month before spending on anything else.' },
  { id: 'sav2', category: 'savings', text: 'Over the last 12 months I have saved at least 10% of my income.' },
  { id: 'sav3', category: 'savings', text: 'When my income rises, I increase my savings instead of only my spending.' },

  { id: 'spe1', category: 'spending', text: 'I know roughly where my money goes every month (I track or budget my expenses).' },
  { id: 'spe2', category: 'spending', text: 'I often spend on things I had not planned to buy.', reverse: true },
  { id: 'spe3', category: 'spending', text: 'I wait and think before making a big purchase.' },

  { id: 'eme1', category: 'emergency', text: 'I have emergency savings that can cover at least 6 months of my expenses.' },
  { id: 'eme2', category: 'emergency', text: 'If I lost my income today, I could manage for some months without borrowing.' },
  { id: 'eme3', category: 'emergency', text: 'My emergency money is kept where I can reach it quickly.' },

  { id: 'deb1', category: 'debt', text: 'I pay all my EMIs and credit card bills in full and on time.' },
  { id: 'deb2', category: 'debt', text: 'My total monthly loan EMIs are less than 40% of my income.' },
  { id: 'deb3', category: 'debt', text: 'I often borrow money to meet my day-to-day expenses.', reverse: true },

  { id: 'pro1', category: 'protection', text: 'I have health insurance that covers me and my family adequately.' },
  { id: 'pro2', category: 'protection', text: 'If others depend on my income, I have a term life insurance cover for them.' },
  { id: 'pro3', category: 'protection', text: 'I have reviewed my insurance cover in the last two years.' },

  { id: 'inv1', category: 'investing', text: 'I have clear financial goals with amounts and dates (child\'s education, home, retirement).' },
  { id: 'inv2', category: 'investing', text: 'I invest regularly (SIP, mutual funds, NPS, PPF or similar) towards my goals.' },
  { id: 'inv3', category: 'investing', text: 'I understand the risk and the expected return of what I invest in.' },

  { id: 'min1', category: 'mindset', text: 'I feel anxious or stressed when I think about my money.', reverse: true },
  { id: 'min2', category: 'mindset', text: 'I take money decisions on research and my plan, not on tips or fear of missing out.' },
  { id: 'min3', category: 'mindset', text: 'I feel confident that I will be financially comfortable in the future.' },
];

export type HealthBand = 'Excellent' | 'Good' | 'Fair' | 'At Risk' | 'Critical';

export const bandFor = (score: number): HealthBand =>
  score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : score >= 35 ? 'At Risk' : 'Critical';

export const BAND_STYLE: Record<HealthBand, { text: string; bg: string; border: string; bar: string; rgb: [number, number, number] }> = {
  Excellent: { text: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-300', bar: 'bg-emerald-500', rgb: [16, 185, 129] },
  Good: { text: 'text-teal-800', bg: 'bg-teal-50', border: 'border-teal-300', bar: 'bg-teal-500', rgb: [20, 184, 166] },
  Fair: { text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-300', bar: 'bg-amber-500', rgb: [245, 158, 11] },
  'At Risk': { text: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-300', bar: 'bg-orange-500', rgb: [249, 115, 22] },
  Critical: { text: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-300', bar: 'bg-rose-500', rgb: [244, 63, 94] },
};

export const BAND_SUMMARY: Record<HealthBand, string> = {
  Excellent: 'Your finances are in very good shape. Keep your habits and review them regularly.',
  Good: 'Your finances are healthy with a few areas to strengthen.',
  Fair: 'Your finances are average. Fixing the priority areas below will make a clear difference.',
  'At Risk': 'Your finances need attention. Start with the priority areas below.',
  Critical: 'Your finances need urgent care. Take the first steps below and speak to an adviser.',
};

export interface HealthScoreResult {
  overall: number;
  band: HealthBand;
  categories: { id: string; label: string; score: number; band: HealthBand; tip: string }[];
  strengths: string[];
  priorities: string[];
  moneyStyle: string;
}

const questionScore = (q: HealthQuestion, answer: number) => (q.reverse ? 6 - answer : answer);

export const isComplete = (answers: Record<string, number>) =>
  HEALTH_QUESTIONS.every((q) => Number.isInteger(answers[q.id]) && answers[q.id] >= 1 && answers[q.id] <= 5);

export function computeHealthScore(answers: Record<string, number>): HealthScoreResult {
  const categories = HEALTH_CATEGORIES.map((c) => {
    const qs = HEALTH_QUESTIONS.filter((q) => q.category === c.id);
    const avg = qs.reduce((sum, q) => sum + questionScore(q, answers[q.id] || 1), 0) / qs.length;
    const score = Math.round(((avg - 1) / 4) * 100);
    const tip = score >= 70 ? c.high : score >= 45 ? c.mid : c.low;
    return { id: c.id, label: c.label, score, band: bandFor(score), tip };
  });
  const overall = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);

  const byScore = [...categories].sort((a, b) => b.score - a.score);
  const strengths = byScore.filter((c) => c.score >= 65).slice(0, 2).map((c) => c.label);
  const priorities = [...byScore].reverse().filter((c) => c.score < 65).slice(0, 3).map((c) => c.label);

  const sc = (id: string) => categories.find((c) => c.id === id)!.score;
  let moneyStyle = 'Balanced Builder';
  if (sc('investing') >= 70 && sc('savings') >= 70) moneyStyle = 'Goal-Driven Planner';
  else if (sc('savings') >= 70 && sc('investing') < 50) moneyStyle = 'Cautious Saver';
  else if (sc('spending') < 45) moneyStyle = 'Spontaneous Spender';
  else if (sc('mindset') < 45) moneyStyle = 'Anxious Manager';

  return { overall, band: bandFor(overall), categories, strengths, priorities, moneyStyle };
}

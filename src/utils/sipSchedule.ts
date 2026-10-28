import { SipFrequency, SipOption, SipPlan } from '../types';

export const SIP_REMIND_DAYS = 3;
export const SIP_OPTIONS: { value: SipOption; label: string }[] = [
  { value: 'growth', label: 'Growth' },
  { value: 'dividend_payout', label: 'Dividend Payout' },
  { value: 'dividend_reinvest', label: 'Reinvestment of Dividend' },
];
export const SIP_FREQUENCIES: { value: SipFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];
export const optionLabel = (o: SipOption) => SIP_OPTIONS.find((x) => x.value === o)?.label ?? o;
export const frequencyLabel = (f: SipFrequency) => SIP_FREQUENCIES.find((x) => x.value === f)?.label ?? f;

/** YYYY-MM-DD <-> local date (no time zone shifts) */
export const parseDay = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const dayString = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const DAY = 86400000;
export const daysBetween = (a: Date, b: Date): number => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);

/** The first investment date on or after `from`, or null once the SIP has ended */
export const nextInstallment = (plan: Pick<SipPlan, 'startDate' | 'endDate' | 'frequency'>, from: Date = new Date()): Date | null => {
  const today = startOfDay(from);
  const start = parseDay(plan.startDate);
  const end = parseDay(plan.endDate);
  let next: Date;
  if (today <= start) next = start;
  else if (plan.frequency === 'daily') next = today;
  else if (plan.frequency === 'weekly') {
    const weeks = Math.ceil(daysBetween(start, today) / 7);
    next = new Date(start.getFullYear(), start.getMonth(), start.getDate() + weeks * 7);
  } else {
    // monthly: same day of the month as the start date (the last day when the month is shorter)
    let k = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    const at = (n: number) => {
      const first = new Date(start.getFullYear(), start.getMonth() + n, 1);
      const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      return new Date(first.getFullYear(), first.getMonth(), Math.min(start.getDate(), last));
    };
    next = at(k);
    while (next < today) next = at(++k);
  }
  return next > end ? null : next;
};

export interface SipDue {
  plan: SipPlan;
  date: Date;
  inDays: number;
  /** true from 3 days before the investment date until the day itself */
  remind: boolean;
}

export const dueFor = (plan: SipPlan, from: Date = new Date()): SipDue | null => {
  if (!plan.isActive) return null;
  const date = nextInstallment(plan, from);
  if (!date) return null;
  const inDays = daysBetween(from, date);
  return { plan, date, inDays, remind: inDays <= SIP_REMIND_DAYS };
};

export const whenText = (inDays: number): string => (inDays <= 0 ? 'Today' : inDays === 1 ? 'Tomorrow' : `In ${inDays} days`);

/** The day the reminder starts for an investment date (3 days before) */
export const reminderDate = (investDate: Date): Date => new Date(investDate.getFullYear(), investDate.getMonth(), investDate.getDate() - SIP_REMIND_DAYS);
export const repeatText = (f: SipFrequency): string => (f === 'daily' ? 'every day' : f === 'weekly' ? 'every week, 3 days before the same weekday' : 'every month, 3 days before the same date');

/** true when the incharge has marked the investor as reminded for this investment date */
export const isReminded = (plan: SipPlan, investDate: Date): boolean => plan.remindedFor === dayString(investDate);

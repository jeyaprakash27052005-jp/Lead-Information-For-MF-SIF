import { HealthScoreResult, BAND_SUMMARY } from './healthCheck';
import { InvestmentPlan } from '../types';

/** The full Finance Health Check-up report as plain text for a WhatsApp / SMS message */
export const buildReportMessage = (p: {
  name: string;
  score: number;
  band: string;
  monthlyInvest?: number;
  result?: HealthScoreResult | null;
  plan?: InvestmentPlan | null;
}): string => {
  const inr = (n: number) => `Rs ${Math.round(n).toLocaleString('en-IN')}`;
  const r = p.result;
  const lines: (string | false | null | undefined)[] = [
    `Hello ${p.name},`,
    `*Your Finance Health Check-up Report*`,
    `Score: *${p.score}/100 (${p.band})*`,
    r && BAND_SUMMARY[r.band],
    r && r.categories.length > 0 && `\n*Topic scores*\n${r.categories.map((c) => `- ${c.label}: ${c.score}/100 (${c.band})`).join('\n')}`,
    r && r.strengths.length > 0 && `\n*Your strengths*\n${r.strengths.map((s) => `- ${s}`).join('\n')}`,
    r && r.priorities.length > 0 && `\n*Fix these first*\n${r.priorities.map((s) => `- ${s}`).join('\n')}`,
    p.plan
      ? `\n*Suggested monthly investing*\nTotal ${inr(p.plan.monthlyInvest)} (${p.plan.investPct}% of income): Mutual funds ${inr(p.plan.mfMonthly)}, NPS ${inr(p.plan.npsMonthly)}`
      : p.monthlyInvest
      ? `\nSuggested monthly investment: ${inr(p.monthlyInvest)}.`
      : '',
    '\nThe full PDF report is attached or downloaded on your device. This is for general awareness and is not financial advice. Our team may contact you to help with the next steps.',
  ];
  return lines.filter(Boolean).join('\n');
};

export const whatsappUrl = (mobile: string, text: string) => `https://wa.me/91${mobile}?text=${encodeURIComponent(text)}`;
// SMS has a short limit, so it carries the score and the main points only
export const smsUrl = (mobile: string, text: string) => `sms:+91${mobile}?body=${encodeURIComponent(text.slice(0, 600))}`;

/** Opens the phone's share sheet with the PDF attached (WhatsApp, Messages...). Returns false when the device cannot share files. */
export const sharePdf = async (blob: Blob, fileName: string, text: string): Promise<boolean> => {
  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], text, title: 'Finance Health Check-up Report' });
      return true;
    }
  } catch (_e) {
    // cancelled or not supported
  }
  return false;
};

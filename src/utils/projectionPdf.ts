import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectionInput, ProjectionResult, FREQUENCIES, describePeriod } from './projection';

// Standard PDF fonts cannot print the rupee sign, so amounts are written as "Rs."
const rs = (n: number) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))}`;

export interface ProjectionReport {
  kind: 'mutual_fund' | 'nps';
  schemeName: string;
  category?: string;
  input: ProjectionInput;
  result: ProjectionResult;
  customerName?: string;
}

export function generateProjectionPDF(data: ProjectionReport, action: 'download' | 'blob' = 'download') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const isNps = data.kind === 'nps';
  const title = isNps ? 'NPS Scheme Return Projection' : 'Mutual Fund Return Projection';
  const accent: [number, number, number] = isNps ? [29, 78, 216] : [79, 70, 229];
  const { input, result } = data;
  const usesLump = input.mode === 'lumpsum' || input.mode === 'both';
  const usesSip = input.mode === 'sip' || input.mode === 'both';
  const freq = FREQUENCIES.find((f) => f.value === input.frequency)!;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(title, 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text('Mutual fund (SIF) and NPS scheme return calculating site', 14, 23);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 29);

  // Prepared for / scheme
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(data.schemeName, 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${data.category ? data.category + '  |  ' : ''}Expected return: ${input.annualRatePct}% p.a.`,
    14,
    50
  );
  doc.text(`Prepared for: ${data.customerName || 'Valued Investor'}`, 14, 56);

  // Inputs
  const rows: string[][] = [['Investment mode', input.mode === 'both' ? 'One-time lumpsum + SIP' : input.mode === 'sip' ? 'SIP' : 'One-time lumpsum']];
  if (usesLump) rows.push(['One-time (lumpsum) amount', rs(input.lumpsumAmount)]);
  if (usesSip) {
    rows.push([`SIP amount (${freq.label.toLowerCase()})`, rs(input.sipAmount)]);
    rows.push(['Number of SIP installments', String(result.installments)]);
  }
  rows.push(['Investment period', describePeriod(input.durationValue, input.durationUnit)]);
  autoTable(doc, {
    startY: 62,
    head: [['Details you entered', '']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: accent, textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.2 },
    columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold' } },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Result boxes
  const box = (x: number, label: string, value: string, fill: [number, number, number], text: [number, number, number]) => {
    doc.setFillColor(...fill);
    doc.roundedRect(x, y, 58, 24, 2, 2, 'F');
    doc.setTextColor(...text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(label, x + 4, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(value, x + 4, y + 18);
  };
  box(14, 'TOTAL INVESTED', rs(result.invested), [241, 245, 249], [51, 65, 85]);
  box(76, 'ESTIMATED GAIN', rs(result.gain), [236, 253, 245], [4, 120, 87]);
  box(138, 'ESTIMATED FUTURE VALUE', rs(result.maturity), [238, 242, 255], [55, 48, 163]);
  y += 32;

  if (input.mode === 'both') {
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Lumpsum part: ${rs(result.lumpsumInvested)} grows to ${rs(result.lumpsumValue)}`, 14, y);
    doc.text(`SIP part: ${rs(result.sipInvested)} grows to ${rs(result.sipValue)}`, 14, y + 5);
    y += 12;
  }

  // Formula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Formula used', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let fy = y + 5;
  if (usesLump) {
    doc.text('Lumpsum:  M = P x (1 + R)^t      (P = amount, R = annual return as a decimal, t = years)', 14, fy);
    fy += 5;
  }
  if (usesSip) {
    doc.text('SIP:  M = S x [ ((1 + i)^n - 1) / i ] x (1 + i)', 14, fy);
    fy += 4.5;
    doc.text(`        S = amount per installment, i = ${input.annualRatePct} / ${freq.perYear} / 100, n = ${result.installments} installments`, 14, fy);
    fy += 5;
  }
  y = fy + 3;

  autoTable(doc, {
    startY: y,
    head: [['Progress', 'Invested', 'Estimated value', 'Estimated gain']],
    body: result.checkpoints.map((c) => [c.label, rs(c.invested), rs(c.value), rs(c.gain)]),
    theme: 'striped',
    headStyles: { fillColor: accent, textColor: 255, fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2 },
  });
  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const note =
    'This is an illustrative projection based on the expected return of the selected scheme, which is not guaranteed. Actual returns may be different. Investments are subject to market risks - please read all scheme documents carefully.';
  doc.text(doc.splitTextToSize(note, 182), 14, Math.min(endY, 280));

  if (action === 'blob') return doc.output('blob');
  doc.save(`${isNps ? 'nps' : 'mutual-fund'}-projection-${new Date().toISOString().slice(0, 10)}.pdf`);
  return null;
}

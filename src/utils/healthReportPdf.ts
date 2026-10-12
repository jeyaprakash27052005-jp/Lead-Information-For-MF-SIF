import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BAND_STYLE, BAND_SUMMARY, HealthScoreResult } from './healthCheck';

const rs = (n: number) => `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n))}`;

export interface HealthReportPdfInput {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  annualIncome: number;
  region?: string;
  createdAt?: string;
  score: HealthScoreResult;
}

export function generateHealthReportPDF(data: HealthReportPdfInput, action: 'download' | 'blob' = 'download') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { score } = data;
  const style = BAND_STYLE[score.band];

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Finance Health Check-up Report', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text('Mutual fund (SIF) and NPS scheme return calculating site', 14, 23);
  doc.text(`Date: ${new Date(data.createdAt || Date.now()).toLocaleString('en-IN')}`, 14, 29);

  // Profile
  autoTable(doc, {
    startY: 40,
    body: [
      ['Name', data.name, 'Age', String(data.age)],
      ['Gender', data.gender, 'Occupation', data.occupation],
      ['Annual income', rs(data.annualIncome), 'Region', data.region || '-'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 32 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 32 },
    },
  });
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Score card
  doc.setFillColor(...style.rgb);
  doc.roundedRect(14, y, 60, 34, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text(String(score.overall), 24, y + 18);
  doc.setFontSize(11);
  doc.text('/ 100', 46, y + 18);
  doc.setFontSize(10);
  doc.text(`Financial health: ${score.band}`, 20, y + 28);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Money style: ${score.moneyStyle}`, 82, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(doc.splitTextToSize(BAND_SUMMARY[score.band], 112), 82, y + 16);
  if (score.strengths.length) doc.text(`Strengths: ${score.strengths.join(', ')}`, 82, y + 29);
  y += 42;

  // Category bars
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Your score by area', 14, y);
  y += 5;
  score.categories.forEach((c) => {
    const st = BAND_STYLE[c.band];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(c.label, 14, y + 4);
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(66, y, 100, 5, 1, 1, 'F');
    doc.setFillColor(...st.rgb);
    if (c.score > 0) doc.roundedRect(66, y, Math.max(2, c.score), 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.score}  (${c.band})`, 170, y + 4);
    y += 8;
  });
  y += 4;

  if (score.priorities.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(180, 83, 9);
    doc.text(`Priority areas: ${score.priorities.join(', ')}`, 14, y);
    y += 5;
  }

  autoTable(doc, {
    startY: y,
    head: [['Area', 'Score', 'What to do']],
    body: score.categories.map((c) => [c.label, `${c.score}`, c.tip]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2.2, valign: 'top' },
    columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' }, 1: { cellWidth: 16 } },
  });
  const endY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const note =
    'This report is based only on your own answers. It is for general awareness and is not financial, tax or legal advice. Please speak to a qualified adviser before making investment or insurance decisions.';
  const lines = doc.splitTextToSize(note, 182);
  if (endY > 270) doc.addPage();
  doc.text(lines, 14, endY > 270 ? 20 : endY);

  if (action === 'blob') return doc.output('blob');
  doc.save(`finance-health-report-${data.name.trim().replace(/\s+/g, '-').toLowerCase() || 'customer'}.pdf`);
  return null;
}

/** Converts a PDF blob to base64 (no "data:" prefix) for e-mailing. */
export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not prepare the PDF.'));
    reader.readAsDataURL(blob);
  });

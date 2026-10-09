import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatInr } from './currency';

export interface MutualFundCalculationReport {
  schemeName: string;
  calcType: 'sip' | 'lumpsum';
  monthlyInvestment: number;
  lumpsumAmount: number;
  expectedRate: number;
  tenureYears: number;
  annualStepUp?: number;
  invested: number;
  gain: number;
  maturity: number;
  yearlyData: Array<{
    year: number;
    invested: number;
    gain: number;
    total: number;
  }>;
  customerName?: string;
}

export interface NPSCalculationReport {
  schemeName: string;
  currentAge: number;
  retirementAge: number;
  yearsToInvest: number;
  monthlyContribution: number;
  expectedReturnRate: number;
  annuityPercent: number;
  annuityReturnRate: number;
  totalInvested: number;
  accumulatedCorpus: number;
  lumpSumCorpus: number;
  annuityCorpus: number;
  monthlyPension: number;
  estimatedTaxSavedYearly: number;
  yearlyBreakdown: Array<{
    age: number;
    invested: number;
    corpus: number;
  }>;
  customerName?: string;
}

/**
 * Generate and download PDF for Mutual Fund Calculation
 */
export function generateMutualFundPDF(data: MutualFundCalculationReport, action: 'download' | 'view' = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const emeraldColor = [5, 150, 105]; // Emerald 600
  const lightBg = [248, 250, 252]; // Slate 50

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Mutual fund (SIF) and NPS scheme return calculating site', 14, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('MUTUAL FUND RETURN & COMPOUNDING PROJECTION STATEMENT', 14, 23);

  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 30);
  doc.text('Portal: MF-SIF-investment-calculator.vercel.app', 130, 30);

  // 2. Customer & Scheme Summary Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 32, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Scheme: ${data.schemeName}`, 20, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Investor Name: ${data.customerName || 'Valued Investor'}`, 20, 58);
  doc.text(`Plan Type: ${data.calcType === 'sip' ? 'Systematic Investment Plan (SIP)' : 'One-time Lumpsum'}`, 20, 65);

  if (data.calcType === 'sip') {
    doc.text(`Monthly Contribution: ${formatInr(data.monthlyInvestment)}`, 110, 58);
    if (data.annualStepUp && data.annualStepUp > 0) {
      doc.text(`Annual Step-up: +${data.annualStepUp}% every year`, 110, 65);
    } else {
      doc.text(`Annual Step-up: 0% (Standard SIP)`, 110, 65);
    }
  } else {
    doc.text(`Lumpsum Investment: ${formatInr(data.lumpsumAmount)}`, 110, 58);
    doc.text(`Investment Duration: ${data.tenureYears} Years`, 110, 65);
  }

  // 3. Highlighted Result Cards (Total Corpus, Invested, Wealth Gain)
  // Maturity Box
  doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
  doc.roundedRect(14, 80, 60, 26, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('TOTAL MATURITY CORPUS', 18, 86);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(formatInr(Math.round(data.maturity)), 18, 96);
  doc.setFontSize(7);
  doc.text(`at ${data.expectedRate}% CAGR / ${data.tenureYears} yrs`, 18, 102);

  // Invested Capital Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(77, 80, 56, 26, 2, 2, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('TOTAL INVESTED CAPITAL', 81, 86);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(formatInr(Math.round(data.invested)), 81, 96);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const investedPct = data.maturity > 0 ? ((data.invested / data.maturity) * 100).toFixed(1) : '0';
  doc.text(`${investedPct}% of future maturity`, 81, 102);

  // Estimated Wealth Gain Box
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(136, 80, 60, 26, 2, 2, 'FD');
  doc.setTextColor(4, 120, 87);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('ESTIMATED WEALTH GAIN', 140, 86);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`+${formatInr(Math.round(data.gain))}`, 140, 96);
  doc.setFontSize(7);
  const gainPct = data.maturity > 0 ? ((data.gain / data.maturity) * 100).toFixed(1) : '0';
  doc.text(`${gainPct}% net compounding profit`, 140, 102);

  // 4. Detailed Year-by-Year Growth Table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Year-by-Year Compounding Trajectory', 14, 115);

  const tableRows = data.yearlyData.map((row) => [
    `Year ${row.year}`,
    formatInr(Math.round(row.invested)),
    `+${formatInr(Math.round(row.gain))}`,
    formatInr(Math.round(row.total)),
  ]);

  autoTable(doc, {
    startY: 119,
    head: [['Investment Period', 'Total Invested', 'Estimated Returns (Profit)', 'Future Value (Corpus)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer / Disclaimer
  const finalY = (doc as any).lastAutoTable?.finalY || 250;
  if (finalY < 275) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Disclaimer: Mutual fund investments are subject to market risks. Read all scheme related documents carefully. Projections are indicative calculations based on user-entered rates.',
      14,
      finalY + 10,
      { maxWidth: 182 }
    );
  }

  const cleanName = data.schemeName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const fileName = `MF_Return_Report_${cleanName}.pdf`;

  if (action === 'view') {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}

/**
 * Generate and download PDF for NPS Pension Calculation
 */
export function generateNPSPDF(data: NPSCalculationReport, action: 'download' | 'view' = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const blueColor = [37, 99, 235]; // Blue 600
  const lightBg = [248, 250, 252];

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Mutual fund (SIF) and NPS scheme return calculating site', 14, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254);
  doc.text('NATIONAL PENSION SYSTEM (NPS) RETIREMENT & PENSION FORECAST', 14, 23);

  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 30);
  doc.text('Portal: MF-SIF-investment-calculator.vercel.app', 130, 30);

  // 2. Customer & Parameters Summary
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 42, 182, 34, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`NPS Scheme: ${data.schemeName}`, 20, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Investor: ${data.customerName || 'Valued Subscriber'}`, 20, 58);
  doc.text(`Age Profile: ${data.currentAge} yrs (Current) -> ${data.retirementAge} yrs (Retirement)`, 20, 65);
  doc.text(`Investment Horizon: ${data.yearsToInvest} Years`, 20, 72);

  doc.text(`Monthly Contribution: ${formatInr(data.monthlyContribution)}`, 110, 58);
  doc.text(`Expected Growth Rate: ${data.expectedReturnRate}% p.a.`, 110, 65);
  doc.text(`Annuity Allocation: ${data.annuityPercent}% (at ${data.annuityReturnRate}% return)`, 110, 72);

  // 3. Highlight Result Cards
  // Total Accumulated Corpus
  doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
  doc.roundedRect(14, 82, 60, 26, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`RETIREMENT CORPUS AT ${data.retirementAge}`, 18, 88);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(formatInr(Math.round(data.accumulatedCorpus)), 18, 98);
  doc.setFontSize(7);
  doc.text(`Invested: ${formatInr(Math.round(data.totalInvested))}`, 18, 104);

  // Monthly Pension Box
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(77, 82, 56, 26, 2, 2, 'FD');
  doc.setTextColor(67, 56, 202);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('MONTHLY PENSION', 81, 88);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${formatInr(Math.round(data.monthlyPension))}/mo`, 81, 98);
  doc.setFontSize(7);
  doc.setTextColor(99, 102, 241);
  doc.text(`from ${data.annuityPercent}% annuity corpus`, 81, 104);

  // Tax-Free Lump Sum Box
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(136, 82, 60, 26, 2, 2, 'FD');
  doc.setTextColor(4, 120, 87);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`TAX-FREE LUMP SUM (${100 - data.annuityPercent}%)`, 140, 88);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(formatInr(Math.round(data.lumpSumCorpus)), 140, 98);
  doc.setFontSize(7);
  doc.text(`100% Tax-Exempt at retirement`, 140, 104);

  // 4. Tax Savings Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(14, 112, 182, 14, 2, 2, 'FD');
  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Section 80CCD(1B) Tax Saving Benefit:', 20, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exclusive extra deduction of ₹50,000/year saves ~${formatInr(Math.round(data.estimatedTaxSavedYearly))} annually under 30% tax bracket.`, 82, 120);

  // 5. Progression Roadmap Table
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Milestone Progression Roadmap to Retirement', 14, 134);

  const tableRows = data.yearlyBreakdown
    .filter((_, idx) => idx % 5 === 0 || idx === data.yearlyBreakdown.length - 1)
    .map((row) => [
      `Age ${row.age}`,
      formatInr(Math.round(row.invested)),
      formatInr(Math.round(row.corpus)),
      formatInr(Math.round((row.corpus * (100 - data.annuityPercent)) / 100)),
      `${formatInr(Math.round((row.corpus * (data.annuityPercent / 100) * (data.annuityReturnRate / 100)) / 12))}/mo`,
    ]);

  autoTable(doc, {
    startY: 138,
    head: [['Subscriber Age', 'Total Contributed', 'Accumulated Corpus', 'Lump Sum Portion', 'Monthly Pension']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 250;
  if (finalY < 275) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Disclaimer: NPS is regulated by PFRDA. Returns depend on selected Pension Fund Manager (PFM) and asset class performance (Equity/Corporate/Govt bonds). Projections are for illustration purposes.',
      14,
      finalY + 10,
      { maxWidth: 182 }
    );
  }

  const cleanName = data.schemeName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const fileName = `NPS_Pension_Report_${cleanName}.pdf`;

  if (action === 'view') {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}

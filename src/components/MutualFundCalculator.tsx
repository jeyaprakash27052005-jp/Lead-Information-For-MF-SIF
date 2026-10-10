import React, { useState, useMemo } from 'react';
import { InvestmentScheme } from '../types';
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  Percent,
  Sliders,
  Sparkles,
  PieChart,
  CheckCircle2,
  ArrowRight,
  Eye,
  Download,
  X,
  FileText
} from 'lucide-react';
import { formatInr, formatInrCompact } from '../utils/currency';
import { generateMutualFundPDF } from '../utils/pdfGenerator';

interface MutualFundCalculatorProps {
  schemes: InvestmentScheme[];
  onApplyScheme?: (schemeName: string, amount: number) => void;
  customerName?: string;
}

export const MutualFundCalculator: React.FC<MutualFundCalculatorProps> = ({
  schemes,
  onApplyScheme,
  customerName,
}) => {
  const mfSchemes = schemes.filter((s) => s.type === 'mutual_fund');

  const [calcType, setCalcType] = useState<'sip' | 'lumpsum'>('sip');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(mfSchemes[0]?.id || '');
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(5000);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [tenureYears, setTenureYears] = useState<number>(10);
  const [showViewModal, setShowViewModal] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // The expected return is fixed by the admin (Schemes Management) and cannot be changed here
  const selectedScheme = mfSchemes.find((s) => s.id === selectedSchemeId) || mfSchemes[0];
  const expectedRate = selectedScheme?.expectedReturnRate ?? 0;
  const activeSchemeName = selectedScheme?.name || 'Selected Mutual Fund Scheme';

  const handleSchemeChange = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
  };

  // Calculations (standard formulas)
  //  SIP:      M = S x [ ((1 + i)^n - 1) / i ] x (1 + i)
  //            S = monthly SIP amount, i = annual return / 12 / 100, n = years x 12
  //  Lumpsum:  M = P x (1 + R)^N
  //            P = principal, R = annual return as a decimal, N = years
  const monthlyRate = expectedRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  const annualRateDecimal = expectedRate / 100;

  const result = useMemo(() => {
    const sipFutureValue = (monthlyAmount: number, months: number) =>
      monthlyRate === 0
        ? monthlyAmount * months
        : monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    const yearlyData = [];

    if (calcType === 'lumpsum') {
      const principal = lumpsumAmount;
      const maturity = principal * Math.pow(1 + annualRateDecimal, tenureYears);

      for (let y = 1; y <= tenureYears; y++) {
        const yValue = principal * Math.pow(1 + annualRateDecimal, y);
        yearlyData.push({
          year: y,
          invested: principal,
          gain: yValue - principal,
          total: yValue,
        });
      }

      return { invested: principal, gain: maturity - principal, maturity, yearlyData };
    }

    const invested = monthlyInvestment * totalMonths;
    const maturity = sipFutureValue(monthlyInvestment, totalMonths);

    for (let y = 1; y <= tenureYears; y++) {
      const investedSoFar = monthlyInvestment * y * 12;
      const value = sipFutureValue(monthlyInvestment, y * 12);
      yearlyData.push({
        year: y,
        invested: investedSoFar,
        gain: value - investedSoFar,
        total: value,
      });
    }

    return { invested, gain: maturity - invested, maturity, yearlyData };
  }, [calcType, monthlyInvestment, lumpsumAmount, monthlyRate, annualRateDecimal, totalMonths, tenureYears]);

  const investedPercent = result.maturity > 0 ? (result.invested / result.maturity) * 100 : 50;
  const gainPercent = result.maturity > 0 ? (result.gain / result.maturity) * 100 : 50;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            Wealth Compounder Engine
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Mutual Fund Return Calculator
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Simulate SIP and Lumpsum returns with live scheme benchmarking, inflation-hedged compounding, and step-up options.
          </p>
        </div>

        {/* SIP vs Lumpsum Switcher */}
        <div className="bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setCalcType('sip')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              calcType === 'sip'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Systematic SIP
          </button>
          <button
            type="button"
            onClick={() => setCalcType('lumpsum')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              calcType === 'lumpsum'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            One-Time Lumpsum
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Scheme Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Select Scheme Name</span>
              <span className="text-[11px] text-indigo-600 font-semibold">Active Benchmark</span>
            </label>
            <select
              value={selectedScheme?.id || ''}
              onChange={(e) => handleSchemeChange(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {mfSchemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category} • ~{s.expectedReturnRate}%)
                </option>
              ))}
            </select>

          </div>

          {/* Investment Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {calcType === 'sip' ? 'Monthly SIP Amount (₹)' : 'One-Time Lumpsum Amount (₹)'}
              </label>
              <span className="text-xs font-bold text-indigo-600">
                {formatInr(calcType === 'sip' ? monthlyInvestment : lumpsumAmount)}
              </span>
            </div>

            <div className="relative mb-2">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                min="500"
                step="500"
                value={calcType === 'sip' ? monthlyInvestment : lumpsumAmount}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  if (calcType === 'sip') setMonthlyInvestment(val);
                  else setLumpsumAmount(val);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick preset amount chips */}
            <div className="flex flex-wrap gap-1.5">
              {(calcType === 'sip'
                ? [1000, 2500, 5000, 10000, 25000]
                : [25000, 50000, 100000, 500000, 1000000]
              ).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    if (calcType === 'sip') setMonthlyInvestment(amt);
                    else setLumpsumAmount(amt);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold transition-colors cursor-pointer ${
                    (calcType === 'sip' ? monthlyInvestment : lumpsumAmount) === amt
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formatInrCompact(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Investment Tenure (Years) - pick one option from the list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Investment Time Horizon (Years)
              </label>
              <span className="font-bold text-xs text-indigo-600">{tenureYears} Years</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Investment time horizon in years">
              {[1, 2, 3, 5, 7, 10, 12, 15, 20, 25, 30].map((yrs) => {
                const checked = tenureYears === yrs;
                return (
                  <button
                    key={yrs}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setTenureYears(yrs)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                      checked
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] leading-none ${
                        checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span>{yrs} {yrs === 1 ? 'Year' : 'Years'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons: View Calculation & Download PDF */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowViewModal(true)}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              title="View full scheme calculation details"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>View Calculation</span>
            </button>

            <button
              type="button"
              disabled={pdfGenerating}
              onClick={() => {
                setPdfGenerating(true);
                try {
                  generateMutualFundPDF({
                    schemeName: activeSchemeName,
                    calcType,
                    monthlyInvestment,
                    lumpsumAmount,
                    expectedRate,
                    tenureYears,
                    invested: result.invested,
                    gain: result.gain,
                    maturity: result.maturity,
                    yearlyData: result.yearlyData,
                    customerName,
                  }, 'download');
                } finally {
                  setPdfGenerating(false);
                }
              }}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              title="Download official PDF report of this scheme calculation"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>{pdfGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>

          {/* Quick Apply / Consultation option */}
          {onApplyScheme && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  onApplyScheme(
                    activeSchemeName,
                    calcType === 'sip' ? monthlyInvestment : lumpsumAmount
                  )
                }
                className="w-full py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Express Interest in this Scheme</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            </div>
          )}
        </div>

        {/* Right Output: Maturity Card & Projections */}
        <div className="lg:col-span-6 space-y-5">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Projected Wealth For
                </span>
                <span className="font-bold text-slate-900 text-sm">{activeSchemeName}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {tenureYears} Years Horizon
              </span>
            </div>

            {/* Total Corpus Hero */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
                Total Estimated Corpus (Maturity Value)
              </span>
              <div className="text-2xl sm:text-3xl font-black mt-1 tracking-tight flex items-center">
                <IndianRupee className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                <span>{formatInr(Math.round(result.maturity))}</span>
              </div>
              <p className="text-[11px] text-emerald-100 mt-1 font-medium">
                Calculated at {expectedRate}% expected CAGR over {tenureYears} years
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Invested Capital
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center">
                  <IndianRupee className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>{formatInr(Math.round(result.invested))}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  {investedPercent.toFixed(1)}% of total corpus
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Estimated Wealth Gain
                </span>
                <div className="text-base sm:text-lg font-bold text-emerald-800 mt-1 flex items-center">
                  <IndianRupee className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formatInr(Math.round(result.gain))}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700">
                  +{gainPercent.toFixed(1)}% compound returns
                </span>
              </div>
            </div>

            {/* Visual Proportion Bar */}
            <div>
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${investedPercent}%` }}
                  className="bg-slate-700 transition-all duration-300"
                  title={`Invested: ${investedPercent.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${gainPercent}%` }}
                  className="bg-emerald-500 transition-all duration-300"
                  title={`Gain: ${gainPercent.toFixed(1)}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />
                  Invested: {formatInrCompact(result.invested)}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Returns: {formatInrCompact(result.gain)}
                </span>
              </div>
            </div>

            {onApplyScheme && (
              <button
                type="button"
                onClick={() =>
                  onApplyScheme(
                    activeSchemeName,
                    calcType === 'sip' ? monthlyInvestment : lumpsumAmount
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply for this Scheme as Lead</span>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </button>
            )}
          </div>

          {/* Yearly Milestones Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Year-by-Year Growth Trajectory
            </h3>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase font-bold">
                    <th className="pb-2">Year</th>
                    <th className="pb-2">Invested</th>
                    <th className="pb-2">Estimated Gain</th>
                    <th className="pb-2 text-right">Future Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.yearlyData.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                      <td className="py-1.5 font-bold text-slate-800">Yr {row.year}</td>
                      <td className="py-1.5 text-slate-600 font-medium">{formatInr(Math.round(row.invested))}</td>
                      <td className="py-1.5 text-emerald-700 font-medium">+{formatInr(Math.round(row.gain))}</td>
                      <td className="py-1.5 font-bold text-slate-900 text-right">{formatInr(Math.round(row.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* View Calculation Modal */}
      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Mutual Fund Return Calculation Dossier
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeSchemeName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Mode</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {calcType === 'sip' ? 'Monthly SIP' : 'Lumpsum'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    {calcType === 'sip' ? 'Monthly Amount' : 'Investment'}
                  </span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {formatInr(calcType === 'sip' ? monthlyInvestment : lumpsumAmount)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Expected CAGR</span>
                  <span className="font-bold text-indigo-700 text-xs mt-0.5 block">
                    {expectedRate}% p.a.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Time Horizon</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                    {tenureYears} Years
                  </span>
                </div>
              </div>

              {/* Formula Used */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Formula Used
                </span>
                {calcType === 'sip' ? (
                  <>
                    <p className="font-mono text-[11px] font-bold text-slate-900">
                      M = S × [ ((1 + i)^n − 1) / i ] × (1 + i)
                    </p>
                    <p className="text-[11px] text-slate-600">
                      S = {formatInr(monthlyInvestment)} (monthly SIP) • i = {expectedRate} / 12 / 100 ={' '}
                      {monthlyRate.toFixed(6)} • n = {tenureYears} × 12 = {totalMonths} installments
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[11px] font-bold text-slate-900">M = P × (1 + R)^N</p>
                    <p className="text-[11px] text-slate-600">
                      P = {formatInr(lumpsumAmount)} (principal) • R = {annualRateDecimal} ({expectedRate}% p.a.) • N ={' '}
                      {tenureYears} years
                    </p>
                  </>
                )}
              </div>

              {/* Corpus Summary Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md">
                <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
                  Projected Maturity Corpus Value
                </span>
                <div className="text-2xl sm:text-3xl font-black mt-1">
                  {formatInr(Math.round(result.maturity))}
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-emerald-500/40 text-xs">
                  <div>
                    <span className="text-emerald-200 text-[10px] block">Total Invested</span>
                    <span className="font-bold text-white">{formatInr(Math.round(result.invested))}</span>
                  </div>
                  <div className="pl-4 border-l border-emerald-500/40">
                    <span className="text-emerald-200 text-[10px] block">Compounded Wealth Gain</span>
                    <span className="font-bold text-emerald-100">+{formatInr(Math.round(result.gain))}</span>
                  </div>
                </div>
              </div>

              {/* Trajectory Breakdown Table */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Yearly Compounding Breakdown</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                        <th className="py-2 px-3">Year</th>
                        <th className="py-2 px-3">Invested</th>
                        <th className="py-2 px-3">Estimated Gain</th>
                        <th className="py-2 px-3 text-right">Maturity Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.yearlyData.map((d) => (
                        <tr key={d.year} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-semibold text-slate-800">Year {d.year}</td>
                          <td className="py-1.5 px-3 text-slate-600">{formatInr(Math.round(d.invested))}</td>
                          <td className="py-1.5 px-3 text-emerald-700 font-semibold">+{formatInr(Math.round(d.gain))}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatInr(Math.round(d.total))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer with Download PDF button */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Mutual fund (SIF) and NPS scheme return calculating site
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    generateMutualFundPDF({
                      schemeName: activeSchemeName,
                      calcType,
                      monthlyInvestment,
                      lumpsumAmount,
                      expectedRate,
                      tenureYears,
                        invested: result.invested,
                      gain: result.gain,
                      maturity: result.maturity,
                      yearlyData: result.yearlyData,
                      customerName,
                    }, 'download');
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Statement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

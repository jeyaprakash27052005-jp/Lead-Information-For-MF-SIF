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
  ArrowRight
} from 'lucide-react';
import { formatInr, formatInrCompact } from '../utils/currency';

interface MutualFundCalculatorProps {
  schemes: InvestmentScheme[];
  onApplyScheme?: (schemeName: string, amount: number) => void;
}

export const MutualFundCalculator: React.FC<MutualFundCalculatorProps> = ({
  schemes,
  onApplyScheme,
}) => {
  const mfSchemes = schemes.filter((s) => s.type === 'mutual_fund');

  const [calcType, setCalcType] = useState<'sip' | 'lumpsum'>('sip');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(
    mfSchemes[0]?.id || 'custom'
  );
  const [customSchemeName, setCustomSchemeName] = useState('');
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(5000);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [expectedRate, setExpectedRate] = useState<number>(14);
  const [tenureYears, setTenureYears] = useState<number>(10);
  const [annualStepUp, setAnnualStepUp] = useState<number>(0);

  // Sync rate when scheme is picked
  const handleSchemeChange = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    if (schemeId !== 'custom') {
      const found = mfSchemes.find((s) => s.id === schemeId);
      if (found) {
        setExpectedRate(found.expectedReturnRate);
      }
    }
  };

  const activeSchemeName = useMemo(() => {
    if (selectedSchemeId === 'custom') {
      return customSchemeName.trim() || 'Custom Equity Mutual Fund';
    }
    const found = mfSchemes.find((s) => s.id === selectedSchemeId);
    return found?.name || 'Selected Mutual Fund Scheme';
  }, [selectedSchemeId, customSchemeName, mfSchemes]);

  // Calculations
  const result = useMemo(() => {
    const rateMonthly = expectedRate / 100 / 12;
    const totalMonths = tenureYears * 12;

    if (calcType === 'lumpsum') {
      const principal = lumpsumAmount;
      const maturity = principal * Math.pow(1 + expectedRate / 100, tenureYears);
      const profit = maturity - principal;

      // Yearly breakdown
      const yearlyData = [];
      for (let y = 1; y <= tenureYears; y++) {
        const yValue = principal * Math.pow(1 + expectedRate / 100, y);
        yearlyData.push({
          year: y,
          invested: principal,
          gain: yValue - principal,
          total: yValue,
        });
      }

      return {
        invested: principal,
        gain: profit,
        maturity,
        yearlyData,
      };
    } else {
      // SIP with optional step-up
      let totalInvested = 0;
      let maturity = 0;
      let currentMonthly = monthlyInvestment;
      const yearlyData = [];

      for (let y = 1; y <= tenureYears; y++) {
        for (let m = 1; m <= 12; m++) {
          totalInvested += currentMonthly;
          // Remaining months to compound
          const monthsRemaining = totalMonths - ((y - 1) * 12 + m) + 1;
          maturity += currentMonthly * Math.pow(1 + rateMonthly, monthsRemaining);
        }

        yearlyData.push({
          year: y,
          invested: totalInvested,
          gain: Math.max(0, maturity - totalInvested),
          total: maturity,
        });

        if (annualStepUp > 0) {
          currentMonthly = Math.round(currentMonthly * (1 + annualStepUp / 100));
        }
      }

      const gain = Math.max(0, maturity - totalInvested);
      return {
        invested: totalInvested,
        gain,
        maturity,
        yearlyData,
      };
    }
  }, [calcType, monthlyInvestment, lumpsumAmount, expectedRate, tenureYears, annualStepUp]);

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
              value={selectedSchemeId}
              onChange={(e) => handleSchemeChange(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {mfSchemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category} • ~{s.expectedReturnRate}%)
                </option>
              ))}
              <option value="custom">+ Custom Scheme Name</option>
            </select>

            {selectedSchemeId === 'custom' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customSchemeName}
                  onChange={(e) => setCustomSchemeName(e.target.value)}
                  placeholder="Enter custom mutual fund scheme name..."
                  className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-indigo-50/20"
                />
              </div>
            )}
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

          {/* Expected Annual Return Rate Slider & Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Expected Annual Return Rate (% p.a.)
              </label>
              <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold text-xs border border-indigo-200">
                <Percent className="w-3 h-3" />
                <span>{expectedRate}%</span>
              </div>
            </div>
            <input
              type="range"
              min="4"
              max="30"
              step="0.5"
              value={expectedRate}
              onChange={(e) => setExpectedRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer mb-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Debt/Conservative (7-8%)</span>
              <span>Balanced (11-13%)</span>
              <span>Aggressive Equity (15-18%)</span>
            </div>
          </div>

          {/* Investment Tenure (Years) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Investment Time Horizon (Years)
              </label>
              <span className="font-bold text-xs text-indigo-600">{tenureYears} Years</span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer mb-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>1 Yr</span>
              <span>5 Yrs</span>
              <span>10 Yrs</span>
              <span>20 Yrs</span>
              <span>35 Yrs</span>
            </div>
          </div>

          {/* Optional Annual Step-up for SIP */}
          {calcType === 'sip' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Annual SIP Step-up (%)
                </span>
                <span className="text-xs font-bold text-amber-700">{annualStepUp}% yearly</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="5"
                value={annualStepUp}
                onChange={(e) => setAnnualStepUp(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                Increasing your SIP with annual salary hikes boosts your compounding corpus exponentially.
              </p>
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
    </div>
  );
};

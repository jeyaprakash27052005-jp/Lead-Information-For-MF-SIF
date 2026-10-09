import React, { useState, useMemo } from 'react';
import { InvestmentScheme } from '../types';
import {
  Shield,
  IndianRupee,
  Clock,
  Percent,
  CheckCircle2,
  Gift,
  Coins,
  ArrowRight
} from 'lucide-react';
import { formatInr, formatInrCompact } from '../utils/currency';

interface NPSCalculatorProps {
  schemes: InvestmentScheme[];
  onApplyScheme?: (schemeName: string, amount: number) => void;
}

export const NPSCalculator: React.FC<NPSCalculatorProps> = ({
  schemes,
  onApplyScheme,
}) => {
  const npsSchemes = schemes.filter((s) => s.type === 'nps');

  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(
    npsSchemes[0]?.id || 'custom'
  );
  const [customSchemeName, setCustomSchemeName] = useState('');
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(5000);
  const [expectedReturnRate, setExpectedReturnRate] = useState<number>(10);
  const [annuityPercent, setAnnuityPercent] = useState<number>(40); // min 40%
  const [annuityReturnRate, setAnnuityReturnRate] = useState<number>(6.5);

  const handleSchemeChange = (schemeId: string) => {
    setSelectedSchemeId(schemeId);
    if (schemeId !== 'custom') {
      const found = npsSchemes.find((s) => s.id === schemeId);
      if (found) {
        setExpectedReturnRate(found.expectedReturnRate);
      }
    }
  };

  const activeSchemeName = useMemo(() => {
    if (selectedSchemeId === 'custom') {
      return customSchemeName.trim() || 'Custom NPS Tier I Portfolio';
    }
    const found = npsSchemes.find((s) => s.id === selectedSchemeId);
    return found?.name || 'National Pension Scheme';
  }, [selectedSchemeId, customSchemeName, npsSchemes]);

  // Calculations
  const result = useMemo(() => {
    const yearsToInvest = Math.max(1, retirementAge - currentAge);
    const months = yearsToInvest * 12;
    const rateMonthly = expectedReturnRate / 100 / 12;

    let totalInvested = 0;
    let accumulatedCorpus = 0;
    const yearlyBreakdown = [];

    for (let y = 1; y <= yearsToInvest; y++) {
      for (let m = 1; m <= 12; m++) {
        totalInvested += monthlyContribution;
        const remainingMonths = months - ((y - 1) * 12 + m) + 1;
        accumulatedCorpus += monthlyContribution * Math.pow(1 + rateMonthly, remainingMonths);
      }

      yearlyBreakdown.push({
        age: currentAge + y,
        invested: totalInvested,
        corpus: accumulatedCorpus,
      });
    }

    const lumpSumPercent = 100 - annuityPercent;
    const lumpSumCorpus = (accumulatedCorpus * lumpSumPercent) / 100;
    const annuityCorpus = (accumulatedCorpus * annuityPercent) / 100;

    // Monthly pension from annuity corpus
    const monthlyPension = (annuityCorpus * (annuityReturnRate / 100)) / 12;

    // Annual tax deduction under 80CCD(1B): up to ₹50,000/yr (assuming 30% tax bracket: ₹15,600/yr savings)
    const annualContrib = monthlyContribution * 12;
    const deductibleAmount = Math.min(50000, annualContrib);
    const estimatedTaxSavedYearly = deductibleAmount * 0.312; // 30% tax + 4% cess

    return {
      yearsToInvest,
      totalInvested,
      accumulatedCorpus,
      lumpSumCorpus,
      annuityCorpus,
      monthlyPension,
      lumpSumPercent,
      estimatedTaxSavedYearly,
      yearlyBreakdown,
    };
  }, [
    currentAge,
    retirementAge,
    monthlyContribution,
    expectedReturnRate,
    annuityPercent,
    annuityReturnRate,
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            PFRDA Regulated Retirement Corpus
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
            NPS Scheme Return & Pension Calculator
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Forecast your retirement wealth corpus, monthly pension payout, tax exemptions under Section 80CCD(1B), and tax-free lump sum withdrawal.
          </p>
        </div>

        <div className="bg-blue-900/50 border border-blue-400/30 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shrink-0 text-xs">
          <Gift className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">Sec 80CCD(1B) Tax Benefit</span>
            <span className="text-blue-200 text-[11px]">Extra ₹50,000 exemption/yr</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Scheme Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>NPS Scheme Tier & Asset Class</span>
              <span className="text-[11px] text-blue-600 font-semibold">Tier I Pension</span>
            </label>
            <select
              value={selectedSchemeId}
              onChange={(e) => handleSchemeChange(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {npsSchemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (~{s.expectedReturnRate}% benchmark)
                </option>
              ))}
              <option value="custom">+ Custom NPS Portfolio</option>
            </select>

            {selectedSchemeId === 'custom' && (
              <div className="mt-2.5">
                <input
                  type="text"
                  value={customSchemeName}
                  onChange={(e) => setCustomSchemeName(e.target.value)}
                  placeholder="Enter custom NPS pension scheme name..."
                  className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-blue-50/20"
                />
              </div>
            )}
          </div>

          {/* Age Configuration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Current Age</span>
                <span className="text-blue-600">{currentAge} yrs</span>
              </label>
              <input
                type="number"
                min="18"
                max="65"
                value={currentAge}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 18;
                  setCurrentAge(val);
                  if (val >= retirementAge) setRetirementAge(val + 5);
                }}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Retirement Age</span>
                <span className="text-blue-600">{retirementAge} yrs</span>
              </label>
              <input
                type="number"
                min={currentAge + 1}
                max="75"
                value={retirementAge}
                onChange={(e) => setRetirementAge(parseInt(e.target.value, 10) || 60)}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Monthly Contribution */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Monthly NPS Contribution (₹)
              </label>
              <span className="text-xs font-bold text-blue-600">
                {formatInr(monthlyContribution)}
              </span>
            </div>
            <div className="relative mb-2">
              <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                min="500"
                step="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Math.max(500, parseInt(e.target.value, 10) || 0))}
                className="w-full pl-9 pr-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Quick preset amount chips */}
            <div className="flex flex-wrap gap-1.5">
              {[1000, 2500, 5000, 10000, 20000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setMonthlyContribution(amt)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold transition-colors cursor-pointer ${
                    monthlyContribution === amt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formatInrCompact(amt)}/mo
                </button>
              ))}
            </div>
          </div>

          {/* Expected Return Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Expected Investment Return Rate (% p.a.)
              </label>
              <span className="text-xs font-bold text-blue-600">{expectedReturnRate}%</span>
            </div>
            <input
              type="range"
              min="7"
              max="16"
              step="0.5"
              value={expectedReturnRate}
              onChange={(e) => setExpectedReturnRate(parseFloat(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer mb-2"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
              <span>Govt Bonds (8.5%)</span>
              <span>Balanced (10%)</span>
              <span>Active Equity E (12.5%)</span>
            </div>
          </div>

          {/* Annuity Reinvestment Ratio & Annuity Rate */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">
                  Annuity Purchase Ratio (min 40%)
                </span>
                <span className="text-xs font-bold text-emerald-700">{annuityPercent}% into Pension</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="5"
                value={annuityPercent}
                onChange={(e) => setAnnuityPercent(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-semibold mt-1">
                <span>{result.lumpSumPercent}% Lump Sum Withdrawal</span>
                <span>{annuityPercent}% Annuity for Monthly Pension</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700">
                  Expected Annuity Return Rate (% p.a.)
                </span>
                <span className="text-xs font-bold text-slate-900">{annuityReturnRate}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="9"
                step="0.25"
                value={annuityReturnRate}
                onChange={(e) => setAnnuityReturnRate(parseFloat(e.target.value))}
                className="w-full accent-slate-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Output: Pension & Corpus Summary */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Pension Hero Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  NPS Projection For
                </span>
                <span className="font-bold text-slate-900 text-sm">{activeSchemeName}</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                {result.yearsToInvest} Yrs Until Retirement
              </span>
            </div>

            {/* Monthly Pension Highlight */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 text-white shadow-lg">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider block">
                Estimated Monthly Pension (Lifelong Payout)
              </span>
              <div className="text-2xl sm:text-3xl font-black mt-1 tracking-tight flex items-center">
                <IndianRupee className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 text-amber-300" />
                <span className="text-amber-300">
                  {formatInr(Math.round(result.monthlyPension))}
                </span>
                <span className="text-sm font-semibold text-blue-200 ml-1.5">/ month</span>
              </div>
              <p className="text-[11px] text-blue-200 mt-1 font-medium">
                Commencing at age {retirementAge} from {annuityPercent}% annuity reinvestment
              </p>
            </div>

            {/* Total Corpus & Lump Sum Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Pension Corpus at {retirementAge}
                </span>
                <div className="text-base sm:text-lg font-bold text-slate-900 mt-1 flex items-center">
                  <IndianRupee className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>{formatInr(Math.round(result.accumulatedCorpus))}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  Invested: {formatInrCompact(result.totalInvested)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Lump Sum Withdrawal ({result.lumpSumPercent}%)
                </span>
                <div className="text-base sm:text-lg font-bold text-emerald-800 mt-1 flex items-center">
                  <IndianRupee className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formatInr(Math.round(result.lumpSumCorpus))}</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700">
                  100% Tax-Free at age {retirementAge}
                </span>
              </div>
            </div>

            {/* Tax Benefit Card */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-amber-900 block">
                    Estimated Annual Tax Savings
                  </span>
                  <span className="text-[11px] text-amber-700">
                    Via 80CCD(1B) additional ₹50,000 deduction
                  </span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300">
                ~{formatInr(Math.round(result.estimatedTaxSavedYearly))}/yr
              </span>
            </div>

            {onApplyScheme && (
              <button
                type="button"
                onClick={() => onApplyScheme(activeSchemeName, monthlyContribution)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply for this NPS Scheme as Lead</span>
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </button>
            )}
          </div>

          {/* Age-by-Age Progression Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Corpus Accumulation Milestone Roadmap
            </h3>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase font-bold">
                    <th className="pb-2">Age</th>
                    <th className="pb-2">Total Contribution</th>
                    <th className="pb-2 text-right">Accumulated Corpus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.yearlyBreakdown
                    .filter((_, idx) => idx % 5 === 0 || idx === result.yearlyBreakdown.length - 1)
                    .map((row) => (
                      <tr key={row.age} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 font-bold text-slate-800">Age {row.age}</td>
                        <td className="py-2 text-slate-600 font-medium">{formatInr(Math.round(row.invested))}</td>
                        <td className="py-2 font-bold text-blue-800 text-right">{formatInr(Math.round(row.corpus))}</td>
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

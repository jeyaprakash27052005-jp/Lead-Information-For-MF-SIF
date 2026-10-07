import React from 'react';
import { Lead, User } from '../types';
import {
  BarChart3,
  PieChart,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import { formatInr, formatInrCompact, formatInrNumber } from '../utils/currency';

interface RegionalMetricsProps {
  leads: Lead[];
  users: User[];
  currentUser: User;
}

export const RegionalMetrics: React.FC<RegionalMetricsProps> = ({
  leads,
  users,
  currentUser,
}) => {
  const isHead = currentUser.role === 'head';

  // Determine which regions to display according to incharge profile mention
  const allRegions = ['North Division', 'South Division', 'East Division', 'West Division'];
  
  // If the incharge profile specifies a specific region, display according to their profile mention!
  const targetRegions = isHead
    ? allRegions
    : allRegions.filter((r) => r.toLowerCase() === currentUser.region.toLowerCase() || currentUser.region.includes(r.split(' ')[0]));

  // If none matched, fallback to incharge's exact profile region
  const displayedRegions = targetRegions.length > 0 ? targetRegions : [currentUser.region];

  // Compute metrics per region
  const regionalData = displayedRegions.map((region) => {
    const regionLeads = leads.filter((l) => l.assignedRegion.toLowerCase() === region.toLowerCase());
    const pending = regionLeads.filter((l) => l.status === 'Pending');
    const readyToInvest = regionLeads.filter((l) => l.status === 'Ready to Invest');
    const process = regionLeads.filter((l) => l.status === 'Process');
    const other = regionLeads.filter((l) => l.status === 'Other');

    const totalIncome = regionLeads.reduce((acc, curr) => acc + curr.annualIncome, 0);
    const avgIncome = regionLeads.length > 0 ? totalIncome / regionLeads.length : 0;
    const readyRate = regionLeads.length > 0 ? (readyToInvest.length / regionLeads.length) * 100 : 0;

    const officers = users.filter((u) => u.region.toLowerCase() === region.toLowerCase() && u.status === 'active');

    return {
      region,
      totalLeads: regionLeads.length,
      pendingCount: pending.length,
      readyToInvestCount: readyToInvest.length,
      processCount: process.length,
      otherCount: other.length,
      totalIncome,
      avgIncome,
      readyRate,
      officersCount: officers.length,
    };
  });

  const fmt = (num: number) =>
    formatInr(num);

  return (
    <div className="space-y-6">
      {/* Title & Scope Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Regional Performance Metrics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isHead
                ? 'Regional telemetry across all divisions (Head Overview)'
                : `Performance metrics for ${currentUser.region} (According to your Incharge Profile)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Profile Region: {currentUser.region}
            </span>
          </div>
        </div>
      </div>

      {/* Division Performance Scorecard Table according to Incharge Profile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-600" />
            Regional Status Breakdown ({isHead ? 'All Divisions' : currentUser.region})
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Live database calculation
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Territory Division</th>
                <th className="py-3 px-4">Total Leads</th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1 text-amber-700">
                    <Clock className="w-3.5 h-3.5" />
                    Pending
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready to Invest
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1 text-indigo-700">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Process
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="flex items-center gap-1 text-purple-700">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Other
                  </span>
                </th>
                <th className="py-3 px-4">Ready Rate (%)</th>
                <th className="py-3 px-4">Total Annual Income</th>
                <th className="py-3 px-4">Avg Income</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regionalData.map((row) => {
                const isUserRegion = currentUser.region.toLowerCase().includes(row.region.toLowerCase().split(' ')[0]);

                return (
                  <tr
                    key={row.region}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isUserRegion ? 'bg-indigo-50/30 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        {row.region}
                        {isUserRegion && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                            Assigned Profile
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.officersCount} assigned officers
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {row.totalLeads}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-amber-700">
                      {row.pendingCount}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {row.readyToInvestCount}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-indigo-700">
                      {row.processCount}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-purple-700">
                      {row.otherCount}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(row.readyRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {row.readyRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {fmt(row.totalIncome)}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {fmt(row.avgIncome)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

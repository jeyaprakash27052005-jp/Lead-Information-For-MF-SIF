import React, { useState } from 'react';
import { InvestmentScheme, SchemeType, User } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Shield,
  IndianRupee,
  Percent,
  X,
  Sparkles
} from 'lucide-react';
import { formatInr } from '../utils/currency';

interface SchemeManagementProps {
  schemes: InvestmentScheme[];
  currentUser: User;
  onCreateScheme: (scheme: Omit<InvestmentScheme, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateScheme: (id: string, updates: Partial<InvestmentScheme>) => Promise<void>;
  onDeleteScheme: (id: string) => Promise<void>;
  onOpenCalculator?: (scheme: InvestmentScheme) => void;
}

export const SchemeManagement: React.FC<SchemeManagementProps> = ({
  schemes,
  currentUser,
  onCreateScheme,
  onUpdateScheme,
  onDeleteScheme,
  onOpenCalculator,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'mutual_fund' | 'nps'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<InvestmentScheme | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InvestmentScheme | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<SchemeType>('mutual_fund');
  const [formCategory, setFormCategory] = useState('Equity - Flexi Cap');
  const [formRate, setFormRate] = useState<number>(12);
  const [formRisk, setFormRisk] = useState<'Low' | 'Moderate' | 'High' | 'Very High'>('High');
  const [formMinInvestment, setFormMinInvestment] = useState<number>(1000);
  const [formFundHouse, setFormFundHouse] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const openCreateModal = () => {
    setEditingScheme(null);
    setFormName('');
    setFormType('mutual_fund');
    setFormCategory('Equity - Flexi Cap');
    setFormRate(12);
    setFormRisk('High');
    setFormMinInvestment(1000);
    setFormFundHouse('');
    setFormDescription('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (scheme: InvestmentScheme) => {
    setEditingScheme(scheme);
    setFormName(scheme.name);
    setFormType(scheme.type);
    setFormCategory(scheme.category);
    setFormRate(scheme.expectedReturnRate);
    setFormRisk(scheme.riskLevel || 'High');
    setFormMinInvestment(scheme.minInvestment || 1000);
    setFormFundHouse(scheme.fundHouse || '');
    setFormDescription(scheme.description || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Please enter a scheme name');
      return;
    }
    if (formRate <= 0) {
      setError('Please enter a valid expected return rate');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingScheme) {
        await onUpdateScheme(editingScheme.id, {
          name: formName.trim(),
          type: formType,
          category: formCategory.trim(),
          expectedReturnRate: Number(formRate),
          riskLevel: formRisk,
          minInvestment: Number(formMinInvestment),
          fundHouse: formFundHouse.trim() || undefined,
          description: formDescription.trim() || undefined,
        });
      } else {
        await onCreateScheme({
          name: formName.trim(),
          type: formType,
          category: formCategory.trim(),
          expectedReturnRate: Number(formRate),
          riskLevel: formRisk,
          minInvestment: Number(formMinInvestment),
          fundHouse: formFundHouse.trim() || undefined,
          description: formDescription.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scheme');
    } finally {
      setSaving(false);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchesTab = activeTab === 'all' || s.type === activeTab;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.fundHouse || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Product Portfolio Catalog
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
            Mutual Fund & NPS Schemes Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, edit, benchmark, and publish investment schemes for calculators and customer applications.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Scheme</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Type filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Schemes ({schemes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mutual_fund')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mutual_fund'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Mutual Funds ({schemes.filter((s) => s.type === 'mutual_fund').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'nps'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            NPS Schemes ({schemes.filter((s) => s.type === 'nps').length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search schemes by name or category..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchemes.map((scheme) => {
          const isMf = scheme.type === 'mutual_fund';
          return (
            <div
              key={scheme.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-4.5 flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                      isMf
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {isMf ? <TrendingUp className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {isMf ? 'Mutual Fund' : 'NPS Scheme'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Risk: {scheme.riskLevel || 'Moderate'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm tracking-tight line-clamp-1" title={scheme.name}>
                  {scheme.name}
                </h3>
                <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                  {scheme.category} {scheme.fundHouse ? `• ${scheme.fundHouse}` : ''}
                </p>

                {scheme.description && (
                  <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                    "{scheme.description}"
                  </p>
                )}

                {/* Key Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Expected CAGR</span>
                    <span className="font-black text-emerald-700 text-sm flex items-center gap-0.5 mt-0.5">
                      <Percent className="w-3 h-3" />
                      {scheme.expectedReturnRate}% p.a.
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Min. SIP / Invest</span>
                    <span className="font-black text-slate-800 text-sm flex items-center gap-0.5 mt-0.5">
                      <IndianRupee className="w-3 h-3 text-slate-400" />
                      {scheme.minInvestment ? formatInr(scheme.minInvestment) : '₹500'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={() => onOpenCalculator(scheme)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    Calculate Returns
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => openEditModal(scheme)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Edit scheme"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(scheme)}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors"
                    title="Delete scheme"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No schemes matched your search</h3>
          <p className="text-xs text-slate-400 mt-1">Try modifying the search term or create a new scheme.</p>
        </div>
      )}

      {/* Scheme Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingScheme ? 'Edit Investment Scheme' : 'Add New Investment Scheme'}
                  </h3>
                  <p className="text-[11px] text-slate-300">Publish scheme benchmarks for calculators</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Scheme Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('mutual_fund');
                      setFormCategory('Equity - Flexi Cap');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'mutual_fund'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Mutual Fund
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('nps');
                      setFormCategory('NPS - Tier I Equity (E)');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'nps'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    NPS Pension Scheme
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Scheme Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Parag Parikh Flexi Cap Fund"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category / Asset Class <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Equity, Debt, NPS Tier I"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fund House / Manager
                  </label>
                  <input
                    type="text"
                    value={formFundHouse}
                    onChange={(e) => setFormFundHouse(e.target.value)}
                    placeholder="e.g. HDFC, SBI, NPS Trust"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Rate (% p.a.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="40"
                    required
                    value={formRate}
                    onChange={(e) => setFormRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-bold text-emerald-700 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Risk Level
                  </label>
                  <select
                    value={formRisk}
                    onChange={(e) => setFormRisk(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min. Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    value={formMinInvestment}
                    onChange={(e) => setFormMinInvestment(parseInt(e.target.value, 10) || 500)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Asset Allocation Strategy
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Key fund parameters, benchmark indices, or retirement strategy..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  {saving ? 'Saving Scheme...' : editingScheme ? 'Update Scheme' : 'Save Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!pendingDelete}
        title="Delete Investment Scheme"
        message={`Are you sure you want to delete scheme "${pendingDelete?.name}"? It will be permanently removed from calculators.`}
        confirmLabel="Delete Scheme"
        onConfirm={() => {
          if (pendingDelete) {
            onDeleteScheme(pendingDelete.id).catch(console.error);
            setPendingDelete(null);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

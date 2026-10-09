import React, { useState } from 'react';
import { User, Lead, InvestmentScheme } from '../types';
import { MutualFundCalculator } from './MutualFundCalculator';
import { NPSCalculator } from './NPSCalculator';
import {
  UserPlus,
  LogIn,
  TrendingUp,
  Shield,
  CheckCircle2,
  Copy,
  ExternalLink,
  IndianRupee,
  Briefcase,
  Phone,
  FileText,
  User as UserIcon,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { formatInr } from '../utils/currency';
import { DEFAULT_REGIONS } from '../utils/regions';
import { normalizeIndianMobile, isValidPan, formatIndianMobile } from '../utils/validation';

const OCCUPATION_SUGGESTIONS = [
  'Student',
  'Salaried Employee',
  'Business / Self-Employed',
  'Professional',
  'Retired',
];

interface CustomerPortalProps {
  currentUser: User | null;
  customerLead: Lead | null;
  schemes: InvestmentScheme[];
  regions?: string[];
  onCustomerRegister: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{
    user: User;
    lead: Lead;
    credentials: { userId: string; password: string };
  }>;
  onCustomerLogin: (username: string, password?: string) => Promise<void>;
  onCustomerLogout: () => void;
  onSwitchToAdmin: () => void;
  initialTab?: 'register' | 'login';
  onBackToHome?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  currentUser,
  customerLead,
  schemes,
  regions = DEFAULT_REGIONS,
  onCustomerRegister,
  onCustomerLogin,
  onCustomerLogout,
  onSwitchToAdmin,
  initialTab = 'register',
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'mf-calc' | 'nps-calc' | 'schemes'>(initialTab);
  const [customerActiveView, setCustomerActiveView] = useState<'dashboard' | 'mf-calc' | 'nps-calc' | 'schemes'>('dashboard');

  // Customer Registration Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [occupation, setOccupation] = useState('');
  const [annualIncome, setAnnualIncome] = useState<number | ''>('');
  const [mobile, setMobile] = useState('');
  const [assignedRegion, setAssignedRegion] = useState(regions[0] ?? 'North Division');
  const [panAvailable, setPanAvailable] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [dematAvailable, setDematAvailable] = useState(false);
  const [kycComplete, setKycComplete] = useState(false);
  const [sipAutopayActive, setSipAutopayActive] = useState(false);
  const [narration, setNarration] = useState('');
  const [status, setStatus] = useState<Lead['status']>('Pending');

  // Customer Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Generated Credentials Dialog State
  const [createdCredentials, setCreatedCredentials] = useState<{
    userId: string;
    password: string;
    name: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isStudent = occupation.trim().toLowerCase().includes('student');

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!age || Number(age) <= 0) {
      setError('Please enter a valid age');
      return;
    }
    if (!occupation.trim()) {
      setError('Please select or enter your occupation');
      return;
    }
    if (annualIncome === '' || Number(annualIncome) < 0) {
      setError(isStudent ? 'Please enter your family annual income' : 'Please enter your annual income');
      return;
    }
    const cleanMobile = normalizeIndianMobile(mobile);
    if (!cleanMobile) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (panAvailable && !isValidPan(panNumber)) {
      setError('PAN is marked Available. Please enter a valid 10-character PAN number (ABCDE1234F).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onCustomerRegister({
        name: name.trim(),
        age: Number(age),
        gender,
        annualIncome: Number(annualIncome),
        occupation: occupation.trim(),
        mobile: cleanMobile,
        panAvailable,
        panNumber: panAvailable ? panNumber.trim().toUpperCase() : undefined,
        dematAvailable,
        kycComplete,
        sipAutopayActive,
        narration: narration.trim(),
        status: panAvailable && dematAvailable && kycComplete ? 'Ready to Invest' : status,
        statusRemarks: 'Self-registered customer via Online Customer Application Portal.',
        addedByUserId: `cust_${cleanMobile}`,
        addedByName: `${name.trim()} (Customer Self-Service)`,
        addedByDesignation: 'Customer Self-Service',
        assignedRegion,
      });

      // Show user ID & password modal (they are the same)
      setCreatedCredentials({
        userId: res.credentials.userId,
        password: res.credentials.password,
        name: res.user.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setError('Please enter your User ID / Mobile Number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCustomerLogin(loginUsername.trim(), loginPassword.trim() || loginUsername.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your User ID / Password.');
    } finally {
      setLoading(false);
    }
  };


  const copyCredentials = () => {
    if (createdCredentials) {
      navigator.clipboard.writeText(
        `Customer Portal Login Credentials:\nUser ID: ${createdCredentials.userId}\nPassword: ${createdCredentials.password}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };


  // ----------------------------------------------------
  // LOGGED-IN CUSTOMER VIEW
  // ----------------------------------------------------
  if (currentUser && (currentUser.role === 'customer' || customerLead)) {
    return (
      <div className="space-y-6">
        {/* Navigation & Switcher Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Welcome, {currentUser.name}
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  Customer Account
                </span>
              </div>
              <p className="text-xs text-slate-500">
                User ID: <span className="font-mono font-bold text-slate-700">{currentUser.username}</span> • Region: {currentUser.region}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentUser.role !== 'customer' && (
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Switch to Staff Admin Portal"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Portal</span>
            </button>
            )}

            <button
              type="button"
              onClick={onCustomerLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Inner Tabs for Customer */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCustomerActiveView('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              customerActiveView === 'dashboard'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Application & Status</span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerActiveView('mf-calc')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              customerActiveView === 'mf-calc'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Mutual Fund Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerActiveView('nps-calc')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              customerActiveView === 'nps-calc'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>NPS Pension Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerActiveView('schemes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              customerActiveView === 'schemes'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Browse Published Schemes ({schemes.length})</span>
          </button>
        </div>

        {/* View 1: Customer Application Status Dashboard */}
        {customerActiveView === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Application Status Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lead & Application Status
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border ${
                      customerLead?.status === 'Ready to Invest'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : customerLead?.status === 'Process'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                        : customerLead?.status === 'Other'
                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {customerLead?.status || 'Pending Review'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {customerLead?.statusRemarks || 'Application recorded in National Lead Registry. An officer from your region will assist you.'}
                </p>
              </div>

              {/* Assigned Division Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Regional Division
                </span>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {customerLead?.assignedRegion || currentUser.region}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Officer in-charge: <span className="font-semibold text-slate-700">{customerLead?.assignedTeamMember || 'Regional Incharge Team'}</span>
                </p>
              </div>

              {/* Login Credentials Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-xs flex flex-col justify-between">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Your Account Credentials
                </span>
                <div className="text-xs font-semibold text-slate-800 mt-1 space-y-0.5">
                  <div>User ID: <span className="font-mono font-bold text-indigo-900">{currentUser.username}</span></div>
                  <div>Password: <span className="font-mono font-bold text-indigo-900">{currentUser.username}</span> (same as User ID)</div>
                </div>
                <p className="text-[10px] text-indigo-600 mt-2">
                  Use your 10-digit mobile number as both your User ID and password.
                </p>
              </div>
            </div>

            {/* Investment Readiness Checklist Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Your Investment Readiness Status
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  {
                    label: 'PAN Card',
                    ok: !!customerLead?.panAvailable,
                    val: customerLead?.panNumber || (customerLead?.panAvailable ? 'Available' : 'Not Added'),
                  },
                  {
                    label: 'Demat Account',
                    ok: !!customerLead?.dematAvailable,
                    val: customerLead?.dematAvailable ? 'Active' : 'Not Active',
                  },
                  {
                    label: 'KYC Verification',
                    ok: !!customerLead?.kycComplete,
                    val: customerLead?.kycComplete ? 'Verified' : 'Pending',
                  },
                  {
                    label: 'SIP Auto-pay',
                    ok: !!customerLead?.sipAutopayActive,
                    val: customerLead?.sipAutopayActive ? 'Activated' : 'Inactive',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`p-3 rounded-xl border ${
                      item.ok ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">{item.label}</span>
                    <span
                      className={`font-bold mt-0.5 text-xs block ${
                        item.ok ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {item.ok ? '✓ ' : '✗ '}
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Calculator Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setCustomerActiveView('mf-calc')}
                className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md cursor-pointer hover:opacity-95 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6 text-emerald-200" />
                  <ArrowRight className="w-4 h-4 text-emerald-200" />
                </div>
                <h4 className="text-base font-bold">Mutual Fund Return Calculator</h4>
                <p className="text-xs text-emerald-100 mt-1">
                  Simulate high-yield compounding returns across large cap, small cap, and flexi cap schemes.
                </p>
              </div>

              <div
                onClick={() => setCustomerActiveView('nps-calc')}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 text-white shadow-md cursor-pointer hover:opacity-95 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Shield className="w-6 h-6 text-blue-200" />
                  <ArrowRight className="w-4 h-4 text-blue-200" />
                </div>
                <h4 className="text-base font-bold">NPS Pension Scheme Calculator</h4>
                <p className="text-xs text-blue-100 mt-1">
                  Forecast your retirement corpus, monthly pension payout, and ₹50,000 tax deduction benefits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Mutual Fund Calculator */}
        {customerActiveView === 'mf-calc' && (
          <MutualFundCalculator schemes={schemes} customerName={currentUser?.name} />
        )}

        {/* View 3: NPS Calculator */}
        {customerActiveView === 'nps-calc' && (
          <NPSCalculator schemes={schemes} customerName={currentUser?.name} />
        )}

        {/* View 4: Browse Schemes */}
        {customerActiveView === 'schemes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Available Mutual Fund & NPS Investment Schemes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemes.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      s.type === 'mutual_fund' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {s.type === 'mutual_fund' ? 'Mutual Fund' : 'NPS Scheme'}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">~{s.expectedReturnRate}% p.a.</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                  <p className="text-xs text-slate-500">{s.category} {s.fundHouse ? `• ${s.fundHouse}` : ''}</p>
                  {s.description && <p className="text-[11px] text-slate-400 italic">"{s.description}"</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // PUBLIC CUSTOMER PORTAL (REGISTER / LOGIN)
  // ----------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner with Admin Portal Link */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Investor & Customer Web Portal
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Mutual fund (SIF) and NPS scheme return calculating site
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Calculate mutual fund compounding returns, NPS pension projections, download PDF statements, or register your investor account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Back to Home Screen"
            >
              <span>← Home</span>
            </button>
          )}
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            title="Open Admin Login"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>
      </div>

      {/* Auth Switcher Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>1. Create Account</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`py-3.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>2. Customer Sign In</span>
          </button>

        </div>

        {error && (
          <div className="m-6 mb-0 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: REGISTRATION FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value, 10) : '')}
                  placeholder="e.g. 28"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <span className="absolute left-9 top-2 text-xs font-semibold text-slate-500">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/[^\d+\s-]/g, '').slice(0, 16))}
                    placeholder="10-digit number"
                    className="w-full pl-16 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>

              {/* Occupation */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Occupation <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Click a tag or type custom</span>
                </div>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Student, Software Architect, Doctor, Entrepreneur..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {OCCUPATION_SUGGESTIONS.map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccupation(occ)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer font-medium ${
                        occupation.trim().toLowerCase() === occ.toLowerCase()
                          ? occ === 'Student'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {occ === 'Student' ? '🎓 Student' : occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Annual / Family Income */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {isStudent ? (
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>Family Annual Income (₹)</span>
                      <span className="text-rose-500">*</span>
                      <span className="text-[10px] normal-case font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                        Student: Family Income
                      </span>
                    </span>
                  ) : (
                    <span>Annual Income (₹) <span className="text-rose-500">*</span></span>
                  )}
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value ? parseInt(e.target.value, 10) : '')}
                    placeholder={isStudent ? 'e.g. 500000 (Family Income)' : 'e.g. 1200000'}
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 font-semibold ${
                      isStudent
                        ? 'border-amber-300 focus:ring-amber-500 bg-amber-50/20'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <IndianRupee className="w-3 h-3 shrink-0" />
                  <span>{annualIncome === '' ? '—' : formatInr(Number(annualIncome))}</span>
                </div>
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Geographical Division / Territory
              </label>
              <select
                value={assignedRegion}
                onChange={(e) => setAssignedRegion(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Investment Readiness Checklist */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                Investment Readiness Checklist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-md bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={panAvailable}
                    onChange={(e) => {
                      if (!e.target.checked) setPanNumber('');
                      setPanAvailable(e.target.checked);
                    }}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  PAN Card Available
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-md bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={dematAvailable}
                    onChange={(e) => setDematAvailable(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  Demat Account Available
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-md bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={kycComplete}
                    onChange={(e) => setKycComplete(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  KYC Complete
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-md bg-white border border-slate-200 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={sipAutopayActive}
                    onChange={(e) => setSipAutopayActive(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  SIP Auto-payment Activated
                </label>
              </div>

              {panAvailable && (
                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PAN Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) =>
                      setPanNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
                    }
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    className="w-full sm:w-64 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
                  />
                </div>
              )}
            </div>

            {/* Savings Narration */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Narration for Any Other Savings <span className="text-slate-400 normal-case font-medium">(optional)</span>
              </label>
              <textarea
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={2}
                placeholder="Details of other savings (e.g. FD in SBI, active SIP of ₹5,000, gold bonds, insurance policies)..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status Option Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Application & Investment Status Option</span>
                <span className="text-[10px] text-indigo-600 font-semibold">Saved to All Leads & Reports</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
              >
                <option value="Pending">Pending (General Inquiry / Needs Discussion)</option>
                <option value="Ready to Invest">Ready to Invest (Immediate Investment Execution)</option>
                <option value="Process">Process (Document Processing / KYC in Progress)</option>
                <option value="Other">Other (Specific Scheme Consultation)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? 'Creating Account & Registering Lead...' : 'Complete Registration & Generate User ID'}
            </button>
          </form>
        )}

        {/* TAB 2: EXISTING CUSTOMER LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Sign in with your 10-digit mobile number. Your <strong>User ID and Password are identical</strong>.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer User ID (10-Digit Mobile Number) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password (Same as User ID)
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Leave blank or enter same 10-digit User ID"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In to Customer Dashboard'}
            </button>
          </form>
        )}
      </div>

      {/* POPUP: AUTOMATIC USER ID & PASSWORD DISPLAY AFTER ACCOUNT CREATION */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Account Created Successfully!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Welcome, {createdCredentials.name}. Your lead dossier has been saved and your login credentials are ready:
              </p>
            </div>

            {/* Generated Credentials Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 font-mono">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span className="text-[11px] text-slate-400 font-sans font-bold uppercase">Customer User ID</span>
                <span className="text-sm font-black text-indigo-700">{createdCredentials.userId}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-sans font-bold uppercase">Password</span>
                <span className="text-sm font-black text-indigo-700">{createdCredentials.password}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Note: Your <strong>User ID and Password are identical</strong> ({createdCredentials.userId}).
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={copyCredentials}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all border border-indigo-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Credentials Copied to Clipboard!' : 'Copy User ID & Password'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Proceed to Customer Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

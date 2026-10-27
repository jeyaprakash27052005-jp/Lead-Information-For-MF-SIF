export type UserRole = 'head' | 'regional_incharge' | 'area_incharge' | 'customer';

export interface User {
  id: string;
  username: string;
  name: string;
  designation: string;
  role: UserRole;
  region: string;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
  associatedLeadId?: string;
  /** Features an admin (Head / Regional Incharge) has switched on or off for this customer */
  permissions?: CustomerPermissionSettings;
}

/** What an admin saved for one customer. `explicit` marks values chosen in the Permissions window (false = blocked for this customer). */
export type CustomerPermissionSettings = Partial<CustomerPermissions> & { explicit?: boolean };

export interface CustomerPermissions {
  mfCalculator: boolean;
  npsCalculator: boolean;
  schemesCatalog: boolean;
  healthCheckup: boolean;
}

export type SchemeType = 'mutual_fund' | 'nps';

export interface InvestmentScheme {
  id: string;
  name: string;
  type: SchemeType;
  category: string;
  expectedReturnRate: number;
  riskLevel?: 'Low' | 'Moderate' | 'High' | 'Very High';
  minInvestment?: number;
  description?: string;
  fundHouse?: string;
  createdAt?: string;
}

export type LeadStatus =
  | 'Pending'
  | 'Ready to Invest'
  | 'Process'
  | 'Other';

export interface Lead {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  annualIncome: number;
  occupation: string;
  narration?: string;
  mobile?: string;
  panAvailable?: boolean;
  panNumber?: string;
  dematAvailable?: boolean;
  kycComplete?: boolean;
  sipAutopayActive?: boolean;
  status: LeadStatus;
  statusRemarks?: string;
  otherStatusNarration?: string;
  addedByUserId: string;
  addedByName: string;
  addedByDesignation: string;
  assignedRegion: string;
  assignedTeamMember?: string;
  /** Where the lead came from (normal entries have no source) */
  leadSource?: 'finance_health_checkup';
  email?: string;
  healthReportId?: string;
  healthScore?: number;
  healthBand?: string;
  createdAt: string;
  updatedAt: string;
}

/** Movement applied to the ad picture (see utils/adAnimations.ts) */
export type AdAnimation =
  | 'none' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up'
  | 'fade-in' | 'slide-left' | 'slide-right' | 'slide-up' | 'bounce' | 'pulse' | 'float' | 'shake' | 'flip' | 'shimmer';
export type AdTextEffect = 'none' | 'rise' | 'fade' | 'slide' | 'pop';
export type AdAnimationSpeed = 'slow' | 'normal' | 'fast';

export interface AdBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string; // supports base64 Data URL or http/https URL (jpg, jpeg, png, gif)
  linkUrl?: string; // target action: 'mf-calc' | 'nps-calc' | 'register' or external url
  badge?: string; // e.g. "Special Offer", "High Return", "Tax Saver", "NPS Pension", "New Fund"
  isActive: boolean;
  order: number;
  /** How the picture moves on the Home Screen (default: none) */
  animation?: AdAnimation;
  /** How the headline and tagline appear (default: rise) */
  textEffect?: AdTextEffect;
  animationSpeed?: AdAnimationSpeed;
  /** Who made the creative */
  createdByName?: string;
  createdByRole?: UserRole;
  createdAt: string;
}

export type ViewTab =
  | 'all-leads'
  | 'assigned-leads'
  | 'add-lead'
  | 'lead-status-pipeline'
  | 'user-management'
  | 'regional-metrics'
  | 'lead-reports'
  | 'scheme-management'
  | 'ads-management'
  | 'customer-portal'
  | 'mf-calculator'
  | 'nps-calculator'
  | 'health-reports'
  | 'feature-controls'
  | 'awareness-admin'
  | 'awareness-programs'
  | 'health-questions'
  | 'health-checkup'
  | 'finance-calculations'
  | 'investor-profile'
  | 'investor-profile-customer';

export interface HealthReport {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  occupation: string;
  annualIncome: number;
  region: string;
  /** Address or place typed by the customer */
  address?: string;
  answers: Record<string, number | string | string[]>;
  overallScore: number;
  band: string;
  categoryScores: Record<string, number>;
  moneyStyle: string;
  source: 'health_portal' | 'customer_portal';
  email?: string;
  mobile?: string;
  leadId?: string;
  contactAt?: string;
  // Copy of the questions the person answered, so the admin always sees the same questions
  questionSnapshot?: {
    id: string;
    category: string;
    text: string;
    reverse?: boolean;
    type?: 'scale' | 'choice' | 'list' | 'checklist' | 'text';
    options?: { id: string; label: string; score: number }[];
    required?: boolean;
  }[];
  categorySnapshot?: { id: string; label: string; intro: string; low: string; mid: string; high: string }[];
  investmentPlan?: InvestmentPlan;
  emailStatus?: 'sent' | 'failed' | 'not_configured';
  emailError?: string;
  emailAt?: string;
  createdAt: string;
}

/** How much to put into mutual funds and NPS each month, worked out from the health check-up answers */
export interface InvestmentPlan {
  monthlyIncome: number;
  investPct: number; // % of monthly income suggested for investing
  monthlyInvest: number;
  mfMonthly: number;
  npsMonthly: number;
  mfRate: number; // % per year used for the projection
  npsRate: number;
  mfYears: number;
  npsYears: number;
  mfValue: number; // future value of the suggested SIP
  npsValue: number;
  note: string;
}

/** Switches that Head Incharge and Regional Incharge can turn on or off for the whole site */
export interface AppFeatureFlags {
  customerPortal: boolean; // the whole customer portal (login and dashboard)
  healthPortal: boolean; // the stand-alone Finance Health Check-up portal
  customerRegistration: boolean; // customers creating their own account
  mfCalculator: boolean;
  npsCalculator: boolean;
  schemesCatalog: boolean; // Browse Published Schemes
  healthCheckup: boolean; // Finance Health Check-up inside the customer portal
  homeAds: boolean; // moving ads on the Home Screen
  awarenessPrograms: boolean; // the Awareness Programs list shown to customers and on the Home Screen
  investorProfile: boolean; // the Investor Profile check (11 questions + fund fit) in the customer portal
}

/** How the health check-up report reaches the customer: e-mailed PDF, or a WhatsApp / SMS message (the e-mail ID is still collected) */
export type ReportDelivery = 'email' | 'message';

export interface AppSettings {
  features: AppFeatureFlags;
  reportDelivery?: ReportDelivery;
  mfReturnRate: number; // % per year used by the Mutual Fund calculator
  npsReturnRate: number; // % per year used by the NPS calculator
  updatedAt?: string;
  updatedBy?: string;
}

/** An investor awareness programme (seminar / webinar) that the admin team announces */
export interface AwarenessProgram {
  id: string;
  title: string;
  description: string;
  startsAt: string; // date and time, e.g. 2026-11-20T17:30
  endsAt?: string;
  mode: 'online' | 'offline';
  venue?: string; // place for an offline programme
  joinLink?: string; // https link for an online programme
  language?: string;
  speaker?: string;
  contact?: string; // phone / WhatsApp number for registering
  /** Division the programme is for. Empty = every region. */
  region?: string;
  createdByRole?: UserRole;
  createdById?: string;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

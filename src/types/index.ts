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
  permissions?: Partial<CustomerPermissions>;
}

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

export interface AdBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string; // supports base64 Data URL or http/https URL (jpg, jpeg, png, gif)
  linkUrl?: string; // target action: 'mf-calc' | 'nps-calc' | 'register' or external url
  badge?: string; // e.g. "Special Offer", "High Return", "Tax Saver", "NPS Pension", "New Fund"
  isActive: boolean;
  order: number;
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
  | 'health-checkup';

export interface HealthReport {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  occupation: string;
  annualIncome: number;
  region: string;
  answers: Record<string, number>;
  overallScore: number;
  band: string;
  categoryScores: Record<string, number>;
  moneyStyle: string;
  source: 'health_portal' | 'customer_portal';
  email?: string;
  mobile?: string;
  leadId?: string;
  contactAt?: string;
  createdAt: string;
}

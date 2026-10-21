import { CustomerPermissions, User } from '../types';

/**
 * Every customer can use every feature while its switch is ON in Feature Controls.
 * An admin (Head / Regional Incharge) can block a feature for one customer in that customer's Permissions window.
 */
export const DEFAULT_CUSTOMER_PERMISSIONS: CustomerPermissions = {
  mfCalculator: true,
  npsCalculator: true,
  schemesCatalog: true,
  healthCheckup: true,
};

export const resolvePermissions = (user?: Pick<User, 'permissions'> | null): CustomerPermissions => {
  const p = user?.permissions;
  if (!p) return { ...DEFAULT_CUSTOMER_PERMISSIONS };
  if (p.explicit) {
    return {
      mfCalculator: p.mfCalculator !== false,
      npsCalculator: p.npsCalculator !== false,
      schemesCatalog: p.schemesCatalog !== false,
      healthCheckup: p.healthCheckup !== false,
    };
  }
  // Older records: a blocked calculator / scheme list stays blocked, but the Health Check-up now follows its switch
  return {
    mfCalculator: p.mfCalculator !== false,
    npsCalculator: p.npsCalculator !== false,
    schemesCatalog: p.schemesCatalog !== false,
    healthCheckup: true,
  };
};

export const PERMISSION_LABELS: { key: keyof CustomerPermissions; label: string; help: string }[] = [
  { key: 'mfCalculator', label: 'Mutual Fund Calculator', help: 'Future value of lumpsum / SIP in mutual fund schemes' },
  { key: 'npsCalculator', label: 'NPS Scheme Calculator', help: 'Future value of lumpsum / SIP in NPS schemes' },
  { key: 'schemesCatalog', label: 'Browse Published Schemes', help: 'See the list of schemes and their expected returns' },
  { key: 'healthCheckup', label: 'Finance Health Check-up', help: 'Take the financial health questionnaire and download the report' },
];

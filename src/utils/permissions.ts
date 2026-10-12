import { CustomerPermissions, User } from '../types';

/**
 * What a customer can use when an admin has not changed anything.
 * The calculators and scheme list stay on as before; the Finance Health Check-up must be switched on by an admin.
 */
export const DEFAULT_CUSTOMER_PERMISSIONS: CustomerPermissions = {
  mfCalculator: true,
  npsCalculator: true,
  schemesCatalog: true,
  healthCheckup: false,
};

export const resolvePermissions = (user?: Pick<User, 'permissions'> | null): CustomerPermissions => ({
  ...DEFAULT_CUSTOMER_PERMISSIONS,
  ...(user?.permissions || {}),
});

export const PERMISSION_LABELS: { key: keyof CustomerPermissions; label: string; help: string }[] = [
  { key: 'mfCalculator', label: 'Mutual Fund Calculator', help: 'Future value of lumpsum / SIP in mutual fund schemes' },
  { key: 'npsCalculator', label: 'NPS Scheme Calculator', help: 'Future value of lumpsum / SIP in NPS schemes' },
  { key: 'schemesCatalog', label: 'Browse Published Schemes', help: 'See the list of schemes and their expected returns' },
  { key: 'healthCheckup', label: 'Finance Health Check-up', help: 'Take the financial health questionnaire and download the report' },
];

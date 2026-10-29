import { User } from '../types';

/** SIP Reminders: always for Head and Regional Incharge; for an Area Incharge only when one of them switched it on */
export const canUseSip = (u: User | null | undefined): boolean =>
  !!u && (u.role === 'head' || u.role === 'regional_incharge' || (u.role === 'area_incharge' && u.sipRemindersEnabled === true));

import { Lead, User } from '../types';

export const NATIONAL_HQ_REGION = 'All Regions (National HQ)';
export const DEFAULT_REGIONS = ['North Division', 'South Division', 'East Division', 'West Division'];

/**
 * All assignable regions: the default divisions plus any region that already
 * exists on a user or a lead (so regions created via "Create new region"
 * appear everywhere automatically once an account/lead uses them).
 */
export const getAllRegions = (users: User[] = [], leads: Lead[] = []): string[] => {
  const extra = new Set<string>();
  users.forEach((u) => u.region && extra.add(u.region.trim()));
  leads.forEach((l) => l.assignedRegion && extra.add(l.assignedRegion.trim()));
  DEFAULT_REGIONS.forEach((r) => extra.delete(r));
  extra.delete(NATIONAL_HQ_REGION);
  extra.delete('');
  return [...DEFAULT_REGIONS, ...[...extra].sort((a, b) => a.localeCompare(b))];
};

import { Lead, User } from '../types';

export const NATIONAL_HQ_REGION = 'All Regions (National HQ)';
export const DEFAULT_REGIONS = ['North Division', 'South Division', 'East Division', 'West Division'];

/**
 * All assignable regions: the default divisions plus any region that already
 * exists on a user or a lead (so regions created via "Create new region"
 * appear everywhere automatically once an account/lead uses them).
 */
export const getAllRegions = (
  users: User[] = [],
  leads: Lead[] = [],
  stored: string[] | null = null
): string[] => {
  const base = stored ?? DEFAULT_REGIONS;
  const extra = new Set<string>();
  base.forEach((r) => extra.add(r.trim()));
  users.forEach((u) => u.region && extra.add(u.region.trim()));
  leads.forEach((l) => l.assignedRegion && extra.add(l.assignedRegion.trim()));
  extra.delete(NATIONAL_HQ_REGION);
  extra.delete('');
  const ordered = [...DEFAULT_REGIONS.filter((r) => extra.has(r))];
  const rest = [...extra].filter((r) => !DEFAULT_REGIONS.includes(r)).sort((a, b) => a.localeCompare(b));
  return [...ordered, ...rest];
};

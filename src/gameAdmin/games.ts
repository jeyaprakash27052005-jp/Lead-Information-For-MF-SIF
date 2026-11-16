/** The games on the Mcube Games site (same list as apps/game/www/shared/mcube.js). */
export const GAME_LIST: { id: string; name: string; icon: string; who: string }[] = [
  { id: 'investment', name: 'Investment Business', icon: '🎲', who: 'Grown-ups and kids · 1 to 4 players' },
  { id: 'adventure', name: 'Money Adventure', icon: '🌟', who: 'Kids' },
  { id: 'challenge', name: '₹1 Lakh → ₹10 Lakh Challenge', icon: '💰', who: 'Grown-ups' },
  { id: 'aadupuli', name: 'Bull vs Bear – Aadu Puli', icon: '🐯', who: 'Everyone · English / தமிழ்' },
  { id: 'pallanguli', name: 'Pallanguli Investment Game', icon: '🌰', who: '2 players · English / தமிழ்' },
  { id: 'finance', name: 'Personal Finance Management', icon: '🏦', who: 'Grown-ups · 1 to 4 players' },
];

export const gameName = (id: string) => GAME_LIST.find((g) => g.id === id)?.name || id;

/** "web-android" -> "Website · Android", "app-windows" -> "App · Windows" */
export const deviceLabel = (d: string) => {
  if (!d) return '';
  const [k, os] = d.split('-');
  const OS: Record<string, string> = { windows: 'Windows', mac: 'Mac', android: 'Android', ios: 'iPhone/iPad', other: 'Other' };
  return `${k === 'app' ? 'App' : 'Website'} · ${OS[os] || os || ''}`;
};

/** Small details object -> one readable line */
export const detailsText = (d?: Record<string, unknown>): string => {
  if (!d) return '';
  const fmt = (v: unknown): string =>
    v && typeof v === 'object'
      ? Object.entries(v as Record<string, unknown>)
          .map(([k, x]) => `${k} ${fmt(x)}`)
          .join(', ')
      : String(v);
  return Object.entries(d)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${fmt(v)}`)
    .join(' · ');
};

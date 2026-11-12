/** Login PIN for admin users (Head, Regional Incharge, Area Incharge). Only a SHA-256 of it is stored. */
export const PIN_RULE = /^[0-9]{4,6}$/;
export const PIN_HELP = 'A PIN is 4 to 6 digits.';

export async function hashAdminPin(userId: string, pin: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`mcube-admin-pin|${userId}|${pin}`));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** After 5 wrong PINs for a username on this device, PIN sign-in waits 5 minutes (password sign-in still works). */
const KEY = 'mcube_pin_tries_v1';
type Tries = Record<string, { n: number; until: number }>;
const read = (): Tries => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Tries;
  } catch {
    return {};
  }
};
const write = (t: Tries) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* private mode: no limit kept */
  }
};
export const pinWaitSeconds = (username: string): number => {
  const t = read()[username.toLowerCase()];
  return t && t.until > Date.now() ? Math.ceil((t.until - Date.now()) / 1000) : 0;
};
export const notePinFailure = (username: string) => {
  const all = read();
  const k = username.toLowerCase();
  const t = all[k] && all[k].until > Date.now() ? all[k] : { n: 0, until: 0 };
  t.n += 1;
  if (t.n >= 5) {
    t.n = 0;
    t.until = Date.now() + 5 * 60 * 1000;
  }
  all[k] = t;
  write(all);
};
export const clearPinFailures = (username: string) => {
  const all = read();
  delete all[username.toLowerCase()];
  write(all);
};

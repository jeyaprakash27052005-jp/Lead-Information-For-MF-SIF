// Keeps a person logged in when the page is refreshed. Only the user id is stored - never a password.
const KEY = 'mfsif_session_v1';
const TAB_KEY = 'mfsif_tab_v1';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // a saved login is forgotten after 7 days

export const saveSession = (userId: string) => {
  try {
    const old = readSession();
    // keep the original login time so the 7 days count from the real login
    const at = old && old.userId === userId ? old.at : Date.now();
    localStorage.setItem(KEY, JSON.stringify({ userId, at }));
  } catch (_e) {
    // storage may be blocked (private mode) - the login then simply works for this page view
  }
};

export const readSession = (): { userId: string; at: number } | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.userId !== 'string' || typeof s.at !== 'number') return null;
    if (Date.now() - s.at > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch (_e) {
    return null;
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(TAB_KEY);
  } catch (_e) {
    // ignore
  }
};

/** The screen the person was on, so a refresh returns to the same screen */
export const saveTab = (userId: string, tab: string) => {
  try {
    sessionStorage.setItem(TAB_KEY, JSON.stringify({ userId, tab }));
  } catch (_e) {
    // ignore
  }
};

export const readTab = (userId: string): string | null => {
  try {
    const raw = sessionStorage.getItem(TAB_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    return t && t.userId === userId && typeof t.tab === 'string' ? t.tab : null;
  } catch (_e) {
    return null;
  }
};

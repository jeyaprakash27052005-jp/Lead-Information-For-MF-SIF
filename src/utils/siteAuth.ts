/** Hashing for the advertising website's customer accounts (browser Web Crypto, no outside service) */
const enc = new TextEncoder();
const toB64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : buf)));
const ITERATIONS = 100000;

export const randomSalt = (): string => toB64(crypto.getRandomValues(new Uint8Array(16)));

/** Salted PBKDF2 hash: slow on purpose, so a leaked hash cannot be guessed quickly */
export const hashSecret = async (secret: string, salt: string): Promise<string> => {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toB64(bits);
};

/** The same e-mail always gives the same account id, so one e-mail cannot register twice */
export const customerIdFor = async (email: string): Promise<string> => {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(email.trim().toLowerCase()));
  return 'sc_' + Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
};

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0 / O / 1 / I to avoid mistakes when read out on a call
/** 8 characters, shown as XXXX-XXXX: about 10^12 possibilities */
export const newVerificationCode = (): string => {
  const r = crypto.getRandomValues(new Uint8Array(8));
  const c = Array.from(r, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `${c.slice(0, 4)}-${c.slice(4)}`;
};
export const normalizeCode = (s: string): string => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const isEmail = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

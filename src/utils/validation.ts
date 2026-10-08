/**
 * Indian mobile number: 10 digits starting with 6, 7, 8 or 9.
 * Accepts common ways of typing it (spaces, dashes, +91, 91 or a leading 0) and
 * returns the plain 10-digit number, or null when it is not a valid Indian mobile.
 */
export const normalizeIndianMobile = (input: string | undefined | null): string | null => {
  if (!input) return null;
  let digits = input.replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (!/^\d+$/.test(digits)) return null;
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

/** Format a stored 10-digit number for display: +91 98765 43210 */
export const formatIndianMobile = (mobile: string | undefined | null): string =>
  mobile && /^\d{10}$/.test(mobile) ? `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile || '';

/** PAN: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F) */
export const isValidPan = (pan: string | undefined | null): boolean =>
  !!pan && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim().toUpperCase());

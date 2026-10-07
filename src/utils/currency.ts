/**
 * Currency helpers. All amounts in the app are Indian Rupees (INR):
 * they are entered, stored and displayed in rupees with Indian digit grouping.
 */
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** 12760000 -> "₹1,27,60,000" */
export const formatInr = (amount: number): string => inrFormatter.format(amount);

/** 12760000 -> "₹1.28 Cr", 1250000 -> "₹12.50 L", 45000 -> "₹45,000" */
export const formatInrCompact = (amount: number): string => {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`;
  return inrFormatter.format(amount);
};

/** 12760000 -> "1,27,60,000" (no symbol) */
export const formatInrNumber = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);

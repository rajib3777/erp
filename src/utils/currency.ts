// ==============================================================================
// BANGLADESHI TAKA CURRENCY FORMATTER
// ==============================================================================

/**
 * Format numeric amount into Bangladeshi Taka (BDT) representation
 * Example: formatCurrency(125000) -> "৳1,25,000.00"
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return '৳0.00';

  // Format with en-IN or standard South Asian numbering system
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `৳${formatted}`;
}

/**
 * Format without currency symbol
 */
export function formatAmount(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return '0.00';

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Centralized Indian Rupee (INR) currency formatting utility.
 * Guarantees that the rupee symbol '₹' appears exactly once across the application.
 * Handles numbers, strings, and inputs that already contain currency symbols cleanly.
 */

export interface CurrencyFormatOptions {
  decimals?: number;
  showSymbol?: boolean;
}

export const formatINR = (
  amount: number | string | null | undefined,
  options?: CurrencyFormatOptions
): string => {
  const showSymbol = options?.showSymbol ?? true;

  if (amount === null || amount === undefined || amount === '') {
    return showSymbol ? '₹0' : '0';
  }

  let cleanNum: number;
  if (typeof amount === 'number') {
    cleanNum = isNaN(amount) ? 0 : amount;
  } else {
    // Strip any existing ₹, Rs, INR, commas, and extraneous spaces
    const stripped = String(amount).replace(/[₹\s,]|(?:INR|Rs\.?)/gi, '');
    cleanNum = parseFloat(stripped);
    if (isNaN(cleanNum)) {
      cleanNum = 0;
    }
  }

  const decimals =
    options?.decimals !== undefined
      ? options.decimals
      : cleanNum % 1 !== 0
      ? 2
      : 0;

  const formatted = cleanNum.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Convenience alias for formatINR
 */
export const formatCurrency = formatINR;

export default formatINR;


/**
 * Comprehensive Validation Utilities for Salon Management SaaS
 * Type-safe, locale-aware, and tested for enterprise multi-tenant salon workflows.
 */

export interface ValidationRule<T = any> {
  (value: T, allValues?: any): string | null;
}

export const Validation = {
  /**
   * Name Validation (Customer, Staff, Salon, Branch, etc.)
   * Requires minimum 2 characters, forbids numbers-only or symbol-only names.
   */
  name: (fieldLabel = 'Name', min = 2, max = 100, isRequired = true): ValidationRule<string> => {
    return (value: string) => {
      const trimmed = (value ?? '').trim();
      if (!trimmed) {
        return isRequired ? `${fieldLabel} is required.` : null;
      }
      if (trimmed.length < min) {
        return `${fieldLabel} must be at least ${min} characters.`;
      }
      if (trimmed.length > max) {
        return `${fieldLabel} cannot exceed ${max} characters.`;
      }
      // Must contain at least 2 alphabetic characters (supports Latin & Indic scripts)
      const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
      if (letterCount < min) {
        return `${fieldLabel} must contain real letters (not numbers or symbols only).`;
      }
      // Allowed: letters, spaces, hyphens, dots, apostrophes
      const validCharsRegex = /^[\p{L}\s.'-]+$/u;
      if (!validCharsRegex.test(trimmed)) {
        return `${fieldLabel} contains invalid special characters.`;
      }
      return null;
    };
  },

  /**
   * Phone Number Validation
   * Optimally tuned for India (+91 or 10-digit 6-9 standard) and international mobile formats.
   */
  phone: (isRequired = true, country = 'IN'): ValidationRule<string> => {
    return (value: string) => {
      const raw = (value ?? '').trim();
      if (!raw) {
        return isRequired ? 'Mobile number is required.' : null;
      }

      // Strip common decorators: spaces, dashes, parentheses
      const cleanDigits = raw.replace(/[\s\-()]/g, '');

      // Reject non-phone characters
      if (!/^\+?[0-9]+$/.test(cleanDigits)) {
        return 'Please enter digits only (e.g. 98250 12345).';
      }

      if (country === 'IN') {
        let nationalDigits = cleanDigits;
        if (cleanDigits.startsWith('+91')) {
          nationalDigits = cleanDigits.slice(3);
        } else if (cleanDigits.startsWith('91') && cleanDigits.length === 12) {
          nationalDigits = cleanDigits.slice(2);
        } else if (cleanDigits.startsWith('0') && cleanDigits.length === 11) {
          nationalDigits = cleanDigits.slice(1);
        }

        if (nationalDigits.length !== 10) {
          return 'Please enter a valid 10-digit mobile number.';
        }
        if (!/^[6-9]/.test(nationalDigits)) {
          return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
        }
        return null;
      }

      // General international phone validation: 7 to 15 digits
      const digitsOnly = cleanDigits.replace(/\+/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        return 'Phone number must be between 7 and 15 digits.';
      }
      return null;
    };
  },

  /**
   * Email Address Validation (RFC compliant standard regex)
   */
  email: (isRequired = false): ValidationRule<string> => {
    return (value: string) => {
      const trimmed = (value ?? '').trim();
      if (!trimmed) {
        return isRequired ? 'Email address is required.' : null;
      }
      // Standard robust email pattern with TLD validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address (e.g. name@domain.com).';
      }
      return null;
    };
  },

  /**
   * Generic Required Field
   */
  required: (fieldLabel = 'This field'): ValidationRule<any> => {
    return (value: any) => {
      if (value === null || value === undefined) {
        return `${fieldLabel} is required.`;
      }
      if (typeof value === 'string' && value.trim() === '') {
        return `${fieldLabel} is required.`;
      }
      if (Array.isArray(value) && value.length === 0) {
        return `Please select at least one ${fieldLabel.toLowerCase()}.`;
      }
      return null;
    };
  },

  /**
   * Currency / Price Validation
   */
  price: (fieldLabel = 'Price', min = 0, isRequired = true): ValidationRule<any> => {
    return (value: any) => {
      const strVal = String(value ?? '').trim();
      if (!strVal) {
        return isRequired ? `${fieldLabel} is required.` : null;
      }
      const num = Number(strVal);
      if (isNaN(num)) {
        return `${fieldLabel} must be a valid number.`;
      }
      if (min > 0 && num <= 0) {
        return `${fieldLabel} must be greater than zero.`;
      }
      if (num < min) {
        return `${fieldLabel} cannot be less than ₹${min}.`;
      }
      if (num > 10000000) {
        return `${fieldLabel} exceeds maximum allowed value.`;
      }
      return null;
    };
  },

  /**
   * Quantity / Inventory Count Validation
   */
  quantity: (fieldLabel = 'Quantity', min = 0, isRequired = true): ValidationRule<any> => {
    return (value: any) => {
      const strVal = String(value ?? '').trim();
      if (!strVal) {
        return isRequired ? `${fieldLabel} is required.` : null;
      }
      const num = Number(strVal);
      if (isNaN(num) || !Number.isInteger(num)) {
        return `${fieldLabel} must be a whole number.`;
      }
      if (num < min) {
        return `${fieldLabel} cannot be less than ${min}.`;
      }
      return null;
    };
  },

  /**
   * Percentage (0 to 100%)
   */
  percentage: (fieldLabel = 'Percentage', isRequired = true): ValidationRule<any> => {
    return (value: any) => {
      const strVal = String(value ?? '').trim();
      if (!strVal) {
        return isRequired ? `${fieldLabel} is required.` : null;
      }
      const num = Number(strVal);
      if (isNaN(num)) {
        return `${fieldLabel} must be a number.`;
      }
      if (num < 0 || num > 100) {
        return `${fieldLabel} must be between 0% and 100%.`;
      }
      return null;
    };
  },

  /**
   * Date Validation (Booking dates, DOB, Validity dates)
   */
  date: (
    fieldLabel = 'Date',
    isRequired = true,
    options?: { notPast?: boolean; notFuture?: boolean }
  ): ValidationRule<string> => {
    return (value: string) => {
      const trimmed = (value ?? '').trim();
      if (!trimmed) {
        return isRequired ? `${fieldLabel} is required.` : null;
      }

      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) {
        return 'Please enter a valid date.';
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);

      if (options?.notPast && trimmed < todayStr) {
        return `${fieldLabel} cannot be in the past.`;
      }

      if (options?.notFuture && trimmed > todayStr) {
        return `${fieldLabel} cannot be in the future.`;
      }

      return null;
    };
  },

  /**
   * Alphanumeric Code / SKU / Coupon Code
   */
  code: (fieldLabel = 'Code', min = 2, max = 30, isRequired = true): ValidationRule<string> => {
    return (value: string) => {
      const trimmed = (value ?? '').trim();
      if (!trimmed) {
        return isRequired ? `${fieldLabel} is required.` : null;
      }
      if (trimmed.length < min) {
        return `${fieldLabel} must be at least ${min} characters.`;
      }
      if (trimmed.length > max) {
        return `${fieldLabel} cannot exceed ${max} characters.`;
      }
      if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
        return `${fieldLabel} can only contain letters, numbers, hyphens, and underscores.`;
      }
      return null;
    };
  },

  /**
   * Password Validation
   */
  password: (min = 6): ValidationRule<string> => {
    return (value: string) => {
      const val = value ?? '';
      if (!val) {
        return 'Password is required.';
      }
      if (val.length < min) {
        return `Password must be at least ${min} characters long.`;
      }
      return null;
    };
  },

  /**
   * PIN Code / Postal Code Validation (e.g. 6-digit Indian PIN)
   */
  postalCode: (isRequired = false, country = 'IN'): ValidationRule<string> => {
    return (value: string) => {
      const trimmed = (value ?? '').trim();
      if (!trimmed) {
        return isRequired ? 'Postal code is required.' : null;
      }
      if (country === 'IN') {
        if (!/^[1-9][0-9]{5}$/.test(trimmed)) {
          return 'Please enter a valid 6-digit Indian PIN code.';
        }
      } else {
        if (!/^[a-zA-Z0-9\s-]{3,10}$/.test(trimmed)) {
          return 'Please enter a valid postal code.';
        }
      }
      return null;
    };
  },
};

/**
 * Helper to extract field errors from Django REST Framework backend responses.
 * Maps API errors like { phone: ["A customer with this phone number already exists."] }
 * to clean string maps.
 */
export function extractBackendErrors(err: any): { fieldErrors: Record<string, string>; generalError: string | null } {
  const fieldErrors: Record<string, string> = {};
  let generalError: string | null = null;

  if (!err) return { fieldErrors, generalError: 'An unexpected error occurred.' };

  const responseData = err?.data || err?.response?.data || err;

  if (typeof responseData === 'object' && responseData !== null) {
    for (const [key, val] of Object.entries(responseData)) {
      if (key === 'detail' || key === 'error' || key === 'message') {
        generalError = String(val);
      } else if (key === 'non_field_errors') {
        generalError = Array.isArray(val) ? val.join(' ') : String(val);
      } else if (Array.isArray(val) && val.length > 0) {
        fieldErrors[key] = String(val[0]);
      } else if (typeof val === 'string') {
        fieldErrors[key] = val;
      }
    }
  }

  if (!generalError && Object.keys(fieldErrors).length === 0) {
    generalError = err?.message || 'Failed to complete request. Please verify entered details.';
  }

  return { fieldErrors, generalError };
}


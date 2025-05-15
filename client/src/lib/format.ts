/**
 * Utility functions for formatting values in the application
 * These functions are used to ensure consistent formatting of currencies, dates, and other values
 */

/**
 * Format a currency value according to locale
 * @param amount The numeric amount to format
 * @param currency The ISO currency code (e.g., 'USD', 'NGN', 'EUR')
 * @param locale The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted currency string with symbol
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'NGN', 
  locale: string = 'en-US'
): string {
  // Handle special case for Nigerian Naira which might not be well-supported in all browsers
  if (currency === 'NGN') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('NGN', '₦');
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with commas for thousands separators
 * @param value The number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/**
 * Format a date in a human-readable format
 * @param date Date object or ISO string
 * @param format The format to use: 'short', 'medium', 'long', or 'full'
 * @param locale The locale to use for formatting
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format,
  }).format(dateObj);
}

/**
 * Format a date and time in a human-readable format
 * @param date Date object or ISO string
 * @param format The format to use: 'short', 'medium', 'long', or 'full'
 * @param locale The locale to use for formatting
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format,
    timeStyle: format,
  }).format(dateObj);
}

/**
 * Format a time in a human-readable format
 * @param date Date object or ISO string
 * @param format The format to use: 'short', 'medium', 'long', or 'full'
 * @param locale The locale to use for formatting
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string,
  format: 'short' | 'medium' | 'long' | 'full' = 'short',
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  return new Intl.DateTimeFormat(locale, {
    timeStyle: format,
  }).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param date Date object or ISO string
 * @param now Reference date object (defaults to now)
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date | string,
  now: Date = new Date()
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInSec = Math.round(diffInMs / 1000);
  const diffInMin = Math.round(diffInSec / 60);
  const diffInHr = Math.round(diffInMin / 60);
  const diffInDays = Math.round(diffInHr / 24);
  const diffInWeeks = Math.round(diffInDays / 7);
  const diffInMonths = Math.round(diffInDays / 30);
  const diffInYears = Math.round(diffInDays / 365);
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  
  if (Math.abs(diffInSec) < 60) {
    return rtf.format(diffInSec, 'second');
  } else if (Math.abs(diffInMin) < 60) {
    return rtf.format(diffInMin, 'minute');
  } else if (Math.abs(diffInHr) < 24) {
    return rtf.format(diffInHr, 'hour');
  } else if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, 'day');
  } else if (Math.abs(diffInWeeks) < 4) {
    return rtf.format(diffInWeeks, 'week');
  } else if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'month');
  } else {
    return rtf.format(diffInYears, 'year');
  }
}

/**
 * Truncate a string to a maximum length with ellipsis
 * @param text The string to truncate
 * @param maxLength Maximum allowed length
 * @returns Truncated string with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format a transaction type for display
 * @param type The transaction type from the API
 * @returns Formatted transaction type string
 */
export function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'deposit': 'Deposit',
    'withdrawal': 'Withdrawal',
    'winnings': 'Game Winnings',
    'stake': 'Game Stake',
    'refund': 'Refund',
  };
  
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Format a transaction status for display
 * @param status The transaction status from the API
 * @returns Formatted transaction status string
 */
export function formatTransactionStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'completed': 'Completed',
    'pending': 'Pending',
    'failed': 'Failed',
    'disputed': 'Disputed',
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}
/**
 * Utility functions for formatting values like currency, dates, and numbers
 */

/**
 * Format a number as currency with the specified currency code
 * @param amount The amount to format
 * @param currencyCode Optional currency code (default: 'NGN')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currencyCode: string = 'NGN'): string {
  // Handle undefined or null values
  if (amount === undefined || amount === null) {
    return '-';
  }
  
  try {
    // Define currency symbols and formats for common currencies
    const currencySymbols: Record<string, string> = {
      'NGN': '₦',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
      'GHS': '₵',
      'KES': 'KSh',
      'ZAR': 'R',
      'UGX': 'USh',
      'RWF': 'RF',
      'TZS': 'TSh'
    };
    
    // Get the symbol or use currency code if symbol not found
    const symbol = currencySymbols[currencyCode] || currencyCode;
    
    // Format with appropriate decimal places based on currency
    // Currencies like JPY typically don't use decimal places
    const decimalPlaces = ['JPY', 'KRW', 'VND'].includes(currencyCode) ? 0 : 2;
    
    // Use Intl.NumberFormat if available
    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(amount);
    }
    
    // Fallback formatting
    const formattedAmount = amount.toFixed(decimalPlaces);
    const parts = formattedAmount.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${symbol}${parts.join('.')}`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    // Fallback to basic formatting
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a number with commas as thousands separators
 * @param value The number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  if (value === undefined || value === null) {
    return '-';
  }
  
  try {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } catch (error) {
    return String(value);
  }
}

/**
 * Format a date string as a readable date
 * @param dateString ISO date string
 * @param includeTime Whether to include the time
 * @returns Formatted date string
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    return dateString;
  }
}

/**
 * Truncate text with ellipsis if it exceeds the maximum length
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 30): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Format a percentage value
 * @param value Number to format as percentage
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (value === undefined || value === null) {
    return '-';
  }
  
  try {
    return `${value.toFixed(decimals)}%`;
  } catch (error) {
    return `${value}%`;
  }
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a phone number to a readable format
 * @param phoneNumber Raw phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Remove non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  } else {
    return phoneNumber; // Return original if format unknown
  }
}
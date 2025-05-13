// Country data and mappings

// Available countries
export const countries = [
  { code: "NG", name: "Nigeria" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "ZA", name: "South Africa" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "SL", name: "Sierra Leone" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "RU", name: "Russia" },
];

// Available currencies
export const currencies = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
];

// Map of country codes to their default currencies
export const countryToCurrency: Record<string, string> = {
  "NG": "NGN", // Nigeria -> Nigerian Naira
  "US": "USD", // United States -> US Dollar
  "GB": "GBP", // United Kingdom -> British Pound
  "CA": "CAD", // Canada -> Canadian Dollar
  "ZA": "ZAR", // South Africa -> South African Rand
  "GH": "GHS", // Ghana -> Ghanaian Cedi
  "KE": "KES", // Kenya -> Kenyan Shilling
  "SL": "SLL", // Sierra Leone -> Sierra Leonean Leone
  "DE": "EUR", // Germany -> Euro
  "FR": "EUR", // France -> Euro
  "JP": "JPY", // Japan -> Japanese Yen
  "AU": "AUD", // Australia -> Australian Dollar
  "IN": "INR", // India -> Indian Rupee
  "BR": "BRL", // Brazil -> Brazilian Real
  "RU": "RUB", // Russia -> Russian Ruble
};

// Get a user's recommended currencies based on their country
export function getRecommendedCurrencies(countryCode?: string): string[] {
  // Start with the platform default currency
  const recommended = ["NGN"]; // Nigeria is the home country of BBG
  
  // Add the user's local currency if different from default and we support it
  if (countryCode && countryToCurrency[countryCode] && countryToCurrency[countryCode] !== "NGN") {
    recommended.push(countryToCurrency[countryCode]);
  }
  
  // Add other popular international currencies if not already included
  const popularCurrencies = ["USD", "EUR", "GBP"];
  popularCurrencies.forEach(currency => {
    if (!recommended.includes(currency)) {
      recommended.push(currency);
    }
  });
  
  return recommended;
}

// Function to group currencies by relevance to user
export function groupCurrencies(currencies: Array<{code: string, name: string, symbol: string}>, countryCode?: string): {
  recommended: typeof currencies,
  others: typeof currencies
} {
  const recommendedCodes = getRecommendedCurrencies(countryCode);
  
  const recommended = currencies
    .filter(currency => recommendedCodes.includes(currency.code))
    // Sort to put the local currency first, then by the order of recommendedCodes
    .sort((a, b) => {
      return recommendedCodes.indexOf(a.code) - recommendedCodes.indexOf(b.code);
    });
  
  const others = currencies
    .filter(currency => !recommendedCodes.includes(currency.code))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  return { recommended, others };
}

// Determine if a currency is available on our platform
export function isCurrencySupported(currencyCode: string): boolean {
  return currencies.some(c => c.code === currencyCode);
}

// Get the primary currency for a user based on their country
export function getPrimaryCurrencyForCountry(countryCode?: string): string {
  // Default to NGN if country not specified or not in our mapping
  if (!countryCode || !countryToCurrency[countryCode]) {
    return "NGN";
  }
  
  // Return mapped currency if we support it
  const mappedCurrency = countryToCurrency[countryCode];
  return isCurrencySupported(mappedCurrency) ? mappedCurrency : "NGN";
}
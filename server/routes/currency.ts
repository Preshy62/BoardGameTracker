import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

// Schema for validating currency conversion request
const convertCurrencySchema = z.object({
  amount: z.number().positive(),
  fromCurrency: z.string().min(3).max(3),
  toCurrency: z.string().min(3).max(3)
});

// Schema for validating supported currencies request
const getCurrenciesSchema = z.object({
  baseCurrency: z.string().min(3).max(3).optional()
});

// Currency details type
export interface CurrencyDetails {
  symbol: string;
  name: string;
  decimalPlaces: number;
  isoCode: string;
}

// Available currencies with formatting options
export const AVAILABLE_CURRENCIES: Record<string, CurrencyDetails> = {
  'NGN': {
    symbol: '₦',
    name: 'Nigerian Naira',
    decimalPlaces: 2,
    isoCode: 'NGN'
  },
  'USD': {
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    isoCode: 'USD'
  },
  'GBP': {
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
    isoCode: 'GBP'
  },
  'EUR': {
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    isoCode: 'EUR'
  },
  'ZAR': {
    symbol: 'R',
    name: 'South African Rand',
    decimalPlaces: 2,
    isoCode: 'ZAR'
  },
  'GHS': {
    symbol: 'GH₵',
    name: 'Ghanaian Cedi',
    decimalPlaces: 2,
    isoCode: 'GHS'
  },
  'KES': {
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    decimalPlaces: 2,
    isoCode: 'KES'
  },
  'SLL': {
    symbol: 'Le',
    name: 'Sierra Leonean Leone',
    decimalPlaces: 2,
    isoCode: 'SLL'
  },
  'CAD': {
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimalPlaces: 2,
    isoCode: 'CAD'
  },
  'AUD': {
    symbol: 'A$',
    name: 'Australian Dollar',
    decimalPlaces: 2,
    isoCode: 'AUD'
  },
  'JPY': {
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
    isoCode: 'JPY'
  },
  'INR': {
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
    isoCode: 'INR'
  },
  'BRL': {
    symbol: 'R$',
    name: 'Brazilian Real',
    decimalPlaces: 2,
    isoCode: 'BRL'
  },
  'RUB': {
    symbol: '₽',
    name: 'Russian Ruble',
    decimalPlaces: 2,
    isoCode: 'RUB'
  }
};

const router = Router();

// Convert between currencies
router.post('/convert', async (req, res) => {
  try {
    // Validate request body
    const validationResult = convertCurrencySchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: validationResult.error.format()
      });
    }
    
    const { amount, fromCurrency, toCurrency } = validationResult.data;
    
    // Check if currencies are supported
    if (!AVAILABLE_CURRENCIES[fromCurrency]) {
      return res.status(400).json({
        success: false,
        message: `Currency ${fromCurrency} is not supported`
      });
    }
    
    if (!AVAILABLE_CURRENCIES[toCurrency]) {
      return res.status(400).json({
        success: false,
        message: `Currency ${toCurrency} is not supported`
      });
    }
    
    // Call storage method to convert currency
    const result = await storage.convertCurrency(amount, fromCurrency, toCurrency);
    
    // Format the result with both currencies' symbols
    const formattedResult = {
      originalAmount: {
        value: amount,
        formatted: `${AVAILABLE_CURRENCIES[fromCurrency].symbol}${amount.toFixed(AVAILABLE_CURRENCIES[fromCurrency].decimalPlaces)}`,
        currency: fromCurrency
      },
      convertedAmount: {
        value: result.amount,
        formatted: `${AVAILABLE_CURRENCIES[toCurrency].symbol}${result.amount.toFixed(AVAILABLE_CURRENCIES[toCurrency].decimalPlaces)}`,
        currency: toCurrency
      },
      exchangeRate: result.rate,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      ...formattedResult
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: `Error converting currency: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Get all supported currencies
router.get('/', async (req, res) => {
  try {
    // Validate query parameters
    const validationResult = getCurrenciesSchema.safeParse(req.query);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: validationResult.error.format()
      });
    }
    
    const { baseCurrency = 'NGN' } = validationResult.data;
    
    // Check if base currency is supported
    if (!AVAILABLE_CURRENCIES[baseCurrency]) {
      return res.status(400).json({
        success: false,
        message: `Base currency ${baseCurrency} is not supported`
      });
    }
    
    // Generate exchange rates for each currency
    const exchangeRates: Record<string, number> = {};
    
    for (const currency of Object.keys(AVAILABLE_CURRENCIES)) {
      if (currency === baseCurrency) {
        exchangeRates[currency] = 1; // 1:1 for same currency
      } else {
        // Get rate from base to target
        const { rate } = await storage.convertCurrency(1, baseCurrency, currency);
        exchangeRates[currency] = rate;
      }
    }
    
    // Build response with currency details and rates
    const currencies = Object.entries(AVAILABLE_CURRENCIES).map(([code, details]) => ({
      code,
      ...details,
      rate: exchangeRates[code]
    }));
    
    res.json({
      success: true,
      baseCurrency,
      currencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting currencies:', error);
    res.status(500).json({
      success: false,
      message: `Error getting currencies: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

// Get specific currency details
router.get('/:currencyCode', async (req, res) => {
  try {
    const { currencyCode } = req.params;
    
    // Check if currency is supported
    if (!AVAILABLE_CURRENCIES[currencyCode]) {
      return res.status(404).json({
        success: false,
        message: `Currency ${currencyCode} is not supported`
      });
    }
    
    // Get exchange rates to all other currencies
    const exchangeRates: Record<string, number> = {};
    
    for (const currency of Object.keys(AVAILABLE_CURRENCIES)) {
      if (currency === currencyCode) {
        exchangeRates[currency] = 1; // 1:1 for same currency
      } else {
        // Get rate from currency to target
        const { rate } = await storage.convertCurrency(1, currencyCode, currency);
        exchangeRates[currency] = rate;
      }
    }
    
    res.json({
      success: true,
      currency: {
        code: currencyCode,
        ...AVAILABLE_CURRENCIES[currencyCode],
        exchangeRates
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting currency details:', error);
    res.status(500).json({
      success: false,
      message: `Error getting currency details: ${error instanceof Error ? error.message : String(error)}`
    });
  }
});

export default router;
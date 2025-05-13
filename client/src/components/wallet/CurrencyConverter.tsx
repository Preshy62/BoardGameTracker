import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, ArrowRightLeft, Star, Home } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { groupCurrencies } from '@/lib/countryData';

// Currency details type from server
interface CurrencyDetails {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  isoCode: string;
  rate: number;
}

// Currency conversion response type
interface ConversionResponse {
  success: boolean;
  originalAmount: {
    value: number;
    formatted: string;
    currency: string;
  };
  convertedAmount: {
    value: number;
    formatted: string;
    currency: string;
  };
  exchangeRate: number;
  timestamp: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  walletBalance: number;
  preferredCurrency?: string;
  countryCode?: string;
  avatarInitials?: string;
  emailVerified: boolean | null;
  isActive: boolean;
  isAdmin: boolean;
  language?: string | null;
  createdAt?: Date | string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  emailNotifications?: boolean;
}

type CurrencyConverterProps = {
  user?: User;
};

const CurrencyConverter = ({ user }: CurrencyConverterProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>(user?.preferredCurrency || 'NGN');
  const [toCurrency, setToCurrency] = useState<string>(fromCurrency === 'USD' ? 'NGN' : 'USD');
  const [result, setResult] = useState<ConversionResponse | null>(null);
  
  // Fetch available currencies
  const { data: currencyData, isLoading: currenciesLoading, error: currenciesError } = useQuery({
    queryKey: ['/api/currencies'],
    queryFn: async () => {
      try {
        console.log('CurrencyConverter: Fetching currencies...');
        const response = await fetch('/api/currencies');
        if (!response.ok) {
          console.error(`CurrencyConverter: Failed to fetch currencies: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch currencies: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('CurrencyConverter: Currencies data received:', data);
        return data;
      } catch (error) {
        console.error('CurrencyConverter: Error fetching currencies:', error);
        throw new Error('Failed to fetch currencies. Please try again later.');
      }
    }
  });
  
  // Conversion mutation
  const convertMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest('POST', '/api/currencies/convert', {
          amount,
          fromCurrency,
          toCurrency
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `Failed to convert currency: ${response.status} ${response.statusText}`
          );
        }
        
        return response.json();
      } catch (error) {
        console.error('Currency conversion error:', error);
        throw error instanceof Error 
          ? error 
          : new Error('Failed to convert currency. Please try again later.');
      }
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Conversion Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    // Clear result when swapping
    setResult(null);
  };
  
  // Convert on button click
  const handleConvert = () => {
    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a positive amount to convert',
        variant: 'destructive'
      });
      return;
    }
    
    if (fromCurrency === toCurrency) {
      toast({
        title: 'Same Currency',
        description: 'Please select different currencies to convert',
        variant: 'destructive'
      });
      return;
    }
    
    convertMutation.mutate();
  };
  
  // Get currency symbol with better error handling
  const getCurrencySymbol = (code: string): string => {
    // Handle missing currency data
    if (!currencyData?.currencies || !Array.isArray(currencyData.currencies)) {
      // Default currency symbols for common currencies
      const defaultSymbols: Record<string, string> = {
        'NGN': '₦',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CNY': '¥',
        'AUD': 'A$',
        'CAD': 'C$',
        'INR': '₹'
      };
      return defaultSymbols[code] || code;
    }
    
    // Find the currency in the available currencies
    const currency = currencyData.currencies.find((c: CurrencyDetails) => c.code === code);
    
    // Return symbol if found, otherwise return code as fallback
    return currency?.symbol || code;
  };
  
  // Helper function to render currency groups
  const renderCurrencyGroups = () => {
    if (currenciesLoading) {
      return (
        <div className="flex items-center justify-center p-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Loading currencies...</span>
        </div>
      );
    }
    
    if (currenciesError) {
      return (
        <div className="p-2 text-destructive">
          Failed to load currencies
        </div>
      );
    }
    
    if (!currencyData?.currencies?.length) {
      return (
        <div className="p-2 text-muted-foreground">
          No currencies available
        </div>
      );
    }
    
    // Transform API data to format needed by groupCurrencies
    const formattedCurrencies = currencyData.currencies.map((c: CurrencyDetails) => ({
      code: c.code,
      name: c.name,
      symbol: c.symbol
    }));
    
    // Group currencies based on user's country
    const { recommended, others } = groupCurrencies(
      formattedCurrencies, 
      user?.countryCode
    );
    
    return (
      <>
        {/* Recommended currencies group */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            Recommended
          </SelectLabel>
          {recommended.map(currency => (
            <SelectItem key={currency.code} value={currency.code} className="pl-6">
              {/* Show home icon for user's local currency */}
              {user?.countryCode && currency.code === recommended[0].code && (
                <Home className="h-3 w-3 mr-1 inline-block text-blue-500" />
              )}
              {currency.symbol} {currency.name}
            </SelectItem>
          ))}
        </SelectGroup>
        
        {/* Other currencies group - only show if there are others */}
        {others.length > 0 && (
          <SelectGroup>
            <SelectLabel>Other Currencies</SelectLabel>
            {others.map(currency => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </>
    );
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Currency Converter
        </CardTitle>
        <CardDescription>
          Convert between different currencies using real-time exchange rates
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  {getCurrencySymbol(fromCurrency)}
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
          
          {/* Currency Selection */}
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
            {/* From Currency */}
            <div className="space-y-2">
              <Label htmlFor="fromCurrency">From</Label>
              <Select 
                value={fromCurrency} 
                onValueChange={setFromCurrency}
                disabled={currenciesLoading}
              >
                <SelectTrigger id="fromCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {renderCurrencyGroups()}
                </SelectContent>
              </Select>
            </div>
            
            {/* Swap Button */}
            <Button 
              variant="outline" 
              size="icon" 
              className="mt-8"
              onClick={handleSwap}
              disabled={convertMutation.isPending}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            {/* To Currency */}
            <div className="space-y-2">
              <Label htmlFor="toCurrency">To</Label>
              <Select 
                value={toCurrency} 
                onValueChange={setToCurrency}
                disabled={currenciesLoading}
              >
                <SelectTrigger id="toCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {renderCurrencyGroups()}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Conversion Result */}
          <div className="mt-4 p-3 border rounded-md bg-muted/50 min-h-[90px] flex flex-col justify-center">
            {convertMutation.isPending ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Converting...</span>
              </div>
            ) : result ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {result.originalAmount.formatted} = {result.convertedAmount.formatted}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Exchange rate: 1 {result.originalAmount.currency} = {result.exchangeRate.toFixed(6)} {result.convertedAmount.currency}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last updated: {new Date(result.timestamp).toLocaleString()}
                </p>
              </>
            ) : (
              <div className="text-center text-muted-foreground text-sm">
                Enter an amount and select currencies to convert
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleConvert}
          disabled={convertMutation.isPending || currenciesLoading}
        >
          {convertMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            'Convert'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CurrencyConverter;
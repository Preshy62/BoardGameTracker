import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, Home, Star } from 'lucide-react';
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

const CurrencyPreference = ({ user }: { user: User }) => {
  const { toast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    user?.preferredCurrency || 'NGN'
  );

  // Fetch available currencies with improved error handling
  const { data: currencyData, isLoading: currenciesLoading, error: currenciesError } = useQuery({
    queryKey: ['/api/currencies'],
    queryFn: async () => {
      try {
        console.log('Fetching currencies...');
        const response = await fetch('/api/currencies');
        if (!response.ok) {
          throw new Error(`Failed to fetch currencies: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Currencies data received:', data);
        return data;
      } catch (error) {
        console.error('Error fetching currencies:', error);
        throw new Error('Failed to fetch currencies. Please try again later.');
      }
    }
  });

  // Update preferred currency mutation with improved error handling
  const updateCurrencyMutation = useMutation({
    mutationFn: async (currency: string) => {
      try {
        const response = await apiRequest('PATCH', '/api/user/preferences', {
          preferredCurrency: currency
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `Failed to update preferred currency: ${response.status} ${response.statusText}`
          );
        }

        return response.json();
      } catch (error) {
        console.error('Currency preference update error:', error);
        throw error instanceof Error 
          ? error 
          : new Error('Failed to update preferred currency. Please try again later.');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Preference Updated',
        description: 'Your preferred currency has been updated',
        variant: 'default'
      });
      
      // Invalidate user data cache to reflect the changes
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Handle currency change
  const handleSaveCurrency = () => {
    // Safe comparison with fallback for user.preferredCurrency 
    // in case it's undefined
    const currentPreferredCurrency = user?.preferredCurrency || 'NGN';
    
    if (selectedCurrency === currentPreferredCurrency) {
      toast({
        title: 'No Changes',
        description: 'The selected currency is already your preferred currency',
        variant: 'default'
      });
      return;
    }

    updateCurrencyMutation.mutate(selectedCurrency);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Currency Preference
        </CardTitle>
        <CardDescription>
          Set your preferred currency for transactions and display
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferredCurrency">Preferred Currency</Label>
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
              disabled={currenciesLoading}
            >
              <SelectTrigger id="preferredCurrency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currenciesLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading currencies...</span>
                  </div>
                ) : currenciesError ? (
                  <div className="p-2 text-destructive">
                    Failed to load currencies
                  </div>
                ) : !currencyData?.currencies?.length ? (
                  <div className="p-2 text-muted-foreground">
                    No currencies available
                  </div>
                ) : (
                  <>
                    {/* Group currencies by relevance to user's country */}
                    {(() => {
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
                    })()}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Only show help text when user is actually changing their preference */}
          {(user?.preferredCurrency && selectedCurrency !== user.preferredCurrency) && (
            <p className="text-sm text-muted-foreground">
              Changing your preferred currency will affect how amounts are displayed in your wallet and game interfaces.
            </p>
          )}
          
          {/* Show guidance for new users who haven't set a preference yet */}
          {!user?.preferredCurrency && (
            <p className="text-sm text-muted-foreground">
              Set your preferred currency to customize how amounts are displayed throughout the application.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSaveCurrency}
          disabled={
            Boolean(
              updateCurrencyMutation.isPending || 
              currenciesLoading || 
              (!user?.preferredCurrency && selectedCurrency === 'NGN') ||
              (user?.preferredCurrency && selectedCurrency === user.preferredCurrency)
            )
          }
          className="w-full"
        >
          {updateCurrencyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : user?.preferredCurrency ? (
            'Update Preference'
          ) : (
            'Set Preference'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CurrencyPreference;
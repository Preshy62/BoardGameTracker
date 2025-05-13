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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

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
  preferredCurrency: string;
  countryCode: string;
  avatarInitials: string;
  emailVerified: boolean;
  isAdmin: boolean;
}

const CurrencyPreference = ({ user }: { user: User }) => {
  const { toast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    user?.preferredCurrency || 'NGN'
  );

  // Fetch available currencies
  const { data: currencyData, isLoading: currenciesLoading } = useQuery({
    queryKey: ['/api/currencies'],
    queryFn: async () => {
      const response = await fetch('/api/currencies');
      if (!response.ok) {
        throw new Error('Failed to fetch currencies');
      }
      return response.json();
    }
  });

  // Update preferred currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: async (currency: string) => {
      const response = await apiRequest('PATCH', '/api/user/preferences', {
        preferredCurrency: currency
      });

      if (!response.ok) {
        throw new Error('Failed to update preferred currency');
      }

      return response.json();
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
    if (selectedCurrency === user?.preferredCurrency) {
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
                {currencyData?.currencies?.map((currency: CurrencyDetails) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCurrency !== user?.preferredCurrency && (
            <p className="text-sm text-muted-foreground">
              Changing your preferred currency will affect how amounts are displayed in your wallet and game interfaces.
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSaveCurrency}
          disabled={
            updateCurrencyMutation.isPending || 
            currenciesLoading || 
            selectedCurrency === user?.preferredCurrency
          }
          className="w-full"
        >
          {updateCurrencyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preference'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CurrencyPreference;
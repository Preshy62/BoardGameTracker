import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Building, Info, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Bank {
  id: number;
  name: string;
  code: string;
}

interface AccountDetails {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

interface BankAccountFormProps {
  onAccountVerified: (accountDetails: AccountDetails) => void;
}

export function BankAccountForm({ onAccountVerified }: BankAccountFormProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [verifiedAccount, setVerifiedAccount] = useState<AccountDetails | null>(null);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  // Fetch banks on component mount
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsLoadingBanks(true);
        const response = await apiRequest('GET', '/api/payment/banks');
        const data = await response.json();
        
        if (data.success && data.banks) {
          setBanks(data.banks);
        } else {
          toast({
            title: 'Error',
            description: data.message || 'Failed to load bank list',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not load bank list. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingBanks(false);
      }
    };

    fetchBanks();
  }, [toast]);

  const handleVerifyAccount = async () => {
    if (!selectedBank) {
      toast({
        title: 'Bank Required',
        description: 'Please select a bank',
        variant: 'destructive',
      });
      return;
    }

    if (!accountNumber || accountNumber.length < 10) {
      toast({
        title: 'Invalid Account Number',
        description: 'Please enter a valid account number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsVerifying(true);
      const response = await apiRequest('POST', '/api/payment/verify-account', {
        bankCode: selectedBank,
        accountNumber,
      });

      const data = await response.json();

      if (data.success && data.accountName) {
        const accountDetails = {
          accountNumber,
          accountName: data.accountName,
          bankCode: selectedBank,
          bankName: banks.find((bank) => bank.code === selectedBank)?.name || '',
        };

        setVerifiedAccount(accountDetails);
        onAccountVerified(accountDetails);

        toast({
          title: 'Account Verified',
          description: `Account name: ${data.accountName}`,
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: data.message || 'Could not verify account details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'An error occurred while verifying the account',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bank">Bank</Label>
        <Select
          value={selectedBank}
          onValueChange={(value) => {
            setSelectedBank(value);
            setVerifiedAccount(null);
          }}
          disabled={isLoadingBanks}
        >
          <SelectTrigger id="bank" className="w-full">
            <SelectValue placeholder={isLoadingBanks ? "Loading banks..." : "Select bank"} />
          </SelectTrigger>
          <SelectContent>
            {banks.map((bank) => (
              <SelectItem key={bank.code} value={bank.code}>
                {bank.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-number">Account Number</Label>
        <Input
          id="account-number"
          type="text"
          placeholder="Enter 10-digit account number"
          value={accountNumber}
          onChange={(e) => {
            // Only allow numbers
            const value = e.target.value.replace(/\D/g, '');
            // Limit to 10 digits (Nigeria bank account numbers)
            if (value.length <= 10) {
              setAccountNumber(value);
              setVerifiedAccount(null); // Clear verification when account changes
            }
          }}
          disabled={!selectedBank}
        />
      </div>

      {!verifiedAccount && accountNumber && selectedBank && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleVerifyAccount}
          disabled={isVerifying || accountNumber.length < 10}
        >
          {isVerifying ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Info className="h-4 w-4 mr-2" />
          )}
          Verify Account
        </Button>
      )}

      {verifiedAccount && (
        <div className="bg-green-50 p-3 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Account Verified</p>
              <p className="text-sm text-green-700">{verifiedAccount.accountName}</p>
              <p className="text-xs text-green-600 mt-1">
                {verifiedAccount.bankName} - {verifiedAccount.accountNumber}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
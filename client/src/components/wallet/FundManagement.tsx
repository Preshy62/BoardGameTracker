import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { PaystackButton, BankAccountForm } from "@/components/payment";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  Info, 
  Wallet as WalletIcon,
  RefreshCw,
  Banknote,
  ChevronRight,
  AlertCircle,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FundManagementProps {
  user: User;
}

interface Bank {
  id: number;
  name: string;
  code: string;
}

interface AccountVerification {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
}

export default function FundManagement({ user }: FundManagementProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankList, setBankList] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [verifiedAccount, setVerifiedAccount] = useState<AccountVerification | null>(null);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Load bank list when withdraw tab is selected
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoadingBanks(true);
        const response = await apiRequest('GET', '/api/payment/banks');
        const data = await response.json();
        if (data.success && data.banks) {
          setBankList(data.banks);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        toast({
          title: "Error",
          description: "Could not load bank list. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingBanks(false);
      }
    };
    
    fetchBanks();
  }, [toast]);

  // Account verification mutation
  const verifyAccountMutation = useMutation({
    mutationFn: async ({ bankCode, accountNumber }: { bankCode: string, accountNumber: string }) => {
      const response = await apiRequest('POST', '/api/payment/verify-account', { 
        bankCode, 
        accountNumber 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.accountName) {
        setVerifiedAccount({
          accountNumber,
          accountName: data.accountName,
          bankCode: selectedBank,
          bankName: bankList.find(bank => bank.code === selectedBank)?.name || ''
        });
        toast({
          title: "Account Verified",
          description: `Account name: ${data.accountName}`,
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Could not verify account details",
          variant: "destructive",
        });
        setVerifiedAccount(null);
      }
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Could not verify account details",
        variant: "destructive",
      });
      setVerifiedAccount(null);
    }
  });

  // Paystack deposit mutation
  const paystackDepositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/transactions/deposit', { 
        amount,
        usePaystack: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = data.authorizationUrl;
      } else {
        // Handle fallback to quick deposit
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        setDepositAmount("");
        toast({
          title: "Deposit Successful",
          description: `${formatCurrency(parseFloat(depositAmount))} has been added to your wallet.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Standard deposit mutation (quick deposit)
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/transactions/deposit', { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setDepositAmount("");
      toast({
        title: "Deposit Successful",
        description: `${formatCurrency(parseFloat(depositAmount))} has been added to your wallet.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Demo deposit mutation (for testing)
  const demoDepositMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/transactions/demo-deposit', {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Demo Funds Added",
        description: `${formatCurrency(100000)} has been added to your wallet for testing.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Demo Deposit Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Paystack withdrawal mutation
  const paystackWithdrawMutation = useMutation({
    mutationFn: async ({ amount, bankCode, accountNumber, accountName }: {
      amount: number;
      bankCode: string;
      accountNumber: string;
      accountName: string;
    }) => {
      const response = await apiRequest('POST', '/api/transactions/withdraw', { 
        amount,
        bankCode,
        accountNumber,
        accountName,
        usePaystack: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setWithdrawAmount("");
      setVerifiedAccount(null);
      setSelectedBank("");
      setAccountNumber("");
      
      toast({
        title: "Withdrawal Initiated",
        description: data.message || `${formatCurrency(parseFloat(withdrawAmount))} withdrawal has been initiated and will be processed shortly.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Standard withdraw mutation (quick withdrawal for demo)
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/transactions/withdraw', { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setWithdrawAmount("");
      toast({
        title: "Withdrawal Successful",
        description: `${formatCurrency(parseFloat(withdrawAmount))} has been withdrawn from your wallet.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Handler for verifying bank account
  const handleVerifyAccount = () => {
    if (!selectedBank) {
      toast({
        title: "Bank Required",
        description: "Please select a bank",
        variant: "destructive",
      });
      return;
    }
    
    if (!accountNumber || accountNumber.length < 10) {
      toast({
        title: "Invalid Account Number",
        description: "Please enter a valid account number",
        variant: "destructive",
      });
      return;
    }
    
    setVerifyingAccount(true);
    verifyAccountMutation.mutate({ 
      bankCode: selectedBank, 
      accountNumber 
    });
  };

  const handleQuickDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
        variant: "destructive",
      });
      return;
    }
    
    depositMutation.mutate(amount);
  };
  
  const handlePaystackDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
        variant: "destructive",
      });
      return;
    }
    
    // If user doesn't have an email, they need to update their profile
    if (!user.email) {
      toast({
        title: "Email Required",
        description: "Please update your profile with an email address to make Paystack payments",
        variant: "destructive",
      });
      navigate('/profile');
      return;
    }
    
    paystackDepositMutation.mutate(amount);
  };

  const handleQuickWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }
    
    if (user && amount > user.walletBalance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough funds in your wallet",
        variant: "destructive",
      });
      return;
    }
    
    withdrawMutation.mutate(amount);
  };
  
  const handlePaystackWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }
    
    if (user && amount > user.walletBalance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough funds in your wallet",
        variant: "destructive",
      });
      return;
    }
    
    if (!verifiedAccount) {
      toast({
        title: "Bank Account Required",
        description: "Please verify your bank account details first",
        variant: "destructive",
      });
      return;
    }
    
    paystackWithdrawMutation.mutate({
      amount,
      bankCode: verifiedAccount.bankCode,
      accountNumber: verifiedAccount.accountNumber,
      accountName: verifiedAccount.accountName
    });
  };
  
  // Predefined deposit amounts - Enhanced with more options
  const quickDepositAmounts = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 200000];
  
  // Quick withdrawal amounts based on user's balance
  const quickWithdrawAmounts = [1000, 5000, 10000, 25000, 50000].filter(amount => amount <= user.walletBalance);
  
  // Helper to set predefined amounts
  const setQuickDepositAmount = (amount: number) => {
    setDepositAmount(amount.toString());
  };
  
  const setQuickWithdrawAmount = (amount: number) => {
    setWithdrawAmount(amount.toString());
  };
  
  // Calculate maximum withdrawal amount (user's balance)
  const setMaxWithdrawAmount = () => {
    setWithdrawAmount(user.walletBalance.toString());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <WalletIcon className="h-5 w-5 mr-2 text-primary" />
          <span>Fund Management</span>
        </CardTitle>
        <CardDescription>
          Deposit or withdraw funds securely
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="deposit" className="flex items-center">
              <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center">
              <ArrowDownCircle className="h-4 w-4 mr-2 text-red-600" />
              Withdraw
            </TabsTrigger>
          </TabsList>
          
          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-4" data-testid="deposit-section">
            <div className="space-y-1.5">
              <Label htmlFor="deposit-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                <Input
                  id="deposit-amount"
                  type="text"
                  placeholder="Enter amount"
                  className="pl-8"
                  value={depositAmount}
                  onChange={(e) => {
                    // Allow only numbers and one decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                      setDepositAmount(value);
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Quick deposit amounts - Enhanced grid layout */}
            <div>
              <Label className="text-xs text-gray-500 mb-3 block">Quick Amounts</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {quickDepositAmounts.map(amount => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDepositAmount(amount)}
                    className={cn(
                      "text-xs sm:text-sm h-10 sm:h-9 font-medium transition-all duration-200",
                      "active:scale-95 touch-manipulation hover:bg-primary/5",
                      depositAmount === amount.toString() && "border-primary bg-primary/10 shadow-md text-primary"
                    )}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Deposit buttons */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              {/* Quick Deposit button removed as requested */}
              
              {user.email ? (
                <PaystackButton
                  amount={parseFloat(depositAmount) || 0}
                  email={user.email}
                  metadata={{ userId: user.id }}
                  onSuccess={(reference) => {
                    toast({
                      title: "Payment Initiated",
                      description: "Your payment is being processed. Your wallet will be updated shortly.",
                    });
                    // Clear the form
                    setDepositAmount("");
                  }}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white h-14 text-lg font-semibold 
                           shadow-lg hover:shadow-xl transition-all duration-200 active:scale-98 
                           touch-manipulation border-0"
                  disabled={paystackDepositMutation.isPending || !depositAmount || parseFloat(depositAmount) <= 0}
                >
                  <CreditCard className="h-5 w-5 mr-3" />
                  Pay with Paystack
                  <ChevronRight className="h-5 w-5 ml-3" />
                </PaystackButton>
              ) : (
                <Button 
                  onClick={() => navigate('/profile')}
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Profile to Pay
                </Button>
              )}
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start">
              <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>Pay with Paystack for real payment processing with cards, bank transfers, and mobile money in Nigeria and across Africa.</p>
            </div>
            
            {!user.email && (
              <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 flex items-start mt-2">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>An email address is required for Paystack payments. Please update your profile to add your email.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-4" data-testid="withdraw-section">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="withdraw-amount">Amount</Label>
                <button 
                  onClick={setMaxWithdrawAmount}
                  className="text-xs text-primary hover:underline"
                >
                  Use max balance
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₦</span>
                <Input
                  id="withdraw-amount"
                  type="text"
                  placeholder="Enter amount"
                  className="pl-8"
                  value={withdrawAmount}
                  onChange={(e) => {
                    // Allow only numbers and one decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                      setWithdrawAmount(value);
                    }
                  }}
                />
              </div>
              <p className="text-sm text-gray-500 flex items-center">
                <WalletIcon className="h-3.5 w-3.5 mr-1" />
                Available: {formatCurrency(user.walletBalance)}
              </p>
            </div>
            
            {/* Quick withdrawal amounts */}
            {quickWithdrawAmounts.length > 0 && (
              <div>
                <Label className="text-xs text-gray-500 mb-3 block">Quick Amounts</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {quickWithdrawAmounts.map(amount => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuickWithdrawAmount(amount)}
                      className={cn(
                        "text-xs sm:text-sm h-10 sm:h-9 font-medium transition-all duration-200",
                        "active:scale-95 touch-manipulation hover:bg-red-50",
                        withdrawAmount === amount.toString() && "border-red-500 bg-red-50 shadow-md text-red-700"
                      )}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bank Account Details */}
            <div className={`space-y-3 ${user.walletBalance <= 0 ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="border-t pt-3">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                  Bank Details
                </h3>
              </div>
              
              <BankAccountForm 
                onAccountVerified={(accountDetails) => {
                  setVerifiedAccount(accountDetails);
                }}
              />
            </div>
            
            {/* Withdraw buttons */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <Button 
                onClick={handleQuickWithdraw}
                disabled={withdrawMutation.isPending || user.walletBalance <= 0}
                className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
              >
                {withdrawMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                )}
                Quick Withdrawal
              </Button>
              
              <Button 
                onClick={handlePaystackWithdraw}
                disabled={
                  paystackWithdrawMutation.isPending || 
                  user.walletBalance <= 0 || 
                  !verifiedAccount
                }
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {paystackWithdrawMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Building className="h-4 w-4 mr-2" />
                )}
                Bank Transfer
              </Button>
            </div>
            
            {user.walletBalance <= 0 && (
              <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>You need to have funds in your wallet before you can make a withdrawal.</p>
              </div>
            )}
            
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start">
              <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>Choose Quick Withdrawal for simulated transfers or Bank Transfer for real bank transfers via Paystack to Nigerian bank accounts.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
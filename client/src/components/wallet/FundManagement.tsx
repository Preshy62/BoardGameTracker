import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  Info, 
  Wallet,
  RefreshCw,
  Banknote,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FundManagementProps {
  user: User;
}

export default function FundManagement({ user }: FundManagementProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Deposit mutation
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

  // Withdraw mutation
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

  const handleDeposit = () => {
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

  const handleWithdraw = () => {
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
  
  // Predefined deposit amounts
  const quickDepositAmounts = [1000, 5000, 10000, 50000];
  
  // Helper to set predefined amounts
  const setQuickDepositAmount = (amount: number) => {
    setDepositAmount(amount.toString());
  };
  
  // Calculate maximum withdrawal amount (user's balance)
  const setMaxWithdrawAmount = () => {
    setWithdrawAmount(user.walletBalance.toString());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-primary" />
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
          <TabsContent value="deposit" className="space-y-4">
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
            
            {/* Quick deposit amounts */}
            <div>
              <Label className="text-xs text-gray-500 mb-2 block">Quick Amounts</Label>
              <div className="grid grid-cols-4 gap-2">
                {quickDepositAmounts.map(amount => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDepositAmount(amount)}
                    className={cn(
                      "text-xs h-9",
                      depositAmount === amount.toString() && "border-primary bg-primary/10"
                    )}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Deposit buttons */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              <Button 
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
                className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
              >
                {depositMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Banknote className="h-4 w-4 mr-2" />
                )}
                Quick Deposit
              </Button>
              
              <Button 
                onClick={() => {
                  if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
                    toast({
                      title: "Invalid Amount",
                      description: "Please enter a valid amount to deposit",
                      variant: "destructive",
                    });
                    return;
                  }
                  navigate(`/checkout/${depositAmount}`);
                }}
                variant="default"
                className="bg-primary hover:bg-primary-dark text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay with Stripe
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Button 
                onClick={() => demoDepositMutation.mutate()}
                disabled={demoDepositMutation.isPending}
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50"
              >
                {demoDepositMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Add Demo Funds (₦100,000)
              </Button>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start">
              <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>Choose Quick Deposit for simulated payments, Pay with Stripe for real card processing, or Add Demo Funds for testing.</p>
            </div>
          </TabsContent>
          
          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-4">
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
                <Wallet className="h-3.5 w-3.5 mr-1" />
                Available: {formatCurrency(user.walletBalance)}
              </p>
            </div>
            
            <Button 
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending || user.walletBalance <= 0}
              className="w-full bg-primary hover:bg-primary-light text-white"
            >
              {withdrawMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 mr-2" />
              )}
              Withdraw Funds
            </Button>
            
            {user.walletBalance <= 0 && (
              <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p>You need to have funds in your wallet before you can make a withdrawal.</p>
              </div>
            )}
            
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start">
              <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>For this demo, withdrawals are simulated and no actual payment processing occurs.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
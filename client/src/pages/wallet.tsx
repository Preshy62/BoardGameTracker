import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { User, Transaction } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomBadge } from "@/components/ui/custom-badge";
import { ArrowUpCircle, ArrowDownCircle, CreditCard, Info } from "lucide-react";

export default function Wallet() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Fetch transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/transactions/deposit', { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Demo Funds Added",
        description: `${formatCurrency(10000)} has been added to your wallet for testing.`,
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
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
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

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-sans">Wallet</h1>
          <p className="text-gray-600">Manage your funds for Big Boys Game</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <Card className="lg:col-span-3">
            <CardHeader className="bg-primary text-white">
              <CardTitle>Current Balance</CardTitle>
              <CardDescription className="text-gray-300">
                Your available funds
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
              <h2 className="text-4xl font-bold text-primary">
                {formatCurrency(user.walletBalance)}
              </h2>
            </CardContent>
          </Card>
          
          {/* Deposit/Withdraw Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Fund Management</CardTitle>
              <CardDescription>
                Deposit or withdraw funds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="deposit" className="flex-1">Deposit</TabsTrigger>
                  <TabsTrigger value="withdraw" className="flex-1">Withdraw</TabsTrigger>
                </TabsList>
                
                <TabsContent value="deposit">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="deposit-amount">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">₦</span>
                        <Input
                          id="deposit-amount"
                          type="text"
                          placeholder="1,000"
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={handleDeposit}
                        disabled={depositMutation.isPending}
                        className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
                      >
                        {depositMutation.isPending ? (
                          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
                        ) : (
                          <ArrowUpCircle className="mr-2 h-5 w-5" />
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
                        className="bg-primary hover:bg-primary-dark text-white font-bold"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay with Stripe
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={() => demoDepositMutation.mutate()}
                      disabled={demoDepositMutation.isPending}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      {demoDepositMutation.isPending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <CreditCard className="mr-2 h-5 w-5" />
                      )}
                      Add Demo Funds (₦10,000)
                    </Button>

                    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start">
                      <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>Choose Quick Deposit for simulated payments, Pay with Stripe for real card processing, or Add Demo Funds for testing.</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="withdraw">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="withdraw-amount">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">₦</span>
                        <Input
                          id="withdraw-amount"
                          type="text"
                          placeholder="1,000"
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
                      <p className="text-sm text-gray-500 mt-1">
                        Available: {formatCurrency(user.walletBalance)}
                      </p>
                    </div>
                    
                    <Button 
                      onClick={handleWithdraw}
                      disabled={withdrawMutation.isPending}
                      className="w-full bg-primary hover:bg-primary-light text-white"
                    >
                      {withdrawMutation.isPending ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      ) : (
                        <ArrowDownCircle className="mr-2 h-5 w-5" />
                      )}
                      Withdraw Funds
                    </Button>
                    
                    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex items-start">
                      <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>For this demo, withdrawals are simulated and no actual payment processing occurs.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Transaction History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Recent activity in your wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isTransactionsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.type === 'deposit' ? (
                              <ArrowUpCircle className="h-4 w-4 text-success mr-2" />
                            ) : transaction.type === 'withdrawal' ? (
                              <ArrowDownCircle className="h-4 w-4 text-accent mr-2" />
                            ) : transaction.type === 'winnings' ? (
                              <CreditCard className="h-4 w-4 text-success mr-2" />
                            ) : (
                              <CreditCard className="h-4 w-4 text-primary mr-2" />
                            )}
                            <span className="capitalize">{transaction.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className={transaction.type === 'withdrawal' || transaction.type === 'stake' ? 'text-accent' : 'text-success'}>
                          {(transaction.type === 'withdrawal' || transaction.type === 'stake') ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <CustomBadge variant={transaction.status === 'completed' ? 'success' : 
                                      transaction.status === 'pending' ? 'outline' : 
                                      'destructive'}>
                            {transaction.status}
                          </CustomBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '-'} 
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString() : ''}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-500">No transactions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

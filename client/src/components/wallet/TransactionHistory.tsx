import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  CreditCard,
  DollarSign,
  Filter,
  Search,
  Trophy,
  XCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface TransactionHistoryProps {
  userId: number;
  showControls?: boolean;
  maxHeight?: string;
  className?: string;
}

type TransactionFilter = 'all' | 'deposit' | 'withdrawal' | 'winnings' | 'stake';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';

export default function TransactionHistory({
  userId,
  showControls = true,
  maxHeight,
  className
}: TransactionHistoryProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Fetch transactions for the user
  const { data: transactionData, isLoading, isError, refetch } = useQuery<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalWinnings: number;
    totalStakes: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
    failedTransactions: number;
    recentTransactions: Transaction[];
    allTransactions: Transaction[];
  }>({
    queryKey: [`/api/users/${userId}/transactions/summary`],
    enabled: !!userId
  });
  
  // Format currency for display
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };
  
  // Handle transaction verification
  const verifyTransaction = async (transactionId: number) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/verify`, {
        method: 'POST'
      });
      
      if (!res.ok) {
        throw new Error('Verification failed');
      }
      
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'Verification successful',
          description: data.message || 'Transaction verified and processed',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Verification failed',
          description: data.message || 'Could not verify transaction',
          variant: 'destructive'
        });
      }
      
      // Refresh transaction data
      refetch();
    } catch (error) {
      toast({
        title: 'Verification error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  // Get filtered transactions based on current filters
  const getFilteredTransactions = () => {
    if (!transactionData) return [];
    
    let transactions = transactionData.allTransactions;
    
    // Filter by type
    if (typeFilter !== 'all') {
      transactions = transactions.filter(t => t.type === typeFilter);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      transactions = transactions.filter(t => t.status === statusFilter);
    }
    
    // Filter by search query (match against description, amount, type, status)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      transactions = transactions.filter(t => 
        (t.description?.toLowerCase().includes(query)) ||
        t.amount.toString().includes(query) ||
        t.type.toLowerCase().includes(query) ||
        t.status.toLowerCase().includes(query) ||
        t.currency.toLowerCase().includes(query)
      );
    }
    
    return transactions;
  };
  
  // Get the icon for a transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDown className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUp className="h-4 w-4 text-orange-500" />;
      case 'winnings':
        return <Trophy className="h-4 w-4 text-amber-500" />;
      case 'stake':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };
  
  // Get badge variant based on transaction status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          View your recent transactions and payment history
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Control panel */}
        {showControls && (
          <div className="px-6 py-4 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select 
                  value={typeFilter} 
                  onValueChange={(value) => setTypeFilter(value as TransactionFilter)}
                >
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Type</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="winnings">Winnings</SelectItem>
                    <SelectItem value="stake">Stakes</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        
        <TabsContent value="all" className="px-0">
          <div className={cn("overflow-auto", maxHeight ? `max-h-[${maxHeight}]` : "")}>
            <Table>
              <TableCaption>
                {isLoading ? 'Loading transaction history...' : 
                 isError ? 'Error loading transactions' : 
                 'Your transaction history'}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-red-500">
                      Error loading transactions
                    </TableCell>
                  </TableRow>
                ) : getFilteredTransactions().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredTransactions().map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description || `${transaction.type} transaction`}
                      </TableCell>
                      <TableCell className={cn(
                        transaction.type === 'deposit' || transaction.type === 'winnings' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      )}>
                        {transaction.type === 'deposit' || transaction.type === 'winnings' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(transaction.status) as any} 
                          className="capitalize flex gap-1 items-center w-fit"
                        >
                          {getStatusIcon(transaction.status)}
                          <span>{transaction.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.createdAt ? (
                          <span title={new Date(transaction.createdAt).toLocaleString()}>
                            {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                          </span>
                        ) : (
                          'Unknown'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.status === 'pending' && transaction.type === 'deposit' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => verifyTransaction(transaction.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="summary">
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading summary...</div>
            ) : isError ? (
              <div className="text-center py-4 text-red-500">
                Error loading transaction summary
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Deposits</div>
                    <div className="text-2xl font-bold text-green-600">
                      ₦{transactionData?.totalDeposits.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                    <div className="text-2xl font-bold text-red-600">
                      ₦{transactionData?.totalWithdrawals.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Winnings</div>
                    <div className="text-2xl font-bold text-amber-600">
                      ₦{transactionData?.totalWinnings.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Stakes</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ₦{transactionData?.totalStakes.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Deposits</div>
                    <div className="text-xl font-bold text-orange-600">
                      ₦{transactionData?.pendingDeposits.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Withdrawals</div>
                    <div className="text-xl font-bold text-orange-600">
                      ₦{transactionData?.pendingWithdrawals.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Failed Transactions</div>
                    <div className="text-xl font-bold text-red-600">
                      {transactionData?.failedTransactions || '0'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Recent Transactions</h3>
                  {transactionData?.recentTransactions.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground">
                      No recent transactions
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactionData?.recentTransactions.slice(0, 5).map(transaction => (
                        <div key={transaction.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <div className="text-sm font-medium capitalize">{transaction.type}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.createdAt ? (
                                  formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })
                                ) : 'Unknown date'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm font-medium",
                              transaction.type === 'deposit' || transaction.type === 'winnings' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            )}>
                              {transaction.type === 'deposit' || transaction.type === 'winnings' ? '+' : '-'}
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </span>
                            
                            <Badge 
                              variant={getStatusBadgeVariant(transaction.status) as any}
                              className="capitalize"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="deposits">
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading deposits...</div>
            ) : isError ? (
              <div className="text-center py-4 text-red-500">
                Error loading deposits
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Deposits</div>
                    <div className="text-2xl font-bold text-green-600">
                      ₦{transactionData?.totalDeposits.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Deposits</div>
                    <div className="text-xl font-bold text-orange-600">
                      ₦{transactionData?.pendingDeposits.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionData?.allTransactions
                        .filter(t => t.type === 'deposit')
                        .map(transaction => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.description || 'Deposit transaction'}
                          </TableCell>
                          <TableCell className="text-green-600">
                            +{formatCurrency(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getStatusBadgeVariant(transaction.status) as any} 
                              className="capitalize flex gap-1 items-center w-fit"
                            >
                              {getStatusIcon(transaction.status)}
                              <span>{transaction.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.createdAt ? (
                              <span title={new Date(transaction.createdAt).toLocaleString()}>
                                {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                              </span>
                            ) : (
                              'Unknown'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => verifyTransaction(transaction.id)}
                              >
                                Verify
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {transactionData?.allTransactions.filter(t => t.type === 'deposit').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No deposit transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="withdrawals">
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">Loading withdrawals...</div>
            ) : isError ? (
              <div className="text-center py-4 text-red-500">
                Error loading withdrawals
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                    <div className="text-2xl font-bold text-red-600">
                      ₦{transactionData?.totalWithdrawals.toLocaleString() || '0'}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Withdrawals</div>
                    <div className="text-xl font-bold text-orange-600">
                      ₦{transactionData?.pendingWithdrawals.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionData?.allTransactions
                        .filter(t => t.type === 'withdrawal')
                        .map(transaction => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.description || 'Withdrawal transaction'}
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{formatCurrency(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={getStatusBadgeVariant(transaction.status) as any} 
                              className="capitalize flex gap-1 items-center w-fit"
                            >
                              {getStatusIcon(transaction.status)}
                              <span>{transaction.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.createdAt ? (
                              <span title={new Date(transaction.createdAt).toLocaleString()}>
                                {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                              </span>
                            ) : (
                              'Unknown'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {transactionData?.allTransactions.filter(t => t.type === 'withdrawal').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No withdrawal transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
        
        {showControls && (
          <div className="text-sm text-muted-foreground">
            {getFilteredTransactions().length} transactions found
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
import { useState, useEffect, useRef } from 'react';
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
  Calendar,
  Check,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Filter,
  Search,
  Trophy,
  X,
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
import { 
  format, 
  formatDistanceToNow, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isToday, 
  isThisWeek, 
  isThisMonth 
} from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface TransactionHistoryProps {
  userId: number;
  showControls?: boolean;
  maxHeight?: string;
  className?: string;
}

type TransactionFilter = 'all' | 'deposit' | 'withdrawal' | 'winnings' | 'stake' | 'refund';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'disputed';
type CurrencyFilter = 'all' | 'NGN' | 'USD' | 'EUR' | 'GBP' | 'CAD';

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
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
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
  
  // Function to build query params for filters
  const buildFilterQueryParams = () => {
    const params = new URLSearchParams();
    
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (currencyFilter !== 'all') params.append('currency', currencyFilter);
    if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);
    
    return params.toString();
  };
  
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
    
    // Filter by currency
    if (currencyFilter !== 'all') {
      transactions = transactions.filter(t => t.currency === currencyFilter);
    }
    
    // Filter by date range
    if (startDate) {
      transactions = transactions.filter(t => {
        if (!t.createdAt) return false;
        const transactionDate = new Date(t.createdAt.toString());
        return transactionDate >= startDate;
      });
    }
    
    if (endDate) {
      // Include the entire end date by setting time to 23:59:59
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      transactions = transactions.filter(t => {
        if (!t.createdAt) return false;
        const transactionDate = new Date(t.createdAt.toString());
        return transactionDate <= endOfDay;
      });
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
  
  // Function to export transactions to CSV
  const exportTransactions = async () => {
    if (!userId) return;
    
    try {
      setIsExporting(true);
      
      // Build query parameters for filtered export
      const queryParams = buildFilterQueryParams();
      const url = `/api/users/${userId}/transactions/export${queryParams ? `?${queryParams}` : ''}`;
      
      // Fetch CSV data
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }
      
      // Get the CSV data
      const csvData = await response.text();
      
      // Create a blob and download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set up download link
      link.href = downloadUrl;
      link.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'Export successful',
        description: 'Your transactions have been exported to CSV',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
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
      case 'refund':
        return <ArrowDown className="h-4 w-4 text-purple-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };
  
  // Add custom styling based on transaction status
  const getStatusStyle = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'disputed':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return '';
    }
  };
  
  // Get badge variant based on transaction status
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      case 'disputed':
        return 'outline';
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
      case 'disputed':
        return <AlertCircle className="h-3 w-3" />;
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
        
        {showControls && (
          <div className="px-6 py-4 space-y-4">
            {/* Quick Filter Bar */}
            <div className="flex flex-wrap gap-2 pb-2 border-b">
              <span className="text-sm text-gray-500 font-medium flex items-center">Quick Filters:</span>
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
                className="h-8 text-xs"
              >
                All
              </Button>
              <Button
                variant={typeFilter === 'deposit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('deposit')}
                className="h-8 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <ArrowDown className="h-3 w-3 mr-1" />
                Deposits
              </Button>
              <Button
                variant={typeFilter === 'withdrawal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('withdrawal')}
                className="h-8 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                Withdrawals
              </Button>
              <Button
                variant={typeFilter === 'winnings' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('winnings')}
                className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Trophy className="h-3 w-3 mr-1" />
                Winnings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
                className="h-8 text-xs text-gray-600"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            
            {/* Search and advanced filters */}
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
              
              <div className="flex gap-2 flex-wrap">
                <Select 
                  value={typeFilter} 
                  onValueChange={(value) => setTypeFilter(value as TransactionFilter)}
                >
                  <SelectTrigger className="w-[130px] bg-white">
                    <div className="flex items-center gap-2">
                      {typeFilter === 'all' ? (
                        <Filter className="h-4 w-4 text-gray-500" />
                      ) : typeFilter === 'deposit' ? (
                        <ArrowDown className="h-4 w-4 text-green-500" />
                      ) : typeFilter === 'withdrawal' ? (
                        <ArrowUp className="h-4 w-4 text-amber-500" />
                      ) : typeFilter === 'winnings' ? (
                        <Trophy className="h-4 w-4 text-blue-500" />
                      ) : typeFilter === 'stake' ? (
                        <CreditCard className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Filter className="h-4 w-4 text-gray-500" />
                      )}
                      <span className={typeFilter !== 'all' ? 'font-medium' : ''}>
                        {typeFilter === 'all' ? 'Type' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit" className="flex items-center">
                      <div className="flex items-center">
                        <ArrowDown className="h-4 w-4 mr-2 text-green-500" />
                        Deposits
                      </div>
                    </SelectItem>
                    <SelectItem value="withdrawal">
                      <div className="flex items-center">
                        <ArrowUp className="h-4 w-4 mr-2 text-amber-500" />
                        Withdrawals
                      </div>
                    </SelectItem>
                    <SelectItem value="winnings">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-blue-500" />
                        Winnings
                      </div>
                    </SelectItem>
                    <SelectItem value="stake">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                        Stakes
                      </div>
                    </SelectItem>
                    <SelectItem value="refund">
                      <div className="flex items-center">
                        <ArrowDown className="h-4 w-4 mr-2 text-gray-500" />
                        Refunds
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                  <SelectTrigger className="w-[130px] bg-white">
                    <div className="flex items-center gap-2">
                      {statusFilter === 'all' ? (
                        <Filter className="h-4 w-4 text-gray-500" />
                      ) : statusFilter === 'completed' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : statusFilter === 'pending' ? (
                        <Clock className="h-4 w-4 text-amber-500" />
                      ) : statusFilter === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-purple-500" />
                      )}
                      <span className={statusFilter !== 'all' ? 'font-medium' : ''}>
                        {statusFilter === 'all' ? 'Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        Failed
                      </div>
                    </SelectItem>
                    <SelectItem value="disputed">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-purple-500" />
                        Disputed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={currencyFilter} 
                  onValueChange={(value) => setCurrencyFilter(value as CurrencyFilter)}
                >
                  <SelectTrigger className="w-[130px] bg-white">
                    <div className="flex items-center gap-2">
                      {currencyFilter === 'all' ? (
                        <DollarSign className="h-4 w-4 text-gray-500" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-blue-500" />
                      )}
                      <span className={currencyFilter !== 'all' ? 'font-medium' : ''}>
                        {currencyFilter === 'all' ? 'Currency' : currencyFilter}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    <SelectItem value="NGN">
                      <div className="flex items-center">
                        <span className="inline-block w-4 mr-2 text-center text-green-600 font-bold">₦</span>
                        Naira (NGN)
                      </div>
                    </SelectItem>
                    <SelectItem value="USD">
                      <div className="flex items-center">
                        <span className="inline-block w-4 mr-2 text-center text-green-600 font-bold">$</span>
                        US Dollar
                      </div>
                    </SelectItem>
                    <SelectItem value="EUR">
                      <div className="flex items-center">
                        <span className="inline-block w-4 mr-2 text-center text-blue-600 font-bold">€</span>
                        Euro
                      </div>
                    </SelectItem>
                    <SelectItem value="GBP">
                      <div className="flex items-center">
                        <span className="inline-block w-4 mr-2 text-center text-purple-600 font-bold">£</span>
                        Pound
                      </div>
                    </SelectItem>
                    <SelectItem value="CAD">
                      <div className="flex items-center">
                        <span className="inline-block w-4 mr-2 text-center text-red-600 font-bold">$</span>
                        CAD
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Quick date filters and active filters display */}
            <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
              <div className="flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`bg-white ${startDate || endDate ? 'border-blue-200 text-blue-600' : ''}`}
                      size="sm"
                    >
                      <Calendar className={`mr-2 h-4 w-4 ${startDate || endDate ? 'text-blue-500' : ''}`} />
                      <span>Custom Range</span>
                      {(startDate || endDate) && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 h-5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        >
                          Active
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <div className="p-3">
                      <h4 className="font-medium mb-2">Select Date Range</h4>
                      <div className="flex gap-4 flex-col sm:flex-row">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">End Date</p>
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => startDate ? date < startDate : false}
                            initialFocus
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t p-3">
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setStartDate(undefined);
                          setEndDate(undefined);
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        size="sm"
                      >
                        Apply
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`bg-white ${isToday(startDate || new Date()) && !endDate ? 'border-blue-200 text-blue-600' : ''}`}
                  onClick={() => {
                    const today = new Date();
                    setStartDate(today);
                    setEndDate(undefined);
                  }}
                >
                  Today
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-white"
                  onClick={() => {
                    const today = new Date();
                    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
                    const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
                    setStartDate(startOfWeekDate);
                    setEndDate(endOfWeekDate);
                  }}
                >
                  This Week
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm" 
                  className="bg-white"
                  onClick={() => {
                    const today = new Date();
                    const startOfMonthDate = startOfMonth(today);
                    const endOfMonthDate = endOfMonth(today);
                    setStartDate(startOfMonthDate);
                    setEndDate(endOfMonthDate);
                  }}
                >
                  This Month
                </Button>
              </div>
              
              {/* Clear date filters button */}
              {(startDate || endDate) && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Dates
                </Button>
              )}
            </div>
            
            {/* Active filters display */}
            {(typeFilter !== 'all' || statusFilter !== 'all' || currencyFilter !== 'all' || startDate || endDate || searchQuery) && (
              <div className="w-full bg-slate-50 p-2 mt-3 mb-2 rounded-md flex flex-wrap gap-2 items-center border border-slate-100">
                <span className="text-xs text-slate-500 mr-1">Active filters:</span>
                
                {typeFilter !== 'all' && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white">
                    <span className="font-normal">Type:</span> {typeFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-slate-100" 
                      onClick={() => setTypeFilter('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white">
                    <span className="font-normal">Status:</span> {statusFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-slate-100" 
                      onClick={() => setStatusFilter('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {currencyFilter !== 'all' && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white">
                    <span className="font-normal">Currency:</span> {currencyFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-slate-100" 
                      onClick={() => setCurrencyFilter('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {(startDate || endDate) && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="font-normal">Date:</span>
                    {startDate && endDate 
                      ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
                      : startDate 
                        ? `From ${format(startDate, 'MMM d')}`
                        : `Until ${format(endDate!, 'MMM d')}`
                    }
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-slate-100" 
                      onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {searchQuery && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white">
                    <Search className="h-3 w-3 mr-1" />
                    <span className="font-normal">Search:</span> 
                    <span className="max-w-[100px] truncate">{searchQuery}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-slate-100" 
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto text-xs h-7 hover:bg-slate-200"
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setCurrencyFilter('all');
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setSearchQuery('');
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
            
            <div className="flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="gap-2" 
                      onClick={exportTransactions}
                      disabled={isExporting || !getFilteredTransactions().length}
                    >
                      <Download className="h-4 w-4" />
                      {isExporting ? 'Exporting...' : 'Export CSV'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export filtered transactions to CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  getFilteredTransactions().map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type)}
                          <span className="capitalize">{transaction.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.description || `${transaction.type} transaction`}
                      </TableCell>
                      <TableCell>
                        <span className={transaction.type === 'deposit' || transaction.type === 'winnings' || transaction.type === 'refund' 
                          ? 'text-green-600' 
                          : transaction.type === 'withdrawal' || transaction.type === 'stake'
                          ? 'text-red-600' 
                          : ''
                        }>
                          {transaction.type === 'deposit' || transaction.type === 'winnings' || transaction.type === 'refund' ? '+' : ''}
                          {transaction.type === 'withdrawal' || transaction.type === 'stake' ? '-' : ''}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(transaction.status)}
                          className={cn("inline-flex items-center gap-1", getStatusStyle(transaction.status))}
                        >
                          {getStatusIcon(transaction.status)}
                          <span className="capitalize">{transaction.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default">
                                {transaction.createdAt ? formatDistanceToNow(new Date(transaction.createdAt.toString()), { addSuffix: true }) : 'Unknown'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {transaction.createdAt ? format(new Date(transaction.createdAt.toString()), 'PPpp') : 'Unknown date'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.type === 'deposit' && transaction.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => verifyTransaction(transaction.id!)}
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
        
        <TabsContent value="summary" className="p-6">
          <CardContent className="space-y-6 p-0">
            {isLoading ? (
              <div className="text-center py-4">Loading summary...</div>
            ) : isError ? (
              <div className="text-center py-4 text-red-500">
                Error loading transaction summary
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Deposits</div>
                    <div className="text-2xl font-bold text-green-600">
                      ₦{transactionData?.totalDeposits.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                    <div className="text-2xl font-bold text-red-600">
                      ₦{transactionData?.totalWithdrawals.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Winnings</div>
                    <div className="text-2xl font-bold text-amber-600">
                      ₦{transactionData?.totalWinnings.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Stakes</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ₦{transactionData?.totalStakes.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Deposits</div>
                    <div className="text-2xl font-bold text-amber-600">
                      ₦{transactionData?.pendingDeposits.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Withdrawals</div>
                    <div className="text-2xl font-bold text-amber-600">
                      ₦{transactionData?.pendingWithdrawals.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Failed Transactions</div>
                    <div className="text-2xl font-bold text-red-600">
                      ₦{transactionData?.failedTransactions.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
                  <div className="space-y-2">
                    {transactionData?.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-white p-2">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium capitalize">{transaction.type}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.createdAt ? format(new Date(transaction.createdAt.toString()), 'PPp') : 'Unknown date'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${
                            transaction.type === 'deposit' || transaction.type === 'winnings' || transaction.type === 'refund' 
                              ? 'text-green-600' 
                              : transaction.type === 'withdrawal' || transaction.type === 'stake'
                              ? 'text-red-600' 
                              : ''
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'winnings' || transaction.type === 'refund' ? '+' : ''}
                            {transaction.type === 'withdrawal' || transaction.type === 'stake' ? '-' : ''}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                          <Badge variant={getStatusBadgeVariant(transaction.status)} className={cn("text-xs", getStatusStyle(transaction.status))}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Deposits</div>
                    <div className="text-2xl font-bold text-amber-600">
                      ₦{transactionData?.pendingDeposits.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionData?.allTransactions.filter(t => t.type === 'deposit').map(transaction => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell>
                            {transaction.createdAt ? format(new Date(transaction.createdAt.toString()), 'PP') : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => verifyTransaction(transaction.id!)}
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
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Pending Withdrawals</div>
                    <div className="text-2xl font-bold text-amber-600">
                      ₦{transactionData?.pendingWithdrawals.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionData?.allTransactions.filter(t => t.type === 'withdrawal').map(transaction => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium text-red-600">
                            -{formatCurrency(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell>
                            {transaction.createdAt ? format(new Date(transaction.createdAt.toString()), 'PP') : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.description || 'Withdrawal request'}</TableCell>
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
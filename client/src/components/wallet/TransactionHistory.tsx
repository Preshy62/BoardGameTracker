import { useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { CustomBadge } from "@/components/ui/custom-badge";
import { Transaction } from "@shared/schema";
import { 
  formatCurrency, 
  formatDateTime, 
  getTransactionTypeColor 
} from "@/lib/utils";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trophy, 
  CreditCard,
  Search,
  Filter,
  Calendar,
  SlidersHorizontal,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TransactionHistoryProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
}

export default function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions
      .filter(transaction => {
        // Filter by search term
        const matchesSearch = 
          transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.amount.toString().includes(searchTerm);
        
        // Filter by type
        const matchesType = typeFilter === "all" || transaction.type === typeFilter;
        
        // Filter by status
        const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
        
        return matchesSearch && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        // Sort by date
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [transactions, searchTerm, typeFilter, statusFilter, sortOrder]);
  
  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowUpCircle className="h-4 w-4 text-green-600" />;
      case "withdrawal":
        return <ArrowDownCircle className="h-4 w-4 text-red-600" />;
      case "winnings":
        return <Trophy className="h-4 w-4 text-purple-600" />;
      case "stake":
        return <CreditCard className="h-4 w-4 text-orange-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-primary" />;
    }
  };
  
  // Calculate totals for each transaction type
  const transactionSummary = useMemo(() => {
    if (!transactions) return { deposits: 0, withdrawals: 0, winnings: 0, stakes: 0 };
    
    return transactions.reduce((acc, transaction) => {
      if (transaction.status !== 'completed') return acc;
      
      switch (transaction.type) {
        case "deposit":
          acc.deposits += transaction.amount;
          break;
        case "withdrawal":
          acc.withdrawals += transaction.amount;
          break;
        case "winnings":
          acc.winnings += transaction.amount;
          break;
        case "stake":
          acc.stakes += transaction.amount;
          break;
      }
      
      return acc;
    }, { deposits: 0, withdrawals: 0, winnings: 0, stakes: 0 });
  }, [transactions]);
  
  // Calculate net balance from transactions
  const netBalance = useMemo(() => {
    return (
      transactionSummary.deposits + 
      transactionSummary.winnings - 
      transactionSummary.withdrawals - 
      transactionSummary.stakes
    );
  }, [transactionSummary]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transaction History</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center text-xs"
          >
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {sortOrder === "desc" ? "Newest first" : "Oldest first"}
          </Button>
        </CardTitle>
        <CardDescription>
          Track and filter your financial activity
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Transaction Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-700 font-medium">Total Deposits</div>
            <div className="text-lg font-bold text-green-800">{formatCurrency(transactionSummary.deposits)}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-xs text-red-700 font-medium">Total Withdrawals</div>
            <div className="text-lg font-bold text-red-800">{formatCurrency(transactionSummary.withdrawals)}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-xs text-purple-700 font-medium">Total Winnings</div>
            <div className="text-lg font-bold text-purple-800">{formatCurrency(transactionSummary.winnings)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-xs text-orange-700 font-medium">Total Stakes</div>
            <div className="text-lg font-bold text-orange-800">{formatCurrency(transactionSummary.stakes)}</div>
          </div>
        </div>
      
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="winnings">Winnings</SelectItem>
                <SelectItem value="stake">Stakes</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
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
        
        {/* Table */}
        {filteredTransactions.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Reference</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.type)}
                        <span className="ml-2 capitalize">{transaction.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn(
                      "font-medium",
                      transaction.type === "withdrawal" || transaction.type === "stake"
                        ? "text-red-600"
                        : "text-green-600"
                    )}>
                      {transaction.type === "withdrawal" || transaction.type === "stake" ? "-" : "+"}
                      {formatCurrency(transaction.amount, transaction.currency || '₦')}
                    </TableCell>
                    <TableCell>
                      <CustomBadge variant={
                        transaction.status === "completed"
                          ? "success"
                          : transaction.status === "pending"
                            ? "outline"
                            : "destructive"
                      }>
                        {transaction.status}
                      </CustomBadge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-xs">{transaction.reference.substring(0, 10)}...</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {transaction.createdAt ? formatDateTime(transaction.createdAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-md bg-gray-50">
            <p className="text-gray-500 mb-2">No transactions found matching your filters.</p>
            <p className="text-sm text-gray-400">Try adjusting your search criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
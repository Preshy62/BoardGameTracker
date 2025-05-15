import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, CreditCard, Eye, Filter, RefreshCcw, Search, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Transaction = {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  reference: string;
};

export function AllTransactions() {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const pageSize = 10;
  
  // Fetch all transactions
  const { data, isLoading, error, refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    queryFn: () => apiRequest("GET", "/api/admin/transactions").then(res => res.json()),
  });
  
  const handleViewTransaction = (id: number) => {
    console.log(`Navigating to transaction ${id}`);
    const targetUrl = `/admin/transactions/${id}`;
    console.log(`Target URL: ${targetUrl}`);
    navigate(targetUrl);
  };
  
  // Apply filters
  const filteredTransactions = data?.filter(transaction => {
    // Search term filter
    const searchMatch = 
      !searchTerm || 
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toString().includes(searchTerm);
    
    // Status filter
    const statusMatch = !statusFilter || statusFilter === "all" || transaction.status === statusFilter;
    
    // Type filter
    const typeMatch = !typeFilter || typeFilter === "all" || transaction.type === typeFilter;
    
    return searchMatch && statusMatch && typeMatch;
  }) || [];
  
  // Sort by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / pageSize));
  const paginatedTransactions = sortedTransactions.slice(
    (page - 1) * pageSize, 
    page * pageSize
  );
  
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch(status) {
      case 'completed': return 'secondary'; // Using 'secondary' instead of 'success'
      case 'pending': return 'default';
      case 'failed': return 'destructive';
      case 'disputed': return 'outline'; // Using 'outline' instead of 'warning'
      default: return 'secondary';
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Transactions</CardTitle>
          <CardDescription>
            There was a problem fetching the transaction data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <p className="text-destructive">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
            <Button 
              variant="outline" 
              className="w-fit"
              onClick={() => refetch()}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID or reference..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page on search
            }}
          />
        </div>
        
        <div className="flex flex-row gap-2">
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1); // Reset to first page on filter change
          }}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter ? `Status: ${statusFilter}` : "All Statuses"}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={(value) => {
            setTypeFilter(value);
            setPage(1); // Reset to first page on filter change
          }}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {typeFilter ? `Type: ${typeFilter}` : "All Types"}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="game">Game</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
              <SelectItem value="bonus">Bonus</SelectItem>
            </SelectContent>
          </Select>
          
          {((statusFilter && statusFilter !== "all") || (typeFilter && typeFilter !== "all") || searchTerm) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setSearchTerm("");
                setPage(1);
              }}
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">#{transaction.id}</TableCell>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount, transaction.currency)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/transactions/${transaction.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
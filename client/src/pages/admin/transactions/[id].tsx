import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useAdmin } from "@/hooks/use-admin";
import { Loader2, ArrowLeft, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

type Transaction = {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  description: string;
  reference: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName?: string;
  };
  user?: {
    username: string;
    email: string;
  };
};

export default function TransactionDetailPage() {
  const [, params] = useRoute<{ id: string }>("/admin/transactions/:id");
  const [, navigate] = useLocation();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");
  const queryClient = useQueryClient();
  
  const transactionId = params?.id ? parseInt(params.id) : null;
  
  // Fetch transaction details
  const { data: transaction, isLoading, error } = useQuery<Transaction>({
    queryKey: ["/api/admin/transactions", transactionId],
    queryFn: async () => {
      if (!transactionId) throw new Error("Transaction ID is required");
      const response = await apiRequest("GET", `/api/admin/transactions/${transactionId}`);
      return response.json();
    },
    enabled: !!transactionId && isAdmin,
  });
  
  // Update transaction status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, note }: { status: string; note: string }) => {
      if (!transactionId) throw new Error("Transaction ID is required");
      
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${transactionId}/status`, 
        { 
          status,
          reason: note || undefined
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction status updated",
        description: "The transaction status has been successfully updated",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals/pending"] });
      
      // Reset form
      setNewStatus("");
      setStatusNote("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update transaction status: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Go back to transactions list
  const handleBack = () => {
    navigate("/admin/transactions");
  };
  
  // Handle status update
  const handleUpdateStatus = () => {
    if (!newStatus) {
      toast({
        title: "Error",
        description: "Please select a new status",
        variant: "destructive",
      });
      return;
    }
    
    updateStatusMutation.mutate({
      status: newStatus,
      note: statusNote
    });
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'completed': return 'success';
      case 'pending': return 'default';
      case 'failed': return 'destructive';
      case 'disputed': return 'warning';
      default: return 'secondary';
    }
  };
  
  // Redirect non-admin users
  useEffect(() => {
    if (!adminCheckLoading && !isAdmin) {
      navigate("/");
    }
  }, [adminCheckLoading, isAdmin, navigate]);
  
  if (adminCheckLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }
  
  if (error || !transaction) {
    return (
      <AdminLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error 
              ? error.message 
              : "Failed to load transaction details. Please try again."}
          </AlertDescription>
        </Alert>
        <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Button>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Transaction details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>Transaction #{transaction.id}</CardDescription>
              </div>
              <Badge variant={getStatusBadgeVariant(transaction.status) as any}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-y-6 gap-x-10">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Reference</h4>
                <p className="font-medium break-all">{transaction.reference}</p>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Date & Time</h4>
                <p className="font-medium">
                  {transaction.createdAt 
                    ? formatDateTime(transaction.createdAt) 
                    : 'Unknown'}
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                <p className="font-medium text-lg">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                <p className="font-medium capitalize">{transaction.type}</p>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">User ID</h4>
                <p className="font-medium">{transaction.userId}</p>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">User</h4>
                <p className="font-medium">
                  {transaction.user 
                    ? `${transaction.user.username} (${transaction.user.email})` 
                    : 'Unknown user'}
                </p>
              </div>
              
              {transaction.bankDetails && (
                <div className="col-span-2 space-y-2 mt-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Bank Details</h4>
                  <div className="p-4 bg-muted rounded-md">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Bank Name</p>
                        <p className="font-medium">{transaction.bankDetails.bankName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-medium">{transaction.bankDetails.accountNumber}</p>
                      </div>
                      {transaction.bankDetails.accountName && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Account Name</p>
                          <p className="font-medium">{transaction.bankDetails.accountName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="col-span-2 space-y-2 mt-2">
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="text-sm">
                  {transaction.description || 'No description provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Update status */}
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Change the status of this transaction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Note (Optional)</label>
              <Textarea
                placeholder="Add a note about this status change"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This note will be included in the transaction record.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleUpdateStatus}
              disabled={!newStatus || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
            
            {transaction.type === 'withdrawal' && transaction.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 text-green-600 hover:bg-green-600/10 hover:text-green-600"
                  onClick={() => {
                    setNewStatus('completed');
                    setStatusNote("Withdrawal approved by admin");
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Withdrawal
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setNewStatus('failed');
                    setStatusNote("Withdrawal rejected by admin");
                  }}
                >
                  <Ban className="h-4 w-4" />
                  Reject Withdrawal
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
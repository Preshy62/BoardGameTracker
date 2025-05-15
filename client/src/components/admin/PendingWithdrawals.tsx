import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// Not using Tabs component anymore
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle,
  Clock,
  Eye,
  ExternalLink,
  RefreshCcw,
  User,
} from "lucide-react";

type Transaction = {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
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

export function PendingWithdrawals() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Fetch pending withdrawals
  const { data, isLoading, error, refetch } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/withdrawals/pending"],
    queryFn: () => apiRequest("GET", "/api/admin/withdrawals/pending").then(res => res.json()),
  });
  
  // Approve withdrawal mutation
  const approveWithdrawalMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${transactionId}/status`,
        { status: "completed", reason: "Withdrawal approved by admin" }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "The withdrawal has been approved",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve withdrawal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Reject withdrawal mutation
  const rejectWithdrawalMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: number; reason: string }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${transactionId}/status`,
        { 
          status: "failed", 
          reason: reason || "Withdrawal rejected by admin" 
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "The withdrawal has been rejected and funds returned to the user",
      });
      
      // Reset state
      setSelectedTransaction(null);
      setRejectReason("");
      setIsRejectDialogOpen(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject withdrawal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleViewTransaction = (id: number) => {
    navigate(`/admin/transactions/${id}`);
  };
  
  const handleApproveWithdrawal = (transaction: Transaction) => {
    approveWithdrawalMutation.mutate(transaction.id);
  };
  
  const handleRejectWithdrawal = () => {
    if (!selectedTransaction) return;
    
    rejectWithdrawalMutation.mutate({
      transactionId: selectedTransaction.id,
      reason: rejectReason
    });
  };
  
  const openRejectDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };
  
  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[200px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Withdrawals
          </CardTitle>
          <CardDescription>
            There was a problem fetching pending withdrawals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const pendingWithdrawals = data || [];
  
  if (pendingWithdrawals.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
          <CardDescription>
            Manage withdrawal requests from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <CheckCircle className="mr-2 h-5 w-5 text-success" />
            No pending withdrawals at this time
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Withdrawals ({pendingWithdrawals.length})</CardTitle>
          <CardDescription>
            Review and approve or reject withdrawal requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingWithdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {formatCurrency(withdrawal.amount, withdrawal.currency)}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(withdrawal.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                      Pending
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {withdrawal.user && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium">{withdrawal.user.username}</span>
                      </div>
                    )}
                    
                    {withdrawal.bankDetails && (
                      <>
                        <div className="text-sm">
                          <span className="text-muted-foreground mr-1">Bank:</span>
                          <span className="font-medium">{withdrawal.bankDetails.bankName}</span>
                        </div>
                        <div className="text-sm font-mono">
                          <span className="text-muted-foreground mr-1">Acct:</span>
                          <span>{withdrawal.bankDetails.accountNumber}</span>
                        </div>
                        {withdrawal.bankDetails.accountName && (
                          <div className="text-sm">
                            <span className="text-muted-foreground mr-1">Name:</span>
                            <span>{withdrawal.bankDetails.accountName}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between gap-2 bg-muted/30 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTransaction(withdrawal.id)}
                    className="text-muted-foreground"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApproveWithdrawal(withdrawal)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      disabled={approveWithdrawalMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRejectDialog(withdrawal)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={rejectWithdrawalMutation.isPending}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Reject Withdrawal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Reject Withdrawal
            </DialogTitle>
            <DialogDescription>
              This will return the funds to the user's wallet balance.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 py-2">
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </span>
                </div>
                
                {selectedTransaction.user && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">User:</span>
                    <span>{selectedTransaction.user.username}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Rejection (Optional)</label>
                <Textarea
                  placeholder="Provide a reason for the rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={rejectWithdrawalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectWithdrawal}
              disabled={rejectWithdrawalMutation.isPending}
            >
              {rejectWithdrawalMutation.isPending ? 'Processing...' : 'Reject Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
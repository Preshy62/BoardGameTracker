import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { useLocation } from "wouter";
import { useState } from "react";

type Withdrawal = {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description: string;
  reference: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName?: string;
  };
  user: {
    username: string;
    email: string;
  };
};

type RejectWithdrawalData = {
  transactionId: number;
  reason: string;
};

export function PendingWithdrawals() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Fetch pending withdrawals
  const { data: pendingWithdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals/pending"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/withdrawals/pending");
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
  
  // Mutation for approving withdrawal
  const approveWithdrawalMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${transactionId}/status`, 
        { status: "completed" }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal approved",
        description: "The withdrawal request has been approved",
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
  
  // Mutation for rejecting withdrawal
  const rejectWithdrawalMutation = useMutation({
    mutationFn: async (data: RejectWithdrawalData) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${data.transactionId}/status`, 
        { 
          status: "failed", 
          reason: data.reason 
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal rejected",
        description: "The withdrawal request has been rejected",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      
      // Close dialog and reset state
      setIsRejectDialogOpen(false);
      setSelectedWithdrawal(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject withdrawal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleApproveWithdrawal = (withdrawal: Withdrawal) => {
    approveWithdrawalMutation.mutate(withdrawal.id);
  };
  
  const openRejectDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };
  
  const handleRejectWithdrawal = () => {
    if (!selectedWithdrawal) return;
    
    rejectWithdrawalMutation.mutate({
      transactionId: selectedWithdrawal.id,
      reason: rejectionReason
    });
  };
  
  const handleViewDetails = (withdrawalId: number) => {
    navigate(`/admin/transactions/${withdrawalId}`);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!pendingWithdrawals || pendingWithdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No pending withdrawal requests
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="font-medium">{withdrawal.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{withdrawal.user?.username || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{withdrawal.user?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(withdrawal.amount, withdrawal.currency)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{withdrawal.bankDetails?.bankName}</span>
                        <span className="text-xs text-muted-foreground">
                          {withdrawal.bankDetails?.accountName ? `${withdrawal.bankDetails.accountName} -` : ''} 
                          {withdrawal.bankDetails?.accountNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {withdrawal.createdAt 
                        ? format(parseISO(withdrawal.createdAt), 'MMM dd, yyyy') 
                        : 'Unknown date'}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={withdrawal.reference}>
                      {withdrawal.reference}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewDetails(withdrawal.id)}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openRejectDialog(withdrawal)}
                          disabled={rejectWithdrawalMutation.isPending || approveWithdrawalMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Reject</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-green-600 hover:text-green-600 hover:bg-green-600/10"
                          onClick={() => handleApproveWithdrawal(withdrawal)}
                          disabled={rejectWithdrawalMutation.isPending || approveWithdrawalMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Approve</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Reject Withdrawal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 rounded-md bg-muted p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Amount</p>
                <p className="font-medium">
                  {selectedWithdrawal 
                    ? formatCurrency(selectedWithdrawal.amount, selectedWithdrawal.currency)
                    : ''}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">User</p>
                <p className="font-medium">
                  {selectedWithdrawal?.user?.username || 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="Reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          
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
              disabled={rejectWithdrawalMutation.isPending || !rejectionReason.trim()}
            >
              {rejectWithdrawalMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
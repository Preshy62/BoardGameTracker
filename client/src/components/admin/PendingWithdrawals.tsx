import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, User, DollarSign, CalendarClock } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type WithdrawalWithUser = {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  description: string;
  bankDetails: any;
  reference: string;
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
};

type ApprovalAction = "approve" | "reject";

export function PendingWithdrawals() {
  const queryClient = useQueryClient();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalWithUser | null>(null);
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<ApprovalAction | null>(null);
  
  // Fetch pending withdrawals
  const { data: pendingWithdrawals, isLoading } = useQuery<WithdrawalWithUser[]>({
    queryKey: ["/api/admin/withdrawals/pending"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/withdrawals/pending");
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
  
  // Mutation for approving or rejecting withdrawals
  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/transactions/${id}/status`, {
        status,
        reason
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      
      toast({
        title: "Success",
        description: action === "approve" 
          ? "Withdrawal has been approved" 
          : "Withdrawal has been rejected and funds returned to the user",
        variant: "default",
      });
      
      // Reset state
      setSelectedWithdrawal(null);
      setReason("");
      setAction(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${action} withdrawal: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleAction = (withdrawal: WithdrawalWithUser, selectedAction: ApprovalAction) => {
    setSelectedWithdrawal(withdrawal);
    setAction(selectedAction);
    setReason(""); // Reset reason when opening dialog
  };
  
  const handleConfirm = () => {
    if (!selectedWithdrawal || !action) return;
    
    const status = action === "approve" ? "completed" : "failed";
    updateTransactionMutation.mutate({
      id: selectedWithdrawal.id,
      status,
      reason: reason.trim() || undefined
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <DollarSign className="h-5 w-5 mr-2" />
          Pending Withdrawals
        </CardTitle>
        <CardDescription>
          Review and process withdrawal requests from users
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !pendingWithdrawals || pendingWithdrawals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending withdrawals at this time
          </div>
        ) : (
          <div className="space-y-4">
            {pendingWithdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between mb-3">
                  <div className="flex items-center mb-2 md:mb-0">
                    <User className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span className="font-medium">{withdrawal.user?.username || "Unknown User"}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (ID: {withdrawal.userId})
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CalendarClock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {withdrawal.createdAt 
                        ? formatDistanceToNow(new Date(withdrawal.createdAt), { addSuffix: true }) 
                        : 'Unknown date'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start mb-3">
                  <div>
                    <div className="text-xl font-bold">
                      {formatCurrency(withdrawal.amount, withdrawal.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ref: {withdrawal.reference}
                    </div>
                  </div>
                  <Badge className="mt-2 md:mt-0" variant="outline">Pending</Badge>
                </div>
                
                {withdrawal.description && (
                  <div className="text-sm text-muted-foreground mb-3">
                    {withdrawal.description}
                  </div>
                )}
                
                {withdrawal.bankDetails && (
                  <div className="bg-muted p-2 rounded text-sm mb-3">
                    <div><strong>Bank:</strong> {withdrawal.bankDetails.bankName || 'N/A'}</div>
                    <div><strong>Account:</strong> {withdrawal.bankDetails.accountNumber || 'N/A'}</div>
                    {withdrawal.bankDetails.accountName && (
                      <div><strong>Name:</strong> {withdrawal.bankDetails.accountName}</div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAction(withdrawal, "reject")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleAction(withdrawal, "approve")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Confirmation dialog */}
      {selectedWithdrawal && (
        <Dialog open={!!selectedWithdrawal} onOpenChange={(open) => !open && setSelectedWithdrawal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === "approve" 
                  ? "Approve Withdrawal" 
                  : "Reject Withdrawal"
                }
              </DialogTitle>
              <DialogDescription>
                {action === "approve"
                  ? "Are you sure you want to approve this withdrawal request?"
                  : "The funds will be returned to the user's account."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium">{selectedWithdrawal.user?.username || "Unknown"}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{formatCurrency(selectedWithdrawal.amount, selectedWithdrawal.currency)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-medium">{selectedWithdrawal.reference}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="Add a note about this decision"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedWithdrawal(null)}
                disabled={updateTransactionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={action === "approve" ? "default" : "destructive"}
                onClick={handleConfirm}
                disabled={updateTransactionMutation.isPending}
              >
                {updateTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : action === "approve" ? (
                  "Approve"
                ) : (
                  "Reject"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
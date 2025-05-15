import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { AdminHeader } from "@/components/admin/AdminHeader";

type TransactionDetail = {
  transaction: {
    id: number;
    userId: number;
    amount: number;
    currency: string;
    status: string;
    type: string;
    createdAt: string;
    description: string;
    reference: string;
    bankDetails?: any;
  };
  user: {
    id: number;
    username: string;
    email: string;
    walletBalance: number;
  };
};

type StatusUpdateRequest = {
  status: 'pending' | 'completed' | 'failed' | 'disputed';
  reason?: string;
};

export default function TransactionDetailPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/admin/transactions/:id");
  const transactionId = params?.id ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdateRequest>({
    status: 'completed',
    reason: ''
  });
  
  // Redirect if not admin
  useEffect(() => {
    if (!isUserLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [user, isUserLoading, isAdmin, setLocation]);
  
  // Fetch transaction details
  const { 
    data: transactionDetail, 
    isLoading: isTransactionLoading,
    error: transactionError
  } = useQuery<TransactionDetail>({
    queryKey: [`/api/admin/transactions/${transactionId}`],
    queryFn: async () => {
      if (!transactionId) throw new Error("Invalid transaction ID");
      const response = await apiRequest("GET", `/api/admin/transactions/${transactionId}`);
      return response.json();
    },
    enabled: !!transactionId && !!user?.isAdmin,
  });
  
  // Mutation for updating transaction status
  const updateStatusMutation = useMutation({
    mutationFn: async (data: StatusUpdateRequest) => {
      if (!transactionId) throw new Error("Invalid transaction ID");
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${transactionId}/status`, 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/transactions/${transactionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals/pending'] });
      
      toast({
        title: "Status updated",
        description: `Transaction status has been updated to ${statusUpdate.status}`,
      });
      
      setIsStatusDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleUpdateStatus = () => {
    updateStatusMutation.mutate(statusUpdate);
  };
  
  const openStatusDialog = (defaultStatus: 'pending' | 'completed' | 'failed' | 'disputed') => {
    setStatusUpdate({
      status: defaultStatus,
      reason: ''
    });
    setIsStatusDialogOpen(true);
  };
  
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return 'secondary';
    
    switch(status) {
      case 'completed': return 'success';
      case 'pending': return 'default';
      case 'failed': return 'destructive';
      case 'disputed': return 'warning';
      default: return 'secondary';
    }
  };
  
  // Show loading or nothing if not authenticated
  if (isUserLoading || !user || !isAdmin) {
    return null;
  }
  
  if (transactionError) {
    return (
      <div className="flex min-h-screen flex-col">
        <AdminHeader user={user} />
        
        <main className="flex-1 container py-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation("/admin")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">
                {transactionError instanceof Error 
                  ? transactionError.message 
                  : "Failed to load transaction details"}
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader user={user} />
      
      <main className="flex-1 container py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation("/admin")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
          
          <h1 className="text-2xl font-bold mb-2">
            Transaction Details
            {!isTransactionLoading && (
              <span className="ml-2">#{transactionDetail?.transaction.id}</span>
            )}
          </h1>
        </div>
        
        {isTransactionLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !transactionDetail ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Transaction not found</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                        <p className="capitalize font-medium">{transactionDetail.transaction.type}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                        <Badge variant={getStatusBadgeVariant(transactionDetail.transaction.status) as any}>
                          {transactionDetail.transaction.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Amount</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(transactionDetail.transaction.amount, transactionDetail.transaction.currency)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Reference</p>
                      <p className="font-medium break-all">{transactionDetail.transaction.reference}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {transactionDetail.transaction.createdAt 
                          ? format(parseISO(transactionDetail.transaction.createdAt), 'MMMM dd, yyyy HH:mm:ss')
                          : 'Unknown date'}
                      </div>
                    </div>
                    
                    {transactionDetail.transaction.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                        <p className="break-words">{transactionDetail.transaction.description}</p>
                      </div>
                    )}
                    
                    {transactionDetail.transaction.bankDetails && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Bank Details</p>
                        <div className="p-3 bg-muted rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Bank Name</p>
                              <p>{transactionDetail.transaction.bankDetails.bankName || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Account Number</p>
                              <p>{transactionDetail.transaction.bankDetails.accountNumber || 'N/A'}</p>
                            </div>
                            {transactionDetail.transaction.bankDetails.accountName && (
                              <div>
                                <p className="text-xs text-muted-foreground">Account Name</p>
                                <p>{transactionDetail.transaction.bankDetails.accountName}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-between">
                  {transactionDetail.transaction.type === 'withdrawal' && 
                   transactionDetail.transaction.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:text-destructive"
                        onClick={() => openStatusDialog('failed')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Withdrawal
                      </Button>
                      <Button
                        onClick={() => openStatusDialog('completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Withdrawal
                      </Button>
                    </>
                  )}
                  
                  {transactionDetail.transaction.status !== 'pending' && (
                    <Button
                      variant="outline"
                      onClick={() => openStatusDialog('pending')}
                    >
                      Mark as Pending
                    </Button>
                  )}
                  
                  {transactionDetail.transaction.status !== 'disputed' && (
                    <Button
                      variant="outline"
                      className="border-orange-500 text-orange-500 hover:text-orange-500"
                      onClick={() => openStatusDialog('disputed')}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Mark as Disputed
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3">
                      {transactionDetail.user.username?.substring(0, 2).toUpperCase() || 'UN'}
                    </div>
                    <div>
                      <p className="font-medium">{transactionDetail.user.username}</p>
                      <p className="text-sm text-muted-foreground">ID: {transactionDetail.user.id}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                    <p className="break-all">{transactionDetail.user.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(transactionDetail.user.walletBalance, transactionDetail.transaction.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation(`/admin/users/${transactionDetail.user.id}`)}
                >
                  <User className="h-4 w-4 mr-2" />
                  View User Profile
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
      
      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Transaction Status</DialogTitle>
            <DialogDescription>
              Change the status of this transaction. This may affect user balances.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <RadioGroup 
              value={statusUpdate.status}
              onValueChange={(value) => setStatusUpdate({
                ...statusUpdate,
                status: value as 'pending' | 'completed' | 'failed' | 'disputed'
              })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completed" id="status-completed" />
                <Label htmlFor="status-completed">Completed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="status-pending" />
                <Label htmlFor="status-pending">Pending</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="failed" id="status-failed" />
                <Label htmlFor="status-failed">Failed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disputed" id="status-disputed" />
                <Label htmlFor="status-disputed">Disputed</Label>
              </div>
            </RadioGroup>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="Add a note about this status change"
                value={statusUpdate.reason}
                onChange={(e) => setStatusUpdate({
                  ...statusUpdate,
                  reason: e.target.value
                })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updateStatusMutation.isPending}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
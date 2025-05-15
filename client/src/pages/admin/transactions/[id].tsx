import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/format";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  ArrowLeft, 
  Ban, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  User 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

interface TransactionDetailPageProps {
  id?: string;
}

export default function TransactionDetailPage({ id: propsId }: TransactionDetailPageProps) {
  const params = useParams();
  // Use id from props or from params
  const paramId = params?.id || propsId;
  const transactionId = paramId ? parseInt(paramId) : NaN;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  
  // Fetch transaction details
  const { data, isLoading, error } = useQuery<{transaction: Transaction, user: any}>({
    queryKey: ["/api/admin/transactions", transactionId],
    queryFn: () => apiRequest("GET", `/api/admin/transactions/${transactionId}`).then(res => res.json()),
    enabled: !isNaN(transactionId) && !!isAdmin,
  });
  
  const transaction = data?.transaction;
  
  // Mutation for updating transaction status
  const updateStatusMutation = useMutation({
    mutationFn: async (updates: { status: string; note?: string }) => {
      console.log("Sending update with:", updates);
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/transactions/${transactionId}/status`,
        updates
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
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
    
    // Skip update if user selects "current" option
    if (newStatus === "current") {
      toast({
        title: "Info",
        description: "Status remains unchanged",
      });
      setNewStatus("");
      setStatusNote("");
      return;
    }
    
    console.log(`Updating transaction ${transactionId} status to: ${newStatus}`);
    
    updateStatusMutation.mutate({
      status: newStatus,
      note: statusNote || undefined
    });
  };
  
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch(status) {
      case 'completed': return 'secondary'; // Using 'secondary' instead of 'success'
      case 'pending': return 'default';
      case 'failed': return 'destructive';
      case 'disputed': return 'outline'; // Using 'outline' instead of 'warning'
      default: return 'secondary';
    }
  };
  
  // Redirect non-admin users and log debugging info
  useEffect(() => {
    console.log(`Transaction Detail - ID: ${transactionId}`);
    console.log(`Admin check - Loading: ${adminCheckLoading}, Is Admin: ${isAdmin}`);
    
    if (!adminCheckLoading && !isAdmin) {
      console.log("Not an admin, redirecting to home");
      toast({
        title: "Access Denied",
        description: "You need admin privileges to view transaction details",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [adminCheckLoading, isAdmin, navigate, transactionId, toast]);
  
  if (isLoading || adminCheckLoading) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !transaction) {
    return (
      <div>
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-destructive">Transaction Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p>The transaction could not be loaded. It may have been deleted or you may not have permission to view it.</p>
            </div>
            <Button onClick={handleBack} className="mt-4">
              Return to Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Transaction #{transaction.id}</h1>
        <Badge variant={getStatusBadgeVariant(transaction.status)} className="ml-4">
          {transaction.status.toUpperCase()}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Basic information about this transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex flex-col space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                <dd className="flex items-center gap-2 font-medium">
                  <CreditCard className="h-4 w-4" />
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </dd>
              </div>
              
              <div className="flex flex-col space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Amount</dt>
                <dd className="text-lg font-bold">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </dd>
              </div>
              
              <div className="flex flex-col space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Date</dt>
                <dd className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatDate(transaction.createdAt)}
                </dd>
              </div>
              
              <div className="flex flex-col space-y-1">
                <dt className="text-sm font-medium text-muted-foreground">Reference</dt>
                <dd className="font-mono text-sm">
                  {transaction.reference}
                </dd>
              </div>
              
              {transaction.description && (
                <div className="flex flex-col space-y-1">
                  <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                  <dd className="text-sm whitespace-pre-line">
                    {transaction.description}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Details about the user associated with this transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.user ? (
                <dl className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Username</dt>
                    <dd className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4" />
                      {data.user.username}
                    </dd>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                    <dd className="text-sm">
                      {data.user.email}
                    </dd>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
                    <dd className="text-sm font-mono">
                      {transaction?.userId}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  No user information available
                </div>
              )}
            </CardContent>
          </Card>
          
          {transaction.type === 'withdrawal' && transaction.bankDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>
                  Banking information for this withdrawal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Bank Name</dt>
                    <dd className="font-medium">
                      {transaction.bankDetails.bankName}
                    </dd>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Account Number</dt>
                    <dd className="font-mono">
                      {transaction.bankDetails.accountNumber}
                    </dd>
                  </div>
                  
                  {transaction.bankDetails.accountName && (
                    <div className="flex flex-col space-y-1">
                      <dt className="text-sm font-medium text-muted-foreground">Account Name</dt>
                      <dd>
                        {transaction.bankDetails.accountName}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Status Update Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
          <CardDescription>
            Change the status of this transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="current">Keep Current Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Note (Optional)</label>
              <Textarea 
                placeholder="Add a note explaining the status change"
                value={statusNote}
                onChange={e => setStatusNote(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="default" 
            onClick={handleUpdateStatus} 
            disabled={!newStatus || updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
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
  );
}
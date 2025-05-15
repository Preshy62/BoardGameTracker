import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/use-admin";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertCircle, 
  ArrowLeft, 
  Ban, 
  CheckCircle, 
  Clock, 
  History, 
  Mail, 
  Pencil, 
  Phone, 
  Shield, 
  UserCircle,
  Wallet
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";


type UserDetailPageProps = {
  id?: string;
};

type UserDetail = {
  id: number;
  username: string;
  email: string;
  walletBalance: number;
  phone?: string;
  isActive: boolean;
  isVerified?: boolean;
  createdAt: string;
  avatarUrl?: string;
  avatarInitials: string;
  transactions: any[];
  games: any[];
};

// Form schema for editing user details
const userEditFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type UserEditFormValues = z.infer<typeof userEditFormSchema>;

// Edit User Modal Component
function EditUserModal({ user, onUpdate }: { user: UserDetail, onUpdate: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      phone: user.phone || "",
    },
  });
  
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserEditFormValues) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/users/${user.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User details have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsOpen(false);
      onUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  function onSubmit(data: UserEditFormValues) {
    updateUserMutation.mutate(data);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full justify-start" 
          variant="outline"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit User Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Details</DialogTitle>
          <DialogDescription>
            Make changes to the user's profile information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function UserDetailPage({ id: propsId }: UserDetailPageProps) {
  const params = useParams();
  // Use id from props or from params
  const paramId = params?.id || propsId;
  const userId = paramId ? parseInt(paramId) : NaN;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isLoading: adminCheckLoading } = useAdmin();
  
  // Fetch user details
  const { data, isLoading, error } = useQuery<{user: UserDetail, transactions: any[], games: any[]}>({
    queryKey: ["/api/admin/users", userId],
    queryFn: () => apiRequest("GET", `/api/admin/users/${userId}`).then(res => res.json()),
    enabled: !isNaN(userId) && !!isAdmin,
  });
  
  const user = data?.user;
  const transactions = data?.transactions || [];
  const games = data?.games || [];
  
  // Mutation for updating user status
  const updateUserStatusMutation = useMutation({
    mutationFn: async (updates: { isActive: boolean }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/users/${userId}/status`,
        updates
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "The user status has been successfully updated",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/users", userId]
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/users"]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update user status: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating balance manually
  const updateBalanceMutation = useMutation({
    mutationFn: async (updates: { amount: number; reason: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/admin/users/${userId}/balance`,
        updates
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "The user's balance has been successfully updated",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/users", userId]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update balance: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  if (!isAdmin && !adminCheckLoading) {
    navigate("/admin");
    return null;
  }
  
  return (
    <div>
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/admin/users")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error Loading User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the user details. Please try again.</p>
            <Button 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] })}
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : user ? (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Main User Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary-foreground flex items-center justify-center text-lg font-bold">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.username} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    user.avatarInitials
                  )}
                </div>
                <div>
                  {user.username}
                  <Badge className="ml-2" variant={user.isActive ? "outline" : "destructive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {user.isVerified && (
                    <Badge className="ml-2" variant="secondary">
                      Verified
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <CardDescription>
                User ID: #{user.id} • Created on {formatDate(user.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">User Details</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="games">Games</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Information</h3>
                        <div className="rounded-md border p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Email Address</p>
                              <p className="text-sm">{user.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Phone Number</p>
                              <p className="text-sm">{user.phone || "Not provided"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Status</h3>
                        <div className="rounded-md border p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Account Status</p>
                              <p className="text-sm flex items-center">
                                {user.isActive ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-4 w-4 text-destructive mr-1" />
                                    Disabled
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Member Since</p>
                              <p className="text-sm">{formatDate(user.createdAt)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <History className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Last Activity</p>
                              <p className="text-sm">Not available</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Financial Information</h3>
                        <div className="rounded-md border p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <Wallet className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Wallet Balance</p>
                              <p className="text-lg font-semibold">{formatCurrency(user.walletBalance)}</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm">Total Spent</p>
                            <p className="text-sm font-medium">{formatCurrency(
                              transactions
                                .filter(t => t.type === 'stake')
                                .reduce((sum, t) => sum + t.amount, 0)
                            )}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm">Total Deposited</p>
                            <p className="text-sm font-medium">{formatCurrency(
                              transactions
                                .filter(t => t.type === 'deposit')
                                .reduce((sum, t) => sum + t.amount, 0)
                            )}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm">Total Withdrawn</p>
                            <p className="text-sm font-medium">{formatCurrency(
                              transactions
                                .filter(t => t.type === 'withdrawal')
                                .reduce((sum, t) => sum + t.amount, 0)
                            )}</p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm">Total Winnings</p>
                            <p className="text-sm font-medium">{formatCurrency(
                              transactions
                                .filter(t => t.type === 'winnings')
                                .reduce((sum, t) => sum + t.amount, 0)
                            )}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction History</CardTitle>
                      <CardDescription>All financial transactions for this user</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Reference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transactions.length > 0 ? (
                              transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-medium">#{transaction.id}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      transaction.type === 'deposit' || transaction.type === 'winnings' 
                                        ? 'success' 
                                        : transaction.type === 'withdrawal' 
                                          ? 'destructive' 
                                          : 'outline'
                                    }>
                                      {transaction.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className={
                                    (transaction.type === 'deposit' || transaction.type === 'winnings') 
                                      ? 'text-green-600' 
                                      : transaction.type === 'withdrawal' || transaction.type === 'stake'
                                        ? 'text-red-600' 
                                        : ''
                                  }>
                                    {formatCurrency(transaction.amount)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      transaction.status === 'completed' 
                                        ? 'success' 
                                        : transaction.status === 'pending' 
                                          ? 'outline' 
                                          : 'destructive'
                                    }>
                                      {transaction.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {transaction.reference.substring(0, 8)}...
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                  No transactions found for this user
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="games">
                  <Card>
                    <CardHeader>
                      <CardTitle>Game History</CardTitle>
                      <CardDescription>All games this user has participated in</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Game ID</TableHead>
                              <TableHead>Stakes</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Players</TableHead>
                              <TableHead>Result</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {games.length > 0 ? (
                              games.map((game) => (
                                <TableRow key={game.id}>
                                  <TableCell className="font-medium">#{game.id}</TableCell>
                                  <TableCell>{formatCurrency(game.stake)}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      game.status === 'waiting' 
                                        ? 'outline' 
                                        : game.status === 'in_progress' 
                                          ? 'secondary' 
                                          : 'default'
                                    }>
                                      {game.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{game.currentPlayers}/{game.maxPlayers}</TableCell>
                                  <TableCell>
                                    {game.status === 'completed' ? (
                                      game.winnerIds && game.winnerIds.includes(user.id) ? (
                                        <span className="text-green-600 font-medium">Won</span>
                                      ) : (
                                        <span className="text-red-600 font-medium">Lost</span>
                                      )
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>{formatDate(game.createdAt)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                  No game history found for this user
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Actions Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>User Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <EditUserModal 
                user={user}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] })}
              />
              
              <Button
                className="w-full justify-start"
                variant={user.isActive ? "destructive" : "outline"}
                onClick={() => updateUserStatusMutation.mutate({ 
                  isActive: !user.isActive 
                })}
                disabled={updateUserStatusMutation.isPending}
              >
                {updateUserStatusMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : user.isActive ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    Disable Account
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enable Account
                  </>
                )}
              </Button>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Additional Actions</h3>
                
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    // Prompt for amount and reason
                    const amount = prompt("Enter amount to add to balance (use negative for deduction):");
                    if (amount === null) return;
                    
                    const amountNum = parseFloat(amount);
                    if (isNaN(amountNum)) {
                      toast({
                        title: "Invalid Amount",
                        description: "Please enter a valid number",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    const reason = prompt("Enter reason for this adjustment:");
                    if (reason === null) return;
                    
                    updateBalanceMutation.mutate({
                      amount: amountNum,
                      reason: reason || "Manual adjustment by admin"
                    });
                  }}
                  disabled={updateBalanceMutation.isPending}
                >
                  {updateBalanceMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Adjust Balance
                    </>
                  )}
                </Button>
                
                <Button
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              User Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>The user you are looking for could not be found.</p>
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/users")}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
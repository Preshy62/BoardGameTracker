import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/format";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  User,
  MoreHorizontal,
  Check,
  X,
  Eye,
  UserCog,
  Trash2
} from "lucide-react";
import { Link } from "wouter";

type User = {
  id: number;
  username: string;
  email: string;
  walletBalance: number;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
  avatarInitials: string;
  isVerified?: boolean;
};

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  
  // Fetch all users
  const { data: users = [], isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users").then(res => res.json()),
    enabled: !!isAdmin,
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "User deleted",
        description: data.message || "User has been successfully deleted",
      });
      
      // Refresh the users list
      refetch();
      
      // Reset the state
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "An error occurred while deleting the user",
        variant: "destructive",
      });
    }
  });
  
  // Update user status mutation (activate/deactivate)
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { isActive: status });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.isActive ? "User activated" : "User deactivated",
        description: `${data.username}'s account has been ${data.isActive ? "activated" : "deactivated"} successfully.`,
      });
      
      // Refresh the users list
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user status",
        description: error.message || "An error occurred while updating the user status",
        variant: "destructive",
      });
    }
  });
  
  // Apply search filter
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.id.toString().includes(searchLower)
    );
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search users..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the user <span className="font-medium">{userToDelete?.username}</span> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 
                "Deleting..." : 
                "Delete User"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage and view details for all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error loading users. Please try again.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">#{user.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              {user.avatarUrl ? (
                                <img 
                                  src={user.avatarUrl} 
                                  alt={user.username} 
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium">
                                  {user.avatarInitials}
                                </span>
                              )}
                            </div>
                            <span>{user.username}</span>
                            {user.isVerified && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>₦{user.walletBalance.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "outline" : "destructive"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}`} className="flex w-full items-center">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}?edit=true`} className="flex w-full items-center">
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Edit User
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  updateUserStatusMutation.mutate({ 
                                    userId: user.id, 
                                    status: !user.isActive 
                                  });
                                }}
                              >
                                {user.isActive ? (
                                  <>
                                    <X className="h-4 w-4 mr-2 text-destructive" />
                                    <span className="text-destructive">
                                      {updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.userId === user.id ? 
                                        "Deactivating..." : "Deactivate"}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2 text-primary" />
                                    <span className="text-primary">
                                      {updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.userId === user.id ? 
                                        "Activating..." : "Activate"}
                                    </span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setUserToDelete(user);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                <span className="text-destructive">Delete User</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
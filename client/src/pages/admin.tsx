import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Transaction, Game } from "@shared/schema";
import Header from "@/components/layout/Header";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomBadge } from "@/components/ui/custom-badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  AreaChart,
  BadgeDollarSign,
  BarChart,
  CalendarDays,
  CreditCard,
  DollarSign,
  Gamepad2,
  ListFilter,
  Search,
  ShieldAlert,
  Trophy,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react";

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch current admin user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch all users (admin only endpoint)
  const { data: allUsers, isLoading: isAllUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin, // Only run if user is admin
  });

  // Fetch all games (admin only endpoint)
  const { data: allGames, isLoading: isAllGamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/admin/games"],
    enabled: !!user?.isAdmin, // Only run if user is admin
  });

  // Fetch all transactions (admin only endpoint)
  const { data: allTransactions, isLoading: isAllTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: !!user?.isAdmin, // Only run if user is admin
  });

  // Loading state
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  // Check if user is admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="bg-destructive text-white">
              <CardTitle className="text-xl">Access Denied</CardTitle>
              <CardDescription className="text-gray-100">
                You don't have permission to access this page
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-4">
                <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                <p className="text-center text-gray-700 mb-6">
                  This area is restricted to administrators only. If you believe this is an error, please contact support.
                </p>
                <Button onClick={() => window.location.href = "/"} className="bg-primary">
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Calculate platform stats
  const totalUsers = allUsers?.length || 0;
  const totalGames = allGames?.length || 0;
  const activeGames = allGames?.filter(game => game.status === "in_progress").length || 0;
  const totalDeposits = allTransactions?.filter(t => t.type === "deposit" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWithdrawals = allTransactions?.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const platformFees = allTransactions?.filter(t => t.type === "commission" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;

  // Filter users by search term
  const filteredUsers = allUsers?.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, games, and platform settings</p>
        </div>

        {/* Platform Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{totalUsers}</div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{activeGames} <span className="text-sm text-gray-500 font-normal">/ {totalGames}</span></div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(platformFees)}</div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <BadgeDollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(totalDeposits - totalWithdrawals)}</div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>View and manage all users on the platform</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      className="pl-8 w-full md:w-[260px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isAllUsersLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User ID</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Wallet Balance</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">#{user.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary text-white text-xs font-bold mr-2">
                                  {user.avatarInitials}
                                </div>
                                {user.username}
                                {user.isAdmin && (
                                  <Badge className="ml-2 bg-primary">Admin</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatCurrency(user.walletBalance)}</TableCell>
                            <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                              <CustomBadge variant={user.isActive ? "success" : "outline"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </CustomBadge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive">
                                  {user.isActive ? "Deactivate" : "Activate"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No users found matching your search criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Game Management</CardTitle>
                    <CardDescription>View and manage all games on the platform</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <ListFilter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isAllGamesLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
                  </div>
                ) : allGames && allGames.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Game ID</TableHead>
                          <TableHead>Creator</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Players</TableHead>
                          <TableHead>Stake (₦)</TableHead>
                          <TableHead>Total Pool</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allGames.map((game) => (
                          <TableRow key={game.id}>
                            <TableCell className="font-medium">#{game.id}</TableCell>
                            <TableCell>#{game.creatorId}</TableCell>
                            <TableCell>
                              <CustomBadge variant={game.status === 'waiting' ? 'outline' : 
                                            game.status === 'in_progress' ? 'default' : 
                                            'success'}>
                                {game.status === 'waiting' ? 'Waiting' : 
                                 game.status === 'in_progress' ? 'In Progress' : 
                                 'Completed'}
                              </CustomBadge>
                            </TableCell>
                            <TableCell>{/*currentPlayers*/}0 / {game.maxPlayers}</TableCell>
                            <TableCell>{formatCurrency(game.stake)}</TableCell>
                            <TableCell>{formatCurrency(game.stake * game.maxPlayers)}</TableCell>
                            <TableCell>{game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                                {game.status !== 'completed' && (
                                  <Button size="sm" variant="outline" className="text-destructive">
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No games found on the platform.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>View all financial transactions on the platform</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <ListFilter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isAllTransactionsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
                  </div>
                ) : allTransactions && allTransactions.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">#{transaction.id}</TableCell>
                            <TableCell>#{transaction.userId}</TableCell>
                            <TableCell>
                              <CustomBadge variant={(transaction.type === 'deposit' || transaction.type === 'winnings') ? 'success' : 
                                            transaction.type === 'withdrawal' ? 'destructive' : 
                                            'outline'}>
                                {transaction.type}
                              </CustomBadge>
                            </TableCell>
                            <TableCell className={(transaction.type === 'deposit' || transaction.type === 'winnings') ? 'text-success' : 
                                              transaction.type === 'withdrawal' ? 'text-destructive' : 
                                              'text-primary'}>
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <CustomBadge variant={transaction.status === 'completed' ? 'success' : 
                                            transaction.status === 'pending' ? 'outline' : 
                                            'destructive'}>
                                {transaction.status}
                              </CustomBadge>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-xs">{transaction.reference.substring(0, 8)}...</span>
                            </TableCell>
                            <TableCell>
                              {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transactions found on the platform.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

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
  PieChart,
  Search,
  ShieldAlert,
  Trophy,
  TrendingUp,
  User as UserIcon,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import Recharts components for data visualization
import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statsTimePeriod, setStatsTimePeriod] = useState("week");

  // Fetch current admin user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/user"],
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
  
  // Fetch game statistics
  const { data: gameStats, isLoading: isGameStatsLoading } = useQuery({
    queryKey: ["/api/admin/statistics/games", statsTimePeriod],
    queryFn: () => 
      fetch(`/api/admin/statistics/games?period=${statsTimePeriod}`)
        .then(res => res.json()),
    enabled: !!user?.isAdmin,
  });
  
  // Fetch financial statistics
  const { data: financialStats, isLoading: isFinancialStatsLoading } = useQuery({
    queryKey: ["/api/admin/statistics/financial", statsTimePeriod],
    queryFn: () => 
      fetch(`/api/admin/statistics/financial?period=${statsTimePeriod}`)
        .then(res => res.json()),
    enabled: !!user?.isAdmin,
  });
  
  // Fetch user activity statistics
  const { data: userStats, isLoading: isUserStatsLoading } = useQuery({
    queryKey: ["/api/admin/statistics/users", statsTimePeriod],
    queryFn: () => 
      fetch(`/api/admin/statistics/users?period=${statsTimePeriod}`)
        .then(res => res.json()),
    enabled: !!user?.isAdmin,
  });

  // Loading state
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  // Check if user exists and is admin
  if (!user) {
    return null;
  }
  
  if (!user.isAdmin) {
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

  // Calculate platform stats - use the detailed stats when available
  const totalUsers = userStats?.totalUsers || allUsers?.length || 0;
  const totalGames = gameStats?.totalGames || allGames?.length || 0;
  const activeGames = gameStats?.gamesInProgress || allGames?.filter(game => game.status === "in_progress").length || 0;
  const completedGames = gameStats?.gamesCompleted || allGames?.filter(game => game.status === "completed").length || 0;
  const waitingGames = gameStats?.gamesWaiting || allGames?.filter(game => game.status === "waiting").length || 0;
  const totalDeposits = financialStats?.totalDeposits || allTransactions?.filter(t => t.type === "deposit" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWithdrawals = financialStats?.totalWithdrawals || allTransactions?.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const platformFees = financialStats?.totalFees || allTransactions?.filter(t => t.type === "commission" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const netRevenue = financialStats?.netRevenue || (totalDeposits - totalWithdrawals + platformFees);
  const newUsers = userStats?.totalNewUsers || 0;
  const activeUsers = userStats?.totalActiveUsers || 0;

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
                <div className="text-2xl font-bold">
                  {isUserStatsLoading ? (
                    <span className="animate-pulse">···</span>
                  ) : totalUsers}
                  {!isUserStatsLoading && newUsers > 0 && (
                    <span className="text-xs ml-2 text-green-600">+{newUsers} new</span>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {activeUsers > 0 && 
                  `${activeUsers} active users (${Math.round((activeUsers / totalUsers) * 100)}%)`
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Games</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {isGameStatsLoading ? (
                    <span className="animate-pulse">···</span>
                  ) : (
                    <>{totalGames}</>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="grid grid-cols-3 text-xs text-gray-500 mt-2">
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span> 
                  {isGameStatsLoading ? '...' : activeGames} active
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span> 
                  {isGameStatsLoading ? '...' : waitingGames} waiting
                </div>
                <div>
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> 
                  {isGameStatsLoading ? '...' : completedGames} done
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
                <div className="text-2xl font-bold">
                  {isFinancialStatsLoading ? (
                    <span className="animate-pulse">···</span>
                  ) : (
                    formatCurrency(netRevenue, "NGN")
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <BadgeDollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {!isFinancialStatsLoading && (
                  `${formatCurrency(platformFees, "NGN")} from game fees`
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {isFinancialStatsLoading ? (
                    <span className="animate-pulse">···</span>
                  ) : (
                    formatCurrency(totalDeposits, "NGN")
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>Deposits</span>
                {!isFinancialStatsLoading && (
                  <span>Withdrawals: {formatCurrency(totalWithdrawals, "NGN")}</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <div className="mb-6 flex justify-end">
            <Select
              value={statsTimePeriod}
              onValueChange={setStatsTimePeriod}
            >
              <SelectTrigger className="w-[180px]">
                <CalendarDays className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Dashboard visualizations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Game Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Game Activity</CardTitle>
                  <CardDescription>Number of games over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isGameStatsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : gameStats?.chartData?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsAreaChart
                        data={gameStats.chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="gameColorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#8884d8"
                          fillOpacity={1}
                          fill="url(#gameColorCount)"
                          name="Games"
                        />
                      </RechartsAreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Financial Overview Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>Deposits, withdrawals, and fees</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isFinancialStatsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : financialStats?.chartData?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={financialStats.chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="deposits" fill="#4CAF50" name="Deposits" />
                        <Bar dataKey="withdrawals" fill="#F44336" name="Withdrawals" />
                        <Bar dataKey="fees" fill="#2196F3" name="Fees" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Game Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Game Status</CardTitle>
                  <CardDescription>Breakdown by status</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {isGameStatsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : gameStats ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>Completed</span>
                        </div>
                        <span>{gameStats.gamesCompleted || 0}</span>
                      </div>
                      <Progress
                        value={
                          gameStats.totalGames
                            ? (gameStats.gamesCompleted / gameStats.totalGames) * 100
                            : 0
                        }
                        className="h-2 bg-green-200"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span>In Progress</span>
                        </div>
                        <span>{gameStats.gamesInProgress || 0}</span>
                      </div>
                      <Progress
                        value={
                          gameStats.totalGames
                            ? (gameStats.gamesInProgress / gameStats.totalGames) * 100
                            : 0
                        }
                        className="h-2 bg-amber-200"
                      />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span>Waiting</span>
                        </div>
                        <span>{gameStats.gamesWaiting || 0}</span>
                      </div>
                      <Progress
                        value={
                          gameStats.totalGames
                            ? (gameStats.gamesWaiting / gameStats.totalGames) * 100
                            : 0
                        }
                        className="h-2 bg-blue-200"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Active vs. total users</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {isUserStatsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : userStats ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: "Active Users",
                              value: userStats.totalActiveUsers || 0,
                              fill: "#4CAF50",
                            },
                            {
                              name: "Inactive Users",
                              value: 
                                (userStats.totalUsers || 0) - 
                                (userStats.totalActiveUsers || 0),
                              fill: "#E0E0E0",
                            },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        />
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* User Registration */}
              <Card>
                <CardHeader>
                  <CardTitle>New Users</CardTitle>
                  <CardDescription>Registration trend</CardDescription>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {isUserStatsLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                  ) : userStats?.chartData?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={userStats.chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="newUsers"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                          name="New Users"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                                  <CustomBadge variant="default" className="ml-2">Admin</CustomBadge>
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

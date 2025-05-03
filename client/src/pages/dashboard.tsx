import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Progress } from "@/components/ui/progress";
import {
  User as UserIcon,
  DollarSign,
  CreditCard,
  Trophy,
  CalendarDays,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Gamepad2,
  BarChart4,
  ArrowRight,
  Wallet,
} from "lucide-react";

export default function Dashboard() {
  const [, navigate] = useLocation();

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch user's active games
  const { data: userGames, isLoading: isUserGamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/user"],
  });

  // Fetch transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate user stats
  const activeGames = userGames?.filter(game => game.status === "in_progress") || [];
  const completedGames = userGames?.filter(game => game.status === "completed") || [];
  const winCount = completedGames.filter(game => game.winnerId === user.id).length;
  const totalDeposits = transactions?.filter(t => t.type === "deposit" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWithdrawals = transactions?.filter(t => t.type === "withdrawal" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalWinnings = transactions?.filter(t => t.type === "winnings" && t.status === "completed").reduce((sum, t) => sum + t.amount, 0) || 0;
  const winRate = completedGames.length > 0 ? (winCount / completedGames.length) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Player Dashboard</h1>
          <p className="text-gray-600">Manage your account and view your game statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* User Profile Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full flex items-center justify-center bg-primary text-white font-bold text-2xl mr-4">
                    {user.avatarInitials}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.username}</h3>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <Wallet className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-700">Balance:</span>
                  <span className="font-bold text-primary ml-2">{formatCurrency(user.walletBalance)}</span>
                </div>
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-700">Member since:</span>
                  <span className="text-gray-900 ml-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-gray-700">Player ID:</span>
                  <span className="text-gray-900 ml-2">#{user.id}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                onClick={() => navigate('/wallet')} 
                variant="outline" 
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Wallet
              </Button>
            </CardFooter>
          </Card>

          {/* Game Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Game Statistics</CardTitle>
              <CardDescription>Your gameplay performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-amber-500 mr-2" />
                    <span>Win Rate</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold">{winRate.toFixed(0)}%</span>
                  </div>
                </div>
                <Progress value={winRate} className="h-2" />

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-500 text-sm">Games Played</div>
                    <div className="text-2xl font-bold">{completedGames.length}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-500 text-sm">Games Won</div>
                    <div className="text-2xl font-bold text-success">{winCount}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-500 text-sm">Winning %</div>
                    <div className="text-2xl font-bold">{winRate.toFixed(0)}%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-gray-500 text-sm">Active Games</div>
                    <div className="text-2xl font-bold text-primary">{activeGames.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full"
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Play Games
              </Button>
            </CardFooter>
          </Card>

          {/* Financial Stats Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Financial Summary</CardTitle>
              <CardDescription>Your wallet activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <div className="text-gray-500 text-sm">Current Balance</div>
                      <div className="text-2xl font-bold text-primary">{formatCurrency(user.walletBalance)}</div>
                    </div>
                    <Wallet className="h-8 w-8 text-primary opacity-70" />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <div className="text-gray-500 text-sm">Total Deposits</div>
                      <div className="text-xl font-bold text-success">{formatCurrency(totalDeposits)}</div>
                    </div>
                    <ArrowUpCircle className="h-7 w-7 text-success opacity-70" />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <div className="text-gray-500 text-sm">Total Withdrawals</div>
                      <div className="text-xl font-bold text-accent">{formatCurrency(totalWithdrawals)}</div>
                    </div>
                    <ArrowDownCircle className="h-7 w-7 text-accent opacity-70" />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <div className="text-gray-500 text-sm">Game Winnings</div>
                      <div className="text-xl font-bold text-amber-500">{formatCurrency(totalWinnings)}</div>
                    </div>
                    <Trophy className="h-7 w-7 text-amber-500 opacity-70" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                onClick={() => navigate('/wallet')} 
                className="w-full bg-secondary hover:bg-secondary-dark text-primary font-bold"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Add Funds
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Tabs defaultValue="games" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="games">My Games</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Game History</CardTitle>
                <CardDescription>All your game activities</CardDescription>
              </CardHeader>
              <CardContent>
                {isUserGamesLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
                  </div>
                ) : userGames && userGames.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Game ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stake</TableHead>
                        <TableHead>Players</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userGames.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium">#{game.id}</TableCell>
                          <TableCell>
                            <Badge variant={game.status === 'waiting' ? 'outline' : 
                                          game.status === 'in_progress' ? 'default' : 
                                          'success'}>
                              {game.status === 'waiting' ? 'Waiting' : 
                               game.status === 'in_progress' ? 'In Progress' : 
                               'Completed'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(game.stake)}</TableCell>
                          <TableCell>{game.maxPlayers}</TableCell>
                          <TableCell>{new Date(game.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/game/${game.id}`)}
                            >
                              <ArrowRight className="mr-1 h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't played any games yet.</p>
                    <Button 
                      onClick={() => navigate('/')} 
                      className="mt-4 bg-secondary hover:bg-secondary-dark text-primary font-bold"
                    >
                      <Gamepad2 className="mr-2 h-4 w-4" />
                      Find Games
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>All your wallet activities</CardDescription>
              </CardHeader>
              <CardContent>
                {isTransactionsLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {transaction.type === 'deposit' ? (
                                <ArrowUpCircle className="h-4 w-4 text-success mr-2" />
                              ) : transaction.type === 'withdrawal' ? (
                                <ArrowDownCircle className="h-4 w-4 text-accent mr-2" />
                              ) : transaction.type === 'winnings' ? (
                                <Trophy className="h-4 w-4 text-amber-500 mr-2" />
                              ) : (
                                <CreditCard className="h-4 w-4 text-primary mr-2" />
                              )}
                              <span className="capitalize">{transaction.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className={transaction.type === 'withdrawal' || transaction.type === 'stake' ? 'text-accent' : 'text-success'}>
                            {(transaction.type === 'withdrawal' || transaction.type === 'stake') ? '-' : '+'}{formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.status === 'completed' ? 'success' : 
                                          transaction.status === 'pending' ? 'outline' : 
                                          'destructive'}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {transaction.reference.substring(0, 12)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transactions found.</p>
                    <Button 
                      onClick={() => navigate('/wallet')} 
                      className="mt-4 bg-secondary hover:bg-secondary-dark text-primary font-bold"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Add Funds
                    </Button>
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

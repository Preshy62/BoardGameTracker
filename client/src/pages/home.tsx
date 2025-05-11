import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  PlusCircle, 
  Users, 
  DollarSign, 
  Clock, 
  CreditCard, 
  Gamepad2,
  BarChart4,
  Globe2,
  Trophy,
  Wallet
} from "lucide-react";
import Header from "@/components/layout/Header";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Demo deposit mutation (for testing)
  const demoDepositMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/transactions/demo-deposit', {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Demo Funds Added",
        description: `₦10,000 has been added to your wallet for testing.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Demo Deposit Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Redirect to game creation
  const handleCreateGame = () => {
    setLocation('/create-game');
  };

  // Redirect to quick demo game
  const handleQuickDemo = () => {
    setLocation('/demo-new');
  };

  // Redirect to dashboard
  const handleViewDashboard = () => {
    setLocation('/dashboard');
  };

  // Redirect to wallet page
  const handleViewWallet = () => {
    setLocation('/wallet');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-10 md:py-16">
        {/* Welcome Header with User Info */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-12 relative">
          <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 rounded-2xl backdrop-blur-sm border border-primary/10 shadow-sm w-full md:w-auto animate-[fadeIn_0.6s_ease-out]">
            <h1 className="text-4xl font-bold text-primary/90 mb-3">Welcome back, {user.username}</h1>
            <div className="flex flex-wrap items-center gap-3 text-gray-600">
              <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                <Wallet className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">Balance: <span className="font-semibold text-green-600">{formatCurrency(user.walletBalance)}</span></span>
              </div>
              
              <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                <Globe2 className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm">Location: <span className="font-semibold text-gray-700">{user.countryCode || 'Global'}</span></span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0 flex flex-wrap gap-3 md:gap-4 animate-[slideInRight_0.5s_ease-out]">
            <Button 
              onClick={() => demoDepositMutation.mutate()}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 rounded-xl shadow-sm transition-all duration-300 hover:shadow px-4 py-2 h-auto"
              disabled={demoDepositMutation.isPending}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {demoDepositMutation.isPending ? "Adding..." : "Add Demo Funds"}
            </Button>
            
            <Button 
              onClick={handleQuickDemo}
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50 rounded-xl shadow-sm transition-all duration-300 hover:shadow px-4 py-2 h-auto"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Quick Demo
            </Button>
            
            <Button 
              onClick={handleCreateGame}
              className="bg-gradient-to-r from-secondary to-secondary-dark text-primary font-bold rounded-xl shadow-md transition-all duration-300 hover:shadow-lg px-4 py-2 h-auto"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-[fadeIn_0.8s_ease-out]">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden group relative border-none shadow-xl rounded-2xl hover:translate-y-[-5px] transition-all duration-300">
            <div className="absolute top-0 right-0 h-40 w-40 bg-white opacity-5 rounded-full translate-x-10 -translate-y-20 group-hover:translate-x-5 transition-transform duration-700"></div>
            <CardContent className="p-6 z-10 relative">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100">Games Won</p>
                  <h3 className="text-3xl font-bold">0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden group relative border-none shadow-xl rounded-2xl hover:translate-y-[-5px] transition-all duration-300">
            <div className="absolute top-0 right-0 h-40 w-40 bg-white opacity-5 rounded-full translate-x-10 -translate-y-20 group-hover:translate-x-5 transition-transform duration-700"></div>
            <CardContent className="p-6 z-10 relative">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Gamepad2 className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-100">Games Played</p>
                  <h3 className="text-3xl font-bold">0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden group relative border-none shadow-xl rounded-2xl hover:translate-y-[-5px] transition-all duration-300">
            <div className="absolute top-0 right-0 h-40 w-40 bg-white opacity-5 rounded-full translate-x-10 -translate-y-20 group-hover:translate-x-5 transition-transform duration-700"></div>
            <CardContent className="p-6 z-10 relative">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-100">Total Winnings</p>
                  <h3 className="text-3xl font-bold">{formatCurrency(0)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden group relative border-none shadow-xl rounded-2xl hover:translate-y-[-5px] transition-all duration-300">
            <div className="absolute top-0 right-0 h-40 w-40 bg-white opacity-5 rounded-full translate-x-10 -translate-y-20 group-hover:translate-x-5 transition-transform duration-700"></div>
            <CardContent className="p-6 z-10 relative">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Globe2 className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-100">Currency</p>
                  <h3 className="text-3xl font-bold">{user.preferredCurrency || 'NGN'}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-[slideInUp_0.7s_ease-out]">
          <Card className="hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] rounded-xl overflow-hidden border border-blue-100 group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 transition-all duration-500 group-hover:h-2"></div>
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="p-5 bg-blue-100 text-blue-700 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <BarChart4 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-800 group-hover:text-blue-600 transition-colors">View Statistics</h3>
              <p className="text-gray-500 mb-6">
                Check your game history and performance statistics to see your progress over time
              </p>
              <Button 
                onClick={handleViewDashboard}
                className="w-full mt-auto rounded-xl bg-white border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-300 font-medium"
                variant="outline"
              >
                View Dashboard
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] rounded-xl overflow-hidden border-none group bg-gradient-to-br from-secondary/95 to-secondary-dark">
            <CardContent className="p-8 flex flex-col items-center text-center relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -translate-y-20 translate-x-20 group-hover:translate-y-[-10px] transition-transform duration-700"></div>
              <div className="p-5 bg-white/20 text-primary rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm shadow-md z-10">
                <Gamepad2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary z-10">Play Now</h3>
              <p className="text-primary/80 mb-6 z-10">
                Create a new game and invite players to join for an exciting gaming experience
              </p>
              <Button 
                onClick={handleCreateGame}
                className="w-full mt-auto bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-300 z-10"
              >
                Create Game
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] rounded-xl overflow-hidden border border-green-100 group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500 transition-all duration-500 group-hover:h-2"></div>
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="p-5 bg-green-100 text-green-700 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-green-800 group-hover:text-green-600 transition-colors">Manage Wallet</h3>
              <p className="text-gray-500 mb-6">
                Deposit funds or withdraw your winnings to your local bank account
              </p>
              <Button 
                onClick={handleViewWallet}
                className="w-full mt-auto rounded-xl bg-white border-green-500 text-green-600 hover:bg-green-50 transition-all duration-300 font-medium"
                variant="outline"
              >
                Open Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Separator className="my-12 opacity-30" />
        
        {/* How to Play */}
        <div className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg p-10 mb-12 border border-gray-100 animate-[fadeIn_1s_ease-out]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">How to Play Big Boys Game</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Follow these simple steps to join the excitement and win big</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center group relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md z-20">1</div>
              <div className="bg-gradient-to-b from-blue-100 to-blue-50 text-blue-700 rounded-2xl p-5 mb-5 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md relative z-10">
                <DollarSign className="h-10 w-10" />
              </div>
              <div className="h-1 w-full md:w-1/2 bg-dashed-blue absolute top-14 left-full hidden md:block lg:block"></div>
              <h3 className="font-bold text-lg mb-3 text-blue-800">Place Your Stake</h3>
              <p className="text-gray-600">
                Create a game with your desired stake amount or join an existing game room
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center group relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold shadow-md z-20">2</div>
              <div className="bg-gradient-to-b from-purple-100 to-purple-50 text-purple-700 rounded-2xl p-5 mb-5 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md relative z-10">
                <Users className="h-10 w-10" />
              </div>
              <div className="h-1 w-full md:w-1/2 bg-dashed-purple absolute top-14 left-full hidden md:block lg:block"></div>
              <h3 className="font-bold text-lg mb-3 text-purple-800">Wait for Players</h3>
              <p className="text-gray-600">
                Games can host 2-10 players. The game starts automatically when all players are ready
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center group relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold shadow-md z-20">3</div>
              <div className="bg-gradient-to-b from-amber-100 to-amber-50 text-amber-700 rounded-2xl p-5 mb-5 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md relative z-10">
                <Gamepad2 className="h-10 w-10" />
              </div>
              <div className="h-1 w-full md:w-1/2 bg-dashed-amber absolute top-14 left-full hidden md:block"></div>
              <h3 className="font-bold text-lg mb-3 text-amber-800">Roll Your Stone</h3>
              <p className="text-gray-600">
                Take turns rolling your stone. The player who rolls the highest number wins the game!
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center group relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold shadow-md z-20">4</div>
              <div className="bg-gradient-to-b from-green-100 to-green-50 text-green-700 rounded-2xl p-5 mb-5 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md relative z-10">
                <CreditCard className="h-10 w-10" />
              </div>
              <h3 className="font-bold text-lg mb-3 text-green-800">Collect Winnings</h3>
              <p className="text-gray-600">
                Winners automatically receive their share of the pot in their wallet and can withdraw anytime
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              onClick={handleCreateGame}
              className="bg-gradient-to-r from-secondary to-secondary-dark text-primary font-bold px-8 py-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-3px]"
            >
              Start Playing Now
            </Button>
          </div>
        </div>
        
        {/* CSS for dashed lines is in index.css */}
        
        {/* International Features */}
        <Card className="mb-12 overflow-hidden border-none shadow-xl rounded-2xl group animate-[slideInUp_0.9s_ease-out]">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-10 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-50 rounded-full opacity-70"></div>
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-amber-50 rounded-full opacity-70"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Play From Anywhere</h2>
                <p className="text-gray-600 mb-8">
                  Big Boys Game supports players from around the world with multiple currency options and local bank withdrawals for a truly global gaming experience.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-x-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mr-5 shadow-inner">
                      <span className="text-blue-600 font-bold text-xl">₦</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Multi-Currency Support</h3>
                      <p className="text-gray-500">Play with NGN, USD, EUR, GBP and more local currencies</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-x-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mr-5 shadow-inner">
                      <span className="text-green-600 font-bold text-xl">$</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Local Bank Withdrawals</h3>
                      <p className="text-gray-500">Withdraw your winnings directly to your local bank account</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:translate-x-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mr-5 shadow-inner">
                      <span className="text-amber-600 font-bold text-xl">€</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 mb-1">Automatic Conversion</h3>
                      <p className="text-gray-500">Real-time currency conversion for all transactions globally</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 flex flex-col justify-center relative overflow-hidden group-hover:from-blue-700 group-hover:to-indigo-800 transition-all duration-700">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full"></div>
              <div className="absolute top-20 left-20 w-40 h-40 bg-white/5 rounded-full"></div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-6 flex items-center">
                  <span className="mr-3">Your Profile</span>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
                </h2>
                
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-white to-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mr-5 shadow-md">
                      {user.avatarInitials}
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl">{user.username}</h3>
                      <p className="text-white text-opacity-80">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                      <span className="text-white/80">Country:</span>
                      <span className="font-medium px-3 py-1 bg-white/10 rounded-md">{user.countryCode || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                      <span className="text-white/80">Currency:</span>
                      <span className="font-medium px-3 py-1 bg-white/10 rounded-md">{user.preferredCurrency || 'NGN'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                      <span className="text-white/80">Language:</span>
                      <span className="font-medium px-3 py-1 bg-white/10 rounded-md">{user.language || 'English'}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 rounded-lg p-3">
                      <span className="text-white/80">Wallet Balance:</span>
                      <span className="font-medium px-3 py-1 bg-green-500/30 rounded-md text-green-100">{formatCurrency(user.walletBalance)}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setLocation('/dashboard')}
                    className="w-full bg-white text-blue-600 hover:bg-white/90 font-bold rounded-lg py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Update Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
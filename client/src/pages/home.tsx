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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Welcome Header with User Info */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.username}</h1>
            <p className="text-gray-600">
              Your Balance: <span className="font-medium">{formatCurrency(user.walletBalance)}</span> • Location: <span className="font-medium">{user.countryCode || 'Global'}</span>
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button 
              onClick={() => demoDepositMutation.mutate()}
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50"
              disabled={demoDepositMutation.isPending}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Add Demo Funds
            </Button>
            
            <Button 
              onClick={handleQuickDemo}
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              <Gamepad2 className="h-4 w-4 mr-2" />
              Quick Demo
            </Button>
            
            <Button 
              onClick={handleCreateGame}
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </div>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full">
                  <Trophy className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100">Games Won</p>
                  <h3 className="text-2xl font-bold">0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full">
                  <Gamepad2 className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-100">Games Played</p>
                  <h3 className="text-2xl font-bold">0</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full">
                  <Wallet className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-100">Total Winnings</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(0)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full">
                  <Globe2 className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-100">Currency</p>
                  <h3 className="text-2xl font-bold">{user.preferredCurrency || 'NGN'}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="p-4 bg-blue-100 text-blue-700 rounded-full mb-4">
                <BarChart4 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">View Statistics</h3>
              <p className="text-gray-500 mb-4">
                Check your game history and performance statistics
              </p>
              <Button 
                onClick={handleViewDashboard}
                className="w-full mt-auto"
                variant="outline"
              >
                View Dashboard
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="p-4 bg-secondary bg-opacity-20 text-secondary rounded-full mb-4">
                <Gamepad2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Play Now</h3>
              <p className="text-gray-500 mb-4">
                Create a new game and invite players to join
              </p>
              <Button 
                onClick={handleCreateGame}
                className="w-full mt-auto bg-secondary hover:bg-secondary-dark text-primary font-bold"
              >
                Create Game
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="p-4 bg-green-100 text-green-700 rounded-full mb-4">
                <Wallet className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Manage Wallet</h3>
              <p className="text-gray-500 mb-4">
                Deposit funds or withdraw your winnings
              </p>
              <Button 
                onClick={handleViewWallet}
                className="w-full mt-auto"
                variant="outline"
              >
                Open Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Separator className="my-8" />
        
        {/* How to Play */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">How to Play Big Boys Game</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">1. Place Your Stake</h3>
              <p className="text-sm text-gray-600">
                Create a game with your desired stake amount or join an existing game
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 text-purple-700 rounded-full p-4 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">2. Wait for Players</h3>
              <p className="text-sm text-gray-600">
                Games can host 2-10 players. Game starts when all players are ready.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-amber-100 text-amber-700 rounded-full p-4 mb-4">
                <Gamepad2 className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">3. Roll Your Stone</h3>
              <p className="text-sm text-gray-600">
                Take turns rolling your stone. The player with the highest number wins!
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 text-green-700 rounded-full p-4 mb-4">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="font-medium mb-2">4. Collect Winnings</h3>
              <p className="text-sm text-gray-600">
                Winners automatically receive their share of the pot in their wallet
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Button 
              onClick={handleCreateGame}
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
            >
              Start Playing Now
            </Button>
          </div>
        </div>
        
        {/* International Features */}
        <Card className="mb-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-4">Play From Anywhere</h2>
              <p className="text-gray-600 mb-6">
                Big Boys Game supports players from around the world with multiple currency options and local bank withdrawals.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-bold">₦</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Multi-Currency Support</h3>
                    <p className="text-sm text-gray-500">Play with NGN, USD, EUR, GBP and more</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <span className="text-green-600 font-bold">$</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Local Bank Withdrawals</h3>
                    <p className="text-sm text-gray-500">Withdraw your winnings to your local bank</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mr-4">
                    <span className="text-amber-600 font-bold">€</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Automatic Conversion</h3>
                    <p className="text-sm text-gray-500">Real-time currency conversion for all transactions</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center text-xl font-bold mr-4">
                    {user.avatarInitials}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{user.username}</h3>
                    <p className="text-white text-opacity-80">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white text-opacity-80">Country:</span>
                    <span className="font-medium">{user.countryCode || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white text-opacity-80">Currency:</span>
                    <span className="font-medium">{user.preferredCurrency || 'NGN'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white text-opacity-80">Language:</span>
                    <span className="font-medium">{user.language || 'English'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white text-opacity-80">Wallet Balance:</span>
                    <span className="font-medium">{formatCurrency(user.walletBalance)}</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setLocation('/dashboard')}
                  className="w-full mt-6 bg-white text-blue-600 hover:bg-white/90"
                >
                  Update Profile
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
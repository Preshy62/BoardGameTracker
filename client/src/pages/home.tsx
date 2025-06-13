import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Game, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Users, 
  DollarSign, 
  CreditCard, 
  Gamepad2,
  BarChart4,
  Home as HomeIcon,
  Globe2,
  Trophy,
  Wallet,
  Clock,
  Play
} from "lucide-react";
import Header from "@/components/layout/Header";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// Bot Game Interface Component
function BotGameInterface({ onCreateBotGame, onBack, isCreating, user }: {
  onCreateBotGame: (stake: number) => void;
  onBack: () => void;
  isCreating: boolean;
  user: any;
}) {
  const [selectedStake, setSelectedStake] = useState(1000);
  
  const stakeOptions = [
    { value: 500, label: "₦500", winnings: "₦1,250" },
    { value: 1000, label: "₦1,000", winnings: "₦2,500" },
    { value: 2500, label: "₦2,500", winnings: "₦6,250" },
    { value: 5000, label: "₦5,000", winnings: "₦12,500" },
    { value: 10000, label: "₦10,000", winnings: "₦25,000" },
    { value: 20000, label: "₦20,000", winnings: "₦50,000" },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        onClick={onBack}
        variant="outline"
        className="mb-4"
      >
        ← Back to Game Selection
      </Button>

      {/* Bot Game Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-8 text-center">
          <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl font-bold mb-2">Play Against Bot</h1>
          <p className="text-lg opacity-90">Test your luck against our intelligent bot!</p>
        </CardContent>
      </Card>

      {/* Game Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center p-4">
          <div className="text-2xl mb-2">🎯</div>
          <h3 className="font-bold">45% Win Chance</h3>
          <p className="text-sm text-gray-600">Fair odds against the bot</p>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl mb-2">⭐</div>
          <h3 className="font-bold">Special Multipliers</h3>
          <p className="text-sm text-gray-600">2x for 500/1000 stones</p>
        </Card>
        <Card className="text-center p-4">
          <div className="text-2xl mb-2">💎</div>
          <h3 className="font-bold">Super Multipliers</h3>
          <p className="text-sm text-gray-600">3x for 3355/6624 stones</p>
        </Card>
      </div>

      {/* Stake Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Stake</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stakeOptions.map((option) => (
              <Button
                key={option.value}
                onClick={() => setSelectedStake(option.value)}
                variant={selectedStake === option.value ? "default" : "outline"}
                className={`h-16 flex flex-col ${
                  selectedStake === option.value 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "hover:bg-purple-50"
                }`}
                disabled={user.walletBalance < option.value}
              >
                <span className="font-bold">{option.label}</span>
                <span className="text-xs opacity-75">Win: {option.winnings}</span>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span>Your Balance:</span>
              <span className="font-bold">{formatCurrency(user.walletBalance, user.preferredCurrency || 'NGN')}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Selected Stake:</span>
              <span className="font-bold text-purple-600">{formatCurrency(selectedStake, user.preferredCurrency || 'NGN')}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Potential Win:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(selectedStake * 2.5, user.preferredCurrency || 'NGN')}
              </span>
            </div>
          </div>

          <Button
            onClick={() => onCreateBotGame(selectedStake)}
            disabled={isCreating || user.walletBalance < selectedStake}
            className="w-full mt-6 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg"
          >
            {isCreating ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creating Game...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Start Bot Game
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isBotGameMode, setIsBotGameMode] = useState(false);


  // Fetch available games
  const { data: availableGames = [], isLoading: gamesLoading, error: gamesError } = useQuery({
    queryKey: ['/api/games/available'],
    refetchInterval: false, // Disable automatic refresh to prevent flickering
    staleTime: 60000, // Keep data fresh for 1 minute
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
  });

  // Fetch user's games for statistics
  const { data: userGames } = useQuery<Game[]>({
    queryKey: ["/api/games/user"],
    enabled: !!user,
  });

  // Fetch user's transactions for statistics
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Calculate real user statistics with proper filtering
  const totalGamesPlayed = userGames?.filter(game => 
    game.status === "completed" || game.status === "in_progress"
  ).length || 0;
  
  const completedGames = userGames?.filter(game => game.status === "completed") || [];
  
  const gamesWon = completedGames.filter(game => {
    if (!user?.id || !game.winnerIds) return false;
    
    // Handle array format
    if (Array.isArray(game.winnerIds)) {
      return game.winnerIds.includes(user.id);
    }
    
    // Handle string format (JSON array)
    if (typeof game.winnerIds === 'string') {
      try {
        const parsed = JSON.parse(game.winnerIds);
        return Array.isArray(parsed) && parsed.includes(user.id);
      } catch {
        return false;
      }
    }
    
    // Handle single winner ID (legacy format)
    if (typeof game.winnerIds === 'number') {
      return game.winnerIds === user.id;
    }
    
    return false;
  }).length;
  
  const totalWinnings = transactions?.filter(t => 
    (t.type === "winnings" || t.type === "lottery_win") && 
    t.status === "completed" &&
    t.amount > 0
  ).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;

  // Ensure proper typing for games
  const games = Array.isArray(availableGames) ? availableGames : [];

  // Debug logging
  console.log('Available games data:', availableGames);
  console.log('Games array:', games);
  console.log('Games loading:', gamesLoading);
  console.log('Games error:', gamesError);
  console.log('User data:', user);
  console.log('Is user logged in:', !!user);
  
  // Statistics debug logging
  console.log('Statistics calculation debug:');
  console.log('- User games:', userGames?.length || 0);
  console.log('- Total games played:', totalGamesPlayed);
  console.log('- Completed games:', completedGames.length);
  console.log('- Games won:', gamesWon);
  console.log('- Transactions:', transactions?.length || 0);
  console.log('- Total winnings:', totalWinnings);
  
  // Function to go to landing page
  const goToHome = () => {
    setLocation('/landing');
  };
  
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

  // Bot game creation mutation
  const createBotGameMutation = useMutation({
    mutationFn: async (stake: number) => {
      const response = await apiRequest('POST', '/api/games', {
        maxPlayers: 2,
        stake: stake,
        voiceChatEnabled: false,
        textChatEnabled: true,
        currency: user?.preferredCurrency || 'NGN',
        playWithBot: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bot Game Created!",
        description: "Starting your game against the bot...",
      });
      
      // Invalidate cache to refresh game data
      queryClient.invalidateQueries({ queryKey: ['/api/games/available'] });
      
      // Bot game created successfully - go directly to the regular game page
      window.location.href = `/game/${data.id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Bot Game",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });


  // Join game mutation
  const joinGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await apiRequest('POST', `/api/games/${gameId}/join`, {});
      return response.json();
    },
    onSuccess: (data, gameId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games/available'] });
      toast({
        title: "Game Joined!",
        description: "Successfully joined the game. Redirecting...",
      });
      setLocation(`/game/${gameId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Join Game",
        description: error.message || "Could not join the game",
        variant: "destructive",
      });
    },
  });

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

  // If in bot game mode, show bot game interface
  if (isBotGameMode) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <BotGameInterface
            onCreateBotGame={(stake) => createBotGameMutation.mutate(stake)}
            onBack={() => setIsBotGameMode(false)}
            isCreating={createBotGameMutation.isPending}
            user={user}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Welcome Header with User Info */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start">
            <div className="w-full lg:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-2">Welcome, {user.username}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 mr-1 text-green-500" />
                  <span className="text-sm sm:text-base text-gray-600">Balance: <span className="font-semibold text-green-600">{formatCurrency(user.walletBalance, user.preferredCurrency || 'NGN')}</span></span>
                </div>
                <div className="flex items-center">
                  <Globe2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 text-blue-500" />
                  <span className="text-sm sm:text-base text-gray-600">Location: <span className="font-semibold">{user.countryCode || 'Global'}</span></span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row w-full lg:w-auto gap-2">
              <Button 
                onClick={handleQuickDemo}
                variant="outline"
                className="border-purple-500 text-purple-600"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Quick Demo
              </Button>
              
              <Button 
                onClick={goToHome}
                variant="outline"
                className="border-blue-500 text-blue-600"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Home
              </Button>
              
              <Button 
                onClick={() => setIsBotGameMode(true)}
                variant="outline"
                className="border-purple-500 text-purple-600"
              >
                <Gamepad2 className="h-4 w-4 mr-2" />
                Play vs Bot
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
        </div>
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-blue-500 text-white">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="mb-2 sm:mb-0 sm:mr-4 p-2 sm:p-3 bg-white bg-opacity-20 rounded-full w-fit">
                  <Trophy className="h-4 w-4 sm:h-6 sm:w-6"/>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-100">Games Won</p>
                  <h3 className="text-lg sm:text-2xl font-bold">{gamesWon}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full">
                  <Gamepad2 className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-100">Games Played</p>
                  <h3 className="text-2xl font-bold">{totalGamesPlayed}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-white bg-opacity-20 rounded-full">
                  <Wallet className="h-6 w-6"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-100">Total Winnings</p>
                  <h3 className="text-2xl font-bold">{formatCurrency(totalWinnings, user.preferredCurrency || 'NGN')}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-amber-500 text-white">
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
        
        {/* Debug Info */}
        <Card className="mb-4 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>Games Count: {games.length}</p>
            <p>Loading: {gamesLoading ? 'Yes' : 'No'}</p>
            <p>User Logged In: {user ? 'Yes' : 'No'}</p>
            <p>User ID: {user?.id || 'None'}</p>
          </CardContent>
        </Card>

        {/* Regular Games */}
        <div>

            {/* Available Games Section */}
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Available Games
                  <Badge variant="secondary">{games.length}</Badge>
                </CardTitle>
              </CardHeader>
          <CardContent>
            {gamesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available games...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No games available to join right now.</p>
                <Button onClick={handleCreateGame} className="bg-secondary text-primary font-bold">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create First Game
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {games.map((game: any) => {
                  // Check if this is a bot game (has a Computer player or status is in_progress with 2 players)
                  const isBotGame = game.status === 'in_progress' && game.maxPlayers === 2;
                  
                  return (
                  <Card key={game.id} className={`border-2 hover:border-primary transition-colors ${isBotGame ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200' : ''}`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <div>
                          <h3 className="font-bold text-base sm:text-lg">
                            Game #{game.id}
                            {isBotGame && <span className="text-purple-600 text-xs sm:text-sm ml-1">(vs Bot)</span>}
                          </h3>
                          <p className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(game.stake, game.currency || user.preferredCurrency || 'NGN')}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${isBotGame ? 'text-purple-600 border-purple-600' : 'text-green-600 border-green-600'}`}>
                          <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                          {isBotGame ? 'Bot Ready' : 'Waiting'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Players:</span>
                          <span className="font-medium">1/{game.maxPlayers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Pot:</span>
                          <span className="font-bold text-green-600">{formatCurrency(game.stakePot, game.currency || user.preferredCurrency || 'NGN')}</span>
                        </div>
                        {game.voiceChatEnabled && (
                          <div className="flex items-center text-sm text-purple-600">
                            <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                            Voice Chat Enabled
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => {
                          if (isBotGame) {
                            // For bot games, go directly to the game page with session handling
                            window.location.href = `/game/${game.id}`;
                          } else {
                            joinGameMutation.mutate(game.id);
                          }
                        }}
                        disabled={joinGameMutation.isPending}
                        className={`w-full font-bold ${isBotGame ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'bg-primary hover:bg-primary-dark text-white'}`}
                      >
                        {joinGameMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Joining...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            {isBotGame ? 'Play Bot Game' : 'Join Game'}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full p-3 sm:p-4 mx-auto mb-3 sm:mb-4 w-12 sm:w-16">
                <BarChart4 className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">View Statistics</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
                Check your game history and performance statistics
              </p>
              <Button 
                onClick={handleViewDashboard}
                className="w-full"
                variant="outline"
                size="sm"
              >
                View Dashboard
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full p-3 sm:p-4 mx-auto mb-3 sm:mb-4 w-12 sm:w-16">
                <Users className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Multiplayer Game</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
                Create a game and invite other players to join
              </p>
              <Button 
                onClick={handleCreateGame}
                className="w-full bg-secondary text-primary font-bold"
                size="sm"
              >
                Create Multiplayer
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="bg-purple-100 text-purple-700 rounded-full p-3 sm:p-4 mx-auto mb-3 sm:mb-4 w-12 sm:w-16">
                <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Single Player</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
                Play instantly against our intelligent bot
              </p>
              <Button 
                onClick={() => setIsBotGameMode(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                size="sm"
              >
                Play vs Bot
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="bg-green-100 text-green-700 rounded-full p-3 sm:p-4 mx-auto mb-3 sm:mb-4 w-12 sm:w-16">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Manage Wallet</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
                Deposit funds or withdraw your winnings
              </p>
              <Button 
                onClick={handleViewWallet}
                className="w-full"
                variant="outline"
                size="sm"
              >
                Open Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Separator className="my-8" />
        
        {/* How to Play */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">How to Play Big Boys Game</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center border border-blue-100 rounded-lg p-4">
              <div className="bg-blue-100 text-blue-700 rounded-full p-4 mx-auto mb-4 w-16">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="font-bold mb-2">1. Place Your Stake</h3>
              <p className="text-gray-600">
                Create a game with your desired stake amount or join an existing game
              </p>
            </div>
            
            <div className="text-center border border-purple-100 rounded-lg p-4">
              <div className="bg-purple-100 text-purple-700 rounded-full p-4 mx-auto mb-4 w-16">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-bold mb-2">2. Wait for Players</h3>
              <p className="text-gray-600">
                Games can host 2-10 players. Game starts when all players are ready
              </p>
            </div>
            
            <div className="text-center border border-amber-100 rounded-lg p-4">
              <div className="bg-amber-100 text-amber-700 rounded-full p-4 mx-auto mb-4 w-16">
                <Gamepad2 className="h-8 w-8" />
              </div>
              <h3 className="font-bold mb-2">3. Roll Your Stone</h3>
              <p className="text-gray-600">
                Take turns rolling your stone. The player with the highest number wins!
              </p>
            </div>
            
            <div className="text-center border border-green-100 rounded-lg p-4">
              <div className="bg-green-100 text-green-700 rounded-full p-4 mx-auto mb-4 w-16">
                <CreditCard className="h-8 w-8" />
              </div>
              <h3 className="font-bold mb-2">4. Collect Winnings</h3>
              <p className="text-gray-600">
                Winners automatically receive their share of the pot in their wallet
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Button 
              onClick={handleCreateGame}
              className="bg-secondary text-primary font-bold px-8"
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
            
            <div className="bg-blue-600 text-white p-8 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
              <div className="bg-white/10 rounded-lg p-6">
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
                    <span className="font-medium">{formatCurrency(user.walletBalance, user.preferredCurrency || 'NGN')}</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setLocation('/dashboard')}
                  className="w-full mt-6 bg-white text-blue-600"
                >
                  Update Profile
                </Button>
              </div>
            </div>
          </div>
        </Card>
        </div>
      </main>
    </div>
  );
}
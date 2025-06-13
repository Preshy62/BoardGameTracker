import React from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gamepad2, Loader2, Gift, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Game, GamePlayer, Message, User } from "@shared/schema";

// Use the beautiful casino-style game board
import CleanGameBoardNew from "@/components/game/CleanGameBoardNew";

export default function BotGamePage() {
  const [match, params] = useRoute("/bot-game/:id");
  const [, setLocation] = useLocation();
  
  const gameId = params?.id ? parseInt(params.id) : null;

  // Fetch lottery status to show notifications
  const { data: lotteryStatus } = useQuery<{
    enabled: boolean;
    multiplier: string;
    multiplierValue: number;
  }>({
    queryKey: ["/api/admin/lottery/multiplier"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch game data with enhanced session handling for bot games
  const { data: gameData, isLoading: gameDataLoading, error, refetch } = useQuery<{
    game: Game;
    players: (GamePlayer & { user: User })[];
    messages: Message[];
  }>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
    retry: 10, // More retries for bot games
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Auto-retry mechanism with exponential backoff
  React.useEffect(() => {
    if (error && gameId) {
      console.log('Bot game loading failed, retrying in 2 seconds...');
      const retryTimer = setTimeout(() => {
        refetch();
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, gameId, refetch]);

  // If there's an error, try a direct refresh approach
  const shouldRefresh = error && !gameDataLoading;

  const game = gameData?.game;
  const players = gameData?.players || [];
  const messages = gameData?.messages || [];

  const handleBackToHome = () => {
    setLocation('/');
  };

  if (!gameId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Game</h1>
            <p className="mb-4">This game could not be found.</p>
            <Button onClick={() => setLocation('/')}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (gameDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
            <p className="text-white">Loading your bot game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - show more helpful message
  if (error || (!game && !gameDataLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Session Issue</h1>
            <p className="mb-4">Please return to the home page and try creating a new bot game.</p>
            <p className="mb-4 text-sm text-gray-600">Your previous bot game was created successfully but there's a session loading issue.</p>
            <Button onClick={() => setLocation('/')}>
              Return Home & Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find current player (assume first non-bot player)
  const currentPlayer = players.find(p => p.user.username !== "Computer") || players[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleBackToHome}
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back Home
              </Button>
              <div className="flex items-center space-x-2">
                <Gamepad2 className="h-6 w-6 text-purple-400" />
                <h1 className="text-xl font-bold text-white">Bot Game #{gameId}</h1>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-purple-600 text-white">
              🤖 Playing Against Bot
            </Badge>
          </div>
        </div>
      </div>

      {/* Monthly Lottery Notification Banner */}
      {lotteryStatus?.enabled && (
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border-b border-yellow-400/20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center space-x-3 text-white">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <Gift className="h-5 w-5" />
              <span className="font-bold text-lg">
                🎉 MONTHLY LOTTERY ACTIVE! {lotteryStatus.multiplier.toUpperCase()} MULTIPLIER ON SPECIAL STONES! 🎉
              </span>
              <Gift className="h-5 w-5" />
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div className="text-center text-yellow-100 text-sm mt-1">
              Special stones (500, 1000, 3355, 6624) now pay {lotteryStatus.multiplier} extra this month!
            </div>
          </div>
        </div>
      )}

      {/* Use the beautiful casino-style game board */}
      <CleanGameBoardNew 
        gameId={gameId}
        players={players}
        currentPlayer={currentPlayer}
        game={game}
        messages={messages}
      />
    </div>
  );
}
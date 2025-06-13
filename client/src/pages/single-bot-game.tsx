import React from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gamepad2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Game, GamePlayer, Message, User } from "@shared/schema";

// Use the beautiful casino-style game board
import CleanGameBoardNew from "@/components/game/CleanGameBoardNew";

export default function SingleBotGamePage() {
  const [match, params] = useRoute("/single-bot-game/:id");
  const [, setLocation] = useLocation();
  
  const gameId = params?.id ? parseInt(params.id) : null;

  // Fetch game data with enhanced retry and error handling for bot games
  const { data: gameData, isLoading: gameDataLoading, error, refetch } = useQuery<{
    game: Game;
    players: (GamePlayer & { user: User })[];
    messages: Message[];
  }>({
    queryKey: ["/api/games", gameId],
    enabled: !!gameId,
    retry: 5,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 0,
  });

  // Auto-retry on mount if there's an error
  React.useEffect(() => {
    if (error && gameId) {
      const timer = setTimeout(() => {
        console.log('Auto-retrying bot game data fetch...');
        refetch();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, gameId, refetch]);

  const game = gameData?.game;
  const players = gameData?.players || [];
  const messages = gameData?.messages || [];

  const handleBackToHome = () => {
    setLocation('/');
  };

  // Loading state - Mobile Responsive
  if (gameDataLoading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Card>
          <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-blue-500" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Loading Bot Game...</h2>
            <p className="text-sm sm:text-base text-gray-600">Setting up your game against the bot</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state with auto-retry message - Mobile Responsive
  if (error || !game) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <Card>
          <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
            <div className="animate-pulse mb-3 sm:mb-4">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2 text-blue-500" />
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-3 sm:mb-4">Loading Bot Game...</h1>
            <p className="text-sm sm:text-base mb-3 sm:mb-4">Your bot game was created successfully! Attempting to load the game board...</p>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Auto-retrying in case of session sync issues...</p>
            <Button onClick={handleBackToHome} className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
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
      {/* Header with Bot Game Branding - Mobile Responsive */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 sm:p-4 shadow-lg">
        <div className="container mx-auto">
          {/* Mobile: Stack elements vertically */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button 
                onClick={handleBackToHome}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
                <span className="sm:hidden">←</span>
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8" />
                <div>
                  <h1 className="text-sm sm:text-lg lg:text-xl font-bold">Single Player Bot Game</h1>
                  <p className="text-xs sm:text-sm opacity-90">Game #{game.id} • Stake: ₦{game.stake.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-100 border-purple-300/20 text-xs sm:text-sm px-2 py-1">
                Bot Multipliers Active
              </Badge>
              <Badge variant="secondary" className="bg-pink-500/20 text-pink-100 border-pink-300/20 text-xs sm:text-sm px-2 py-1">
                {game.status === 'in_progress' ? 'Playing' : 'Waiting'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Game Info Panel - Mobile Responsive */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-300/20 mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 text-center">
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-100 mb-1 sm:mb-2">Game Type</h3>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Single Player vs Bot</p>
                <p className="text-xs sm:text-sm text-purple-200">25% Win Chance</p>
              </div>
              
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-100 mb-1 sm:mb-2">Special Multipliers</h3>
                <p className="text-sm sm:text-lg lg:text-xl font-bold text-yellow-400">500 Stones: 2x</p>
                <p className="text-sm sm:text-lg lg:text-xl font-bold text-yellow-400">1000 Stones: 3x</p>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-1">
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-100 mb-1 sm:mb-2">Potential Winnings</h3>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">
                  ₦{(game.stake * 2.5).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-green-200">Base payout + multipliers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Board - Same beautiful design as multiplayer */}
        {game && currentPlayer && (
          <CleanGameBoardNew 
            gameId={game.id}
            game={game}
            players={players}
            messages={messages}
            currentPlayer={currentPlayer}
          />
        )}
      </div>
    </div>
  );
}
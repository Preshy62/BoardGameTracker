import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { MultiplayerGameBoard } from '@/components/game/MultiplayerGameBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

interface GameResponse {
  game: Game;
  players: (GamePlayer & { user: { username: string; avatarInitials: string } })[];
  messages: Message[];
}

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<GameResponse>({
    queryKey: ['/api/games', id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex items-center justify-center">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Game Not Found</h2>
            <p className="text-yellow-300 mb-6 text-lg">The game you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { game, players, messages } = data;
  const currentPlayer = players.find(p => p.userId === user?.id);

  if (!user) return null;

  // Only show game if user is a player
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">🚫 Game Access Denied</h2>
            <p className="text-yellow-300 mb-6 text-lg">You are not a player in this game.</p>
            <Button onClick={() => setLocation("/")} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show the beautiful animated game board for all players
  return (
    <MultiplayerGameBoard
      gameId={game.id}
      players={players}
      currentPlayer={currentPlayer}
      game={game}
      messages={messages}
    />
  );
}
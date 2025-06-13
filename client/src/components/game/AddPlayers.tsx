import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Game } from '@shared/schema';

interface AddPlayersProps {
  game: Game;
  currentUserId: number;
}

export function AddPlayers({ game, currentUserId }: AddPlayersProps) {
  const copyGameLink = () => {
    const gameUrl = `${window.location.origin}/game/${game.id}`;
    navigator.clipboard.writeText(gameUrl);
    // You could add a toast notification here
  };

  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <Users className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">Invite Players</span>
      </div>
      <p className="text-xs text-blue-600 mb-3">
        Share this game link with other players to join
      </p>
      <Button
        onClick={copyGameLink}
        variant="outline"
        size="sm"
        className="w-full text-blue-600 border-blue-300 hover:bg-blue-100"
      >
        Copy Game Link
      </Button>
    </div>
  );
}
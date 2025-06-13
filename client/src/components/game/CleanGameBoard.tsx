import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, MessageSquare, Send, X } from 'lucide-react';
import { Game, GamePlayer, Message, User } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import GameStone from './GameStone';
import ProfessionalVoiceChat from './ProfessionalVoiceChat';
import { useResponsiveStoneSize } from '@/hooks/useResponsiveStoneSize';

interface CleanGameBoardProps {
  gameId: number;
  players: (GamePlayer & { user: User })[];
  currentPlayer: GamePlayer & { user: User };
  game: Game;
  messages: Message[];
}

export default function CleanGameBoard({ 
  gameId, 
  players, 
  currentPlayer, 
  game, 
  messages 
}: CleanGameBoardProps) {
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const stoneSize = useResponsiveStoneSize();

  // Track unread messages
  useEffect(() => {
    if (!isChatOpen) {
      setUnreadCount(messages.length);
    } else {
      setUnreadCount(0);
    }
  }, [messages, isChatOpen]);

  const rollMutation = useMutation({
    mutationFn: async (stoneNumber: number) => {
      const response = await apiRequest('POST', `/api/games/${gameId}/roll`, { stoneNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      setIsRolling(false);
      setSelectedStone(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsRolling(false);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/games/${gameId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      setNewMessage('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStoneClick = (stoneNumber: number) => {
    if (game.status !== 'active' || currentPlayer.rolledNumber !== null) return;
    setSelectedStone(stoneNumber);
  };

  const handleRoll = () => {
    if (!selectedStone || isRolling) return;
    setIsRolling(true);
    rollMutation.mutate(selectedStone);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const stoneNumbers = [
    1, 3, 4, 5, 7, 8, 11, 12, 13, 14, 16, 19, 20, 21, 22, 26, 27, 28, 29, 30, 32, 37, 40, 43, 44, 64, 65, 71, 81, 82, 91, 99, 100, 101, 105
  ];

  const individualStones = [33, 55, 66, 24];
  const specialStones = [500];
  const superStones = [1000];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Game Area */}
          <div className="flex-1">
            {/* Game Board */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold text-gray-800">
                  Big Boys Game - Clean Board
                </CardTitle>
                <CardDescription className="text-center">
                  Select a stone and roll to play
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Main Stones Grid */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {stoneNumbers.map((number) => (
                    <GameStone
                      key={number}
                      number={number}
                      isRolling={isRolling}
                      isSelected={selectedStone === number}
                      isWinner={game.winningNumber === number}
                      onClick={() => handleStoneClick(number)}
                    />
                  ))}
                </div>

                {/* Individual Stones */}
                <div className="flex justify-center gap-4 mb-4">
                  {individualStones.map((number) => (
                    <GameStone
                      key={`individual-${number}`}
                      number={number}
                      isRolling={isRolling}
                      isSelected={selectedStone === number}
                      isSmall={true}
                      id={`individual-${number}`}
                      onClick={() => handleStoneClick(number)}
                    />
                  ))}
                </div>

                {/* Special Stones */}
                <div className="flex justify-center gap-4 mb-4">
                  {specialStones.map((number) => (
                    <GameStone
                      key={`special-${number}`}
                      number={number}
                      isRolling={isRolling}
                      isSelected={selectedStone === number}
                      isSpecial={true}
                      onClick={() => handleStoneClick(number)}
                    />
                  ))}
                </div>

                {/* Super Stones */}
                <div className="flex justify-center gap-4">
                  {superStones.map((number) => (
                    <GameStone
                      key={`super-${number}`}
                      number={number}
                      isRolling={isRolling}
                      isSelected={selectedStone === number}
                      isSuper={true}
                      onClick={() => handleStoneClick(number)}
                    />
                  ))}
                </div>

                {/* Roll Button */}
                {game.status === 'active' && currentPlayer.rolledNumber === null && (
                  <div className="text-center mt-6">
                    <Button
                      onClick={handleRoll}
                      disabled={!selectedStone || isRolling}
                      size="lg"
                      className="px-8 py-3 text-lg font-bold"
                    >
                      {isRolling ? 'Rolling...' : 'Roll Selected Stone'}
                    </Button>
                  </div>
                )}

                {/* Game Status */}
                {game.status === 'completed' && (
                  <div className="text-center mt-6 p-4 bg-green-100 rounded-lg border border-green-300">
                    <h3 className="text-xl font-bold text-green-800 mb-2">🎉 Game Complete!</h3>
                    <p className="text-green-700">
                      Winning Stone: <span className="font-bold">{game.winningNumber}</span>
                    </p>
                    {game.winnerIds && Array.isArray(game.winnerIds) && (
                      <p className="text-green-700 mt-1">
                        Winners: {players
                          .filter(p => game.winnerIds && game.winnerIds.includes(p.userId))
                          .map(p => p.user.username)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Players */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Players ({players.length}/{game.maxPlayers})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{player.user.username}</p>
                        <p className="text-sm text-gray-600">
                          {player.rolledNumber !== null ? `Rolled: ${player.rolledNumber}` : "Waiting to roll..."}
                        </p>
                      </div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {player.user.avatarInitials}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Professional Voice Chat for higher stakes */}
            {game.stake >= 20000 && (
              <ProfessionalVoiceChat 
                game={game}
                players={players}
                currentUserId={currentPlayer.userId}
              />
            )}
          </div>
        </div>
      </div>

      {/* Notification Badge for Header */}
      {unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="destructive" className="animate-pulse">
            <Bell className="h-3 w-3 mr-1" />
            {unreadCount} new message{unreadCount > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Floating Chat Button - Always Visible */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        <div className="relative">
          <MessageSquare className="h-6 w-6 text-white" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </Button>

      {/* Chat Modal */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Game Chat
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-64 w-full rounded border p-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 text-sm">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600">
                          {message.user.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
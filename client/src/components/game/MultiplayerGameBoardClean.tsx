import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  Volume2, 
  VolumeX,
  Crown,
  Trophy,
  Star,
  Target,
  Zap,
  Sparkles,
  Send,
  Bell
} from 'lucide-react';
import { User, Game, GamePlayer, Message } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import GameStone from './GameStone';
import ProfessionalVoiceChat from './ProfessionalVoiceChat';
import { playBackgroundMusic, stopAllMusic, playSound } from '@/lib/audio';

interface MultiplayerGameBoardProps {
  gameId: number;
  players: (GamePlayer & { user: User })[];
  currentPlayer: GamePlayer & { user: User };
  game: Game;
  messages: Message[];
}

export default function MultiplayerGameBoard({ 
  gameId, 
  players, 
  currentPlayer, 
  game, 
  messages 
}: MultiplayerGameBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Game state
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [rollingStoneIndex, setRollingStoneIndex] = useState<number | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [currentMusic, setCurrentMusic] = useState<string | null>(null);

  // Floating chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if player has already rolled
  useEffect(() => {
    setHasRolled(currentPlayer?.rolledNumber !== null);
  }, [currentPlayer?.rolledNumber]);

  // Update unread count when messages change
  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages.length, isChatOpen]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Chat mutation for sending messages
  const chatMutation = useMutation({
    mutationFn: async ({ gameId, content }: { gameId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/message`, { content });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      setNewMessage('');
    },
  });

  // Send message function
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    chatMutation.mutate({ gameId, content: newMessage.trim() });
  };

  // Define stones configuration
  const stones = useMemo(() => [
    { number: 1, isSpecial: false },
    { number: 2, isSpecial: false },
    { number: 3, isSpecial: false },
    { number: 4, isSpecial: false },
    { number: 5, isSpecial: false },
    { number: 6, isSpecial: false },
  ], []);

  const specialStones = useMemo(() => [
    { number: 500, isSpecial: true, id: 'special-500' },
    { number: 1000, isSpecial: true, id: 'special-1000' },
  ], []);

  const superStones = useMemo(() => [
    { number: 3355, isSuper: true, id: 'super-3355' },
    { number: 6624, isSuper: true, id: 'super-6624' },
  ], []);

  // Roll stone mutation
  const rollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/games/${gameId}/roll`);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsRolling(true);
      setHasRolled(true);
      setRollingStoneIndex(data.rolledNumber);
      
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      
      toast({
        title: "Stone Rolled!",
        description: `You rolled ${data.rolledNumber}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Roll Failed",
        description: error.message || "Failed to submit your roll",
        variant: "destructive",
      });
      setIsRolling(false);
      setHasRolled(false);
    },
  });

  // Check if all players have rolled
  const allPlayersRolled = players.every(p => p.rolledNumber !== null);
  const gameComplete = game.status === 'completed';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Board - Takes up most space */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Game #{game.id} - Big Boys Game
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMusicEnabled(!musicEnabled)}
                  >
                    {musicEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <Badge variant="secondary">
                    {game.currency} {game.stake.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Game Board */}
              <div className="bg-gradient-to-br from-green-800 via-green-700 to-green-900 rounded-lg p-8 min-h-[500px] relative overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-16 h-16 border-2 border-yellow-400 rounded-full"></div>
                  <div className="absolute top-4 right-4 w-12 h-12 border-2 border-yellow-400 rounded-full"></div>
                  <div className="absolute bottom-4 left-4 w-20 h-20 border-2 border-yellow-400 rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-14 h-14 border-2 border-yellow-400 rounded-full"></div>
                </div>

                {/* Main Stones (1-6) */}
                <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
                  {stones.map((stone, index) => (
                    <GameStone
                      key={stone.number}
                      number={stone.number}
                      isRolling={isRolling && rollingStoneIndex === stone.number}
                      isWinner={gameComplete && game.winningNumber === stone.number}
                    />
                  ))}
                </div>

                {/* Special Stones Row */}
                <div className="flex justify-center gap-8 mb-6 relative z-10">
                  {specialStones.map((stone) => (
                    <GameStone
                      key={stone.id}
                      number={stone.number}
                      isRolling={isRolling && rollingStoneIndex === stone.number}
                      isWinner={gameComplete && game.winningNumber === stone.number}
                    />
                  ))}
                </div>

                {/* Super Stones Row */}
                <div className="flex justify-center gap-8 relative z-10">
                  {superStones.map((stone) => (
                    <GameStone
                      key={stone.id}
                      number={stone.number}
                      isRolling={isRolling && rollingStoneIndex === stone.number}
                      isWinner={gameComplete && game.winningNumber === stone.number}
                    />
                  ))}
                </div>

                {/* Roll Button */}
                <div className="flex justify-center mt-8 relative z-10">
                  <Button
                    size="lg"
                    onClick={() => rollMutation.mutate()}
                    disabled={hasRolled || isRolling || rollMutation.isPending || gameComplete}
                    className={`
                      px-8 py-4 text-lg font-bold transform transition-all duration-300
                      ${isRolling ? 'animate-pulse scale-110' : 'hover:scale-105'}
                      ${hasRolled ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}
                      text-white border-2 border-yellow-400 shadow-lg
                    `}
                  >
                    {isRolling ? (
                      <>
                        🌀 ROLLING...
                      </>
                    ) : hasRolled ? (
                      <>
                        ✅ ROLLED
                      </>
                    ) : (
                      <>
                        🎲 ROLL STONE
                      </>
                    )}
                  </Button>
                </div>

                {/* Winner announcement */}
                {gameComplete && game.winningNumber && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
                    <div className="text-center text-white">
                      <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
                      <h2 className="text-4xl font-bold mb-2">🎉 WINNER! 🎉</h2>
                      <p className="text-xl">Winning Stone: {game.winningNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Game Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant={game.status === 'completed' ? 'default' : 'secondary'}>
                  {game.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stake:</span>
                <span className="font-semibold">{game.currency} {game.stake.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Pot:</span>
                <span className="font-semibold text-green-600">{game.currency} {game.stakePot.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Players:</span>
                <span>{players.length}/{game.maxPlayers}</span>
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        {player.user.avatarInitials}
                      </div>
                      <span className="font-medium">{player.user.username}</span>
                      {player.userId === currentPlayer.userId && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div>
                      {player.rolledNumber !== null ? (
                        <Badge variant="default">{player.rolledNumber}</Badge>
                      ) : (
                        <Badge variant="outline">Waiting</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Professional Voice Chat for higher stakes */}
          {game.stake >= 20000 && (
            <ProfessionalVoiceChat game={game} players={players} currentUserId={currentPlayer.userId} />
          )}
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
            <ScrollArea className="h-80 w-full border rounded-md p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs text-gray-400">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const player = players.find(p => p.userId === message.userId);
                    return (
                      <div key={message.id} className="flex gap-2 text-sm">
                        {player && (
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {player.user.avatarInitials}
                          </div>
                        )}
                        <div className="flex-1">
                          {player && (
                            <div className="font-medium text-gray-900 mb-1">
                              {player.user.username}
                            </div>
                          )}
                          <div className="text-gray-700">{message.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!newMessage.trim() || chatMutation.isPending}
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
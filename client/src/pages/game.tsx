import React, { useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Users, DollarSign, Clock, MessageSquare, Send, Bell, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency } from '@/lib/utils';
import { Game, GamePlayer, Message, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import CleanGameBoardNew from '@/components/game/CleanGameBoardNew';
import ProfessionalVoiceChat from '@/components/game/ProfessionalVoiceChat';

interface GameResponse {
  game: Game;
  players: (GamePlayer & { user: User })[];
  messages: Message[];
}

// Winner Modal Component
function WinnerModal({ game, players, onClose }: { game: any, players: any[], onClose: () => void }) {
  // Deep male voice announcement
  useEffect(() => {
    const announceWinner = () => {
      if ('speechSynthesis' in window) {
        const winners = players.filter(p => game.winnerIds?.includes(p.userId));
        let message = "";
        
        // Different messages for different stone types
        if ([500, 1000].includes(game.winningNumber)) {
          if (game.winningNumber === 500) {
            message = `Congratulations! Special stone ${game.winningNumber} is the winner! `;
          } else {
            message = `Amazing! Super stone ${game.winningNumber} takes the victory! `;
          }
        } else if ([33, 55, 66, 24].includes(game.winningNumber)) {
          message = `Excellent! Individual stone ${game.winningNumber} wins the game! `;
        } else {
          message = `Outstanding! Stone number ${game.winningNumber} is victorious! `;
        }
        
        // Add winner names
        if (winners.length > 0) {
          const winnerNames = winners.map(w => w.user.username).join(" and ");
          message += `The winner${winners.length > 1 ? 's are' : ' is'} ${winnerNames}. `;
        }
        
        message += "Game complete! Well played!";
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.pitch = 0.1; // Very deep voice
        utterance.rate = 0.6;  // Slower speech
        utterance.volume = 0.8;
        
        // Try to use a male voice if available
        const voices = speechSynthesis.getVoices();
        const maleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') || 
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('alex')
        );
        if (maleVoice) {
          utterance.voice = maleVoice;
        }
        
        speechSynthesis.speak(utterance);
      }
    };
    
    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(announceWinner, 500);
    return () => clearTimeout(timer);
  }, [game.winningNumber, players, game.winnerIds]);
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      {/* Professional Confetti Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#A29BFE', '#FD79A8', '#00B894', '#E17055'][Math.floor(Math.random() * 10)],
              width: `${8 + Math.random() * 12}px`,
              height: `${8 + Math.random() * 12}px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '3px',
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: 0.7 + Math.random() * 0.3,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
        ))}
      </div>

      {/* Floating Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute text-2xl animate-float-sparkle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          >
            {['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)]}
          </div>
        ))}
      </div>

      {/* Enhanced Modal Card - Mobile Responsive */}
      <div 
        className="bg-gradient-to-br from-white via-yellow-50 to-orange-50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-6 max-w-sm sm:max-w-md lg:max-w-xl w-full mx-2 sm:mx-4 text-center relative shadow-2xl border-2 sm:border-4 border-yellow-300 animate-modal-bounce overflow-hidden max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Background Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
        
        {/* Large Prominent Close X button - Mobile Responsive */}
        <Button
          variant="ghost"
          size="lg"
          className="absolute right-1 sm:right-2 top-1 sm:top-2 h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 p-0 hover:bg-red-100 z-30 rounded-full border-2 sm:border-3 lg:border-4 border-red-500 hover:border-red-700 transition-all shadow-2xl hover:shadow-2xl bg-white animate-pulse"
          onClick={onClose}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-700 font-black" />
        </Button>
        
        {/* Main Trophy Animation - Mobile Responsive */}
        <div className="relative mb-4 sm:mb-6 lg:mb-8 z-10">
          <div className="text-5xl sm:text-7xl lg:text-9xl mb-2 sm:mb-3 lg:mb-4 animate-trophy-bounce">🏆</div>
          
          {/* Floating Celebration Elements - Mobile Responsive */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 sm:-translate-y-4 animate-float">
            <div className="text-2xl sm:text-3xl lg:text-4xl">✨</div>
          </div>
          <div className="absolute top-4 sm:top-8 right-1/3 animate-sparkle">
            <div className="text-xl sm:text-2xl lg:text-3xl">🌟</div>
          </div>
          <div className="absolute top-4 sm:top-8 left-1/3 animate-sparkle-delayed">
            <div className="text-xl sm:text-2xl lg:text-3xl">💫</div>
          </div>
          <div className="absolute top-8 sm:top-16 right-1/4 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <div className="text-lg sm:text-xl lg:text-2xl">🎊</div>
          </div>
          <div className="absolute top-8 sm:top-16 left-1/4 animate-bounce" style={{ animationDelay: '0.8s' }}>
            <div className="text-lg sm:text-xl lg:text-2xl">🎉</div>
          </div>
        </div>
        
        {/* Winner Title with Gradient Text - Mobile Responsive */}
        <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black bg-gradient-to-r from-yellow-500 via-orange-600 to-red-600 bg-clip-text text-transparent mb-2 sm:mb-3 lg:mb-4 animate-text-glow drop-shadow-lg">
          WINNER!
        </h2>
        <p className="text-sm sm:text-lg lg:text-xl text-gray-700 mb-4 sm:mb-6 lg:mb-8 font-semibold animate-slide-up">
          🎉 Incredible Victory! Congratulations! 🎉
        </p>
        
        {/* Winning Stone Display */}
        <div className="mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
            <span className="text-3xl">🎯</span>
            Winning Stone
            <span className="text-3xl">🎯</span>
          </p>
          <div className="relative inline-block">
            <div className="text-6xl font-black text-blue-700 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 rounded-3xl py-6 px-8 shadow-2xl border-4 border-blue-400 animate-stone-pulse transform hover:scale-105 transition-transform">
              #{game.winningNumber}
            </div>
            <div className="absolute -top-4 -right-4 text-3xl animate-bounce">🎊</div>
            <div className="absolute -bottom-4 -left-4 text-3xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎉</div>
          </div>
        </div>
        
        {/* Winners List */}
        {game.winnerIds && Array.isArray(game.winnerIds) && (
          <div className="mb-10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-6 flex items-center justify-center gap-3">
              <span className="text-4xl">👑</span>
              Champion{game.winnerIds.length > 1 ? 's' : ''}
              <span className="text-4xl">👑</span>
            </p>
            <div className="space-y-4">
              {players
                .filter(p => game.winnerIds?.includes(p.userId))
                .map((winner, index) => (
                  <div 
                    key={winner.userId} 
                    className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-300 rounded-2xl p-6 shadow-xl border-4 border-yellow-500 animate-winner-slide transform hover:scale-105 transition-all"
                    style={{ animationDelay: `${0.6 + index * 0.2}s` }}
                  >
                    <p className="text-3xl font-black text-purple-800 flex items-center justify-center gap-3">
                      <span className="text-yellow-600 text-4xl">🥇</span>
                      {winner.user.username}
                      <span className="text-yellow-600 text-4xl">🥇</span>
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Game Complete Badge */}
        <div className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-white font-black rounded-full shadow-2xl animate-badge-glow border-4 border-green-300 text-xl mb-8">
            <span className="text-2xl">🎮</span>
            <span>Game Complete</span>
            <span className="text-2xl">🎮</span>
          </div>
        </div>

        {/* Close Button Options */}
        <div className="animate-slide-up flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animationDelay: '1s' }}>
          <Button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all text-lg border-2 border-blue-300"
          >
            🏠 Back to Home
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="px-8 py-3 border-2 border-gray-400 text-gray-700 font-bold rounded-full shadow-lg hover:shadow-xl transition-all text-lg hover:bg-gray-50"
          >
            ✅ OK
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  const params = useParams();
  const gameId = parseInt(params.id || '0');
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Floating chat state
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState('');
  const [unreadCount, setUnreadCount] = React.useState(0);
  
  // Floating icons state
  const [isGameInfoOpen, setIsGameInfoOpen] = React.useState(false);
  const [isPlayersOpen, setIsPlayersOpen] = React.useState(false);

  const { data, isLoading, error } = useQuery<GameResponse>({
    queryKey: ['/api/games', gameId],
    queryFn: async () => {
      const timestamp = Date.now();
      const response = await fetch(`/api/games/${gameId}?_t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        console.log('Game fetch error:', response.status, response.statusText);
        throw new Error('Failed to fetch game');
      }
      const gameData = await response.json();
      console.log(`Game ${gameId} players fetched:`, gameData.players?.map(p => p.user?.username || 'Unknown'));
      return gameData;
    },
    enabled: !!gameId && !!user,
    refetchInterval: 2000, // Auto-refresh every 2 seconds for real-time updates
    retry: (failureCount, error) => {
      console.log('Query retry attempt:', failureCount, error);
      return failureCount < 3;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale
  });

  const { mutate: sendMessage } = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/games/${gameId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      // Immediately refetch game data instead of page reload
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
      setNewMessage('');
    }
  });

  // Update unread count when messages change
  React.useEffect(() => {
    if (!isChatOpen && data?.messages.length) {
      setUnreadCount(data.messages.length);
    }
  }, [data?.messages.length, isChatOpen]);

  // Reset unread count when chat is opened
  React.useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header user={user!} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">Loading game...</div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    // For loading states, show a simple loading message instead of error
    if (isLoading) {
      return (
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header user={user!} />
          <main className="flex-grow container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
              <p className="text-gray-600 mb-6">Please wait while we load your game.</p>
            </div>
          </main>
        </div>
      );
    }
    
    // Only show error after loading is complete and we still have issues
    console.log("Game error or no data:", error);
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header user={user!} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
            <p className="text-gray-600 mb-6">The game you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")} className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const { game, players, messages } = data;
  const currentPlayer = players.find(p => p.userId === user?.id);

  if (!user) return null;

  // If user is not a player, show access denied
  if (!currentPlayer) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Game Access Denied</h2>
            <p className="text-gray-600 mb-6">You are not a player in this game.</p>
            <Button onClick={() => setLocation("/")} className="bg-blue-600 hover:bg-blue-700 text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Ambient Light Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10">
        {/* Manual Sync Button - Fixed positioning */}
        <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-40">
          <Button
            onClick={() => {
              console.log('Manual refresh triggered');
              queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-2 sm:border-4 border-white/30 backdrop-blur-sm relative overflow-hidden"
            title="Sync Game Data"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-50" />
            <div className="flex flex-col items-center relative z-10">
              <span className="text-sm sm:text-lg drop-shadow-lg">🔄</span>
            </div>
          </Button>
        </div>

        {/* Premium Floating Game Info Icon - Enhanced */}
        <div className="fixed top-16 sm:top-20 left-2 sm:left-4 z-40">
          <Dialog open={isGameInfoOpen} onOpenChange={setIsGameInfoOpen}>
            <DialogTrigger asChild>
              <Button
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 ${
                  game.status === 'waiting' ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' : 
                  game.status === 'in_progress' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : 
                  'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                } text-white border-2 sm:border-4 border-white/30 backdrop-blur-sm relative overflow-hidden`}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-50" />
                <div className="flex flex-col items-center relative z-10">
                  <span className="text-sm sm:text-lg drop-shadow-lg">ℹ️</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-sm sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <span className="text-xl sm:text-2xl">🎮</span>
                  Game #{game.id}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {game.status === 'waiting' ? 'Waiting for players' : 
                   game.status === 'in_progress' ? 'Game in progress' : 
                   'Game completed'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Players</p>
                    <p className="text-sm sm:text-base font-medium">{players.length} / {game.maxPlayers}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Stake</p>
                    <p className="text-sm sm:text-base font-medium">{formatCurrency(game.stake, game.currency || 'NGN')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Status</p>
                    <p className="text-sm sm:text-base font-medium capitalize">{game.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Floating Players Icon - Mobile Responsive */}
        <div className="fixed top-32 sm:top-36 left-2 sm:left-4 z-40">
          <Dialog open={isPlayersOpen} onOpenChange={setIsPlayersOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-2xl hover:scale-110 transition-all duration-300 border-2 sm:border-4 border-white/30 backdrop-blur-sm relative overflow-hidden"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-50" />
                <div className="flex flex-col items-center relative z-10">
                  <span className="text-sm sm:text-lg drop-shadow-lg">👥</span>
                  <span className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {players.length}
                  </span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-sm sm:max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <span className="text-xl sm:text-2xl">👥</span>
                  Players ({players.length}/{game.maxPlayers})
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {game.status === 'waiting' && players.length < game.maxPlayers && 
                    `Waiting for ${game.maxPlayers - players.length} more players`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 sm:space-y-3 py-3 sm:py-4 max-h-60 overflow-y-auto">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                        {player.user.avatarInitials}
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium">{player.user.username}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {player.userId === user.id ? 'You' : 'Player'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-medium flex items-center justify-end gap-1">
                        {player.rolledNumber ? (
                          <>
                            <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 bg-gray-700 text-white rounded-full text-xs flex items-center justify-center font-bold">🎲</span>
                            <span className="text-xs sm:text-sm">{player.rolledNumber}</span>
                          </>
                        ) : (
                          <span className="text-xs sm:text-sm">Not rolled</span>
                        )}
                      </p>
                      {player.isWinner && <p className="text-xs text-green-600 font-bold">Winner!</p>}
                    </div>
                  </div>
                ))}
                
                {game.status === 'waiting' && players.length < game.maxPlayers && (
                  <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600">Share game ID: <strong>#{game.id}</strong></p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-center w-full">
          
          {/* Game Board & Chat */}
          <div className="lg:w-2/3 order-1 lg:order-2">
            <Card className="mb-4 lg:mb-6">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="text-lg lg:text-xl">Game Board</CardTitle>
                <CardDescription className="text-sm lg:text-base">
                  {game.status === 'waiting' ? 
                    'Game will start once enough players have joined' : 
                    game.status === 'in_progress' ?
                    'Roll your stone when it\'s your turn' :
                    'Game has ended'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-3 lg:p-6">
                {(players.length >= 2) ? (
                  <div className="space-y-6">
                    {/* Game Board */}
                    <div className="bg-green-800 border-4 border-yellow-600 rounded-xl p-6 shadow-2xl relative overflow-visible" id="game-board">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">🎲 BIG BOYS GAME 🎲</h2>
                        <p className="text-yellow-300">Game #{game.id} - {game.status.toUpperCase()}!</p>
                      </div>
                      
                      {/* Rolling Ball Animation */}
                      <div 
                        id="rolling-ball" 
                        className="absolute w-8 h-8 bg-orange-500 border-2 border-yellow-400 rounded-full hidden transition-all duration-300 ease-out z-50"
                        style={{
                          background: 'radial-gradient(circle, white 30%, #FF8800 100%)',
                          boxShadow: '0 0 20px 10px rgba(255, 136, 0, 0.7)',
                          transform: 'translate(-50%, -50%)'
                        }}
                      ></div>
                      
                      {/* Stone Grid - Demo-new Board Layout */}
                      <div className="max-w-4xl mx-auto space-y-4">
                        {/* Row 1 - 5 stones */}
                        <div className="flex justify-center gap-3">
                          {[29, 40, 32, 81, 7].map((number) => (
                            <div
                              key={number}
                              className={`h-16 w-16 bg-white text-black border-2 border-gray-300 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                                game.winningNumber === number && game.status === "completed" ? 'animate-pulse ring-4 ring-yellow-400' : ''
                              }`}
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                        
                        {/* Row 2 - 5 stones with special 1000 */}
                        <div className="flex justify-center gap-3">
                          {[13, 64, 1000, 101, 4].map((number) => (
                            <div
                              key={number}
                              className={`h-16 w-16 ${
                                number === 1000 ? 'bg-yellow-500 text-black' : 'bg-white text-black'
                              } border-2 border-gray-300 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                                game.winningNumber === number && game.status === "completed" ? 'animate-pulse ring-4 ring-yellow-400' : ''
                              }`}
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                        
                        {/* Row 3 - 7 stones with super stones */}
                        <div className="flex justify-center gap-3">
                          {[3355, 65, 12, 22, 9, 6624, 44].map((number) => (
                            <div
                              key={number}
                              className={`h-16 w-16 ${
                                number === 3355 || number === 6624 ? 'bg-red-600 border-4 border-yellow-400 text-white' : 'bg-white text-black'
                              } border-2 border-gray-300 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                                game.winningNumber === number && game.status === "completed" ? 'animate-pulse ring-4 ring-yellow-400' : ''
                              }`}
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                        
                        {/* Row 4 - 8 stones with special 500 */}
                        <div className="flex justify-center gap-3">
                          {[28, 21, 105, 500, 99, 20, 82, 3].map((number) => (
                            <div
                              key={number}
                              className={`h-16 w-16 ${
                                number === 500 ? 'bg-yellow-500 text-black' : 'bg-white text-black'
                              } border-2 border-gray-300 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-200 ${
                                game.winningNumber === number && game.status === "completed" ? 'animate-pulse ring-4 ring-yellow-400' : ''
                              }`}
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                        
                        {/* Row 5 - 11 small stones */}
                        <div className="flex justify-center gap-2">
                          {[11, 37, 72, 17, 42, 8, 30, 91, 27, 5, 40].map((number) => (
                            <div
                              key={number}
                              className={`h-12 w-12 bg-white text-black border-2 border-gray-300 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                                game.winningNumber === number && game.status === "completed" ? 'animate-pulse ring-4 ring-yellow-400' : ''
                              }`}
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                        
                        {/* Row 6 - 11 small stones */}
                        <div className="flex justify-center gap-2">
                          {[6, 80, 3, 26, 100, 19, 14, 43, 16, 71, 10].map((number) => (
                            <div
                              key={number}
                              className={`h-12 w-12 bg-white text-black border-2 border-gray-300 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                                game.winningNumber === number && game.status === "completed" ? 'animate-pulse ring-4 ring-yellow-400' : ''
                              }`}
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Roll Button */}
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={async () => {
                            if (currentPlayer && currentPlayer.rolledNumber === null) {
                              try {
                                // Start ball animation
                                const ball = document.getElementById('rolling-ball');
                                const board = document.getElementById('game-board');
                                
                                if (ball && board) {
                                  ball.classList.remove('hidden');
                                  ball.style.left = '50%';
                                  ball.style.top = '50%';
                                  
                                  // Animate ball rolling around the board
                                  const positions = [
                                    { left: '25%', top: '35%' },
                                    { left: '75%', top: '35%' },
                                    { left: '75%', top: '65%' },
                                    { left: '25%', top: '65%' },
                                    { left: '50%', top: '45%' },
                                    { left: '60%', top: '55%' },
                                    { left: '40%', top: '40%' }
                                  ];
                                  
                                  let posIndex = 0;
                                  const animateInterval = setInterval(() => {
                                    if (posIndex < positions.length) {
                                      ball.style.left = positions[posIndex].left;
                                      ball.style.top = positions[posIndex].top;
                                      posIndex++;
                                    } else {
                                      clearInterval(animateInterval);
                                    }
                                  }, 300);
                                }
                                
                                const response = await fetch(`/api/games/${game.id}/roll`, { 
                                  method: 'POST',
                                  credentials: 'include',
                                  headers: {
                                    'Content-Type': 'application/json'
                                  }
                                });
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  
                                  // Move ball to winning stone after animation
                                  setTimeout(() => {
                                    if (ball) {
                                      // Find a random position near the center for the final landing
                                      const finalPositions = [
                                        { left: '48%', top: '50%' },
                                        { left: '52%', top: '48%' },
                                        { left: '50%', top: '52%' },
                                        { left: '49%', top: '49%' }
                                      ];
                                      const finalPos = finalPositions[Math.floor(Math.random() * finalPositions.length)];
                                      ball.style.left = finalPos.left;
                                      ball.style.top = finalPos.top;
                                      
                                      // Add winning glow effect
                                      ball.style.boxShadow = '0 0 30px 15px rgba(255, 215, 0, 0.8)';
                                      
                                      // Computer voice announcement
                                      setTimeout(() => {
                                        const winningNumber = result.rolledNumber;
                                        let announcement = '';
                                        
                                        if (winningNumber === 3355 || winningNumber === 6624) {
                                          announcement = `Super stone ${winningNumber}! Amazing win!`;
                                        } else if (winningNumber === 500 || winningNumber === 1000) {
                                          announcement = `Special stone ${winningNumber}! Great roll!`;
                                        } else {
                                          announcement = `Stone number ${winningNumber}! Well played!`;
                                        }
                                        
                                        // Use Web Speech API for deep male voice announcement
                                        if ('speechSynthesis' in window) {
                                          // Load voices if not already loaded
                                          const speakAnnouncement = () => {
                                            const utterance = new SpeechSynthesisUtterance(announcement);
                                            utterance.rate = 0.6; // Slower for deeper effect
                                            utterance.pitch = 0.1; // Very low pitch for deep male voice
                                            utterance.volume = 1.0; // Full volume
                                            
                                            // Try to get a male voice
                                            const voices = window.speechSynthesis.getVoices();
                                                console.log('🎤 Available voices:', voices.map(v => v.name));
                                            
                                            const maleVoice = voices.find(voice => 
                                              voice.name.toLowerCase().includes('male') ||
                                              voice.name.toLowerCase().includes('david') ||
                                              voice.name.toLowerCase().includes('alex') ||
                                              voice.name.toLowerCase().includes('daniel') ||
                                              voice.name.toLowerCase().includes('fred') ||
                                              voice.lang.includes('en')
                                            );
                                            
                                            if (maleVoice) {
                                              utterance.voice = maleVoice;
                                              console.log('🎤 Using voice:', maleVoice.name);
                                            } else {
                                              console.log('🎤 No male voice found, using default');
                                            }
                                            
                                            console.log('🎤 Speaking announcement:', announcement);
                                            
                                            // Add error handling for speech
                                            utterance.onerror = (event) => {
                                              console.error('🎤 Speech error:', event);
                                            };
                                            
                                            utterance.onstart = () => {
                                              console.log('🎤 Speech started successfully!');
                                            };
                                            
                                            utterance.onend = () => {
                                              console.log('🎤 Speech finished!');
                                            };
                                            
                                            // Clear any existing speech
                                            window.speechSynthesis.cancel();
                                            
                                            // Speak with a small delay to ensure it works
                                            setTimeout(() => {
                                              window.speechSynthesis.speak(utterance);
                                            }, 100);
                                          };
                                          
                                          // Check if voices are loaded, if not wait for them
                                          if (window.speechSynthesis.getVoices().length === 0) {
                                            window.speechSynthesis.addEventListener('voiceschanged', speakAnnouncement, { once: true });
                                          } else {
                                            speakAnnouncement();
                                          }
                                        }
                                      }, 500);
                                      
                                      setTimeout(() => {
                                        ball.classList.add('hidden');
                                        // Refresh game data instead of page reload
                                        queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
                                      }, 1500);
                                    }
                                  }, 2100);
                                } else {
                                  const error = await response.json();
                                  console.error('Roll failed:', error);
                                  if (ball) ball.classList.add('hidden');
                                }
                              } catch (err) {
                                console.error('Roll failed:', err);
                                const ball = document.getElementById('rolling-ball');
                                if (ball) ball.classList.add('hidden');
                              }
                            }
                          }}
                          disabled={!currentPlayer || (game.maxPlayers > 2 && currentPlayer.rolledNumber !== null && game.status !== "completed")}
                          className="px-8 py-3 text-lg font-bold bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-500 disabled:cursor-not-allowed text-black rounded-lg transition-colors"
                        >
                          {game.maxPlayers === 2 ? "🎲 ROLL STONE" : (currentPlayer?.rolledNumber !== null && game.status !== "completed" ? "✅ ROLLED" : "🎲 ROLL STONE")}
                        </button>
                      </div>

                      {/* Play Again Button for Bot Games */}
                      {game.status === "completed" && game.maxPlayers === 2 && (
                        <div className="text-center mt-4">
                          <button
                            onClick={() => {
                              // Navigate back to home page for new bot game
                              setLocation('/');
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-colors mr-4"
                          >
                            🎮 Play Again
                          </button>
                          <button
                            onClick={() => {
                              setLocation('/');
                            }}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
                          >
                            🏠 Home
                          </button>
                        </div>
                      )}

                      {/* Winner Congratulations Modal */}
                      {game.status === "completed" && game.winningNumber && (
                        <WinnerModal 
                          game={game}
                          players={players}
                          onClose={() => setLocation('/')}
                        />
                      )}
                      
                      {/* Professional Voice Chat for higher stakes */}
                      {game.stake >= 20000 && (
                        <div className="mt-6">
                          <ProfessionalVoiceChat 
                            game={game}
                            players={players}
                            currentUserId={user?.id || 0}
                          />
                        </div>
                      )}
                      
                      {/* Old embedded text chat removed - now using floating chat button */}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-xl p-4 lg:p-8 min-h-[250px] lg:min-h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-xl font-medium mb-2">Waiting for Players</h3>
                      <p className="text-gray-600 mb-4">Game will start automatically when enough players join</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

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
              {!data?.messages || data.messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs text-gray-400">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.messages.map((message) => {
                    const player = data.players.find(p => p.userId === message.userId);
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
              if (newMessage.trim()) {
                sendMessage(newMessage.trim());
              }
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
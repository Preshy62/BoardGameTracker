import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Users, DollarSign, Clock, MessageSquare } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { formatCurrency } from '@/lib/utils';
import { Game, GamePlayer, Message, User } from '@shared/schema';
import { ChatInput } from '@/components/game/ChatInput';
import { AddPlayers } from '@/components/game/AddPlayers';

interface GameResponse {
  game: Game;
  players: (GamePlayer & { user: User })[];
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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center">Loading game...</div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header user={user} />
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Game Info */}
          <div className="lg:w-1/3 order-2 lg:order-1">
            <Card className="mb-6">
              <CardHeader className={`${
                game.status === 'waiting' ? 'bg-blue-500' : 
                game.status === 'in_progress' ? 'bg-amber-500' : 
                'bg-green-500'
              } text-white`}>
                <CardTitle>Game #{game.id}</CardTitle>
                <CardDescription className="text-white text-opacity-90">
                  {game.status === 'waiting' ? 'Waiting for players' : 
                   game.status === 'in_progress' ? 'Game in progress' : 
                   'Game completed'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Players</p>
                    <p className="font-medium">{players.length} / {game.maxPlayers}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Stake</p>
                    <p className="font-medium">{formatCurrency(game.stake)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{game.createdAt ? new Date(game.createdAt).toLocaleString() : 'Just now'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </CardContent>
            </Card>
            
            {/* Player List */}
            <Card>
              <CardHeader>
                <CardTitle>Players</CardTitle>
                <CardDescription>
                  {game.status === 'waiting' ? 
                    `Waiting for ${game.maxPlayers - players.length} more player(s)` : 
                    `${players.length} player(s) in this game`
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-3">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {player.user.avatarInitials}
                      </div>
                      <div>
                        <p className="font-medium">{player.user.username}</p>
                        <p className="text-sm text-gray-500">
                          {player.userId === user.id ? 'You' : 'Player'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {player.rolledNumber ? `🎲 ${player.rolledNumber}` : 'Not rolled'}
                      </p>
                      {player.isWinner && <p className="text-xs text-green-600 font-bold">Winner!</p>}
                    </div>
                  </div>
                ))}
                
                {game.status === 'waiting' && (
                  <AddPlayers 
                    game={game} 
                    currentUserId={user.id} 
                  />
                )}
              </CardContent>
            </Card>
          </div>
          
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
                  <div className="bg-green-800 border-4 border-yellow-600 rounded-xl p-4 lg:p-8 shadow-2xl">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-white mb-2">🎲 BIG BOYS GAME 🎲</h2>
                      <p className="text-yellow-300">Game #{game.id} - {game.status.toUpperCase()}!</p>
                    </div>
                    
                    {/* Stone Grid */}
                    <div className="grid grid-cols-6 gap-2 mb-6">
                      {/* Regular stones 1-6 */}
                      {[1, 2, 3, 4, 5, 6].map((number) => (
                        <div
                          key={number}
                          className="h-16 lg:h-20 bg-blue-600 border-2 border-white rounded-lg flex items-center justify-center text-white font-bold text-lg lg:text-xl cursor-pointer hover:bg-blue-500 transition-all duration-200"
                        >
                          {number}
                        </div>
                      ))}
                    </div>
                    
                    {/* Special stones row */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {/* 500 stone */}
                      <div className="h-16 lg:h-20 bg-yellow-500 border-2 border-white rounded-lg flex items-center justify-center text-black font-bold text-lg lg:text-xl cursor-pointer hover:bg-yellow-400 transition-all duration-200">
                        500
                      </div>
                      
                      {/* 1000 stone */}
                      <div className="h-16 lg:h-20 bg-yellow-500 border-2 border-white rounded-lg flex items-center justify-center text-black font-bold text-lg lg:text-xl cursor-pointer hover:bg-yellow-400 transition-all duration-200">
                        1000
                      </div>
                      
                      {/* Super stones */}
                      <div className="h-16 lg:h-20 bg-red-600 border-4 border-yellow-400 rounded-lg flex items-center justify-center text-white font-bold text-lg lg:text-xl cursor-pointer hover:bg-red-500 transition-all duration-200">
                        3355
                      </div>
                      
                      <div className="h-16 lg:h-20 bg-red-600 border-4 border-yellow-400 rounded-lg flex items-center justify-center text-white font-bold text-lg lg:text-xl cursor-pointer hover:bg-red-500 transition-all duration-200">
                        6624
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-xl p-4 lg:p-8 min-h-[250px] lg:min-h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-xl font-medium mb-2">Waiting for Players</h3>
                      <p className="text-gray-600 mb-4">Game will start automatically when enough players join</p>
                      <div className="flex justify-center">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="px-3 lg:px-6 py-3 lg:py-4 border-t">
                <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button variant="outline" disabled={game.status !== 'waiting'} className="w-full sm:w-auto">
                    {game.status === 'waiting' ? 'Ready' : 'Waiting...'}
                  </Button>
                  
                  <Button 
                    className="bg-secondary hover:bg-secondary-dark text-primary font-bold w-full sm:w-auto"
                    disabled={game.status !== 'in_progress'}
                  >
                    Roll Stone
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            {/* Chat Section */}
            <Card>
              <CardHeader>
                <CardTitle>Game Chat</CardTitle>
                <CardDescription>
                  Chat with other players
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 h-[200px] overflow-y-auto mb-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map(message => (
                        <div key={message.id} className="flex items-start space-x-2">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {message.content ? 'U' : 'U'}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">Player</span>
                              <span className="text-xs text-gray-500">
                                {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Now'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <ChatInput gameId={game.id} currentUserId={user.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
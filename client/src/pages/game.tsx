import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Users, DollarSign, MessageSquare, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import { Game, GamePlayer, Message } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

interface GameResponse {
  game: Game;
  players: (GamePlayer & { user: { username: string; avatarInitials: string } })[];
  messages: Message[];
}

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const gameId = parseInt(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<GameResponse>({
    queryKey: ['/api/games', gameId],
    enabled: !isNaN(gameId),
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Game",
        description: error instanceof Error ? error.message : "Failed to load game data",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-medium">Loading Game...</h2>
        </div>
      </div>
    );
  }

  if (!data || !data.game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Game Not Found</h2>
          <p className="mb-6 text-gray-600">The game you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const { game, players, messages } = data;

  if (!user) return null;
      
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Game Info */}
          <div className="lg:w-1/3">
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
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-3">
                        {player.user.avatarInitials}
                      </div>
                      <div>
                        <h4 className="font-medium">{player.user.username}</h4>
                        <p className="text-sm text-gray-500">
                          {player.isActive ? 'Active' : 'Waiting'}
                          {player.turnOrder ? ` • Turn ${player.turnOrder}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {players.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No players have joined yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Game Board & Chat */}
          <div className="lg:w-2/3">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Game Board</CardTitle>
                <CardDescription>
                  {game.status === 'waiting' ? 
                    'Game will start once enough players have joined' : 
                    game.status === 'in_progress' ?
                    'Roll your stone when it\'s your turn' :
                    'Game has ended'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="bg-gray-100 rounded-xl p-8 min-h-[300px] flex items-center justify-center">
                  {game.status === 'waiting' ? (
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
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600">Game board will be displayed here once the game starts</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="px-6 py-4 border-t">
                <div className="w-full flex justify-between">
                  <Button variant="outline" disabled={game.status !== 'waiting'}>
                    {game.status === 'waiting' ? 'Ready' : 'Waiting...'}
                  </Button>
                  
                  <Button 
                    className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
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
                  {messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className="flex">
                          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                            <div className="text-sm font-medium">User #{message.userId}</div>
                            <div>{message.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <MessageSquare className="h-5 w-5 mr-2 opacity-70" />
                      No messages yet
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-grow rounded-l-md border border-gray-300 focus:border-primary focus:outline-none px-4 py-2"
                    disabled={game.status === 'completed'}
                  />
                  <Button
                    className="rounded-l-none"
                    disabled={game.status === 'completed'}
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Users, DollarSign, Clock } from "lucide-react";
import Header from "@/components/layout/Header";
import GameLobbyModal from "@/components/modals/GameLobbyModal";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Game, User } from "@shared/schema";

export default function Home() {
  const [isLobbyModalOpen, setIsLobbyModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  // Fetch available games
  const { data: availableGames, isLoading: isGamesLoading, refetch: refetchGames } = useQuery<Game[]>({
    queryKey: ['/api/games/available'],
  });

  // Fetch user's active games
  const { data: userGames, isLoading: isUserGamesLoading, refetch: refetchUserGames } = useQuery<Game[]>({
    queryKey: ['/api/games/user'],
  });

  // Poll for new games
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGames();
      refetchUserGames();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refetchGames, refetchUserGames]);

  // Create new game
  const handleCreateGame = async (playerCount: number, stake: number) => {
    try {
      const response = await apiRequest('POST', '/api/games', {
        maxPlayers: playerCount,
        stake
      });
      
      const data = await response.json();
      setIsLobbyModalOpen(false);
      setLocation(`/game/${data.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create game',
        variant: 'destructive',
      });
    }
  };

  // Join existing game
  const handleJoinGame = async (gameId: number) => {
    try {
      await apiRequest('POST', `/api/games/${gameId}/join`, {});
      setLocation(`/game/${gameId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join game',
        variant: 'destructive',
      });
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  useEffect(() => {
    if (!user && !isUserLoading) {
      setLocation('/login');
    }
  }, [user, isUserLoading, setLocation]);
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-sans">Welcome, {user.username}</h1>
            <p className="text-gray-600">Ready to play Big Boys Game?</p>
          </div>
          
          <Button 
            onClick={() => setIsLobbyModalOpen(true)}
            className="bg-secondary hover:bg-secondary-dark text-primary font-bold mt-4 md:mt-0"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Game
          </Button>
        </div>
        
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="available">Available Games</TabsTrigger>
            <TabsTrigger value="my-games">My Games</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-6">
            {isGamesLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
              </div>
            ) : availableGames && availableGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableGames.map(game => (
                  <Card key={game.id} className="overflow-hidden">
                    <CardHeader className="bg-primary text-white p-4">
                      <CardTitle>Game #{game.id}</CardTitle>
                      <CardDescription className="text-gray-300">
                        Waiting for players
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Players</p>
                            <p className="font-medium">{/* Implement player count */}/
                            {game.maxPlayers}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Stake Amount</p>
                            <p className="font-medium">{formatCurrency(game.stake)}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Created</p>
                            <p className="font-medium">
                              {new Date(game.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="bg-gray-50 p-4">
                      <Button 
                        onClick={() => handleJoinGame(game.id)}
                        className="w-full bg-secondary hover:bg-secondary-dark text-primary font-bold"
                      >
                        Join Game
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-xl font-medium mb-2">No Games Available</h3>
                <p className="text-gray-600 mb-4">
                  There are no open games at the moment. Create your own game to get started!
                </p>
                <Button 
                  onClick={() => setIsLobbyModalOpen(true)}
                  className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
                >
                  Create Game
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my-games" className="space-y-6">
            {isUserGamesLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
              </div>
            ) : userGames && userGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userGames.map(game => (
                  <Card key={game.id} className="overflow-hidden">
                    <CardHeader className={`p-4 text-white ${
                      game.status === 'waiting' ? 'bg-secondary' : 
                      game.status === 'in_progress' ? 'bg-accent' : 
                      'bg-success'
                    }`}>
                      <CardTitle>Game #{game.id}</CardTitle>
                      <CardDescription className="text-gray-100">
                        {game.status === 'waiting' ? 'Waiting for players' : 
                        game.status === 'in_progress' ? 'Game in progress' : 
                        'Game completed'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Players</p>
                            <p className="font-medium">{/* Implement player count */}/{game.maxPlayers}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Stake Amount</p>
                            <p className="font-medium">{formatCurrency(game.stake)}</p>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium">
                              {game.status === 'waiting' ? 'Waiting' : 
                              game.status === 'in_progress' ? 'In Progress' : 
                              'Completed'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="bg-gray-50 p-4">
                      <Button 
                        onClick={() => setLocation(`/game/${game.id}`)}
                        className="w-full bg-primary hover:bg-primary-light text-white"
                      >
                        {game.status === 'waiting' ? 'Join Lobby' : 
                        game.status === 'in_progress' ? 'Continue Game' : 
                        'View Results'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h3 className="text-xl font-medium mb-2">No Active Games</h3>
                <p className="text-gray-600 mb-4">
                  You haven't joined any games yet. Create a new game or join an existing one!
                </p>
                <Button 
                  onClick={() => setIsLobbyModalOpen(true)}
                  className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
                >
                  Create Game
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <GameLobbyModal
        open={isLobbyModalOpen}
        onClose={() => setIsLobbyModalOpen(false)}
        onCreateGame={handleCreateGame}
      />
    </div>
  );
}

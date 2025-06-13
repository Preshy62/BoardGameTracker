import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Users, 
  Bot, 
  Gamepad2,
  Trophy,
  Clock,
  Star,
  PlayCircle,
  Zap,
  Target,
  Brain,
  BarChart4
} from "lucide-react";
import Header from "@/components/layout/Header";
import { apiRequest } from "@/lib/queryClient";

// Game types for the sophisticated gaming platform
const GAME_TYPES = [
  {
    id: 'strategy-arena',
    name: 'Strategy Arena',
    description: 'Advanced tactical gameplay with AI opponents',
    icon: Brain,
    difficulty: 'Advanced',
    players: '2-4 Players',
    duration: '15-30 min',
    features: ['Enhanced Bot AI', 'Real-time Strategy', 'Voice Chat']
  },
  {
    id: 'quick-match',
    name: 'Quick Match',
    description: 'Fast-paced multiplayer battles',
    icon: Zap,
    difficulty: 'Intermediate',
    players: '2-6 Players', 
    duration: '5-10 min',
    features: ['Instant Matchmaking', 'Dynamic Gameplay', 'Skill-based Matching']
  },
  {
    id: 'bot-challenge',
    name: 'Bot Challenge',
    description: 'Test your skills against sophisticated AI',
    icon: Bot,
    difficulty: 'Adaptive',
    players: '1 Player + AI',
    duration: '10-20 min',
    features: ['Adaptive AI Difficulty', 'Skill Training', 'Performance Analytics']
  },
  {
    id: 'tournament',
    name: 'Tournament Mode',
    description: 'Competitive brackets with multiple rounds',
    icon: Trophy,
    difficulty: 'Expert',
    players: '8-16 Players',
    duration: '45-90 min',
    features: ['Elimination Brackets', 'Live Spectating', 'Prize Tracking']
  }
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);

  // Fetch available games
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['/api/games', 'available'],
    enabled: !!user
  });

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (gameConfig: any) => {
      const response = await apiRequest('POST', '/api/games', gameConfig);
      return response.json();
    },
    onSuccess: (game) => {
      toast({
        title: "Game Created",
        description: `Your ${selectedGameType} game is ready!`,
      });
      setLocation(`/game/${game.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Game",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Quick join mutation
  const quickJoinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/games/quick-join', {});
      return response.json();
    },
    onSuccess: (game) => {
      toast({
        title: "Joined Game",
        description: "Welcome to the match!",
      });
      setLocation(`/game/${game.id}`);
    },
    onError: (error) => {
      toast({
        title: "Quick Join Failed",
        description: error instanceof Error ? error.message : "No available games found",
        variant: "destructive",
      });
    }
  });

  const handleCreateGame = (gameType: string) => {
    setSelectedGameType(gameType);
    const gameConfig = {
      gameType,
      maxPlayers: gameType === 'tournament' ? 16 : gameType === 'bot-challenge' ? 1 : 4,
      difficulty: 'adaptive',
      enableBotOpponents: gameType === 'bot-challenge',
      enableVoiceChat: true,
      enableSpectating: gameType === 'tournament'
    };
    createGameMutation.mutate(gameConfig);
  };

  const handleQuickJoin = () => {
    quickJoinMutation.mutate();
  };

  const handleViewDashboard = () => {
    setLocation('/dashboard');
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Big Boys <span className="text-blue-400">Game</span>
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Sophisticated Multiplayer Gaming Platform
          </p>
          <div className="flex items-center justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Welcome, {user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <span>Skill Level: Adaptive</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
            <CardContent className="p-6 text-center">
              <PlayCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Quick Match</h3>
              <p className="text-gray-400 mb-4">Join the next available game instantly</p>
              <Button 
                onClick={handleQuickJoin}
                disabled={quickJoinMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {quickJoinMutation.isPending ? 'Finding Game...' : 'Quick Join'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
            <CardContent className="p-6 text-center">
              <Bot className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Practice with AI</h3>
              <p className="text-gray-400 mb-4">Train against sophisticated bot opponents</p>
              <Button 
                onClick={() => handleCreateGame('bot-challenge')}
                disabled={createGameMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {createGameMutation.isPending ? 'Creating...' : 'Challenge Bot'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
            <CardContent className="p-6 text-center">
              <BarChart4 className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">View Stats</h3>
              <p className="text-gray-400 mb-4">Track your performance and progress</p>
              <Button 
                onClick={handleViewDashboard}
                variant="outline"
                className="w-full border-slate-600 text-white hover:bg-slate-700"
              >
                Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Game Modes */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Choose Your Game Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {GAME_TYPES.map((gameType) => (
              <Card key={gameType.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all group">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <gameType.icon className="h-8 w-8 text-blue-400" />
                    <Badge variant="outline" className="border-slate-600 text-gray-300">
                      {gameType.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">{gameType.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-400 text-sm mb-4">{gameType.description}</p>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>{gameType.players}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{gameType.duration}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    {gameType.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                        <Star className="h-3 w-3" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    onClick={() => handleCreateGame(gameType.id)}
                    disabled={createGameMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {createGameMutation.isPending ? 'Creating...' : 'Start Game'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Active Games */}
        {gamesData && gamesData.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Active Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gamesData.slice(0, 6).map((game: any) => (
                <Card key={game.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Game #{game.id}</CardTitle>
                      <Badge className={`${
                        game.status === 'waiting' ? 'bg-blue-600' : 
                        game.status === 'in_progress' ? 'bg-green-600' : 
                        'bg-gray-600'
                      }`}>
                        {game.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-400 mb-4">
                      <div className="flex items-center justify-between">
                        <span>Players:</span>
                        <span>{game.currentPlayers || 0}/{game.maxPlayers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Type:</span>
                        <span>{game.gameType || 'Standard'}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => setLocation(`/game/${game.id}`)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={game.status === 'completed'}
                    >
                      {game.status === 'waiting' ? 'Join Game' : 
                       game.status === 'in_progress' ? 'Watch Game' : 
                       'View Results'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Platform Features */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Brain className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Enhanced Bot AI</h3>
              <p className="text-gray-400">Advanced artificial intelligence adapts to your skill level</p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Multiplayer</h3>
              <p className="text-gray-400">Seamless WebSocket-based multiplayer experiences</p>
            </div>
            <div className="text-center">
              <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Strategic Complexity</h3>
              <p className="text-gray-400">Deep gameplay mechanics for engaging experiences</p>
            </div>
            <div className="text-center">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Competitive Play</h3>
              <p className="text-gray-400">Tournament modes and skill-based matchmaking</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
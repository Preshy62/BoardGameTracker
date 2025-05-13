import { useState } from "react";
import { Button } from "@/components/ui/button";
import GameBoard from "@/components/game/GameBoard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Dices, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import VoiceChat from "@/components/game/VoiceChat";

export default function BoardTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameStatus, setGameStatus] = useState<'waiting' | 'in_progress' | 'completed'>('in_progress');
  const [gameStake, setGameStake] = useState(20000); // Default to high stakes game
  const [hasRolled, setHasRolled] = useState(false);
  const [userRolledNumber, setUserRolledNumber] = useState<number | null>(null);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  
  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Game Board Testing</CardTitle>
            <CardDescription>
              Please log in to test the game board functionality
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Create a mock game object for testing
  const mockGame = {
    id: 888,
    createdAt: new Date(),
    status: gameStatus,
    stake: gameStake,
    commissionPercentage: 0.05,
    currency: "NGN",
    maxPlayers: 4,
    creatorId: user.id,
    winningNumber: winningNumber,
    endedAt: gameStatus === 'completed' ? new Date() : null,
    winnerIds: gameStatus === 'completed' && winningNumber !== null ? [user.id] : [],
    language: "en",
    isPrivate: false,
    region: "NG",
    voiceChatEnabled: gameStake >= 20000
  };
  
  // Create mock players
  const mockPlayers = [
    {
      id: 1,
      gameId: 888,
      userId: user.id,
      user: {
        username: user.username,
        avatarInitials: user.avatarInitials || "YO"
      },
      hasRolled: hasRolled,
      rolledNumber: userRolledNumber,
      isWinner: gameStatus === 'completed' && userRolledNumber === winningNumber,
      winShare: gameStatus === 'completed' && userRolledNumber === winningNumber ? gameStake * 0.95 : 0,
      createdAt: new Date()
    },
    {
      id: 2,
      gameId: 888,
      userId: 999,
      user: {
        username: "Player2",
        avatarInitials: "P2"
      },
      hasRolled: true,
      rolledNumber: 300,
      isWinner: gameStatus === 'completed' && 300 === winningNumber,
      winShare: gameStatus === 'completed' && 300 === winningNumber ? gameStake * 0.95 : 0,
      createdAt: new Date()
    },
    {
      id: 3,
      gameId: 888,
      userId: 998,
      user: {
        username: "Player3",
        avatarInitials: "P3"
      },
      hasRolled: true,
      rolledNumber: 500,
      isWinner: gameStatus === 'completed' && 500 === winningNumber,
      winShare: gameStatus === 'completed' && 500 === winningNumber ? gameStake * 0.95 : 0,
      createdAt: new Date()
    }
  ];
  
  // Handle when user rolls the stone
  const handleRollStone = () => {
    // Random stone values
    const stoneValues = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 3355, 6624];
    const randomIndex = Math.floor(Math.random() * stoneValues.length);
    const rolledNumber = stoneValues[randomIndex];
    
    setHasRolled(true);
    setUserRolledNumber(rolledNumber);
    
    toast({
      title: `You rolled: ${rolledNumber}`,
      description: "Waiting for other players to roll...",
    });
  };
  
  // End the game with a winner
  const endGame = () => {
    // Choose a random player as winner or set the current user as winner
    const winnerIndex = Math.floor(Math.random() * mockPlayers.length);
    const winnerNumber = mockPlayers[winnerIndex].rolledNumber || 0;
    
    setGameStatus('completed');
    setWinningNumber(winnerNumber);
    
    toast({
      title: "Game Completed",
      description: `Winning number: ${winnerNumber}`,
      variant: winnerNumber === userRolledNumber ? "default" : "destructive",
    });
  };
  
  // Reset the game
  const resetGame = () => {
    setGameStatus('waiting');
    setHasRolled(false);
    setUserRolledNumber(null);
    setWinningNumber(null);
    
    toast({
      title: "Game Reset",
      description: "Waiting for players to join...",
    });
  };
  
  // Start the game
  const startGame = () => {
    setGameStatus('in_progress');
    
    toast({
      title: "Game Started",
      description: "Roll your stone now!",
    });
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Game Board Testing</CardTitle>
              <CardDescription>
                Test the game board interface and functionality
              </CardDescription>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Settings className="h-4 w-4" />
                  <span>Game Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Game Settings</DialogTitle>
                  <DialogDescription>
                    Customize the game state for testing
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm">Game Status:</span>
                    <div className="col-span-3">
                      <Tabs
                        defaultValue={gameStatus}
                        className="w-full"
                        onValueChange={(value) => setGameStatus(value as 'waiting' | 'in_progress' | 'completed')}
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="waiting">Waiting</TabsTrigger>
                          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                          <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm">Game Stake:</span>
                    <div className="col-span-3">
                      <RadioGroup 
                        defaultValue={gameStake.toString()} 
                        className="flex space-x-4"
                        onValueChange={(value) => setGameStake(Number(value))}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="10000" id="stake-10k" />
                          <Label htmlFor="stake-10k">₦10,000</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="20000" id="stake-20k" />
                          <Label htmlFor="stake-20k">₦20,000</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="50000" id="stake-50k" />
                          <Label htmlFor="stake-50k">₦50,000</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-2">Game Controls</h3>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetGame}
                className="flex items-center gap-1"
              >
                <Dices className="h-4 w-4" />
                Reset Game
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={startGame}
                disabled={gameStatus !== 'waiting'}
                className="flex items-center gap-1"
              >
                <Dices className="h-4 w-4" />
                Start Game
              </Button>
              
              <Button
                variant={hasRolled ? "secondary" : "default"}
                size="sm"
                onClick={handleRollStone}
                disabled={gameStatus !== 'in_progress' || hasRolled}
                className="flex items-center gap-1"
              >
                <Dices className="h-4 w-4" />
                {hasRolled ? `Rolled: ${userRolledNumber}` : 'Roll Stone'}
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={endGame}
                disabled={gameStatus !== 'in_progress' || !mockPlayers.every(p => p.hasRolled)}
                className="flex items-center gap-1"
              >
                <Dices className="h-4 w-4" />
                End Game
              </Button>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-5">
            {/* Game board takes up most of the space */}
            <div className="md:col-span-3">
              <GameBoard
                game={mockGame as any}
                players={mockPlayers as any}
                currentUserId={user.id}
                onRollStone={handleRollStone}
              />
            </div>
            
            {/* Voice chat and other panels */}
            <div className="md:col-span-2 space-y-4">
              {/* Only show voice chat for high stakes games */}
              {gameStake >= 20000 && (
                <VoiceChat
                  game={mockGame as any}
                  players={mockPlayers as any}
                  currentUserId={user.id}
                />
              )}
              
              {/* Game info card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Game Information</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Game ID:</span>
                    <span className="font-medium">{mockGame.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stake:</span>
                    <span className="font-medium">₦{mockGame.stake.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="font-medium">{mockGame.commissionPercentage * 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Players:</span>
                    <span className="font-medium">{mockPlayers.length}/{mockGame.maxPlayers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium capitalize">{mockGame.status.replace('_', ' ')}</span>
                  </div>
                  {mockGame.winningNumber !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Winning Number:</span>
                      <span className="font-medium">{mockGame.winningNumber}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
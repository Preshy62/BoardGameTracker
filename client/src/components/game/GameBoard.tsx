import { useState, useEffect } from 'react';
import GameStone from './GameStone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dices, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Game, GamePlayer, User } from '@shared/schema';
import { playWinSound } from '@/lib/sounds';
import GameResultModal from '@/components/modals/GameResultModal';

interface GameBoardProps {
  game: Game;
  players: (GamePlayer & { user: { username: string; avatarInitials?: string } })[];
  currentUserId: number;
  onRollStone?: () => void;
  className?: string;
}

// Define standard stone positions that appear on the board
const STANDARD_STONE_POSITIONS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
  1100, 1200, 1300, 1400, 1500
];

// Super stones that appear on the board (special positions)
const SUPER_STONE_POSITIONS = [3355, 6624];

// All stone positions combined
const ALL_STONE_POSITIONS = [...STANDARD_STONE_POSITIONS, ...SUPER_STONE_POSITIONS];

export default function GameBoard({ 
  game, 
  players, 
  currentUserId,
  onRollStone,
  className 
}: GameBoardProps) {
  const [currentUserStone, setCurrentUserStone] = useState<number | null>(null);
  const [winningStone, setWinningStone] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  
  // Find current user in players - userId field might be id in some cases
  const currentPlayer = players.find(p => p.userId === currentUserId || p.id === currentUserId);
  
  // Is it current user's turn?
  const isUserTurn = game.status === 'in_progress' && currentPlayer && !currentPlayer.hasRolled;
  
  // Determine if game has a winner
  const hasWinner = game.status === 'completed' && game.winningNumber !== null;
  
  // Get the game winners
  const gameWinners = players
    .filter(p => p.isWinner)
    .map(p => ({
      id: p.userId,
      username: p.user.username,
      password: "",  // Include required fields with placeholder values
      email: "",
      walletBalance: 0,
      avatarInitials: p.user.avatarInitials || p.user.username.charAt(0).toUpperCase(),
      isAdmin: false,
      isActive: true,
    })) as User[];
  
  // Calculate total pot
  const potAmount = game.stake * players.length;
  
  // Handle stone roll completion
  const handleRollComplete = (number: number) => {
    setIsRolling(false);
    setCurrentUserStone(number);
    
    // If this is a winning roll, update the winning stone
    if (game.winningNumber === number) {
      setWinningStone(number);
      playWinSound();
    }
    
    // Notify parent component if needed
    if (onRollStone) {
      onRollStone();
    }
  };
  
  // Start rolling the stone
  const startRolling = () => {
    if (!isUserTurn || isRolling) return;
    setIsRolling(true);
  };
  
  // Set initial stone states based on game data
  useEffect(() => {
    // Set current user's stone if they have rolled
    if (currentPlayer && currentPlayer.rolledNumber !== null) {
      setCurrentUserStone(currentPlayer.rolledNumber);
    }
    
    // Set winning stone if game is completed
    if (game.status === 'completed' && game.winningNumber !== null) {
      setWinningStone(game.winningNumber);
      
      // Show game result modal when game is completed
      if (gameWinners.length > 0) {
        setIsResultModalOpen(true);
      }
    }
  }, [game, currentPlayer, gameWinners.length]);
  
  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dices className="h-5 w-5 text-primary" />
                Game Board
              </CardTitle>
              <CardDescription>
                Roll your stone and try to match the winning positions
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{players.length}/{game.maxPlayers}</span>
              </Badge>
              
              <Badge 
                variant={game.status === 'waiting' ? "outline" : 
                        game.status === 'in_progress' ? "default" : 
                        "secondary"}
              >
                {game.status === 'waiting' ? 'Waiting' : 
                 game.status === 'in_progress' ? 'In Progress' : 
                 'Completed'}
              </Badge>
              
              <Badge variant="outline" className="gap-1">
                ₦{game.stake.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-5">
          {/* Game status message */}
          {game.status === 'waiting' && (
            <div className="bg-slate-50 p-3 rounded-md mb-4 text-center text-sm">
              Waiting for more players to join...
            </div>
          )}
          
          {hasWinner && (
            <div className="bg-green-50 p-3 rounded-md mb-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span>Game Completed! Winning Stone: {game.winningNumber}</span>
              </div>
            </div>
          )}
          
          {/* User's stone section */}
          {(isUserTurn || currentUserStone !== null) && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Your Stone</h3>
              <div className="flex justify-center">
                <GameStone
                  number={currentUserStone || 0}
                  isRolling={isRolling}
                  isUserTurn={isUserTurn}
                  isWinner={hasWinner && currentUserStone === winningStone}
                  onRollComplete={handleRollComplete}
                  size="lg"
                  showLabel={true}
                />
              </div>
              
              {isUserTurn && !isRolling && !currentUserStone && (
                <div className="mt-4 text-center">
                  <Button onClick={startRolling}>
                    Roll Your Stone
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Board positions grid */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Board Positions</h3>
            <div className="grid grid-cols-5 gap-2">
              {ALL_STONE_POSITIONS.map(position => (
                <div key={position} className="flex justify-center">
                  <GameStone 
                    number={position}
                    isWinner={hasWinner && position === winningStone}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Players section */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Players</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {players.map(player => (
                <div 
                  key={player.userId} 
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md",
                    player.userId === currentUserId ? "bg-blue-50" : "bg-slate-50",
                    hasWinner && player.isWinner ? "border border-amber-500" : "border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center font-medium text-sm",
                      player.userId === currentUserId ? "bg-blue-100" : "bg-slate-200"
                    )}>
                      {player.user.avatarInitials || player.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {player.user.username}
                        {player.userId === currentUserId && " (You)"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {player.rolledNumber !== null ? (
                      <Badge variant={hasWinner && player.isWinner ? "default" : "outline"}>
                        {player.rolledNumber}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400">
                        Not Rolled
                      </Badge>
                    )}
                    
                    {hasWinner && player.isWinner && (
                      <Trophy className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Game Result Modal */}
      {gameWinners.length > 0 && (
        <GameResultModal
          open={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          onPlayAgain={() => {
            setIsResultModalOpen(false);
            // Any play again logic would go here
          }}
          winAmount={potAmount * (1 - game.commissionPercentage)} // Total pot minus commission
          winningNumber={game.winningNumber || 0}
          winners={gameWinners}
          standings={players.map(player => ({
            ...player,
            user: {
              id: player.userId,
              username: player.user.username
            }
          }))}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
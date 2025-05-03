import { useState, useEffect } from "react";
import GameStone from "./GameStone";
import { cn, formatCurrency } from "@/lib/utils";
import { Timer, Award } from "lucide-react";
import { GameStatus, Game, User, GamePlayer } from "@shared/schema";

interface GameBoardProps {
  game: Game;
  currentPlayerId: number;
  players: (GamePlayer & { user: User })[];
  onRollStone: () => void;
  rollingStoneNumber: number | null;
  userId: number;
  timeRemaining?: number;
  isCurrentPlayerTurn: boolean;
}

const GameBoard = ({
  game,
  currentPlayerId,
  players,
  onRollStone,
  rollingStoneNumber,
  userId,
  timeRemaining,
  isCurrentPlayerTurn
}: GameBoardProps) => {
  // No longer using a single array of game stones, as we'll be organizing them 
  // in a more realistic layout matching the physical board

  // Calculate total pool
  const totalPool = game.stake * players.length;
  const commissionAmount = totalPool * game.commissionPercentage;
  const winnerAmount = totalPool - commissionAmount;

  // Keep track of which stones are currently in the rolling animation
  const [rollingStones, setRollingStones] = useState<{[key: number]: boolean}>({});
  
  // Function to simulate the stone rolling across different stones before landing
  useEffect(() => {
    // If there's a stone rolling
    if (rollingStoneNumber !== null) {
      // Clear any previous rolling animations
      setRollingStones({});
      
      // Create a sequence of random stones to highlight as if the stone is rolling across them
      const simulateRolling = async () => {
        // Number of stones to roll through before landing on the final number
        const rollSteps = 12;
        
        // Get all possible stone numbers
        const allStoneNumbers = [
          // Top row
          29, 40, 32, 81, 7,
          // Second row
          13, 64, 1000, 101, 4,
          // Third row
          3355, 65, 12, 22, 9, 6624, 44,
          // Fourth row
          28, 21, 105, 500, 99, 20, 82, 3,
          // Fifth row
          11, 37, 72, 17, 42, 8, 30, 91, 27, 5, 40,
          // Bottom row
          6, 80, 3, 26, 100, 19, 14, 43, 16, 71, 10
        ];
        
        // Simulate rolling through random stones
        for (let i = 0; i < rollSteps; i++) {
          // Choose a random stone to highlight as part of the rolling animation
          const randomIndex = Math.floor(Math.random() * allStoneNumbers.length);
          const randomStone = allStoneNumbers[randomIndex];
          
          // Update the rolling stones map
          setRollingStones(prev => ({ ...prev, [randomStone]: true }));
          
          // Wait a short time before moving to the next stone
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // Clear the current stone
          setRollingStones(prev => {
            const updated = { ...prev };
            delete updated[randomStone];
            return updated;
          });
        }
        
        // Finally highlight the actual rolled number
        setRollingStones({ [rollingStoneNumber]: true });
      };
      
      // Start the rolling simulation
      simulateRolling();
    }
  }, [rollingStoneNumber]);

  // Function to check if a stone should be highlighted as part of the rolling animation
  const isStoneRolling = (stoneNumber: number) => {
    return rollingStones[stoneNumber] || rollingStoneNumber === stoneNumber;
  };
  
  return (
    <div className="flex-grow p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
        {/* Game Status Bar */}
        <div className="bg-primary p-4 text-white flex justify-between items-center">
          <div>
            <h2 className="font-sans font-bold text-lg">Game #{game.id}</h2>
            <p className="text-sm opacity-75">
              Stake: <span className="text-secondary font-semibold">{formatCurrency(game.stake)}</span> • {players.length} Players
            </p>
          </div>
          <div className="flex items-center">
            {timeRemaining !== undefined && (
              <div className="bg-primary-light px-3 py-1 rounded-full text-sm mr-2 flex items-center">
                <Timer className="w-4 h-4 mr-1" />
                <span>{timeRemaining}</span>
              </div>
            )}
            <div className={cn(
              "px-3 py-1 rounded-full text-white text-sm font-medium",
              game.status === "waiting" ? "bg-secondary" : 
              game.status === "in_progress" ? "bg-accent" : 
              "bg-success"
            )}>
              <span>{
                game.status === "waiting" ? "Waiting" : 
                game.status === "in_progress" ? "In Progress" :
                "Completed"
              }</span>
            </div>
          </div>
        </div>
        
        {/* Game Board */}
        <div className="relative p-4 md:p-8 bg-primary">
          <div className="bg-primary-light border-4 border-gray-700 rounded-lg p-4 md:p-6 mx-auto" style={{ maxWidth: "600px" }}>
            {/* Game Board with Live Layout */}
            <div className="relative bg-primary-light border-2 border-gray-800 p-4 rounded mb-6">
              {/* Game Title */}
              <h3 className="text-center text-white text-2xl font-sans font-bold mb-4">BIG BOYS GAME</h3>
              
              {/* Curved Arrow at top-right (matching the physical board) */}
              <div className="absolute top-8 right-16 text-white">
                <svg viewBox="0 0 48 48" width="60" height="60" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M30 10 C 40 15, 45 25, 40 35" strokeWidth="3" strokeLinecap="round" />
                  <path d="M35 32 L 40 35 L 45 32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              {/* START label - positioned on the right side like the physical board */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-white p-1 font-bold text-lg rotate-90">
                START
              </div>

              {/* Top row stones */}
              <div className="flex justify-between mb-4">
                <GameStone number={29} isRolling={isStoneRolling(29)} />
                <GameStone number={40} isRolling={isStoneRolling(40)} />
                <GameStone number={32} isRolling={isStoneRolling(32)} />
                <GameStone number={81} isRolling={isStoneRolling(81)} />
                <GameStone number={7} isRolling={isStoneRolling(7)} />
              </div>
              
              {/* Second row with 1000 as special */}
              <div className="flex justify-between mb-4">
                <GameStone number={13} isRolling={isStoneRolling(13)} />
                <GameStone number={64} isRolling={isStoneRolling(64)} />
                <GameStone number={1000} isRolling={isStoneRolling(1000)} isSpecial={true} size="lg" />
                <GameStone number={101} isRolling={isStoneRolling(101)} />
                <GameStone number={4} isRolling={isStoneRolling(4)} />
              </div>
              
              {/* Third row with 3355 and 6624 */}
              <div className="flex justify-between mb-4">
                <GameStone number={3355} isRolling={isStoneRolling(3355)} isSuper={true} />
                <GameStone number={65} isRolling={isStoneRolling(65)} />
                <GameStone number={12} isRolling={isStoneRolling(12)} />
                <GameStone number={22} isRolling={isStoneRolling(22)} />
                <GameStone number={9} isRolling={isStoneRolling(9)} />
                <GameStone number={6624} isRolling={isStoneRolling(6624)} isSuper={true} />
                <GameStone number={44} isRolling={isStoneRolling(44)} />
              </div>
              
              {/* Fourth row with 500 as special */}
              <div className="flex justify-between mb-4">
                <GameStone number={28} isRolling={isStoneRolling(28)} />
                <GameStone number={21} isRolling={isStoneRolling(21)} />
                <GameStone number={105} isRolling={isStoneRolling(105)} />
                <GameStone number={500} isRolling={isStoneRolling(500)} isSpecial={true} size="lg" />
                <GameStone number={99} isRolling={isStoneRolling(99)} />
                <GameStone number={20} isRolling={isStoneRolling(20)} />
                <GameStone number={82} isRolling={isStoneRolling(82)} />
                <GameStone number={3} isRolling={isStoneRolling(3)} />
              </div>
              
              {/* Fifth row */}
              <div className="flex justify-between mb-4">
                <GameStone number={11} isRolling={isStoneRolling(11)} size="sm" />
                <GameStone number={37} isRolling={isStoneRolling(37)} size="sm" />
                <GameStone number={72} isRolling={isStoneRolling(72)} size="sm" />
                <GameStone number={17} isRolling={isStoneRolling(17)} size="sm" />
                <GameStone number={42} isRolling={isStoneRolling(42)} size="sm" />
                <GameStone number={8} isRolling={isStoneRolling(8)} size="sm" />
                <GameStone number={30} isRolling={isStoneRolling(30)} size="sm" />
                <GameStone number={91} isRolling={isStoneRolling(91)} size="sm" />
                <GameStone number={27} isRolling={isStoneRolling(27)} size="sm" />
                <GameStone number={5} isRolling={isStoneRolling(5)} size="sm" />
                <GameStone number={40} isRolling={isStoneRolling(40)} size="sm" />
              </div>
              
              {/* Bottom row */}
              <div className="flex justify-between">
                <GameStone number={6} isRolling={isStoneRolling(6)} size="sm" />
                <GameStone number={80} isRolling={isStoneRolling(80)} size="sm" />
                <GameStone number={3} isRolling={isStoneRolling(3)} size="sm" />
                <GameStone number={26} isRolling={isStoneRolling(26)} size="sm" />
                <GameStone number={100} isRolling={isStoneRolling(100)} size="sm" />
                <GameStone number={19} isRolling={isStoneRolling(19)} size="sm" />
                <GameStone number={14} isRolling={isStoneRolling(14)} size="sm" />
                <GameStone number={43} isRolling={isStoneRolling(43)} size="sm" />
                <GameStone number={16} isRolling={isStoneRolling(16)} size="sm" />
                <GameStone number={71} isRolling={isStoneRolling(71)} size="sm" />
                <GameStone number={10} isRolling={isStoneRolling(10)} size="sm" />
              </div>
              
              {/* Money in the Bank Label */}
              <div className="border-t-2 border-gray-700 mt-4 pt-2 text-center">
                <h4 className="text-white text-sm uppercase tracking-wider">MONEY IN THE BANK</h4>
              </div>
            </div>
            
            {/* Total Pool */}
            <div className="bg-primary-light p-3 rounded-lg text-center mb-6">
              <h4 className="text-white text-sm uppercase tracking-wider mb-1">MONEY IN THE BANK</h4>
              <p className="text-secondary font-mono font-bold text-3xl">{formatCurrency(winnerAmount)}</p>
            </div>
            
            {/* Game Action Button */}
            <div className="text-center">
              <button
                onClick={onRollStone}
                disabled={!isCurrentPlayerTurn || game.status !== "in_progress"}
                className={cn(
                  "text-primary text-lg font-sans font-bold py-3 px-8 rounded-lg shadow-lg transform transition",
                  isCurrentPlayerTurn && game.status === "in_progress"
                    ? "bg-secondary hover:bg-secondary-dark hover:scale-105"
                    : "bg-gray-400 cursor-not-allowed"
                )}
              >
                {isCurrentPlayerTurn ? "ROLL STONE" : "WAITING FOR YOUR TURN"}
              </button>
              <div className="mt-2 text-xs text-white">
                {game.status === "in_progress" 
                  ? (isCurrentPlayerTurn 
                     ? "It's your turn! Click to roll!" 
                     : "Waiting for another player to roll...") 
                  : "Game is not in progress"}               
              </div>
              
              {/* Show bot game indicator */}
              {players.some(p => p.userId === 9999) && (
                <div className="mt-1 text-xs text-yellow-300">
                  Demo mode: Playing against computer
                  {players.find(p => p.userId === 9999 && !p.hasRolled) && (
                    <span className="ml-1">(Computer's turn - you can roll for it)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;

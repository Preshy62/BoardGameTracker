import { useState, useEffect, useRef } from "react";
import GameStone from "./GameStone";
import GameBall from "./GameBall";
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
  
  // Track the final selected stone with winning animation
  const [finalStoneSelected, setFinalStoneSelected] = useState<number | null>(null);
  
  // State for the enhanced rolling ball animation
  const [ballPosition, setBallPosition] = useState({ top: 50, left: 50 });
  const [showBall, setShowBall] = useState(false);
  const [boardElement, setBoardElement] = useState<HTMLElement | null>(null);
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  const [rollSpeed, setRollSpeed] = useState(200); // ms between moves
  const [rollTimer, setRollTimer] = useState<NodeJS.Timeout | null>(null);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  
  // Get a reference to the board element
  const boardRef = useRef<HTMLDivElement>(null);

  // Set board element ref once mounted
  useEffect(() => {
    if (boardRef.current) {
      setBoardElement(boardRef.current);
    }
  }, []);
  
  // Create path for dice to follow - initialized once
  const [dicePath] = useState<number[]>(() => {
    // Use all stone numbers in a zigzag pattern to create a more realistic path
    const allStoneNumbers = [
      // Top row
      29, 40, 32, 81, 7,
      // Second row
      13, 64, 1000, 101, 4,
      // Third row
      3355, 65, 12, 22, 9, 6624, 44,
      // Fourth row
      28, 21, 105, 500, 99, 20, 82, 3,
      // Bottom rows (more stones for a longer path)
      11, 37, 72, 17, 42, 8, 30, 91, 27, 5, 40,
      10, 71, 16, 43, 14, 19, 100, 26, 3, 80, 6
    ];
    
    // Create a more natural zigzag path through stone indices
    // This follows a pattern that makes it look like the ball is traveling around the board
    let randomPath = [];
    
    // Create a randomized path by sampling indices multiple times
    const indices = [];
    for (let i = 0; i < allStoneNumbers.length; i++) {
      indices.push(i);
    }
    
    // Shuffle the array using Fisher-Yates algorithm
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp: number = indices[i];
      indices[i] = indices[j]; 
      indices[j] = temp;
    }
    
    // Take a subset of the shuffled indices for our path
    randomPath = indices.slice(0, 30);
    
    console.log("Dice path created with", randomPath.length, "randomized stone indices");
    return randomPath;
  });
  
  // Get reference to the board once it's rendered
  useEffect(() => {
    const board = document.getElementById('game-board-element');
    if (board) {
      setBoardElement(board);
    }
  }, []);
  
  // Simplified animation with better performance
  useEffect(() => {
    // If there's a stone rolling
    if (rollingStoneNumber !== null) {
      console.log("🎲 Rolling animation starting for stone number:", rollingStoneNumber);
      
      // Clear any previous rolling animations
      setRollingStones({});
      
      // Set rolling flag
      setIsRolling(true);
      
      // Make sure ball is visible
      setShowBall(true);
      
      // Shake the board briefly when roll begins
      setIsBoardShaking(true);
      setTimeout(() => setIsBoardShaking(false), 1500);
      
      // Play roll sound
      try {
        const audio = new Audio();
        audio.src = '/rolling-dice.mp3';
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio failed:', e));
      } catch (e) {
        console.log('Audio not supported');
      }
      
      // Get all stone numbers in the board layout
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
      
      // Simplified animation that focuses on highlighting stones in sequence
      const simulateRolling = async () => {
        // Number of stones to highlight before landing on the final one
        const rollSteps = 8 + Math.floor(Math.random() * 7); // 8-14 steps
        const stoneIndices: number[] = [];
        
        // Create a sequence of random indices that don't repeat consecutively
        for (let i = 0; i < rollSteps; i++) {
          let randomIndex: number;
          do {
            randomIndex = Math.floor(Math.random() * allStoneNumbers.length);
          } while (i > 0 && stoneIndices[i-1] === randomIndex); // Avoid same stone twice in a row
          
          stoneIndices.push(randomIndex);
        }
        
        // Variable speed that slows down toward the end
        const speeds: number[] = [];
        for (let i = 0; i < rollSteps; i++) {
          if (i < rollSteps / 3) {
            speeds.push(200 - i * 10); // Speed up at start
          } else if (i > (rollSteps * 2) / 3) {
            speeds.push(150 + (i - (rollSteps * 2) / 3) * 50); // Slow down at end
          } else {
            speeds.push(150); // Consistent in middle
          }
        }
        
        // Highlight stones in sequence
        for (let i = 0; i < rollSteps; i++) {
          const stoneNumber = allStoneNumbers[stoneIndices[i]];
          
          // Update the active stone
          setRollingStones({ [stoneNumber]: true });
          
          // Play click sound for every other stone
          if (i % 2 === 0) {
            try {
              const clickAudio = new Audio();
              clickAudio.src = '/click.mp3';
              clickAudio.volume = 0.15;
              clickAudio.play().catch(e => console.log('Click audio failed:', e));
            } catch (e) {
              // Optional sound - fail silently
            }
          }
          
          // Wait based on the current speed
          await new Promise(resolve => setTimeout(resolve, speeds[i]));
          
          // Clear current stone highlight
          setRollingStones({});
        }
        
        // Finally, highlight the actual winning stone with a winning animation style
        // Apply winner-stone animation class to the final stone
        if (rollingStoneNumber !== null) {
          // Clear any previous winner selection to ensure we get a fresh animation
          setFinalStoneSelected(null);
          
          // Small delay to ensure state update has processed before setting the new winner
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Now set the winner stone
          setFinalStoneSelected(rollingStoneNumber);
          
          console.log("🏆 WINNER ANIMATION: Stone", rollingStoneNumber);
          
          try {
            const landingAudio = new Audio();
            landingAudio.src = '/dice-landing.mp3';
            landingAudio.volume = 0.4;
            landingAudio.play().catch(e => console.log('Landing audio failed:', e));
          } catch (e) {
            // Optional sound - fail silently
          }
          
          // Keep the final stone highlighted for a longer moment with the special animation
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          // End the animation
          setFinalStoneSelected(null);
        }
        setRollingStones({});
        setIsRolling(false);
      };
      
      // Execute the animation
      simulateRolling().catch(error => {
        console.error("Error during stone animation:", error);
        // Reset animation state in case of error
        setIsRolling(false);
        setRollingStones({});
        setShowBall(false);
      });
    }
  }, [rollingStoneNumber]);

  // Function to check if a stone should be highlighted as part of the rolling animation
  const isStoneRolling = (stoneNumber: number) => {
    return rollingStones[stoneNumber] || rollingStoneNumber === stoneNumber;
  };
  
  // Check if a stone is the final selected one that should have special winning animation
  const isWinningStone = (stoneNumber: number) => {
    return finalStoneSelected === stoneNumber;
  };
  
  // We don't need this effect anymore as the logic is incorporated in the enhanced effect above

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
            <div 
              id="game-board-element" 
              ref={boardRef}
              className={cn(
                "relative bg-primary-light border-2 border-gray-800 p-4 rounded mb-6",
                isBoardShaking && "shaking-board"
              )}>
              {/* Game Title */}
              <h3 className="text-center text-white text-2xl font-sans font-bold mb-4">BIG BOYS GAME</h3>
              
              {/* Curved Arrow at top-right (matching the physical board) */}
              <div className="absolute top-8 right-16 text-white">
                <svg viewBox="0 0 48 48" width="60" height="60" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M30 10 C 40 15, 45 25, 40 35" strokeWidth="3" strokeLinecap="round" />
                  <path d="M35 32 L 40 35 L 45 32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              {/* We've removed the GameBall components to focus purely on stone highlighting */}
              
              {/* START label - positioned on the right side like the physical board */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-white p-1 font-bold text-lg rotate-90">
                START
              </div>

              {/* Top row stones */}
              <div className="flex justify-between mb-4">
                <GameStone id="stone-29" number={29} isRolling={isStoneRolling(29)} isWinner={isWinningStone(29)} />
                <GameStone id="stone-40" number={40} isRolling={isStoneRolling(40)} isWinner={isWinningStone(40)} />
                <GameStone id="stone-32" number={32} isRolling={isStoneRolling(32)} isWinner={isWinningStone(32)} />
                <GameStone id="stone-81" number={81} isRolling={isStoneRolling(81)} isWinner={isWinningStone(81)} />
                <GameStone id="stone-7" number={7} isRolling={isStoneRolling(7)} isWinner={isWinningStone(7)} />
              </div>
              
              {/* Second row with 1000 as special */}
              <div className="flex justify-between mb-4">
                <GameStone id="stone-13" number={13} isRolling={isStoneRolling(13)} isWinner={isWinningStone(13)} />
                <GameStone id="stone-64" number={64} isRolling={isStoneRolling(64)} isWinner={isWinningStone(64)} />
                <GameStone id="stone-1000" number={1000} isRolling={isStoneRolling(1000)} isWinner={isWinningStone(1000)} isSpecial={true} size="lg" />
                <GameStone id="stone-101" number={101} isRolling={isStoneRolling(101)} isWinner={isWinningStone(101)} />
                <GameStone id="stone-4" number={4} isRolling={isStoneRolling(4)} isWinner={isWinningStone(4)} />
              </div>
              
              {/* Third row with 3355 and 6624 */}
              <div className="flex justify-between mb-4">
                <GameStone id="stone-3355" number={3355} isRolling={isStoneRolling(3355)} isWinner={isWinningStone(3355)} isSuper={true} />
                <GameStone id="stone-65" number={65} isRolling={isStoneRolling(65)} isWinner={isWinningStone(65)} />
                <GameStone id="stone-12" number={12} isRolling={isStoneRolling(12)} isWinner={isWinningStone(12)} />
                <GameStone id="stone-22" number={22} isRolling={isStoneRolling(22)} isWinner={isWinningStone(22)} />
                <GameStone id="stone-9" number={9} isRolling={isStoneRolling(9)} isWinner={isWinningStone(9)} />
                <GameStone id="stone-6624" number={6624} isRolling={isStoneRolling(6624)} isWinner={isWinningStone(6624)} isSuper={true} />
                <GameStone id="stone-44" number={44} isRolling={isStoneRolling(44)} isWinner={isWinningStone(44)} />
              </div>
              
              {/* Fourth row with 500 as special */}
              <div className="flex justify-between mb-4">
                <GameStone id="stone-28" number={28} isRolling={isStoneRolling(28)} isWinner={isWinningStone(28)} />
                <GameStone id="stone-21" number={21} isRolling={isStoneRolling(21)} isWinner={isWinningStone(21)} />
                <GameStone id="stone-105" number={105} isRolling={isStoneRolling(105)} isWinner={isWinningStone(105)} />
                <GameStone id="stone-500" number={500} isRolling={isStoneRolling(500)} isWinner={isWinningStone(500)} isSpecial={true} size="lg" />
                <GameStone id="stone-99" number={99} isRolling={isStoneRolling(99)} isWinner={isWinningStone(99)} />
                <GameStone id="stone-20" number={20} isRolling={isStoneRolling(20)} isWinner={isWinningStone(20)} />
                <GameStone id="stone-82" number={82} isRolling={isStoneRolling(82)} isWinner={isWinningStone(82)} />
                <GameStone id="stone-3" number={3} isRolling={isStoneRolling(3)} isWinner={isWinningStone(3)} />
              </div>
              
              {/* Fifth row */}
              <div className="flex justify-between mb-4">
                <GameStone id="stone-11" number={11} isRolling={isStoneRolling(11)} isWinner={isWinningStone(11)} size="sm" />
                <GameStone id="stone-37" number={37} isRolling={isStoneRolling(37)} isWinner={isWinningStone(37)} size="sm" />
                <GameStone id="stone-72" number={72} isRolling={isStoneRolling(72)} isWinner={isWinningStone(72)} size="sm" />
                <GameStone id="stone-17" number={17} isRolling={isStoneRolling(17)} isWinner={isWinningStone(17)} size="sm" />
                <GameStone id="stone-42" number={42} isRolling={isStoneRolling(42)} isWinner={isWinningStone(42)} size="sm" />
                <GameStone id="stone-8" number={8} isRolling={isStoneRolling(8)} isWinner={isWinningStone(8)} size="sm" />
                <GameStone id="stone-30" number={30} isRolling={isStoneRolling(30)} isWinner={isWinningStone(30)} size="sm" />
                <GameStone id="stone-91" number={91} isRolling={isStoneRolling(91)} isWinner={isWinningStone(91)} size="sm" />
                <GameStone id="stone-27" number={27} isRolling={isStoneRolling(27)} isWinner={isWinningStone(27)} size="sm" />
                <GameStone id="stone-5" number={5} isRolling={isStoneRolling(5)} isWinner={isWinningStone(5)} size="sm" />
                <GameStone id="stone-40" number={40} isRolling={isStoneRolling(40)} isWinner={isWinningStone(40)} size="sm" />
              </div>
              
              {/* Bottom row */}
              <div className="flex justify-between">
                <GameStone id="stone-6" number={6} isRolling={isStoneRolling(6)} isWinner={isWinningStone(6)} size="sm" />
                <GameStone id="stone-80" number={80} isRolling={isStoneRolling(80)} isWinner={isWinningStone(80)} size="sm" />
                <GameStone id="stone-3" number={3} isRolling={isStoneRolling(3)} isWinner={isWinningStone(3)} size="sm" />
                <GameStone id="stone-26" number={26} isRolling={isStoneRolling(26)} isWinner={isWinningStone(26)} size="sm" />
                <GameStone id="stone-100" number={100} isRolling={isStoneRolling(100)} isWinner={isWinningStone(100)} size="sm" />
                <GameStone id="stone-19" number={19} isRolling={isStoneRolling(19)} isWinner={isWinningStone(19)} size="sm" />
                <GameStone id="stone-14" number={14} isRolling={isStoneRolling(14)} isWinner={isWinningStone(14)} size="sm" />
                <GameStone id="stone-43" number={43} isRolling={isStoneRolling(43)} isWinner={isWinningStone(43)} size="sm" />
                <GameStone id="stone-16" number={16} isRolling={isStoneRolling(16)} isWinner={isWinningStone(16)} size="sm" />
                <GameStone id="stone-71" number={71} isRolling={isStoneRolling(71)} isWinner={isWinningStone(71)} size="sm" />
                <GameStone id="stone-10" number={10} isRolling={isStoneRolling(10)} isWinner={isWinningStone(10)} size="sm" />
              </div>
              
              {/* Money in the Bank Label */}
              <div className="border-t-2 border-gray-700 mt-4 pt-2 text-center">
                <h4 className="text-white text-sm uppercase tracking-wider">MONEY IN THE BANK</h4>
              </div>
              
              {/* We've removed all GameBall components to focus purely on stone highlighting */}
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

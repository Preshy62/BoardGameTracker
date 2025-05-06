import { useState, useEffect, useRef } from "react";
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
  
  // Enhanced function to simulate the stone rolling across different stones before landing
  useEffect(() => {
    // If there's a stone rolling
    if (rollingStoneNumber !== null) {
      console.log("🎲 Rolling animation starting for stone number:", rollingStoneNumber);
      
      // Clear any previous rolling animations
      setRollingStones({});
      
      // Set rolling flag
      setIsRolling(true);
      
      // Set ball visible globally for fallback visibility
      document.documentElement.style.setProperty('--ball-visible', '1');
      
      // Start a new rolling animation
      const simulateEnhancedRolling = async () => {
        console.log("Simulation animation started for stone:", rollingStoneNumber);
        
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
        
        // Show the rolling ball
        setShowBall(true);
        
        // Get all possible stone numbers in a specific order for better visual flow
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
        
        // First set the ball at the center to ensure visibility
        if (boardRef.current) {
          const boardRect = boardRef.current.getBoundingClientRect();
          const centerTop = boardRect.height / 2;
          const centerLeft = boardRect.width / 2;
          
          console.log("Setting initial ball position to center:", {centerTop, centerLeft});
          
          // Set variables for initial position
          document.documentElement.style.setProperty('--ball-top', `${centerTop}px`);
          document.documentElement.style.setProperty('--ball-left', `${centerLeft}px`);
          
          // Update React state as well
          setBallPosition({
            top: centerTop,
            left: centerLeft,
          });
        } else {
          console.error("Board ref not available!");
          // Fallback position
          document.documentElement.style.setProperty('--ball-top', '50%');
          document.documentElement.style.setProperty('--ball-left', '50%');
        }
        
        // Wait a moment for the ball to appear at center
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // The number of steps will vary to make it look more natural
        const rollSteps = 12 + Math.floor(Math.random() * 8); // Between 12-20 steps
        
        // Variable speed for more realistic animation
        let currentSpeed = 250; // Start slightly slower
        
        // Follow a path through the stones
        for (let i = 0; i < rollSteps; i++) {
          if (!boardRef.current) {
            console.error("Board ref lost during animation!");
            continue;
          }
          
          // Adjust speed - faster in the middle, slower at start and end
          if (i < rollSteps / 3) {
            // Gradually speed up at the beginning
            currentSpeed = Math.max(150, 250 - i * 8);
          } else if (i > (rollSteps * 2) / 3) {
            // Gradually slow down near the end
            currentSpeed = 150 + (i - (rollSteps * 2) / 3) * 10;
          }
          
          // Choose a stone to highlight from our path
          const pathIndex = i % dicePath.length;
          const stoneIndex = dicePath[pathIndex];
          const currentStone = allStoneNumbers[stoneIndex % allStoneNumbers.length];
          
          // Save the current path index
          setCurrentPathIndex(pathIndex);
          
          // Update the rolling stones map to highlight the current stone
          setRollingStones(prev => ({ ...prev, [currentStone]: true }));
          
          // Move the ball to this stone's position
          const stoneElement = document.getElementById(`stone-${currentStone}`);
          if (stoneElement && boardRef.current) {
            const rect = stoneElement.getBoundingClientRect();
            const boardRect = boardRef.current.getBoundingClientRect();
            
            // Calculate center position with offsets that ensure ball is properly centered
            const newTop = rect.top - boardRect.top + (rect.height / 2);
            const newLeft = rect.left - boardRect.left + (rect.width / 2);
            
            console.log(`Ball moving to stone ${currentStone} at position: `, {newTop, newLeft});
            
            // Set variables for ball position
            document.documentElement.style.setProperty('--ball-top', `${newTop}px`);
            document.documentElement.style.setProperty('--ball-left', `${newLeft}px`);
            
            // Update React state as well - this is crucial for directly styled elements
            setBallPosition({
              top: newTop,
              left: newLeft,
            });
          } else {
            console.error(`Could not find stone element for stone ${currentStone}`);
          }
          
          // Play a click sound periodically for movement
          if (i % 3 === 0) {
            try {
              const clickAudio = new Audio();
              clickAudio.src = '/click.mp3'; // Soft click sound
              clickAudio.volume = 0.1;
              clickAudio.play().catch(e => console.log('Click audio failed:', e));
            } catch (e) {
              // Optional sound - fail silently
            }
          }
          
          // Wait based on the current speed
          await new Promise(resolve => setTimeout(resolve, currentSpeed));
          
          // Clear the current stone
          setRollingStones(prev => {
            const updated = { ...prev };
            delete updated[currentStone];
            return updated;
          });
        }
        
        // Finally move to and highlight the actual rolled number
        const finalStoneElement = document.getElementById(`stone-${rollingStoneNumber}`);
        if (finalStoneElement && boardRef.current) {
          const rect = finalStoneElement.getBoundingClientRect();
          const boardRect = boardRef.current.getBoundingClientRect();
          
          // Calculate final positions
          const finalTop = rect.top - boardRect.top + (rect.height / 2);
          const finalLeft = rect.left - boardRect.left + (rect.width / 2);
          
          console.log(`Ball final landing on stone ${rollingStoneNumber} at:`, {finalTop, finalLeft});
          
          // Make a more dramatic movement to the final position (slightly above target)
          document.documentElement.style.setProperty('--ball-top', `${finalTop - 10}px`);
          document.documentElement.style.setProperty('--ball-left', `${finalLeft}px`);
          
          // Update React state as well
          setBallPosition({
            top: finalTop - 10, // Slightly higher for dramatic effect
            left: finalLeft,
          });
          
          // After a very short delay, settle into the final position
          setTimeout(() => {
            document.documentElement.style.setProperty('--ball-top', `${finalTop}px`);
            document.documentElement.style.setProperty('--ball-left', `${finalLeft}px`);
            
            // Update React state as well
            setBallPosition({
              top: finalTop,
              left: finalLeft,
            });
          }, 150);
        } else {
          console.error(`Could not find final stone element for stone ${rollingStoneNumber}`);
        }
        
        // Highlight the final stone
        setRollingStones({ [rollingStoneNumber]: true });
        
        // Landing sound for final position
        try {
          const landAudio = new Audio();
          landAudio.src = '/dice-landing.mp3'; // Final landing sound
          landAudio.volume = 0.3;
          landAudio.play().catch(e => console.log('Landing audio failed:', e));
        } catch (e) {
          // Optional sound - fail silently
        }
        
        // Reset rolling flag
        setIsRolling(false);
        
        // Keep ball visible for a moment after landing
        setTimeout(() => {
          setShowBall(false);
          document.documentElement.style.setProperty('--ball-visible', '0');
        }, 3000);
      };
      
      // Start the enhanced rolling simulation
      simulateEnhancedRolling();
    }
  }, [rollingStoneNumber, dicePath]);

  // Function to check if a stone should be highlighted as part of the rolling animation
  const isStoneRolling = (stoneNumber: number) => {
    return rollingStones[stoneNumber] || rollingStoneNumber === stoneNumber;
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
              
              {/* Main rolling ball element */}
              {(showBall || rollingStoneNumber) && (
                <div 
                  className="dice-ball"
                  style={{
                    position: 'absolute',
                    width: '60px',
                    height: '60px',
                    display: 'block',
                    top: `${ballPosition.top}px`,
                    left: `${ballPosition.left}px`,
                    zIndex: 9999,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, white 20%, #FF8800 60%, gold 100%)',
                    border: '5px solid gold',
                    boxShadow: '0 0 30px 15px rgba(255, 136, 0, 0.9)',
                    transform: 'translate(-50%, -50%)',
                    filter: 'blur(0.5px)',
                    animation: 'ball-pulse 0.5s infinite alternate',
                    transition: 'top 0.4s ease-out, left 0.4s ease-out'
                  }}
                />
              )}
              
              {/* Backup ball using CSS variables for consistent positioning */}
              {(showBall || rollingStoneNumber) && (
                <div 
                  className="ball-element roll-animation"
                  style={{
                    top: 'var(--ball-top)',
                    left: 'var(--ball-left)'
                  }}
                />
              )}
              
              {/* Floating dice element for better visibility */}
              {rollingStoneNumber && (
                <div 
                  className="dice-element"
                  style={{
                    position: 'absolute',
                    width: '40px',
                    height: '40px',
                    display: 'block',
                    top: '30%',
                    left: '70%',
                    zIndex: 9999,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, white 30%, #FF0000 100%)',
                    border: '3px solid white',
                    boxShadow: '0 0 15px 7px rgba(255, 215, 0, 0.8)',
                    transform: 'translate(-50%, -50%)',
                    animation: 'roll-glow 0.8s linear infinite'
                  }}
                />
              )}
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

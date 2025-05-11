import { useState, useEffect, useRef } from "react";
import GameStone from "./GameStone";
import GameBall from "./GameBall";
import TurnIndicator from "./TurnIndicator";
import WinCelebration from "./WinCelebration";
import { cn, formatCurrency } from "@/lib/utils";
import { Timer, Award, Users } from "lucide-react";
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
  const [winnerInfo, setWinnerInfo] = useState<{name: string, amount: number} | null>(null);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  
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
      
      // Enhanced animation with ball movement and stone highlighting
      const simulateRolling = async () => {
        // Number of stones to highlight before landing on the final one
        const rollSteps = 10 + Math.floor(Math.random() * 8); // 10-17 steps
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
            speeds.push(180 - i * 8); // Speed up at start
          } else if (i > (rollSteps * 2) / 3) {
            speeds.push(130 + (i - (rollSteps * 2) / 3) * 40); // Slow down at end
          } else {
            speeds.push(130); // Consistent in middle
          }
        }
        
        // Get stone positions for ball movement
        const getStonePosition = (stoneId: number): { top: number, left: number } => {
          const stoneElement = document.getElementById(`stone-${stoneId}`);
          if (!stoneElement || !boardElement) {
            // Default centered position if element not found
            return { top: boardElement?.clientHeight ? boardElement.clientHeight / 2 : 250, 
                    left: boardElement?.clientWidth ? boardElement.clientWidth / 2 : 300 };
          }
          
          const boardRect = boardElement.getBoundingClientRect();
          const stoneRect = stoneElement.getBoundingClientRect();
          
          return {
            top: stoneRect.top - boardRect.top + stoneRect.height / 2,
            left: stoneRect.left - boardRect.left + stoneRect.width / 2
          };
        };
        
        // Highlight stones in sequence with enhanced ball movement
        for (let i = 0; i < rollSteps; i++) {
          const stoneNumber = allStoneNumbers[stoneIndices[i]];
          
          // Update the active stone
          setRollingStones({ [stoneNumber]: true });
          
          // Move ball to the current stone position
          const position = getStonePosition(stoneNumber);
          setBallPosition(position);
          
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
        
        // Finally, move to and highlight the actual winning stone with enhanced animations
        if (rollingStoneNumber !== null) {
          // Clear any previous winner selection to ensure we get a fresh animation
          setFinalStoneSelected(null);
          
          // Small delay to ensure state update has processed before setting the new winner
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Move ball to the winning stone position with a slight bounce effect
          const winningPosition = getStonePosition(rollingStoneNumber);
          // Add a slight bounce effect by setting position slightly above the final position
          setBallPosition({ 
            top: winningPosition.top - 20, 
            left: winningPosition.left 
          });
          
          // Wait for the ball to move
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // Final position
          setBallPosition(winningPosition);
          
          // Now set the winner stone with enhanced animation sequence
          setFinalStoneSelected(rollingStoneNumber);
          
          console.log("🏆 WINNER ANIMATION: Stone", rollingStoneNumber);
          
          // Find the current player for win celebration
          const currentPlayer = players.find(p => p.userId === currentPlayerId)?.user;
          
          // Set winner info for the celebration component
          if (currentPlayer) {
            setWinnerInfo({
              name: isCurrentPlayerTurn ? 'You' : currentPlayer.username,
              amount: winnerAmount
            });
          }
          
          // Play landing sound with enhanced volume
          try {
            const landingAudio = new Audio();
            landingAudio.src = '/dice-landing.mp3';
            landingAudio.volume = 0.5;
            landingAudio.play().catch(e => console.log('Landing audio failed:', e));
            
            // Add a victory sound after a short delay
            setTimeout(() => {
              try {
                const victoryAudio = new Audio();
                victoryAudio.src = '/winner.mp3';  // Make sure this file exists
                victoryAudio.volume = 0.4;
                victoryAudio.play().catch(e => console.log('Victory audio failed:', e));
              } catch (e) {
                // Optional sound - fail silently
              }
            }, 500);
          } catch (e) {
            // Optional sound - fail silently
          }
          
          // Keep the final stone highlighted for a moment
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Show the win celebration overlay
          setShowWinCelebration(true);
          
          // Keep the celebration visible for a longer moment
          await new Promise(resolve => setTimeout(resolve, 6000));
          
          // Hide the celebration
          setShowWinCelebration(false);
          
          // End the animation after a short delay to allow for transitions
          setTimeout(() => {
            setFinalStoneSelected(null);
            setWinnerInfo(null);
          }, 500);
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
  
  // Determine if we should show the winner overlay
  const showWinnerOverlay = finalStoneSelected !== null;
  
  // Find the current player
  const currentPlayer = players.find(p => p.userId === currentPlayerId)?.user;
  
  return (
    <div className="flex-grow p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
        {/* Enhanced Game Status Bar */}
        <div className="bg-gradient-to-r from-primary to-primary-light p-4 text-white flex flex-wrap justify-between items-center border-b-2 border-gray-700 relative">
          {/* Left side - Game info */}
          <div className="flex items-center">
            <div className="bg-primary-light p-2 rounded-lg mr-3 border border-gray-600 shadow-inner">
              <div className="text-xs uppercase text-gray-400 mb-0.5">Game ID</div>
              <div className="font-mono text-lg font-bold text-secondary">{game.id}</div>
            </div>
            
            <div>
              <h2 className="font-sans font-bold text-lg">Big Boys Game</h2>
              <div className="flex items-center space-x-3 mt-1">
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 mr-1 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span className="text-secondary font-semibold">
                    {formatCurrency(game.stake)}
                  </span>
                  <span className="ml-1 text-gray-300">stake</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-1 text-gray-300" />
                  <span className="font-semibold text-gray-300">{players.length}</span>
                  <span className="ml-1 text-gray-400">players</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Game status and turn indicator */}
          <div className="flex items-center gap-3">
            {/* Turn indicator */}
            {game.status === "in_progress" && (
              <TurnIndicator 
                currentPlayer={currentPlayer}
                isYourTurn={isCurrentPlayerTurn}
                timeLeft={timeRemaining}
                className="hidden md:flex"
              />
            )}
            
            {/* Game status */}
            {timeRemaining !== undefined && (
              <div className="bg-primary-light/70 px-3 py-2 rounded-lg text-sm mr-3 flex items-center shadow-inner border border-gray-700 md:hidden">
                <Timer className="w-4 h-4 mr-2 text-secondary" />
                <div>
                  <div className="text-xs text-gray-400">Time Left</div>
                  <div className="font-mono font-bold">{timeRemaining}</div>
                </div>
              </div>
            )}
            
            <div className={cn(
              "px-4 py-2 rounded-lg text-white text-sm font-medium relative overflow-hidden shadow-lg border border-gray-700",
              game.status === "waiting" 
                ? "bg-yellow-600" 
                : game.status === "in_progress" 
                  ? "bg-accent" 
                  : "bg-green-600"
            )}>
              {/* Status animation background */}
              <div className={cn(
                "absolute inset-0 opacity-30",
                game.status === "waiting" 
                  ? "waiting-animation" 
                  : game.status === "in_progress" 
                    ? "progress-animation" 
                    : "completed-animation"
              )}></div>
              
              {/* Status icon and text */}
              <div className="flex items-center relative z-10">
                <div className="mr-2">
                  {game.status === "waiting" ? (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ) : game.status === "in_progress" ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path d="M12 8v4l3 3" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-xs text-white/70">Status</div>
                  <div className="font-semibold">{
                    game.status === "waiting" ? "Waiting" : 
                    game.status === "in_progress" ? "In Progress" :
                    "Completed"
                  }</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status indicator line */}
          <div className={cn(
            "absolute bottom-0 left-0 h-1 transition-all duration-700",
            game.status === "waiting" ? "bg-yellow-500 w-1/3" : 
            game.status === "in_progress" ? "bg-accent w-2/3" : 
            "bg-green-500 w-full"
          )}></div>
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
              
              {/* Enhanced GameBall with trail effects */}
              <GameBall 
                visible={showBall} 
                top={ballPosition.top} 
                left={ballPosition.left}
                color="gold"
                size="md"
                showTrails={true}
              />
              
              {/* START label - positioned on the right side like the physical board */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-white p-1 font-bold text-lg rotate-90">
                START
              </div>

              {/* Top row stones */}
              <div className="flex justify-between mb-4">
                <GameStone 
                  id="stone-29" 
                  number={29} 
                  isRolling={isStoneRolling(29)} 
                  isWinner={isWinningStone(29)} 
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType={game.status === "in_progress" ? "pulse" : "none"}
                />
                <GameStone 
                  id="stone-40" 
                  number={40} 
                  isRolling={isStoneRolling(40)} 
                  isWinner={isWinningStone(40)} 
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType={game.status === "in_progress" ? "glow" : "none"}
                />
                <GameStone 
                  id="stone-32" 
                  number={32} 
                  isRolling={isStoneRolling(32)} 
                  isWinner={isWinningStone(32)} 
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType={game.status === "in_progress" ? "pulse" : "none"}
                />
                <GameStone 
                  id="stone-81" 
                  number={81} 
                  isRolling={isStoneRolling(81)} 
                  isWinner={isWinningStone(81)} 
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType={game.status === "in_progress" ? "pulse" : "none"}
                />
                <GameStone 
                  id="stone-7" 
                  number={7} 
                  isRolling={isStoneRolling(7)} 
                  isWinner={isWinningStone(7)} 
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType={game.status === "in_progress" ? "pulse" : "none"}
                />
              </div>
              
              {/* Second row with 1000 as special */}
              <div className="flex justify-between mb-4">
                <GameStone 
                  id="stone-13" 
                  number={13} 
                  isRolling={isStoneRolling(13)} 
                  isWinner={isWinningStone(13)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-64" 
                  number={64} 
                  isRolling={isStoneRolling(64)} 
                  isWinner={isWinningStone(64)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-1000" 
                  number={1000} 
                  isRolling={isStoneRolling(1000)} 
                  isWinner={isWinningStone(1000)} 
                  isSpecial={true} 
                  size="lg"
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType="glow"
                />
                <GameStone 
                  id="stone-101" 
                  number={101} 
                  isRolling={isStoneRolling(101)} 
                  isWinner={isWinningStone(101)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-4" 
                  number={4} 
                  isRolling={isStoneRolling(4)} 
                  isWinner={isWinningStone(4)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
              </div>
              
              {/* Third row with 3355 and 6624 */}
              <div className="flex justify-between mb-4">
                <GameStone 
                  id="stone-3355" 
                  number={3355} 
                  isRolling={isStoneRolling(3355)} 
                  isWinner={isWinningStone(3355)} 
                  isSuper={true}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType="bounce"
                />
                <GameStone 
                  id="stone-65" 
                  number={65} 
                  isRolling={isStoneRolling(65)} 
                  isWinner={isWinningStone(65)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-12" 
                  number={12} 
                  isRolling={isStoneRolling(12)} 
                  isWinner={isWinningStone(12)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-22" 
                  number={22} 
                  isRolling={isStoneRolling(22)} 
                  isWinner={isWinningStone(22)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-9" 
                  number={9} 
                  isRolling={isStoneRolling(9)} 
                  isWinner={isWinningStone(9)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-6624" 
                  number={6624} 
                  isRolling={isStoneRolling(6624)} 
                  isWinner={isWinningStone(6624)} 
                  isSuper={true}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType="spin"
                />
                <GameStone 
                  id="stone-44" 
                  number={44} 
                  isRolling={isStoneRolling(44)} 
                  isWinner={isWinningStone(44)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
              </div>
              
              {/* Fourth row with 500 as special */}
              <div className="flex justify-between mb-4">
                <GameStone 
                  id="stone-28" 
                  number={28} 
                  isRolling={isStoneRolling(28)} 
                  isWinner={isWinningStone(28)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-21" 
                  number={21} 
                  isRolling={isStoneRolling(21)} 
                  isWinner={isWinningStone(21)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-105" 
                  number={105} 
                  isRolling={isStoneRolling(105)} 
                  isWinner={isWinningStone(105)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-500" 
                  number={500} 
                  isRolling={isStoneRolling(500)} 
                  isWinner={isWinningStone(500)} 
                  isSpecial={true} 
                  size="lg"
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                  animationType="glow"
                />
                <GameStone 
                  id="stone-99" 
                  number={99} 
                  isRolling={isStoneRolling(99)} 
                  isWinner={isWinningStone(99)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-20" 
                  number={20} 
                  isRolling={isStoneRolling(20)} 
                  isWinner={isWinningStone(20)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-82" 
                  number={82} 
                  isRolling={isStoneRolling(82)} 
                  isWinner={isWinningStone(82)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
                <GameStone 
                  id="stone-3" 
                  number={3} 
                  isRolling={isStoneRolling(3)} 
                  isWinner={isWinningStone(3)}
                  isYourTurn={isCurrentPlayerTurn && game.status === "in_progress" && !isRolling}
                />
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
              
              {/* Enhanced winner announcement overlay */}
              {showWinnerOverlay && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50 winner-overlay backdrop-blur-sm">
                  <div className="relative p-8 rounded-lg bg-primary-light/70 border-4 border-yellow-500 shadow-2xl transform scale-in-animation">
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                      <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-glow">
                        <circle cx="60" cy="60" r="55" fill="none" stroke="#FFC700" strokeWidth="2" strokeDasharray="8 4" className="rotate-animation"/>
                        <circle cx="60" cy="60" r="40" fill="#FFC700" className="pulse-animation" fillOpacity="0.3"/>
                      </svg>
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-radial from-yellow-400/20 to-transparent rounded-lg"></div>
                    
                    <div className="text-center relative z-10">
                      <h3 className="text-white text-2xl mb-2 opacity-90">WINNING NUMBER</h3>
                      <h2 className="text-6xl font-bold text-yellow-400 mb-4 winner-text-animation drop-shadow-glow">
                        {finalStoneSelected}
                      </h2>
                      <div className="bg-yellow-500 text-primary py-2 px-6 rounded-full inline-block transform winner-bounce-animation">
                        <p className="text-3xl font-bold tracking-wider">WINNER!</p>
                      </div>
                      
                      <div className="mt-6 text-white/90">
                        Get ready for the next round...
                      </div>
                    </div>
                    
                    {/* Celebration particles */}
                    <div className="absolute -top-10 left-0 w-full h-full pointer-events-none overflow-hidden">
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Enhanced Money in the Bank Display */}
            <div className="bg-gradient-to-b from-primary-light to-primary p-4 rounded-lg text-center mb-6 border-2 border-yellow-600 shadow-lg relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden">
                <svg width="100%" height="100%" className="absolute opacity-10">
                  <pattern id="money-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="4" fill="gold" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#money-pattern)" />
                </svg>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-1">
                  <svg className="w-5 h-5 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <path d="M12 6c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z" />
                    <path d="M12 16c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z" />
                    <path d="M10 9h4v6h-4z" />
                  </svg>
                  <h4 className="text-white text-sm uppercase tracking-wider font-bold">MONEY IN THE BANK</h4>
                </div>
                
                <div className="bank-amount-pulse py-2 px-3 bg-black/30 rounded-lg inline-block">
                  <p className="text-secondary font-mono font-bold text-3xl money-value-animation">
                    {formatCurrency(winnerAmount)}
                  </p>
                </div>
                
                <div className="mt-2 text-xs text-white/70">Winner takes all minus {game.commissionPercentage * 100}% commission</div>
              </div>
            </div>
            
            {/* Game Action Button */}
            <div className="text-center">
              {/* Enhanced button with pulsing animation when it's your turn */}
              <button
                onClick={onRollStone}
                disabled={!isCurrentPlayerTurn || game.status !== "in_progress" || isRolling}
                className={cn(
                  "text-primary text-lg font-sans font-bold py-3 px-8 rounded-lg shadow-lg transform transition duration-300 relative",
                  isCurrentPlayerTurn && game.status === "in_progress" && !isRolling
                    ? "bg-secondary hover:bg-secondary-dark hover:scale-105 hover:shadow-xl active:scale-95"
                    : "bg-gray-400 cursor-not-allowed opacity-80",
                  isCurrentPlayerTurn && game.status === "in_progress" && !isRolling && "your-turn-pulse"
                )}
                aria-label={isCurrentPlayerTurn ? "Roll the stone" : "Waiting for your turn"}
              >
                {isRolling 
                  ? "ROLLING..." 
                  : isCurrentPlayerTurn 
                    ? "ROLL STONE" 
                    : "WAITING FOR YOUR TURN"}
                
                {/* Add subtle gold shine effect on active button */}
                {isCurrentPlayerTurn && game.status === "in_progress" && !isRolling && (
                  <span className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                    <span className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent gold-shine-animation"></span>
                  </span>
                )}
              </button>
              
              {/* Status message with improved styling */}
              <div className={cn(
                "mt-3 text-sm transition-all duration-300",
                isCurrentPlayerTurn && game.status === "in_progress" && !isRolling
                  ? "text-secondary font-medium"
                  : "text-white/70"
              )}>
                {isRolling 
                  ? "Stone is rolling..." 
                  : game.status === "in_progress" 
                    ? (isCurrentPlayerTurn 
                       ? "It's your turn! Click to roll!" 
                       : "Waiting for another player to roll...") 
                    : "Game is not in progress"}               
              </div>
              
              {/* Show bot game indicator with improved styling */}
              {players.some(p => p.userId === 9999) && (
                <div className="mt-2 text-sm text-yellow-300 font-medium bg-primary-light/50 py-1 px-3 rounded-full inline-block">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                      <path d="M12 8v4" />
                      <path d="M3.3 10a8.67 8.67 0 0 0 2.7 6.33" />
                      <path d="M20.7 10a8.67 8.67 0 0 1-2.7 6.33" />
                      <path d="M15 18H9a2 2 0 0 0-2 2 1 1 0 0 0 1 1h8a1 1 0 0 0 1-1 2 2 0 0 0-2-2z" />
                    </svg>
                    Demo mode: Playing against computer
                    {players.find(p => p.userId === 9999 && !p.hasRolled) && (
                      <span className="ml-1 text-white/80">(Computer's turn - you can roll for it)</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced animation components */}
      {showWinCelebration && winnerInfo && (
        <WinCelebration 
          isVisible={showWinCelebration}
          winnerName={winnerInfo.name}
          winAmount={winnerInfo.amount}
          currency={game.currency || '₦'}
          onClose={() => setShowWinCelebration(false)}
          autoHideDuration={7000}
        />
      )}
    </div>
  );
};

export default GameBoard;

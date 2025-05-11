import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import GameStone from "@/components/game/GameStone";
import GameBall from "@/components/game/GameBall";

interface GameBoardDemoProps {
  rollingStoneNumber: number | null;
}

const GameBoardDemo = ({ rollingStoneNumber }: GameBoardDemoProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [rollingStones, setRollingStones] = useState<Record<number, boolean>>({});
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [showBall, setShowBall] = useState(false);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [finalStoneSelected, setFinalStoneSelected] = useState<number | null>(null);
  
  // Ball position for direct styling
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  
  // Random path for the dice to follow (stone indices in the allStoneNumbers array)
  const dicePath = [8, 12, 5, 16, 10, 19, 2, 14, 7, 11, 3, 15, 9, 1, 4, 18, 6, 13, 0, 17];
  
  // Capture the board as a ref on mount
  useEffect(() => {
    // We'll use the ref that React automatically sets up
    // No need to manually assign boardRef.current
  }, []);
  
  // Enhanced function to simulate the stone rolling across different stones before landing
  useEffect(() => {
    // If there's a stone rolling
    if (rollingStoneNumber !== null) {
      console.log("🎲 Demo: Rolling animation starting for stone number:", rollingStoneNumber);
      
      // Clear any previous rolling animations
      setRollingStones({});
      
      // Set rolling flag
      setIsRolling(true);
      
      // Set ball visible globally for fallback visibility
      document.documentElement.style.setProperty('--ball-visible', '1');
      
      // Start a new rolling animation
      const simulateEnhancedRolling = async () => {
        console.log("Demo: Simulation animation started for stone:", rollingStoneNumber);
        
        // Shake the board briefly when roll begins
        setIsBoardShaking(true);
        setTimeout(() => setIsBoardShaking(false), 1500);
        
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
          
          console.log("Demo: Setting initial ball position to center:", {centerTop, centerLeft});
          
          // Set variables for initial position
          document.documentElement.style.setProperty('--ball-top', `${centerTop}px`);
          document.documentElement.style.setProperty('--ball-left', `${centerLeft}px`);
          
          // Update React state as well
          setBallPosition({
            top: centerTop,
            left: centerLeft,
          });
        } else {
          console.error("Demo: Board ref not available!");
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
            console.error("Demo: Board ref lost during animation!");
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
          const stoneElement = document.getElementById(`demo-stone-${currentStone}`);
          if (stoneElement && boardRef.current) {
            const rect = stoneElement.getBoundingClientRect();
            const boardRect = boardRef.current.getBoundingClientRect();
            
            // Calculate center position with offsets that ensure ball is properly centered
            const newTop = rect.top - boardRect.top + (rect.height / 2);
            const newLeft = rect.left - boardRect.left + (rect.width / 2);
            
            console.log(`Demo: Ball moving to stone ${currentStone} at position: `, {newTop, newLeft});
            
            // Set variables for ball position
            document.documentElement.style.setProperty('--ball-top', `${newTop}px`);
            document.documentElement.style.setProperty('--ball-left', `${newLeft}px`);
            
            // Update React state as well - this is crucial for directly styled elements
            setBallPosition({
              top: newTop,
              left: newLeft,
            });
          } else {
            console.error(`Demo: Could not find stone element for stone ${currentStone}`);
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
        const finalStoneElement = document.getElementById(`demo-stone-${rollingStoneNumber}`);
        if (finalStoneElement && boardRef.current) {
          const rect = finalStoneElement.getBoundingClientRect();
          const boardRect = boardRef.current.getBoundingClientRect();
          
          // Calculate final positions
          const finalTop = rect.top - boardRect.top + (rect.height / 2);
          const finalLeft = rect.left - boardRect.left + (rect.width / 2);
          
          console.log(`Demo: Ball final landing on stone ${rollingStoneNumber} at:`, {finalTop, finalLeft});
          
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
          console.error(`Demo: Could not find final stone element for stone ${rollingStoneNumber}`);
        }
        
        // Set the final stone with winner animation
        setFinalStoneSelected(rollingStoneNumber);
        
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
        
        // Keep final stone highlighted for 2.5 seconds, then clear it
        setTimeout(() => {
          setFinalStoneSelected(null);
        }, 2500);
        
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
  
  // Check if a stone is the final selected one that should have special winning animation
  const isWinningStone = (stoneNumber: number) => {
    return finalStoneSelected === stoneNumber;
  };
  
  // Determine if we should show the winner overlay
  const showWinnerOverlay = finalStoneSelected !== null;
  
  return (
    <div className="p-4 bg-white mx-auto max-w-4xl">
      <div 
        id="game-board-demo" 
        ref={boardRef}
        className={cn(
          "relative bg-primary-light border-2 border-gray-800 p-4 rounded mb-6",
          isBoardShaking && "shaking-board"
        )}
        style={{ minHeight: "500px" }}
      >
        {/* Game Title */}
        <h3 className="text-center text-white text-2xl font-sans font-bold mb-4">BIG BOYS GAME</h3>
        
        {/* Enhanced GameBall component with trail effects */}
        <GameBall 
          visible={showBall}
          top={ballPosition.top}
          left={ballPosition.left}
          color="gold"
          size="md"
          showTrails={true}
        />
        
        {/* Game Stone Layout - Top Row */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-29" number={29} isRolling={isStoneRolling(29)} isWinner={isWinningStone(29)} size="sm" />
          <GameStone id="demo-stone-40" number={40} isRolling={isStoneRolling(40)} isWinner={isWinningStone(40)} size="sm" />
          <GameStone id="demo-stone-32" number={32} isRolling={isStoneRolling(32)} isWinner={isWinningStone(32)} size="sm" />
          <GameStone id="demo-stone-81" number={81} isRolling={isStoneRolling(81)} isWinner={isWinningStone(81)} size="sm" />
          <GameStone id="demo-stone-7" number={7} isRolling={isStoneRolling(7)} isWinner={isWinningStone(7)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Second Row */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-13" number={13} isRolling={isStoneRolling(13)} isWinner={isWinningStone(13)} size="sm" />
          <GameStone id="demo-stone-64" number={64} isRolling={isStoneRolling(64)} isWinner={isWinningStone(64)} size="sm" />
          <GameStone id="demo-stone-1000" number={1000} isRolling={isStoneRolling(1000)} isWinner={isWinningStone(1000)} isSpecial size="md" />
          <GameStone id="demo-stone-101" number={101} isRolling={isStoneRolling(101)} isWinner={isWinningStone(101)} size="sm" />
          <GameStone id="demo-stone-4" number={4} isRolling={isStoneRolling(4)} isWinner={isWinningStone(4)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Third Row (with super stones) */}
        <div className="flex justify-between items-center mb-6">
          <GameStone id="demo-stone-3355" number={3355} isRolling={isStoneRolling(3355)} isWinner={isWinningStone(3355)} isSuper size="md" />
          <GameStone id="demo-stone-65" number={65} isRolling={isStoneRolling(65)} isWinner={isWinningStone(65)} size="sm" />
          <GameStone id="demo-stone-12" number={12} isRolling={isStoneRolling(12)} isWinner={isWinningStone(12)} size="sm" />
          <GameStone id="demo-stone-22" number={22} isRolling={isStoneRolling(22)} isWinner={isWinningStone(22)} size="sm" />
          <GameStone id="demo-stone-9" number={9} isRolling={isStoneRolling(9)} isWinner={isWinningStone(9)} size="sm" />
          <GameStone id="demo-stone-6624" number={6624} isRolling={isStoneRolling(6624)} isWinner={isWinningStone(6624)} isSuper size="md" />
          <GameStone id="demo-stone-44" number={44} isRolling={isStoneRolling(44)} isWinner={isWinningStone(44)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Fourth Row (with 500 special stone) */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-28" number={28} isRolling={isStoneRolling(28)} isWinner={isWinningStone(28)} size="sm" />
          <GameStone id="demo-stone-21" number={21} isRolling={isStoneRolling(21)} isWinner={isWinningStone(21)} size="sm" />
          <GameStone id="demo-stone-105" number={105} isRolling={isStoneRolling(105)} isWinner={isWinningStone(105)} size="sm" />
          <GameStone id="demo-stone-500" number={500} isRolling={isStoneRolling(500)} isWinner={isWinningStone(500)} isSpecial size="md" />
          <GameStone id="demo-stone-99" number={99} isRolling={isStoneRolling(99)} isWinner={isWinningStone(99)} size="sm" />
          <GameStone id="demo-stone-20" number={20} isRolling={isStoneRolling(20)} isWinner={isWinningStone(20)} size="sm" />
          <GameStone id="demo-stone-82" number={82} isRolling={isStoneRolling(82)} isWinner={isWinningStone(82)} size="sm" />
          <GameStone id="demo-stone-3" number={3} isRolling={isStoneRolling(3)} isWinner={isWinningStone(3)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Fifth Row */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-11" number={11} isRolling={isStoneRolling(11)} isWinner={isWinningStone(11)} size="sm" />
          <GameStone id="demo-stone-37" number={37} isRolling={isStoneRolling(37)} isWinner={isWinningStone(37)} size="sm" />
          <GameStone id="demo-stone-72" number={72} isRolling={isStoneRolling(72)} isWinner={isWinningStone(72)} size="sm" />
          <GameStone id="demo-stone-17" number={17} isRolling={isStoneRolling(17)} isWinner={isWinningStone(17)} size="sm" />
          <GameStone id="demo-stone-42" number={42} isRolling={isStoneRolling(42)} isWinner={isWinningStone(42)} size="sm" />
          <GameStone id="demo-stone-8" number={8} isRolling={isStoneRolling(8)} isWinner={isWinningStone(8)} size="sm" />
          <GameStone id="demo-stone-30" number={30} isRolling={isStoneRolling(30)} isWinner={isWinningStone(30)} size="sm" />
          <GameStone id="demo-stone-91" number={91} isRolling={isStoneRolling(91)} isWinner={isWinningStone(91)} size="sm" />
          <GameStone id="demo-stone-27" number={27} isRolling={isStoneRolling(27)} isWinner={isWinningStone(27)} size="sm" />
          <GameStone id="demo-stone-5" number={5} isRolling={isStoneRolling(5)} isWinner={isWinningStone(5)} size="sm" />
          <GameStone id="demo-stone-40-b" number={40} isRolling={isStoneRolling(40)} isWinner={isWinningStone(40)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Bottom Row */}
        <div className="flex justify-between">
          <GameStone id="demo-stone-6" number={6} isRolling={isStoneRolling(6)} isWinner={isWinningStone(6)} size="sm" />
          <GameStone id="demo-stone-80" number={80} isRolling={isStoneRolling(80)} isWinner={isWinningStone(80)} size="sm" />
          <GameStone id="demo-stone-3-b" number={3} isRolling={isStoneRolling(3)} isWinner={isWinningStone(3)} size="sm" />
          <GameStone id="demo-stone-26" number={26} isRolling={isStoneRolling(26)} isWinner={isWinningStone(26)} size="sm" />
          <GameStone id="demo-stone-100" number={100} isRolling={isStoneRolling(100)} isWinner={isWinningStone(100)} size="sm" />
          <GameStone id="demo-stone-19" number={19} isRolling={isStoneRolling(19)} isWinner={isWinningStone(19)} size="sm" />
          <GameStone id="demo-stone-14" number={14} isRolling={isStoneRolling(14)} isWinner={isWinningStone(14)} size="sm" />
          <GameStone id="demo-stone-43" number={43} isRolling={isStoneRolling(43)} isWinner={isWinningStone(43)} size="sm" />
          <GameStone id="demo-stone-16" number={16} isRolling={isStoneRolling(16)} isWinner={isWinningStone(16)} size="sm" />
          <GameStone id="demo-stone-71" number={71} isRolling={isStoneRolling(71)} isWinner={isWinningStone(71)} size="sm" />
          <GameStone id="demo-stone-10" number={10} isRolling={isStoneRolling(10)} isWinner={isWinningStone(10)} size="sm" />
        </div>
        
        {/* Winner announcement overlay */}
        {showWinnerOverlay && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 winner-overlay">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-yellow-400 mb-2 winner-text-animation">
                {finalStoneSelected}
              </h2>
              <p className="text-2xl font-bold text-white winner-pulse-animation">WINNER!</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-lg font-bold mb-2">How the Animation Works:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>When a stone is rolled, a pre-determined number is selected</li>
          <li>The yellow ball appears in the center of the board</li>
          <li>The ball moves across multiple random stones with variable speed</li>
          <li>As the ball passes over stones, they briefly highlight</li>
          <li>Sound effects play during the animation (rolling, clicking)</li>
          <li>The ball lands on the selected stone with a landing sound</li>
          <li>The winner stone displays a dramatic pulsing animation with color-cycling effects</li>
          <li>A winner overlay appears with animated text celebrating the result</li>
        </ol>
      </div>
    </div>
  );
};

export default GameBoardDemo;
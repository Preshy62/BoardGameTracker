import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import GameStone from "@/components/game/GameStone";

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
  
  // Ball position for direct styling
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  
  // Random path for the dice to follow (stone indices in the allStoneNumbers array)
  const dicePath = [8, 12, 5, 16, 10, 19, 2, 14, 7, 11, 3, 15, 9, 1, 4, 18, 6, 13, 0, 17];
  
  // Capture the board as a ref on mount
  useEffect(() => {
    const board = document.getElementById('game-board-demo');
    if (board) {
      boardRef.current = board;
    }
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
        
        {/* Ball element that will move across the board */}
        {showBall && (
          <div 
            className="ball-element"
            style={{
              position: 'absolute',
              top: `${ballPosition.top}px`,
              left: `${ballPosition.left}px`,
            }}
          />
        )}
        
        {/* Game Stone Layout - Top Row */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-29" number={29} isRolling={isStoneRolling(29)} size="sm" />
          <GameStone id="demo-stone-40" number={40} isRolling={isStoneRolling(40)} size="sm" />
          <GameStone id="demo-stone-32" number={32} isRolling={isStoneRolling(32)} size="sm" />
          <GameStone id="demo-stone-81" number={81} isRolling={isStoneRolling(81)} size="sm" />
          <GameStone id="demo-stone-7" number={7} isRolling={isStoneRolling(7)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Second Row */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-13" number={13} isRolling={isStoneRolling(13)} size="sm" />
          <GameStone id="demo-stone-64" number={64} isRolling={isStoneRolling(64)} size="sm" />
          <GameStone id="demo-stone-1000" number={1000} isRolling={isStoneRolling(1000)} isSpecial size="md" />
          <GameStone id="demo-stone-101" number={101} isRolling={isStoneRolling(101)} size="sm" />
          <GameStone id="demo-stone-4" number={4} isRolling={isStoneRolling(4)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Third Row (with super stones) */}
        <div className="flex justify-between items-center mb-6">
          <GameStone id="demo-stone-3355" number={3355} isRolling={isStoneRolling(3355)} isSuper size="md" />
          <GameStone id="demo-stone-65" number={65} isRolling={isStoneRolling(65)} size="sm" />
          <GameStone id="demo-stone-12" number={12} isRolling={isStoneRolling(12)} size="sm" />
          <GameStone id="demo-stone-22" number={22} isRolling={isStoneRolling(22)} size="sm" />
          <GameStone id="demo-stone-9" number={9} isRolling={isStoneRolling(9)} size="sm" />
          <GameStone id="demo-stone-6624" number={6624} isRolling={isStoneRolling(6624)} isSuper size="md" />
          <GameStone id="demo-stone-44" number={44} isRolling={isStoneRolling(44)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Fourth Row (with 500 special stone) */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-28" number={28} isRolling={isStoneRolling(28)} size="sm" />
          <GameStone id="demo-stone-21" number={21} isRolling={isStoneRolling(21)} size="sm" />
          <GameStone id="demo-stone-105" number={105} isRolling={isStoneRolling(105)} size="sm" />
          <GameStone id="demo-stone-500" number={500} isRolling={isStoneRolling(500)} isSpecial size="md" />
          <GameStone id="demo-stone-99" number={99} isRolling={isStoneRolling(99)} size="sm" />
          <GameStone id="demo-stone-20" number={20} isRolling={isStoneRolling(20)} size="sm" />
          <GameStone id="demo-stone-82" number={82} isRolling={isStoneRolling(82)} size="sm" />
          <GameStone id="demo-stone-3" number={3} isRolling={isStoneRolling(3)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Fifth Row */}
        <div className="flex justify-between mb-6">
          <GameStone id="demo-stone-11" number={11} isRolling={isStoneRolling(11)} size="sm" />
          <GameStone id="demo-stone-37" number={37} isRolling={isStoneRolling(37)} size="sm" />
          <GameStone id="demo-stone-72" number={72} isRolling={isStoneRolling(72)} size="sm" />
          <GameStone id="demo-stone-17" number={17} isRolling={isStoneRolling(17)} size="sm" />
          <GameStone id="demo-stone-42" number={42} isRolling={isStoneRolling(42)} size="sm" />
          <GameStone id="demo-stone-8" number={8} isRolling={isStoneRolling(8)} size="sm" />
          <GameStone id="demo-stone-30" number={30} isRolling={isStoneRolling(30)} size="sm" />
          <GameStone id="demo-stone-91" number={91} isRolling={isStoneRolling(91)} size="sm" />
          <GameStone id="demo-stone-27" number={27} isRolling={isStoneRolling(27)} size="sm" />
          <GameStone id="demo-stone-5" number={5} isRolling={isStoneRolling(5)} size="sm" />
          <GameStone id="demo-stone-40-b" number={40} isRolling={isStoneRolling(40)} size="sm" />
        </div>
        
        {/* Game Stone Layout - Bottom Row */}
        <div className="flex justify-between">
          <GameStone id="demo-stone-6" number={6} isRolling={isStoneRolling(6)} size="sm" />
          <GameStone id="demo-stone-80" number={80} isRolling={isStoneRolling(80)} size="sm" />
          <GameStone id="demo-stone-3-b" number={3} isRolling={isStoneRolling(3)} size="sm" />
          <GameStone id="demo-stone-26" number={26} isRolling={isStoneRolling(26)} size="sm" />
          <GameStone id="demo-stone-100" number={100} isRolling={isStoneRolling(100)} size="sm" />
          <GameStone id="demo-stone-19" number={19} isRolling={isStoneRolling(19)} size="sm" />
          <GameStone id="demo-stone-14" number={14} isRolling={isStoneRolling(14)} size="sm" />
          <GameStone id="demo-stone-43" number={43} isRolling={isStoneRolling(43)} size="sm" />
          <GameStone id="demo-stone-16" number={16} isRolling={isStoneRolling(16)} size="sm" />
          <GameStone id="demo-stone-71" number={71} isRolling={isStoneRolling(71)} size="sm" />
          <GameStone id="demo-stone-10" number={10} isRolling={isStoneRolling(10)} size="sm" />
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-lg font-bold mb-2">How the Animation Works:</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>When a stone is rolled, a pre-determined number is selected</li>
          <li>The yellow ball appears in the center of the board</li>
          <li>The ball moves across multiple random stones with variable speed</li>
          <li>As the ball passes over stones, they briefly highlight</li>
          <li>Sound effects play during the animation (rolling, clicking)</li>
          <li>Finally, the ball lands on the selected stone with a landing sound</li>
          <li>The selected stone remains highlighted</li>
        </ol>
      </div>
    </div>
  );
};

export default GameBoardDemo;
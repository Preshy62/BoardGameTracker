import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

// Stone Component with React-based animation
interface DemoStoneProps {
  number: number;
  isSpecial?: boolean;
  isSuper?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isRolling?: boolean;
  onClick?: () => void;
}

const DemoStone = ({ 
  number, 
  isSpecial = false,
  isSuper = false,
  size = 'md',
  isRolling = false,
  onClick,
}: DemoStoneProps) => {
  // Determine size values based on the size prop
  const sizeMap = {
    'sm': { width: '2.5rem', height: '2.5rem', fontSize: '0.875rem' },
    'md': { width: '4rem', height: '4rem', fontSize: '1.125rem' },
    'lg': { width: '5rem', height: '5rem', fontSize: '1.25rem' },
  }[size];
  
  // State for animation control
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [glow, setGlow] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  // Animation function using requestAnimationFrame
  useEffect(() => {
    if (isRolling) {
      let frameCount = 0;
      const totalFrames = 50; // animation duration
      
      const animate = () => {
        frameCount++;
        
        // Calculate animation values
        const progress = frameCount / totalFrames;
        const newRotation = progress * 720; // two full rotations
        const newScale = 1 + Math.sin(progress * Math.PI * 2) * 0.2;
        const newGlow = 5 + Math.sin(progress * Math.PI * 4) * 10;
        
        // Update state
        setRotation(newRotation);
        setScale(newScale);
        setGlow(newGlow);
        
        // Continue animation or stop
        if (frameCount < totalFrames) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Reset when done
          setRotation(0);
          setScale(1);
          setGlow(0);
        }
      };
      
      // Start animation
      animationRef.current = requestAnimationFrame(animate);
      
      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isRolling]);
  
  // Dynamic styles for the stone
  const stoneStyle = {
    width: sizeMap.width,
    height: sizeMap.height,
    fontSize: sizeMap.fontSize,
    backgroundColor: isSuper ? '#EF4444' : isSpecial ? '#FFC107' : '#1E293B',
    color: isSuper || isSpecial ? '#000' : '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    cursor: 'pointer',
    position: 'relative' as 'relative',
    border: isSuper ? '2px solid gold' : '2px solid #FFC107',
    boxShadow: glow > 0 ? `0 0 ${glow}px ${glow/2}px gold` : 'none',
    transform: `rotate(${rotation}deg) scale(${scale})`,
    transition: isRolling ? 'none' : 'transform 0.3s ease-out',
    fontWeight: 'bold',
    zIndex: isRolling ? 50 : 1,
  };
  
  // Play rolling sound
  useEffect(() => {
    if (isRolling) {
      try {
        const audio = new Audio();
        audio.src = '/rolling-dice.mp3';
        audio.volume = 0.3;
        audio.play().catch(() => console.log('Audio playback failed'));
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [isRolling]);

  return (
    <div 
      onClick={onClick}
      style={stoneStyle}
    >
      <span style={{ pointerEvents: 'none' }}>{number}</span>
    </div>
  );
};

// Demo Board Page - Fresh Implementation
import { useCallback } from 'react';

export default function DemoPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Core state for stone animations
  const [rollingStoneIndex, setRollingStoneIndex] = useState<number | null>(null);
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Define CSS keyframes for animations
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    // Define the keyframes
    styleEl.innerHTML = `
      @keyframes roll-glow {
        0% { transform: scale(1) rotate(0deg); box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.7); }
        25% { transform: scale(1.1) rotate(90deg); box-shadow: 0 0 25px 15px rgba(255, 0, 0, 0.5); }
        50% { transform: scale(1.2) rotate(180deg); box-shadow: 0 0 30px 20px rgba(255, 215, 0, 0.8); }
        75% { transform: scale(1.1) rotate(270deg); box-shadow: 0 0 25px 15px rgba(255, 0, 0, 0.5); }
        100% { transform: scale(1) rotate(360deg); box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.7); }
      }
      
      @keyframes shakeBoard {
        0% { transform: translate(0, 0) rotate(0); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(2px, 0) rotate(1deg); }
        30% { transform: translate(-2px, 2px) rotate(0); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-2px, 1px) rotate(0); }
        70% { transform: translate(2px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0); }
        100% { transform: translate(0, 0) rotate(0); }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.9; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .dice-element {
        animation: pulse 0.5s infinite alternate;
        z-index: 100;
        pointer-events: none;
        position: absolute;
        width: 40px;
        height: 40px;
        background-color: #FF0000;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 0 15px 5px rgba(255, 0, 0, 0.5);
        transition: left 0.3s ease, top 0.3s ease;
      }
      
      .ball-element {
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: radial-gradient(circle, white 30%, gold 100%);
        border: 4px solid gold;
        z-index: 9999;
        transition: top 0.8s ease, left 0.8s ease;
        box-shadow: 0 0 30px 15px rgba(255, 215, 0, 0.7);
      }
      
      .roll-animation {
        animation: roll-glow 0.8s linear infinite;
      }
      
      .shaking-board {
        animation: shakeBoard 0.5s cubic-bezier(.36,.07,.19,.97) both;
        animation-iteration-count: 3;
      }

      .board-stone {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .board-stone.active {
        transform: scale(1.1);
        box-shadow: 0 0 20px 10px rgba(255, 255, 0, 0.5);
        z-index: 50;
      }
    `;
    // Add to head
    document.head.appendChild(styleEl);
    
    // Cleanup
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Array of stones for the game board
  const stones = [
    { number: 29, row: 1, index: 0 },
    { number: 40, row: 1, index: 1 },
    { number: 32, row: 1, index: 2 },
    { number: 81, row: 1, index: 3 },
    { number: 7, row: 1, index: 4 },
    { number: 13, row: 2, index: 0 },
    { number: 64, row: 2, index: 1 },
    { number: 1000, row: 2, index: 2, isSpecial: true, size: 'lg' },
    { number: 101, row: 2, index: 3 },
    { number: 4, row: 2, index: 4 },
    { number: 3355, row: 3, index: 0, isSuper: true },
    { number: 65, row: 3, index: 1 },
    { number: 12, row: 3, index: 2 },
    { number: 22, row: 3, index: 3 },
    { number: 9, row: 3, index: 4 },
    { number: 6624, row: 3, index: 5, isSuper: true },
    { number: 44, row: 3, index: 6 },
    { number: 28, row: 4, index: 0 },
    { number: 21, row: 4, index: 1 },
    { number: 105, row: 4, index: 2 },
    { number: 500, row: 4, index: 3, isSpecial: true, size: 'lg' },
    { number: 99, row: 4, index: 4 },
    { number: 20, row: 4, index: 5 },
    { number: 82, row: 4, index: 6 },
    { number: 3, row: 4, index: 7 },
  ];

  // Small stones for the bottom rows
  const smallStones = [
    { number: 11, row: 5, index: 0 },
    { number: 37, row: 5, index: 1 },
    { number: 72, row: 5, index: 2 },
    { number: 17, row: 5, index: 3 },
    { number: 42, row: 5, index: 4 },
    { number: 8, row: 5, index: 5 },
    { number: 30, row: 5, index: 6 },
    { number: 91, row: 5, index: 7 },
    { number: 27, row: 5, index: 8 },
    { number: 5, row: 5, index: 9 },
    { number: 40, row: 5, index: 10 },
    { number: 6, row: 6, index: 0 },
    { number: 80, row: 6, index: 1 },
    { number: 3, row: 6, index: 2 },
    { number: 26, row: 6, index: 3 },
    { number: 100, row: 6, index: 4 },
    { number: 19, row: 6, index: 5 },
    { number: 14, row: 6, index: 6 },
    { number: 43, row: 6, index: 7 },
    { number: 16, row: 6, index: 8 },
    { number: 71, row: 6, index: 9 },
    { number: 10, row: 6, index: 10 },
  ];

  // Animation state variables
  const [boardPathIndices, setBoardPathIndices] = useState<number[]>([]);
  const [rollTimeout, setRollTimeout] = useState<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const diceRef = useRef<HTMLDivElement>(null);
  const [dicePosition, setDicePosition] = useState({ top: 0, left: 0 });
  const [showBall, setShowBall] = useState(false);
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  
  // Function that gets the position of a stone by its index
  const getStonePosition = (stoneIndex: number) => {
    // Calculate whether this is a regular stone or small stone
    const isSmallStone = stoneIndex >= 100;
    const actualIndex = isSmallStone ? stoneIndex - 100 : stoneIndex;
    
    // Get the correct array and selector
    const stoneArray = isSmallStone ? smallStones : stones;
    const selector = isSmallStone ? `small-stone-${actualIndex}` : `stone-${actualIndex}`;
    
    console.log(`Getting position for stone: ${selector}`);
    
    // Find the stone element
    const stoneElement = document.getElementById(selector);
    if (!stoneElement) {
      console.error('Stone element not found:', selector);
      // Fallback to a visible center position so we at least see the ball
      return { top: 200, left: 200 };
    }
    
    // Get the position relative to the game board
    const board = document.getElementById('demo-game-board');
    if (!board) {
      console.error('Game board not found');
      // Fallback to a visible center position
      return { top: 200, left: 200 };
    }
    
    const boardRect = board.getBoundingClientRect();
    const stoneRect = stoneElement.getBoundingClientRect();
    
    // Calculate the position inside the board
    const position = {
      left: stoneRect.left - boardRect.left + (stoneRect.width / 2) - 30, // center the ball (60px width)
      top: stoneRect.top - boardRect.top + (stoneRect.height / 2) - 30, // center the ball (60px height)
    };
    
    console.log(`Stone ${selector} position:`, position);
    return position;
  };

  // Generate a deterministic path following the board layout
  const generatePath = (targetStoneIndex: number) => {
    // Define the fixed path that follows the board layout in a serpentine pattern
    // This ensures the ball moves in a consistent, predictable manner
    const fixedPath = [
      // Row 1 (left to right)
      { row: 1, index: 0 }, { row: 1, index: 1 }, { row: 1, index: 2 }, { row: 1, index: 3 }, { row: 1, index: 4 },
      // Row 2 (right to left)
      { row: 2, index: 4 }, { row: 2, index: 3 }, { row: 2, index: 2 }, { row: 2, index: 1 }, { row: 2, index: 0 },
      // Row 3 (left to right)
      { row: 3, index: 0 }, { row: 3, index: 1 }, { row: 3, index: 2 }, { row: 3, index: 3 }, { row: 3, index: 4 }, { row: 3, index: 5 }, { row: 3, index: 6 },
      // Row 4 (right to left)
      { row: 4, index: 7 }, { row: 4, index: 6 }, { row: 4, index: 5 }, { row: 4, index: 4 }, { row: 4, index: 3 }, { row: 4, index: 2 }, { row: 4, index: 1 }, { row: 4, index: 0 },
      // Row 5 (small stones - left to right)
      { row: 5, index: 0 }, { row: 5, index: 1 }, { row: 5, index: 2 }, { row: 5, index: 3 }, { row: 5, index: 4 }, { row: 5, index: 5 }, { row: 5, index: 6 }, { row: 5, index: 7 }, { row: 5, index: 8 }, { row: 5, index: 9 }, { row: 5, index: 10 },
      // Row 6 (small stones - right to left)
      { row: 6, index: 10 }, { row: 6, index: 9 }, { row: 6, index: 8 }, { row: 6, index: 7 }, { row: 6, index: 6 }, { row: 6, index: 5 }, { row: 6, index: 4 }, { row: 6, index: 3 }, { row: 6, index: 2 }, { row: 6, index: 1 }, { row: 6, index: 0 },
    ];
    
    // Convert the fixed path to stone indices
    const indexPath = fixedPath.map(stone => stone.row <= 4 ? stone.index : 100 + stone.index);
    console.log('Created fixed path for dice roll with', indexPath.length, 'elements');
    
    // Find target index in the path
    const targetIndex = indexPath.indexOf(targetStoneIndex);
    let finalPath = [];
    
    // If target is in the path, take a portion of the path ending at the target
    if (targetIndex >= 0) {
      // Get a reasonable starting point before the target (at least 5 steps back, wrapping if needed)
      const startOffset = Math.min(10, targetIndex);
      finalPath = indexPath.slice(targetIndex - startOffset, targetIndex + 1);
    } else {
      // If target not in path (unlikely), provide a direct path to target
      finalPath = [indexPath[0], indexPath[Math.floor(indexPath.length / 3)], indexPath[Math.floor(indexPath.length * 2 / 3)], targetStoneIndex];
    }
    
    return finalPath;
  };

  // Enhanced function to handle rolling dice across the board
  const handleRollDice = () => {
    if (isRolling || rollingStoneIndex !== null) return; // Prevent multiple rolls
    
    console.log('Rolling dice...');
    setIsRolling(true);
    setSelectedStone(null);
    
    // Get combined array of all stones
    const allStones = [...stones, ...smallStones];
    
    // Select random stone to land on
    const randomIndex = Math.floor(Math.random() * allStones.length);
    const targetStone = allStones[randomIndex];
    console.log('Selected stone:', targetStone);
    
    // For proper index identification
    const actualIndex = targetStone.row <= 4 
      ? targetStone.index 
      : 100 + targetStone.index;
    
    // Position the dice in the middle of the screen - guaranteed to be visible
    const middleX = window.innerWidth / 2 - 60; // Half of dice width (120px)
    const middleY = window.innerHeight / 2 - 60; // Half of dice height (120px)
    setDicePosition({ top: middleY, left: middleX });
    console.log('Positioning dice in middle of screen');
    
    // Toast to draw attention to the dice
    toast({
      title: "DICE IS ROLLING",
      description: "Watch the ball roll across the board!",
    });
    
    // Animate the dice to attract attention
    document.body.classList.add('dice-animation-active');
    
    // After a short period, start the ball rolling animation
    setTimeout(() => {
      // Hide the big dice indicator
      setIsRolling(false);
      document.body.classList.remove('dice-animation-active');
      
      // Generate a fixed path through stones on the board that follows the layout
      const path = generatePath(actualIndex);
      
      // Show the ball at the first position
      const startPosition = getStonePosition(path[0]);
      setBallPosition(startPosition);
      setShowBall(true);
      
      // Animate the ball through the path
      let step = 1;
      const animateStep = () => {
        if (step < path.length) {
          const newPosition = getStonePosition(path[step]);
          setBallPosition(newPosition);
          
          // Highlight the current stone the ball is on
          setRollingStoneIndex(path[step]);
          
          step++;
          setTimeout(animateStep, 800); // Move to next stone every 800ms - slower for better visibility
        } else {
          // We've reached the final position
          setTimeout(() => {
            // Animation complete
            setRollingStoneIndex(null);
            setSelectedStone(targetStone.number);
            setShowBall(false); // Hide the ball when done
            
            console.log('Animation complete, selected stone:', targetStone.number);
            
            // Check if the stone has special properties
            const isSpecial = 'isSpecial' in targetStone && targetStone.isSpecial;
            const isSuper = 'isSuper' in targetStone && targetStone.isSuper;
            
            // Show toast with result
            toast({
              title: "You Rolled: " + targetStone.number,
              description: isSpecial ? "You hit a special stone!" : 
                          isSuper ? "You hit a super stone!" : 
                          "Good roll!",
            });
          }, 1000);
        }
      };
      
      // Start the animation
      setTimeout(animateStep, 600); // Start moving after 600ms
    }, 2000);
  };
  
  // Handle stone click for individual stone animation
  const handleStoneClick = (index: number, stoneNumber: number) => {
    if (rollingStoneIndex !== null || isRolling) return; // Prevent animation if already rolling
    
    console.log('Clicked stone:', index, 'with number:', stoneNumber);
    
    // Play sound
    try {
      const audio = new Audio();
      audio.src = '/rolling-dice.mp3';
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    // Generate a path to the clicked stone that follows the board layout
    const path = generatePath(index); // Use our predictable path generator
    
    // Show the ball at the first position
    const startPosition = getStonePosition(path[0]);
    setBallPosition(startPosition);
    setShowBall(true);
    
    // Animate the ball through the path
    let step = 1;
    const animateStep = () => {
      if (step < path.length) {
        const newPosition = getStonePosition(path[step]);
        setBallPosition(newPosition);
        
        // Highlight the current stone the ball is on
        setRollingStoneIndex(path[step]);
        
        step++;
        setTimeout(animateStep, 800); // Same speed as dice roll for consistency
      } else {
        // We've reached the final position
        setTimeout(() => {
          // Animation complete
          setRollingStoneIndex(null);
          setSelectedStone(stoneNumber);
          setShowBall(false); // Hide the ball when done
          
          console.log('Animation complete, selected stone:', stoneNumber);
          
          // Show toast with result
          toast({
            title: "You Clicked: " + stoneNumber,
            description: "Try clicking 'Roll Stone' to roll the dice!",
          });
        }, 800);
      }
    };
    
    // Start the animation
    setTimeout(animateStep, 400); // Start moving after 400ms
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Big Boys Game</h1>
            <span className="ml-2 px-2 py-1 bg-secondary text-primary text-xs font-bold rounded-full">DEMO</span>
          </div>
          <Button 
            onClick={() => setLocation('/auth')} 
            className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
          >
            Sign In
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Game Board Demo</h1>
            <p className="text-gray-600">Click on any stone to see the rolling animation</p>
          </div>
          
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline"
          >
            Back to Home
          </Button>
        </div>
        
        {/* Game board container */}
        <div className="w-full max-w-3xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-primary p-4 text-white">
            <h2 className="text-xl font-bold text-center">Big Boys Game Board Demo</h2>
            {selectedStone && (
              <p className="text-center mt-2 text-sm bg-secondary text-primary p-1 px-3 rounded-full inline-block mx-auto">
                You rolled: <span className="font-bold">{selectedStone}</span>
              </p>
            )}
          </div>
          
          <div className="p-6">
            {/* Game board with stones */}
            <div 
              id="demo-game-board" 
              className="relative p-4 rounded-lg mb-6 overflow-hidden" 
              style={{ backgroundColor: '#0F172A', border: '2px solid #FFC107', position: 'relative' }}
            >
              <h3 className="text-center text-white text-2xl font-bold mb-4">BIG BOYS GAME</h3>
              
              {/* Arrow pointing to start */}
              <div className="absolute top-8 right-16 text-white">
                <svg viewBox="0 0 48 48" width="60" height="60" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M30 10 C 40 15, 45 25, 40 35" strokeWidth="3" strokeLinecap="round" />
                  <path d="M35 32 L 40 35 L 45 32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              {/* START label */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-1 font-bold text-lg rotate-90">
                START
              </div>

              {/* Regular sized stones by row */}
              {[1, 2, 3, 4].map(row => (
                <div key={`row-${row}`} className="flex justify-between mb-4">
                  {stones
                    .filter(stone => stone.row === row)
                    .map((stone) => (
                      <div id={`stone-${stone.index}`} key={`stone-${stone.row}-${stone.index}`}>
                        <DemoStone 
                          number={stone.number}
                          isSpecial={!!stone.isSpecial}
                          isSuper={!!stone.isSuper}
                          size={stone.size as 'sm' | 'md' | 'lg'}
                          isRolling={rollingStoneIndex === stone.index}
                          onClick={() => handleStoneClick(stone.index, stone.number)}
                        />
                      </div>
                    ))
                  }
                </div>
              ))}
              
              {/* Small stones for bottom rows */}
              {[5, 6].map(row => (
                <div key={`row-${row}`} className="flex justify-between mb-4">
                  {smallStones
                    .filter(stone => stone.row === row)
                    .map((stone) => (
                      <div id={`small-stone-${stone.index}`} key={`small-stone-${stone.row}-${stone.index}`}>
                        <DemoStone 
                          number={stone.number}
                          size="sm"
                          isRolling={rollingStoneIndex === 100 + stone.index}
                          onClick={() => handleStoneClick(100 + stone.index, stone.number)}
                        />
                      </div>
                    ))
                  }
                </div>
              ))}
              
              {/* Money in the Bank Label */}
              <div className="border-t-2 border-yellow-600 mt-4 pt-2 text-center">
                <h4 className="text-white text-sm uppercase tracking-wider">MONEY IN THE BANK</h4>
              </div>
              
              {/* The rolling ball is positioned fixed relative to the viewport for maximum visibility */}
              {isRolling && (
                <div 
                  ref={diceRef}
                  className="dice-element"
                  style={{
                    position: 'fixed', // Fixed to viewport instead of absolute
                    top: dicePosition.top,
                    left: dicePosition.left,
                    width: '120px',  // Much larger size
                    height: '120px', // Much larger size
                    backgroundColor: '#FF0000', // Bright red
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '48px', // Even larger text
                    color: 'white',
                    boxShadow: '0 0 60px 30px rgba(255, 0, 0, 0.8)', // Stronger glow
                    transition: 'top 0.8s ease, left 0.8s ease', // Slower for visibility
                    pointerEvents: 'none',
                    zIndex: 9999,
                    border: '6px solid white',
                    borderRadius: '50%',
                  }}
                >
                  DICE
                </div>
              )}
              
              {/* The ball that moves between stones */}
              {showBall && (
                <div 
                  className={`ball-element ${rollingStoneIndex !== null ? 'roll-animation' : ''}`}
                  style={{
                    top: ballPosition.top,
                    left: ballPosition.left,
                  }}
                />
              )}
            </div>
            
            {/* Money display and game action */}
            <div 
              className="p-3 rounded-lg mb-6" 
              style={{ backgroundColor: '#0F172A', border: '2px solid #FFC107' }}
            >
              <div className="text-center mb-4">
                <h4 className="text-white text-sm uppercase tracking-wider mb-1">MONEY IN THE BANK</h4>
                <p className="font-mono font-bold text-3xl" style={{ color: '#FFC107' }}>₦95,000</p>
              </div>
              
              {/* Game Action Button */}
              <div className="text-center">
                <button
                  onClick={handleRollDice}
                  disabled={isRolling || rollingStoneIndex !== null}
                  className={`text-primary text-lg font-sans font-bold py-3 px-8 rounded-lg shadow-lg transform transition
                    ${(isRolling || rollingStoneIndex !== null) 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-secondary hover:bg-secondary-dark hover:scale-105'}`}
                >
                  ROLL STONE
                </button>
                <div className="mt-2 text-xs text-white">
                  {isRolling 
                    ? 'Rolling the stones...' 
                    : rollingStoneIndex !== null 
                      ? 'Revealing your roll!' 
                      : 'Click to roll a stone!'}
                </div>
              </div>
            </div>
            
            {/* This is where the rolling ball element was - moved inside the game board */}
            
            {/* Call to action */}
            <div className="text-center mt-8">
              <p className="text-gray-600 text-sm mb-2">This is an interactive demo of the Big Boys Game board layout.</p>
              <p className="text-gray-600 text-sm mb-6">Click any stone to see it roll!</p>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => setLocation('/auth')} 
                  className="bg-primary hover:bg-primary-dark text-white font-bold"
                >
                  Sign In
                </Button>
                
                <Button 
                  onClick={() => setLocation('/auth')} 
                  className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
                >
                  Create Account
                </Button>
              </div>
              
              {/* Demo game promo */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-3">Create a Demo Game</h3>
                <p className="text-gray-600 text-sm mb-4">Experience the full game with these demo features:</p>
                
                <ul className="text-left text-sm text-gray-700 mb-4 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    ₦200,000 demo balance
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Play against AI opponent
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Enhanced stone animations
                  </li>
                </ul>
                
                <Button 
                  onClick={() => setLocation('/auth?demo=true')} 
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white font-bold py-3"
                >
                  Start Demo Game
                </Button>
              </div>
              
              <Button 
                onClick={() => setLocation('/')} 
                className="mt-6 text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100"
                variant="ghost"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

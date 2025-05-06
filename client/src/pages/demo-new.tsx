import React, { useState, useEffect, useRef, useCallback } from 'react';
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
        const newScale = 1 + Math.sin(progress * Math.PI) * 0.3; // sin wave for scaling
        const newGlow = Math.sin(progress * Math.PI) * 20; // glow intensity
        
        setRotation(newRotation);
        setScale(newScale);
        setGlow(newGlow);
        
        if (frameCount < totalFrames) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      // Start the animation
      animationRef.current = requestAnimationFrame(animate);
      
      // Cleanup function
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // Reset animation values when not rolling
      setRotation(0);
      setScale(1);
      setGlow(0);
    }
  }, [isRolling]);
  
  // Determine stone class based on type
  const stoneClass = cn(
    'rounded-lg shadow-lg flex items-center justify-center font-bold cursor-pointer transition-transform hover:scale-105',
    {
      'bg-yellow-500 text-primary': isSpecial,
      'bg-red-600 text-white border-2 border-yellow-400': isSuper,
      'bg-gray-800 text-white': !isSpecial && !isSuper,
    }
  );
  
  return (
    <div 
      className="board-stone"
      onClick={onClick}
      style={{
        transform: `rotate(${rotation}deg) scale(${scale})`,
        boxShadow: `0 0 ${glow}px ${isSpecial ? '#FFD700' : isSuper ? '#FF0000' : '#FFFFFF'}`,
        width: sizeMap.width,
        height: sizeMap.height,
      }}
    >
      <div className={stoneClass} style={{ width: '100%', height: '100%', fontSize: sizeMap.fontSize }}>
        {number}
      </div>
    </div>
  );
};

// Demo Board Page
export default function DemoPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // State for board and stone animations
  const [rollingStoneIndex, setRollingStoneIndex] = useState<number | null>(null);
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  
  // State for the dice path animation
  const [boardPath, setBoardPath] = useState<number[]>([]);
  const [dicePosition, setDicePosition] = useState({ top: 0, left: 0 });
  const [currentPathIdx, setCurrentPathIdx] = useState(0);
  const [rollSpeed, setRollSpeed] = useState(200); // ms between moves
  const [rollTimer, setRollTimer] = useState<NodeJS.Timeout | null>(null);
  const [targetStone, setTargetStone] = useState<any>(null);
  
  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  const diceRef = useRef<HTMLDivElement>(null);

  // Define CSS for animations
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .dice-element {
        animation: pulse 0.5s infinite alternate, spin 2s linear infinite;
        z-index: 100;
        pointer-events: none;
        position: absolute;
        width: 60px;
        height: 60px;
        background-color: #FF0000;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 0 15px 8px rgba(255, 215, 0, 0.7);
        border: 3px solid white;
        transition: left 0.3s ease, top 0.3s ease;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.9; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleEl);
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

  // Define the board perimeter path on component mount
  useEffect(() => {
    // Create a simple hardcoded path for testing
    const hardcodedPath = [
      // Top row (left to right)
      0, 1, 2, 3, 4,
      // Right edge (top to bottom)
      4, 4, 7,
      // Bottom row (right to left)
      7, 6, 5, 4, 3, 2, 1, 0,
      // Left edge (bottom to top)
      0, 0
    ];
    
    console.log('Board path created with hardcoded values:', hardcodedPath);
    setBoardPath(hardcodedPath);
    
    // Set initial position for dice
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setDicePosition({
        top: rect.top + 50,
        left: rect.right - 50,
      });
    }
  }, []);

  // Function to move the dice along the calculated path
  const moveDiceAlongPath = useCallback((currentIdx: number, targetIdx: number | null) => {
    if (!isRolling) return;
    
    // Clear any existing timeout
    if (rollTimer) clearTimeout(rollTimer);
    
    if (boardPath.length === 0) {
      console.error('No board path defined');
      return;
    }
    
    // Get the current stone index in the path
    const pathPosition = currentIdx % boardPath.length;
    const stoneIdx = boardPath[pathPosition];
    
    // Highlight the current stone
    setRollingStoneIndex(stoneIdx);
    
    // Play sound effect
    try {
      const audio = new Audio();
      audio.src = '/rolling-dice.mp3';
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    // Position the dice over the current stone
    const stoneElement = document.getElementById(`stone-${stoneIdx}`);
    if (stoneElement) {
      const rect = stoneElement.getBoundingClientRect();
      const boardRect = boardRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
      
      setDicePosition({
        top: rect.top - boardRect.top + (rect.height / 2) - 20, // Center on stone
        left: rect.left - boardRect.left + (rect.width / 2) - 20,
      });
    }
    
    // Check if we've reached the target
    if (targetIdx !== null && currentIdx >= targetIdx) {
      // We've completed the desired number of jumps
      setTimeout(() => {
        // Find the stone at the final position
        const finalStoneIdx = boardPath[targetIdx % boardPath.length];
        const finalStone = stones.find(s => s.index === finalStoneIdx);
        
        if (finalStone) {
          setRollingStoneIndex(null);
          setSelectedStone(finalStone.number);
          setIsRolling(false);
          
          // Show result toast
          const isSpecial = 'isSpecial' in finalStone && finalStone.isSpecial;
          const isSuper = 'isSuper' in finalStone && finalStone.isSuper;
          
          toast({
            title: "You Rolled: " + finalStone.number,
            description: isSpecial ? "You hit a special stone!" : 
                       isSuper ? "You hit a super stone!" : 
                       "Good roll!",
          });
        } else {
          console.error('Could not find final stone at index:', finalStoneIdx);
          setRollingStoneIndex(null);
          setIsRolling(false);
        }
      }, 1000);
      return;
    }
    
    // Continue moving - gradually slow down
    const nextSpeed = Math.min(rollSpeed + 15, 500); // Cap at 500ms
    setRollSpeed(nextSpeed);
    
    // Schedule the next movement
    const nextTimeout = setTimeout(() => {
      moveDiceAlongPath(currentIdx + 1, targetIdx);
    }, nextSpeed);
    
    setRollTimer(nextTimeout);
  }, [isRolling, boardPath, rollSpeed, rollTimer, toast]);
  
  // Main function to handle the dice roll
  const handleRollDice = useCallback(() => {
    if (isRolling || rollingStoneIndex !== null) return; // Prevent multiple rolls
    
    console.log('Starting dice roll animation');
    setIsRolling(true);
    setSelectedStone(null);
    setRollSpeed(200); // Reset speed
    setCurrentPathIdx(0);
    
    // Determine how many times to circle the board (15-25 steps)
    const minSteps = 15;
    const randomAdditionalSteps = Math.floor(Math.random() * 10);
    const totalSteps = minSteps + randomAdditionalSteps;
    
    // Start the dice moving around the path
    moveDiceAlongPath(0, totalSteps);
  }, [isRolling, rollingStoneIndex, moveDiceAlongPath]);
  
  // Handle individual stone clicks (for testing)
  const handleStoneClick = useCallback((index: number, stoneNumber: number) => {
    if (rollingStoneIndex !== null || isRolling) return;
    
    setRollingStoneIndex(index);
    
    // Play sound
    try {
      const audio = new Audio();
      audio.src = '/rolling-dice.mp3';
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    setTimeout(() => {
      setRollingStoneIndex(null);
      setSelectedStone(stoneNumber);
    }, 2000);
  }, [rollingStoneIndex, isRolling]);

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
            <p className="text-gray-600">Watch the dice roll around the board perimeter</p>
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
              ref={boardRef}
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
              
              {/* Dice moving along the board path */}
              {isRolling && (
                <div 
                  ref={diceRef}
                  className="dice-element"
                  style={{
                    top: dicePosition.top,
                    left: dicePosition.left,
                  }}
                >
                  DICE
                </div>
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
            
            {/* Call to action */}
            <div className="text-center mt-8">
              <p className="text-gray-600 text-sm mb-2">This is an interactive demo of the Big Boys Game board layout.</p>
              <Button 
                onClick={() => setLocation('/auth?demo=true')}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                Try Full Game Demo
              </Button>
            </div>
          </div>
        </div>
        
        {/* Game features */}
        <div className="w-full max-w-3xl mx-auto mt-12 mb-8">
          <h3 className="text-xl font-bold mb-4">Big Boys Game Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Multiplayer Gameplay
              </h4>
              <p className="text-gray-600">Play with friends or against random opponents in fast-paced, exciting rounds.</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Real-Money Stakes
              </h4>
              <p className="text-gray-600">Bet with real money and win big! Secure payment processing and instant withdrawals.</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Special Stones
              </h4>
              <p className="text-gray-600">Land on special stones for bonus multipliers, extra turns, or unique power-ups.</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Voice Chat
              </h4>
              <p className="text-gray-600">Premium games include in-game voice chat for a more immersive and social experience.</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Big Boys Game</h3>
              <p className="text-gray-400 text-sm">The Ultimate Nigerian Gambling Experience</p>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </a>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Big Boys Game. All rights reserved.</p>
            <p>For entertainment purposes only. 18+ only. Play responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
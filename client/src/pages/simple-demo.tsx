import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Stone Component
interface StoneProps {
  number: number;
  isSpecial?: boolean;
  isSuper?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  onClick?: () => void;
}

const Stone = ({ 
  number, 
  isSpecial = false,
  isSuper = false,
  size = 'md',
  isActive = false,
  onClick,
}: StoneProps) => {
  // Determine size based on the size prop
  const sizeMap = {
    'sm': { width: '2.5rem', height: '2.5rem', fontSize: '0.875rem' },
    'md': { width: '4rem', height: '4rem', fontSize: '1.125rem' },
    'lg': { width: '5rem', height: '5rem', fontSize: '1.25rem' },
  }[size];
  
  // Determine stone background color based on type
  let bgColor = 'bg-blue-900';
  let borderColor = 'border-blue-700';
  let textColor = 'text-white';
  
  if (isSpecial) {
    bgColor = 'bg-yellow-600';
    borderColor = 'border-yellow-400';
    textColor = 'text-slate-900';
  } else if (isSuper) {
    bgColor = 'bg-red-600';
    borderColor = 'border-yellow-400';
    textColor = 'text-white';
  }
  
  // Add glowing effect when active
  const activeClass = isActive ? 'animate-pulse ring-4 ring-yellow-300 scale-110' : '';
  
  return (
    <div
      className={`${bgColor} ${borderColor} ${activeClass} border-2 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md hover:scale-105`}
      style={{ width: sizeMap.width, height: sizeMap.height }}
      onClick={onClick}
    >
      <span className={`${textColor} font-bold`} style={{ fontSize: sizeMap.fontSize }}>
        {number}
      </span>
    </div>
  );
};

// Main Demo Component
export default function SimpleDemo() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State for the game board
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [activeStoneIndex, setActiveStoneIndex] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  
  // Define the stones
  const stones = [
    { id: 1, number: 234, row: 1, col: 1 },
    { id: 2, number: 567, row: 1, col: 2 },
    { id: 3, number: 890, row: 1, col: 3 },
    { id: 4, number: 123, row: 1, col: 4 },
    { id: 5, number: 456, row: 1, col: 5 },
    { id: 6, number: 789, row: 1, col: 6 },
    
    { id: 7, number: 321, row: 2, col: 1 },
    { id: 8, number: 654, row: 2, col: 2 },
    { id: 9, number: 987, row: 2, col: 3, isSpecial: true },
    { id: 10, number: 1000, row: 2, col: 4, isSpecial: true },
    { id: 11, number: 210, row: 2, col: 5 },
    { id: 12, number: 543, row: 2, col: 6 },
    
    { id: 13, number: 876, row: 3, col: 1 },
    { id: 14, number: 432, row: 3, col: 2 },
    { id: 15, number: 3355, row: 3, col: 3, isSuper: true },
    { id: 16, number: 6624, row: 3, col: 4, isSuper: true },
    { id: 17, number: 109, row: 3, col: 5 },
    { id: 18, number: 901, row: 3, col: 6 },
    
    { id: 19, number: 444, row: 4, col: 1 },
    { id: 20, number: 222, row: 4, col: 2 },
    { id: 21, number: 333, row: 4, col: 3 },
    { id: 22, number: 500, row: 4, col: 4, isSpecial: true },
    { id: 23, number: 111, row: 4, col: 5 },
    { id: 24, number: 999, row: 4, col: 6 },
  ];
  
  // Rolling ball element
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  const [showBall, setShowBall] = useState(false);
  
  // Roll the dice - Animation logic
  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    setSelectedStone(null);
    setShowBall(true);
    
    // Play sound
    try {
      const audio = new Audio('/rolling-dice.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    let currentStoneIndex = 0;
    const duration = 3000; // Total animation duration in ms
    const totalSteps = 15; // Number of stones to animate through
    const stepTime = duration / totalSteps;
    
    // Set the initial position using the first stone
    const firstStone = document.getElementById(`stone-${stones[0].id}`);
    if (firstStone) {
      const rect = firstStone.getBoundingClientRect();
      setBallPosition({
        top: rect.top,
        left: rect.left + rect.width / 2 - 20, // Adjust for ball size (40px)
      });
    }
    
    // Animation interval
    const animationInterval = setInterval(() => {
      // Clear previous active stone
      setActiveStoneIndex(null);
      
      // Increment to next stone
      currentStoneIndex++;
      
      // If we've reached our limit, stop and show the result
      if (currentStoneIndex >= totalSteps) {
        clearInterval(animationInterval);
        
        // Select a random final stone
        const randomIndex = Math.floor(Math.random() * stones.length);
        const finalStone = stones[randomIndex];
        
        // Position the ball on the final stone
        const stoneElement = document.getElementById(`stone-${finalStone.id}`);
        if (stoneElement) {
          const rect = stoneElement.getBoundingClientRect();
          setBallPosition({
            top: rect.top,
            left: rect.left + rect.width / 2 - 20,
          });
          
          // Highlight the final stone
          setActiveStoneIndex(finalStone.id);
          
          // After a brief pause, show the result
          setTimeout(() => {
            setIsRolling(false);
            setShowBall(false);
            setSelectedStone(finalStone.number);
            
            // Display toast with result
            toast({
              title: `You rolled: ${finalStone.number}`,
              description: finalStone.isSpecial ? "Special stone! Bonus points." : 
                    finalStone.isSuper ? "Super stone! Big win!" : 
                    "Good roll!",
            });
          }, 1000);
        }
        return;
      }
      
      // Pick the next stone to move to - just go through them in sequence for clarity
      const nextStoneIndex = currentStoneIndex % stones.length;
      const nextStone = stones[nextStoneIndex];
      setActiveStoneIndex(nextStone.id);
      
      // Move the ball to this stone
      const stoneElement = document.getElementById(`stone-${nextStone.id}`);
      if (stoneElement) {
        const rect = stoneElement.getBoundingClientRect();
        setBallPosition({
          top: rect.top,
          left: rect.left + rect.width / 2 - 20,
        });
      }
      
      // Play sound every few steps
      if (currentStoneIndex % 3 === 0) {
        try {
          const audio = new Audio('/rolling-dice.mp3');
          audio.volume = 0.2;
          audio.play().catch(e => console.log('Audio failed:', e));
        } catch (e) {
          console.log('Audio not supported');
        }
      }
    }, stepTime);
  };
  
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
            <p className="text-gray-600">Watch the ball roll through the game numbers</p>
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
            {/* Game board with stones - simpler version for reliable animation */}
            <div 
              className="relative p-4 rounded-lg mb-6 overflow-hidden" 
              style={{ backgroundColor: '#0F172A', border: '2px solid #FFC107', minHeight: '400px' }}
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

              {/* Stones layout - each row is a flexbox container */}
              {[1, 2, 3, 4].map(row => (
                <div key={`row-${row}`} className="flex justify-between mb-6">
                  {stones
                    .filter(stone => stone.row === row)
                    .map(stone => (
                      <div 
                        id={`stone-${stone.id}`} 
                        key={`stone-${stone.id}`} 
                        className="relative"
                      >
                        <Stone 
                          number={stone.number}
                          isSpecial={stone.isSpecial}
                          isSuper={stone.isSuper}
                          isActive={activeStoneIndex === stone.id}
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
              
              {/* Rolling ball element */}
              {showBall && (
                <div 
                  className="ball-element roll-animation"
                  style={{
                    position: 'fixed',
                    top: `${ballPosition.top}px`,
                    left: `${ballPosition.left}px`,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '3px solid gold',
                    zIndex: 1000,
                    transition: 'top 0.2s ease-out, left 0.2s ease-out'
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
                  onClick={rollDice}
                  disabled={isRolling}
                  className={`text-primary text-lg font-sans font-bold py-3 px-8 rounded-lg shadow-lg transform transition
                    ${isRolling 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-secondary hover:bg-secondary-dark hover:scale-105'}`}
                >
                  ROLL STONE
                </button>
                <div className="mt-2 text-xs text-white">
                  {isRolling 
                    ? 'Rolling the stones...' 
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
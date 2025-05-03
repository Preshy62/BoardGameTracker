import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from '@/lib/utils';

interface DemoStoneProps {
  number: number;
  isSpecial?: boolean;
  isSuper?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isRolling?: boolean;
  onClick?: () => void;
}

// Demo Stone Component with interactive animation
const DemoStone: React.FC<DemoStoneProps> = ({ 
  number, 
  isSpecial = false,
  isSuper = false,
  size = 'md',
  isRolling = false,
  onClick,
}) => {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center relative transition-transform cursor-pointer",
        size === 'sm' ? "w-8 h-8 text-xs" : 
        size === 'md' ? "w-12 h-12 text-base" :
        "w-16 h-16 text-xl",
        isSuper ? "bg-red-500 text-white border-2 border-yellow-300 ring-2 ring-yellow-500" :
        isSpecial ? "bg-yellow-400 text-black border border-yellow-600" :
        "bg-gray-700 text-white border border-gray-600",
        isRolling && "stone-roll-animation"
      )}
      style={isRolling ? { animation: 'rollStoneDemo 0.8s ease-in-out infinite' } : {}}
    >
      <span className="font-bold">{number}</span>
    </div>
  );
};

// Game Board Demo page with interactive rollable stones
export default function DemoPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [rollingStoneIndex, setRollingStoneIndex] = useState<number | null>(null);
  const [selectedStone, setSelectedStone] = useState<number | null>(null);

  // Array of stones to display on the board
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

  // Handle stone click to trigger rolling animation
  const handleStoneClick = (index: number, stoneNumber: number) => {
    if (rollingStoneIndex !== null) return; // Prevent clicking while rolling is in progress
    
    setRollingStoneIndex(index);
    
    // Simulate rolling animation for 3 seconds
    setTimeout(() => {
      setRollingStoneIndex(null);
      setSelectedStone(stoneNumber);
    }, 3000);
  };

  // Reset animation state when navigating away
  useEffect(() => {
    return () => {
      setRollingStoneIndex(null);
      setSelectedStone(null);
    };
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      setLocation('/auth');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
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
            <div className="relative" style={{ backgroundColor: 'hsl(var(--primary-light))', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '2px solid rgb(31, 41, 55)' }}>
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

              {/* Regular sized stones by row */}
              {[1, 2, 3, 4].map(row => (
                <div key={`row-${row}`} className="flex justify-between mb-4">
                  {stones
                    .filter(stone => stone.row === row)
                    .map((stone, idx) => (
                      <DemoStone 
                        key={`stone-${stone.row}-${stone.index}`}
                        number={stone.number}
                        isSpecial={!!stone.isSpecial}
                        isSuper={!!stone.isSuper}
                        size={stone.size as 'sm' | 'md' | 'lg'}
                        isRolling={rollingStoneIndex === stone.index}
                        onClick={() => handleStoneClick(stone.index, stone.number)}
                      />
                    ))
                  }
                </div>
              ))}
              
              {/* Small stones for bottom rows */}
              {[5, 6].map(row => (
                <div key={`row-${row}`} className="flex justify-between mb-4">
                  {smallStones
                    .filter(stone => stone.row === row)
                    .map((stone, idx) => (
                      <DemoStone 
                        key={`small-stone-${stone.row}-${stone.index}`}
                        number={stone.number}
                        size="sm"
                        isRolling={rollingStoneIndex === 100 + stone.index} // Offset to avoid collision with main stones
                        onClick={() => handleStoneClick(100 + stone.index, stone.number)}
                      />
                    ))
                  }
                </div>
              ))}
              
              {/* Money in the Bank Label */}
              <div className="border-t-2 border-gray-700 mt-4 pt-2 text-center">
                <h4 className="text-white text-sm uppercase tracking-wider">MONEY IN THE BANK</h4>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'hsl(var(--primary-light))', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <h4 className="text-white text-sm uppercase tracking-wider mb-1">MONEY IN THE BANK</h4>
              <p style={{ color: 'hsl(var(--secondary))', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.875rem' }}>₦95,000</p>
            </div>
            
            <div className="text-center mt-8">
              <p className="text-gray-600 text-sm mb-2">This is an interactive demo of the Big Boys Game board layout.</p>
              <p className="text-gray-600 text-sm">Click any stone to see it roll!</p>
              <Button 
                onClick={() => setLocation('/')} 
                className="mt-4 bg-secondary hover:bg-secondary-dark text-primary font-bold"
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

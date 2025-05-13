import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { preloadSounds } from '@/lib/sounds';
import DemoGameStone from '@/components/game/DemoGameStone';

// Define the stone interface
interface Stone {
  index: number; 
  row: number;
  col: number;
  number: number;
  isSpecial?: boolean;
  isSuper?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Regular stones configuration (main board)
const stones: Stone[] = [
  // Row 1 - Top row (largest stones)
  { index: 1, row: 1, col: 1, number: 6624, isSuper: true, size: 'lg' },
  { index: 2, row: 1, col: 2, number: 1500, size: 'lg' },
  { index: 3, row: 1, col: 3, number: 1000, isSpecial: true, size: 'lg' },
  { index: 4, row: 1, col: 4, number: 500, isSpecial: true, size: 'lg' },
  { index: 5, row: 1, col: 5, number: 3355, isSuper: true, size: 'lg' },
  
  // Row 2
  { index: 6, row: 2, col: 1, number: 1400, size: 'md' },
  { index: 7, row: 2, col: 2, number: 1300, size: 'md' },
  { index: 8, row: 2, col: 3, number: 1200, size: 'md' },
  { index: 9, row: 2, col: 4, number: 1100, size: 'md' },
  { index: 10, row: 2, col: 5, number: 900, size: 'md' },
  
  // Row 3
  { index: 11, row: 3, col: 1, number: 800, size: 'md' },
  { index: 12, row: 3, col: 2, number: 700, size: 'md' },
  { index: 13, row: 3, col: 3, number: 600, size: 'md' },
  { index: 14, row: 3, col: 4, number: 400, size: 'md' },
  { index: 15, row: 3, col: 5, number: 300, size: 'md' },
  
  // Row 4
  { index: 16, row: 4, col: 1, number: 200, size: 'md' },
  { index: 17, row: 4, col: 2, number: 100, size: 'md' },
  { index: 18, row: 4, col: 3, number: 1600, size: 'md' },
  { index: 19, row: 4, col: 4, number: 1700, size: 'md' },
  { index: 20, row: 4, col: 5, number: 1800, size: 'md' },
];

// Small stones for the bottom rows
const smallStones: Stone[] = [
  // Row 5
  { index: 21, row: 5, col: 1, number: 110, size: 'sm' },
  { index: 22, row: 5, col: 2, number: 120, size: 'sm' },
  { index: 23, row: 5, col: 3, number: 130, size: 'sm' },
  { index: 24, row: 5, col: 4, number: 140, size: 'sm' },
  { index: 25, row: 5, col: 5, number: 150, size: 'sm' },
  
  // Row 6
  { index: 26, row: 6, col: 1, number: 160, size: 'sm' },
  { index: 27, row: 6, col: 2, number: 170, size: 'sm' },
  { index: 28, row: 6, col: 3, number: 180, size: 'sm' },
  { index: 29, row: 6, col: 4, number: 190, size: 'sm' },
  { index: 30, row: 6, col: 5, number: 210, size: 'sm' },
];

export default function BoardTestPage() {
  const [rollingStoneIndex, setRollingStoneIndex] = useState<number | null>(null);
  const [winningStone, setWinningStone] = useState<number | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'grid' | 'circular'>('grid');
  
  // Preload sounds when the page loads
  useEffect(() => {
    preloadSounds();
  }, []);
  
  // Handle stone click
  const handleStoneClick = (stoneIndex: number, stoneNumber: number) => {
    // If already rolling, don't do anything
    if (rollingStoneIndex !== null) return;
    
    setRollingStoneIndex(stoneIndex);
    
    // After a delay to allow the animation to complete, set the stone as winner
    setTimeout(() => {
      setRollingStoneIndex(null);
      setWinningStone(stoneNumber);
    }, 2000);
  };
  
  // Reset the board
  const resetBoard = () => {
    setRollingStoneIndex(null);
    setWinningStone(null);
  };
  
  // Find a stone by its number
  const findStoneByNumber = (number: number): Stone | undefined => {
    return [...stones, ...smallStones].find(stone => stone.number === number);
  };
  
  // Render a grid layout board
  const renderGridLayout = () => {
    return (
      <div className="board-container p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-lg">
        {/* Main board with regular stones */}
        {[1, 2, 3, 4].map(row => (
          <div key={`row-${row}`} className="flex justify-between mb-4">
            {stones
              .filter(stone => stone.row === row)
              .map((stone) => (
                <div key={`stone-${stone.row}-${stone.index}`} className="stone-container">
                  <DemoGameStone 
                    number={stone.number}
                    isSpecial={!!stone.isSpecial}
                    isSuper={!!stone.isSuper}
                    size={stone.size as 'sm' | 'md' | 'lg'}
                    isRolling={rollingStoneIndex === stone.index}
                    isWinner={winningStone === stone.number}
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
                <div key={`small-stone-${stone.row}-${stone.index}`} className="stone-container">
                  <DemoGameStone 
                    number={stone.number}
                    size="sm"
                    isRolling={rollingStoneIndex === stone.index}
                    isWinner={winningStone === stone.number}
                    onClick={() => handleStoneClick(stone.index, stone.number)}
                  />
                </div>
              ))
            }
          </div>
        ))}
      </div>
    );
  };
  
  // Render a circular layout board (alternative layout)
  const renderCircularLayout = () => {
    return (
      <div className="board-container relative w-full h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-lg p-4">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Center special stone */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2">
            <DemoGameStone 
              number={1000}
              isSpecial={true}
              size="lg"
              isRolling={rollingStoneIndex === 3}
              isWinner={winningStone === 1000}
              onClick={() => handleStoneClick(3, 1000)}
            />
          </div>
          
          {/* First circle - Super stones */}
          {[
            { index: 1, number: 6624, isSuper: true, angle: 0 },
            { index: 5, number: 3355, isSuper: true, angle: 180 },
          ].map((stone, i) => (
            <div 
              key={`super-${i}`}
              className="absolute"
              style={{
                transform: `rotate(${stone.angle}deg) translateX(160px) rotate(-${stone.angle}deg)`,
              }}
            >
              <DemoGameStone 
                number={stone.number}
                isSuper={stone.isSuper}
                size="lg"
                isRolling={rollingStoneIndex === stone.index}
                isWinner={winningStone === stone.number}
                onClick={() => handleStoneClick(stone.index, stone.number)}
              />
            </div>
          ))}
          
          {/* Second circle - Medium stones */}
          {stones
            .filter(s => s.size === 'md')
            .slice(0, 12) // Use only the first 12 medium stones
            .map((stone, i) => (
              <div 
                key={`med-${i}`}
                className="absolute"
                style={{
                  transform: `rotate(${i * 30}deg) translateX(240px) rotate(-${i * 30}deg)`,
                }}
              >
                <DemoGameStone 
                  number={stone.number}
                  size="md"
                  isRolling={rollingStoneIndex === stone.index}
                  isWinner={winningStone === stone.number}
                  onClick={() => handleStoneClick(stone.index, stone.number)}
                />
              </div>
            ))
          }
          
          {/* Outer circle - Small stones */}
          {smallStones
            .slice(0, 10) // Use only the first 10 small stones
            .map((stone, i) => (
              <div 
                key={`small-${i}`}
                className="absolute"
                style={{
                  transform: `rotate(${i * 36}deg) translateX(320px) rotate(-${i * 36}deg)`,
                }}
              >
                <DemoGameStone 
                  number={stone.number}
                  size="sm"
                  isRolling={rollingStoneIndex === stone.index}
                  isWinner={winningStone === stone.number}
                  onClick={() => handleStoneClick(stone.index, stone.number)}
                />
              </div>
            ))
          }
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Game Board Testing</h1>
      <p className="text-gray-500 mb-8">Test the enhanced game board layouts and animations</p>
      
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant={selectedLayout === 'grid' ? 'default' : 'outline'} 
            onClick={() => setSelectedLayout('grid')}
          >
            Grid Layout
          </Button>
          <Button 
            variant={selectedLayout === 'circular' ? 'default' : 'outline'} 
            onClick={() => setSelectedLayout('circular')}
          >
            Circular Layout
          </Button>
        </div>
        
        <div className="flex-1"></div>
        
        <Button 
          variant="secondary" 
          onClick={resetBoard}
        >
          Reset Board
        </Button>
      </div>
      
      {/* Board Layout */}
      {selectedLayout === 'grid' ? renderGridLayout() : renderCircularLayout()}
      
      {/* Result Card */}
      {winningStone && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              Result 
              <Badge variant="outline" className="ml-2">
                {findStoneByNumber(winningStone)?.isSpecial ? 'Special Stone' : 
                 findStoneByNumber(winningStone)?.isSuper ? 'Super Stone' : 'Regular Stone'}
              </Badge>
            </CardTitle>
            <CardDescription>You rolled and landed on stone value:</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="text-4xl font-bold">{winningStone}</div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-12 text-center">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
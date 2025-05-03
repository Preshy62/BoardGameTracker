import React from 'react';
import { cn } from '@/lib/utils';

interface GameStoneDemoProps {
  number: number;
  isSpecial?: boolean;
  isSuper?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Demo version of GameStone component just for display
const GameStoneDemo: React.FC<GameStoneDemoProps> = ({ 
  number, 
  isSpecial = false,
  isSuper = false,
  size = 'md' 
}) => {
  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center relative transition-transform",
        size === 'sm' ? "w-8 h-8 text-xs" : 
        size === 'md' ? "w-12 h-12 text-base" :
        "w-16 h-16 text-xl",
        isSuper ? "bg-red-500 text-white border-2 border-yellow-300 ring-2 ring-yellow-500" :
        isSpecial ? "bg-yellow-400 text-black border border-yellow-600" :
        "bg-gray-700 text-white border border-gray-600"
      )}
    >
      <span className="font-bold">{number}</span>
    </div>
  );
};

// Demo version of the GameBoard component for display on the home page
const GameBoardDemo: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-primary p-4 text-white">
        <h2 className="text-xl font-bold text-center">Big Boys Game Board Demo</h2>
      </div>
      
      <div className="p-6">
        <div className="relative bg-primary-light border-2 border-gray-800 p-4 rounded mb-6">
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
            <GameStoneDemo number={29} />
            <GameStoneDemo number={40} />
            <GameStoneDemo number={32} />
            <GameStoneDemo number={81} />
            <GameStoneDemo number={7} />
          </div>
          
          {/* Second row with 1000 as special */}
          <div className="flex justify-between mb-4">
            <GameStoneDemo number={13} />
            <GameStoneDemo number={64} />
            <GameStoneDemo number={1000} isSpecial={true} size="lg" />
            <GameStoneDemo number={101} />
            <GameStoneDemo number={4} />
          </div>
          
          {/* Third row with 3355 and 6624 */}
          <div className="flex justify-between mb-4">
            <GameStoneDemo number={3355} isSuper={true} />
            <GameStoneDemo number={65} />
            <GameStoneDemo number={12} />
            <GameStoneDemo number={22} />
            <GameStoneDemo number={9} />
            <GameStoneDemo number={6624} isSuper={true} />
            <GameStoneDemo number={44} />
          </div>
          
          {/* Fourth row with 500 as special */}
          <div className="flex justify-between mb-4">
            <GameStoneDemo number={28} />
            <GameStoneDemo number={21} />
            <GameStoneDemo number={105} />
            <GameStoneDemo number={500} isSpecial={true} size="lg" />
            <GameStoneDemo number={99} />
            <GameStoneDemo number={20} />
            <GameStoneDemo number={82} />
            <GameStoneDemo number={3} />
          </div>
          
          {/* Fifth row */}
          <div className="flex justify-between mb-4">
            <GameStoneDemo number={11} size="sm" />
            <GameStoneDemo number={37} size="sm" />
            <GameStoneDemo number={72} size="sm" />
            <GameStoneDemo number={17} size="sm" />
            <GameStoneDemo number={42} size="sm" />
            <GameStoneDemo number={8} size="sm" />
            <GameStoneDemo number={30} size="sm" />
            <GameStoneDemo number={91} size="sm" />
            <GameStoneDemo number={27} size="sm" />
            <GameStoneDemo number={5} size="sm" />
            <GameStoneDemo number={40} size="sm" />
          </div>
          
          {/* Bottom row */}
          <div className="flex justify-between">
            <GameStoneDemo number={6} size="sm" />
            <GameStoneDemo number={80} size="sm" />
            <GameStoneDemo number={3} size="sm" />
            <GameStoneDemo number={26} size="sm" />
            <GameStoneDemo number={100} size="sm" />
            <GameStoneDemo number={19} size="sm" />
            <GameStoneDemo number={14} size="sm" />
            <GameStoneDemo number={43} size="sm" />
            <GameStoneDemo number={16} size="sm" />
            <GameStoneDemo number={71} size="sm" />
            <GameStoneDemo number={10} size="sm" />
          </div>
          
          {/* Money in the Bank Label */}
          <div className="border-t-2 border-gray-700 mt-4 pt-2 text-center">
            <h4 className="text-white text-sm uppercase tracking-wider">MONEY IN THE BANK</h4>
          </div>
        </div>
        
        <div className="bg-primary-light p-3 rounded-lg text-center mb-6">
          <h4 className="text-white text-sm uppercase tracking-wider mb-1">MONEY IN THE BANK</h4>
          <p className="text-secondary font-mono font-bold text-3xl">₦95,000</p>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm mb-2">This is a demo of the Big Boys Game board layout.</p>
          <p className="text-gray-600 text-sm">Create or join a game to play for real!</p>
        </div>
      </div>
    </div>
  );
};

export default GameBoardDemo;
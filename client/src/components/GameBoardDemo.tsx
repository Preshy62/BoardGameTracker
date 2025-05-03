import React from 'react';
import { cn } from '@/lib/utils';

interface DemoStoneProps {
  number: number;
  isSpecial?: boolean;
  isSuper?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Demo Stone Component for the Game Board Demo
const DemoStone: React.FC<DemoStoneProps> = ({ 
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

// Game Board Demo component for the home page
const GameBoardDemo: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-primary p-4 text-white">
        <h2 className="text-xl font-bold text-center">Big Boys Game Board Demo</h2>
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

          {/* Top row stones */}
          <div className="flex justify-between mb-4">
            <DemoStone number={29} />
            <DemoStone number={40} />
            <DemoStone number={32} />
            <DemoStone number={81} />
            <DemoStone number={7} />
          </div>
          
          {/* Second row with 1000 as special */}
          <div className="flex justify-between mb-4">
            <DemoStone number={13} />
            <DemoStone number={64} />
            <DemoStone number={1000} isSpecial={true} size="lg" />
            <DemoStone number={101} />
            <DemoStone number={4} />
          </div>
          
          {/* Third row with 3355 and 6624 */}
          <div className="flex justify-between mb-4">
            <DemoStone number={3355} isSuper={true} />
            <DemoStone number={65} />
            <DemoStone number={12} />
            <DemoStone number={22} />
            <DemoStone number={9} />
            <DemoStone number={6624} isSuper={true} />
            <DemoStone number={44} />
          </div>
          
          {/* Fourth row with 500 as special */}
          <div className="flex justify-between mb-4">
            <DemoStone number={28} />
            <DemoStone number={21} />
            <DemoStone number={105} />
            <DemoStone number={500} isSpecial={true} size="lg" />
            <DemoStone number={99} />
            <DemoStone number={20} />
            <DemoStone number={82} />
            <DemoStone number={3} />
          </div>
          
          {/* Fifth row */}
          <div className="flex justify-between mb-4">
            <DemoStone number={11} size="sm" />
            <DemoStone number={37} size="sm" />
            <DemoStone number={72} size="sm" />
            <DemoStone number={17} size="sm" />
            <DemoStone number={42} size="sm" />
            <DemoStone number={8} size="sm" />
            <DemoStone number={30} size="sm" />
            <DemoStone number={91} size="sm" />
            <DemoStone number={27} size="sm" />
            <DemoStone number={5} size="sm" />
            <DemoStone number={40} size="sm" />
          </div>
          
          {/* Bottom row */}
          <div className="flex justify-between">
            <DemoStone number={6} size="sm" />
            <DemoStone number={80} size="sm" />
            <DemoStone number={3} size="sm" />
            <DemoStone number={26} size="sm" />
            <DemoStone number={100} size="sm" />
            <DemoStone number={19} size="sm" />
            <DemoStone number={14} size="sm" />
            <DemoStone number={43} size="sm" />
            <DemoStone number={16} size="sm" />
            <DemoStone number={71} size="sm" />
            <DemoStone number={10} size="sm" />
          </div>
          
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
          <p className="text-gray-600 text-sm mb-2">This is a demo of the Big Boys Game board layout.</p>
          <p className="text-gray-600 text-sm">Create or join a game to play for real!</p>
        </div>
      </div>
    </div>
  );
};

export default GameBoardDemo;
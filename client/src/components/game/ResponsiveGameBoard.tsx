import React from 'react';

interface ResponsiveGameBoardProps {
  game: any;
  currentPlayer: any;
  isAnimating: boolean;
  currentStonePosition: number;
  boardPath: number[];
  isRolling: boolean;
  selectedStone: number | null;
  onStoneClick?: (stoneNumber: number) => void;
}

export const ResponsiveGameBoard: React.FC<ResponsiveGameBoardProps> = ({
  game,
  currentPlayer,
  isAnimating,
  currentStonePosition,
  boardPath,
  isRolling,
  selectedStone,
  onStoneClick
}) => {
  const renderStone = (num: number, bgColor: string, textColor: string = 'text-black', borderColor: string = 'border-gray-300') => (
    <div
      key={num}
      onClick={() => onStoneClick?.(num)}
      className={`
        game-stone flex items-center justify-center font-bold shadow-md sm:shadow-lg flex-shrink-0
        ${bgColor} ${textColor} border-2 ${borderColor}
        ${isAnimating && boardPath[currentStonePosition] === num ? 'ring-4 ring-blue-500 animate-pulse bg-blue-100' : ''}
        ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
        ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
        hover:scale-105 transition-transform cursor-pointer touch-manipulation
        active:scale-95
      `}
      style={{
        minWidth: '28px',
        minHeight: '36px'
      }}
    >
      {num}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      {/* Top Row with Special and Super Stones */}
      <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 mb-3 sm:mb-4 lg:mb-6 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
        {[28, 21, 105, 500, 99, 20, 82, 3].map((num, index) => {
          let bgColor = 'bg-white';
          let textColor = 'text-black';
          let borderColor = 'border-gray-300';
          
          if (num === 500) {
            bgColor = 'bg-yellow-400';
            textColor = 'text-black';
            borderColor = 'border-yellow-600';
          } else if (index === 0 || index === 5) {
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            borderColor = 'border-red-700';
          }
          
          return renderStone(num, bgColor, textColor, borderColor);
        })}
      </div>
      
      {/* Super Stone Row */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
        {renderStone(1000, 'bg-purple-500', 'text-white', 'border-purple-700')}
      </div>
      
      {/* Individual Stones Row */}
      <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 mb-3 sm:mb-4 lg:mb-6 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
        {[33, 55, 66, 24].map((num) => 
          renderStone(num, 'bg-blue-500', 'text-white', 'border-blue-700')
        )}
      </div>
      
      {/* Main White Stone Rows */}
      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Row 1 */}
        <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
          {[11, 37, 72, 17, 42, 8, 30, 91, 27, 5, 40].map((num) => 
            renderStone(num, 'bg-white', 'text-black', 'border-gray-300')
          )}
        </div>
        
        {/* Row 2 */}
        <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
          {[6, 80, 3, 26, 100, 19, 14, 43, 16, 71, 10].map((num) => 
            renderStone(num, 'bg-white', 'text-black', 'border-gray-300')
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveGameBoard;
import { cn } from "@/lib/utils";

interface GameStoneProps {
  number: number;
  isRolling?: boolean;
  isSpecial?: boolean;
  isSuper?: boolean; // For 6624 and 3355
  isWinner?: boolean; // New prop for the winner animation
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Different stone sizes
  id?: string; // Optional ID for directly targeting the stone element
}

const GameStone = ({ 
  number, 
  isRolling = false, 
  isSpecial = false,
  isSuper = false,
  isWinner = false,
  size = 'md',
  className,
  id
}: GameStoneProps) => {
  // Determine size classes based on the size prop
  const sizeClasses = {
    'sm': 'w-10 h-10 text-base',
    'md': 'w-14 h-14 text-xl',
    'lg': 'w-20 h-20 text-2xl',
    'xl': 'w-24 h-24 text-3xl',
  }[size];

  return (
    <div 
      id={id || `stone-${number}`}
      className={cn(
        "game-stone rounded-full border-2 flex items-center justify-center transition-all",
        sizeClasses,
        isSpecial 
          ? "border-4 border-secondary bg-secondary" 
          : isSuper
          ? "border-4 border-yellow-300 bg-red-500"
          : "bg-primary border-secondary",
        isRolling && "stone-roll-animation simple-rotating",
        className
      )}
      style={isRolling || isWinner ? {
        boxShadow: isWinner 
          ? "0 0 75px 35px rgba(255, 215, 0, 0.95)"
          : "0 0 60px 30px rgba(255, 215, 0, 0.95)",
        zIndex: isWinner ? 200 : 100,
        position: "relative",
        transform: isWinner ? "scale(2.0)" : "scale(1.8)", 
        transition: "all 0.15s ease-in-out",
        animation: isWinner 
          ? "winner-stone 1.5s infinite" 
          : "dice-roll 0.5s linear infinite, stone-pulse 0.6s infinite alternate",
        border: isWinner ? '8px solid gold' : '6px solid gold',
        outline: isWinner ? '5px solid red' : '4px solid red',
        background: isSpecial 
          ? 'radial-gradient(circle, #FFD700 30%, #f59e0b 100%)' 
          : isSuper 
            ? 'radial-gradient(circle, #f87171 30%, #b91c1c 100%)'
            : 'radial-gradient(circle, #1e3a8a 30%, #172554 100%)'
      } : undefined}
    >
      <span 
        className={cn(
          "font-mono font-bold",
          isSpecial || isSuper ? "text-primary" : "text-white"
        )}
      >
        {number}
      </span>
    </div>
  );
};

export default GameStone;

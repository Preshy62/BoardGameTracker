import { cn } from "@/lib/utils";

interface GameStoneProps {
  number: number;
  isRolling?: boolean;
  isSpecial?: boolean;
  isSuper?: boolean; // For 6624 and 3355
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Different stone sizes
}

const GameStone = ({ 
  number, 
  isRolling = false, 
  isSpecial = false,
  isSuper = false,
  size = 'md',
  className
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
      id={`stone-${number}`}
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
      style={isRolling ? {
        boxShadow: "0 0 25px 12px rgba(255, 215, 0, 0.9)",
        zIndex: 50,
        position: "relative",
        transform: "scale(1.2)", 
        transition: "all 0.2s ease-in-out",
        animation: "dice-roll 0.8s linear infinite"
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

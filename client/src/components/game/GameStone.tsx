import { cn } from "@/lib/utils";

interface GameStoneProps {
  number: number;
  isRolling?: boolean;
  isSpecial?: boolean;
  className?: string;
}

const GameStone = ({ 
  number, 
  isRolling = false, 
  isSpecial = false,
  className
}: GameStoneProps) => {
  return (
    <div 
      className={cn(
        "game-stone aspect-square rounded-full border-2 flex items-center justify-center",
        isRolling && "stone-roll-animation",
        isSpecial 
          ? "border-4 border-secondary bg-secondary" 
          : "bg-primary border-secondary",
        className
      )}
    >
      <span 
        className={cn(
          "font-mono font-bold text-xl md:text-2xl",
          isSpecial ? "text-primary" : "text-white"
        )}
      >
        {number}
      </span>
    </div>
  );
};

export default GameStone;

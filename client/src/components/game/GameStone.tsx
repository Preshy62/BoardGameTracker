import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import { CSSProperties } from "react";

interface GameStoneProps {
  number: number;
  isRolling?: boolean;
  isSpecial?: boolean;
  isSuper?: boolean; // For 6624 and 3355
  isWinner?: boolean; // For the winner animation
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Different stone sizes
  id?: string; // Optional ID for directly targeting the stone element
  onClick?: () => void; // Optional click handler for interactive stones
  disabled?: boolean; // Optional disabled state
}

const GameStone = ({ 
  number, 
  isRolling = false, 
  isSpecial = false,
  isSuper = false,
  isWinner = false,
  size = 'md',
  className,
  id,
  onClick,
  disabled = false
}: GameStoneProps) => {
  // Add subtle hover animation for clickable stones
  const [isHovering, setIsHovering] = useState(false);
  const stoneRef = useRef<HTMLDivElement>(null);

  // Determine size classes based on the size prop
  const sizeClasses = {
    'sm': 'w-10 h-10 text-base',
    'md': 'w-14 h-14 text-xl',
    'lg': 'w-20 h-20 text-2xl',
    'xl': 'w-24 h-24 text-3xl',
  }[size];

  // Add focus highlight for accessibility
  useEffect(() => {
    if (onClick && stoneRef.current) {
      stoneRef.current.tabIndex = 0; // Make it focusable
    }
  }, [onClick]);

  // Determine interactive classes
  const interactiveClasses = onClick && !disabled ? 
    "cursor-pointer hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-primary" : 
    "";
    
  // Main style for the stone
  const stoneStyle = isRolling || isWinner || isHovering ? {
    boxShadow: isWinner 
      ? "0 0 75px 35px rgba(255, 215, 0, 0.95)"
      : isHovering && !isRolling && onClick && !disabled
        ? "0 0 30px 15px rgba(255, 215, 0, 0.6)"
        : "0 0 60px 30px rgba(255, 215, 0, 0.95)",
    zIndex: isWinner ? 200 : isHovering ? 50 : 100,
    position: "relative" as const,
    transform: isWinner 
      ? "scale(2.0)" 
      : isHovering && !isRolling && onClick && !disabled 
        ? "scale(1.1)"
        : isRolling 
          ? "scale(1.8)"
          : "scale(1)", 
    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)", // Bouncy effect
    animation: isWinner 
      ? "winner-stone 1.5s infinite alternate ease-in-out" 
      : isRolling
        ? "dice-roll 0.5s linear infinite, stone-pulse 0.6s infinite alternate"
        : "",
    border: isWinner 
      ? '8px solid gold' 
      : isRolling 
        ? '6px solid gold'
        : isHovering && !disabled && onClick
          ? '3px solid gold'
          : undefined,
    outline: isWinner 
      ? '5px solid red' 
      : isRolling 
        ? '4px solid red'
        : undefined,
    background: isSpecial 
      ? 'radial-gradient(circle, #FFD700 30%, #f59e0b 100%)' 
      : isSuper 
        ? 'radial-gradient(circle, #f87171 30%, #b91c1c 100%)'
        : 'radial-gradient(circle, #1e3a8a 30%, #172554 100%)',
    filter: disabled ? "grayscale(0.7) opacity(0.7)" : undefined,
  } : disabled ? {
    filter: "grayscale(0.7) opacity(0.7)",
  } : undefined;
  
  // Handle stone click with feedback
  const handleClick = () => {
    if (onClick && !disabled && !isRolling && !isWinner) {
      // Add haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      onClick();
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      ref={stoneRef}
      id={id || `stone-${number}`}
      className={cn(
        "game-stone rounded-full border-2 flex items-center justify-center transition-all",
        sizeClasses,
        isSpecial 
          ? "border-4 border-secondary bg-secondary" 
          : isSuper
          ? "border-4 border-yellow-300 bg-red-500"
          : "bg-primary border-secondary",
        isRolling && "stone-roll-animation",
        interactiveClasses,
        disabled && "cursor-not-allowed",
        className
      )}
      style={stoneStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label={`Stone number ${number}${isSpecial ? ', special stone' : ''}${isSuper ? ', super stone' : ''}`}
      role={onClick ? "button" : "presentation"}
      aria-disabled={disabled}
    >
      <span 
        className={cn(
          "font-mono font-bold select-none",
          isSpecial || isSuper ? "text-primary" : "text-white"
        )}
      >
        {number}
      </span>
    </div>
  );
};

export default GameStone;

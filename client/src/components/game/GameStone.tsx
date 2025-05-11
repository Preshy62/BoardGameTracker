import { cn } from "@/lib/utils";
import { useRef, useEffect, useState } from "react";
import { CSSProperties } from "react";

interface GameStoneProps {
  number: number;
  isRolling?: boolean;
  isSpecial?: boolean;
  isSuper?: boolean; // For 6624 and 3355
  isWinner?: boolean; // For the winner animation
  isYourTurn?: boolean; // Indicates if it's the current player's turn
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Different stone sizes
  id?: string; // Optional ID for directly targeting the stone element
  onClick?: () => void; // Optional click handler for interactive stones
  disabled?: boolean; // Optional disabled state
  animationType?: 'none' | 'pulse' | 'glow' | 'spin' | 'bounce'; // Optional animation type
}

const GameStone = ({ 
  number, 
  isRolling = false, 
  isSpecial = false,
  isSuper = false,
  isWinner = false,
  isYourTurn = false,
  size = 'md',
  className,
  id,
  onClick,
  disabled = false,
  animationType = 'none'
}: GameStoneProps) => {
  // Add subtle hover animation for clickable stones
  const [isHovering, setIsHovering] = useState(false);
  const [hasEntered, setHasEntered] = useState(false); // Track if stone has been seen for entrance animations
  const stoneRef = useRef<HTMLDivElement>(null);
  
  // Set hasEntered to true once after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasEntered(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
    
  // Get animation class based on animationType
  const getAnimationClass = () => {
    if (isRolling) return "stone-roll-animation";
    if (isWinner) return "winner-stone-animation";
    
    switch (animationType) {
      case 'pulse': return "stone-pulse";
      case 'glow': return "stone-hover-glow";
      case 'spin': return "slow-spin";
      case 'bounce': return "animate-bounce";
      default: return "";
    }
  };
  
  // Entrance animation for visual appeal
  const entranceAnimation = !hasEntered ? {
    opacity: 0,
    transform: 'scale(0.8)',
    transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
  } : {
    opacity: 1,
    transform: 'scale(1)',
    transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };
  
  // Main style for the stone with enhanced visual effects
  const stoneStyle = {
    ...entranceAnimation,
    boxShadow: isWinner 
      ? "0 0 75px 35px rgba(255, 215, 0, 0.95)"
      : isHovering && !isRolling && onClick && !disabled
        ? "0 0 30px 15px rgba(255, 215, 0, 0.6)"
        : isRolling
          ? "0 0 60px 30px rgba(255, 255, 0, 0.8), inset 0 0 15px 5px rgba(255, 255, 255, 0.6)"
          : isYourTurn 
            ? "0 0 20px 10px rgba(255, 255, 255, 0.7)"
            : "0 0 5px 2px rgba(255, 215, 0, 0.3)",
    zIndex: isWinner ? 200 : isRolling ? 120 : isHovering ? 50 : isYourTurn ? 30 : 10,
    position: "relative" as const,
    transform: isWinner 
      ? "scale(1.8)" 
      : isHovering && !isRolling && onClick && !disabled 
        ? "scale(1.1)"
        : isRolling 
          ? "scale(1.5)"
          : "scale(1)", 
    transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)", // Bouncy effect
    border: isWinner 
      ? '8px solid gold' 
      : isRolling 
        ? '6px solid gold'
        : isYourTurn
          ? '4px solid rgba(255, 255, 255, 0.8)'
          : isHovering && !disabled && onClick
            ? '3px solid gold'
            : undefined,
    outline: isWinner 
      ? '5px solid red' 
      : isRolling 
        ? '4px solid #ff9500'
        : undefined,
    background: isSpecial 
      ? 'radial-gradient(circle, #FFD700 30%, #f59e0b 100%)' 
      : isSuper 
        ? 'radial-gradient(circle, #f87171 30%, #b91c1c 100%)'
        : isRolling
          ? 'radial-gradient(circle at 30% 30%, #1e40af 20%, #1e3a8a 50%, #172554 100%)' 
          : 'radial-gradient(circle, #1e3a8a 30%, #172554 100%)',
    filter: isRolling 
      ? "brightness(1.4) contrast(1.2)" 
      : disabled 
        ? "grayscale(0.7) opacity(0.7)" 
        : undefined,
  };
  
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
        isWinner && "winner-stone-animation",
        isYourTurn && "stone-your-turn",
        isSuper && !isRolling && "stone-super-special",
        getAnimationClass(),
        interactiveClasses,
        disabled && "cursor-not-allowed",
        className
      )}
      style={stoneStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label={`Stone number ${number}${isSpecial ? ', special stone' : ''}${isSuper ? ', super stone' : ''}${isYourTurn ? ', your turn' : ''}`}
      role={onClick ? "button" : "presentation"}
      aria-disabled={disabled}
    >
      <span 
        className={cn(
          "font-mono font-bold select-none",
          isSpecial || isSuper ? "text-primary" : "text-white",
          isWinner && "winner-text-animation"
        )}
      >
        {number}
      </span>
      
      {/* Add visual indicator for your turn */}
      {isYourTurn && (
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-primary text-xs px-2 py-0.5 rounded-full animate-pulse shadow-md">
          Your Turn
        </div>
      )}
    </div>
  );
};

export default GameStone;

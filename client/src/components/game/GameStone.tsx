import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '@/lib/sounds';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { LucideLoader2 } from 'lucide-react';

interface GameStoneProps {
  number: number;
  isWinner?: boolean;
  isRolling?: boolean;
  isUserTurn?: boolean;
  onRollComplete?: (number: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function GameStone({
  number,
  isWinner = false,
  isRolling = false,
  isUserTurn = false,
  onRollComplete,
  size = 'md',
  showLabel = false,
  className = ''
}: GameStoneProps) {
  const [rollAnimation, setRollAnimation] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(number);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rollCountRef = useRef(0);
  const maxRolls = 15; // Number of random numbers to show during animation
  
  // Determine stone background style based on number value
  const getStoneStyle = (num: number) => {
    // Special stone styling (1000, 500)
    if (num === 1000 || num === 500) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    // Super stone styling (3355, 6624)
    else if (num === 3355 || num === 6624) {
      return 'bg-red-100 text-red-900 border-red-300';
    }
    
    // Default stone styling
    return 'bg-white text-slate-800 border-slate-300';
  };
  
  // Get size classes for the stone
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-12 w-12 text-sm';
      case 'lg':
        return 'h-20 w-20 text-xl';
      case 'md':
      default:
        return 'h-16 w-16 text-lg';
    }
  };
  
  // Winner animation classes
  const getWinnerClasses = () => {
    if (isWinner) {
      return 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse';
    }
    return '';
  };
  
  // Simulate stone rolling with random numbers
  const rollStone = () => {
    // Skip if already rolling
    if (rollAnimation) return;
    
    // Start roll animation and play sound
    setRollAnimation(true);
    playSound('STONE_ROLL', 0.5);
    
    // Potential roll values (can be adjusted based on game rules)
    const potentialRolls = [
      500, 1000, 3355, 6624, // Special values
      ...Array.from({ length: 15 }, (_, i) => 100 + i * 100) // Regular values 100-1500
    ];
    
    // Reset roll count
    rollCountRef.current = 0;
    
    // Function to show a random number during animation
    const showRandomNumber = () => {
      rollCountRef.current++;
      
      // If we've hit our max rolls, stop and show actual result
      if (rollCountRef.current >= maxRolls) {
        setDisplayNumber(number);
        setRollAnimation(false);
        
        // Play landing sound
        playSound('STONE_LAND', 0.6);
        
        // Notify parent component that roll is complete
        if (onRollComplete) {
          onRollComplete(number);
        }
        
        // Clear the timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        return;
      }
      
      // Show a random number from potential rolls
      const randomIndex = Math.floor(Math.random() * potentialRolls.length);
      setDisplayNumber(potentialRolls[randomIndex]);
      
      // Wait a decreasing amount of time between changes
      // This makes the animation slow down as it reaches the end
      const delay = 75 + Math.floor(rollCountRef.current * 15);
      
      // Schedule the next change
      timeoutRef.current = setTimeout(showRandomNumber, delay);
    };
    
    // Start the animation sequence
    showRandomNumber();
  };
  
  // Start roll animation when isRolling prop changes to true
  useEffect(() => {
    if (isRolling && !rollAnimation) {
      rollStone();
    }
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isRolling]);
  
  return (
    <div className={cn("relative", className)}>
      {showLabel && (
        <Badge variant="outline" className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 text-xs px-1 py-0">
          {isUserTurn ? 'Your Turn' : 'Stone'}
        </Badge>
      )}
      
      <motion.div
        className={cn(
          'rounded-lg border-2 flex items-center justify-center shadow-md relative overflow-hidden',
          getSizeClasses(),
          getStoneStyle(displayNumber),
          getWinnerClasses(),
          { 'cursor-pointer hover:border-primary': isUserTurn && !rollAnimation }
        )}
        onClick={() => isUserTurn && !rollAnimation && rollStone()}
        whileHover={isUserTurn && !rollAnimation ? { scale: 1.05 } : {}}
        animate={{
          rotate: rollAnimation ? [0, -10, 10, -10, 0] : 0,
          scale: rollAnimation ? [1, 1.1, 0.95, 1.05, 1] : 1
        }}
        transition={{
          duration: rollAnimation ? 0.5 : 0.2,
          repeat: rollAnimation ? Infinity : 0,
          repeatType: 'reverse'
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={displayNumber}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            className="font-bold"
          >
            {rollAnimation ? displayNumber : number}
          </motion.div>
        </AnimatePresence>
        
        {/* Rolling indicator */}
        {rollAnimation && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
            <LucideLoader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        )}
        
        {/* Winner indicator overlay */}
        {isWinner && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 animate-gradient-x" />
        )}
      </motion.div>
    </div>
  );
}
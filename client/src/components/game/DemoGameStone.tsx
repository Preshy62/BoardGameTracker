import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideLoader2 } from 'lucide-react';
import { playSound, SOUND_FILES } from '@/lib/sounds';

// We'll reuse this component for the demo page exclusively
interface DemoGameStoneProps {
  number: number;
  isWinner?: boolean;
  isRolling?: boolean;
  isSpecial?: boolean;
  isSuper?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function DemoGameStone({
  number,
  isWinner = false,
  isRolling = false,
  isSpecial = false,
  isSuper = false,
  size = 'md',
  onClick
}: DemoGameStoneProps) {
  const [rollAnimation, setRollAnimation] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(number);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rollCountRef = useRef(0);
  const maxRolls = 12; // Number of random numbers to show during animation
  
  // Play sound effects using our sound library
  const playSoundEffect = (sound: 'roll' | 'land' | 'win') => {
    try {
      if (sound === 'roll') {
        playSound(SOUND_FILES.ROLLING_DICE, 0.5);
      } else if (sound === 'land') {
        playSound(SOUND_FILES.DICE_LANDING, 0.5);
      } else if (sound === 'win') {
        playSound(SOUND_FILES.CLICK, 0.5);
      }
    } catch (err) {
      console.error(`Error playing ${sound} sound:`, err);
    }
  };
  
  // Determine stone background style based on type
  const getStoneStyle = () => {
    if (isSpecial) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    else if (isSuper) {
      return 'bg-red-100 text-red-900 border-red-300';
    }
    
    // Default stone styling
    return 'bg-white text-slate-800 border-slate-300';
  };
  
  // Get size classes for the stone
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-10 w-10 text-xs';
      case 'lg':
        return 'h-16 w-16 text-lg';
      case 'md':
      default:
        return 'h-14 w-14 text-base';
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
    playSoundEffect('roll');
    
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
        playSoundEffect('land');
        
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
    <motion.div
      className={cn(
        'rounded-lg border-2 flex items-center justify-center shadow-md relative overflow-hidden cursor-pointer',
        getSizeClasses(),
        getStoneStyle(),
        getWinnerClasses()
      )}
      onClick={() => {
        if (onClick) {
          playSoundEffect('win'); // Play click sound
          onClick();
        }
      }}
      whileHover={{ scale: 1.05 }}
      animate={{
        rotate: rollAnimation ? [0, -10, 10, -10, 0] : 0,
        scale: rollAnimation ? [1, 1.1, 0.95, 1.05, 1] : 1,
        boxShadow: isWinner ? ['0 0 10px gold', '0 0 20px orange', '0 0 10px gold'] : undefined
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
          <LucideLoader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
      )}
      
      {/* Winner indicator overlay */}
      {isWinner && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 animate-gradient-x" />
      )}
    </motion.div>
  );
}
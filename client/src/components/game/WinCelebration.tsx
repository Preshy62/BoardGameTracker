import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import Confetti from './Confetti';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface WinCelebrationProps {
  isVisible: boolean;
  winnerName?: string;
  winAmount?: number;
  currency?: string;
  onClose?: () => void;
  className?: string;
  autoHideDuration?: number; // in milliseconds
}

const WinCelebration = ({
  isVisible,
  winnerName = 'You',
  winAmount = 0,
  currency = '₦',
  onClose,
  className,
  autoHideDuration = 7000,
}: WinCelebrationProps) => {
  const [isActive, setIsActive] = useState(false);
  
  // Handle animation timing
  useEffect(() => {
    if (isVisible) {
      setIsActive(true);
      
      // Auto-hide after duration if specified
      if (autoHideDuration && onClose) {
        const timer = setTimeout(() => {
          setIsActive(false);
          // Add delay for exit animation
          setTimeout(onClose, 500);
        }, autoHideDuration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsActive(false);
    }
  }, [isVisible, autoHideDuration, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <>
      <Confetti active={isActive} />
      
      <div 
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm",
          isActive ? "opacity-100" : "opacity-0",
          "transition-opacity duration-500",
          className
        )}
      >
        <div 
          className={cn(
            "bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 p-1 rounded-xl shadow-2xl max-w-md w-full transform",
            isActive ? "scale-100" : "scale-90",
            "transition-all duration-500"
          )}
        >
          <div className="bg-white rounded-lg p-6 text-center relative overflow-hidden">
            {/* Background effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-center bg-no-repeat bg-contain" 
                   style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 50l30-30m-30 30L20 20m30 30l30 30m-30-30L20 80' stroke='%23FFD700' stroke-width='2'/%3E%3C/svg%3E")` }}>
              </div>
            </div>
            
            {/* Trophy icon with animation */}
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-yellow-300 opacity-50 animate-pulse"></div>
                <div className="relative bg-yellow-500 text-white p-4 rounded-full animate-bounce">
                  <Trophy className="h-12 w-12" />
                </div>
              </div>
            </div>
            
            {/* Win message */}
            <h2 className="text-2xl font-bold mb-2 text-primary">
              {winnerName === 'You' ? 'Congratulations! 🎉' : `${winnerName} Wins! 🏆`}
            </h2>
            <p className="text-gray-600 mb-4">
              {winnerName === 'You' ? 'You have' : `${winnerName} has`} won
            </p>
            
            {/* Win amount with animation */}
            <div className="text-4xl font-bold mb-6 text-green-600 bank-amount-pulse-animation">
              {formatCurrency(winAmount, currency)}
            </div>
            
            {/* Close button if provided */}
            {onClose && (
              <button
                onClick={onClose}
                className="mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WinCelebration;
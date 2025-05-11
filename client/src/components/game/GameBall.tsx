import { useEffect, useState } from 'react';

interface GameBallProps {
  visible: boolean;
  top?: number | string;
  left?: number | string;
  color?: 'gold' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showTrails?: boolean;
}

/**
 * Enhanced GameBall component with improved visuals and trail effects
 * Provides a more dynamic and engaging rolling animation
 */
const GameBall = ({ 
  visible, 
  top = 50, 
  left = 50, 
  color = 'gold',
  size = 'md',
  showTrails = true
}: GameBallProps) => {
  const [opacity, setOpacity] = useState(visible ? 1 : 0);
  
  // Support both % and px values
  const normalizedTop = typeof top === 'number' 
    ? `${top}px` 
    : top;
  
  const normalizedLeft = typeof left === 'number' 
    ? `${left}px` 
    : left;
  
  // Update opacity when visibility changes
  useEffect(() => {
    if (visible) {
      setOpacity(1);
    } else {
      // Small delay for fade out animation
      const timer = setTimeout(() => {
        setOpacity(0);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  // Enhanced size classes with more consistent dimensions
  const sizeClasses = {
    sm: { width: '40px', height: '40px', border: '3px solid gold' },
    md: { width: '50px', height: '50px', border: '4px solid gold' },
    lg: { width: '65px', height: '65px', border: '5px solid gold' },
  }[size];
  
  // Enhanced color styles with improved gradients and lighting effects
  const colorStyles = {
    gold: {
      background: 'radial-gradient(circle at 30% 30%, white 5%, #FFC107 30%, #FF8800 70%, #FFC107 100%)',
      boxShadow: '0 0 40px 20px rgba(255, 193, 7, 0.8), inset 0 0 15px 5px rgba(255, 255, 255, 0.6)',
      border: '4px solid #ffdd00'
    },
    red: {
      background: 'radial-gradient(circle at 30% 30%, white 5%, #FF5252 30%, #FF0000 70%, #FF5252 100%)',
      boxShadow: '0 0 40px 20px rgba(255, 0, 0, 0.8), inset 0 0 15px 5px rgba(255, 255, 255, 0.6)',
      border: '4px solid #ffaa00'
    }
  }[color];
  
  if (!visible) return null;
  
  return (
    <>
      {/* Main ball with enhanced animation */}
      <div
        className="rolling-ball"
        style={{
          width: sizeClasses.width,
          height: sizeClasses.height,
          top: normalizedTop,
          left: normalizedLeft,
          opacity,
          position: 'absolute',
          borderRadius: '50%',
          zIndex: 200,
          animation: 'rolling-ball 0.4s linear infinite',
          transform: 'translate(-50%, -50%)',
          transition: 'top 0.2s ease-out, left 0.2s ease-out, opacity 0.3s ease',
          ...colorStyles
        }}
      />
      
      {/* Trail effects for more dynamic movement */}
      {showTrails && (
        <>
          {[...Array(3)].map((_, i) => (
            <div 
              key={`trail-${i}`}
              className="ball-trail" 
              style={{
                width: sizeClasses.width,
                height: sizeClasses.height,
                top: normalizedTop,
                left: normalizedLeft,
                opacity: (0.6 - (i * 0.15)) * opacity,
                animationDelay: `${i * 0.1}s`,
                position: 'absolute',
                borderRadius: '50%',
                zIndex: 199 - i,
                transition: 'top 0.2s ease-out, left 0.2s ease-out',
                transform: `translate(-50%, -50%) scale(${1 + (i * 0.3)})`,
              }}
            />
          ))}
        </>
      )}
    </>
  );
};

export default GameBall;
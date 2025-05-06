import { useEffect, useState } from 'react';

interface GameBallProps {
  visible: boolean;
  top?: number | string;
  left?: number | string;
  color?: 'gold' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A visual element representing the game ball
 * This is a simpler implementation designed to be more reliable
 */
const GameBall = ({ 
  visible, 
  top = 50, 
  left = 50, 
  color = 'gold',
  size = 'md'
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
  
  // Size classes to control ball dimensions
  const sizeClasses = {
    sm: { width: '50px', height: '50px', border: '3px solid gold' },
    md: { width: '70px', height: '70px', border: '5px solid gold' },
    lg: { width: '90px', height: '90px', border: '7px solid gold' },
  }[size];
  
  // Color styles based on the color prop
  const colorStyles = {
    gold: {
      background: 'radial-gradient(circle, white 20%, #FF8800 60%, gold 100%)',
      boxShadow: '0 0 40px 20px rgba(255, 136, 0, 0.9)',
      border: sizeClasses.border
    },
    red: {
      background: 'radial-gradient(circle, white 20%, #FF0000 60%, gold 100%)',
      boxShadow: '0 0 40px 20px rgba(255, 0, 0, 0.9)',
      border: sizeClasses.border
    }
  }[color];
  
  return (
    <div
      style={{
        position: 'absolute',
        width: sizeClasses.width,
        height: sizeClasses.height,
        top: normalizedTop,
        left: normalizedLeft,
        borderRadius: '50%',
        opacity,
        zIndex: 9999,
        transition: 'top 0.3s ease-out, left 0.3s ease-out, opacity 0.5s ease',
        transform: 'translate(-50%, -50%)',
        visibility: opacity === 0 ? 'hidden' : 'visible',
        filter: 'blur(0.5px)',
        animation: 'ball-pulse 0.5s infinite alternate',
        pointerEvents: 'none',
        ...colorStyles
      }}
    />
  );
};

export default GameBall;
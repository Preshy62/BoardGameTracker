import { useEffect, useState, useRef } from 'react';

interface CircuitBallProps {
  visible: boolean;
  boardRef: React.RefObject<HTMLDivElement>;
  color?: 'gold' | 'red';
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'medium' | 'fast';
}

/**
 * CircuitBall component that rolls around the perimeter of the game board
 * Creates a continuous animation around the board edge
 */
const CircuitBall = ({ 
  visible, 
  boardRef,
  color = 'gold',
  size = 'md',
  speed = 'medium'
}: CircuitBallProps) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [segment, setSegment] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  // Convert speed to milliseconds for a full circuit
  const speedValues = {
    slow: 18000, // 18 seconds
    medium: 12000, // 12 seconds
    fast: 8000, // 8 seconds
  };
  
  const duration = speedValues[speed];
  
  // Size classes for different ball sizes
  const sizeClasses = {
    sm: { width: '25px', height: '25px', borderWidth: '2px' },
    md: { width: '35px', height: '35px', borderWidth: '3px' },
    lg: { width: '45px', height: '45px', borderWidth: '4px' },
  }[size];
  
  // Enhanced color styles with improved gradients and lighting effects
  const colorStyles = {
    gold: {
      background: 'radial-gradient(circle at 30% 30%, white 5%, #FFC107 30%, #FF8800 70%, #FFC107 100%)',
      boxShadow: '0 0 20px 10px rgba(255, 193, 7, 0.6), inset 0 0 10px 5px rgba(255, 255, 255, 0.6)',
      border: `${sizeClasses.borderWidth} solid #ffdd00`
    },
    red: {
      background: 'radial-gradient(circle at 30% 30%, white 5%, #FF5252 30%, #FF0000 70%, #FF5252 100%)',
      boxShadow: '0 0 20px 10px rgba(255, 0, 0, 0.6), inset 0 0 10px 5px rgba(255, 255, 255, 0.6)',
      border: `${sizeClasses.borderWidth} solid #ffaa00`
    }
  }[color];

  // Effect to handle animation
  useEffect(() => {
    if (!visible || !boardRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setOpacity(0);
      return;
    }

    // Get board dimensions
    const boardRect = boardRef.current.getBoundingClientRect();
    const padding = 20; // Padding from board edge
    
    // Define the circuit path segments (perimeter of the board)
    const segments = [
      // Top edge (left to right)
      (progress: number) => ({
        top: padding,
        left: padding + progress * (boardRect.width - 2 * padding),
      }),
      // Right edge (top to bottom)
      (progress: number) => ({
        top: padding + progress * (boardRect.height - 2 * padding),
        left: boardRect.width - padding,
      }),
      // Bottom edge (right to left)
      (progress: number) => ({
        top: boardRect.height - padding,
        left: boardRect.width - padding - progress * (boardRect.width - 2 * padding),
      }),
      // Left edge (bottom to top)
      (progress: number) => ({
        top: boardRect.height - padding - progress * (boardRect.height - 2 * padding),
        left: padding,
      }),
    ];
    
    // Show the ball
    setOpacity(1);
    
    // Time when animation started
    const startTime = performance.now();
    
    // Animation function
    const animate = (currentTime: number) => {
      // Calculate how far along we are in the animation
      const elapsed = currentTime - startTime;
      const normalizedTime = (elapsed % duration) / duration;
      
      // Which segment are we in? (0-3)
      const currentSegment = Math.floor(normalizedTime * segments.length);
      setSegment(currentSegment);
      
      // Progress within this segment (0-1)
      const segmentProgress = (normalizedTime * segments.length) % 1;
      progressRef.current = segmentProgress;
      
      // Get position from current segment function
      const newPosition = segments[currentSegment](segmentProgress);
      setPosition(newPosition);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [visible, boardRef, duration]);
  
  // Determine rotation based on segment
  const getRotation = () => {
    switch (segment) {
      case 0: return '0deg'; // Moving right
      case 1: return '90deg'; // Moving down
      case 2: return '180deg'; // Moving left
      case 3: return '270deg'; // Moving up
      default: return '0deg';
    }
  };
  
  // Don't render if not visible
  if (opacity === 0) return null;
  
  return (
    <div
      className="circuit-ball"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: sizeClasses.width,
        height: sizeClasses.height,
        borderRadius: '50%',
        zIndex: 200,
        opacity,
        transform: `translate(-50%, -50%) rotate(${getRotation()})`,
        transition: 'opacity 0.3s ease',
        ...colorStyles,
        // Add spinning animation
        animation: 'spin-ball 0.5s linear infinite',
      }}
    />
  );
};

export default CircuitBall;
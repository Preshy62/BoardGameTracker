import { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  colors?: string[];
  numberOfPieces?: number;
  duration?: number;
}

const Confetti = ({
  active,
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
  numberOfPieces = 200,
  duration = 5000,
}: ConfettiProps) => {
  const [pieces, setPieces] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    if (!active) {
      // Clear confetti when deactivated
      setPieces([]);
      return;
    }

    // Create confetti pieces
    const newPieces = [...Array(numberOfPieces)].map((_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        id: i,
        style: {
          backgroundColor: color,
          width: `${Math.random() * 10 + 5}px`,
          height: `${Math.random() * 10 + 5}px`,
          left: `${Math.random() * 100}%`,
          top: `-10px`,
          animationDuration: `${Math.random() * 3 + 2}s`,
          animationDelay: `${Math.random() * 2}s`,
          opacity: Math.random() * 0.7 + 0.3,
          transform: `rotate(${Math.random() * 360}deg)`,
        },
      };
    });

    setPieces(newPieces);

    // Auto cleanup confetti after duration
    const timer = setTimeout(() => {
      if (active) setPieces([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, colors, numberOfPieces, duration]);

  if (!active && pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti absolute"
          style={piece.style}
        />
      ))}
    </div>
  );
};

export default Confetti;
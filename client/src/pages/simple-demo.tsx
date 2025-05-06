import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

// Demo stone component - very simplified for this demo
function SimpleStone({ number, isActive, onClick }: { number: number; isActive?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer rounded-md p-3 text-center font-bold transition-all
        ${isActive ? 'bg-yellow-500 text-black scale-110 shadow-lg z-10' : 'bg-slate-800 text-white'}
      `}
      style={{ width: '65px', height: '65px' }}
    >
      {number}
    </div>
  );
}

// Simple rolling ball component
function RollingBall({ position }: { position: { top: number; left: number } }) {
  return (
    <div 
      className="absolute rounded-full animate-pulse shadow-xl z-50"
      style={{
        width: '25px',
        height: '25px',
        backgroundColor: 'orange',
        border: '2px solid yellow',
        top: position.top,
        left: position.left,
        transition: 'all 0.5s ease',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

export default function SimpleDemoPage() {
  const [, setLocation] = useLocation();
  const [stones] = useState([
    { id: 1, number: 10 },
    { id: 2, number: 20 },
    { id: 3, number: 30 },
    { id: 4, number: 40 },
    { id: 5, number: 50 },
  ]);
  
  const [activeStone, setActiveStone] = useState<number | null>(null);
  const [showBall, setShowBall] = useState(false);
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  const [isRolling, setIsRolling] = useState(false);
  
  // Function to get stone position
  const getStonePosition = useCallback((id: number) => {
    const element = document.getElementById(`stone-${id}`);
    if (!element) return { top: 0, left: 0 };
    
    const rect = element.getBoundingClientRect();
    const containerRect = document.getElementById('simple-board')?.getBoundingClientRect();
    
    if (!containerRect) return { top: 0, left: 0 };
    
    // Return position relative to container, centered on the stone
    return {
      top: rect.top - containerRect.top + rect.height / 2,
      left: rect.left - containerRect.left + rect.width / 2
    };
  }, []);
  
  // Handle rolling animation
  const handleRoll = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setActiveStone(null);
    
    // Select a random stone as target
    const targetStoneId = Math.floor(Math.random() * stones.length) + 1;
    
    // Start from the first stone
    const firstStonePosition = getStonePosition(1);
    setBallPosition(firstStonePosition);
    setShowBall(true);
    
    // Move through all stones to the target
    let currentStone = 1;
    
    const moveToNextStone = () => {
      if (currentStone < stones.length) {
        currentStone += 1;
        const newPosition = getStonePosition(currentStone);
        setBallPosition(newPosition);
        setActiveStone(currentStone);
        
        setTimeout(moveToNextStone, 800); // Move every 800ms
      } else {
        // Finished moving
        setTimeout(() => {
          setShowBall(false);
          setIsRolling(false);
          // Keep the target stone highlighted
          setActiveStone(targetStoneId);
        }, 500);
      }
    };
    
    // Start the animation after a short delay
    setTimeout(moveToNextStone, 500);
  }, [getStonePosition, isRolling, stones.length]);
  
  // Handle stone click
  const handleStoneClick = (id: number) => {
    if (isRolling) return;
    
    // For demonstration, we'll animate to this stone
    setIsRolling(true);
    setActiveStone(null);
    
    // Start from stone 1
    const firstStonePosition = getStonePosition(1);
    setBallPosition(firstStonePosition);
    setShowBall(true);
    
    // Move through all stones to target
    let currentStone = 1;
    
    const moveToNextStone = () => {
      currentStone += 1;
      
      if (currentStone <= id) {
        const newPosition = getStonePosition(currentStone);
        setBallPosition(newPosition);
        setActiveStone(currentStone);
        
        // Continue moving
        setTimeout(moveToNextStone, 800);
      } else {
        // Finished moving
        setTimeout(() => {
          setShowBall(false);
          setIsRolling(false);
          setActiveStone(id);
        }, 500);
      }
    };
    
    // Start the animation after a short delay
    setTimeout(moveToNextStone, 500);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-primary text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Big Boys Game</h1>
            <span className="ml-2 px-2 py-1 bg-secondary text-primary text-xs font-bold rounded-full">SIMPLE DEMO</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Simple Ball Animation</h1>
          <Button onClick={() => setLocation('/demo')} variant="outline">Full Demo</Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Instructions:</h2>
          <p className="mb-4">This is a simplified demo showing only the ball animation. Click "Roll" to see the ball move through all stones, or click a specific stone to see the ball move to that stone.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div 
            id="simple-board"
            className="relative bg-slate-900 p-6 rounded-md flex justify-between items-center"
            style={{ minHeight: '150px' }}
          >
            {stones.map(stone => (
              <div key={stone.id} id={`stone-${stone.id}`} className="relative">
                <SimpleStone 
                  number={stone.number} 
                  isActive={activeStone === stone.id}
                  onClick={() => handleStoneClick(stone.id)}
                />
              </div>
            ))}
            
            {showBall && (
              <RollingBall position={ballPosition} />
            )}
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={handleRoll}
              disabled={isRolling}
              className="bg-primary text-white px-8 py-3 text-lg font-bold"
            >
              {isRolling ? 'Rolling...' : 'Roll'}
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-lg font-medium mb-4">This simplified demo shows only the core ball animation mechanics.</p>
          <Button onClick={() => setLocation('/demo')} className="bg-secondary text-primary font-bold">
            Go to Full Demo
          </Button>
        </div>
      </main>
    </div>
  );
}

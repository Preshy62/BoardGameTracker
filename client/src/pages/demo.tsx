import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/Header";
import GameBoardDemo from "@/components/GameBoardDemo";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function Demo() {
  const [, setLocation] = useLocation();
  
  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  // Stone number for demo rolling
  const [rollingStoneNumber, setRollingStoneNumber] = useState<number | null>(null);
  
  // Handle if user is not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      setLocation('/auth');
    }
  }, [user, isUserLoading, setLocation]);
  
  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }
  
  // Define special stones
  const specialStones = [1000, 500, 3355, 6624];
  
  // Handle rolling stone for demo
  const handleRoll = () => {
    // Play roll sound
    try {
      const audio = new Audio();
      audio.src = '/rolling-dice.mp3';
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    // ALWAYS use a special stone for better visual impact
    const randomIndex = Math.floor(Math.random() * specialStones.length);
    const stoneNumber = specialStones[randomIndex];
    console.log("🎲 Rolling stone:", stoneNumber);
    setRollingStoneNumber(stoneNumber);
    
    // Reset after 8 seconds to give enough time to see the animation
    setTimeout(() => {
      setRollingStoneNumber(null);
    }, 8000);
  };
  
  // Function to test a specific stone number
  const testSpecificStone = (number: number) => {
    try {
      const audio = new Audio();
      audio.src = '/rolling-dice.mp3';
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    console.log("🎲 Testing specific stone:", number);
    setRollingStoneNumber(number);
    
    // Reset after 8 seconds
    setTimeout(() => {
      setRollingStoneNumber(null);
    }, 8000);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow flex flex-col">
        <div className="max-w-4xl mx-auto w-full p-4">
          <h1 className="text-2xl font-bold mb-4">Game Board Animation Demo</h1>
          <p className="mb-4">This page demonstrates the enhanced winner animation with dramatic effects. Click the Roll button to see the animation in action, or choose a specific stone below to test.</p>
          <p className="mb-4 bg-yellow-100 p-2 rounded-md border border-yellow-300 text-yellow-800">
            <span className="font-bold">New Features:</span> Enhanced winner animation with color-cycling effects, dramatic pulsing glow, and animated winner overlay announcement!
          </p>
          
          <div className="flex flex-col items-start mb-6">
            <button 
              onClick={handleRoll}
              disabled={rollingStoneNumber !== null}
              className="bg-primary text-white px-4 py-2 rounded-md mb-2 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rollingStoneNumber !== null ? "Rolling..." : "Roll Stone"}
            </button>
            
            {/* Test buttons for specific special stones */}
            {rollingStoneNumber === null && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-sm font-semibold mr-2 self-center">Test specific stones:</span>
                {specialStones.map(stoneNumber => (
                  <button 
                    key={stoneNumber}
                    onClick={() => testSpecificStone(stoneNumber)}
                    className="bg-secondary text-primary px-3 py-1 text-sm rounded hover:bg-amber-400"
                  >
                    {stoneNumber}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-grow">
          <GameBoardDemo rollingStoneNumber={rollingStoneNumber} />
        </div>
      </main>
    </div>
  );
}
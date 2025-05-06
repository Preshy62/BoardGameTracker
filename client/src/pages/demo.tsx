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
    
    // Set rolling stone number (randomly from a list of stone numbers)
    const stoneNumbers = [1000, 500, 29, 40, 32, 81, 7, 13, 64, 101, 4, 3355, 65, 12, 22, 9, 6624, 44];
    const randomIndex = Math.floor(Math.random() * stoneNumbers.length);
    setRollingStoneNumber(stoneNumbers[randomIndex]);
    
    // Reset after 5 seconds so we can roll again
    setTimeout(() => {
      setRollingStoneNumber(null);
    }, 5000);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow flex flex-col">
        <div className="max-w-4xl mx-auto w-full p-4">
          <h1 className="text-2xl font-bold mb-4">Game Board Demo</h1>
          <p className="mb-4">This page demonstrates the ball rolling animation in isolation. Click the Roll button to see it in action.</p>
          
          <button 
            onClick={handleRoll}
            disabled={rollingStoneNumber !== null}
            className="bg-primary text-white px-4 py-2 rounded-md mb-6 hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rollingStoneNumber !== null ? "Rolling..." : "Roll Stone"}
          </button>
        </div>
        
        <div className="flex-grow">
          <GameBoardDemo rollingStoneNumber={rollingStoneNumber} />
        </div>
      </main>
    </div>
  );
}
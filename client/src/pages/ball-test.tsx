import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function BallTest() {
  const [, setLocation] = useLocation();
  const [showBall, setShowBall] = useState(false);
  const [useEnhancedAnimation, setUseEnhancedAnimation] = useState(false);
  const [ballPosition, setBallPosition] = useState({ top: 50, left: 50 });
  const [isBoardShaking, setIsBoardShaking] = useState(false);

  // Custom styling for this test page
  useEffect(() => {
    document.documentElement.style.setProperty('--ball-top', '50%');
    document.documentElement.style.setProperty('--ball-left', '50%');
    
    if (useEnhancedAnimation) {
      document.documentElement.classList.add('specific-game-animation');
    } else {
      document.documentElement.classList.remove('specific-game-animation');
    }
    
    return () => {
      document.documentElement.classList.remove('specific-game-animation');
    };
  }, [useEnhancedAnimation]);
  
  // Function to update ball position via CSS variables
  const moveBall = (top: number, left: number) => {
    document.documentElement.style.setProperty('--ball-top', `${top}%`);
    document.documentElement.style.setProperty('--ball-left', `${left}%`);
    setBallPosition({ top, left });
  };

  // Function to animate the ball in a path
  const animateBall = async () => {
    setShowBall(true);
    setIsBoardShaking(true);
    
    // Define a path around the board to follow
    const animationPath = [
      { top: 20, left: 20 },
      { top: 20, left: 80 },
      { top: 50, left: 50 },
      { top: 80, left: 80 },
      { top: 80, left: 20 },
      { top: 50, left: 50 }
    ];
    
    // Animate through each point in the path
    for (const position of animationPath) {
      moveBall(position.top, position.left);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setIsBoardShaking(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-primary text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Ball Animation Test</h1>
            <span className="ml-2 px-2 py-1 bg-secondary text-primary text-xs font-bold rounded-full">TEST PAGE</span>
          </div>
          <Button 
            onClick={() => setLocation('/')} 
            className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
          >
            Home
          </Button>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Ball Animation Test Page</h2>
          <p className="text-gray-600 mb-4">This page tests the visibility of the rolling ball animation.</p>
          
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={() => setShowBall(!showBall)}
              variant={showBall ? "default" : "outline"}
            >
              {showBall ? "Hide Ball" : "Show Ball"}
            </Button>
            
            <Button 
              onClick={() => setUseEnhancedAnimation(!useEnhancedAnimation)}
              variant={useEnhancedAnimation ? "default" : "outline"}
            >
              {useEnhancedAnimation ? "Using Enhanced Animation" : "Use Enhanced Animation"}
            </Button>
            
            <Button 
              onClick={animateBall}
              variant="secondary"
            >
              Animate Ball
            </Button>
            
            <Button 
              onClick={() => {
                setIsBoardShaking(true);
                setTimeout(() => setIsBoardShaking(false), 1500);
              }}
              variant="outline"
            >
              Shake Board
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-2">Ball Position Controls</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Button onClick={() => moveBall(20, 20)} size="sm">Top Left</Button>
                <Button onClick={() => moveBall(20, 50)} size="sm">Top</Button>
                <Button onClick={() => moveBall(20, 80)} size="sm">Top Right</Button>
                
                <Button onClick={() => moveBall(50, 20)} size="sm">Left</Button>
                <Button onClick={() => moveBall(50, 50)} size="sm">Center</Button>
                <Button onClick={() => moveBall(50, 80)} size="sm">Right</Button>
                
                <Button onClick={() => moveBall(80, 20)} size="sm">Bottom Left</Button>
                <Button onClick={() => moveBall(80, 50)} size="sm">Bottom</Button>
                <Button onClick={() => moveBall(80, 80)} size="sm">Bottom Right</Button>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Current position: {ballPosition.top}% top, {ballPosition.left}% left</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="text-sm bg-yellow-100 p-4 rounded-md border border-yellow-300">
                <h3 className="font-bold">Animation Debugging Tips:</h3>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>If the ball is not visible, try toggling "Use Enhanced Animation"</li>
                  <li>Check browser console for any CSS or animation errors</li>
                  <li>The animate button will show a sequence of movements</li>
                  <li>Try visiting /game/1 and /game/2 for the full game demos</li>
                </ul>
              </div>
              
              <div className="text-sm bg-blue-100 p-4 rounded-md border border-blue-300">
                <h3 className="font-bold">CSS Variables:</h3>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
{`--ball-top: ${ballPosition.top}%;
--ball-left: ${ballPosition.left}%;
animation: ${useEnhancedAnimation ? 'enhanced-ball-pulse' : 'none'};`}
                </pre>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <div 
            className={`relative bg-primary-light border-4 ${useEnhancedAnimation ? 'border-yellow-500' : 'border-gray-700'} rounded-lg p-8 h-96 ${isBoardShaking ? 'shaking-board' : ''}`}
          >
            <div id="ball-test-board" className={`relative w-full h-full ${useEnhancedAnimation ? 'board-enhanced' : ''}`}>
              {/* Test stones at corners and center */}
              <div className="absolute top-0 left-0 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
                TL
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
                TR
              </div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
                BL
              </div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
                BR
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-white font-bold">
                C
              </div>
              
              {/* The ball element */}
              {showBall && (
                <div className={`ball-element ${useEnhancedAnimation ? 'ball-test-animation' : ''}`}></div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => setLocation('/game/2')}
              variant="outline"
              className="mr-2"
            >
              Go to Game #2
            </Button>
            <Button 
              onClick={() => setLocation('/game/1')}
              variant="outline"
            >
              Go to Game #1
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
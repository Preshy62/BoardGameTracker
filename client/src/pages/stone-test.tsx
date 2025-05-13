import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { playSoundByKey, preloadSounds, setSoundEnabled, SOUND_FILES } from '@/lib/sounds';
import DemoGameStone from '@/components/game/DemoGameStone';

// Sample stone configurations
const STONE_SAMPLES = [
  { number: 100, isSpecial: false, isSuper: false, description: "Regular Stone" },
  { number: 500, isSpecial: true, isSuper: false, description: "Special Stone" },
  { number: 1000, isSpecial: true, isSuper: false, description: "Special Stone" },
  { number: 3355, isSpecial: false, isSuper: true, description: "Super Stone" },
  { number: 6624, isSpecial: false, isSuper: true, description: "Super Stone" },
];

export default function StoneTestPage() {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [volume, setVolume] = useState(50);  
  const [activeStone, setActiveStone] = useState<number | null>(null);
  const [winningStone, setWinningStone] = useState<number | null>(null);
  
  // Preload sounds when the page loads
  useEffect(() => {
    // Preload the game sounds
    preloadSounds();
    
    // Set initial sound enabled state
    setSoundEnabled(soundEnabled);
  }, []);
  
  // Update sound settings when controls change
  useEffect(() => {
    setSoundEnabled(soundEnabled);
  }, [soundEnabled]);
  
  // Handle sound toggle
  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabledState(checked);
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };
  
  // Trigger a rolling animation for a stone
  const rollStone = (number: number) => {
    setActiveStone(number);
    
    // Reset after animation completes (approximately 2 seconds)
    setTimeout(() => {
      setActiveStone(null);
    }, 2000);
  };
  
  // Set a stone as the winner
  const setWinner = (number: number) => {
    // Toggle winning state
    setWinningStone(winningStone === number ? null : number);
    
    // Play a sound when setting a winner
    if (winningStone !== number) {
      playSoundByKey('SUCCESS', volume / 100);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Stone Component Testing</h1>
      
      <Tabs defaultValue="demo">
        <TabsList className="mb-6">
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="settings">Sound Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STONE_SAMPLES.map((stone) => (
              <div key={stone.number} className="p-6 border rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-2">{stone.description}</h3>
                <p className="text-sm text-gray-500 mb-4">Value: {stone.number}</p>
                
                <div className="flex justify-center mb-6">
                  <DemoGameStone 
                    number={stone.number}
                    isSpecial={stone.isSpecial}
                    isSuper={stone.isSuper}
                    isRolling={activeStone === stone.number}
                    isWinner={winningStone === stone.number}
                    size="lg"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => rollStone(stone.number)}
                    disabled={activeStone === stone.number}
                  >
                    Roll Animation
                  </Button>
                  
                  <Button 
                    variant={winningStone === stone.number ? "secondary" : "outline"}
                    onClick={() => setWinner(stone.number)}
                  >
                    {winningStone === stone.number ? "Remove Winner" : "Set as Winner"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
            <div className="flex gap-6 items-center justify-center">
              <div className="flex flex-col items-center">
                <DemoGameStone number={100} size="sm" />
                <p className="mt-2 text-sm">Small</p>
              </div>
              <div className="flex flex-col items-center">
                <DemoGameStone number={200} size="md" />
                <p className="mt-2 text-sm">Medium</p>
              </div>
              <div className="flex flex-col items-center">
                <DemoGameStone number={300} size="lg" />
                <p className="mt-2 text-sm">Large</p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="space-y-6 max-w-md mx-auto p-6 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-toggle" className="text-base font-medium">
                Sound Effects
              </Label>
              <Switch 
                id="sound-toggle" 
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="volume-slider" className="text-base font-medium">
                  Volume: {volume}%
                </Label>
              </div>
              <Slider
                id="volume-slider"
                disabled={!soundEnabled}
                value={[volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={100}
                step={1}
              />
            </div>
            
            <div className="pt-4 space-y-2">
              <h3 className="font-medium mb-2">Test Sounds</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!soundEnabled}
                  onClick={() => playSoundByKey('CLICK', volume / 100)}
                >
                  Click
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!soundEnabled}
                  onClick={() => playSoundByKey('ROLLING_DICE', volume / 100)}
                >
                  Rolling Dice
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!soundEnabled}
                  onClick={() => playSoundByKey('DICE_LANDING', volume / 100)}
                >
                  Dice Landing
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!soundEnabled}
                  onClick={() => playSoundByKey('NOTIFICATION', volume / 100)}
                >
                  Notification
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 text-center">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>
    </div>
  );
}
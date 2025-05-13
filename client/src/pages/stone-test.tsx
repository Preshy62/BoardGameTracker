import { useState } from "react";
import { Button } from "@/components/ui/button";
import GameStone from "@/components/game/GameStone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Gift, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { playSound, playWinSound } from "@/lib/sounds";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StoneTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStoneValue, setSelectedStoneValue] = useState<number>(500);
  const [isRolling, setIsRolling] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [stoneSize, setStoneSize] = useState<'sm' | 'md' | 'lg'>('md');
  
  // Available stone values in the game
  const stoneValues = [
    100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 
    1100, 1200, 1300, 1400, 1500, 3355, 6624
  ];
  
  // Handle stone roll completion
  const handleRollComplete = (number: number) => {
    setIsRolling(false);
    
    // Show toast to indicate roll completed
    toast({
      title: `Stone Rolled: ${number}`,
      description: isWinner ? "Winner! 🎉" : "Better luck next time!",
      variant: isWinner ? "default" : "destructive",
    });
    
    // Play win sound if it's a winner
    if (isWinner) {
      playWinSound();
    }
  };
  
  // Start rolling animation
  const startRolling = () => {
    setIsRolling(true);
    playSound('CLICK', 0.3);
  };
  
  // Toggle winner state
  const toggleWinner = () => {
    setIsWinner(prev => !prev);
    playSound('CLICK', 0.3);
  };
  
  // Handle stone value change
  const handleStoneValueChange = (value: string) => {
    setSelectedStoneValue(Number(value));
    playSound('CLICK', 0.3);
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Game Stone Testing</CardTitle>
              <CardDescription>
                Test the game stone animations and visual effects
              </CardDescription>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stone Display Settings</DialogTitle>
                  <DialogDescription>
                    Customize how game stones appear in the test environment
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm">Stone Size:</span>
                    <div className="col-span-3">
                      <Tabs
                        defaultValue={stoneSize}
                        className="w-full"
                        onValueChange={(value) => setStoneSize(value as 'sm' | 'md' | 'lg')}
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="sm">Small</TabsTrigger>
                          <TabsTrigger value="md">Medium</TabsTrigger>
                          <TabsTrigger value="lg">Large</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm">Display Label:</span>
                    <div className="col-span-3">
                      <Tabs defaultValue="yes" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="yes">Yes</TabsTrigger>
                          <TabsTrigger value="no">No</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-2">Controls</h3>
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="stoneValue" className="text-xs text-slate-500 mb-1 block">
                  Stone Value
                </label>
                <Select
                  value={selectedStoneValue.toString()}
                  onValueChange={handleStoneValueChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a stone value" />
                  </SelectTrigger>
                  <SelectContent>
                    {stoneValues.map(value => (
                      <SelectItem key={value} value={value.toString()}>
                        {value === 500 || value === 1000 ? `${value} (Special)` : 
                         value === 3355 || value === 6624 ? `${value} (Super)` : 
                         value.toString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Winner Status
                </label>
                <Button 
                  variant={isWinner ? "default" : "outline"} 
                  className="w-full"
                  onClick={toggleWinner}
                >
                  {isWinner ? "Winner 🏆" : "Not a Winner"}
                </Button>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  Roll Stone
                </label>
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={startRolling}
                  disabled={isRolling}
                >
                  {isRolling ? "Rolling..." : "Roll Stone"}
                </Button>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid place-items-center py-10 bg-slate-50 rounded-lg border">
            <GameStone
              number={selectedStoneValue}
              isWinner={isWinner}
              isRolling={isRolling}
              isUserTurn={true}
              onRollComplete={handleRollComplete}
              size={stoneSize}
              showLabel={true}
            />
          </div>
          
          <Separator />
          
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span>All Stone Types</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {/* Regular stones */}
              {[100, 200, 300, 400].map(value => (
                <GameStone 
                  key={value} 
                  number={value} 
                  size="sm"
                  showLabel={false}
                />
              ))}
              
              {/* Special stones */}
              <GameStone 
                number={500} 
                size="sm"
                showLabel={false}
              />
              
              <GameStone 
                number={1000} 
                size="sm"
                showLabel={false}
              />
              
              {/* Super stones */}
              <GameStone 
                number={3355} 
                size="sm"
                showLabel={false}
              />
              
              <GameStone 
                number={6624} 
                size="sm"
                showLabel={false}
              />
              
              {/* Winner stone */}
              <GameStone 
                number={1000} 
                isWinner={true}
                size="sm"
                showLabel={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
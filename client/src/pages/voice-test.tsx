import { useState } from "react";
import { Button } from "@/components/ui/button";
import VoiceChat from "@/components/game/VoiceChat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Check, Crown, Music, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { playSound, playWinSound, playRandomTone, SOUND_EFFECTS } from "@/lib/sounds";

export default function VoiceTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStake, setCurrentStake] = useState(50000); // Default to premium game
  
  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Voice Chat Testing</CardTitle>
            <CardDescription>
              Please log in to test the voice chat functionality
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  // Create a mock game object for testing that matches Game type
  const mockGame = {
    id: 999,
    createdAt: new Date(),
    status: "in_progress" as "waiting" | "in_progress" | "completed", // Match enum
    stake: currentStake,
    commissionPercentage: 0.05,
    currency: "NGN",
    maxPlayers: 4,
    creatorId: user.id,
    voiceChatEnabled: true,
    winningNumber: null,
    // Add required fields
    endedAt: null,
    winnerIds: [],
    language: "en",
    isPrivate: false,
    region: "NG"
  } as any; // Use type assertion since we're just testing
  
  // Create mock players
  const mockPlayers = [
    {
      id: user.id,
      user: {
        username: user.username,
        avatarInitials: user.avatarInitials || "TS"
      }
    }
  ];
  
  const toggleStakeLevel = () => {
    if (currentStake === 50000) {
      setCurrentStake(20000);
      toast({
        title: "Switched to High Stakes Game",
        description: "Voice chat enabled with standard interface",
      });
    } else if (currentStake === 20000) {
      setCurrentStake(10000);
      toast({
        title: "Switched to Standard Game",
        description: "Voice chat disabled for standard games",
      });
    } else {
      setCurrentStake(50000);
      toast({
        title: "Switched to Premium Game",
        description: "Voice chat enabled with premium interface",
        className: "bg-amber-50 border-amber-200 text-amber-800",
      });
    }
  };
  
  return (
    <div className="container max-w-5xl mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Voice Chat Testing Environment</CardTitle>
              <CardDescription>
                Test the voice chat component in different game stake levels
              </CardDescription>
            </div>
            <Button onClick={toggleStakeLevel} variant="outline" className="flex gap-2 items-center">
              {currentStake >= 50000 && <Crown className="h-4 w-4 text-amber-500" />}
              <span>
                {currentStake >= 50000 
                  ? "Premium Game (₦50,000+)" 
                  : currentStake >= 20000 
                    ? "High Stakes Game (₦20,000+)" 
                    : "Standard Game (₦10,000)"}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-2">Current Settings</h3>
            <ul className="space-y-1">
              <li className="text-sm flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-slate-700">Stake Amount: ₦{currentStake.toLocaleString()}</span>
              </li>
              <li className="text-sm flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-slate-700">Voice Chat Enabled: {currentStake >= 20000 ? "Yes" : "No"}</span>
              </li>
              <li className="text-sm flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-slate-700">Interface Style: {currentStake >= 50000 ? "Premium" : "Standard"}</span>
              </li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="text-sm font-medium mb-4">Voice Chat Component</h3>
            
            <VoiceChat
              game={mockGame}
              players={mockPlayers as any}
              currentUserId={user.id}
            />
          </div>
          
          <Separator />
          
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Music className="h-4 w-4 text-primary" />
              <span>Sound Effects Testing</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => playSound('VOICE_CONNECTED')}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Connected</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => playSound('VOICE_MUTE')}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Mute</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => playSound('VOICE_UNMUTE')}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Unmute</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => playSound('STONE_ROLL')}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Stone Roll</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => playSound('STONE_LAND')}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Stone Land</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => playWinSound()}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Win Sound</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 col-span-2 sm:col-span-3"
                onClick={() => {
                  for (let i = 0; i < 5; i++) {
                    setTimeout(() => playRandomTone(), i * 200);
                  }
                }}
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Random Tones</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Mic, MicOff, Volume2, Radio, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DemoVoiceChatProps {
  stakeAmount?: number;
  demo?: boolean;
  className?: string;
}

const DemoVoiceChat = ({ 
  stakeAmount = 50000, 
  demo = true,
  className = ''
}: DemoVoiceChatProps) => {
  // Voice chat state
  const [isMuted, setIsMuted] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected'>('connected');
  const [playerCount, setPlayerCount] = useState(2);
  const { toast } = useToast();
  
  // Determine if this is a high stakes game (for premium UI)
  const isHighStakesGame = stakeAmount >= 50000;
  
  // Demo effect to show changing player count
  useEffect(() => {
    if (demo) {
      const interval = setInterval(() => {
        // Randomly change player count between 2-4 for effect
        setPlayerCount(Math.floor(Math.random() * 3) + 2);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [demo]);
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Show toast notification
    toast({
      title: isMuted ? "Microphone Activated" : "Microphone Muted",
      description: isMuted 
        ? "Other players can now hear you speaking." 
        : "You have muted your microphone.",
      variant: "default", // Using only 'default' variant
    });
  };
  
  return (
    <Card className={`voice-chat-card mb-4 border-primary/20 shadow-sm ${className}`}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Radio className={`h-5 w-5 ${connectionStatus === 'connected' ? 'text-green-500 animate-pulse' : 'text-amber-500'}`} />
            <CardTitle className="text-sm font-semibold">
              Voice Chat 
              {isHighStakesGame && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-200">
                        <Unlock className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Premium voice chat available for high-stakes games (₦50,000+)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
          </div>
          
          <Badge variant="outline" className={`text-xs ${connectionStatus === 'connected' ? 'bg-green-100 text-green-700' : ''}`}>
            {connectionStatus === 'connected' ? `${playerCount} players online` : 'Connecting...'}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {isHighStakesGame 
            ? "Full voice chat enabled for this high-stakes game" 
            : "Basic voice chat available for this game"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2 pt-0">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[volumeLevel]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setVolumeLevel(value[0])}
            className="w-full"
          />
          <span className="text-xs text-muted-foreground w-6">{volumeLevel}%</span>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Demo User</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <span className="text-xs text-muted-foreground">Player 2</span>
          </div>
          {playerCount > 2 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span className="text-xs text-muted-foreground">Player 3</span>
            </div>
          )}
          {playerCount > 3 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
              <span className="text-xs text-muted-foreground">Player 4</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 pb-3">
        <Button 
          onClick={toggleMute}
          variant={isMuted ? "outline" : "secondary"}
          size="sm"
          className={`w-full flex items-center justify-center ${!isMuted ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
          disabled={connectionStatus !== 'connected'}
        >
          {isMuted ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              <span>Unmute Microphone</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              <span>Mute Microphone</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DemoVoiceChat;
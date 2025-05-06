import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Mic, MicOff, AlertTriangle, Lock, Unlock, Radio } from "lucide-react";
import { Game } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface VoiceChatProps {
  game: Game;
  isEnabled: boolean;
  currentUserId: number;
}

const VoiceChat = ({ game, isEnabled, currentUserId }: VoiceChatProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [playerCount, setPlayerCount] = useState(0);
  const { toast } = useToast();
  
  // Check if game is high stakes (over ₦50,000)
  const isHighStakesGame = game && game.stake >= 50000;
  const isModerateStakesGame = game && game.stake >= 20000 && game.stake < 50000;
  
  // Do not render anything if not a high/moderate stakes game or not enabled
  if ((!isHighStakesGame && !isModerateStakesGame) || !isEnabled) {
    return null;
  }

  // Simulate connection status for demonstration purposes
  useEffect(() => {
    if (isEnabled) {
      setConnectionStatus('connecting');
      const timer = setTimeout(() => {
        setConnectionStatus('connected');
        setPlayerCount(Math.floor(Math.random() * 3) + 1); // Simulate 1-3 other players
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isEnabled]);
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Show toast notification
    toast({
      title: isMuted ? "Microphone Activated" : "Microphone Muted",
      description: isMuted 
        ? "Other players can now hear you speaking." 
        : "You have muted your microphone.",
      variant: "default", // Using only 'default' variant to avoid TypeScript errors
    });
  };
  
  return (
    <Card className="voice-chat-card mb-4 border-primary/20 shadow-sm">
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

export default VoiceChat;
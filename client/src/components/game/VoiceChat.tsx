import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { Game } from "@shared/schema";

interface VoiceChatProps {
  game: Game;
  isEnabled: boolean;
  currentUserId: number;
}

// Simplified Voice Chat component (placeholder for now)
const VoiceChat = ({ game, isEnabled }: VoiceChatProps) => {
  const [isMuted, setIsMuted] = useState(true);
  
  // Check if game is high stakes (over ₦50,000)
  const isHighStakesGame = game && game.stake >= 50000;
  
  // Do not render anything if not a high stakes game or not enabled
  if (!isHighStakesGame || !isEnabled) {
    return null;
  }
  
  return (
    <div className="voice-chat-controls p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isMuted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
          <span className="text-sm font-medium">Voice Chat</span>
        </div>
        
        <Button 
          onClick={() => setIsMuted(!isMuted)}
          variant="outline" 
          size="sm"
          className={`flex items-center ${!isMuted ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
        >
          {isMuted ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              <span>Unmute</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              <span>Mute</span>
            </>
          )}
        </Button>
      </div>
      
      <div className="mt-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
        <p>Voice chat is currently in development. This feature will be available soon.</p>
      </div>
    </div>
  );
};

export default VoiceChat;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Users } from "lucide-react";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Game } from "@shared/schema";

interface VoiceChatProps {
  game: Game;
  players: { user: { username: string; avatarInitials: string }, id: number }[];
  currentUserId: number;
}

export default function VoiceChat({ game, players, currentUserId }: VoiceChatProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  
  const {
    isJoined,
    isMuted,
    remoteUsers,
    audioLevel,
    remoteAudioLevels,
    joinChannel,
    leaveChannel,
    toggleMute,
    isSupported,
  } = useVoiceChat();
  
  // Check if voice chat should be enabled based on stake amount or explicit flag
  const HIGH_STAKES_THRESHOLD = 20000;
  const PREMIUM_STAKES_THRESHOLD = 50000;
  const isVoiceChatEligible = game.stake >= HIGH_STAKES_THRESHOLD || game.voiceChatEnabled === true;
  const isPremiumGame = game.stake >= PREMIUM_STAKES_THRESHOLD;
  
  // Join voice channel when component mounts if eligible
  useEffect(() => {
    // Only enable voice chat for higher stakes
    if (!isVoiceChatEligible) return;
    
    // Generate channel name from game ID
    const channelName = `game-${game.id}`;
    
    if (game.status === "in_progress" && !isJoined) {
      joinChannel({ 
        channelName,
        uid: currentUserId.toString()
      });
    }
    
    return () => {
      // Leave channel when component unmounts
      if (isJoined) {
        leaveChannel();
      }
    };
  }, [game.id, game.status, isJoined, isVoiceChatEligible]);
  
  // For lower stake games, don't show voice chat
  if (!isVoiceChatEligible) {
    return null;
  }
  
  if (!isSupported()) {
    return (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm">
        <p className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          Voice chat is available for this game, but your browser doesn't support it. Try using Chrome, Firefox or Edge.
        </p>
      </div>
    );
  }
  
  return (
    <div className="mt-4 relative">
      <div className="bg-slate-50 rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-primary" />
            <h3 className="font-medium text-sm">Voice Chat</h3>
            {isJoined && (
              <Badge variant="outline" className="ml-2 text-xs">
                Connected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isJoined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <MicOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMuted ? "Unmute microphone" : "Mute microphone"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setShowVoiceChat(!showVoiceChat)}
            >
              {showVoiceChat ? "Hide" : "Show"} Details
            </Button>
          </div>
        </div>
        
        {showVoiceChat && (
          <div className="space-y-3 pt-2 border-t">
            {/* Your voice indicator */}
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white text-xs">
                  YOU
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">You {isMuted ? "(Muted)" : ""}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${isMuted ? "bg-gray-400" : "bg-primary"}`}
                    style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Other players */}
            {remoteUsers.map((user) => {
              // Find player info based on user ID
              const playerId = Number(user.uid);
              const playerInfo = players.find(p => p.id === playerId);
              const audioLevel = remoteAudioLevels[user.uid as string] || 0;
              
              return (
                <div key={user.uid} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {playerInfo?.user.avatarInitials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">
                        {playerInfo?.user.username || `Player ${playerId}`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-100"
                        style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {remoteUsers.length === 0 && isJoined && (
              <p className="text-xs text-gray-500 py-2">
                No other players in voice chat yet.
              </p>
            )}
            
            {!isJoined && (
              <Button
                size="sm"
                onClick={async () => {
                  setIsLoading(true);
                  await joinChannel({ channelName: `game-${game.id}`, uid: currentUserId.toString() });
                  setIsLoading(false);
                }}
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? "Connecting..." : "Join Voice Chat"}
              </Button>
            )}
          </div>
        )}
        
        {!showVoiceChat && isJoined && (
          <p className="text-xs text-gray-500">
            Voice chat is {isMuted ? "muted" : "active"}. {remoteUsers.length} other {remoteUsers.length === 1 ? "player" : "players"} connected.
          </p>
        )}
        
        {!showVoiceChat && !isJoined && (
          <p className="text-xs text-gray-500">
            Voice chat is available for this high-stakes game. Click "Show Details" to join.
          </p>
        )}
      </div>
    </div>
  );
}
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
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  
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
  
  // Auto-join for premium games
  useEffect(() => {
    // Only enable voice chat for eligible games and don't retry if already attempted
    if (!isVoiceChatEligible || autoJoinAttempted) return;
    
    // Generate channel name from game ID
    const channelName = `game-${game.id}`;
    
    const attemptAutoJoin = async () => {
      // Auto-join for premium games
      if (isPremiumGame && game.status === "in_progress" && !isJoined) {
        try {
          setIsLoading(true);
          await joinChannel({ 
            channelName,
            uid: currentUserId.toString()
          });
          setShowVoiceChat(true); // Auto-expand voice chat section
        } catch (error) {
          console.error("Auto-join voice chat failed:", error);
        } finally {
          setIsLoading(false);
          setAutoJoinAttempted(true);
        }
      }
    };
    
    // Attempt to auto-join after a short delay to allow other components to initialize
    const timer = setTimeout(attemptAutoJoin, 1500);
    
    return () => {
      clearTimeout(timer);
      // Leave channel when component unmounts
      if (isJoined) {
        leaveChannel();
      }
    };
  }, [game.id, game.status, isPremiumGame, isVoiceChatEligible, isJoined, autoJoinAttempted, joinChannel, leaveChannel, currentUserId]);
  
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
      <div className={`${
        isPremiumGame 
          ? "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 shadow-md relative after:absolute after:inset-0 after:rounded-lg after:border-2 after:border-amber-300 after:animate-pulse after:opacity-70 after:pointer-events-none" 
          : "bg-slate-50"
        } rounded-lg p-4 border`}>
        {isPremiumGame && (
          <div className="absolute -top-3 -right-2 z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-300 to-amber-400 text-amber-900 border border-amber-400 shadow-md animate-[bounce_2s_ease-in-out_infinite]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
              </svg>
              Premium Voice
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Users className={`h-4 w-4 mr-2 ${isPremiumGame ? "text-amber-500" : "text-primary"}`} />
            <h3 className={`font-medium text-sm ${isPremiumGame ? "text-amber-700" : ""}`}>
              {isPremiumGame ? "Premium Voice Chat" : "Voice Chat"}
            </h3>
            {isJoined && (
              <Badge 
                variant={isPremiumGame ? "default" : "outline"} 
                className={`ml-2 text-xs ${isPremiumGame ? "bg-amber-200 text-amber-800 hover:bg-amber-300" : ""}`}
              >
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
                      variant={isPremiumGame ? "default" : "outline"}
                      size="icon"
                      className={`h-8 w-8 ${isPremiumGame 
                        ? (isMuted 
                          ? "bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600" 
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200") 
                        : ""}`}
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <MicOff className={`h-4 w-4 ${isPremiumGame ? "text-red-500" : "text-red-500"}`} />
                      ) : (
                        <Mic className={`h-4 w-4 ${isPremiumGame ? "text-amber-700" : ""}`} />
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
              variant={isPremiumGame ? "default" : "outline"}
              size="sm"
              className={`text-xs h-8 ${isPremiumGame 
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                : ""}`}
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
              <Avatar className={`h-8 w-8 ${isPremiumGame ? "ring-2 ring-amber-300 ring-offset-1" : ""}`}>
                <AvatarFallback className={`text-xs ${isPremiumGame 
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white" 
                  : "bg-primary text-white"}`}
                >
                  YOU
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">You {isMuted ? "(Muted)" : ""}</span>
                </div>
                <div className={`h-1.5 w-full ${isPremiumGame ? "bg-amber-100" : "bg-gray-200"} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      isMuted 
                        ? "bg-gray-400" 
                        : isPremiumGame
                          ? "bg-gradient-to-r from-amber-400 to-amber-500"
                          : "bg-primary"
                    }`}
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
                  <Avatar className={`h-8 w-8 ${isPremiumGame ? "ring-1 ring-amber-300 ring-offset-1" : ""}`}>
                    <AvatarFallback className={`text-xs ${isPremiumGame 
                      ? "bg-gradient-to-br from-amber-200 to-amber-400 text-amber-800" 
                      : ""}`}>
                      {playerInfo?.user.avatarInitials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">
                        {playerInfo?.user.username || `Player ${playerId}`}
                      </span>
                    </div>
                    <div className={`h-1.5 w-full ${isPremiumGame ? "bg-amber-100" : "bg-gray-200"} rounded-full overflow-hidden`}>
                      <div
                        className={`h-full rounded-full transition-all duration-100 ${
                          isPremiumGame
                            ? "bg-gradient-to-r from-green-400 to-green-500"
                            : "bg-green-500"
                        }`}
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
                variant="default"
                size="sm"
                onClick={async () => {
                  setIsLoading(true);
                  await joinChannel({ channelName: `game-${game.id}`, uid: currentUserId.toString() });
                  setIsLoading(false);
                }}
                disabled={isLoading}
                className={`w-full mt-2 ${isPremiumGame 
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white" 
                  : ""}`}
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
          <p className={`text-xs ${isPremiumGame ? "text-amber-700" : "text-gray-500"}`}>
            {isPremiumGame 
              ? "Premium voice chat unlocked! Click 'Show Details' to join the exclusive audio experience." 
              : "Voice chat is available for this high-stakes game. Click 'Show Details' to join."}
          </p>
        )}
      </div>
    </div>
  );
}
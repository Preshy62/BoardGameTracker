import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Users, Volume2, Crown, Radio, Shield } from "lucide-react";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Game } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface VoiceChatProps {
  game: Game;
  players: { user: { username: string; avatarInitials: string }, id: number }[];
  currentUserId: number;
}

export default function VoiceChat({ game, players, currentUserId }: VoiceChatProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
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
    microphoneList,
    selectedMicrophoneId,
    setSelectedMicrophoneId
  } = useVoiceChat();
  
  // Check if voice chat should be enabled based on stake amount or explicit flag
  const HIGH_STAKES_THRESHOLD = 20000;
  const PREMIUM_STAKES_THRESHOLD = 50000;
  const isVoiceChatEligible = game.stake >= HIGH_STAKES_THRESHOLD || game.voiceChatEnabled === true;
  const isPremiumGame = game.stake >= PREMIUM_STAKES_THRESHOLD;
  
  // Generate secure channel name from game ID
  const channelName = `game-${game.id}-${game.createdAt?.toISOString().split('T')[0] || 'secure'}`;
  
  // Audio status animation
  useEffect(() => {
    if (isJoined) {
      setConnectionStatus('connected');
    } else if (isLoading) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isJoined, isLoading]);
  
  // Play connection sound when joining
  useEffect(() => {
    if (isJoined) {
      try {
        const audio = new Audio();
        audio.src = '/voice-connected.mp3';
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio failed:', e));
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [isJoined]);

  // Auto-join for premium games
  useEffect(() => {
    // Only enable voice chat for eligible games and don't retry if already attempted
    if (!isVoiceChatEligible || autoJoinAttempted) return;
    
    const attemptAutoJoin = async () => {
      // Auto-join for premium games
      if (isPremiumGame && game.status === "in_progress" && !isJoined) {
        try {
          setIsLoading(true);
          
          // Show premium toast notification
          toast({
            title: "Premium Voice Chat",
            description: "Automatically connecting to premium voice experience...",
            variant: "default",
            className: "bg-amber-50 border-amber-200 text-amber-800",
          });
          
          await joinChannel({ 
            channelName,
            uid: currentUserId.toString()
          });
          
          setShowVoiceChat(true); // Auto-expand voice chat section
          
          // Success notification with premium styling
          toast({
            title: "Premium Voice Connected",
            description: "You are now connected to the premium voice chat. Other players can hear you speak.",
            variant: "default",
            className: "bg-amber-50 border-amber-200 text-amber-800",
          });
          
        } catch (error) {
          console.error("Auto-join voice chat failed:", error);
          toast({
            title: "Voice Chat Failed",
            description: "Could not connect to voice chat. Check your microphone permissions.",
            variant: "destructive",
          });
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
      
      // Clear any pending status timers
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, [game.id, game.status, isPremiumGame, isVoiceChatEligible, isJoined, autoJoinAttempted, joinChannel, leaveChannel, currentUserId, toast, channelName]);
  
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
  
  // Handle manual connection
  const handleJoinChannel = async () => {
    try {
      setIsLoading(true);
      await joinChannel({ 
        channelName,
        uid: currentUserId.toString(),
        microphoneId: selectedMicrophoneId || undefined
      });
      toast({
        title: isPremiumGame ? "Premium Voice Connected" : "Voice Chat Connected",
        description: "You've joined the voice chat. Other players can hear you speak.",
        variant: "default",
        className: isPremiumGame ? "bg-amber-50 border-amber-200 text-amber-800" : "",
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to join voice chat:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to voice chat. Please check your microphone permissions.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  // Handle mute toggling with sound feedback
  const handleToggleMute = () => {
    toggleMute();
    
    try {
      const audio = new Audio();
      audio.src = isMuted ? '/unmute.mp3' : '/mute.mp3';
      audio.volume = 0.2;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    // Show toast notification
    toast({
      title: isMuted ? "Microphone Activated" : "Microphone Muted",
      description: isMuted 
        ? "Other players can now hear you speaking." 
        : "You have muted your microphone.",
      variant: isPremiumGame ? "default" : "default",
      className: isPremiumGame ? "bg-amber-50 border-amber-200 text-amber-800" : "",
    });
  };
  
  return (
    <div className="mt-4 relative">
      <div className={`
        rounded-lg p-4 border transition-all duration-300
        ${isPremiumGame 
          ? "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 shadow-lg relative" 
          : "bg-slate-50"}
        ${isJoined && isPremiumGame 
          ? "after:absolute after:inset-0 after:rounded-lg after:border-2 after:border-amber-300 after:animate-pulse after:opacity-70 after:pointer-events-none" 
          : ""}
      `}>
        {/* Premium badge */}
        {isPremiumGame && (
          <div className="absolute -top-3 -right-2 z-10">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-300 to-amber-500 text-white border border-amber-400 shadow-md animate-[pulse_1.5s_ease-in-out_infinite]">
              <Crown className="h-3.5 w-3.5 mr-1 text-white" />
              Premium Audio
            </span>
          </div>
        )}
        
        {/* Header section */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {isPremiumGame ? (
              <Radio className={`h-4 w-4 mr-2 ${connectionStatus === 'connected' ? 'text-amber-500 animate-pulse' : 'text-amber-400'}`} />
            ) : (
              <Volume2 className={`h-4 w-4 mr-2 ${connectionStatus === 'connected' ? 'text-primary' : 'text-muted-foreground'}`} />
            )}
            
            <h3 className={`font-medium text-sm ${isPremiumGame ? "text-amber-700" : ""}`}>
              {isPremiumGame ? "Premium Voice" : "Voice Chat"}
            </h3>
            
            {/* Connection status badge */}
            <Badge 
              variant={isPremiumGame ? "default" : "outline"} 
              className={`ml-2 text-xs ${
                connectionStatus === 'connected' 
                  ? (isPremiumGame ? "bg-green-100 text-green-700" : "bg-green-100 text-green-700")
                  : connectionStatus === 'connecting'
                    ? (isPremiumGame ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-amber-100 text-amber-700 animate-pulse")
                    : (isPremiumGame ? "bg-gray-100 text-gray-500" : "")
              }`}
            >
              {connectionStatus === 'connected' 
                ? "Connected" 
                : connectionStatus === 'connecting' 
                  ? "Connecting..." 
                  : "Disconnected"}
            </Badge>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isJoined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isPremiumGame ? "default" : "outline"}
                      size="icon"
                      className={`h-8 w-8 transition-all duration-200 ${
                        isPremiumGame 
                          ? (isMuted 
                            ? "bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-600 shadow-inner" 
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-inner") 
                          : ""
                      }`}
                      onClick={handleToggleMute}
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
              className={`text-xs h-8 transition-colors ${isPremiumGame 
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-sm" 
                : ""}`}
              onClick={() => setShowVoiceChat(!showVoiceChat)}
            >
              {showVoiceChat ? "Hide" : "Show"} Details
            </Button>
          </div>
        </div>
        
        {/* Voice chat details panel */}
        {showVoiceChat && (
          <div className={`space-y-3 pt-2 border-t ${isPremiumGame ? "border-amber-200" : ""}`}>
            {/* Your voice indicator */}
            <div className="flex items-center gap-2 mt-2">
              <Avatar className={`h-9 w-9 border ${
                isPremiumGame 
                  ? "ring-2 ring-amber-300 ring-offset-1 border-amber-200" 
                  : "border-slate-200"
              }`}>
                <AvatarFallback className={`text-xs ${isPremiumGame 
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold" 
                  : "bg-primary text-white"}`}
                >
                  YOU
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-medium ${isPremiumGame ? "text-amber-700" : ""}`}>
                    You {isMuted ? "(Muted)" : ""}
                    {isPremiumGame && isJoined && (
                      <Badge variant="outline" className="ml-1.5 py-px h-4 bg-amber-100 border-amber-200 text-amber-700">
                        Premium
                      </Badge>
                    )}
                  </span>
                  {isJoined && (
                    <Badge variant="outline" className={`text-xs py-0 px-1 ${isMuted ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"}`}>
                      {isMuted ? "Muted" : "Live"}
                    </Badge>
                  )}
                </div>
                
                {/* Interactive audio level indicator */}
                <div className={`relative h-2 ${isPremiumGame ? "bg-amber-100" : "bg-gray-200"} rounded-full overflow-hidden group`}>
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
                  {!isMuted && audioLevel > 0.05 && (
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white opacity-30 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Microphone selector for premium games */}
            {isPremiumGame && isJoined && microphoneList.length > 1 && (
              <div className="border border-amber-200 bg-amber-50 rounded-md p-2 mt-1">
                <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
                  <span className="font-medium">Microphone:</span>
                </div>
                <select 
                  className="w-full text-xs bg-white border border-amber-200 rounded px-2 py-1 text-amber-700"
                  value={selectedMicrophoneId}
                  onChange={(e) => setSelectedMicrophoneId(e.target.value)}
                >
                  {microphoneList.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone (${device.deviceId.substring(0, 5)}...)`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Other players section */}
            {remoteUsers.length > 0 && (
              <div className={`p-2 rounded-md ${isPremiumGame ? "bg-amber-50/50 border border-amber-100" : "bg-slate-100"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-medium ${isPremiumGame ? "text-amber-700" : ""}`}>
                    Players in Voice Chat
                  </span>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
                    {remoteUsers.length} connected
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {remoteUsers.map((user) => {
                    // Find player info based on user ID
                    const playerId = Number(user.uid);
                    const playerInfo = players.find(p => p.id === playerId);
                    const audioLevel = remoteAudioLevels[user.uid as string] || 0;
                    
                    return (
                      <div key={user.uid} className={`flex items-center gap-2 p-1 rounded ${audioLevel > 0.1 ? (isPremiumGame ? "bg-amber-100/50" : "bg-slate-200/50") : ""}`}>
                        <Avatar className={`h-7 w-7 ${isPremiumGame ? "ring-1 ring-amber-300 ring-offset-1" : ""}`}>
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
                            {audioLevel > 0.15 && (
                              <Badge variant="outline" className="h-4 text-[10px] py-0 px-1 bg-green-50 text-green-600">
                                Speaking
                              </Badge>
                            )}
                          </div>
                          <Progress 
                            value={Math.min(audioLevel * 100, 100)} 
                            className={`h-1.5 ${isPremiumGame ? "bg-amber-100" : "bg-slate-200"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Empty state */}
            {remoteUsers.length === 0 && isJoined && (
              <div className={`p-3 rounded-md border text-center ${isPremiumGame 
                ? "bg-amber-50 border-amber-200 text-amber-700" 
                : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                <div className="flex flex-col items-center gap-1">
                  <Users className="h-5 w-5 mb-1 opacity-50" />
                  <p className="text-xs font-medium">No other players in voice chat yet</p>
                  <p className="text-xs opacity-75">When others join, they'll appear here</p>
                </div>
              </div>
            )}
            
            {/* Connection button */}
            {!isJoined && (
              <Button
                variant="default"
                size="sm"
                onClick={handleJoinChannel}
                disabled={isLoading}
                className={`w-full mt-2 ${isPremiumGame 
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white shadow-md" 
                  : ""}`}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    <span>Join Voice Chat</span>
                  </>
                )}
              </Button>
            )}
            
            {/* Leave button */}
            {isJoined && (
              <Button
                variant="outline"
                size="sm"
                onClick={leaveChannel}
                className={`w-full mt-2 ${isPremiumGame 
                  ? "border-amber-200 text-amber-700 hover:bg-amber-50" 
                  : "border-red-200 text-red-500 hover:bg-red-50"}`}
              >
                Leave Voice Chat
              </Button>
            )}
          </div>
        )}
        
        {/* Minimized status */}
        {!showVoiceChat && isJoined && (
          <div className={`flex items-center justify-between text-xs ${isPremiumGame ? "text-amber-700" : "text-gray-500"}`}>
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${isMuted ? "bg-red-500" : "bg-green-500"} ${!isMuted && "animate-pulse"}`}></div>
              <span>
                {isMuted 
                  ? "Voice chat connected (muted)" 
                  : `Voice chat active with ${remoteUsers.length} other ${remoteUsers.length === 1 ? "player" : "players"}`
                }
              </span>
            </div>
            
            {!isMuted && (
              <div className="flex space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className={`h-2 w-0.5 rounded-full ${
                      audioLevel * 5 > i 
                        ? (isPremiumGame ? "bg-amber-500" : "bg-primary") 
                        : (isPremiumGame ? "bg-amber-200" : "bg-gray-200")
                    }`}
                    style={{ height: `${6 + i * 2}px` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Call to action when not joined */}
        {!showVoiceChat && !isJoined && (
          <div className={`flex items-center justify-between ${isPremiumGame ? "text-amber-700" : "text-gray-500"}`}>
            <p className="text-xs">
              {isPremiumGame 
                ? (
                  <span className="flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-amber-500" />
                    Premium voice chat unlocked! Click 'Show Details' to join.
                  </span>
                ) 
                : "Voice chat is available for this high-stakes game. Click 'Show Details' to join."}
            </p>
            
            {isPremiumGame && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-amber-100 text-amber-700 border-amber-200">
                Premium
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
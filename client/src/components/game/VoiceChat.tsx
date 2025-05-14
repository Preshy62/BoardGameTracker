import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Users, Headphones, Info, Loader2 } from 'lucide-react';
import { Game, GamePlayer } from '@shared/schema';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { useToast } from '@/hooks/use-toast';
import useSoundEffects from '@/hooks/use-sound-effects';

interface VoiceChatProps {
  game: Game;
  players: (GamePlayer & { user: { username: string; avatarInitials?: string } })[];
  currentUserId: number;
}

export default function VoiceChat({ game, players, currentUserId }: VoiceChatProps) {
  const { toast } = useToast();
  const { playVoiceChatSound } = useSoundEffects();
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Record<string, boolean>>({});
  const [speakingUsers, setSpeakingUsers] = useState<Record<string, number>>({});
  const [isPremiumUI, setIsPremiumUI] = useState(game.stake >= 50000);
  const [hasJoinedBefore, setHasJoinedBefore] = useState(false);
  
  // Use refs to maintain references across renders
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const audioLevelIntervalsRef = useRef<Record<string, number>>({});
  
  // Handle app ID securely
  const appId = import.meta.env.VITE_AGORA_APP_ID;
  if (!appId) {
    console.error('VITE_AGORA_APP_ID is not defined');
  }
  
  // Debug logs - these help with development and troubleshooting
  useEffect(() => {
    console.log('Agora App ID available:', !!appId);
    if (appId) {
      console.log('Agora App ID length:', appId.length);
      console.log('Agora App ID first/last char:', `${appId.charAt(0)}...${appId.charAt(appId.length - 1)}`);
      console.log('Agora App ID format valid:', /^[0-9a-zA-Z]{32}$/.test(appId));
    }
  }, [appId]);

  // Map old sound names to new voice chat sound actions
  const playSound = (soundName: string) => {
    if (soundName === 'connected') {
      playVoiceChatSound('connect');
    } else if (soundName === 'mute') {
      playVoiceChatSound('mute');
    } else if (soundName === 'unmute') {
      playVoiceChatSound('unmute');
    } else if (soundName === 'join') {
      playVoiceChatSound('join');
    } else if (soundName === 'leave') {
      playVoiceChatSound('leave');
    }
  };

  // Set up Agora client
  useEffect(() => {
    if (!appId || !game?.id) return;
    
    // Only enable voice chat for high-stakes games (≥₦20,000)
    if (game.stake < 20000) {
      return;
    }
    
    // Set premium UI for very high-stakes games (≥₦50,000)
    setIsPremiumUI(game.stake >= 50000);
    
    // Create and configure the client
    try {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;
      setIsClientReady(true);
      
      // Listen for remote users joining
      client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          setActiveUsers(prev => ({ ...prev, [user.uid.toString()]: true }));
          
          // Start monitoring audio levels for this user
          if (user.audioTrack) {
            const interval = window.setInterval(() => {
              const level = user.audioTrack?.getVolumeLevel() || 0;
              setSpeakingUsers(prev => ({ ...prev, [user.uid.toString()]: level * 100 }));
            }, 100);
            audioLevelIntervalsRef.current[user.uid.toString()] = interval;
          }
        }
      });
      
      // Handle remote users leaving
      client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
        if (audioLevelIntervalsRef.current[user.uid.toString()]) {
          clearInterval(audioLevelIntervalsRef.current[user.uid.toString()]);
          delete audioLevelIntervalsRef.current[user.uid.toString()];
        }
        
        setActiveUsers(prev => {
          const updated = { ...prev };
          delete updated[user.uid.toString()];
          return updated;
        });
        
        setSpeakingUsers(prev => {
          const updated = { ...prev };
          delete updated[user.uid.toString()];
          return updated;
        });
      });
      
      // Auto-join for premium games
      if (game.stake >= 20000) {
        joinChannel();
      }
      
      // Clean up when component unmounts
      return () => {
        leaveChannel();
        client.removeAllListeners();
      };
    } catch (error) {
      console.error('Error creating Agora client:', error);
      toast({
        title: 'Voice Chat Error',
        description: 'Could not initialize voice chat. Please refresh and try again.',
        variant: 'destructive',
      });
    }
  }, [appId, game?.id, game?.stake]);
  
  // Monitor local audio level
  useEffect(() => {
    if (!isJoined || !localTrackRef.current) return;
    
    const interval = setInterval(() => {
      const level = localTrackRef.current?.getVolumeLevel() || 0;
      setSpeakingUsers(prev => ({ ...prev, 'local': level * 100 }));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isJoined]);
  
  // Join voice channel
  const joinChannel = async () => {
    if (!appId || !clientRef.current || !game?.id) return;
    
    try {
      // Use game ID as channel name
      const channelName = `game_${game.id}`;
      // Use user ID as UID to identify speakers
      const uid = currentUserId;
      
      // Request join token from server - in a real app, this would be a secure token
      // For this demo, we're using a simple approach for testing
      const token = null; // Use null for testing environments with App ID Authentication enabled
      
      // Join the channel
      await clientRef.current.join(appId, channelName, token, uid);
      
      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTrackRef.current = audioTrack;
      await clientRef.current.publish([audioTrack]);
      
      setIsJoined(true);
      setActiveUsers(prev => ({ ...prev, 'local': true }));
      
      // Play connected sound
      playSound('connected');
      
      toast({
        title: 'Voice Chat Connected',
        description: 'You can now talk with other players',
      });
    } catch (error) {
      console.error('Error joining channel:', error);
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to voice chat. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Leave voice channel
  const leaveChannel = async () => {
    if (!clientRef.current) return;
    
    try {
      // Stop and close local track
      if (localTrackRef.current) {
        localTrackRef.current.stop();
        localTrackRef.current.close();
        localTrackRef.current = null;
      }
      
      // Leave the channel
      await clientRef.current.leave();
      
      // Clear states
      setIsJoined(false);
      setIsMuted(false);
      
      setActiveUsers(prev => {
        const updated = { ...prev };
        delete updated['local'];
        return updated;
      });
      
      setSpeakingUsers(prev => {
        const updated = { ...prev };
        delete updated['local'];
        return updated;
      });
      
      // Clear all audio level intervals
      Object.values(audioLevelIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
      audioLevelIntervalsRef.current = {};
      
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };
  
  // Toggle mute/unmute
  const toggleMute = async () => {
    if (!localTrackRef.current) return;
    
    try {
      if (isMuted) {
        await localTrackRef.current.setEnabled(true);
        setIsMuted(false);
        playSound('unmute');
      } else {
        await localTrackRef.current.setEnabled(false);
        setIsMuted(true);
        playSound('mute');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };
  
  // If voice chat is not available for this game, show a basic message
  if (game.stake < 20000) {
    return (
      <div className="text-center text-sm text-gray-500 py-2">
        <Badge variant="outline" className="gap-1">
          <VolumeX className="h-3 w-3" />
          <span>Voice chat only available for games with stake ≥ ₦20,000</span>
        </Badge>
      </div>
    );
  }
  
  // Find which players are in the voice chat
  const getPlayerUsername = (uid: string | number) => {
    if (uid === 'local' || uid === currentUserId) {
      return 'You (Me)';
    }
    
    const player = players.find(p => p.userId === Number(uid) || p.id === Number(uid));
    return player?.user?.username || `Player ${uid}`;
  };
  
  // Get avatar initials for a player
  const getPlayerInitials = (uid: string | number) => {
    if (uid === 'local' || uid === currentUserId) {
      const currentPlayer = players.find(p => p.userId === currentUserId);
      return currentPlayer?.user?.avatarInitials || 'ME';
    }
    
    const player = players.find(p => p.userId === Number(uid) || p.id === Number(uid));
    return player?.user?.avatarInitials || 'P';
  };
  
  // Calculate audio level percentage for progress bar
  const getAudioLevelPercentage = (uid: string | number) => {
    const level = speakingUsers[uid.toString()] || 0;
    return Math.min(Math.max(level, 5), 100);
  };
  
  // Determine if we should use premium styling
  const premiumClass = isPremiumUI ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : '';
  
  return (
    <Card className={`rounded-lg overflow-hidden ${premiumClass}`}>
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {isPremiumUI ? 'Premium Voice Chat' : 'Voice Chat'}
            </span>
            {isPremiumUI && (
              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                Premium
              </span>
            )}
            {isJoined && (
              <Badge variant="outline" className="ml-1 border-green-200 bg-green-50/70 text-green-700 text-xs px-2 shadow-sm backdrop-blur-sm">
                <span className="flex items-center">
                  <div className="relative h-2 w-2 mr-1.5">
                    <div className="absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75 animate-ping"></div>
                    <div className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></div>
                  </div>
                  <span className="font-medium">Live</span>
                </span>
              </Badge>
            )}
          </div>
          
          {/* Connection Status Message */}
          {!isClientReady && (
            <div className="text-center py-2 px-3 mt-2 mb-3 text-sm bg-slate-50 rounded-md">
              <div className="flex justify-center items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-slate-600">Initializing voice chat...</span>
              </div>
            </div>
          )}
          
          {/* User count indicator when joined */}
          {isJoined && isClientReady && (
            <div className="mb-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <div className="relative">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center bg-blue-100 text-[10px] text-blue-700 font-medium rounded-full border border-blue-200">
                    {Object.keys(activeUsers).length}
                  </span>
                </div>
                <span className="font-medium">
                  {Object.keys(activeUsers).length === 1 
                    ? "You're the only one here" 
                    : `${Object.keys(activeUsers).length} players connected`}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex space-x-1">
            {!isJoined ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={isPremiumUI ? "default" : "outline"}
                      size="sm"
                      className={`h-7 px-2 transition-all duration-200 ${
                        isPremiumUI 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                          : 'hover:bg-green-50 border-green-300 text-green-600'
                      } relative`}
                      onClick={joinChannel}
                      disabled={!isClientReady}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      <span className="text-xs font-medium">Join</span>
                      {!isClientReady && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Join voice chat</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={isMuted ? "default" : "outline"} 
                        size="sm"
                        className={`h-7 px-2 transition-all duration-200 ${
                          isMuted 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : isPremiumUI 
                              ? 'border-amber-300 hover:bg-amber-50 text-amber-700 hover:text-amber-800' 
                              : 'hover:bg-slate-100'
                        }`}
                        onClick={toggleMute}
                      >
                        {isMuted ? (
                          <MicOff className="h-3.5 w-3.5 mr-1 animate-pulse" />
                        ) : (
                          <Mic className="h-3.5 w-3.5 mr-1" />
                        )}
                        <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isMuted ? 'Unmute microphone' : 'Mute microphone'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 px-2 transition-all duration-200 border-red-200 hover:bg-red-50 text-red-500 hover:text-red-600"
                        onClick={leaveChannel}
                      >
                        <PhoneOff className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs font-medium">Leave</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Leave voice chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>
        
        {/* Participants section */}
        <div className="space-y-2">
          {/* Comprehensive guide for first-time users */}
          {!isJoined && !hasJoinedBefore && Object.keys(activeUsers).length === 0 && (
            <div className={`text-center py-3 px-3 mb-2 text-sm rounded-md border ${
              isPremiumUI 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : 'bg-blue-50 text-blue-700 border-blue-100'
            }`}>
              <div className="flex items-center justify-center mb-1.5">
                <Info className="h-4 w-4 mr-1.5" />
                <span className="font-medium">Voice Chat Guide</span>
              </div>
              <p className="mb-1.5 text-xs leading-relaxed">
                Click the <span className="font-semibold">Join</span> button to connect. Make sure your microphone 
                is working and allow browser permissions when prompted.
              </p>
              <div className="text-xs flex justify-center space-x-3 mt-2">
                <span className="flex items-center"><Headphones className="h-3.5 w-3.5 mr-1" /> Use headphones</span>
                <span className="flex items-center"><Mic className="h-3.5 w-3.5 mr-1" /> Speak clearly</span>
              </div>
            </div>
          )}
          
          {/* Simple help text for experienced users */}
          {!isJoined && hasJoinedBefore && Object.keys(activeUsers).length === 0 && (
            <div className={`text-center py-2.5 px-2 text-sm rounded-md ${
              isPremiumUI 
                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                : 'bg-slate-50 text-muted-foreground'
            }`}>
              <p className="flex items-center justify-center">
                <Info className="h-4 w-4 mr-1.5 opacity-70" />
                Click <span className="font-medium mx-1">Join</span> to connect to voice chat
              </p>
            </div>
          )}
          
          {/* No other users message when connected alone */}
          {isJoined && Object.keys(activeUsers).length === 1 && (
            <div className={`text-center py-2 px-2 mb-2 text-sm rounded-md ${
              isPremiumUI 
                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                : 'bg-slate-50 text-slate-500'
            }`}>
              <p className="flex items-center justify-center">
                <Users className="h-4 w-4 mr-1.5 opacity-70" />
                No other players connected to voice chat yet
              </p>
            </div>
          )}
          
          {/* Show connected users */}
          {isJoined && (
            <div className="space-y-2">
              {/* Current user first */}
              <div className="flex items-center justify-between bg-slate-50 rounded p-2">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-7 w-7 relative">
                    <AvatarFallback className={isPremiumUI ? "bg-amber-100 text-amber-800" : ""}>
                      {getPlayerInitials('local')}
                    </AvatarFallback>
                    
                    {/* Audio level indicator dot */}
                    {speakingUsers['local'] > 5 && !isMuted && (
                      <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                        <div 
                          className={`h-2 w-2 rounded-full ${
                            speakingUsers['local'] > 70 ? 'bg-green-500 animate-pulse shadow-sm shadow-green-300' : 
                            speakingUsers['local'] > 30 ? 'bg-green-400' : 
                            'bg-green-300'
                          }`}
                        />
                        {/* Add rings for high volume */}
                        {speakingUsers['local'] > 50 && (
                          <div className="absolute inset-0 -m-1 rounded-full border border-green-300 animate-ping opacity-75"></div>
                        )}
                      </div>
                    )}
                  </Avatar>
                  
                  <div className="text-sm font-medium">
                    {getPlayerUsername('local')}
                  </div>
                </div>
                
                <div className="flex items-center">
                  {/* Enhanced voice activity indicator */}
                  <div className="flex items-center space-x-1 mr-2">
                    <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-100 ${
                          isMuted ? 'bg-red-400' : 
                          speakingUsers['local'] > 70 ? 'bg-green-500' : 
                          speakingUsers['local'] > 30 ? 'bg-green-400' : 
                          speakingUsers['local'] > 10 ? 'bg-green-300' : 
                          'bg-slate-300'
                        }`}
                        style={{ 
                          width: `${isMuted ? 100 : Math.min(Math.max(speakingUsers['local'], 5), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Enhanced status indicator */}
                  {isMuted ? (
                    <div className="relative">
                      <MicOff className="h-3.5 w-3.5 text-red-500" />
                      <div className="absolute -right-1.5 -top-1.5 bg-red-100 text-red-600 text-[8px] px-1 rounded-full border border-red-200">
                        muted
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Mic className="h-3.5 w-3.5 text-green-500" />
                      {speakingUsers['local'] > 50 && (
                        <div className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Other connected users */}
              {Object.keys(activeUsers)
                .filter(uid => uid !== 'local' && uid !== currentUserId.toString())
                .map(uid => (
                  <div key={uid} className="flex items-center justify-between bg-slate-50 rounded p-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-7 w-7 relative">
                        <AvatarFallback className={isPremiumUI ? "bg-amber-100 text-amber-800" : ""}>
                          {getPlayerInitials(uid)}
                        </AvatarFallback>
                        
                        {/* Enhanced audio activity indicator */}
                        {speakingUsers[uid] > 5 && (
                          <div className="absolute -bottom-1 -right-1 flex items-center justify-center">
                            <div 
                              className={`h-2 w-2 rounded-full ${
                                speakingUsers[uid] > 70 ? 'bg-green-500 animate-pulse shadow-sm shadow-green-300' : 
                                speakingUsers[uid] > 30 ? 'bg-green-400' : 
                                'bg-green-300'
                              }`}
                            />
                            {/* Add rings for high volume */}
                            {speakingUsers[uid] > 60 && (
                              <div className="absolute inset-0 -m-1 rounded-full border border-green-300 animate-ping opacity-75"></div>
                            )}
                          </div>
                        )}
                      </Avatar>
                      
                      <div className="text-sm font-medium">
                        {getPlayerUsername(uid)}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {/* Enhanced voice activity meter with visual effects */}
                      <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden mr-1 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-100 ${
                            speakingUsers[uid] > 70 ? 'bg-green-500 animate-pulse' : 
                            speakingUsers[uid] > 30 ? 'bg-green-400' : 
                            speakingUsers[uid] > 10 ? 'bg-green-300' : 
                            'bg-slate-300'
                          }`}
                          style={{ 
                            width: `${getAudioLevelPercentage(uid)}%`,
                          }}
                        />
                        
                        {/* Audio level vertical bars */}
                        {speakingUsers[uid] > 15 && (
                          <div className="absolute -right-4 -top-0.5 flex space-x-0.5">
                            <div className={`h-2 w-0.5 rounded-full ${speakingUsers[uid] > 15 ? 'bg-green-400' : 'bg-slate-200'}`}></div>
                            <div className={`h-2.5 w-0.5 rounded-full ${speakingUsers[uid] > 30 ? 'bg-green-400' : 'bg-slate-200'}`}></div>
                            <div className={`h-3 w-0.5 rounded-full ${speakingUsers[uid] > 60 ? 'bg-green-400' : 'bg-slate-200'}`}></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Enhanced status indicator */}
                      <div className="relative">
                        <Headphones className="h-3.5 w-3.5 text-blue-500" />
                        {speakingUsers[uid] > 60 && (
                          <div className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, PhoneOff, Mic, MicOff, Settings, Volume2, Users, Waves } from 'lucide-react';
import { Game, GamePlayer } from '@shared/schema';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { useToast } from '@/hooks/use-toast';
import useSoundEffects from '@/hooks/use-sound-effects';

interface ProfessionalVoiceChatProps {
  game: Game;
  players: (GamePlayer & { user: any })[];
  currentUserId: number;
}

export default function ProfessionalVoiceChat({ game, players, currentUserId }: ProfessionalVoiceChatProps) {
  const { toast } = useToast();
  const { playVoiceChatSound } = useSoundEffects();
  
  // Core voice chat state
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Record<string, boolean>>({});
  const [speakingUsers, setSpeakingUsers] = useState<Record<string, number>>({});
  
  // Premium features state
  const [isPremiumUI] = useState(game.stake >= 75000);
  const [audioQuality, setAudioQuality] = useState<'standard' | 'high' | 'premium'>('premium');
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [micGain, setMicGain] = useState(80);
  const [outputVolume, setOutputVolume] = useState(100);
  
  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const audioLevelIntervalsRef = useRef<Record<string, number>>({});
  
  const appId = import.meta.env.VITE_AGORA_APP_ID;

  useEffect(() => {
    if (appId && !isClientReady) {
      initializeAgoraClient();
    }
    return cleanup;
  }, [appId]);

  const initializeAgoraClient = async () => {
    if (!appId) {
      console.error('Agora App ID is missing');
      return;
    }

    try {
      console.log('Initializing Agora client for voice chat...');
      
      // Enhanced mobile audio setup
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('Audio context resumed for mobile device');
          }
          
          // Request microphone permissions early for mobile
          await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            console.log('Mobile microphone permission granted');
            stream.getTracks().forEach(track => track.stop());
          }).catch(err => {
            console.log('Mobile microphone permission:', err.message);
          });
          
        } catch (error) {
          console.log('Mobile audio setup:', error);
        }
      }

      console.log('Creating Agora client...');
      const client = AgoraRTC.createClient({
        mode: 'rtc',
        codec: 'vp8'
      });

      // Add event listeners for debugging
      client.on('user-joined', handleUserJoined);
      client.on('user-left', handleUserLeft);
      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);
      
      client.on('connection-state-change', (curState, revState) => {
        console.log('Voice chat connection state:', curState, 'from', revState);
      });

      clientRef.current = client;
      setIsClientReady(true);
      console.log('Agora client initialized successfully');
      
    } catch (error: any) {
      console.error('Failed to initialize Agora client:', error);
      toast({
        title: "Voice Chat Error",
        description: `Failed to initialize voice chat: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const joinChannel = async () => {
    console.log('Joining voice chat channel...');
    
    if (!clientRef.current) {
      console.error('Agora client not initialized');
      toast({
        title: "Connection Error",
        description: "Voice chat client not ready. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }
    
    if (!appId) {
      console.error('Agora App ID missing');
      toast({
        title: "Configuration Error", 
        description: "Voice chat not configured properly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const channelName = `game_${game.id}`;
      const uid = currentUserId;
      const token = null;

      // Mobile audio permission request
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('Mobile microphone permission granted for join');
        } catch (error) {
          console.log('Mobile microphone permission denied:', error);
          toast({
            title: "Microphone Access",
            description: "Please allow microphone access to use voice chat",
            variant: "destructive",
          });
          return;
        }
      }

      // Join the channel
      console.log(`Joining channel: ${channelName} with UID: ${uid}`);
      await clientRef.current.join(appId, channelName, token, uid);

      // Create and publish audio track with optimal settings
      const audioTrackConfig = {
        encoderConfig: isPremiumUI ? 'high_quality_stereo' as const : 'high_quality' as const,
        ANS: noiseReduction,
        AEC: echoCancellation,
        AGC: autoGainControl,
      };

      console.log('Creating microphone audio track with config:', audioTrackConfig);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack(audioTrackConfig);
      localTrackRef.current = audioTrack;
      
      console.log('Publishing audio track...');
      await clientRef.current.publish([audioTrack]);

      setIsJoined(true);
      setActiveUsers(prev => ({ ...prev, 'local': true }));
      playVoiceChatSound('connect');

      toast({
        title: "Voice Chat Connected",
        description: isPremiumUI ? "Premium voice chat enabled with HD audio" : "Voice chat connected",
      });

      console.log('Successfully joined voice chat channel');

    } catch (error: any) {
      console.error('Failed to join voice channel:', error);
      toast({
        title: "Connection Failed",
        description: `Could not connect to voice chat: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const leaveChannel = async () => {
    if (!clientRef.current) return;

    try {
      if (localTrackRef.current) {
        await localTrackRef.current.close();
        localTrackRef.current = null;
      }

      await clientRef.current.leave();
      setIsJoined(false);
      setActiveUsers({});
      setSpeakingUsers({});
      playVoiceChatSound('leave');

      toast({
        title: "Voice Chat Disconnected",
        description: "You left the voice chat",
      });
    } catch (error) {
      console.error('Failed to leave channel:', error);
    }
  };

  const toggleMute = async () => {
    if (!localTrackRef.current) return;

    try {
      await localTrackRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
      playVoiceChatSound(isMuted ? 'unmute' : 'mute');
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleUserJoined = (user: IAgoraRTCRemoteUser) => {
    console.log('User joined voice chat:', user.uid);
    setActiveUsers(prev => ({ ...prev, [user.uid.toString()]: true }));
  };

  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    console.log('User left voice chat:', user.uid);
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
  };

  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'audio' && clientRef.current) {
      console.log('User published audio, subscribing:', user.uid);
      
      try {
        await clientRef.current.subscribe(user, mediaType);
        
        if (user.audioTrack) {
          console.log('Setting up audio playback for user:', user.uid);
          
          // Set volume
          user.audioTrack.setVolume(outputVolume);
          
          // Enhanced mobile audio playback with iOS-specific fixes
          if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            console.log('Mobile device detected, setting up audio playback for user:', user.uid);
            
            try {
              // Create and resume audio context
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
                console.log('Audio context resumed for mobile audio playback');
              }
              
              // iOS-specific audio setup
              if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                console.log('iOS device detected, applying iOS audio workarounds');
                
                // Create a silent audio element to unlock iOS audio
                const silentAudio = document.createElement('audio');
                silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeADSEzfPSlC4JF2Hb7+ONQQ4FcLTy9Z5QEww=';
                silentAudio.autoplay = false;
                silentAudio.loop = false;
                silentAudio.volume = 0.01;
                silentAudio.muted = false;
                
                // Play silent audio to unlock iOS audio system
                try {
                  await silentAudio.play();
                  console.log('iOS audio system unlocked with silent audio');
                } catch (e) {
                  console.log('iOS silent audio play failed, continuing anyway');
                }
                
                // Wait a bit for iOS audio system to initialize
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
              // Set volume to maximum for mobile
              user.audioTrack.setVolume(100);
              console.log('Set remote audio volume to 100% for mobile user:', user.uid);
              
              // Force audio playback on mobile with retry mechanism
              let playAttempts = 0;
              const maxAttempts = 3;
              
              while (playAttempts < maxAttempts) {
                try {
                  await user.audioTrack.play();
                  console.log(`Remote audio track started on mobile for user: ${user.uid} (attempt ${playAttempts + 1})`);
                  break;
                } catch (playError) {
                  playAttempts++;
                  console.log(`Audio play attempt ${playAttempts} failed for user ${user.uid}:`, playError);
                  
                  if (playAttempts >= maxAttempts) {
                    console.error('All audio play attempts failed for user:', user.uid);
                    // Last resort: try to manually trigger audio
                    if (user.audioTrack.getMediaStreamTrack) {
                      const track = user.audioTrack.getMediaStreamTrack();
                      if (track) {
                        console.log('Attempting manual audio track activation for user:', user.uid);
                      }
                    }
                  } else {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 200));
                  }
                }
              }
              
            } catch (mobileError) {
              console.error('Mobile audio setup error for user:', user.uid, mobileError);
              // Final fallback: basic play attempt
              try {
                await user.audioTrack.play();
                console.log('Fallback audio play successful for user:', user.uid);
              } catch (fallbackError) {
                console.error('Fallback audio play failed for user:', user.uid, fallbackError);
              }
            }
          } else {
            // Desktop audio setup
            try {
              user.audioTrack.setVolume(outputVolume);
              await user.audioTrack.play();
              console.log('Remote audio track started on desktop for user:', user.uid);
            } catch (desktopError) {
              console.error('Desktop audio play error for user:', user.uid, desktopError);
            }
          }
          
          // Update speaking status
          setSpeakingUsers(prev => ({ ...prev, [user.uid.toString()]: Date.now() }));
          
        }
      } catch (error) {
        console.error('Error subscribing to user audio:', user.uid, error);
      }
    }
  };

  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    if (mediaType === 'audio') {
      console.log('User unpublished audio:', user.uid);
      setSpeakingUsers(prev => {
        const updated = { ...prev };
        delete updated[user.uid.toString()];
        return updated;
      });
    }
  };

  const cleanup = () => {
    Object.values(audioLevelIntervalsRef.current).forEach(clearInterval);
    audioLevelIntervalsRef.current = {};
    
    if (localTrackRef.current) {
      localTrackRef.current.close();
      localTrackRef.current = null;
    }
    
    if (clientRef.current) {
      clientRef.current.leave();
      clientRef.current = null;
    }
  };

  const getPlayerInitials = (uid: string | number) => {
    if (uid === 'local' || uid === currentUserId || uid === currentUserId.toString()) {
      const currentPlayer = players.find(p => p.userId === currentUserId);
      return currentPlayer?.user?.avatarInitials || 'ME';
    }
    
    const player = players.find(p => p.userId === Number(uid) || p.id === Number(uid));
    return player?.user?.avatarInitials || 'P';
  };

  const connectedUsersCount = Object.keys(activeUsers).length;

  // Don't show voice chat for low-stakes games
  if (game.stake < 20000) {
    return null;
  }

  return (
    <Card className={`rounded-lg overflow-hidden ${isPremiumUI ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Phone className={`h-5 w-5 ${isPremiumUI ? 'text-amber-600' : 'text-blue-600'}`} />
              {isJoined && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className="font-medium">
              {isPremiumUI ? 'Premium Voice Chat' : 'Voice Chat'}
            </span>
            {isPremiumUI && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                HD Audio
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {connectedUsersCount}
            </Badge>
            
            {isPremiumUI && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                      className="h-8 w-8 p-0"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Advanced Audio Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Connected Users */}
        {connectedUsersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(activeUsers).map((uid) => {
              const isSpeaking = speakingUsers[uid] && (Date.now() - speakingUsers[uid] < 2000);
              return (
                <div key={uid} className="flex items-center space-x-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className={`text-xs ${isSpeaking ? 'bg-green-100 text-green-700' : ''}`}>
                      {getPlayerInitials(uid)}
                    </AvatarFallback>
                  </Avatar>
                  {isSpeaking && <Waves className="h-3 w-3 text-green-500 animate-pulse" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center justify-center space-x-3">
          {!isJoined ? (
            <Button 
              onClick={joinChannel}
              disabled={!isClientReady}
              className={`${isPremiumUI ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              <Phone className="h-4 w-4 mr-2" />
              {isPremiumUI ? 'Join Premium Chat' : 'Join Voice Chat'}
            </Button>
          ) : (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? "destructive" : "secondary"}
                      size="sm"
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMuted ? 'Unmute' : 'Mute'} Microphone</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="destructive"
                size="sm"
                onClick={leaveChannel}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Leave
              </Button>
            </>
          )}
        </div>

        {/* Advanced Controls (Premium) */}
        {isPremiumUI && isJoined && (
          <Collapsible open={showAdvancedControls} onOpenChange={setShowAdvancedControls}>
            <CollapsibleContent className="mt-4 space-y-4 pt-4 border-t border-amber-200">
              
              {/* Audio Quality */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Audio Quality</label>
                <div className="flex space-x-2">
                  {(['standard', 'high', 'premium'] as const).map((quality) => (
                    <Button
                      key={quality}
                      variant={audioQuality === quality ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAudioQuality(quality)}
                      className="text-xs"
                    >
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Volume Controls */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Mic className="h-3 w-3 mr-1" />
                    Mic Gain: {micGain}%
                  </label>
                  <Slider
                    value={[micGain]}
                    onValueChange={(value) => setMicGain(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center">
                    <Volume2 className="h-3 w-3 mr-1" />
                    Output: {outputVolume}%
                  </label>
                  <Slider
                    value={[outputVolume]}
                    onValueChange={(value) => setOutputVolume(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Audio Enhancement Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={noiseReduction}
                    onCheckedChange={setNoiseReduction}
                  />
                  <label className="text-sm">Noise Reduction</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={echoCancellation}
                    onCheckedChange={setEchoCancellation}
                  />
                  <label className="text-sm">Echo Cancel</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={autoGainControl}
                    onCheckedChange={setAutoGainControl}
                  />
                  <label className="text-sm">Auto Gain</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={spatialAudio}
                    onCheckedChange={setSpatialAudio}
                  />
                  <label className="text-sm">3D Audio</label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </Card>
  );
}
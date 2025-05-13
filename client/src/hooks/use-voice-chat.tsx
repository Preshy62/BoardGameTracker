import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';
import { Game } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { playSound } from '@/lib/sounds';

interface UseVoiceChatProps {
  game: Game;
  currentUserId: number;
  autoJoin?: boolean; // Automatically join voice chat when component mounts
}

interface UseVoiceChatReturn {
  isJoined: boolean;
  isMuted: boolean;
  isClientReady: boolean;
  activeUsers: Record<string, boolean>;
  speakingUsers: Record<string, number>;
  isPremiumUI: boolean;
  joinChannel: () => Promise<void>;
  leaveChannel: () => Promise<void>;
  toggleMute: () => Promise<void>;
}

export function useVoiceChat({
  game,
  currentUserId,
  autoJoin = false
}: UseVoiceChatProps): UseVoiceChatReturn {
  const { toast } = useToast();
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Record<string, boolean>>({});
  const [speakingUsers, setSpeakingUsers] = useState<Record<string, number>>({});
  const [isPremiumUI, setIsPremiumUI] = useState(game.stake >= 50000);
  
  // Use refs to maintain references across renders
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const audioLevelIntervalsRef = useRef<Record<string, number>>({});
  
  // Handle app ID securely
  const appId = import.meta.env.VITE_AGORA_APP_ID;
  if (!appId) {
    console.error('VITE_AGORA_APP_ID is not defined');
  }
  
  // Check if voice chat is supported for this game (high stakes only)
  const isVoiceChatSupported = game.stake >= 20000;
  
  // Set up Agora client
  useEffect(() => {
    if (!appId || !game?.id || !isVoiceChatSupported) return;
    
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
      
      // Auto-join if requested and supported
      if (autoJoin && isVoiceChatSupported) {
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
  }, [appId, game?.id, game?.stake, isVoiceChatSupported, autoJoin]);
  
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
  const joinChannel = useCallback(async () => {
    if (!appId || !clientRef.current || !game?.id || !isVoiceChatSupported) return;
    
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
      playSound('VOICE_CONNECTED');
      
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
  }, [appId, game?.id, currentUserId, isVoiceChatSupported]);
  
  // Leave voice channel
  const leaveChannel = useCallback(async () => {
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
  }, []);
  
  // Toggle mute/unmute
  const toggleMute = useCallback(async () => {
    if (!localTrackRef.current) return;
    
    try {
      if (isMuted) {
        await localTrackRef.current.setEnabled(true);
        setIsMuted(false);
        playSound('VOICE_UNMUTE');
      } else {
        await localTrackRef.current.setEnabled(false);
        setIsMuted(true);
        playSound('VOICE_MUTE');
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, [isMuted]);
  
  return {
    isJoined,
    isMuted,
    isClientReady,
    activeUsers,
    speakingUsers,
    isPremiumUI,
    joinChannel,
    leaveChannel,
    toggleMute
  };
}
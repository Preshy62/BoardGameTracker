import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  agoraVoice,
  AgoraVoiceManager,
  VoiceConnectionState,
  IAgoraRTCRemoteUser
} from '@/lib/agora-voice';

// For debugging - log more details about the App ID
const appId = import.meta.env.VITE_AGORA_APP_ID as string;
console.log('Agora App ID available:', !!appId);
console.log('Agora App ID length:', appId?.length);
console.log('Agora App ID first/last char:', appId ? `${appId.charAt(0)}...${appId.charAt(appId.length-1)}` : 'N/A');
console.log('Agora App ID format valid:', appId ? /^[a-zA-Z0-9]{1,100}$/.test(appId) : false);

export interface VoiceChatOptions {
  channelName: string;
  uid?: string;
  microphoneId?: string;
  onUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onUserLeft?: (user: IAgoraRTCRemoteUser) => void;
  onError?: (error: Error) => void;
}

export function useVoiceChat() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('disconnected');
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteAudioLevels, setRemoteAudioLevels] = useState<{[uid: string]: number}>({});
  const [channelName, setChannelName] = useState('');
  const [microphoneList, setMicrophoneList] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState('');
  const [isMonitoringAudio, setIsMonitoringAudio] = useState(false);

  // Initialize Agora voice client
  useEffect(() => {
    const isSupported = AgoraVoiceManager.isSupported();
    
    if (!isSupported) {
      toast({
        title: 'Voice Chat Not Supported',
        description: 'Your browser does not support voice chat features',
        variant: 'destructive'
      });
      return;
    }

    const initialized = agoraVoice.init();
    setIsInitialized(initialized);

    if (!initialized) {
      toast({
        title: 'Voice Chat Error',
        description: 'Failed to initialize voice chat client',
        variant: 'destructive'
      });
      return;
    }

    // Load available microphones
    loadMicrophones();

    // Set up event handlers
    agoraVoice.on('user-joined', handleUserJoined);
    agoraVoice.on('user-left', handleUserLeft);
    agoraVoice.on('connection-state-change', handleConnectionStateChange);
    agoraVoice.on('error', handleError);

    return () => {
      // Clean up event handlers
      agoraVoice.off('user-joined', handleUserJoined);
      agoraVoice.off('user-left', handleUserLeft);
      agoraVoice.off('connection-state-change', handleConnectionStateChange);
      agoraVoice.off('error', handleError);

      // Leave voice channel if still connected
      if (isJoined) {
        agoraVoice.leave();
      }

      // Stop audio monitoring
      stopAudioMonitoring();
    };
  }, [toast]);

  // Handle user joined event
  const handleUserJoined = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => {
      // Add user if not already in the list
      if (!prev.find(u => u.uid === user.uid)) {
        return [...prev, user];
      }
      return prev;
    });
  }, []);

  // Handle user left event
  const handleUserLeft = useCallback((user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    setRemoteAudioLevels(prev => {
      const newLevels = { ...prev };
      delete newLevels[user.uid as string];
      return newLevels;
    });
  }, []);

  // Handle connection state change
  const handleConnectionStateChange = useCallback((event: { current: VoiceConnectionState, previous: VoiceConnectionState }) => {
    setConnectionState(event.current);
    
    if (event.current === 'connected') {
      setIsJoined(true);
      setChannelName(agoraVoice.getChannelName());
      startAudioMonitoring();
    } else if (event.current === 'disconnected') {
      setIsJoined(false);
      setRemoteUsers([]);
      setChannelName('');
      stopAudioMonitoring();
    }
  }, []);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    toast({
      title: 'Voice Chat Error',
      description: error.message,
      variant: 'destructive'
    });
  }, [toast]);

  // Load available microphones
  const loadMicrophones = async () => {
    try {
      const devices = await AgoraVoiceManager.getAudioDevices();
      setMicrophoneList(devices);
      
      // Select first microphone by default if available
      if (devices.length > 0 && !selectedMicrophoneId) {
        setSelectedMicrophoneId(devices[0].deviceId);
      }
    } catch (error) {
      console.error('Error loading microphones:', error);
    }
  };

  // Join a voice channel
  const joinChannel = async (options: VoiceChatOptions) => {
    if (!isInitialized) {
      toast({
        title: 'Voice Chat Error',
        description: 'Voice chat client not initialized',
        variant: 'destructive'
      });
      return false;
    }

    if (!options.channelName) {
      toast({
        title: 'Missing Channel Name',
        description: 'Please provide a channel name to join',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const success = await agoraVoice.join({
        channelName: options.channelName,
        uid: options.uid,
        microphoneId: options.microphoneId || selectedMicrophoneId
      });

      if (success) {
        setChannelName(options.channelName);
        toast({
          title: 'Joined Voice Channel',
          description: `Connected to ${options.channelName}`
        });
      }

      return success;
    } catch (error) {
      toast({
        title: 'Join Channel Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Leave the current voice channel
  const leaveChannel = async () => {
    if (!isJoined) return true;

    try {
      const success = await agoraVoice.leave();
      
      if (success) {
        setIsJoined(false);
        setRemoteUsers([]);
        setChannelName('');
        stopAudioMonitoring();
        
        toast({
          title: 'Left Voice Channel',
          description: `Disconnected from ${channelName}`
        });
      }

      return success;
    } catch (error) {
      toast({
        title: 'Leave Channel Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Toggle mute/unmute
  const toggleMute = async () => {
    if (!isJoined) return false;

    try {
      const success = await agoraVoice.setMuted(!isMuted);
      
      if (success) {
        setIsMuted(!isMuted);
        
        toast({
          title: isMuted ? 'Microphone Unmuted' : 'Microphone Muted',
          description: isMuted ? 'Others can now hear you' : 'Others cannot hear you'
        });
      }

      return success;
    } catch (error) {
      toast({
        title: 'Toggle Mute Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Start monitoring audio levels
  const startAudioMonitoring = () => {
    if (isMonitoringAudio) return;

    const intervalId = setInterval(() => {
      // Update local audio level
      setAudioLevel(agoraVoice.getAudioLevel());

      // Update remote audio levels
      const newLevels: {[uid: string]: number} = {};
      remoteUsers.forEach(user => {
        newLevels[user.uid as string] = agoraVoice.getRemoteAudioLevel(user);
      });
      setRemoteAudioLevels(newLevels);
    }, 100);

    // @ts-ignore - we know this is a NodeJS.Timeout
    window.voiceChatAudioMonitorInterval = intervalId;
    setIsMonitoringAudio(true);
  };

  // Stop monitoring audio levels
  const stopAudioMonitoring = () => {
    if (!isMonitoringAudio) return;

    if (window.voiceChatAudioMonitorInterval) {
      clearInterval(window.voiceChatAudioMonitorInterval);
      // @ts-ignore
      window.voiceChatAudioMonitorInterval = null;
    }

    setIsMonitoringAudio(false);
    setAudioLevel(0);
    setRemoteAudioLevels({});
  };

  return {
    // State
    isInitialized,
    isJoined,
    isMuted,
    connectionState,
    remoteUsers,
    audioLevel,
    remoteAudioLevels,
    channelName,
    microphoneList,
    selectedMicrophoneId,
    
    // Actions
    joinChannel,
    leaveChannel,
    toggleMute,
    setSelectedMicrophoneId,
    
    // Utility functions
    loadMicrophones,
    isSupported: AgoraVoiceManager.isSupported
  };
}

// Add window augmentation for TypeScript
declare global {
  interface Window {
    voiceChatAudioMonitorInterval?: NodeJS.Timeout;
  }
}
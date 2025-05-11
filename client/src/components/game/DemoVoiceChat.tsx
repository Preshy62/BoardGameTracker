import React, { useState, useEffect } from "react";
import { Loader2, Mic, MicOff, Loader, Radio, Volume2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

type DemoVoiceChatProps = {
  stakeAmount: number;
  demo?: boolean;
};

export default function DemoVoiceChat({ stakeAmount, demo = false }: DemoVoiceChatProps) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [client, setClient] = useState<IAgoraRTCClient | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [participants, setParticipants] = useState<{ uid: string | number; speaking: boolean }[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const isPremium = stakeAmount >= 50000;
  const { toast } = useToast();

  // Initialize Agora client
  useEffect(() => {
    try {
      const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(agoraClient);
      setInitialized(true);
    } catch (err) {
      console.error("Failed to create Agora client:", err);
      setError("Failed to initialize voice chat. Please try again later.");
    }
  }, []);

  // Handle join/leave channel
  const handleJoinChannel = async () => {
    if (!client) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Add self to participants list first with a random UID for demo
      const demoUid = Math.floor(Math.random() * 1000000);
      setParticipants(prev => [...prev, { uid: demoUid, speaking: false }]);

      // Create demo channel name
      const channelName = `demo-channel-${Math.floor(Math.random() * 1000)}`;

      // In a real implementation, you would get a token from your server
      // For demo purposes, we'll use no authentication
      if (!import.meta.env.VITE_AGORA_APP_ID) {
        throw new Error("Agora App ID is missing");
      }
      
      await client.join(
        import.meta.env.VITE_AGORA_APP_ID,
        channelName,
        null, // No token for testing
        demoUid
      );
      
      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await client.publish([audioTrack]);
      setLocalAudioTrack(audioTrack);
      
      // Add demo remote users for demonstration
      setTimeout(() => {
        const demoUsers = [
          { uid: Math.floor(Math.random() * 1000000), speaking: false },
          { uid: Math.floor(Math.random() * 1000000), speaking: false }
        ];
        setParticipants(prev => [...prev, ...demoUsers]);
        
        // Simulate users speaking occasionally
        const speakingInterval = setInterval(() => {
          setParticipants(prev => 
            prev.map(p => ({
              ...p,
              speaking: p.uid === demoUid ? micMuted ? false : Math.random() > 0.7 : Math.random() > 0.7
            }))
          );
        }, 1000);
        
        return () => clearInterval(speakingInterval);
      }, 2000);
      
      setJoined(true);
      
      toast({
        title: isPremium ? "Premium Voice Chat" : "Voice Chat Connected",
        description: isPremium ? 
          "You've joined the premium voice channel with enhanced audio quality." : 
          "You've joined the voice chat channel.",
      });
    } catch (err: any) {
      console.error("Error joining channel:", err);
      setError(`Failed to join voice chat: ${err.message}`);
      toast({
        title: "Voice Chat Error",
        description: `Failed to join: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleLeaveChannel = async () => {
    if (!client || !localAudioTrack) return;
    
    try {
      localAudioTrack.close();
      await client.leave();
      setLocalAudioTrack(null);
      setParticipants([]);
      setJoined(false);
      toast({
        title: "Voice Chat Disconnected",
        description: "You've left the voice chat channel.",
      });
    } catch (err: any) {
      console.error("Error leaving channel:", err);
      toast({
        title: "Error",
        description: `Failed to leave voice chat: ${err.message}`,
        variant: "destructive",
      });
    }
  };
  
  const toggleMute = () => {
    if (!localAudioTrack) return;
    
    if (micMuted) {
      localAudioTrack.setEnabled(true);
      setMicMuted(false);
      toast({
        title: "Microphone Unmuted",
        description: "Others can now hear you speaking.",
      });
    } else {
      localAudioTrack.setEnabled(false);
      setMicMuted(true);
      toast({
        title: "Microphone Muted",
        description: "Your microphone has been muted.",
      });
    }
  };
  
  // Auto-join premium voice chat
  useEffect(() => {
    if (initialized && isPremium && !joined && !loading && demo) {
      handleJoinChannel();
    }
  }, [initialized, isPremium, joined, loading, demo]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (joined && client && localAudioTrack) {
        localAudioTrack.close();
        client.leave();
      }
    };
  }, [joined, client, localAudioTrack]);
  
  if (!initialized) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Initializing voice chat...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-64">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-destructive font-medium mb-2">Voice Chat Error</p>
        <p className="text-gray-500 text-center mb-4">{error}</p>
        <Button 
          onClick={() => setError(null)}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className={`voice-chat-container p-4 rounded-lg ${isPremium ? 'relative overflow-hidden' : ''}`}>
      {/* Premium Glow Effect */}
      {isPremium && (
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-lg blur-md opacity-50"></div>
      )}
      
      {/* Premium Badge */}
      {isPremium && (
        <div className="premium-badge mb-4 flex items-center justify-center relative z-10">
          <div className="bg-gradient-to-r from-amber-300 to-yellow-500 text-black font-bold py-1 px-3 rounded-full flex items-center text-sm animate-pulse">
            <span className="mr-1">⭐</span> Premium Voice Channel
          </div>
        </div>
      )}
      
      {/* Voice Chat Interface */}
      <div className={`${isPremium ? 'border-2 border-yellow-300 shadow-lg' : 'border border-gray-200'} rounded-lg p-4 bg-gray-50 relative z-10`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Radio className={`h-5 w-5 ${isPremium ? 'text-yellow-500' : 'text-blue-500'} mr-2`} />
            <h3 className={`font-medium ${isPremium ? 'text-yellow-700' : 'text-gray-700'}`}>
              {isPremium ? 'Premium Voice Chat' : 'Voice Chat'}
            </h3>
          </div>
          
          {!joined ? (
            <Button
              onClick={handleJoinChannel}
              disabled={loading}
              className={`${isPremium ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600' : ''}`}
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Join Voice
                </>
              )}
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                onClick={toggleMute}
                variant="outline"
                size="sm"
                className={micMuted ? 'bg-red-50 text-red-500 border-red-200' : ''}
              >
                {micMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleLeaveChannel}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-500 hover:bg-red-50"
              >
                Leave
              </Button>
            </div>
          )}
        </div>
        
        {/* Participants */}
        <div className="space-y-3 mt-4">
          <h4 className="text-sm font-medium text-gray-500">Participants</h4>
          
          {participants.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No one in voice channel</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {participants.map((participant, index) => (
                <div 
                  key={participant.uid.toString() + index}
                  className={`flex items-center p-2 rounded-lg ${
                    participant.speaking 
                      ? 'bg-green-50 border border-green-100' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    participant.speaking ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm truncate">
                    {index === 0 ? 'You' : `Player ${index}`}
                  </span>
                  {participant.speaking && (
                    <div className="ml-auto flex space-x-1">
                      <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse delay-75"></div>
                      <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Premium Features Note */}
        {isPremium && (
          <div className="mt-4 p-2 bg-amber-50 border border-amber-100 rounded text-sm text-amber-700">
            <p className="font-medium">Premium Features Enabled:</p>
            <ul className="list-disc list-inside text-xs mt-1 space-y-1">
              <li>Enhanced audio quality (48kHz sampling)</li>
              <li>Reduced latency communication</li>
              <li>Noise suppression technology</li>
              <li>Auto-connect on game start</li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Premium styling is handled by Tailwind classes */}
    </div>
  );
}
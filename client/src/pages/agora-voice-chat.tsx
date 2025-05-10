import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalAudioTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

// Define the Agora App ID - coming from environment variables
const AGORA_APP_ID = process.env.AGORA_APP_ID as string;

export default function AgoraVoiceChat() {
  const { toast } = useToast();
  const [channelName, setChannelName] = useState("test-channel");
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [users, setUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [remoteAudioLevels, setRemoteAudioLevels] = useState<{[uid: string]: number}>({});
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState<string>("");
  const [microphoneList, setMicrophoneList] = useState<MediaDeviceInfo[]>([]);

  // References for Agora objects
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const uidRef = useRef<string>(Math.random().toString(36).substring(2, 15));
  
  // Audio level detection interval
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Agora client
  useEffect(() => {
    if (!AGORA_APP_ID) {
      toast({
        title: "Missing Agora App ID",
        description: "Please provide an Agora App ID to enable voice chat",
        variant: "destructive"
      });
      return;
    }

    // Create Agora client
    clientRef.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // Listen for remote users joining
    clientRef.current.on("user-published", async (user, mediaType) => {
      await clientRef.current?.subscribe(user, mediaType);
      
      if (mediaType === "audio") {
        // Play remote audio when user publishes
        user.audioTrack?.play();
        
        // Update users list with new remote user
        setUsers(prevUsers => {
          if (!prevUsers.find(u => u.uid === user.uid)) {
            return [...prevUsers, user];
          }
          return prevUsers;
        });
      }
    });
    
    // Listen for remote users leaving
    clientRef.current.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") {
        // Remove user from users list when they leave
        setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
      }
    });
    
    return () => {
      // Clean up when component unmounts
      leaveChannel();
    };
  }, [toast]);
  
  // Get available microphones
  useEffect(() => {
    const getMicrophones = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphones = devices.filter(device => device.kind === "audioinput");
        setMicrophoneList(microphones);
        
        // Set default microphone
        if (microphones.length > 0 && !selectedMicrophoneId) {
          setSelectedMicrophoneId(microphones[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting microphones:", error);
      }
    };
    
    getMicrophones();
  }, [selectedMicrophoneId]);

  // Join channel function
  const joinChannel = async () => {
    if (!AGORA_APP_ID) {
      toast({
        title: "Missing Agora App ID",
        description: "Please provide an Agora App ID to enable voice chat",
        variant: "destructive"
      });
      return;
    }
    
    if (!channelName) {
      toast({
        title: "Missing Channel Name",
        description: "Please enter a channel name to join",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Join the channel
      await clientRef.current?.join(AGORA_APP_ID, channelName, null, uidRef.current);
      
      // Create and publish local audio track
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: selectedMicrophoneId || undefined,
        encoderConfig: {
          sampleRate: 48000,
          stereo: false,
          bitrate: 128
        }
      });
      
      localAudioTrackRef.current = audioTrack;
      await clientRef.current?.publish([audioTrack]);
      
      // Set up audio level monitoring
      startAudioLevelMonitoring();
      
      setIsJoined(true);
      setIsMuted(false);
      
      toast({
        title: "Joined Voice Channel",
        description: `You have joined the channel: ${channelName}`
      });
    } catch (error) {
      console.error("Error joining channel:", error);
      toast({
        title: "Join Failed",
        description: `Failed to join channel: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Leave channel function
  const leaveChannel = async () => {
    if (!isJoined) return;
    
    try {
      setIsLoading(true);
      
      // Stop audio level monitoring
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }
      
      // Release audio track and leave channel
      localAudioTrackRef.current?.close();
      await clientRef.current?.leave();
      
      localAudioTrackRef.current = null;
      setIsJoined(false);
      setUsers([]);
      setAudioLevel(0);
      setRemoteAudioLevels({});
      
      toast({
        title: "Left Voice Channel",
        description: `You have left the channel: ${channelName}`
      });
    } catch (error) {
      console.error("Error leaving channel:", error);
      toast({
        title: "Leave Failed",
        description: `Failed to leave channel: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle mute function
  const toggleMute = async () => {
    if (!localAudioTrackRef.current) return;
    
    try {
      if (isMuted) {
        // Unmute
        await localAudioTrackRef.current.setEnabled(true);
        setIsMuted(false);
        
        toast({
          title: "Microphone Unmuted",
          description: "Others can now hear you"
        });
      } else {
        // Mute
        await localAudioTrackRef.current.setEnabled(false);
        setIsMuted(true);
        
        toast({
          title: "Microphone Muted",
          description: "Others cannot hear you now"
        });
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
      toast({
        title: "Action Failed",
        description: `Failed to ${isMuted ? "unmute" : "mute"}: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    }
  };

  // Start audio level monitoring
  const startAudioLevelMonitoring = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }
    
    audioLevelIntervalRef.current = setInterval(() => {
      // Monitor local audio level
      if (localAudioTrackRef.current) {
        const level = localAudioTrackRef.current.getVolumeLevel();
        setAudioLevel(level);
      }
      
      // Monitor remote users' audio levels
      const newRemoteAudioLevels: {[uid: string]: number} = {};
      users.forEach(user => {
        if (user.audioTrack) {
          const level = user.audioTrack.getVolumeLevel();
          newRemoteAudioLevels[user.uid as string] = level;
        }
      });
      setRemoteAudioLevels(newRemoteAudioLevels);
    }, 100);
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Agora Voice Chat</CardTitle>
          <CardDescription>
            Join a voice channel to chat with other players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isJoined ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  placeholder="Enter channel name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              {microphoneList.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="microphone-select">Microphone</Label>
                  <select
                    id="microphone-select"
                    className="w-full p-2 border rounded-md"
                    value={selectedMicrophoneId}
                    onChange={(e) => setSelectedMicrophoneId(e.target.value)}
                    disabled={isLoading || isJoined}
                  >
                    {microphoneList.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `Microphone ${mic.deviceId.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={joinChannel} 
                disabled={isLoading || !channelName}
              >
                {isLoading ? "Joining..." : "Join Voice Channel"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Channel: {channelName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {users.length} other {users.length === 1 ? "player" : "players"} in channel
                  </p>
                </div>
                <Badge variant={isMuted ? "destructive" : "outline"}>
                  {isMuted ? "Muted" : "Speaking"}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label>Your Voice</Label>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      YOU
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-200"
                        style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={toggleMute}
                    disabled={isLoading}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>
                </div>
              </div>
              
              {users.length > 0 && (
                <div className="space-y-2">
                  <Label>Other Players</Label>
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.uid} className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {String(user.uid).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Player {String(user.uid).substring(0, 6)}</p>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all duration-200"
                              style={{ width: `${Math.min((remoteAudioLevels[user.uid as string] || 0) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        {remoteAudioLevels[user.uid as string] > 0.01 ? (
                          <Volume2 size={18} className="text-green-500" />
                        ) : (
                          <VolumeX size={18} className="text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                variant="destructive" 
                onClick={leaveChannel}
                disabled={isLoading}
              >
                {isLoading ? "Leaving..." : "Leave Voice Channel"}
              </Button>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Troubleshooting Tips</h4>
            <ul className="space-y-1">
              <li>• Make sure your microphone is enabled in browser settings</li>
              <li>• If others can't hear you, try a different microphone</li>
              <li>• Voice chat is only enabled for high-stake games (₦20,000+)</li>
              <li>• For the best experience, use headphones</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
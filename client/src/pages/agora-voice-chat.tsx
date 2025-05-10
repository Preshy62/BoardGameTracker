import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, VolumeX, Volume2 } from "lucide-react";
import { useVoiceChat } from "@/hooks/use-voice-chat";

export default function AgoraVoiceChat() {
  const [customChannelName, setCustomChannelName] = useState("test-channel");
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    isJoined,
    isMuted,
    remoteUsers,
    audioLevel,
    remoteAudioLevels,
    channelName,
    microphoneList,
    selectedMicrophoneId,
    setSelectedMicrophoneId,
    joinChannel,
    leaveChannel,
    toggleMute,
    isSupported,
  } = useVoiceChat();

  // Handler for joining a channel
  const handleJoin = async () => {
    if (!customChannelName) return;
    
    setIsLoading(true);
    await joinChannel({ 
      channelName: customChannelName,
      microphoneId: selectedMicrophoneId
    });
    setIsLoading(false);
  };

  // Handler for leaving a channel
  const handleLeave = async () => {
    setIsLoading(true);
    await leaveChannel();
    setIsLoading(false);
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
          {!isSupported() && (
            <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md mb-4">
              Your browser doesn't support voice chat features. Please try using Chrome, Firefox, or Edge.
            </div>
          )}
          
          {!isJoined ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  placeholder="Enter channel name"
                  value={customChannelName}
                  onChange={(e) => setCustomChannelName(e.target.value)}
                  disabled={isLoading || !isSupported()}
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
                    disabled={isLoading || isJoined || !isSupported()}
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
                onClick={handleJoin} 
                disabled={isLoading || !customChannelName || !isSupported()}
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
                    {remoteUsers.length} other {remoteUsers.length === 1 ? "player" : "players"} in channel
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
              
              {remoteUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Other Players</Label>
                  <div className="space-y-3">
                    {remoteUsers.map((user) => (
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
                onClick={handleLeave}
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
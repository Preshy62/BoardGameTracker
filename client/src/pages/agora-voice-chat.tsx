import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, VolumeX, Volume2, Lock, ShieldAlert } from "lucide-react";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";

// Access password - must match the one in voice-tools.tsx
const ACCESS_PASSWORD = "admin123";

export default function AgoraVoiceChat() {
  const [customChannelName, setCustomChannelName] = useState("test-channel");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Check for stored authentication
  useEffect(() => {
    const storedAuth = localStorage.getItem("voice_tools_authenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);
  
  // For debugging - log available environment variables
  useEffect(() => {
    console.log('Environment check:');
    console.log('VITE_AGORA_APP_ID available:', !!import.meta.env.VITE_AGORA_APP_ID);
    
    // Check if the App ID seems valid (should be a string of letters and numbers)
    if (import.meta.env.VITE_AGORA_APP_ID) {
      const appId = import.meta.env.VITE_AGORA_APP_ID as string;
      const isValidFormat = /^[a-zA-Z0-9]{1,100}$/.test(appId);
      console.log('VITE_AGORA_APP_ID format valid:', isValidFormat);
      
      if (!isValidFormat) {
        setErrorMessage(`App ID format appears invalid. It should contain only letters and numbers.`);
      }
    } else {
      setErrorMessage('Missing Agora App ID. Please check environment variables.');
    }
  }, []);
  
  // Add redirect if not authenticated
  useEffect(() => {
    // Redirect non-admin, non-authenticated users to admin page
    if (user && !isAuthenticated && !isAdmin) {
      toast({
        title: "Access Restricted",
        description: "This page requires authentication. Redirecting to admin panel.",
        variant: "destructive",
      });
      setLocation("/admin/voice-tools");
    } else if (!user) {
      // If not logged in, redirect to login
      toast({
        title: "Login Required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, isAuthenticated, isAdmin, setLocation, toast]);
  
  // Verify entered password
  const verifyPassword = () => {
    if (password === ACCESS_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
      localStorage.setItem("voice_tools_authenticated", "true");
      toast({
        title: "Access Granted",
        description: "You now have access to the voice testing tools",
      });
    } else {
      setAuthError("Incorrect password");
      toast({
        title: "Access Denied",
        description: "The password you entered is incorrect",
        variant: "destructive",
      });
    }
  };
  
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
    
    // Clear previous errors
    setErrorMessage(null);
    setIsLoading(true);
    
    try {
      const success = await joinChannel({ 
        channelName: customChannelName,
        microphoneId: selectedMicrophoneId,
        onError: (error) => {
          console.error('Join error:', error);
          setErrorMessage(`Failed to join: ${error.message || 'Unknown error'}`);
        }
      });
      
      if (!success) {
        setErrorMessage('Failed to join the voice channel. Please check the console for more details.');
      }
    } catch (error) {
      console.error('Join channel error:', error);
      setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for leaving a channel
  const handleLeave = async () => {
    setIsLoading(true);
    await leaveChannel();
    setIsLoading(false);
  };

  // If user is not authenticated and not an admin, show password form
  if (user && !isAuthenticated && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="border-2 border-primary/20">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2 text-primary">
              <ShieldAlert className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl text-center">Restricted Access</CardTitle>
            <CardDescription className="text-center">
              This page contains developer tools for voice chat testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Access Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {authError && (
                  <p className="text-sm text-red-500">{authError}</p>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setLocation("/admin/voice-tools")}>
                  Back to Admin
                </Button>
                <Button onClick={verifyPassword}>
                  <Lock className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal page content for authenticated users
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
          
          {errorMessage && (
            <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded-md mb-4">
              <p className="font-medium">Error:</p>
              <p>{errorMessage}</p>
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
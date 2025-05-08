import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SimpleVoiceChat() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [roomId] = useState("simple-test-room");
  const [peerId, setPeerId] = useState("");
  const [inputLevel, setInputLevel] = useState(0);
  const [lastReceivedAudio, setLastReceivedAudio] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Function to create a websocket connection
  const createWebSocketConnection = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      const tempPeerId = `user-${Math.floor(Math.random() * 10000)}`;
      setPeerId(tempPeerId);
      
      ws.send(JSON.stringify({
        type: "join_game",
        payload: { gameId: roomId, peerId: tempPeerId },
      }));
      
      setIsConnected(true);
      setIsConnecting(false);
      
      toast({
        title: "Connected to voice chat",
        description: "You can now talk to others in the room",
      });
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "voice_data" && message.payload.audioData) {
          console.log("Received voice data");
          
          // Play the received audio
          if (audioElementRef.current) {
            audioElementRef.current.src = message.payload.audioData;
            audioElementRef.current.play()
              .catch(err => {
                console.error("Error playing received audio:", err);
                // Try to unlock audio on error
                unlockAudio();
              });
          }
          
          // Store the last received audio for display
          setLastReceivedAudio(message.payload.audioData);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnecting(false);
      toast({
        title: "Connection error",
        description: "Failed to connect to voice chat server",
        variant: "destructive",
      });
    };
    
    ws.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
    };
    
    return ws;
  }, [roomId, toast]);
  
  // Function to start recording and sending audio
  const startTalking = useCallback(() => {
    if (!isConnected || !localStreamRef.current || !wsRef.current) return;
    
    setIsTalking(true);
    audioChunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(localStreamRef.current, {
      mimeType: 'audio/webm;codecs=opus',
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      if (audioChunksRef.current.length === 0 || !wsRef.current) return;
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "voice_data",
            payload: {
              audioData: reader.result,
              roomId,
              peerId,
            },
          }));
        }
      };
      
      reader.readAsDataURL(audioBlob);
    };
    
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    
    // Stop after a short time to send chunks regularly
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
        if (isTalking) {
          startTalking(); // Continue recording if still talking
        }
      }
    }, 500); // Record in 500ms chunks
    
  }, [isConnected, roomId, peerId, isTalking]);
  
  // Function to stop talking
  const stopTalking = useCallback(() => {
    setIsTalking(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);
  
  // Function to connect to the voice chat
  const connectToVoiceChat = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      localStreamRef.current = stream;
      
      // Set up audio analyzer for the input level
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioAnalyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      // Create WebSocket connection
      const ws = createWebSocketConnection();
      wsRef.current = ws;
      
      // Unlock audio context
      unlockAudio();
      
      // Set up animation loop to check audio levels
      const checkAudioLevel = () => {
        if (audioAnalyserRef.current && dataArrayRef.current) {
          audioAnalyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Calculate average level
          const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / 
                        dataArrayRef.current.length;
          
          setInputLevel(average);
          
          if (isConnected) {
            requestAnimationFrame(checkAudioLevel);
          }
        }
      };
      
      requestAnimationFrame(checkAudioLevel);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsConnecting(false);
      toast({
        title: "Microphone access error",
        description: "Please allow microphone access to use voice chat",
        variant: "destructive",
      });
    }
  }, [createWebSocketConnection, isConnected, toast]);
  
  // Function to disconnect from voice chat
  const disconnectVoiceChat = useCallback(() => {
    // Stop talking if currently talking
    if (isTalking) {
      stopTalking();
    }
    
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    // Stop local audio stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsTalking(false);
    setPeerId("");
  }, [isTalking, stopTalking]);
  
  // Helper function to unlock audio
  const unlockAudio = useCallback(() => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.001);
      console.log("Audio unlocked");
    } catch (e) {
      console.error("Error unlocking audio:", e);
    }
  }, []);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      disconnectVoiceChat();
    };
  }, [disconnectVoiceChat]);
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Simple Voice Chat</CardTitle>
          <CardDescription>
            Press and hold the Talk button while speaking. Open this page in another tab to test.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            {!isConnected && !isConnecting ? (
              <Button onClick={connectToVoiceChat}>
                Connect to Voice Chat
              </Button>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4">
                  <Button
                    size="lg"
                    className={`h-24 w-24 rounded-full text-base ${isTalking ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                    onMouseDown={startTalking}
                    onMouseUp={stopTalking}
                    onTouchStart={startTalking}
                    onTouchEnd={stopTalking}
                    onMouseLeave={() => {
                      if (isTalking) stopTalking();
                    }}
                  >
                    {isTalking ? 'Release' : 'Push to Talk'}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-40 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ width: `${Math.min(100, inputLevel * 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Level: {Math.round(inputLevel)}
                    </span>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={unlockAudio}
                  className="mt-2"
                >
                  Unlock Audio
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={disconnectVoiceChat}
                  className="mt-4"
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
          
          <div className="mt-8 border p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Audio Player</h3>
            <audio 
              ref={audioElementRef}
              controls 
              className="w-full" 
              autoPlay 
            />
            <p className="text-xs text-muted-foreground mt-2">
              This player will automatically play received audio.
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground mt-6 pt-4 border-t">
            <p>Room: <span className="font-mono">{roomId}</span></p>
            {peerId && <p>Your ID: <span className="font-mono">{peerId}</span></p>}
            <p>Status: {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}</p>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Troubleshooting Tips</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Make sure your microphone is working and not muted</li>
              <li>• If you can't hear audio, try clicking the Unlock Audio button</li>
              <li>• Open this page in two browser tabs to test the voice chat</li>
              <li>• Press and hold the Talk button while speaking, release when done</li>
              <li>• Try using Chrome for the best compatibility</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function VoiceChatTest() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roomId, setRoomId] = useState("test-room");
  const [peerId, setPeerId] = useState("");
  const [inputLevel, setInputLevel] = useState(0);
  const [remoteSoundDetected, setRemoteSoundDetected] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const createPeerConnection = () => {
    // Using free public STUN servers
    const config: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(config);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "voice_ice_candidate",
          payload: {
            candidate: event.candidate,
            roomId,
            peerId,
          },
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Voice chat connected!",
          description: "You are now connected to the voice chat",
        });
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setIsConnected(false);
        toast({
          title: "Voice chat disconnected",
          description: "The voice chat connection was lost",
          variant: "destructive",
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("Remote track received!", event.streams);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
        
        // Try to play audio immediately
        remoteAudioRef.current.play().catch(e => {
          console.error("Error playing remote audio:", e);
          
          // If autoplay failed, show a button to play manually
          toast({
            title: "Audio playback issue",
            description: "Try clicking a button on the page to enable audio playback",
            variant: "destructive",
          });
        });
      }
    };

    return pc;
  };

  const connectToVoiceChat = async () => {
    try {
      setIsConnecting(true);
      // Get local audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Mute local audio to prevent feedback
      }

      // Create a temporary peer ID
      const tempPeerId = `user-${Math.floor(Math.random() * 10000)}`;
      setPeerId(tempPeerId);

      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({
          type: "join_voice",
          payload: {
            roomId,
            peerId: tempPeerId,
          },
        }));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        console.log("Received message:", message);

        switch (message.type) {
          case "voice_user_joined":
            if (message.payload.peerId !== tempPeerId) {
              // Create peer connection when another user joins
              const pc = createPeerConnection();
              peerConnectionRef.current = pc;
              
              // Add local tracks to the connection
              stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
              });
              
              // Create and send offer
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              ws.send(JSON.stringify({
                type: "voice_offer",
                payload: {
                  offer: pc.localDescription,
                  roomId,
                  peerId: tempPeerId,
                  targetPeerId: message.payload.peerId,
                },
              }));
            }
            break;
            
          case "voice_offer":
            if (message.payload.targetPeerId === tempPeerId) {
              const pc = createPeerConnection();
              peerConnectionRef.current = pc;
              
              // Add local tracks to the connection
              stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
              });
              
              // Set remote description (the offer)
              await pc.setRemoteDescription(new RTCSessionDescription(message.payload.offer));
              
              // Create and send answer
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              
              ws.send(JSON.stringify({
                type: "voice_answer",
                payload: {
                  answer: pc.localDescription,
                  roomId,
                  peerId: tempPeerId,
                  targetPeerId: message.payload.peerId,
                },
              }));
            }
            break;
            
          case "voice_answer":
            if (message.payload.targetPeerId === tempPeerId && peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(
                new RTCSessionDescription(message.payload.answer)
              );
            }
            break;
            
          case "voice_ice_candidate":
            if (peerConnectionRef.current) {
              try {
                await peerConnectionRef.current.addIceCandidate(
                  new RTCIceCandidate(message.payload.candidate)
                );
              } catch (e) {
                console.error("Error adding received ice candidate", e);
              }
            }
            break;
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
        setIsConnecting(false);
        setIsConnected(false);
      };

    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsConnecting(false);
      toast({
        title: "Microphone access error",
        description: "Please allow microphone access to use voice chat",
        variant: "destructive",
      });
    }
  };

  const disconnectVoiceChat = () => {
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Stop all tracks in the local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "voice_leave",
          payload: {
            roomId,
            peerId,
          },
        }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setPeerId("");
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      disconnectVoiceChat();
    };
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Voice Chat Test</CardTitle>
          <CardDescription>
            Test voice chat functionality by opening this page in two browser windows or devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            Room ID: <span className="font-mono bg-muted p-1 rounded">{roomId}</span>
            {peerId && (
              <div>
                Your Peer ID: <span className="font-mono bg-muted p-1 rounded">{peerId}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-center space-x-2">
            {!isConnected && !isConnecting ? (
              <Button onClick={connectToVoiceChat}>
                Connect to Voice Chat
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={toggleMute}
                  className={isMuted ? "bg-red-100" : ""}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={disconnectVoiceChat}
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
          
          <div className="text-center text-sm">
            {isConnecting && <p>Connecting...</p>}
            {isConnected && <p className="text-green-600">Connected! Try speaking.</p>}
          </div>
          
          <div className="text-xs text-muted-foreground mt-6">
            <p>Connection status: {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}</p>
            <p>Microphone: {isMuted ? "Muted" : "Active"}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Audio elements for streams (visible for debugging) */}
      <div className="mt-8 border p-4 rounded-md">
        <h3 className="text-sm font-medium mb-2">Audio Debugging</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs mb-1">Your microphone (muted locally to prevent feedback):</p>
            <audio 
              ref={localAudioRef} 
              autoPlay 
              playsInline 
              muted 
              controls 
              className="w-full h-10" 
            />
          </div>
          <div>
            <p className="text-xs mb-1">Remote audio (should hear other person here):</p>
            <audio 
              ref={remoteAudioRef} 
              autoPlay 
              playsInline 
              controls 
              className="w-full h-10" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              If you see no volume activity when the other person speaks, try clicking the play button above
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
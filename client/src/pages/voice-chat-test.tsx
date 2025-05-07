import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function VoiceChatTest() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roomId, setRoomId] = useState("test-room");
  const [peerId, setPeerId] = useState("");
  const [inputLevel, setInputLevel] = useState(0);
  const [remoteSoundDetected, setRemoteSoundDetected] = useState(false);
  const [useDirectMode, setUseDirectMode] = useState(true);
  
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
        
        if (useDirectMode) {
          // Direct mode - minimal processing, just connect the stream to audio
          console.log("Using direct mode for audio");
          
          // Force unmute
          if (remoteAudioRef.current.muted) {
            remoteAudioRef.current.muted = false;
          }
          
          // Set volume to max
          remoteAudioRef.current.volume = 1.0;
          
          // Try to play audio immediately using multiple methods
          const playPromise = remoteAudioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.error("Direct mode: Error playing remote audio:", e);
              toast({
                title: "Audio playback blocked",
                description: "Please click anywhere on the page to enable audio",
                variant: "destructive",
              });
              
              // Setup listener for user interaction to try playing again
              const handleUserInteraction = () => {
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.play()
                    .then(() => {
                      document.removeEventListener('click', handleUserInteraction);
                      document.removeEventListener('keydown', handleUserInteraction);
                      console.log("Audio started after user interaction");
                    })
                    .catch(err => console.error("Still couldn't play audio:", err));
                }
              };
              
              document.addEventListener('click', handleUserInteraction);
              document.addEventListener('keydown', handleUserInteraction);
            });
          }
        } else {
          // Original mode with audio analysis
          try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(event.streams[0]);
            const remoteAnalyser = audioContext.createAnalyser();
            remoteAnalyser.fftSize = 256;
            source.connect(remoteAnalyser);
            
            const bufferLength = remoteAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            // Check remote audio levels
            const checkRemoteAudio = () => {
              remoteAnalyser.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
              
              if (average > 5) {  // Threshold for sound detection
                setRemoteSoundDetected(true);
                console.log("Remote sound detected!", average);
              } else {
                setRemoteSoundDetected(false);
              }
              
              if (isConnected) {
                requestAnimationFrame(checkRemoteAudio);
              }
            };
            
            requestAnimationFrame(checkRemoteAudio);
          } catch (err) {
            console.error("Error setting up remote audio analysis:", err);
          }
          
          // Try to play audio immediately
          remoteAudioRef.current.play().catch(e => {
            console.error("Error playing remote audio:", e);
            
            // If autoplay failed, show a button to play manually
            toast({
              title: "Audio playback issue",
              description: "Try clicking the Force Play button below the audio player",
              variant: "destructive",
            });
          });
        }
      }
    };

    return pc;
  };

  const connectToVoiceChat = async () => {
    try {
      setIsConnecting(true);
      // Get local audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      localStreamRef.current = stream;
      
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
        localAudioRef.current.muted = true; // Mute local audio to prevent feedback
      }
      
      // Set up audio analyser to monitor microphone input levels
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioAnalyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      
      // Set up animation loop to check audio levels
      const checkAudioLevel = () => {
        if (audioAnalyserRef.current && dataArrayRef.current) {
          audioAnalyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          // Calculate average level
          const average = dataArrayRef.current.reduce((sum, value) => sum + value, 0) / 
                          dataArrayRef.current.length;
          
          setInputLevel(average);
          
          if (isConnected && !isMuted) {
            requestAnimationFrame(checkAudioLevel);
          }
        }
      };
      
      requestAnimationFrame(checkAudioLevel);

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
          
          <div className="flex justify-center space-x-2 flex-wrap">
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
                  variant="outline"
                  onClick={() => {
                    try {
                      // Play a short sound to unlock audio
                      const audioContext = new AudioContext();
                      const oscillator = audioContext.createOscillator();
                      oscillator.type = 'sine';
                      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                      oscillator.connect(audioContext.destination);
                      oscillator.start();
                      oscillator.stop(audioContext.currentTime + 0.1);
                      
                      toast({
                        title: "Audio Unlocked",
                        description: "Browser audio should now be unlocked",
                      });
                    } catch (e) {
                      console.error("Error unlocking audio:", e);
                    }
                  }}
                >
                  Unlock Audio
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
            
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <Switch
                id="direct-mode"
                checked={useDirectMode}
                onCheckedChange={setUseDirectMode}
              />
              <Label htmlFor="direct-mode" className="text-sm text-primary">
                Use Direct Mode
                <p className="text-xs text-muted-foreground mt-1">
                  Direct mode bypasses audio analysis for better compatibility
                </p>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Audio elements for streams (visible for debugging) */}
      <div className="mt-8 border p-4 rounded-md">
        <h3 className="text-sm font-medium mb-2">Audio Debugging</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs">Your microphone (muted locally to prevent feedback):</p>
              {isConnected && (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-32 bg-gray-200 rounded overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all" 
                      style={{ width: `${Math.min(100, inputLevel / 2)}%` }}
                    />
                  </div>
                  <span className="text-xs">{Math.round(inputLevel)}</span>
                </div>
              )}
            </div>
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
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs">Remote audio (should hear other person here):</p>
              {isConnected && (
                <div className={`px-2 py-0.5 text-xs rounded ${remoteSoundDetected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {remoteSoundDetected ? 'Sound detected!' : 'No sound detected'}
                </div>
              )}
            </div>
            <audio 
              ref={remoteAudioRef} 
              autoPlay 
              playsInline 
              controls 
              className="w-full h-10" 
              onPlaying={() => console.log("Remote audio is playing!")}
              onError={(e) => console.error("Remote audio error:", e)}
            />
            <div className="text-xs text-muted-foreground mt-1 space-y-1">
              <p>
                {useDirectMode ? 
                  <span className="text-green-600 font-medium">Direct Mode Active: </span> : 
                  <span>Direct Mode Inactive: </span>
                }
                If you see no volume activity when the other person speaks, try clicking the play button above
              </p>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  if (remoteAudioRef.current) {
                    try {
                      // Force audio to be unmuted and volume up
                      remoteAudioRef.current.muted = false;
                      remoteAudioRef.current.volume = 1.0;
                      
                      // Create and play a short beep to unlock audio
                      const audioContext = new AudioContext();
                      const oscillator = audioContext.createOscillator();
                      oscillator.type = 'sine';
                      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                      oscillator.connect(audioContext.destination);
                      oscillator.start();
                      oscillator.stop(audioContext.currentTime + 0.1);
                      
                      // After a short delay, try to play the remote audio
                      setTimeout(() => {
                        if (remoteAudioRef.current) {
                          console.log("Trying force play after audio context");
                          remoteAudioRef.current.play()
                            .then(() => {
                              console.log("Remote audio playback started manually!");
                              toast({
                                title: "Audio started",
                                description: "Remote audio should now be playing",
                              });
                            })
                            .catch(e => {
                              console.error("Manual play still failed:", e);
                              toast({
                                title: "Audio play failed",
                                description: "Try clicking the audio controls directly",
                                variant: "destructive"
                              });
                            });
                        }
                      }, 200);
                    } catch (e) {
                      console.error("Force play error:", e);
                    }
                  }
                }}
              >
                Force Play with Sound Unlock
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Troubleshooting Tips</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Make sure your microphone is working and not muted in system settings</li>
            <li>• Try a different browser (Chrome or Firefox recommended)</li>
            <li>• If on mobile, try a desktop browser</li>
            <li>• Check if you have granted microphone permissions</li>
            <li>• Input level should move when you speak if microphone is working</li>
            <li className="font-medium text-green-700">• Try using Direct Mode (toggle switch above) for better audio compatibility</li>
            <li className="font-medium">• If Direct Mode still doesn't work, try disconnecting, refreshing the page, and reconnecting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
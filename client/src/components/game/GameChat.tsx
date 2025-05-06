import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Game, GamePlayer, Message } from '@shared/schema';
import { MicIcon, MicOffIcon, SendIcon } from 'lucide-react';
import SimplePeer, { Instance as SimplePeerInstance } from 'simple-peer';

interface ChatMessage {
  id: number;
  userId: number;
  content: string;
  type: 'chat' | 'system';
  createdAt: Date;
  user?: {
    username: string;
    avatarInitials: string;
  };
}

interface GameChatProps {
  game: Game;
  currentUser: User;
  players: (GamePlayer & { user: User })[];
  messages: ChatMessage[];
  socket: WebSocket | null;
}

const GameChat = ({ game, currentUser, players, messages: initialMessages, socket }: GameChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [peers, setPeers] = useState<Record<number, SimplePeerInstance>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementsRef = useRef<Record<number, HTMLAudioElement>>({});

  // Set up voice chat if it's a high-stakes game
  useEffect(() => {
    // Voice chat is only enabled for games with stakes >= ₦20,000
    if (game?.voiceChatEnabled) {
      setVoiceChatEnabled(true);
    } else {
      setVoiceChatEnabled(false);
    }
  }, [game]);

  // WebSocket connection management
  useEffect(() => {
    if (socket) {
      setIsConnected(socket.readyState === WebSocket.OPEN);

      const handleOpen = () => {
        setIsConnected(true);
      };

      const handleClose = () => {
        setIsConnected(false);
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'chat_message') {
            const newMessage = data.payload.message;
            
            // Find user data
            const player = players.find(p => p.userId === newMessage.userId);
            
            if (player) {
              setMessages(prev => [...prev, {
                ...newMessage,
                createdAt: new Date(newMessage.createdAt),
                user: {
                  username: player.user.username,
                  avatarInitials: player.user.avatarInitials
                }
              }]);
            }
          }
          // Handle WebRTC signaling messages
          else if (data.type === 'voice_offer' && data.payload.fromUserId) {
            handleVoiceOffer(data.payload.fromUserId, data.payload.offer);
          }
          else if (data.type === 'voice_answer' && data.payload.fromUserId) {
            handleVoiceAnswer(data.payload.fromUserId, data.payload.answer);
          }
          else if (data.type === 'voice_ice_candidate' && data.payload.fromUserId) {
            handleIceCandidate(data.payload.fromUserId, data.payload.candidate);
          }
          else if (data.type === 'voice_leave' && data.payload.fromUserId) {
            handlePeerDisconnect(data.payload.fromUserId);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.addEventListener('open', handleOpen);
      socket.addEventListener('close', handleClose);
      socket.addEventListener('message', handleMessage);

      return () => {
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('close', handleClose);
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, players]);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice chat functions
  const startVoiceChat = async () => {
    if (!voiceChatEnabled) {
      toast({
        title: "Voice Chat Not Available",
        description: "Voice chat is only enabled for high-stakes games (₦20,000+).",
        variant: "destructive"
      });
      return;
    }

    try {
      // Request user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      // Initiate peer connections to all other players
      players.forEach(player => {
        // Don't create a connection to the current user
        if (player.userId !== currentUser.id) {
          createPeer(player.userId, true);
        }
      });
      
      setIsVoiceChatActive(true);
      
      toast({
        title: "Voice Chat Active",
        description: "You can now talk with other players in the game.",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Error",
        description: "Could not access your microphone. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const stopVoiceChat = () => {
    // Close all peer connections
    Object.values(peers).forEach(peer => {
      peer.destroy();
    });
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Clear audio elements
    Object.values(audioElementsRef.current).forEach(audio => {
      document.body.removeChild(audio);
    });
    
    // Reset state
    setPeers({});
    setIsVoiceChatActive(false);
    
    // Notify others
    if (socket && socket.readyState === WebSocket.OPEN) {
      players.forEach(player => {
        if (player.userId !== currentUser.id) {
          socket.send(JSON.stringify({
            type: 'voice_leave',
            payload: {
              targetUserId: player.userId
            }
          }));
        }
      });
    }
  };

  const createPeer = (userId: number, initiator: boolean) => {
    // Already have a connection to this peer
    if (peers[userId]) return;

    // Create a new peer connection
    const peer = SimplePeer({
      initiator,
      stream: localStreamRef.current!,
      trickle: true
    }) as SimplePeerInstance;

    // Set up event handlers
    peer.on('signal', (data: any) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      
      if (data.type === 'offer') {
        socket.send(JSON.stringify({
          type: 'voice_offer',
          payload: {
            targetUserId: userId,
            offer: data
          }
        }));
      } else if (data.type === 'answer') {
        socket.send(JSON.stringify({
          type: 'voice_answer',
          payload: {
            targetUserId: userId,
            answer: data
          }
        }));
      } else if (data.candidate) {
        socket.send(JSON.stringify({
          type: 'voice_ice_candidate',
          payload: {
            targetUserId: userId,
            candidate: data
          }
        }));
      }
    });

    peer.on('stream', (stream: MediaStream) => {
      // Create audio element if it doesn't exist
      if (!audioElementsRef.current[userId]) {
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.controls = false;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audioElementsRef.current[userId] = audio;
      } else {
        audioElementsRef.current[userId].srcObject = stream;
      }
    });

    peer.on('close', () => {
      handlePeerDisconnect(userId);
    });

    peer.on('error', (err: Error) => {
      console.error('Peer error:', err);
      handlePeerDisconnect(userId);
    });

    // Store the peer
    setPeers(prev => ({ ...prev, [userId]: peer }));
  };

  const handleVoiceOffer = (userId: number, offer: any) => {
    if (!localStreamRef.current) {
      // Auto-start voice chat when receiving an offer
      startVoiceChat().then(() => {
        // Once we have our stream, create the peer and handle the offer
        const peer = createPeer(userId, false);
        if (peers[userId]) {
          peers[userId].signal(offer);
        }
      });
    } else {
      // We already have voice chat active, just handle the offer
      if (!peers[userId]) {
        createPeer(userId, false);
      }
      if (peers[userId]) {
        peers[userId].signal(offer);
      }
    }
  };

  const handleVoiceAnswer = (userId: number, answer: any) => {
    if (peers[userId]) {
      peers[userId].signal(answer);
    }
  };

  const handleIceCandidate = (userId: number, candidate: any) => {
    if (peers[userId]) {
      peers[userId].signal({ candidate });
    }
  };

  const handlePeerDisconnect = (userId: number) => {
    // Clean up the peer
    if (peers[userId]) {
      peers[userId].destroy();
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    }
    
    // Clean up the audio element
    if (audioElementsRef.current[userId]) {
      document.body.removeChild(audioElementsRef.current[userId]);
      delete audioElementsRef.current[userId];
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;
    
    socket.send(JSON.stringify({
      type: 'chat_message',
      payload: {
        gameId: game.id,
        content: inputMessage.trim()
      }
    }));
    
    setInputMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp for messages
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden bg-background">
      <div className="p-2 bg-muted flex justify-between items-center border-b">
        <h3 className="font-medium">
          Game Chat {game.voiceChatEnabled && <span className="text-xs text-muted-foreground">(Voice Available)</span>}
        </h3>
        
        {voiceChatEnabled && (
          <Button 
            variant={isVoiceChatActive ? "destructive" : "secondary"} 
            size="sm" 
            onClick={isVoiceChatActive ? stopVoiceChat : startVoiceChat}
            className="flex items-center gap-1"
          >
            {isVoiceChatActive ? (
              <>
                <MicOffIcon size={14} />
                <span className="ml-1">Mute</span>
              </>
            ) : (
              <>
                <MicIcon size={14} />
                <span className="ml-1">Talk</span>
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`flex items-start gap-2 ${
                message.userId === currentUser.id ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.userId !== currentUser.id && message.type === 'chat' && (
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium"
                >
                  {message.user?.avatarInitials || '??'}
                </div>
              )}
              
              <div 
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  message.type === 'system' 
                    ? 'bg-muted text-muted-foreground italic'
                    : message.userId === currentUser.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {message.type === 'chat' && message.userId !== currentUser.id && (
                  <p className="font-semibold text-xs">
                    {message.user?.username || 'Unknown'}
                  </p>
                )}
                <p>{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block text-right">
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-2 border-t">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!isConnected || !inputMessage.trim()}
            size="icon"
          >
            <SendIcon size={18} />
          </Button>
        </div>
        {!isConnected && (
          <p className="text-destructive text-xs mt-1">
            Not connected. Please wait or refresh the page.
          </p>
        )}
      </div>
    </div>
  );
};

export default GameChat;
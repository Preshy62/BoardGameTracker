import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  text: string;
  sender: string;
  senderType: 'player' | 'opponent' | 'system';
  timestamp: Date;
}

interface DemoTextChatProps {
  stakeAmount?: number;
  demo?: boolean;
  className?: string;
}

const DemoTextChat = ({ 
  stakeAmount = 20000, 
  demo = true,
  className = ''
}: DemoTextChatProps) => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Welcome to the game chat!",
      sender: "System",
      senderType: "system",
      timestamp: new Date(Date.now() - 1000 * 60 * 5)  // 5 minutes ago
    },
    {
      id: 2,
      text: "Hi everyone, good luck!",
      sender: "Player 2",
      senderType: "opponent",
      timestamp: new Date(Date.now() - 1000 * 60 * 2)  // 2 minutes ago
    },
    {
      id: 3,
      text: "Let's play!",
      sender: "You",
      senderType: "player",
      timestamp: new Date(Date.now() - 1000 * 60)  // 1 minute ago
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [playerCount, setPlayerCount] = useState(2);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Opponent response messages for demo
  const opponentResponses = [
    "Good luck!",
    "I hope I win this round!",
    "That was close!",
    "Nice roll!",
    "I'm feeling lucky today!",
    "Let's see who wins!",
    "This is exciting!",
    "I need this win!",
    "May the odds be in my favor!",
    "Good game everyone!"
  ];
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Demo effect to show changing player count
  useEffect(() => {
    if (demo) {
      const interval = setInterval(() => {
        // Randomly change player count between 2-4 for effect
        setPlayerCount(Math.floor(Math.random() * 3) + 2);
        
        // Occasionally add an AI message
        if (Math.random() > 0.7) {
          const randomPlayerNumber = Math.floor(Math.random() * (playerCount - 1)) + 2;
          const randomMessageIndex = Math.floor(Math.random() * opponentResponses.length);
          
          addMessage({
            id: Date.now(),
            text: opponentResponses[randomMessageIndex],
            sender: `Player ${randomPlayerNumber}`,
            senderType: "opponent",
            timestamp: new Date()
          });
        }
      }, 8000);
      
      return () => clearInterval(interval);
    }
  }, [demo, playerCount]);
  
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Add player message
    addMessage({
      id: Date.now(),
      text: newMessage,
      sender: "You",
      senderType: "player",
      timestamp: new Date()
    });
    
    setNewMessage("");
    
    // Simulate opponent response after a small delay
    if (demo) {
      setTimeout(() => {
        const randomPlayerNumber = Math.floor(Math.random() * (playerCount - 1)) + 2;
        const randomResponse = Math.floor(Math.random() * opponentResponses.length);
        
        addMessage({
          id: Date.now() + 1,
          text: opponentResponses[randomResponse],
          sender: `Player ${randomPlayerNumber}`,
          senderType: "opponent",
          timestamp: new Date()
        });
      }, 1500 + Math.random() * 3000);
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className={`chat-card border-primary/20 shadow-sm ${className}`}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Game Chat
            </CardTitle>
          </div>
          
          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
            {playerCount} players
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Chat with other players in this game
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[220px] p-4" ref={scrollRef as any}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-2 ${
                  message.senderType === 'player' 
                    ? 'justify-end' 
                    : 'justify-start'
                }`}
              >
                {message.senderType !== 'player' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {message.senderType === 'system' ? (
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${
                  message.senderType === 'player' 
                    ? 'bg-primary text-primary-foreground' 
                    : message.senderType === 'system'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  } rounded-lg px-3 py-2`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-medium">
                      {message.sender}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm break-words">{message.text}</p>
                </div>
                
                {message.senderType === 'player' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-2">
        <div className="flex w-full gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            size="icon"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DemoTextChat;
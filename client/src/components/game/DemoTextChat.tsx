import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

type DemoTextChatProps = {
  stakeAmount: number;
  demo?: boolean;
};

type Message = {
  id: number;
  sender: string;
  text: string;
  time: Date;
  isSystem?: boolean;
};

// Sample messages for the demo
const DEMO_MESSAGES: Message[] = [
  {
    id: 1,
    sender: "System",
    text: "Welcome to Big Boys Game Chat!",
    time: new Date(Date.now() - 1000 * 60 * 10),
    isSystem: true,
  },
  {
    id: 2,
    sender: "Player 1",
    text: "Hi everyone! Good luck with your rolls.",
    time: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 3,
    sender: "Player 2",
    text: "Thanks! Let's have fun.",
    time: new Date(Date.now() - 1000 * 60 * 4),
  },
  {
    id: 4,
    sender: "System",
    text: "Player 3 has joined the game.",
    time: new Date(Date.now() - 1000 * 60 * 3),
    isSystem: true,
  },
  {
    id: 5,
    sender: "Player 3",
    text: "Hello everyone! Is this a premium game?",
    time: new Date(Date.now() - 1000 * 60 * 2),
  },
  {
    id: 6,
    sender: "Player 1",
    text: "Yes, it's a high stakes game with premium voice chat enabled!",
    time: new Date(Date.now() - 1000 * 60 * 1),
  },
];

export default function DemoTextChat({ stakeAmount, demo = false }: DemoTextChatProps) {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPremium = stakeAmount >= 50000;
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now(),
      sender: "You",
      text: newMessage,
      time: new Date(),
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
    
    // Simulate bot response after a short delay
    if (demo) {
      setTimeout(() => {
        const responseOptions = [
          "Good point! 👍",
          "I agree with you.",
          "Interesting strategy!",
          "Let's see who wins this round.",
          "The stones look promising today!",
          "Anyone want to place bigger bets next round?",
          "I'm feeling lucky today!",
        ];
        
        const botResponse: Message = {
          id: Date.now() + 1,
          sender: `Player ${Math.floor(Math.random() * 3) + 1}`,
          text: responseOptions[Math.floor(Math.random() * responseOptions.length)],
          time: new Date(),
        };
        
        setMessages(prev => [...prev, botResponse]);
      }, 1500);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  const getInitials = (name: string) => {
    return name === "You" 
      ? "YO" 
      : name === "System" 
        ? "SY" 
        : name.split(" ").map(part => part[0]).join("");
  };
  
  const getAvatarColor = (name: string) => {
    if (name === "System") return "bg-gray-500";
    if (name === "You") return "bg-blue-500";
    
    // Generate a consistent color based on the name
    const colors = [
      "bg-red-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    
    const hash = name.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  
  return (
    <div className={`chat-container p-4 rounded-lg ${
      isPremium ? 'border border-amber-200 bg-amber-50/30' : 'border border-gray-200'
    }`}>
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="font-medium text-gray-700">Game Chat</h3>
        {isPremium && (
          <span className="ml-2 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-bold rounded-full">
            Premium Game
          </span>
        )}
      </div>
      
      <Separator className="mb-4" />
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[80%] ${message.sender === "You" ? "flex-row-reverse" : ""}`}>
                {!message.isSystem && (
                  <Avatar className={`h-8 w-8 mr-2 ${message.sender === "You" ? "ml-2 mr-0" : ""}`}>
                    <AvatarFallback className={getAvatarColor(message.sender)}>
                      {getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div>
                  {!message.isSystem && (
                    <div className={`flex items-baseline ${message.sender === "You" ? "justify-end" : ""}`}>
                      <span className="text-xs text-gray-500 mr-1">{message.sender}</span>
                      <span className="text-xs text-gray-400">{formatTime(message.time)}</span>
                    </div>
                  )}
                  
                  <div className={`${
                    message.isSystem 
                      ? "bg-gray-100 text-gray-600 text-xs italic" 
                      : message.sender === "You"
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-800"
                  } px-3 py-2 rounded-lg`}>
                    {message.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="mt-4 flex">
        <Input
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mr-2"
        />
        <Button onClick={handleSendMessage} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {isPremium && (
        <div className="mt-4 p-2 bg-amber-100 border border-amber-200 rounded text-xs text-amber-800">
          This is a premium game. Voice chat is available for all players. Click the "Voice Chat" tab to access it.
        </div>
      )}
    </div>
  );
}
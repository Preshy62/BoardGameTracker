import { useState, useRef, useEffect } from "react";
import { User, GamePlayer, Message } from "@shared/schema";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GameSidebarProps {
  players: (GamePlayer & { user: User })[];
  messages: Message[];
  currentUserId: number;
  currentPlayerTurnId: number;
  onSendMessage: (message: string) => void;
}

const GameSidebar = ({
  players,
  messages,
  currentUserId,
  currentPlayerTurnId,
  onSendMessage
}: GameSidebarProps) => {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Players Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-sans font-semibold text-lg mb-3">Players</h3>
        
        <div className="space-y-3">
          {players.map((player) => {
            const isCurrentPlayer = player.userId === currentUserId;
            const isCurrentTurn = player.userId === currentPlayerTurnId;
            
            return (
              <div 
                key={player.id}
                className={cn(
                  "flex items-center p-2 rounded-lg",
                  isCurrentTurn && "bg-gray-100"
                )}
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex-shrink-0 relative",
                    isCurrentTurn && "active-player"
                  )}
                >
                  <div className={cn(
                    "w-full h-full rounded-full flex items-center justify-center text-white",
                    isCurrentPlayer ? "bg-accent" : "bg-primary-light"
                  )}>
                    <span>{player.user.avatarInitials}</span>
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs",
                    isCurrentTurn ? "bg-secondary" : "bg-gray-500"
                  )}>
                    <span>{player.turnOrder}</span>
                  </div>
                </div>
                <div className="ml-3 flex-grow">
                  <p className="font-medium">
                    {player.user.username} {isCurrentPlayer && "(You)"}
                  </p>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500">Roll:</span>
                    <span className="ml-2 font-mono font-bold text-primary">
                      {player.hasRolled ? player.rolledNumber : "--"}
                    </span>
                  </div>
                </div>
                
                {isCurrentTurn && (
                  <div className="px-2 py-1 rounded bg-secondary text-primary text-xs font-medium">
                    {isCurrentPlayer ? "Your Turn" : "Current Turn"}
                  </div>
                )}
                
                {!isCurrentTurn && (
                  <div className={cn(
                    "w-3 h-3 rounded-full ml-2",
                    player.hasRolled ? "bg-success" : "bg-gray-400"
                  )}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Chat Section */}
      <div className="flex-grow flex flex-col p-4 overflow-hidden">
        <h3 className="font-sans font-semibold text-lg mb-3">Chat</h3>
        
        {/* Message List */}
        <ScrollArea className="flex-grow mb-4 pr-2">
          <div className="space-y-3">
            {messages.map((message) => {
              const isCurrentUser = message.userId === currentUserId;
              const player = players.find(p => p.userId === message.userId);
              
              if (message.type === 'system') {
                return (
                  <div key={message.id} className="text-center my-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {message.content}
                    </span>
                  </div>
                );
              }
              
              return (
                <div key={message.id} className={cn("flex", isCurrentUser && "justify-end")}>
                  {!isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-primary-light flex-shrink-0 flex items-center justify-center text-white text-sm">
                      {player?.user.avatarInitials}
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-2 max-w-[75%] rounded-lg",
                    isCurrentUser 
                      ? "mr-2 bg-secondary bg-opacity-20" 
                      : "ml-2 bg-gray-100"
                  )}>
                    <p className="text-xs text-gray-500 mb-1">
                      {isCurrentUser ? "You" : player?.user.username}
                    </p>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  {isCurrentUser && (
                    <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-white text-sm">
                      {player?.user.avatarInitials}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Message Input */}
        <div className="flex">
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:border-secondary"
          />
          <button 
            onClick={handleSendMessage}
            className="bg-secondary text-primary px-4 py-2 rounded-r-lg"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSidebar;

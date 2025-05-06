import { useState, useRef, useEffect } from "react";
import { User, GamePlayer, Message, Game } from "@shared/schema";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import GameChat from "./GameChat";

interface GameSidebarProps {
  players: (GamePlayer & { user: User })[];
  messages: Message[];
  currentUserId: number;
  currentPlayerTurnId: number;
  onSendMessage: (message: string) => void;
  game: Game;
  socket: WebSocket | null;
  currentUser: User;
}

const GameSidebar = ({
  players,
  messages,
  currentUserId,
  currentPlayerTurnId,
  onSendMessage,
  game,
  socket,
  currentUser
}: GameSidebarProps) => {

  return (
    <div className="flex-grow flex flex-col">
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
      <div className="flex-grow p-4 overflow-hidden">
        <GameChat 
          game={game}
          currentUser={currentUser}
          players={players}
          messages={messages.map(msg => ({
            ...msg,
            type: msg.type as 'chat' | 'system',
            createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            user: players.find(p => p.userId === msg.userId)?.user && {
              username: players.find(p => p.userId === msg.userId)!.user.username,
              avatarInitials: players.find(p => p.userId === msg.userId)!.user.avatarInitials
            }
          }))}
          socket={socket}
        />
      </div>
    </div>
  );
};

export default GameSidebar;

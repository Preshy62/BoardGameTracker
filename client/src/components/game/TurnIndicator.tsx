import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "@shared/schema";
import { Clock, PlayCircle } from "lucide-react";

interface TurnIndicatorProps {
  currentPlayer?: User;
  isYourTurn?: boolean;
  timeLeft?: number; // in seconds
  className?: string;
}

const TurnIndicator = ({
  currentPlayer,
  isYourTurn = false,
  timeLeft,
  className,
}: TurnIndicatorProps) => {
  // Format time as MM:SS
  const formattedTime = timeLeft !== undefined ? 
    `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : 
    undefined;

  // Determine urgency based on time left
  const getUrgencyClass = () => {
    if (timeLeft === undefined) return "";
    if (timeLeft < 10) return "text-red-500 animate-pulse";
    if (timeLeft < 30) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 py-2 rounded-lg",
        isYourTurn 
          ? "bg-green-100 border-2 border-green-500 shadow-lg" 
          : "bg-gray-100 border border-gray-300",
        className
      )}
    >
      <div className="flex items-center space-x-3">
        {currentPlayer && (
          <Avatar className={cn("h-8 w-8 border-2", isYourTurn ? "border-green-500" : "border-gray-300")}>
            <AvatarFallback className="bg-primary text-white text-xs">
              {currentPlayer.avatarInitials || currentPlayer.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col">
          <div className="text-sm font-medium flex items-center gap-1">
            {isYourTurn && <PlayCircle className="h-4 w-4 text-green-500 animate-pulse" />}
            {currentPlayer?.username || "Waiting..."}
            {isYourTurn && <span className="text-green-600 text-xs ml-1">(You)</span>}
          </div>
          <div className="text-xs text-gray-500">
            {isYourTurn ? "Your turn to roll" : "Waiting for player"}
          </div>
        </div>
      </div>

      {timeLeft !== undefined && (
        <div className={cn("flex items-center space-x-1", getUrgencyClass())}>
          <Clock className="h-4 w-4" />
          <span className="font-mono font-bold text-sm">{formattedTime}</span>
        </div>
      )}
    </div>
  );
};

export default TurnIndicator;
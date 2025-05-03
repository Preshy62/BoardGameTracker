import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { User, GamePlayer } from "@shared/schema";

interface GameResultModalProps {
  open: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  winAmount: number;
  winningNumber: number;
  winner: User;
  standings: (GamePlayer & { user: User })[];
  currentUserId: number;
}

const GameResultModal = ({
  open,
  onClose,
  onPlayAgain,
  winAmount,
  winningNumber,
  winner,
  standings,
  currentUserId
}: GameResultModalProps) => {
  // Sort standings by rolled number (descending)
  const sortedStandings = [...standings].sort((a, b) => {
    if (!a.rolledNumber) return 1;
    if (!b.rolledNumber) return -1;
    return b.rolledNumber - a.rolledNumber;
  });
  
  // Disabled speech synthesis to prevent browser compatibility issues
  useEffect(() => {
    // Console log the winner for debugging purposes only
    if (open) {
      console.log(`Game winner: ${winner.username} with ${winningNumber}`);
    }
    // We're intentionally not using speech synthesis anymore as it was causing issues
  }, [open, winner, winningNumber]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-sans font-bold text-center">
            Game Results
          </DialogTitle>
          <p className="text-secondary text-lg text-center">
            Winner Takes {formatCurrency(winAmount)}
          </p>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex justify-center items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="font-mono text-4xl font-bold">{winningNumber}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-primary">
              {winner.username} {winner.id === currentUserId ? "(You)" : ""}
            </h3>
            <p className="text-gray-500">Winner with the highest roll</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-2">Final Standings</h4>
            
            <div className="space-y-2">
              {sortedStandings.map((player, index) => (
                <div key={player.id} className="flex justify-between items-center py-1 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-sm mr-2 ${index === 0 ? "bg-primary" : "bg-primary-light"}`}>
                      {index + 1}
                    </span>
                    <span>
                      {player.user.username} {player.userId === currentUserId ? "(You)" : ""}
                    </span>
                  </div>
                  <span className="font-mono font-bold">
                    {player.rolledNumber || "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center space-x-3">
            <Button
              type="button"
              className="bg-primary-light hover:bg-primary text-white"
              onClick={() => {
                onClose();
                // Navigate to home page
                window.location.href = '/';
              }}
            >
              Main Menu
            </Button>
            <Button
              type="button"
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
              onClick={onPlayAgain}
            >
              Play Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameResultModal;

import { useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { playWinnerSound } from "@/lib/sounds";
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
  const [, setLocation] = useLocation();
  // Sort standings by rolled number (descending)
  const sortedStandings = [...standings].sort((a, b) => {
    if (!a.rolledNumber) return 1;
    if (!b.rolledNumber) return -1;
    return b.rolledNumber - a.rolledNumber;
  });
  
  // Play winner sound when the modal opens with Web Audio API
  useEffect(() => {
    if (open) {
      // Log the winner for debugging
      console.log(`Game winner: ${winner.username} with ${winningNumber}`);
      
      // Initialize audio context on first user interaction
      const initAndPlaySound = async () => {
        try {
          // First try playing with the new Web Audio API approach
          console.log('Attempting to play winner sound...');
          const played = await playWinnerSound();
          console.log('Winner sound played:', played);
          
          if (!played) {
            console.warn('Failed to play winner sound, will retry on user interaction');
          }
        } catch (error) {
          console.error('Error playing winner sound:', error);
        }
      };
      
      // Try to play immediately
      initAndPlaySound();
      
      // Also set up a listener for user interaction with modal
      // to handle browsers with strict autoplay policies
      const modalElement = document.querySelector('[role="dialog"]');
      const documentElement = document.documentElement;
      
      const handleUserInteraction = () => {
        console.log('User interaction detected, playing sound again...');
        initAndPlaySound();
      };
      
      // Listen for interaction events on both modal and document
      if (modalElement) {
        modalElement.addEventListener('click', handleUserInteraction, { once: true });
      }
      
      // Also listen for any document interaction as a fallback
      documentElement.addEventListener('click', handleUserInteraction, { once: true });
      documentElement.addEventListener('touchstart', handleUserInteraction, { once: true });
      
      return () => {
        if (modalElement) {
          modalElement.removeEventListener('click', handleUserInteraction);
        }
        documentElement.removeEventListener('click', handleUserInteraction);
        documentElement.removeEventListener('touchstart', handleUserInteraction);
      };
    }
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
                // Navigate to home page using wouter's setLocation
                setLocation('/');
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

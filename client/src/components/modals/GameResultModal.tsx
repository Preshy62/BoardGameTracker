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
  
  // Play winner announcement with male voice
  useEffect(() => {
    if (!open) return;

    const playAnnouncement = () => {
      // Using the SpeechSynthesis API to announce the winner
      const announcement = new SpeechSynthesisUtterance(
        `${winner.id === currentUserId ? 'You are' : winner.username + ' is'} the winner with ${winningNumber}!`
      );
      
      // Set a voice if available
      const voices = window.speechSynthesis.getVoices();
      
      // Log available voices for debugging
      console.log("Available voices:", voices.map(v => v.name));
      
      // Try to find the best voice (prioritizing English male voices)
      let selectedVoice;
      
      // First try: Google UK English Male (common on many platforms)
      selectedVoice = voices.find(voice => voice.name === 'Google UK English Male');
      
      // Second try: Any voice with 'Male' and English ('en') in it
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.includes('Male') && (voice.lang.startsWith('en') || voice.lang === '')
        );
      }
      
      // Third try: Any voice with 'Male' in it
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.includes('Male') || voice.name.includes('male')
        );
      }
      
      // Fourth try: Microsoft David (default on Windows)
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.name.includes('David'));
      }
      
      // Fifth try: Any English voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      
      // Final fallback: Just use the first voice
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }
      
      // Set the voice if found
      if (selectedVoice) {
        console.log("Using voice:", selectedVoice.name);
        announcement.voice = selectedVoice;
      } else {
        console.log("No suitable voice found, using default");
      }
      
      // Adjust properties
      announcement.volume = 1.0; // 0 to 1
      announcement.rate = 0.9; // 0.1 to 10
      announcement.pitch = 1.0; // 0 to 2
      
      // Speak the announcement
      window.speechSynthesis.speak(announcement);
    };

    // Check if voices are loaded or need to wait for the event
    if (window.speechSynthesis.getVoices().length > 0) {
      playAnnouncement();
    } else {
      // If voices aren't loaded yet, wait for them
      window.speechSynthesis.onvoiceschanged = playAnnouncement;
    }
    
    return () => {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech when the component unmounts
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [open, winner, winningNumber, currentUserId]);

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

import { useEffect } from "react";
import { useLocation } from "wouter";
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
  winners: User[]; // Changed from single winner to array of winners
  standings: (GamePlayer & { user: { username: string, id?: number } })[];
  currentUserId: number;
}

const GameResultModal = ({
  open,
  onClose,
  onPlayAgain,
  winAmount,
  winningNumber,
  winners,
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
  
  // Preload sounds as early as possible in the component lifecycle
  useEffect(() => {
    // Import here to avoid circular dependencies
    import('@/lib/sounds').then(({ initAudioContext }) => {
      // Initialize audio context early
      initAudioContext();
      console.log('Audio context initialized early in GameResultModal');
    });
  }, []);

  // Play winner sound when the modal opens with Web Audio API
  useEffect(() => {
    if (open) {
      // Log the winners for debugging
      console.log(`Game winners: ${winners.map(w => w.username).join(', ')} with ${winningNumber}`);
      
      let soundPlayed = false;
      
      // Initialize audio context on first user interaction
      const initAndPlaySound = async () => {
        if (soundPlayed) return; // Don't play multiple times
        
        try {
          // Import dynamically to avoid circular dependencies
          const { initAudioContext } = await import('@/lib/sounds');
          
          // First ensure audio context is initialized
          initAudioContext();
          
          // Create a message based on number of winners and if current user is among them
          let customMessage = '';
          const currentUserIsWinner = winners.some(w => w.id === currentUserId);
          
          if (winners.length === 1) {
            // Single winner
            customMessage = winners[0].id === currentUserId 
              ? `Congratulations! You won with ${winningNumber}!` 
              : `${winners[0].username} won with ${winningNumber}!`;
          } else {
            // Multiple winners (tie)
            const winnerNames = winners.map(w => w.id === currentUserId ? 'You' : w.username).join(' and ');
            const prizePerWinner = winAmount / winners.length;
            
            customMessage = currentUserIsWinner
              ? `Congratulations! It's a tie! ${winnerNames} all rolled ${winningNumber} and share the prize of ${formatCurrency(prizePerWinner)} each!`
              : `It's a tie! ${winnerNames} all rolled ${winningNumber} and share the prize!`;
          }
          
          // Both traditional sound effect and speech synthesis
          console.log('Announcing winner with custom message:', customMessage);
          
          // Use speech synthesis directly which often has better browser support
          if ('speechSynthesis' in window) {
            try {
              // Create speech synthesis utterance with winning message
              const utterance = new SpeechSynthesisUtterance(customMessage);
              
              // Configure voice properties
              utterance.volume = 1.0; // 0 to 1
              utterance.rate = 1.0;   // 0.1 to 10
              utterance.pitch = 1.2;  // 0 to 2
              
              // Try to select a good voice if available
              // Voice loading is asynchronous in some browsers, so we need to handle it properly
              const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                  // Prefer English voices
                  const englishVoice = voices.find(voice => voice.lang.includes('en-'));
                  if (englishVoice) {
                    utterance.voice = englishVoice;
                    console.log('Set voice to:', englishVoice.name);
                  }
                }
              };
              
              // First try loading voices directly
              loadVoices();
              
              // If that didn't work, subscribe to the voiceschanged event
              window.speechSynthesis.onvoiceschanged = loadVoices;
              
              // Speak the text
              window.speechSynthesis.speak(utterance);
              console.log('Using speech synthesis to announce winner');
              soundPlayed = true;
              return;
            } catch (error) {
              console.error('Speech synthesis failed:', error);
            }
          }
          
          // Fall back to standard sound if speech synthesis fails
          try {
            const { playWinSound } = await import('@/lib/sounds');
            console.log('Attempting to play winner sound...');
            await playWinSound();
            console.log('Winner sound played successfully');
            soundPlayed = true;
          } catch (error) {
            console.warn('Failed to play winner sound, will retry on user interaction', error);
          }
        } catch (error) {
          console.error('Error playing winner sound:', error);
        }
      };
      
      // Try to play immediately
      initAndPlaySound();
      
      // Also try after a small delay - sometimes this works better
      const delayTimer = setTimeout(() => {
        if (!soundPlayed) {
          console.log('Retrying winner sound with delay...');
          initAndPlaySound();
        }
      }, 300);
      
      // Set up a listener for user interaction with modal and document
      // to handle browsers with strict autoplay policies
      const modalElement = document.querySelector('[role="dialog"]');
      const documentElement = document.documentElement;
      
      const handleUserInteraction = () => {
        if (!soundPlayed) {
          console.log('User interaction detected, playing sound again...');
          initAndPlaySound();
        }
      };
      
      // Listen for interaction events on both modal and document
      if (modalElement) {
        modalElement.addEventListener('click', handleUserInteraction);
      }
      
      // Also listen for any document interaction as a fallback
      documentElement.addEventListener('click', handleUserInteraction);
      documentElement.addEventListener('touchstart', handleUserInteraction);
      
      return () => {
        clearTimeout(delayTimer);
        if (modalElement) {
          modalElement.removeEventListener('click', handleUserInteraction);
        }
        documentElement.removeEventListener('click', handleUserInteraction);
        documentElement.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [open, winners, winningNumber]);

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
            {winners.length === 1 ? (
              <>
                <h3 className="text-xl font-bold text-primary">
                  {winners[0].username} {winners[0].id === currentUserId ? "(You)" : ""}
                </h3>
                <p className="text-gray-500">Winner with the highest roll</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-primary">
                  Tie! Multiple Winners
                </h3>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {winners.map(winner => (
                    <span key={winner.id} className="px-3 py-1 bg-secondary text-primary rounded-full font-medium text-sm">
                      {winner.username} {winner.id === currentUserId ? "(You)" : ""}
                    </span>
                  ))}
                </div>
                <p className="text-gray-500 mt-2">
                  Each winner receives {formatCurrency(winAmount / winners.length)}
                </p>
              </>
            )}
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
                      {player.user.username} {(player.userId === currentUserId || player.user.id === currentUserId) ? "(You)" : ""}
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

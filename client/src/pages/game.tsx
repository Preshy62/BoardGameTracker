import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import GameBoard from "@/components/game/GameBoard";
import GameSidebar from "@/components/game/GameSidebar";
import VoiceChat from "@/components/game/VoiceChat";
import GameResultModal from "@/components/modals/GameResultModal";
import GameLobbyModal from "@/components/modals/GameLobbyModal";
import { User } from "@shared/schema";
import { useGameState } from "@/hooks/useGameState";
import { calculateWinnings } from "@/lib/utils";
import { useState } from "react";

interface GamePageProps {
  id: string;
}

export default function Game({ id }: GamePageProps) {
  const [gameId, setGameId] = useState(id);
  const [isPlayAgainModalOpen, setIsPlayAgainModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Listen for URL changes when we use window.history.replaceState
  // This updates gameId without refreshing the whole page
  useEffect(() => {
    // Update gameId state when component mounts or ID prop changes
    setGameId(id);
    
    // Listen for popstate event for when we use window.history.replaceState
    const handlePopState = () => {
      // Extract the game ID from the current URL
      const gameIdFromUrl = window.location.pathname.split('/').pop();
      console.log('URL changed, new game ID:', gameIdFromUrl);
      if (gameIdFromUrl) {
        setGameId(gameIdFromUrl);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [id]);

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Use game state hook
  const {
    game,
    players,
    messages,
    isLoading,
    currentTurnPlayerId,
    timeRemaining,
    rollingStoneNumber,
    isGameResultOpen,
    isCurrentPlayerTurn,
    sendChatMessage,
    rollStone,
    leaveGame,
    setIsGameResultOpen,
    createNewGame
  } = useGameState({ 
    gameId, // Use the state variable that updates on URL changes instead of the prop
    userId: user?.id || 0
  });
  
  // Add additional debugging for game/1 and game/2 pages
  useEffect(() => {
    console.log(`Game page rendering for game ID: ${gameId}`);
    console.log("Game data:", game);
    console.log("Players:", players);
    console.log("Current user ID:", user?.id);
    console.log("Is loading:", isLoading);
    
    // If game is undefined but not loading, there might be an issue
    if (!isLoading && !game) {
      console.error("Game is undefined but not in loading state");
    }
  }, [gameId, game, players, user?.id, isLoading]);
  
  // Voice chat settings
  const isHighStakesGame = game ? game.stake >= 50000 : false;

  // Handle if user is not logged in - special case for demo games (1 and 2)
  const isDemoGame = gameId === "1" || gameId === "2";
  
  // Create a mock user for demo games if needed
  const demoUser: User = {
    id: 999,
    username: 'Demo User',
    password: '',
    email: 'demo@example.com',
    walletBalance: 100000,
    avatarInitials: 'DU',
    isAdmin: false,
    isActive: true,
    createdAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  };
  
  // Use either the authenticated user or the demo user for demo games
  const currentUser = user || (isDemoGame ? demoUser : null);
  
  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      console.log("User not logged in and not a demo game, redirecting to auth");
      setLocation('/auth');
    }
  }, [user, isUserLoading, setLocation, isDemoGame, currentUser]);

  if (isUserLoading || isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <button 
            onClick={() => setLocation('/')}
            className="bg-primary text-white px-4 py-2 rounded-md"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Calculate winner and winnings
  const winnerPlayer = game.winnerId 
    ? players.find(p => p.userId === game.winnerId) 
    : null;
  
  const winner = winnerPlayer 
    ? players.find(p => p.userId === winnerPlayer.userId)?.user 
    : null;
  
  const totalPool = game.stake * players.length;
  const winAmount = calculateWinnings(totalPool, game.commissionPercentage);

  // Voice chat feature flag (always true for UI but internal functionality is disabled)
  const voiceChatEnabled = true;
  
  // Explicitly add enhanced animations and specific handling for both games 1 and 2
  const isSpecificGame = gameId === "2" || gameId === "1";
  
  // Set up animation trigger specifically for game 2
  useEffect(() => {
    if (isSpecificGame) {
      // Add CSS variables to the document root for ball position
      document.documentElement.style.setProperty('--ball-top', '50%');
      document.documentElement.style.setProperty('--ball-left', '50%');
      
      // Force animation redraw by adding a class to the root element
      document.documentElement.classList.add('specific-game-animation');
      
      console.log("Enhanced animations for game/2 route activated");
      
      // Create an intro animation sequence
      const runIntroAnimation = async () => {
        // Create ball animation that follows a path around the board
        const animateBallPath = async () => {
          // Wait for board element to be available
          const board = document.getElementById('game-board-element');
          if (!board) return;
          
          // Define a path around the board to follow
          const animationPath = [
            { top: '20%', left: '20%' },
            { top: '20%', left: '80%' },
            { top: '80%', left: '80%' },
            { top: '80%', left: '20%' },
            { top: '50%', left: '50%' }
          ];
          
          // Animate through each point in the path
          for (const position of animationPath) {
            document.documentElement.style.setProperty('--ball-top', position.top);
            document.documentElement.style.setProperty('--ball-left', position.left);
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        };
        
        // Run the animation
        await animateBallPath();
      };
      
      // Run the intro animation after a short delay
      setTimeout(runIntroAnimation, 1000);
      
      return () => {
        document.documentElement.classList.remove('specific-game-animation');
      };
    }
  }, [isSpecificGame]);

  return (
    <div className={`min-h-screen flex flex-col ${isSpecificGame ? 'game-2-specific' : ''}`}>
      <Header user={currentUser} />
      
      {/* Special welcome message for game/2 */}
      {isSpecificGame && (
        <div className="bg-yellow-500 text-primary p-3 text-center">
          <h3 className="font-bold text-lg">Enhanced Animation Demo</h3>
          <p>This game features special animations to showcase the ball movement. Watch as the ball moves around the board!</p>
        </div>
      )}
      
      <main className="flex-grow flex flex-col md:flex-row">
        <GameBoard
          game={game}
          currentPlayerId={currentTurnPlayerId || 0}
          players={players}
          onRollStone={rollStone}
          rollingStoneNumber={rollingStoneNumber}
          userId={currentUser.id}
          timeRemaining={timeRemaining || undefined}
          isCurrentPlayerTurn={isCurrentPlayerTurn}
          forceShowBall={isSpecificGame} // Pass prop to force showing ball on game/2
        />
        
        <div className="w-full md:w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
          {/* Voice chat for high-stakes games only */}
          {isHighStakesGame && (
            <div className="p-3">
              <VoiceChat 
                game={game} 
                isEnabled={voiceChatEnabled}
                currentUserId={currentUser.id}
              />
            </div>
          )}
          
          <GameSidebar
            players={players}
            messages={messages}
            currentUserId={currentUser.id}
            currentPlayerTurnId={currentTurnPlayerId || 0}
            onSendMessage={sendChatMessage}
          />
        </div>
      </main>

      {/* Game Result Modal */}
      {winner && (
        <GameResultModal
          open={isGameResultOpen}
          onClose={() => {
            // Just close the modal when clicking X, don't leave the game
            setIsGameResultOpen(false);
          }}
          onPlayAgain={() => {
            // First close the game result modal
            setIsGameResultOpen(false);
            
            // Check if this was a bot game by looking for a Computer player
            // The bot/computer player's username is consistently 'Computer'
            const computerPlayer = players.find(p => p.user.username === 'Computer');
            const isBotGame = !!computerPlayer;
            console.log("Play Again clicked - Found computer player:", computerPlayer, "Is bot game:", isBotGame);
            
            if (isBotGame) {
              // For bot games, directly create a new single player game with the same stake
              console.log("Creating new bot game with stake:", game.stake);
              const isHighStakesGame = game.stake >= 50000;
              createNewGame(1, game.stake, true, isHighStakesGame ? voiceChatEnabled : false);
            } else {
              // For multiplayer games, show the lobby modal
              setIsPlayAgainModalOpen(true);
            }
          }}
          winAmount={winAmount}
          winningNumber={game.winningNumber || 0}
          winner={winner}
          standings={players}
          currentUserId={currentUser.id}
        />
      )}

      {/* Play Again Modal */}
      <GameLobbyModal
        open={isPlayAgainModalOpen}
        onClose={() => {
          setIsPlayAgainModalOpen(false);
          leaveGame();
        }}
        onCreateGame={createNewGame}
        // Set single player mode if this was a bot game
        initialSinglePlayer={players.some(p => p.user.username === 'Computer')}
      />
    </div>
  );
}

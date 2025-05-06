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
  
  // When rollingStoneNumber changes, update CSS variables to make the ball animation visible
  useEffect(() => {
    if (rollingStoneNumber !== null) {
      console.log("Game page detected rolling stone:", rollingStoneNumber);
      
      // Reset any previous ball position
      document.documentElement.style.setProperty('--ball-top', '50%');
      document.documentElement.style.setProperty('--ball-left', '50%');
      
      // Force board to shake
      const boardElement = document.getElementById('game-board-element');
      if (boardElement) {
        boardElement.classList.add('shaking-board');
        setTimeout(() => {
          boardElement.classList.remove('shaking-board');
        }, 1500);
      }
    }
  }, [rollingStoneNumber]);
  
  // Voice chat settings
  const isHighStakesGame = game ? game.stake >= 50000 : false;

  // Handle if user is not logged in
  useEffect(() => {
    if (!isUserLoading && !user) {
      setLocation('/auth');
    }
  }, [user, isUserLoading, setLocation]);

  if (isUserLoading || isLoading || !user) {
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
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-grow flex flex-col md:flex-row">
        <GameBoard
          game={game}
          currentPlayerId={currentTurnPlayerId || 0}
          players={players}
          onRollStone={rollStone}
          rollingStoneNumber={rollingStoneNumber}
          userId={user.id}
          timeRemaining={timeRemaining || undefined}
          isCurrentPlayerTurn={isCurrentPlayerTurn}
        />
        
        <div className="w-full md:w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
          {/* Voice chat for high-stakes games only */}
          {isHighStakesGame && (
            <div className="p-3">
              <VoiceChat 
                game={game} 
                isEnabled={voiceChatEnabled}
                currentUserId={user.id}
              />
            </div>
          )}
          
          <GameSidebar
            players={players}
            messages={messages}
            currentUserId={user.id}
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
          currentUserId={user.id}
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

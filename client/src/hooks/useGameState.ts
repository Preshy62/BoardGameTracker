import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useToast } from './use-toast';
import { 
  Game, 
  GamePlayer, 
  User, 
  Message, 
  WebSocketMessageType,
  GameStatus
} from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface UseGameStateProps {
  gameId: string;
  userId: number;
}

export function useGameState({ gameId, userId }: UseGameStateProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<(GamePlayer & { user: User })[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTurnPlayerId, setCurrentTurnPlayerId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [rollingStoneNumber, setRollingStoneNumber] = useState<number | null>(null);
  const [isGameResultOpen, setIsGameResultOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const {
    isConnected,
    connect,
    disconnect,
    sendMessage,
    addMessageHandler
  } = useWebSocket();

  // Fetch initial game data
  const fetchGameData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/games/${gameId}`);
      
      if (!response.ok) {
        throw new Error('Game not found');
      }
      
      const data = await response.json();
      setGame(data.game);
      setPlayers(data.players);
      setMessages(data.messages);
      
      if (data.game.status === 'in_progress') {
        const currentPlayer = data.players.find((p: GamePlayer) => !p.hasRolled);
        if (currentPlayer) {
          setCurrentTurnPlayerId(currentPlayer.userId);
        }
      }

      // If game is completed, show results
      if (data.game.status === 'completed') {
        setIsGameResultOpen(true);
      }
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load game data',
        variant: 'destructive',
      });
      setLocation('/');
    } finally {
      setIsLoading(false);
    }
  }, [gameId, toast, setLocation]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    console.log('GameId changed in useGameState hook, fetching new game data:', gameId);
    // When gameId changes, we need to reset all state and fetch new data
    setGame(null);
    setPlayers([]);
    setMessages([]);
    setCurrentTurnPlayerId(null);
    setTimeRemaining(null);
    setRollingStoneNumber(null);
    setIsGameResultOpen(false);
    
    // Then fetch new game data and reconnect
    fetchGameData().then(() => {
      // Reconnect to WebSocket
      disconnect();
      connect();
    });

    return () => {
      disconnect();
    };
  }, [connect, disconnect, fetchGameData, gameId]); // Add gameId to dependency array

  // Join game room when connected to WebSocket
  useEffect(() => {
    if (isConnected && game) {
      sendMessage('join_game', { gameId: parseInt(gameId) });
    }
  }, [isConnected, game, gameId, sendMessage]);

  // Set up WebSocket message handlers
  useEffect(() => {
    const removePlayerJoinedHandler = addMessageHandler('player_joined', (data) => {
      setPlayers(prevPlayers => {
        // Check if player already exists
        if (prevPlayers.some(p => p.userId === data.player.userId)) {
          return prevPlayers;
        }
        return [...prevPlayers, data.player];
      });
      
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: Date.now(),
          gameId: parseInt(gameId),
          userId: data.player.userId,
          content: `${data.player.user.username} joined the game`,
          type: 'system',
          createdAt: new Date()
        }
      ]);
    });

    const removePlayerLeftHandler = addMessageHandler('player_left', (data) => {
      setPlayers(prevPlayers => prevPlayers.filter(p => p.userId !== data.userId));
      
      const player = players.find(p => p.userId === data.userId);
      if (player) {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: Date.now(),
            gameId: parseInt(gameId),
            userId: data.userId,
            content: `${player.user.username} left the game`,
            type: 'system',
            createdAt: new Date()
          }
        ]);
      }
    });

    const removeChatMessageHandler = addMessageHandler('chat_message', (data) => {
      setMessages(prevMessages => [...prevMessages, data.message]);
    });

    const removeGameUpdateHandler = addMessageHandler('game_update', (data) => {
      setGame(data.game);
      setPlayers(data.players);
      
      if (data.currentTurnPlayerId !== undefined) {
        setCurrentTurnPlayerId(data.currentTurnPlayerId);
      }
      
      if (data.rollingStoneNumber !== undefined) {
        // Reset any previous ball position
        document.documentElement.style.setProperty('--ball-top', '50%');
        document.documentElement.style.setProperty('--ball-left', '50%');
        
        console.log("Received rolling stone number:", data.rollingStoneNumber);
        setRollingStoneNumber(data.rollingStoneNumber);
        
        // Force board to shake
        const boardElement = document.getElementById('game-board-element');
        if (boardElement) {
          boardElement.classList.add('shaking-board');
          setTimeout(() => {
            boardElement.classList.remove('shaking-board');
          }, 1500);
        }
        
        // Clear rolling stone after animation
        setTimeout(() => {
          setRollingStoneNumber(null);
        }, 3000); // Longer animation time for more impact
      }
      
      if (data.timeRemaining !== undefined) {
        setTimeRemaining(data.timeRemaining);
      }
      
      // Add system message for roll
      if (data.rolledPlayerId) {
        const player = players.find(p => p.userId === data.rolledPlayerId);
        const rolledNumber = data.players.find((p: GamePlayer) => p.userId === data.rolledPlayerId)?.rolledNumber;
        
        if (player && rolledNumber) {
          setMessages(prevMessages => [
            ...prevMessages,
            {
              id: Date.now(),
              gameId: parseInt(gameId),
              userId: data.rolledPlayerId,
              content: `${player.user.username} rolled ${rolledNumber}`,
              type: 'system',
              createdAt: new Date()
            }
          ]);
        }
      }
    });

    const removeGameEndedHandler = addMessageHandler('game_ended', (data) => {
      setGame(data.game);
      setPlayers(data.players);
      setIsGameResultOpen(true);
    });
    
    const removeErrorHandler = addMessageHandler('error', (data) => {
      toast({
        title: 'Error',
        description: data.message,
        variant: 'destructive',
      });
    });

    return () => {
      removePlayerJoinedHandler();
      removePlayerLeftHandler();
      removeChatMessageHandler();
      removeGameUpdateHandler();
      removeGameEndedHandler();
      removeErrorHandler();
    };
  }, [addMessageHandler, gameId, players, toast]);

  // Handle sending chat message
  const sendChatMessage = useCallback((content: string) => {
    if (!isConnected || !game) return;
    
    sendMessage('chat_message', {
      gameId: parseInt(gameId),
      content
    });
  }, [isConnected, game, gameId, sendMessage]);

  // Handle rolling stone
  const rollStone = useCallback(() => {
    if (!isConnected || !game) return;
    
    console.log('Rolling stone in game');
    
    // Multiple approaches to ensure dice sound plays
    let soundPlayed = false;
    
    // Try playing a direct audio element first (simple approach)
    const playDirectAudio = () => {
      try {
        const audio = new Audio('/rolling-dice.mp3');
        audio.volume = 0.5;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio played successfully');
              soundPlayed = true;
            })
            .catch(error => {
              console.log('Audio playback failed:', error);
              // Try other methods if this fails
              if (!soundPlayed) {
                playSpeechFeedback();
              }
            });
        }
      } catch (e) {
        console.log('Audio playback not supported, trying speech synthesis');
        if (!soundPlayed) {
          playSpeechFeedback();
        }
      }
    };
    
    // Immediately try to use speech synthesis which has higher success rate
    const playSpeechFeedback = () => {
      // Ensure we don't play multiple sounds
      if (soundPlayed) return;
      
      try {
        // Use browser's built-in text-to-speech which bypasses autoplay restrictions
        if ('speechSynthesis' in window) {
          // For bot games, add the computer voice
          const isBotGame = players.some(p => p.user.username === 'Computer');
          const speechText = isBotGame && currentTurnPlayerId !== userId 
            ? "Computer is rolling the dice" 
            : "Rolling the dice";
          
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.volume = 0.8;
          utterance.rate = 1.2;
          utterance.pitch = 1.0;
          
          // Try to select a good voice if available
          // Voice loading is asynchronous in some browsers
          const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
              // Prefer English voices
              const englishVoice = voices.find(voice => voice.lang.includes('en-'));
              if (englishVoice) {
                utterance.voice = englishVoice;
                console.log('Set dice roll voice to:', englishVoice.name);
              }
            }
          };
          
          // First try loading voices directly
          loadVoices();
          
          // If that didn't work, subscribe to the voiceschanged event
          window.speechSynthesis.onvoiceschanged = loadVoices;
          
          window.speechSynthesis.speak(utterance);
          console.log('Using speech synthesis for dice roll: ' + speechText);
          soundPlayed = true;
        }
      } catch (error) {
        console.error('Speech synthesis failed:', error);
      }
    };
    
    // Also try using the Web Audio API approach as a secondary method
    const playRollSound = async () => {
      try {
        if (soundPlayed) return; // Don't play if speech already worked
        
        // Import here to avoid circular dependencies
        const { playDiceRollSound, initAudioContext } = await import('@/lib/sounds');
        
        // Initialize audio context first (important for mobile browsers)
        initAudioContext();
        
        // Play dice rolling sound
        console.log('Playing dice roll sound with Web Audio API');
        const played = await playDiceRollSound();
        console.log('Dice roll sound played:', played);
        
        if (played) {
          soundPlayed = true;
        } else {
          // If Web Audio fails, try speech synthesis
          if (!soundPlayed) {
            playSpeechFeedback();
          }
        }
      } catch (error) {
        // If anything fails, fall back to speech
        console.error('Error playing dice roll sound:', error);
        if (!soundPlayed) {
          playSpeechFeedback();
        }
      }
    };
    
    // Try multiple approaches in sequence - starting with the simplest one
    playDirectAudio();   // Try direct audio first
    
    // Use the other methods as fallbacks with a small delay to avoid conflicts
    setTimeout(() => {
      if (!soundPlayed) {
        playSpeechFeedback(); // Try speech next
        
        // Try Web Audio as last resort
        setTimeout(() => {
          if (!soundPlayed) {
            playRollSound();
          }
        }, 100);
      }
    }, 100);
    
    // Also set up a backup in case all attempts fail (for browsers with stricter policies)
    const timer = setTimeout(() => {
      if (!soundPlayed) {
        console.log('Retrying sound after delay');
        playRollSound();
      }
    }, 300);
    
    // Add visual effects for rolling - these will be properly handled in the GameBoard component
    document.documentElement.style.setProperty('--ball-visible', '1');
    document.documentElement.style.setProperty('--ball-top', '50%');
    document.documentElement.style.setProperty('--ball-left', '50%');
    
    // Send the roll message to the server
    sendMessage('roll_stone', {
      gameId: parseInt(gameId),
    });
    
    // Clean up the timer
    return () => clearTimeout(timer);
  }, [isConnected, game, gameId, sendMessage, players, currentTurnPlayerId, userId]);

  // Leave game and go to home
  const leaveGame = useCallback(() => {
    if (isConnected) {
      sendMessage('leave_game', {
        gameId: parseInt(gameId),
      });
    }
    
    setLocation('/');
  }, [isConnected, gameId, setLocation, sendMessage]);

  // Create new game (play again)
  const createNewGame = useCallback(async (playerCount: number, stake: number, playWithBot?: boolean, voiceChatEnabled?: boolean) => {
    try {
      // Create game options
      const gameData: any = {
        maxPlayers: playerCount,
        stake
      };
      
      // If this is a bot game, add the playWithBot flag
      if (playWithBot) {
        gameData.playWithBot = true;
        console.log('Creating a new bot game:', gameData);
      } else {
        console.log('Creating a new multiplayer game:', gameData);
      }
      
      // If voice chat is enabled, add the flag
      if (voiceChatEnabled) {
        gameData.voiceChatEnabled = true;
        console.log('Voice chat enabled for this game');
      }
      
      console.log('Sending game creation request to /api/games with data:', gameData);
      
      // First leave the current game
      if (isConnected) {
        try {
          sendMessage('leave_game', {
            gameId: parseInt(gameId),
          });
        } catch (error) {
          console.error('Error leaving current game:', error);
        }
      }
      
      // Use fetch directly with more detailed error handling
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Game created successfully:', data);
      
      // Instead of redirecting, replace the current URL to update the game ID
      // This keeps us on the same page but changes the game
      window.history.replaceState({}, '', `/game/${data.id}`);
      
      // Reload the game component without refreshing the whole page
      // by triggering window history navigation event
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      // Return the new game data so it can be used if needed
      return data;
    } catch (error) {
      console.error('Game creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // If unauthorized, redirect to auth page
      if (errorMessage.includes('401')) {
        setLocation('/auth');
      } else {
        // If other error, go back to home
        setLocation('/');
      }
    }
  }, [gameId, isConnected, sendMessage, setLocation, toast]);

  // Log the current game state for debugging
  useEffect(() => {
    console.log('Game state updated:', {
      gameId,
      currentTurnPlayerId,
      userId,
      isCurrentPlayerTurn: currentTurnPlayerId === userId,
      gameStatus: game?.status,
      players: players.map(p => ({ id: p.id, userId: p.userId, name: p.user.username, hasRolled: p.hasRolled }))
    });
  }, [gameId, currentTurnPlayerId, userId, game, players]);

  // In single player games, check if this is a bot game by looking for a Computer player
  const computerPlayer = players.find(p => p.user.username === 'Computer');
  const isBotGame = !!computerPlayer;
  const isBotTurn = computerPlayer ? currentTurnPlayerId === computerPlayer.userId : false;
  
  // Determine if it's the current player's turn
  // In bot games, allow the player to roll even during bot's turn
  const isCurrentPlayerTurn = isBotGame 
    ? (currentTurnPlayerId === userId || isBotTurn) // In bot games, user can roll on their turn OR on bot's turn
    : currentTurnPlayerId === userId; // In regular multiplayer, only on their actual turn

  // Log the current game state for debugging
  useEffect(() => {
    console.log('Game state updated:', {
      gameId,
      currentTurnPlayerId,
      userId,
      isCurrentPlayerTurn,
      isBotGame,
      gameStatus: game?.status,
      players: players.map(p => ({ id: p.id, userId: p.userId, name: p.user.username, hasRolled: p.hasRolled }))
    });
  }, [gameId, currentTurnPlayerId, userId, game, players, isCurrentPlayerTurn, isBotGame]);

  return {
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
    createNewGame,
    socket: isConnected ? 
      // Create a proxy object that implements just enough of the WebSocket interface
      // to satisfy TypeScript but delegates the actual functionality to our custom handler
      new Proxy({}, {
        get: function(target, prop) {
          if (prop === 'send') {
            return (message: string) => { 
              sendMessage(JSON.parse(message).type, JSON.parse(message).payload);
              return true;
            };
          }
          if (prop === 'readyState') {
            return WebSocket.OPEN;
          }
          if (prop === 'addEventListener' || prop === 'removeEventListener') {
            return () => {};
          }
          if (prop === 'dispatchEvent') {
            return () => true;
          }
          if (prop === 'close') {
            return () => {};
          }
          // Return empty values for other properties
          if (['binaryType', 'extensions', 'protocol', 'url'].includes(prop as string)) {
            return '';
          }
          if (['bufferedAmount'].includes(prop as string)) {
            return 0;
          }
          if (['onclose', 'onerror', 'onmessage', 'onopen'].includes(prop as string)) {
            return null;
          }
          return undefined;
        }
      }) as unknown as WebSocket : null
  };
}

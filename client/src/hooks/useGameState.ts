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
    fetchGameData().then(() => {
      connect();
    });

    return () => {
      disconnect();
    };
  }, [connect, disconnect, fetchGameData]);

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
        setRollingStoneNumber(data.rollingStoneNumber);
        
        // Clear rolling stone after animation
        setTimeout(() => {
          setRollingStoneNumber(null);
        }, 2000);
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
    
    sendMessage('roll_stone', {
      gameId: parseInt(gameId),
    });
  }, [isConnected, game, gameId, sendMessage]);

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
  const createNewGame = useCallback(async (playerCount: number, stake: number) => {
    try {
      const response = await apiRequest('POST', '/api/games', {
        maxPlayers: playerCount,
        stake
      });
      
      const data = await response.json();
      setLocation(`/game/${data.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new game',
        variant: 'destructive',
      });
    }
  }, [setLocation, toast]);

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

  // In single player games, check if this is a bot game with the special bot user ID
  const isBotGame = players.some(p => p.userId === 9999); // 9999 is BOT_USER_ID from gameManager
  const isBotTurn = currentTurnPlayerId === 9999; // Check if it's the bot's turn
  
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
    createNewGame
  };
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Game, GamePlayer, Message, User } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { 
  playBackgroundMusic, 
  stopBackgroundMusic, 
  updateSoundSettings, 
  soundSettings
} from "@/lib/sounds";
import { Volume2, VolumeX, Music, Users, MessageSquare, Send, Bell, X } from "lucide-react";
import GameStone from "@/components/game/GameStone";
import ProfessionalVoiceChat from "@/components/game/ProfessionalVoiceChat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface MultiplayerGameBoardProps {
  gameId: number;
  players: (GamePlayer & { user: User })[];
  currentPlayer: GamePlayer & { user: User };
  game: Game;
  messages: Message[];
}

export default function MultiplayerGameBoard({ 
  gameId, 
  players, 
  currentPlayer, 
  game, 
  messages 
}: MultiplayerGameBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for board and stone animations
  const [rollingStoneIndex, setRollingStoneIndex] = useState<number | null>(null);
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  
  // Chat modal state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<number | null>(null);
  
  // State for the dice path animation
  const [boardPath, setBoardPath] = useState<number[]>([]);
  const [dicePosition, setDicePosition] = useState({ top: 0, left: 0 });
  const [currentPathIdx, setCurrentPathIdx] = useState(0);
  const [rollSpeed, setRollSpeed] = useState(200);
  const [rollTimer, setRollTimer] = useState<NodeJS.Timeout | null>(null);
  
  // State for winner animation
  const [finalStoneSelected, setFinalStoneSelected] = useState<boolean>(false);
  const [showBall, setShowBall] = useState(false);
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  
  // Music and sound
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [currentMusic, setCurrentMusic] = useState('BG_MUSIC_ROCK');
  
  // Speech synthesis
  const { speak, cancel, speaking, supported: speechSupported } = useSpeechSynthesis();
  const [announceText, setAnnounceText] = useState('');



  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  const diceRef = useRef<HTMLDivElement>(null);

  // Check if current player has already rolled
  useEffect(() => {
    if (currentPlayer.rolledNumber) {
      setHasRolled(true);
      setSelectedStone(currentPlayer.rolledNumber);
      setFinalStoneSelected(true);
    }
  }, [currentPlayer.rolledNumber]);

  // Computer voice announcements for game events
  const announceWinner = useCallback((rolledNumber: number, winnerName: string) => {
    if (!speechSupported) return;
    
    let message = `${winnerName} wins with stone ${rolledNumber}!`;
    
    // Special announcements for special stones
    if (rolledNumber === 1000 || rolledNumber === 500) {
      message = `Special stone ${rolledNumber}! ${winnerName} wins with double payout!`;
    } else if (rolledNumber === 3355 || rolledNumber === 6624) {
      message = `Super stone ${rolledNumber}! ${winnerName} wins with triple payout!`;
    }
    
    console.log('🎤 Computer Voice:', message);
    
    // Speak with deep voice settings
    setTimeout(() => {
      speak(message, { 
        pitch: 0.6,  // Deep voice
        rate: 0.8,   // Slower speech
        volume: 1.0  // Full volume
      });
    }, 1000);
  }, [speechSupported, speak]);

  // Enhanced game completion detection
  useEffect(() => {
    if (game.status === 'completed' && game.winnerIds && game.winningNumber) {
      // Find winner player
      const winners = players.filter(p => game.winnerIds?.includes(p.userId));
      
      if (winners.length > 0) {
        setSelectedStone(game.winningNumber);
        setFinalStoneSelected(true);
        
        // Announce winner(s) with computer voice
        if (winners.length === 1) {
          announceWinner(game.winningNumber, winners[0].user.username);
        } else {
          // Multiple winners
          const winnerNames = winners.map(w => w.user.username).join(' and ');
          announceWinner(game.winningNumber, winnerNames);
        }
        
        // Show victory celebration
        setTimeout(() => {
          toast({
            title: "🎉 Game Complete!",
            description: `Winner${winners.length > 1 ? 's' : ''}: ${winners.map(w => w.user.username).join(', ')} with stone ${game.winningNumber}!`,
          });
        }, 1500);
      }
    }
  }, [game.status, game.winnerIds, game.winningNumber, players, announceWinner, toast]);

  // Track unread messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (lastReadMessageId && latestMessage.id > lastReadMessageId) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [messages, lastReadMessageId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/games/${gameId}/messages`, {
        content,
        type: "player",
      });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/messages`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleChatOpen = () => {
    setIsChatOpen(true);
    setUnreadCount(0);
    if (messages.length > 0) {
      setLastReadMessageId(messages[messages.length - 1].id);
    }
  };

  // Define the stones layout (same as demo-new)
  const stones = [
    { number: 1, row: 1, index: 0 },
    { number: 2, row: 1, index: 1 },
    { number: 3, row: 1, index: 2 },
    { number: 4, row: 1, index: 3 },
    { number: 5, row: 1, index: 4 },
    { number: 6, row: 1, index: 5 },
    { number: 500, row: 2, index: 6, isSpecial: true },
    { number: 1000, row: 2, index: 7, isSpecial: true },
    { number: 3355, row: 3, index: 8, isSuper: true },
    { number: 6624, row: 3, index: 9, isSuper: true },
  ];

  // Small stones for additional numbers
  const smallStones = [
    { number: 11, row: 5, index: 0 },
    { number: 37, row: 5, index: 1 },
    { number: 72, row: 5, index: 2 },
    { number: 17, row: 5, index: 3 },
    { number: 42, row: 5, index: 4 },
    { number: 8, row: 5, index: 5 },
    { number: 30, row: 5, index: 6 },
    { number: 91, row: 5, index: 7 },
    { number: 27, row: 5, index: 8 },
    { number: 5, row: 5, index: 9 },
    { number: 40, row: 5, index: 10 },
    { number: 6, row: 6, index: 0 },
    { number: 80, row: 6, index: 1 },
    { number: 3, row: 6, index: 2 },
    { number: 26, row: 6, index: 3 },
    { number: 100, row: 6, index: 4 },
    { number: 19, row: 6, index: 5 },
    { number: 14, row: 6, index: 6 },
    { number: 43, row: 6, index: 7 },
    { number: 16, row: 6, index: 8 },
    { number: 71, row: 6, index: 9 },
    { number: 10, row: 6, index: 10 },
  ];

  // Roll mutation
  const rollMutation = useMutation({
    mutationFn: async ({ gameId }: { gameId: number }) => {
      const res = await apiRequest("POST", `/api/games/${gameId}/roll`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setHasRolled(true);
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}`] });
      
      toast({
        title: "Roll Submitted!",
        description: `You rolled ${data.rolledNumber}. Waiting for other players...`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Roll Failed",
        description: error.message || "Failed to submit your roll",
        variant: "destructive",
      });
      setIsRolling(false);
      setHasRolled(false);
    },
  });

  // Old chat mutation removed - using new modal system now

  // Function to get stone position
  const getStonePosition = (stoneIndexOrNumber: number, isNumber = false) => {
    let stoneElement;
    
    if (isNumber) {
      const allStones = [...stones, ...smallStones];
      const foundStone = allStones.find(s => s.number === stoneIndexOrNumber);
      
      if (!foundStone) {
        console.error('Could not find stone with number:', stoneIndexOrNumber);
        return { top: 200, left: 200 };
      }
      
      if (foundStone.row <= 4) {
        stoneElement = document.getElementById(`stone-${foundStone.index}`);
      } else {
        stoneElement = document.getElementById(`small-stone-${foundStone.index}`);
      }
    } else {
      stoneElement = document.getElementById(`stone-${stoneIndexOrNumber}`);
    }
    
    if (stoneElement && boardRef.current) {
      const rect = stoneElement.getBoundingClientRect();
      const boardRect = boardRef.current.getBoundingClientRect();
      
      return {
        top: rect.top - boardRect.top + (rect.height / 2) - 20,
        left: rect.left - boardRect.left + (rect.width / 2) - 20,
      };
    }
    
    return { top: 200, left: 200 };
  };

  // Create dice path
  useEffect(() => {
    setTimeout(() => {
      const path: number[] = [];
      const allStoneIndices = stones.map(stone => stone.index);
      const shuffledIndices = [...allStoneIndices];
      
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      }
      
      shuffledIndices.forEach(index => path.push(index));
      setBoardPath(path);
      
      if (boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        setDicePosition({
          top: boardRect.height / 2 - 20,
          left: boardRect.width / 2 - 20,
        });
      }
    }, 500);
  }, []);

  // Dice movement function
  const moveDiceAlongPath = useCallback((currentIdx: number, targetIdx: number | null, finalStoneIndex: number | null) => {
    if (!isRolling) return;
    
    if (rollTimer) clearTimeout(rollTimer);
    
    if (boardPath.length === 0) {
      const newPath: number[] = [];
      stones.forEach((stone, idx) => newPath.push(idx));
      setBoardPath(newPath);
      setTimeout(() => moveDiceAlongPath(currentIdx, targetIdx, finalStoneIndex), 100);
      return;
    }
    
    const pathPosition = currentIdx % boardPath.length;
    const stoneIdx = boardPath[pathPosition];
    setRollingStoneIndex(stoneIdx);
    
    if (currentIdx % 3 === 0) {
      try {
        const audio = new Audio();
        audio.src = '/rolling-dice.mp3';
        audio.volume = 0.2;
        audio.play().catch(e => console.log('Audio failed:', e));
      } catch (e) {
        console.log('Audio not supported');
      }
    }
    
    const stonePosition = getStonePosition(stoneIdx);
    setDicePosition(stonePosition);
    setShowBall(true);
    
    if (targetIdx !== null && currentIdx >= targetIdx) {
      setTimeout(() => {
        let finalStone;
        
        if (finalStoneIndex !== null) {
          finalStone = stones.find(s => s.index === finalStoneIndex);
          const stoneElement = document.getElementById(`stone-${finalStoneIndex}`);
          
          if (stoneElement && boardRef.current) {
            const rect = stoneElement.getBoundingClientRect();
            const boardRect = boardRef.current.getBoundingClientRect();
            
            setDicePosition({
              top: rect.top - boardRect.top + (rect.height / 2) - 20,
              left: rect.left - boardRect.left + (rect.width / 2) - 20,
            });
            
            setRollingStoneIndex(finalStoneIndex);
          }
        } else {
          const finalStoneIdx = boardPath[targetIdx % boardPath.length];
          finalStone = stones.find(s => s.index === finalStoneIdx);
        }
        
        setTimeout(() => {
          if (finalStone) {
            setRollingStoneIndex(null);
            setSelectedStone(finalStone.number);
            setIsRolling(false);
            setFinalStoneSelected(true);
            
            // Submit the roll to the server
            rollMutation.mutate({ gameId });
            
            const isSpecial = 'isSpecial' in finalStone && finalStone.isSpecial;
            const isSuper = 'isSuper' in finalStone && finalStone.isSuper;
            
            toast({
              title: "You Rolled: " + finalStone.number,
              description: isSpecial ? "You hit a special stone!" : 
                        isSuper ? "You hit a super stone!" : 
                        "Good roll!",
            });

            // Announce the result
            if (speechSupported) {
              const announcement = `You rolled ${finalStone.number}${isSpecial ? ', a special stone!' : isSuper ? ', a super stone!' : '!'}`;
              speak({ text: announcement });
            }
          }
        }, 1000);
      }, 500);
      return;
    }
    
    const nextSpeed = Math.min(rollSpeed + 15, 500);
    setRollSpeed(nextSpeed);
    
    const nextTimeout = setTimeout(() => {
      moveDiceAlongPath(currentIdx + 1, targetIdx, finalStoneIndex);
    }, nextSpeed);
    
    setRollTimer(nextTimeout);
  }, [isRolling, boardPath, rollSpeed, rollTimer, toast, stones, gameId, rollMutation, speechSupported, speak]);

  // Handle roll dice
  const handleRollDice = useCallback(() => {
    if (isRolling || rollingStoneIndex !== null || hasRolled) return;
    
    console.log('Starting dice roll animation');
    
    if (musicEnabled) {
      try {
        playBackgroundMusic(currentMusic, 0.3);
      } catch (error) {
        console.error("Failed to start background music:", error);
      }
    }
    
    setIsRolling(true);
    setRollSpeed(200);
    setShowBall(true);
    setIsBoardShaking(true);
    
    setTimeout(() => setIsBoardShaking(false), 1500);
    
    // Randomly select a target stone
    const randomStoneIndex = Math.floor(Math.random() * stones.length);
    const targetStone = stones[randomStoneIndex];
    
    const rollDuration = Math.random() * 3000 + 4000; // 4-7 seconds
    const targetIdx = Math.floor(rollDuration / 200);
    
    console.log('Rolling for', rollDuration, 'ms, target stone:', targetStone.number);
    
    moveDiceAlongPath(0, targetIdx, targetStone.index);
  }, [isRolling, rollingStoneIndex, hasRolled, musicEnabled, currentMusic, moveDiceAlongPath, stones]);

  // Send chat message
  // Old sendMessage function removed - using new modal chat system

  // Check if all players have rolled
  const allPlayersRolled = players.every(p => p.rolledNumber !== null);
  const gameComplete = game.status === 'completed';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Game Board - Takes up most space */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Game #{game.id} - Big Boys Game
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Stake: {formatCurrency(game.stake, game.currency)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMusicEnabled(!musicEnabled)}
                  >
                    {musicEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Game Board */}
              <div 
                ref={boardRef}
                id="multiplayer-game-board"
                className={cn(
                  "relative bg-gradient-to-br from-green-800 via-green-700 to-green-600 rounded-xl p-8 min-h-[600px] border-4 border-yellow-600 shadow-2xl",
                  isBoardShaking && "shaking-board"
                )}
              >
                {/* CSS Styles */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .dice-element {
                      animation: pulse 0.5s infinite alternate, spin 2s linear infinite;
                      z-index: 1000;
                      pointer-events: none;
                      position: absolute;
                      width: 40px;
                      height: 40px;
                      background-color: #FF0000;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: white;
                      font-weight: bold;
                      font-size: 12px;
                      text-shadow: 0 0 3px black;
                      box-shadow: 0 0 10px 5px rgba(255, 215, 0, 0.6);
                      border: 3px solid white;
                      transition: left 0.3s ease-out, top 0.3s ease-out;
                    }
                    
                    @keyframes pulse {
                      0% { transform: scale(1); opacity: 1; }
                      100% { transform: scale(1.2); opacity: 0.8; }
                    }
                    
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    
                    .shaking-board {
                      animation: shakeBoard 0.5s cubic-bezier(.36,.07,.19,.97) both;
                      animation-iteration-count: 3;
                    }
                    
                    @keyframes shakeBoard {
                      10%, 90% { transform: translate3d(-1px, 0, 0); }
                      20%, 80% { transform: translate3d(2px, 0, 0); }
                      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                      40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                  `
                }} />

                {/* Main Stones Grid - Mobile Optimized */}
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
                  {stones.map((stone) => (
                    <GameStone
                      key={stone.index}
                      number={stone.number}
                      index={stone.index}
                      isRolling={rollingStoneIndex === stone.index}
                      isSelected={selectedStone === stone.number}
                      isSpecial={stone.isSpecial}
                      isSuper={stone.isSuper}
                      isWinner={finalStoneSelected && selectedStone === stone.number}
                    />
                  ))}
                </div>

                {/* Small Stones Grid - Mobile Optimized */}
                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-11 gap-1 sm:gap-2">
                  {smallStones.map((stone) => (
                    <GameStone
                      key={`small-${stone.index}`}
                      number={stone.number}
                      index={stone.index}
                      isRolling={rollingStoneIndex === stone.index}
                      isSelected={selectedStone === stone.number}
                      isSmall={true}
                      id={`small-stone-${stone.index}`}
                    />
                  ))}
                </div>

                {/* Rolling Ball */}
                {showBall && (
                  <div
                    ref={diceRef}
                    className="dice-element"
                    style={{
                      top: `${dicePosition.top}px`,
                      left: `${dicePosition.left}px`,
                    }}
                  >
                    🎲
                  </div>
                )}

                {/* Enhanced Winner Overlay with Confetti */}
                {finalStoneSelected && game.status === 'completed' && (
                  <div className="winner-overlay absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
                    {/* Confetti particles */}
                    <div className="confetti-container absolute inset-0 pointer-events-none">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="confetti-particle absolute"
                          style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Winner announcement */}
                    <div className="text-center z-10">
                      <h2 className="text-6xl font-bold text-yellow-400 mb-4 winner-text-glow">
                        WINNER!
                      </h2>
                      <p className="text-3xl font-bold text-white mb-2 winner-pulse">
                        Stone {selectedStone}
                      </p>
                      <p className="text-xl text-yellow-300">
                        {game.winnerIds && players.filter(p => game.winnerIds?.includes(p.userId)).map(p => p.user.username).join(' & ')}
                      </p>
                      <div className="mt-6">
                        <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-full shadow-lg">
                          🎉 Congratulations! 🎉
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Roll Button - Mobile Optimized */}
                <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2">
                  <Button
                    onClick={handleRollDice}
                    disabled={isRolling || rollingStoneIndex !== null || hasRolled || gameComplete}
                    className={cn(
                      "text-sm sm:text-lg font-bold py-2 px-4 sm:py-3 sm:px-8 rounded-lg shadow-lg transform transition",
                      (isRolling || rollingStoneIndex !== null || hasRolled || gameComplete)
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-yellow-600 hover:bg-yellow-700 hover:scale-105 text-white'
                    )}
                  >
                    {gameComplete ? 'GAME ENDED' : hasRolled ? 'ROLLED!' : isRolling ? 'ROLLING...' : 'ROLL STONE'}
                  </Button>
                  <div className="mt-1 sm:mt-2 text-xs text-white text-center">
                    {gameComplete
                      ? 'Game completed - check results!'
                      : hasRolled
                        ? `You rolled ${selectedStone}! Waiting for others...`
                        : isRolling 
                          ? 'Rolling the stones...' 
                          : 'Click to roll your stone!'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Players */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                        {player.user.avatarInitials}
                      </div>
                      <span className="text-sm font-medium">{player.user.username}</span>
                      {player.isWinner && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">Winner!</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {player.rolledNumber ? `${player.rolledNumber}` : 'Rolling...'}
                    </div>
                  </div>
                ))}
              </div>
              
              {allPlayersRolled && !gameComplete && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    All players have rolled! Determining winner...
                  </p>
                </div>
              )}
              
              {gameComplete && game.winningNumber && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-bold">
                    🎉 Winning Number: {game.winningNumber}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Prize distributed to winners!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Professional Voice Chat for higher stakes */}
          {game.stake >= 20000 && (
            <div className="mb-6">
              <ProfessionalVoiceChat game={game} players={players} currentUserId={currentPlayer?.userId} />
            </div>
          )}
        </div>
      </div>

      {/* Notification Badge for Header */}
      {unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="destructive" className="animate-pulse">
            <Bell className="h-3 w-3 mr-1" />
            {unreadCount} new message{unreadCount > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Floating Chat Button - Always Visible */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        <div className="relative">
          <MessageSquare className="h-6 w-6 text-white" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </Button>

      {/* Chat Modal */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Game Chat
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <ScrollArea className="h-80 w-full border rounded-md p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs text-gray-400">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const player = players.find(p => p.userId === message.userId);
                    return (
                      <div key={message.id} className={cn(
                        "flex gap-2 text-sm",
                        message.type === "system" && "justify-center"
                      )}>
                        {message.type !== "system" && player && (
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {player.user.avatarInitials}
                          </div>
                        )}
                        <div className={cn(
                          "flex-1",
                          message.type === "system" && "text-center text-gray-600 italic"
                        )}>
                          {message.type !== "system" && player && (
                            <div className="font-medium text-gray-900 mb-1">
                              {player.user.username}
                            </div>
                          )}
                          <div className={cn(
                            "text-gray-700",
                            message.type === "system" && "text-gray-600"
                          )}>
                            {message.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
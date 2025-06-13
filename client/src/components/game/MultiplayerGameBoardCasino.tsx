import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Game, GamePlayer, User, Message } from "@shared/schema";
import ProfessionalVoiceChat from "./ProfessionalVoiceChat";
import { Volume2, VolumeX, Music, MessageSquare, Send, Bell, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  playBackgroundMusic, 
  stopBackgroundMusic, 
  updateSoundSettings, 
  soundSettings
} from "@/lib/sounds";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface MultiplayerGameBoardCasinoProps {
  gameId: number;
  players: (GamePlayer & { user: User })[];
  currentPlayer: GamePlayer & { user: User };
  game: Game;
  messages: Message[];
}

export default function MultiplayerGameBoardCasino({ 
  gameId, 
  players, 
  currentPlayer, 
  game, 
  messages 
}: MultiplayerGameBoardCasinoProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { speak, cancel, speaking } = useSpeechSynthesis();
  
  // Game state
  const [hasRolled, setHasRolled] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [currentStonePosition, setCurrentStonePosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rollingStoneVisible, setRollingStoneVisible] = useState(false);
  
  // Define the board path for stone movement animation
  const boardPath = [
    28, 21, 105, 500, 99, 20, 82, 3,  // Top row
    1000,  // Super stone
    33, 55, 66, 24,  // Individual stones
    85, 84, 45, 78, 72, 61, 39, 95,  // Row 2
    44, 77, 29, 8, 48, 67, 19, 92,   // Row 3
    15, 74, 36, 51, 88, 23, 65, 47,  // Row 4
    87, 31, 56, 79, 4, 93, 68, 17,   // Row 5
    52, 86, 41, 64, 25, 12, 76, 59   // Row 6
  ];

  // Get stone position based on current path index - covers ALL board positions
  const getStonePosition = (pathIndex: number) => {
    const stoneValue = boardPath[pathIndex];
    
    // Calculate position to match the actual board layout
    if (pathIndex < 8) {
      // Top row: 28, 21, 105, 500, 99, 20, 82, 3
      const col = pathIndex;
      return {
        top: '80px',
        left: `${100 + (col * 90)}px`
      };
    } else if (pathIndex === 8) {
      // Super stone 1000 - center position
      return {
        top: '180px',
        left: '400px'
      };
    } else if (pathIndex >= 9 && pathIndex <= 12) {
      // Individual stones row: 33, 55, 66, 24
      const col = pathIndex - 9;
      return {
        top: '280px',
        left: `${250 + (col * 90)}px`
      };
    } else {
      // Bottom grid positions - calculate for all remaining numbers
      const remainingIndex = pathIndex - 13;
      const gridRows = 6; // We have 6 rows in the bottom grid
      const gridCols = 8; // 8 columns per row
      
      const row = Math.floor(remainingIndex / gridCols);
      const col = remainingIndex % gridCols;
      
      return {
        top: `${380 + (row * 70)}px`,  // Start below individual stones
        left: `${100 + (col * 90)}px`  // Same spacing as top row
      };
    }
  };
  const [musicEnabled, setMusicEnabled] = useState(false);

  // Chat modal state
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Winner congratulations modal state
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerData, setWinnerData] = useState<{ winners: (GamePlayer & { user: User })[], winningNumber: number | null } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Update unread count when messages change
  useEffect(() => {
    if (!isChatOpen && messages.length) {
      setUnreadCount(messages.length);
    }
  }, [messages.length, isChatOpen]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Check if current player has already rolled
  useEffect(() => {
    if (currentPlayer?.rolledNumber !== null) {
      setHasRolled(true);
    }
  }, [currentPlayer]);

  // Detect game completion and show winner modal
  useEffect(() => {
    if (game.status === 'completed' && game.winnerIds && game.winningNumber) {
      const winners = players.filter(p => game.winnerIds?.includes(p.userId));
      if (winners.length > 0) {
        setWinnerData({ winners, winningNumber: game.winningNumber });
        setShowWinnerModal(true);
      }
    }
  }, [game.status, game.winnerIds, game.winningNumber, players]);

  // Animated stone movement function
  const animateStoneMovement = async (steps: number) => {
    setIsAnimating(true);
    setRollingStoneVisible(true);
    let currentStep = 0;
    
    return new Promise<void>((resolve) => {
      const moveInterval = setInterval(() => {
        if (currentStep >= steps) {
          clearInterval(moveInterval);
          setIsAnimating(false);
          setTimeout(() => {
            setRollingStoneVisible(false);
          }, 1000); // Keep stone visible for 1 second after landing
          resolve();
        } else {
          setCurrentStonePosition((prev) => (prev + 1) % boardPath.length);
          currentStep++;
        }
      }, 300); // 300ms between each step for smooth animation
    });
  };

  const rollMutation = useMutation({
    mutationFn: async ({ gameId }: { gameId: number }) => {
      const response = await apiRequest("POST", `/api/games/${gameId}/roll`);
      return response.json();
    },
    onMutate: async () => {
      setIsRolling(true);
      setHasRolled(true);
      
      // Generate dice roll (1-6) and animate stone movement
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      
      // Animate the stone moving step-by-step around the board
      await animateStoneMovement(diceRoll);
      
      // Set the final stone where we landed
      const landedStone = boardPath[currentStonePosition];
      setSelectedStone(landedStone);
      
      // Brief pause to show final position
      setTimeout(() => {
        setIsRolling(false);
      }, 1000);
    },
    onSuccess: (data) => {
      setTimeout(() => {
        // Announce winner if game completed
        if (data.winningNumber) {
          const isSpecial = [500, 1000].includes(data.winningNumber);
          const isSuper = [3355, 6624].includes(data.winningNumber);
          
          let message = `Winner! Stone ${data.winningNumber}!`;
          if (isSuper) {
            message = `Super stone winner! ${data.winningNumber}! Incredible!`;
          } else if (isSpecial) {
            message = `Special stone winner! ${data.winningNumber}! Amazing!`;
          }
          
          speak(message, { pitch: 0.1, rate: 0.6 });
        }
        
        queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
      }, 3000);
    },
    onError: (error: Error) => {
      setIsRolling(false);
      setHasRolled(false);
      setSelectedStone(null);
      toast({
        title: "Roll Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async ({ gameId, content }: { gameId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/games/${gameId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
    },
  });

  const handleRoll = () => {
    if (hasRolled || isRolling || game.status !== 'in_progress') return;
    rollMutation.mutate({ gameId });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    chatMutation.mutate({ gameId, content: newMessage.trim() });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Game Board */}
      <div className="lg:col-span-2 flex-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Multiplayer Game Board</h2>
          
          {/* Sound Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateSoundSettings({ 
                  gameSoundsEnabled: !soundSettings.gameSoundsEnabled 
                });
              }}
              className="flex items-center gap-1"
            >
              {soundSettings.gameSoundsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Sound
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMusicEnabled(!musicEnabled);
                if (!musicEnabled) {
                  playBackgroundMusic("BG_MUSIC_MAIN");
                } else {
                  stopBackgroundMusic();
                }
              }}
              className="flex items-center gap-1"
            >
              <Music className="h-4 w-4" />
              Music
            </Button>
          </div>
        </div>

        {/* Game Status */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">
                Stake: {game.currency} {game.stake.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                Total Pot: {game.currency} {game.stakePot.toLocaleString()}
              </p>
            </div>
            <Badge variant={game.status === "completed" ? "default" : "secondary"}>
              {game.status}
            </Badge>
          </div>
        </div>

        {/* 🎯 CASINO-STYLE GREEN FELT GAME BOARD */}
        <div className="bg-gradient-to-b from-green-600 to-green-700 rounded-2xl shadow-2xl border-8 border-yellow-600 p-8 mb-6 relative">
          {/* 🪨 VISIBLE ROLLING STONE THAT MOVES AROUND THE BOARD */}
          {rollingStoneVisible && (
            <div 
              className="absolute z-50 w-12 h-12 transition-all duration-300 ease-in-out"
              style={getStonePosition(currentStonePosition)}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 rounded-full shadow-2xl border-2 border-white flex items-center justify-center animate-bounce">
                <div className="text-2xl animate-spin">🎲</div>
              </div>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto">
            

            
            {/* Top Row with Special and Super Stones */}
            <div className="flex justify-center gap-3 mb-6">
              {[28, 21, 105, 500, 99, 20, 82, 3].map((num, index) => (
                <div
                  key={num}
                  className={`
                    w-16 h-20 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg
                    ${num === 500 ? 'bg-yellow-400 text-black border-2 border-yellow-600' : 
                      index === 0 || index === 5 ? 'bg-red-500 text-white border-2 border-red-700' : 
                      'bg-white text-black border-2 border-gray-300'}
                    ${isAnimating && boardPath[currentStonePosition] === num ? 'ring-4 ring-blue-500 animate-pulse bg-blue-100' : ''}
                    ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                    ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                    hover:scale-105 transition-transform cursor-pointer
                  `}
                >
                  {num}
                </div>
              ))}
            </div>
            
            {/* Super Stone Row */}
            <div className="flex justify-center gap-3 mb-6">
              <div
                className={`
                  w-16 h-20 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg
                  bg-purple-500 text-white border-2 border-purple-700
                  ${isRolling && selectedStone === 1000 ? 'animate-bounce' : ''}
                  ${game.winningNumber === 1000 && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                  hover:scale-105 transition-transform cursor-pointer
                `}
              >
                1000
              </div>
            </div>
            
            {/* Individual Stones Row */}
            <div className="flex justify-center gap-3 mb-6">
              {[33, 55, 66, 24].map((num) => (
                <div
                  key={num}
                  className={`
                    w-16 h-20 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg
                    bg-blue-500 text-white border-2 border-blue-700
                    ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                    ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                    hover:scale-105 transition-transform cursor-pointer
                  `}
                >
                  {num}
                </div>
              ))}
            </div>
            
            {/* Main White Stone Rows */}
            <div className="space-y-4">
              {/* Row 2 */}
              <div className="flex justify-center gap-3">
                {[11, 37, 72, 17, 42, 8, 30, 91, 27, 5, 40].map((num) => (
                  <div
                    key={num}
                    className={`
                      w-16 h-20 bg-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg border-2 border-gray-300
                      ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                      ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                      hover:scale-105 transition-transform cursor-pointer
                    `}
                  >
                    {num}
                  </div>
                ))}
              </div>
              
              {/* Row 3 */}
              <div className="flex justify-center gap-3">
                {[6, 80, 3, 26, 100, 19, 14, 43, 16, 71, 10].map((num) => (
                  <div
                    key={num}
                    className={`
                      w-16 h-20 bg-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg border-2 border-gray-300
                      ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                      ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                      hover:scale-105 transition-transform cursor-pointer
                    `}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Golden Roll Button - Only for multiplayer when it's player's turn */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleRoll}
                disabled={hasRolled || isRolling || game.status !== 'in_progress'}
                className="
                  bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700
                  text-black font-bold text-xl px-12 py-4 rounded-2xl shadow-2xl border-4 border-yellow-300
                  transform hover:scale-105 transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                "
                size="lg"
              >
                {isRolling ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    🌀 ROLLING...
                  </div>
                ) : hasRolled ? (
                  <div className="flex items-center gap-2">
                    ✅ ROLLED
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    🎲 ROLL STONE
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Player Status Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {players.map((player) => (
            <div 
              key={player.userId}
              className={`
                p-4 rounded-lg border-2 transition-all
                ${player.userId === currentPlayer.userId 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-gray-50 border-gray-200'}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{player.user.username}</p>
                  <p className="text-sm text-gray-600">
                    {player.rolledNumber !== null 
                      ? `Rolled: ${player.rolledNumber}` 
                      : 'Waiting to roll...'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {player.user.avatarInitials}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Winner Congratulations Modal */}
        <Dialog open={showWinnerModal} onOpenChange={setShowWinnerModal}>
          <DialogContent className="sm:max-w-md">
            <div className="relative">
              {/* Close X button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-6 w-6 p-0"
                onClick={() => setShowWinnerModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Congratulations Content */}
              <div className="text-center py-6">
                <div className="mb-4">
                  {/* Animated celebration emojis */}
                  <div className="text-6xl mb-4 animate-bounce">🎉</div>
                  <h2 className="text-3xl font-bold text-green-600 mb-2">Congratulations!</h2>
                </div>
                
                {winnerData && (
                  <>
                    <div className="mb-4">
                      <p className="text-lg text-gray-700 mb-2">Winning Stone:</p>
                      <div className="text-4xl font-bold text-blue-600 bg-blue-50 rounded-lg py-2 px-4 inline-block">
                        #{winnerData.winningNumber}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-lg font-bold text-purple-800 mb-3">🏆 Winner{winnerData.winners.length > 1 ? 's' : ''}:</p>
                      {winnerData.winners.map((winner) => (
                        <div key={winner.userId} className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg p-3 mb-2">
                          <p className="text-xl font-bold text-purple-700">
                            👑 {winner.user.username}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      🎊 Game Complete! 🎊
                    </div>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sidebar */}
      <div className="lg:w-80 space-y-6">
        {/* Professional Voice Chat for higher stakes */}
        {game.stake >= 20000 && (
          <ProfessionalVoiceChat 
            game={game}
            players={players}
            currentUserId={currentPlayer.userId}
          />
        )}
      </div>

      {/* Floating Chat Button */}
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
              {!messages || messages.length === 0 ? (
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
                      <div key={message.id} className="flex gap-2 text-sm">
                        {player && (
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {player.user.avatarInitials}
                          </div>
                        )}
                        <div className="flex-1">
                          {player && (
                            <div className="font-medium text-gray-900 mb-1">
                              {player.user.username}
                            </div>
                          )}
                          <div className="text-gray-700">{message.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!newMessage.trim()}
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
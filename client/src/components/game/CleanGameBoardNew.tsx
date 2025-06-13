import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Game, GamePlayer, User, Message } from "@shared/schema";
import ProfessionalVoiceChat from "./ProfessionalVoiceChat";
import { Volume2, VolumeX, Music, MessageSquare, Send, Bell, X, Loader2 } from "lucide-react";
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
import { useResponsiveStoneSize } from "@/hooks/useResponsiveStoneSize";

interface CleanGameBoardProps {
  gameId: number;
  players: (GamePlayer & { user: User })[];
  currentPlayer: GamePlayer & { user: User };
  game: Game;
  messages: Message[];
}

export default function CleanGameBoardNew({ 
  gameId, 
  players, 
  currentPlayer, 
  game, 
  messages 
}: CleanGameBoardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const stoneSize = useResponsiveStoneSize();
  // Simple speech function using Web Speech API
  const speakText = (text: string, options?: { pitch?: number; rate?: number }) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = options?.pitch || 1;
      utterance.rate = options?.rate || 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Bot personality messages and interactions
  const getBotMessage = (type: 'greeting' | 'thinking' | 'rolling' | 'winning' | 'losing' | 'encouraging') => {
    const messages = {
      friendly: {
        greeting: ["Good luck! May the best player win!", "Ready to play? Let's have some fun!", "Nice to meet you! Looking forward to our game!"],
        thinking: ["Hmm, let me think about this...", "Analyzing the board...", "Considering my options..."],
        rolling: ["Here goes nothing!", "Rolling for luck!", "Let's see what happens!"],
        winning: ["Great game! Better luck next time!", "That was fun! Thanks for playing!", "Good match! You played well!"],
        losing: ["Well played! You deserved that win!", "Congratulations! You're really good at this!", "Nice strategy! I learned something today!"],
        encouraging: ["You're doing great!", "Nice move!", "Keep it up!"]
      },
      competitive: {
        greeting: ["Think you can beat me? Let's find out!", "I hope you're ready for a challenge!", "Time to show what I'm made of!"],
        thinking: ["Calculating the perfect move...", "Strategic analysis in progress...", "Finding your weakness..."],
        rolling: ["Watch and learn!", "This is how it's done!", "Prepare to be amazed!"],
        winning: ["As expected! Better luck next time!", "Victory is mine!", "I told you I was good!"],
        losing: ["Impressive! You actually beat me!", "Lucky shot! I'll get you next time!", "You got me this time, but I'll be back!"],
        encouraging: ["Not bad for a human!", "You're improving!", "Keep trying!"]
      },
      encouraging: {
        greeting: ["You've got this! Believe in yourself!", "Every game is a chance to learn!", "Play with confidence!"],
        thinking: ["Taking my time to make the best move...", "Every decision matters...", "Choosing carefully..."],
        rolling: ["Here's to a great outcome!", "Hoping for the best!", "Cross your fingers!"],
        winning: ["You played amazingly! Keep practicing!", "What a fantastic game! You'll get me next time!", "You're getting better with every game!"],
        losing: ["Wonderful job! You earned that victory!", "Brilliant play! You should be proud!", "Outstanding! You've really mastered this!"],
        encouraging: ["You're on the right track!", "Great thinking!", "I believe in you!"]
      }
    };
    const personalityMessages = messages[botPersonality];
    const messageArray = personalityMessages[type];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  };

  const triggerBotInteraction = (type: 'greeting' | 'thinking' | 'rolling' | 'winning' | 'losing' | 'encouraging') => {
    if (!showBotMessages) return;
    
    const message = getBotMessage(type);
    setInteractionCount(prev => prev + 1);
    
    // Show visual message
    toast({
      title: "🤖 Computer Player",
      description: message,
      duration: 3000,
    });
    
    // Speak the message with personality-based voice settings
    const voiceSettings = {
      friendly: { pitch: 1.1, rate: 1 },
      competitive: { pitch: 0.9, rate: 1.1 },
      encouraging: { pitch: 1.2, rate: 0.9 }
    };
    
    speakText(message, voiceSettings[botPersonality]);
  };
  
  // Game state
  const [hasRolled, setHasRolled] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [animatingStone, setAnimatingStone] = useState(false);
  const [botPersonality, setBotPersonality] = useState<'friendly' | 'competitive' | 'encouraging'>('friendly');
  const [interactionCount, setInteractionCount] = useState(0);
  const [showBotMessages, setShowBotMessages] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [currentStonePosition, setCurrentStonePosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [rollingStoneVisible, setRollingStoneVisible] = useState(false);
  
  // Mobile landscape orientation state
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  
  // Mobile detection and orientation handling
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  };
  
  // Handle mobile landscape orientation when game is complete
  useEffect(() => {
    if (game.status === "completed" && isMobile()) {
      // Show landscape hint message for better viewing
      toast({
        title: "Better View Available",
        description: "Rotate your device to landscape for the best viewing experience of the game results!",
        duration: 5000,
      });
      
      // Set flag for CSS optimization
      setIsMobileLandscape(true);
    } else {
      setIsMobileLandscape(false);
    }
  }, [game.status, toast]);
  
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

  // Detect game completion and show winner modal
  useEffect(() => {
    if (game.status === 'completed' && game.winnerIds && game.winningNumber) {
      const winners = players.filter(p => Array.isArray(game.winnerIds) && game.winnerIds.includes(p.userId));
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

  // Helper function to announce winner
  const announceWinner = (winningNumber: number) => {
    const isSpecial = [500, 1000].includes(winningNumber);
    const isSuper = [3355, 6624].includes(winningNumber);
    
    let message = `Winner! Stone ${winningNumber}!`;
    if (isSuper) {
      message = `Super stone winner! ${winningNumber}! Incredible!`;
    } else if (isSpecial) {
      message = `Special stone winner! ${winningNumber}! Amazing!`;
    }
    
    speakText(message, { pitch: 0.1, rate: 0.6 });
  };

  // Helper function to perform computer roll animation
  const performComputerRoll = async (gameData: any) => {
    // Trigger bot thinking interaction
    setBotThinking(true);
    triggerBotInteraction('thinking');
    
    // Show "analyzing the game" message for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Trigger bot rolling interaction
    setBotThinking(false);
    triggerBotInteraction('rolling');
    
    // Generate computer's dice roll
    const computerDiceRoll = Math.floor(Math.random() * 6) + 1;
    
    // Animate computer's stone movement
    await animateStoneMovement(computerDiceRoll);
    
    // Set the computer's final stone position
    const computerLandedStone = boardPath[currentStonePosition];
    setSelectedStone(computerLandedStone);
    
    // Brief pause then check for winner
    setTimeout(() => {
      if (gameData.winningNumber) {
        announceWinner(gameData.winningNumber);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
    }, 1500);
  };

  const rollMutation = useMutation({
    mutationFn: async ({ gameId }: { gameId: number }) => {
      console.log('Rolling stone for game:', gameId);
      const response = await apiRequest("POST", `/api/games/${gameId}/roll`);
      if (!response.ok) {
        throw new Error(`Roll failed: ${response.status} ${response.statusText}`);
      }
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
      // Check if this is a bot game
      const isBotGame = players.some(p => p.user.username === "Computer");
      
      if (isBotGame) {
        // Announce computer's turn after player rolls
        setTimeout(() => {
          speakText("Computer will now roll stone", { pitch: 0.8, rate: 0.7 });
          
          // Start computer rolling animation after announcement
          setTimeout(() => {
            performComputerRoll(data);
          }, 2000);
        }, 1000);
      } else {
        // For multiplayer games, just announce winner if game is complete
        setTimeout(() => {
          if (data.winningNumber) {
            announceWinner(data.winningNumber);
          }
          queryClient.invalidateQueries({ queryKey: ['/api/games', gameId] });
        }, 3000);
      }
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
    // For bot games, allow unlimited rolling regardless of game status
    if (isRolling) return;
    
    // Check if this is a bot game
    const isBotGame = players.some(p => p.user.username === "Computer");
    
    if (isBotGame) {
      // Quick sound announcement
      speakText("Computer will now roll stone", { pitch: 0.8, rate: 1.2 });
    }
    
    // Reset hasRolled for bot games to allow multiple rolls
    setHasRolled(false);
    rollMutation.mutate({ gameId });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    chatMutation.mutate({ gameId, content: newMessage.trim() });
  };

  return (
    <div className={`
      flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 p-2 sm:p-4 lg:p-6 min-h-screen bg-gradient-to-br from-green-50 to-blue-50
      ${game.status === "completed" && isMobile() ? 'mobile-landscape-container' : ''}
    `}>
      {/* Main Game Board - Mobile Responsive */}
      <div className={`lg:col-span-2 flex-1 ${game.status === "completed" && isMobile() ? 'game-board-main' : ''}`}>
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <h2 className="text-lg sm:text-xl font-bold">Game Board</h2>
          
          {/* Sound Controls - Mobile Responsive */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateSoundSettings({ 
                  gameSoundsEnabled: !soundSettings.gameSoundsEnabled 
                });
              }}
              className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm mobile-touch-target"
            >
              {soundSettings.gameSoundsEnabled ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" /> : <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />}
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
              className="flex items-center gap-1 flex-1 sm:flex-none text-xs sm:text-sm mobile-touch-target"
            >
              <Music className="h-3 w-3 sm:h-4 sm:w-4" />
              Music
            </Button>
          </div>
        </div>

        {/* Game Status - Mobile Responsive */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <p className="text-base sm:text-lg font-semibold">
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

        {/* 🎯 CASINO-STYLE GREEN FELT GAME BOARD - Mobile Responsive */}
        <div className="bg-gradient-to-b from-green-600 to-green-700 rounded-xl sm:rounded-2xl shadow-2xl border-4 sm:border-8 border-yellow-600 p-3 sm:p-6 lg:p-8 mb-6 relative overflow-hidden">
          {/* 🪨 VISIBLE ROLLING STONE THAT MOVES AROUND THE BOARD - Mobile Responsive */}
          {rollingStoneVisible && (
            <div 
              className="absolute z-50 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 transition-all duration-300 ease-in-out"
              style={getStonePosition(currentStonePosition)}
            >
              <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 rounded-full shadow-2xl border-2 border-white flex items-center justify-center animate-bounce">
                <div className="text-lg sm:text-xl lg:text-2xl animate-spin">🎲</div>
              </div>
            </div>
          )}
          
          <div className="max-w-4xl mx-auto">
            
            {/* Top Row with Special and Super Stones - Mobile Optimized */}
            <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 mb-4 sm:mb-6 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
              {[28, 21, 105, 500, 99, 20, 82, 3].map((num, index) => (
                <div
                  key={num}
                  className={`
                    game-stone flex items-center justify-center font-bold shadow-md sm:shadow-lg flex-shrink-0
                    ${num === 500 ? 'bg-yellow-400 text-black border-2 border-yellow-600' : 
                      index === 0 || index === 5 ? 'bg-red-500 text-white border-2 border-red-700' : 
                      'bg-white text-black border-2 border-gray-300'}
                    ${isAnimating && boardPath[currentStonePosition] === num ? 'ring-4 ring-blue-500 animate-pulse bg-blue-100' : ''}
                    ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                    ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                    hover:scale-105 transition-transform cursor-pointer touch-manipulation
                    active:scale-95
                  `}
                  style={{
                    width: `${stoneSize.width}px`,
                    height: `${stoneSize.height}px`,
                    fontSize: `${stoneSize.fontSize}px`,
                    borderRadius: `${stoneSize.borderRadius}px`,
                    minWidth: `${stoneSize.width}px`,
                    maxWidth: `${stoneSize.width}px`,
                    minHeight: `${stoneSize.height}px`,
                    maxHeight: `${stoneSize.height}px`
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            
            {/* Super Stone Row - Mobile Responsive */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div
                className={`
                  game-stone flex items-center justify-center font-bold shadow-md sm:shadow-lg
                  bg-purple-500 text-white border-2 border-purple-700
                  ${isAnimating && boardPath[currentStonePosition] === 1000 ? 'ring-4 ring-blue-500 animate-pulse bg-blue-100' : ''}
                  ${isRolling && selectedStone === 1000 ? 'animate-bounce' : ''}
                  ${game.winningNumber === 1000 && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                  hover:scale-105 transition-transform cursor-pointer touch-manipulation
                  active:scale-95
                `}
                style={{
                  width: `${stoneSize.width}px`,
                  height: `${stoneSize.height}px`,
                  fontSize: `${stoneSize.fontSize}px`,
                  borderRadius: `${stoneSize.borderRadius}px`,
                  minWidth: `${stoneSize.width}px`,
                  maxWidth: `${stoneSize.width}px`,
                  minHeight: `${stoneSize.height}px`,
                  maxHeight: `${stoneSize.height}px`
                }}
              >
                1000
              </div>
            </div>
            
            {/* Individual Stones Row - Mobile Responsive */}
            <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 mb-4 sm:mb-6 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
              {[33, 55, 66, 24].map((num) => (
                <div
                  key={num}
                  className={`
                    game-stone flex items-center justify-center font-bold shadow-md sm:shadow-lg flex-shrink-0
                    bg-blue-500 text-white border-2 border-blue-700
                    ${isAnimating && boardPath[currentStonePosition] === num ? 'ring-4 ring-blue-500 animate-pulse bg-blue-100' : ''}
                    ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                    ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                    hover:scale-105 transition-transform cursor-pointer touch-manipulation
                    active:scale-95
                  `}
                  style={{
                    width: `${stoneSize.width}px`,
                    height: `${stoneSize.height}px`,
                    fontSize: `${stoneSize.fontSize}px`,
                    borderRadius: `${stoneSize.borderRadius}px`,
                    minWidth: `${stoneSize.width}px`,
                    maxWidth: `${stoneSize.width}px`,
                    minHeight: `${stoneSize.height}px`,
                    maxHeight: `${stoneSize.height}px`
                  }}
                >
                  {num}
                </div>
              ))}
            </div>
            
            {/* Main White Stone Rows - Mobile Responsive */}
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              {/* Row 2 - Mobile Optimized */}
              <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
                {[11, 37, 72, 17, 42, 8, 30, 91, 27, 5, 40].map((num) => (
                  <div
                    key={num}
                    className={`
                      game-stone bg-white flex items-center justify-center font-bold shadow-md sm:shadow-lg border-2 border-gray-300 flex-shrink-0
                      ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                      ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                      hover:scale-105 transition-transform cursor-pointer touch-manipulation
                      active:scale-95
                    `}
                    style={{
                      width: `${stoneSize.width}px`,
                      height: `${stoneSize.height}px`,
                      fontSize: `${stoneSize.fontSize}px`,
                      borderRadius: `${stoneSize.borderRadius}px`,
                      minWidth: `${stoneSize.width}px`,
                      maxWidth: `${stoneSize.width}px`,
                      minHeight: `${stoneSize.height}px`,
                      maxHeight: `${stoneSize.height}px`
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
              
              {/* Row 3 - Mobile Optimized */}
              <div className="flex justify-center gap-1 sm:gap-2 lg:gap-3 overflow-x-auto px-1 sm:px-0 scrollbar-hide">
                {[6, 80, 3, 26, 100, 19, 14, 43, 16, 71, 10].map((num) => (
                  <div
                    key={num}
                    className={`
                      game-stone bg-white flex items-center justify-center font-bold shadow-md sm:shadow-lg border-2 border-gray-300 flex-shrink-0
                      ${isRolling && selectedStone === num ? 'animate-bounce' : ''}
                      ${game.winningNumber === num && game.status === "completed" ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
                      hover:scale-105 transition-transform cursor-pointer touch-manipulation
                      active:scale-95
                    `}
                    style={{
                      width: `${stoneSize.width}px`,
                      height: `${stoneSize.height}px`,
                      fontSize: `${stoneSize.fontSize}px`,
                      borderRadius: `${stoneSize.borderRadius}px`,
                      minWidth: `${stoneSize.width}px`,
                      maxWidth: `${stoneSize.width}px`,
                      minHeight: `${stoneSize.height}px`,
                      maxHeight: `${stoneSize.height}px`
                    }}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Golden Roll Button - Mobile Optimized */}
            <div className="flex justify-center mt-6 sm:mt-8 px-2 sm:px-0">
              <Button
                onClick={handleRoll}
                disabled={isRolling}
                className="
                  bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700
                  text-black font-bold text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-4 sm:py-6 lg:py-4 
                  rounded-xl sm:rounded-2xl shadow-2xl border-2 sm:border-4 border-yellow-300
                  transform hover:scale-105 transition-all duration-200 touch-manipulation
                  active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  min-h-[56px] sm:min-h-[60px] w-full max-w-sm sm:max-w-xs lg:w-auto mobile-touch-target
                "
                size="lg"
              >
                {isRolling ? (
                  <div className="flex items-center gap-2 sm:gap-3 justify-center">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">🌀 ROLLING...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3 justify-center">
                    <span className="text-xl sm:text-2xl">🎲</span>
                    <span className="text-sm sm:text-base">ROLL STONE</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Game Results */}
        {game.status === "completed" && game.winningNumber && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-700 mb-2">🎉 Game Complete!</h3>
              <p className="text-lg mb-4">
                Winning Stone: <span className="font-bold text-2xl text-blue-600">#{game.winningNumber}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={`lg:w-80 space-y-6 ${game.status === "completed" && isMobile() ? 'game-sidebar' : ''}`}>
        {/* Professional Voice Chat for higher stakes */}
        {game.stake >= 20000 && (
          <ProfessionalVoiceChat 
            game={game}
            players={players}
            currentUserId={currentPlayer.userId}
          />
        )}
      </div>

      {/* Bot Personality Controls - Mobile Responsive */}
      {players.some(p => p.user.username === 'Computer') && (
        <div className="fixed bottom-20 sm:bottom-6 left-2 sm:left-6 bg-white rounded-lg shadow-lg p-2 sm:p-4 space-y-2 sm:space-y-3 z-40 border max-w-[280px] sm:max-w-none">
          <div className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
            🤖 Bot Controls
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBotMessages(!showBotMessages)}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0"
            >
              {showBotMessages ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            </Button>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <label className="text-xs text-gray-500">Personality:</label>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={botPersonality === 'friendly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBotPersonality('friendly')}
                className="text-xs px-1.5 sm:px-2 py-1 h-5 sm:h-6"
              >
                😊 Friendly
              </Button>
              <Button
                variant={botPersonality === 'competitive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBotPersonality('competitive')}
                className="text-xs px-1.5 sm:px-2 py-1 h-5 sm:h-6"
              >
                🔥 Competitive
              </Button>
              <Button
                variant={botPersonality === 'encouraging' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBotPersonality('encouraging')}
                className="text-xs px-1.5 sm:px-2 py-1 h-5 sm:h-6"
              >
                💪 Encouraging
              </Button>
            </div>
          </div>
          
          {botThinking && (
            <div className="text-xs text-blue-600 flex items-center gap-1 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              Computer is thinking...
            </div>
          )}
          
          <div className="text-xs text-gray-400">
            Interactions: {interactionCount}
          </div>
        </div>
      )}

      {/* Floating Chat Button - Mobile Responsive */}
      <Button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 bg-blue-600 hover:bg-blue-700"
        size="lg"
      >
        <div className="relative">
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-xs p-0 rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </div>
      </Button>

      {/* Chat Modal - Mobile Responsive */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
              Game Chat
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
            <ScrollArea className="h-60 sm:h-80 w-full border rounded-md p-2 sm:p-4">
              {!messages || messages.length === 0 ? (
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm">No messages yet</p>
                  <p className="text-xs text-gray-400">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {messages.map((message) => {
                    const player = players.find(p => p.userId === message.userId);
                    return (
                      <div key={message.id} className="flex gap-2 text-xs sm:text-sm">
                        {player && (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {player.user.avatarInitials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {player && (
                            <div className="font-medium text-gray-900 mb-1 text-xs sm:text-sm truncate">
                              {player.user.username}
                            </div>
                          )}
                          <div className="text-gray-700 break-words text-xs sm:text-sm">{message.content}</div>
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
                className="flex-1 text-sm"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!newMessage.trim()}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

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
                    <p className="text-lg text-gray-700 mb-3">Winners:</p>
                    <div className="space-y-2">
                      {winnerData.winners.map((winner) => (
                        <div key={winner.userId} className="flex items-center justify-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                            {winner.user.avatarInitials}
                          </div>
                          <span className="text-lg font-semibold text-green-700">{winner.user.username}</span>
                          <span className="text-2xl">🏆</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => setShowWinnerModal(false)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  OK
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowWinnerModal(false);
                    window.location.href = '/';
                  }}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
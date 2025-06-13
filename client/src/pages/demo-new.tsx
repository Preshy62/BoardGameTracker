import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import DemoVoiceChat from "@/components/game/DemoVoiceChat";
import DemoTextChat from "@/components/game/DemoTextChat";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { 
  playBackgroundMusic, 
  stopBackgroundMusic, 
  updateSoundSettings, 
  soundSettings
} from "@/lib/sounds";
import { Volume2, VolumeX, Music } from "lucide-react";

// Import the enhanced GameStone component instead of creating a separate demo version
import GameStone from "@/components/game/GameStone";

// Demo Board Page
export default function DemoPage() {
  // No longer requiring auth
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // State for board and stone animations
  const [rollingStoneIndex, setRollingStoneIndex] = useState<number | null>(null);
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  
  // State for the dice path animation
  const [boardPath, setBoardPath] = useState<number[]>([]);
  const [dicePosition, setDicePosition] = useState({ top: 0, left: 0 });
  const [currentPathIdx, setCurrentPathIdx] = useState(0);
  const [rollSpeed, setRollSpeed] = useState(200); // ms between moves
  const [rollTimer, setRollTimer] = useState<NodeJS.Timeout | null>(null);
  const [targetStone, setTargetStone] = useState<any>(null);
  
  // New state for improved ball animation
  const [showBall, setShowBall] = useState(false);
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  
  // State for winner animation
  const [finalStoneSelected, setFinalStoneSelected] = useState<boolean>(false);
  
  // State for voice chat demo
  const [showVoiceChat, setShowVoiceChat] = useState<boolean>(true);
  const [voiceChatStake, setVoiceChatStake] = useState<number>(50000);
  
  // State for background music
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [currentMusic, setCurrentMusic] = useState<'BG_MUSIC_MAIN' | 'BG_MUSIC_INTENSE' | 'BG_MUSIC_CALM'>('BG_MUSIC_MAIN');
  
  // Speech synthesis for winner announcements
  const [announceText, setAnnounceText] = useState<string>('');
  const { speak, cancel, supported: speechSupported } = useSpeechSynthesis({
    text: announceText,
    rate: 0.9,
    pitch: 1.1,
    volume: 1.0
  });
  
  // Effect to handle speech announcement when winner is selected
  useEffect(() => {
    // Only attempt to speak if we have a winner and speech is supported
    if (finalStoneSelected && selectedStone) {
      try {
        // Create the announcement message based on stone type
        let message = `Stone ${selectedStone} wins the pot!`;
        
        if (selectedStone === 1000 || selectedStone === 500) {
          message = `Special stone ${selectedStone} wins! Double payout!`;
        } else if (selectedStone === 3355 || selectedStone === 6624) {
          message = `Super stone ${selectedStone} wins! Triple payout!`;
        }
        
        console.log('Setting announcement message:', message);
        
        // Set the message
        setAnnounceText(message);
        
        // Only try to speak if the browser supports it
        if (speechSupported) {
          // Small delay to let the UI update first and avoid overlapping with other audio
          const timer = setTimeout(() => {
            try {
              console.log('Speaking announcement...');
              speak();
            } catch (speakError) {
              console.log('Error in speak call:', speakError);
            }
          }, 800);
          
          // Cleanup function
          return () => {
            clearTimeout(timer);
            try {
              if (speechSupported) {
                console.log('Canceling speech on cleanup');
                cancel();
              }
            } catch (cancelError) {
              console.log('Error in speech cancel:', cancelError);
            }
          };
        }
      } catch (error) {
        console.log('Error in speech announcement effect:', error);
      }
    }
  }, [finalStoneSelected, selectedStone, speechSupported, speak, cancel, setAnnounceText]);
  
  // Refs
  const boardRef = useRef<HTMLDivElement>(null);
  const diceRef = useRef<HTMLDivElement>(null);

  // Define CSS for animations
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .dice-element {
        animation: pulse 0.5s infinite alternate, spin 2s linear infinite;
        z-index: 1000; /* Ensure it's above everything */
        pointer-events: none;
        position: absolute;
        width: 40px; /* Smaller ball */
        height: 40px; /* Smaller ball */
        background-color: #FF0000;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px; /* Smaller text */
        text-shadow: 0 0 3px black; /* Make text more visible */
        box-shadow: 0 0 10px 5px rgba(255, 215, 0, 0.6);
        border: 3px solid white;
        transition: left 0.3s ease-out, top 0.3s ease-out; /* Smoother transition */
      }
      
      /* For demo animation only - position board as relative to make absolute positioning work */
      #demo-game-board {
        position: relative !important;
        overflow: visible !important; /* Allow dice to be visible when it moves */
      }
      
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.9; }
        100% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes roll-glow {
        0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.7); border-color: gold; }
        10% { transform: translate(-50%, -50%) scale(1.05) rotate(36deg); box-shadow: 0 0 22px 11px rgba(255, 180, 0, 0.75); border-color: orange; }
        20% { transform: translate(-50%, -50%) scale(1.1) rotate(72deg); box-shadow: 0 0 25px 12px rgba(255, 150, 0, 0.8); border-color: darkorange; }
        30% { transform: translate(-50%, -50%) scale(1.15) rotate(108deg); box-shadow: 0 0 28px 14px rgba(255, 120, 0, 0.82); border-color: orangered; }
        40% { transform: translate(-50%, -50%) scale(1.2) rotate(144deg); box-shadow: 0 0 32px 16px rgba(255, 100, 0, 0.85); border-color: crimson; }
        50% { transform: translate(-50%, -50%) scale(1.3) rotate(180deg); box-shadow: 0 0 40px 20px rgba(255, 50, 0, 0.9); border-color: red; }
        60% { transform: translate(-50%, -50%) scale(1.25) rotate(216deg); box-shadow: 0 0 35px 17px rgba(255, 100, 50, 0.85); border-color: orangered; }
        70% { transform: translate(-50%, -50%) scale(1.2) rotate(252deg); box-shadow: 0 0 30px 15px rgba(255, 136, 0, 0.8); border-color: darkorange; }
        80% { transform: translate(-50%, -50%) scale(1.15) rotate(288deg); box-shadow: 0 0 27px 13px rgba(255, 160, 0, 0.75); border-color: orange; }
        90% { transform: translate(-50%, -50%) scale(1.1) rotate(324deg); box-shadow: 0 0 24px 12px rgba(255, 190, 0, 0.73); border-color: gold; }
        100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); box-shadow: 0 0 20px 10px rgba(255, 215, 0, 0.7); border-color: gold; }
      }
      
      @keyframes shakeBoard {
        0% { transform: translate(0, 0) rotate(0); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(2px, 0) rotate(1deg); }
        30% { transform: translate(-2px, 2px) rotate(0); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-2px, 1px) rotate(0); }
        70% { transform: translate(2px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0); }
        100% { transform: translate(0, 0) rotate(0); }
      }
      
      .ball-element {
        position: absolute;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: radial-gradient(circle, white 30%, #FF8800 100%);
        border: 4px solid gold;
        z-index: 9999;
        transition: top 0.3s ease-out, left 0.3s ease-out;
        box-shadow: 0 0 30px 15px rgba(255, 136, 0, 0.7);
        transform: translate(-50%, -50%); /* This ensures the ball is properly centered */
      }
      
      .roll-animation {
        animation: roll-glow 0.8s linear infinite, bounce 0.5s ease-in-out alternate infinite;
      }
      
      @keyframes bounce {
        0% { transform: translate(-50%, -50%) scale(0.9); }
        100% { transform: translate(-50%, -50%) scale(1.1); }
      }
      
      .shaking-board {
        animation: shakeBoard 0.5s cubic-bezier(.36,.07,.19,.97) both;
        animation-iteration-count: 3;
      }
      
      /* Winner stone animation with dynamic color cycling, rotation and scaling */
      @keyframes winner-stone {
        0% { 
          transform: scale(2.0) rotate(0deg);
          box-shadow: 0 0 80px 40px rgba(255, 215, 0, 0.95);
          border-color: gold;
          filter: brightness(1.2) contrast(1.1);
        }
        10% { 
          transform: scale(2.1) rotate(3deg);
          box-shadow: 0 0 85px 42px rgba(255, 160, 100, 0.95);
          border-color: orange;
          filter: brightness(1.25) contrast(1.15);
        }
        20% { 
          transform: scale(2.2) rotate(6deg);
          box-shadow: 0 0 90px 45px rgba(255, 105, 180, 0.95);
          border-color: hotpink;
          filter: brightness(1.3) contrast(1.2);
        }
        30% { 
          transform: scale(2.25) rotate(8deg);
          box-shadow: 0 0 95px 48px rgba(160, 105, 220, 0.95);
          border-color: purple;
          filter: brightness(1.35) contrast(1.25);
        }
        40% { 
          transform: scale(2.3) rotate(10deg);
          box-shadow: 0 0 100px 50px rgba(65, 105, 225, 0.95);
          border-color: royalblue;
          filter: brightness(1.4) contrast(1.3);
        }
        50% { 
          transform: scale(2.3) rotate(5deg);
          box-shadow: 0 0 100px 50px rgba(0, 150, 200, 0.95);
          border-color: dodgerblue;
          filter: brightness(1.4) contrast(1.3);
        }
        60% { 
          transform: scale(2.3) rotate(0deg);
          box-shadow: 0 0 100px 50px rgba(50, 205, 50, 0.95);
          border-color: limegreen;
          filter: brightness(1.4) contrast(1.3);
        }
        70% { 
          transform: scale(2.25) rotate(-5deg);
          box-shadow: 0 0 95px 48px rgba(150, 205, 50, 0.95);
          border-color: yellowgreen;
          filter: brightness(1.35) contrast(1.25);
        }
        80% { 
          transform: scale(2.2) rotate(-10deg);
          box-shadow: 0 0 90px 45px rgba(255, 0, 128, 0.95);
          border-color: deeppink;
          filter: brightness(1.3) contrast(1.2);
        }
        90% { 
          transform: scale(2.1) rotate(-5deg);
          box-shadow: 0 0 85px 42px rgba(255, 100, 50, 0.95);
          border-color: coral;
          filter: brightness(1.25) contrast(1.15);
        }
        100% { 
          transform: scale(2.0) rotate(0deg);
          box-shadow: 0 0 80px 40px rgba(255, 215, 0, 0.95);
          border-color: gold;
          filter: brightness(1.2) contrast(1.1);
        }
      }
      
      /* Winner overlay animation styles */
      .winner-overlay {
        animation: fade-in 0.5s forwards;
        z-index: 9000;
      }
      
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .winner-text-animation {
        animation: winner-text 0.8s infinite alternate;
        text-shadow: 0 0 15px gold, 0 0 25px orange;
      }
      
      @keyframes winner-text {
        0% { transform: scale(1); text-shadow: 0 0 10px gold, 0 0 20px gold; }
        100% { transform: scale(1.2); text-shadow: 0 0 20px gold, 0 0 30px orange, 0 0 40px red; }
      }
      
      .winner-pulse-animation {
        animation: winner-pulse 0.5s infinite alternate;
      }
      
      @keyframes winner-pulse {
        0% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // Array of stones for the game board
  const stones = [
    { number: 29, row: 1, index: 0 },
    { number: 40, row: 1, index: 1 },
    { number: 32, row: 1, index: 2 },
    { number: 81, row: 1, index: 3 },
    { number: 7, row: 1, index: 4 },
    { number: 13, row: 2, index: 0 },
    { number: 64, row: 2, index: 1 },
    { number: 1000, row: 2, index: 2, isSpecial: true, size: 'lg' },
    { number: 101, row: 2, index: 3 },
    { number: 4, row: 2, index: 4 },
    { number: 3355, row: 3, index: 0, isSuper: true },
    { number: 65, row: 3, index: 1 },
    { number: 12, row: 3, index: 2 },
    { number: 22, row: 3, index: 3 },
    { number: 9, row: 3, index: 4 },
    { number: 6624, row: 3, index: 5, isSuper: true },
    { number: 44, row: 3, index: 6 },
    { number: 28, row: 4, index: 0 },
    { number: 21, row: 4, index: 1 },
    { number: 105, row: 4, index: 2 },
    { number: 500, row: 4, index: 3, isSpecial: true, size: 'lg' },
    { number: 99, row: 4, index: 4 },
    { number: 20, row: 4, index: 5 },
    { number: 82, row: 4, index: 6 },
    { number: 3, row: 4, index: 7 },
  ];

  // Small stones for the bottom rows
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

  // Function to get stone position by number or index
  const getStonePosition = (stoneIndexOrNumber: number, isNumber = false) => {
    // Find the stone element
    let stoneElement;
    
    if (isNumber) {
      // Find by number
      const allStones = [...stones, ...smallStones];
      const foundStone = allStones.find(s => s.number === stoneIndexOrNumber);
      
      if (!foundStone) {
        console.error('Could not find stone with number:', stoneIndexOrNumber);
        // Fallback to center
        return { top: 200, left: 200 };
      }
      
      // Find by index
      if (foundStone.row <= 4) {
        stoneElement = document.getElementById(`stone-${foundStone.index}`);
      } else {
        stoneElement = document.getElementById(`small-stone-${foundStone.index}`);
      }
    } else {
      // Find directly by index
      stoneElement = document.getElementById(`stone-${stoneIndexOrNumber}`);
      
      // If not found, try as small stone
      if (!stoneElement && stoneIndexOrNumber >= 100) {
        const smallIndex = stoneIndexOrNumber - 100;
        stoneElement = document.getElementById(`small-stone-${smallIndex}`);
      }
    }
    
    if (!stoneElement || !boardRef.current) {
      console.error('Stone element or board not found');
      return { top: 200, left: 200 }; // fallback
    }
    
    // Get positions
    const stoneRect = stoneElement.getBoundingClientRect();
    const boardRect = boardRef.current.getBoundingClientRect();
    
    // Calculate center position relative to the board
    return {
      top: stoneRect.top - boardRect.top + (stoneRect.height / 2),
      left: stoneRect.left - boardRect.left + (stoneRect.width / 2)
    };
  };
  
  // Get a list of all stone numbers for animation path
  const getAllStoneNumbers = () => {
    return [
      // Top row
      29, 40, 32, 81, 7,
      // Second row
      13, 64, 1000, 101, 4,
      // Third row
      3355, 65, 12, 22, 9, 6624, 44,
      // Fourth row
      28, 21, 105, 500, 99, 20, 82, 3,
      // Bottom rows (small stones)
      11, 37, 72, 17, 42, 8, 30, 91, 27, 5, 40,
      6, 80, 3, 26, 100, 19, 14, 43, 16, 71, 10
    ];
  };
  
  // Initialize background music when component mounts
  useEffect(() => {
    // Don't auto-play music on load - wait for user interaction
    // Cleanup function to stop background music when component unmounts
    return () => {
      stopBackgroundMusic();
    };
  }, []);
  
  // Simple background music player with HTML5 audio
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Use real gaming background music from the web
  const toggleMusic = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    
    if (newState) {
      try {
        // Use rock and roll background music from the internet
        const audio = new Audio();
        // Try different rock music sources
        const rockTracks = [
          'https://www.bensound.com/bensound-music/bensound-energy.mp3',
          'https://www.bensound.com/bensound-music/bensound-punky.mp3',
          'https://www.bensound.com/bensound-music/bensound-actionable.mp3',
          'https://freesound.org/data/previews/316/316847_2948036-lq.mp3'
        ];
        
        let currentTrack = 0;
        const tryNextTrack = () => {
          if (currentTrack < rockTracks.length) {
            audio.src = rockTracks[currentTrack];
            currentTrack++;
          }
        };
        
        audio.addEventListener('error', tryNextTrack);
        tryNextTrack(); // Start with first track
        
        audio.volume = 0.3;
        audio.loop = true;
        
        audio.play().then(() => {
          setAudioElement(audio);
          toast({
            title: "Gaming Music Started!",
            description: "Real background music is now playing",
          });
        }).catch((error) => {
          // Fallback to a simple but better synthetic track
          console.log("External audio failed, using backup");
          
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          let currentTime = audioContext.currentTime;
          
          const playBeat = () => {
            // Create drum-like beat pattern
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.value = 60 + Math.random() * 40;
            osc.type = 'square';
            
            gain.gain.setValueAtTime(0.2, currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
            
            osc.start(currentTime);
            osc.stop(currentTime + 0.1);
            
            currentTime += 0.2;
            setTimeout(playBeat, 200);
          };
          
          playBeat();
          
          toast({
            title: "Backup Music Started",
            description: "Playing drum-style background beat",
          });
        });
        
      } catch (error) {
        toast({
          title: "Audio Not Supported",
          description: "Your browser doesn't support background music",
          variant: "destructive",
        });
      }
    } else {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        setAudioElement(null);
      }
      toast({
        title: "Music Stopped",
        description: "Background music is now muted",
      });
    }
  };
  
  // Change the background music track
  const changeBackgroundMusic = (musicType: 'BG_MUSIC_MAIN' | 'BG_MUSIC_INTENSE' | 'BG_MUSIC_CALM') => {
    setCurrentMusic(musicType);
    if (musicEnabled) {
      playBackgroundMusic(musicType, 0.3);
      toast({
        title: "Music Changed",
        description: `Now playing ${musicType.replace('BG_MUSIC_', '').toLowerCase()} music`,
      });
    }
  };
  
  // Define the dice path to travel through numbers rather than around the edge
  useEffect(() => {
    // Wait for the board to be fully rendered
    setTimeout(() => {
      // Create path through all the stones in a zigzag pattern
      // This ensures the ball rolls through all the numbers
      const path: number[] = [];
      
      // Path through main stones - combining all stones across rows
      const allStoneIndices = stones.map(stone => stone.index);
      
      // Shuffle the indices to create a random path
      const shuffledIndices = [...allStoneIndices];
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      }
      
      // Use all the shuffled indices to ensure we have enough stones in our path
      const pathIndices = shuffledIndices;
      
      // Add the indices to our path
      pathIndices.forEach(index => path.push(index));
      
      console.log('Created path for dice roll with', path.length, 'elements');
      
      console.log('Dice path created with randomized stone indices:', path);
      setBoardPath(path);
      
      // Set initial position for dice in the center of the board
      if (boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        
        setDicePosition({
          top: boardRect.height / 2 - 20, // Center the ball
          left: boardRect.width / 2 - 20,
        });
      }
    }, 500); // Short delay to ensure elements are rendered
  }, []);

  // Simplified dice movement function
  const moveDiceAlongPath = useCallback((currentIdx: number, targetIdx: number | null, finalStoneIndex: number | null) => {
    console.log('Moving dice along path', { currentIdx, targetIdx, finalStoneIndex });
    
    if (!isRolling) {
      console.log('Not rolling - aborting moveDiceAlongPath');
      return;
    }
    
    // Clear any existing timeout
    if (rollTimer) {
      clearTimeout(rollTimer);
    }
    
    // Ensure we have a path to follow
    if (boardPath.length === 0) {
      console.log('Creating simple path through all stones');
      const newPath: number[] = [];
      stones.forEach((stone, idx) => newPath.push(idx));
      setBoardPath(newPath);
      
      // Try again after the path is set
      setTimeout(() => moveDiceAlongPath(currentIdx, targetIdx, finalStoneIndex), 100);
      return;
    }
    
    // Get the current stone index in the path
    const pathPosition = currentIdx % boardPath.length;
    const stoneIdx = boardPath[pathPosition];
    
    // Highlight the current stone
    setRollingStoneIndex(stoneIdx);
    
    // Only play sound every 3 steps to avoid overwhelming sound effects
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
    
    // Position the dice over the current stone
    let stoneElement;
    
    // Check if it's a regular stone or small stone based on index range
    if (stoneIdx < 100) {
      stoneElement = document.getElementById(`stone-${stoneIdx}`);
    } else {
      // Small stones have 100+ indices in our path
      const smallStoneIdx = stoneIdx - 100;
      stoneElement = document.getElementById(`small-stone-${smallStoneIdx}`);
    }
    
    if (stoneElement && boardRef.current) {
      const rect = stoneElement.getBoundingClientRect();
      const boardRect = boardRef.current.getBoundingClientRect();
      
      // Calculate position relative to the board
      const relativeTop = rect.top - boardRect.top;
      const relativeLeft = rect.left - boardRect.left;
      
      console.log(`Moving to stone idx ${stoneIdx}, position: ${relativeTop}, ${relativeLeft}`);
      
      // Update the dice position with absolute coordinates - center on stone
      setDicePosition({
        top: relativeTop + (rect.height / 2), // Center on stone
        left: relativeLeft + (rect.width / 2),
      });
      
      // Add visual highlight to the current stone
      stoneElement.classList.add('stone-highlight');
      
      // Remove the highlight class after animation completes
      setTimeout(() => {
        stoneElement.classList.remove('stone-highlight');
      }, 800);
      
      // Play a subtle click sound as the ball hits the stone
      if (currentIdx % 2 === 0) { // Play on every other stone to avoid too many sounds
        try {
          const clickAudio = new Audio();
          clickAudio.src = '/dice-click.mp3';
          clickAudio.volume = 0.15;
          clickAudio.play().catch(e => console.log('Click audio failed:', e));
        } catch (e) {
          console.log('Audio not supported');
        }
      }
    } else {
      console.error(`Could not find stone element for index ${stoneIdx}`);
    }
    
    // Check if we've reached the target number of steps
    if (targetIdx !== null && currentIdx >= targetIdx) {
      // We've completed the desired number of jumps
      // Now make the final jump directly to our predetermined stone
      setTimeout(() => {
        // Use our pre-selected final stone index if provided
        let finalStone;
        
        if (finalStoneIndex !== null) {
          // Use the predetermined stone
          finalStone = stones.find(s => s.index === finalStoneIndex);
          
          // Position the dice directly over the final stone
          const stoneElement = document.getElementById(`stone-${finalStoneIndex}`);
          
          if (stoneElement && boardRef.current) {
            const rect = stoneElement.getBoundingClientRect();
            const boardRect = boardRef.current.getBoundingClientRect();
            
            // Move the dice to the final stone position
            setDicePosition({
              top: rect.top - boardRect.top + (rect.height / 2) - 20,
              left: rect.left - boardRect.left + (rect.width / 2) - 20,
            });
            
            // Highlight the final stone
            setRollingStoneIndex(finalStoneIndex);
          }
        } else {
          // Use the stone at the current position as fallback
          const finalStoneIdx = boardPath[targetIdx % boardPath.length];
          
          if (finalStoneIdx < 100) {
            finalStone = stones.find(s => s.index === finalStoneIdx);
          } else {
            // It's a small stone
            const smallStoneIdx = finalStoneIdx - 100;
            finalStone = smallStones.find(s => s.index === smallStoneIdx);
          }
        }
        
        // After a brief pause to show the final stone, complete the roll
        setTimeout(() => {
          if (finalStone) {
            setRollingStoneIndex(null);
            setSelectedStone(finalStone.number);
            setIsRolling(false);
            
            // Show result toast
            const isSpecial = 'isSpecial' in finalStone && finalStone.isSpecial;
            const isSuper = 'isSuper' in finalStone && finalStone.isSuper;
            
            toast({
              title: "You Rolled: " + finalStone.number,
              description: isSpecial ? "You hit a special stone!" : 
                        isSuper ? "You hit a super stone!" : 
                        "Good roll!",
            });
          } else {
            // Fallback if something went wrong
            const allStones = [...stones, ...smallStones];
            const randomStone = allStones[Math.floor(Math.random() * allStones.length)];
            
            console.error('Could not find final stone, using random stone instead:', randomStone.number);
            setRollingStoneIndex(null);
            setSelectedStone(randomStone.number);
            setIsRolling(false);
            
            // Show toast
            toast({
              title: "You Rolled: " + randomStone.number,
              description: "Good roll!",
            });
          }
        }, 1000);
      }, 500);
      return;
    }
    
    // Continue moving - gradually slow down
    const nextSpeed = Math.min(rollSpeed + 15, 500); // Cap at 500ms
    setRollSpeed(nextSpeed);
    
    // Schedule the next movement
    const nextTimeout = setTimeout(() => {
      moveDiceAlongPath(currentIdx + 1, targetIdx, finalStoneIndex);
    }, nextSpeed);
    
    setRollTimer(nextTimeout);
  }, [isRolling, boardPath, rollSpeed, rollTimer, toast, stones, smallStones]);
  
  // Enhanced function to handle rolling dice with improved animation
  const handleRollDice = useCallback(() => {
    if (isRolling || rollingStoneIndex !== null) return; // Prevent multiple rolls
    
    console.log('Starting dice roll animation');
    
    // Start background music on first user interaction if enabled
    if (musicEnabled) {
      try {
        console.log("Attempting to start background music:", currentMusic);
        playBackgroundMusic(currentMusic, 0.3);
        console.log("Background music started successfully");
      } catch (error) {
        console.error("Failed to start background music:", error);
      }
    }
    
    // Reset states
    setIsRolling(true);
    setSelectedStone(null);
    setFinalStoneSelected(false);
    setIsBoardShaking(true);
    setShowBall(true); // Show the ball
    
    // Play sound effect
    try {
      const audio = new Audio();
      audio.src = '/rolling-dice.mp3';
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    // Toast to draw attention to the dice roll
    toast({
      title: "DICE IS ROLLING",
      description: "Watch the ball run around the board!",
    });
    
    // Get all stone numbers in order (creates a logical path around the board)
    const stoneNumbers = getAllStoneNumbers();
    
    // Create a proper path of numbers to follow
    // Use the stone numbers directly (not indices)
    setBoardPath(stoneNumbers);
    
    // Pick a random final stone to land on
    const allStones = [...stones, ...smallStones];
    const finalStone = allStones[Math.floor(Math.random() * allStones.length)];
    
    // Get the starting position (first stone in path)
    const startPosition = getStonePosition(boardPath[0], true);
    
    // Show the ball at the starting position
    setBallPosition(startPosition);
    setShowBall(true);
    
    // Stop board shaking after a moment
    setTimeout(() => {
      setIsBoardShaking(false);
    }, 1500);
    
    // Run the ball around the board
    let step = 0;
    const maxSteps = boardPath.length + 10; // Full board plus extra for excitement
    
    const animateStep = () => {
      // Calculate which stone to highlight
      const currentStoneIndex = step % boardPath.length;
      const currentStoneNumber = boardPath[currentStoneIndex];
      
      // Move the ball to this stone's position
      const newPosition = getStonePosition(currentStoneNumber, true);
      setBallPosition(newPosition);
      
      // Find stone by number and highlight it
      const allStones = [...stones, ...smallStones];
      const found = allStones.find(s => s.number === currentStoneNumber);
      if (found) {
        setRollingStoneIndex(found.index);
      }
      
      // Play sound occasionally
      if (step % 3 === 0) {
        try {
          const audio = new Audio();
          audio.src = '/rolling-dice.mp3';
          audio.volume = 0.2;
          audio.play().catch(e => console.log('Audio failed:', e));
        } catch (e) {
          console.log('Audio not supported');
        }
      }
      
      // Speed up as we go - starts slower then gets faster
      const stepDelay = step < 10 ? 300 : 
                        step < 20 ? 200 : 
                        step < 30 ? 150 : 
                        step < maxSteps - 5 ? 100 : 200; // Slow down at the end
      
      step++;
      
      // Continue animation until we reach the final step
      if (step < maxSteps) {
        setTimeout(animateStep, stepDelay);
      } else {
        // Final landing on the target stone
        setTimeout(() => {
          // Final position based on our chosen stone
          const finalPosition = getStonePosition(finalStone.number, true);
          setBallPosition(finalPosition);
          
          // Find the stone index for highlighting
          if (finalStone.row <= 4) {
            setRollingStoneIndex(finalStone.index);
          } else {
            setRollingStoneIndex(finalStone.index + 100);
          }
          
          // After a brief pause, complete the roll
          setTimeout(() => {
            setRollingStoneIndex(null);
            setSelectedStone(finalStone.number);
            setShowBall(false);
            setIsRolling(false);
            
            // Play winning sound effect
            try {
              const audio = new Audio();
              audio.src = '/dice-landing.mp3';
              audio.volume = 0.5;
              audio.play().catch(e => console.log('Audio failed:', e));
            } catch (e) {
              console.log('Audio not supported');
            }
            
            // Show result toast
            const isSpecial = 'isSpecial' in finalStone && finalStone.isSpecial;
            const isSuper = 'isSuper' in finalStone && finalStone.isSuper;
            
            // Prepare announcement text based on stone type
            let winnerMessage = `Stone ${finalStone.number} wins the pot!`;
            if (isSpecial) {
              winnerMessage = `Special stone ${finalStone.number} wins! Double payout!`;
            } else if (isSuper) {
              winnerMessage = `Super stone ${finalStone.number} wins! Triple payout!`;
            }
            
            // Set the speech announcement
            setAnnounceText(winnerMessage);
            
            // Set the winner stone with a slight delay for dramatic effect
            setTimeout(() => {
              setFinalStoneSelected(true);
              
              // Announce with voice after visual effects appear
              setTimeout(() => {
                if (speechSupported) {
                  speak();
                }
              }, 500);
            }, 500);
            
            toast({
              title: "You Rolled: " + finalStone.number,
              description: isSpecial ? "You hit a special stone!" : 
                          isSuper ? "You hit a super stone!" : 
                          "Good roll!",
            });
          }, 1000);
        }, 500);
      }
    };
    
    // Start the animation sequence
    setTimeout(animateStep, 500);
    
  }, [isRolling, rollingStoneIndex, toast, stones, smallStones, getStonePosition, getAllStoneNumbers, boardPath, setBoardPath, setShowBall, setBallPosition, setIsBoardShaking, setSelectedStone, setFinalStoneSelected, setAnnounceText, speak, speechSupported]);
  
  // Handle individual stone clicks (for testing)
  const handleStoneClick = useCallback((index: number, stoneNumber: number) => {
    if (rollingStoneIndex !== null || isRolling) return;
    
    setRollingStoneIndex(index);
    
    // Play sound
    try {
      const audio = new Audio();
      audio.src = '/rolling-dice.mp3';
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio failed:', e));
    } catch (e) {
      console.log('Audio not supported');
    }
    
    setTimeout(() => {
      setRollingStoneIndex(null);
      setSelectedStone(stoneNumber);
      
      // Play landing sound
      try {
        const audio = new Audio();
        audio.src = '/dice-landing.mp3';
        audio.volume = 0.4;
        audio.play().catch(e => console.log('Audio failed:', e));
      } catch (e) {
        console.log('Audio not supported');
      }
      
      // Speech announcement will be handled by the useEffect
      
      // Set as winner stone
      setTimeout(() => {
        setFinalStoneSelected(true);
        // Speech will be handled by the useEffect
      }, 500);
    }, 2000);
  }, [rollingStoneIndex, isRolling, setFinalStoneSelected, setSelectedStone]);

  // Loading state
  // Demo mode is always ready, no need for loading state
  if (false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Big Boys Game</h1>
            <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">DEMO MODE</span>
          </div>
          <div className="flex space-x-2 items-center">
            <div className="flex items-center mr-4 gap-2">
              <Button 
                variant="ghost"
                size="icon"
                onClick={toggleMusic}
                title={musicEnabled ? "Mute Background Music" : "Play Background Music"}
                className="text-white hover:bg-primary-dark rounded-full"
              >
                {musicEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </Button>
              
              {/* Music selection buttons - only show when music is enabled */}
              {musicEnabled && (
                <div className="flex gap-1">
                  <Button 
                    variant={currentMusic === 'BG_MUSIC_MAIN' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => changeBackgroundMusic('BG_MUSIC_MAIN')}
                    className="text-white hover:bg-primary-dark text-xs py-1"
                  >
                    Default
                  </Button>
                  
                  <Button 
                    variant={currentMusic === 'BG_MUSIC_INTENSE' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => changeBackgroundMusic('BG_MUSIC_INTENSE')}
                    className="text-white hover:bg-primary-dark text-xs py-1"
                  >
                    Intense
                  </Button>
                  
                  <Button 
                    variant={currentMusic === 'BG_MUSIC_CALM' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => changeBackgroundMusic('BG_MUSIC_CALM')}
                    className="text-white hover:bg-primary-dark text-xs py-1"
                  >
                    Calm
                  </Button>
                </div>
              )}
            </div>
            <Button 
              onClick={() => setLocation('/')} 
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
            >
              Back to Home
            </Button>
            <Button 
              onClick={() => setLocation('/auth')} 
              className="bg-white text-primary hover:bg-gray-100 font-bold"
            >
              Sign In / Register
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content - Mobile Optimized */}
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Game Board Demo</h1>
            <p className="text-sm sm:text-base text-gray-600">Watch the ball roll through the game numbers</p>
          </div>
        </div>
        
        {/* Game board container - Mobile Responsive */}
        <div className="w-full max-w-3xl mx-auto my-4 sm:my-8 bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Enhanced Game Status Bar - Mobile Optimized */}
          <div className="bg-gradient-to-r from-primary to-primary-light p-3 sm:p-4 text-white border-b-2 border-gray-700 relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              {/* Left side - Game info */}
              <div className="flex items-center">
                <div className="bg-primary-light p-2 rounded-lg mr-3 border border-gray-600 shadow-inner">
                  <div className="text-xs uppercase text-gray-400 mb-0.5">Demo</div>
                  <div className="font-mono text-base sm:text-lg font-bold text-secondary">MODE</div>
                </div>
                
                <div>
                  <h2 className="font-sans font-bold text-base sm:text-lg">Big Boys Game</h2>
                  <div className="flex items-center space-x-2 sm:space-x-3 mt-1">
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-1 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <span className="text-secondary font-semibold">
                        ₦50,000
                      </span>
                      <span className="ml-1 text-gray-300">stake</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 mr-1 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="font-semibold text-gray-300">4</span>
                      <span className="ml-1 text-gray-400">players</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Game status */}
              <div className="flex items-center mt-2 sm:mt-0">
                {selectedStone && (
                  <div className="bg-primary-light/70 px-3 py-2 rounded-lg text-sm mr-3 flex items-center shadow-inner border border-gray-700">
                    <svg className="w-5 h-5 mr-2 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12h8" />
                      <path d="M12 8v8" />
                    </svg>
                    <div>
                      <div className="text-xs text-gray-400">You Rolled</div>
                      <div className="font-mono font-bold text-secondary">{selectedStone}</div>
                    </div>
                  </div>
                )}
                
                <div className={cn(
                  "px-4 py-2 rounded-lg text-white text-sm font-medium relative overflow-hidden shadow-lg border border-gray-700",
                  "bg-accent"
                )}>
                  {/* Status animation background */}
                  <div className="absolute inset-0 opacity-30 progress-animation"></div>
                  
                  {/* Status icon and text */}
                  <div className="flex items-center relative z-10">
                    <div className="mr-2">
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path d="M12 8v4l3 3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-white/70">Status</div>
                      <div className="font-semibold">In Progress</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status indicator line */}
            <div className="absolute bottom-0 left-0 h-1 bg-accent w-2/3 transition-all duration-700"></div>
          </div>
          
          <div className="p-6">
            {/* Game communication features */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voice Chat */}
              {showVoiceChat && (
                <div>
                  <DemoVoiceChat stakeAmount={voiceChatStake} demo={true} />
                </div>
              )}
              
              {/* Text Chat */}
              <div>
                <DemoTextChat stakeAmount={voiceChatStake} demo={true} />
              </div>
            </div>
          
            {/* Game board with stones */}
            <div 
              ref={boardRef}
              id="demo-game-board" 
              className={`relative p-4 rounded-lg mb-6 overflow-hidden ${isBoardShaking ? 'shaking-board' : ''}`} 
              style={{ backgroundColor: '#0F172A', border: '2px solid #FFC107', position: 'relative' }}
            >
              <h3 className="text-center text-white text-2xl font-bold mb-4">BIG BOYS GAME</h3>
              
              {/* Enhanced Winner overlay with confetti effect */}
              {finalStoneSelected && (
                <div className="winner-overlay absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
                  {/* Confetti animation elements */}
                  <div className="confetti-container absolute inset-0 overflow-hidden">
                    {[...Array(30)].map((_, i) => (
                      <div 
                        key={i}
                        className="confetti" 
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `-5%`,
                          backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                          animationDelay: `${Math.random() * 5}s`,
                          animationDuration: `${3 + Math.random() * 5}s`,
                          transform: `rotate(${Math.random() * 360}deg) scale(${0.8 + Math.random() * 0.5})`,
                          width: `${8 + Math.random() * 12}px`,
                          height: `${8 + Math.random() * 12}px`,
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Winner content card */}
                  <div className="relative z-10 bg-primary bg-opacity-90 p-8 rounded-2xl shadow-2xl border-4 border-secondary animate-winner-appear max-w-md w-full">
                    <div className="absolute inset-0 winner-card-glow"></div>
                    
                    {/* Trophy icon */}
                    <div className="winner-trophy-animation text-yellow-400 mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 17.938A8.001 8.001 0 0 1 7 2h10a8.001 8.001 0 0 1-4 15.938v2.074c3.946.092 7 .723 7 1.488 0 .828-3.582 1.5-8 1.5s-8-.672-8-1.5c0-.765 3.054-1.396 7-1.488v-2.074zM8.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                      </svg>
                    </div>
                    
                    <h2 className="text-yellow-500 text-4xl font-bold mb-4 animate-pulse">
                      WINNER!
                    </h2>
                    
                    <div className="mb-6 flex flex-col items-center">
                      <div className="text-secondary text-lg font-medium mb-1">
                        Winning Stone
                      </div>
                      <div className="text-white text-5xl font-bold mb-2 winner-text-glow">
                        {selectedStone}
                      </div>
                      <p className="text-white text-xl opacity-90 mt-2">
                        {(() => {
                          // Determine special message for special stones and announce it
                          let message = `🎮 Regular win! Congratulations!`;
                          if (selectedStone === 1000 || selectedStone === 500) {
                            message = `✨ Special stone win! Double payout!`;
                          } else if (selectedStone === 3355 || selectedStone === 6624) {
                            message = `🔥 Super stone win! Triple payout!`;
                          }
                          
                          // Just return the message - we'll handle speech elsewhere
                          return message;
                        })()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setFinalStoneSelected(false);
                        setSelectedStone(null);
                        // Cancel any ongoing speech
                        if (speechSupported) {
                          cancel();
                        }
                      }}
                      className="bg-secondary hover:bg-yellow-500 text-primary font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition duration-300 mx-auto block"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}
              
              {/* Enhanced Rolling ball animation element with trail effect */}
              {showBall && (
                <>
                  {/* Animated ball with enhanced visuals */}
                  <div 
                    className="rolling-ball" 
                    style={{
                      top: `${ballPosition.top}px`,
                      left: `${ballPosition.left}px`
                    }}
                  />
                  
                  {/* Multiple trail elements for a more dynamic effect */}
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={`trail-${i}`}
                      className="ball-trail" 
                      style={{
                        top: `${ballPosition.top}px`,
                        left: `${ballPosition.left}px`,
                        opacity: 0.7 - (i * 0.2),
                        animationDelay: `${i * 0.1}s`,
                        transform: `translate(-50%, -50%) scale(${0.9 + (i * 0.3)})`,
                      }}
                    />
                  ))}
                </>
              )}
              
              {/* Arrow pointing to start */}
              <div className="absolute top-8 right-16 text-white">
                <svg viewBox="0 0 48 48" width="60" height="60" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M30 10 C 40 15, 45 25, 40 35" strokeWidth="3" strokeLinecap="round" />
                  <path d="M35 32 L 40 35 L 45 32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              
              {/* START label */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-1 font-bold text-lg rotate-90">
                START
              </div>

              {/* Regular sized stones by row - Mobile Responsive */}
              {[1, 2, 3, 4].map(row => (
                <div key={`row-${row}`} className="flex flex-wrap justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                  {stones
                    .filter(stone => stone.row === row)
                    .map((stone) => (
                      <div id={`stone-${stone.index}`} key={`stone-${stone.row}-${stone.index}`}>
                        <GameStone 
                          number={stone.number}
                          isSpecial={!!stone.isSpecial}
                          isSuper={!!stone.isSuper}
                          size={stone.size as 'sm' | 'md' | 'lg'}
                          isRolling={rollingStoneIndex === stone.index}
                          isWinner={!!(finalStoneSelected && selectedStone === stone.number)}
                          onClick={() => handleStoneClick(stone.index, stone.number)}
                        />
                      </div>
                    ))
                  }
                </div>
              ))}
              
              {/* Small stones for bottom rows - Mobile Responsive */}
              {[5, 6].map(row => (
                <div key={`row-${row}`} className="flex flex-wrap justify-center gap-1 mb-3 sm:mb-4">
                  {smallStones
                    .filter(stone => stone.row === row)
                    .map((stone) => (
                      <div id={`small-stone-${stone.index}`} key={`small-stone-${stone.row}-${stone.index}`}>
                        <GameStone 
                          number={stone.number}
                          size="sm"
                          isRolling={rollingStoneIndex === 100 + stone.index}
                          isWinner={!!(finalStoneSelected && selectedStone === stone.number)}
                          onClick={() => handleStoneClick(100 + stone.index, stone.number)}
                        />
                      </div>
                    ))
                  }
                </div>
              ))}
              
              {/* Enhanced Money in the Bank Label */}
              <div className="border-t-2 border-yellow-500 mt-4 pt-3 text-center relative overflow-hidden">
                <div className="absolute inset-0 bank-money-bg-animation opacity-20"></div>
                <h4 className="text-yellow-400 text-sm uppercase tracking-wider font-bold relative z-10 bank-label-animation">
                  <span className="mr-1">💰</span> MONEY IN THE BANK <span className="ml-1">💰</span>
                </h4>
              </div>
              
              {/* Dice moving along the board path - for backward compatibility */}
              {isRolling && !showBall && (
                <div 
                  ref={diceRef}
                  className="dice-element"
                  style={{
                    top: dicePosition.top,
                    left: dicePosition.left,
                  }}
                >
                  <div className="inner-ball"></div>
                </div>
              )}
            </div>
            
            {/* Money display and game action */}
            <div 
              className="p-3 rounded-lg mb-6" 
              style={{ backgroundColor: '#0F172A', border: '2px solid #FFC107' }}
            >
              {/* Enhanced Money in the Bank display */}
              <div className="mb-6 text-center relative overflow-hidden rounded-xl shadow-2xl border-2 border-yellow-500">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-900 via-yellow-700 to-yellow-900 bank-money-bg-animation opacity-75"></div>
                
                {/* Glow effect */}
                <div className="absolute inset-0 bank-money-glow-animation opacity-30"></div>
                
                {/* Content */}
                <div className="relative z-10 py-4 px-6">
                  <div className="flex items-center justify-center mb-1">
                    <svg className="w-5 h-5 mr-2 text-yellow-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                      <path d="M12 6v8l4 2" />
                    </svg>
                    <h3 className="text-yellow-300 text-sm font-medium uppercase tracking-wider">Money in the Bank</h3>
                  </div>
                  
                  <div className="bank-amount-pulse-animation text-4xl font-bold text-white font-mono tracking-wide mb-2">
                    ₦95,000
                  </div>
                  
                  <div className="flex items-center justify-center space-x-3 text-xs text-yellow-200 opacity-75">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>4 Players</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Round 1</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Game Action Button */}
              <div className="text-center">
                <button
                  onClick={handleRollDice}
                  disabled={isRolling || rollingStoneIndex !== null || finalStoneSelected}
                  className={`text-primary text-lg font-sans font-bold py-3 px-8 rounded-lg shadow-lg transform transition
                    ${(isRolling || rollingStoneIndex !== null || finalStoneSelected) 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-secondary hover:bg-secondary-dark hover:scale-105'}`}
                >
                  {finalStoneSelected ? 'GAME ENDED' : 'ROLL STONE'}
                </button>
                <div className="mt-2 text-xs text-white">
                  {finalStoneSelected
                    ? 'Click "Play Again" to start a new game'
                    : isRolling 
                      ? 'Rolling the stones...' 
                      : rollingStoneIndex !== null 
                        ? 'Revealing your roll!' 
                        : 'Click to roll a stone!'}
                </div>
              </div>
            </div>
            
            {/* Demo info */}
            <div className="text-center mt-8 bg-gray-100 rounded-lg p-6 border border-gray-200 shadow-inner">
              <div className="inline-block mb-4 px-3 py-1 bg-orange-500 text-white text-xs uppercase tracking-wider font-bold rounded-full">Demo Mode</div>
              <h3 className="text-xl font-bold mb-2">Experience the Full Game by Creating an Account</h3>
              <p className="text-gray-600 mb-4">This is just a demo of the Big Boys Game. Sign up to access all features including real stakes, multiplayer mode, and winnings withdrawal.</p>
              <div className="flex justify-center space-x-3">
                <Button 
                  onClick={() => setLocation('/')}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  Return to Home
                </Button>
                <Button 
                  onClick={() => setLocation('/auth')}
                  variant="default"
                  className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
                >
                  Sign In / Register
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game features */}
        <div className="w-full max-w-3xl mx-auto mt-12 mb-8">
          <h3 className="text-xl font-bold mb-4">Big Boys Game Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Multiplayer Gameplay
              </h4>
              <p className="text-gray-600">Play with friends or against random opponents in fast-paced, exciting rounds.</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Real-Money Stakes
              </h4>
              <p className="text-gray-600">Bet with real money and win big! Secure payment processing and instant withdrawals.</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Special Stones
              </h4>
              <p className="text-gray-600">Land on special stones for bonus multipliers, extra turns, or unique power-ups.</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h4 className="font-bold text-lg mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Voice Chat
              </h4>
              <p className="text-gray-600 mb-3">Premium games include in-game voice chat for a more immersive and social experience.</p>
              
              <div className="mt-2 space-y-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Try Voice Chat Demo:</label>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setShowVoiceChat(true)}
                      variant={showVoiceChat ? "default" : "outline"}
                      size="sm"
                      className="w-1/2"
                    >
                      Show
                    </Button>
                    <Button 
                      onClick={() => setShowVoiceChat(false)}
                      variant={!showVoiceChat ? "default" : "outline"}
                      size="sm"
                      className="w-1/2"
                    >
                      Hide
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Chat Tier:</label>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setVoiceChatStake(20000)}
                      variant={voiceChatStake === 20000 ? "default" : "outline"}
                      size="sm"
                      className="w-1/2"
                    >
                      Basic (₦20,000)
                    </Button>
                    <Button 
                      onClick={() => setVoiceChatStake(50000)}
                      variant={voiceChatStake === 50000 ? "default" : "outline"}
                      size="sm"
                      className="w-1/2"
                    >
                      Premium (₦50,000)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Big Boys Game</h3>
              <p className="text-gray-400 text-sm">The Ultimate Nigerian Gambling Experience</p>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </a>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700 text-center">
            <div className="flex justify-center mb-4">
              <Button 
                onClick={() => setLocation('/auth')}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Sign In / Create Account
              </Button>
            </div>
            <p className="text-gray-400 text-sm">&copy; 2025 Big Boys Game. All rights reserved.</p>
            <p className="text-gray-400 text-sm">For entertainment purposes only. 18+ only. Play responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { useState, useEffect, useCallback, useRef } from 'react';

// Our audio context instance
let audioContext: AudioContext | null = null;

// Initialize the audio context
export function initAudioContext(): AudioContext {
  if (!audioContext) {
    try {
      // Use standard AudioContext with fallback
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      console.log("Audio context initialized successfully");
    } catch (e) {
      console.error("Failed to initialize audio context:", e);
      // Create a dummy audio context as fallback
      audioContext = {} as AudioContext;
    }
  }
  
  // Resume the audio context if it's suspended (browser policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(e => {
      console.error("Failed to resume audio context:", e);
    });
  }
  
  return audioContext;
}

// Preload and cache sound files
const soundCache: Record<string, AudioBuffer> = {};

// Sound file paths
export const SOUNDS = {
  ROLL: '/sounds/dice-roll.mp3',
  WIN: '/sounds/win.mp3',
  LOSE: '/sounds/lose.mp3',
  JOIN: '/sounds/player-joined.mp3',
  LEAVE: '/sounds/player-left.mp3',
  TURN: '/sounds/your-turn.mp3',
  GAME_START: '/sounds/game-start.mp3',
  GAME_END: '/sounds/game-end.mp3',
  CLICK: '/sounds/click.mp3',
  ERROR: '/sounds/error.mp3',
  COUNT_1000: '/sounds/count-1000.mp3',
  COUNT_500: '/sounds/count-500.mp3',
  COUNT_3355: '/sounds/count-3355.mp3',
  COUNT_6624: '/sounds/count-6624.mp3',
  WINNER: '/sounds/winner.mp3',
};

// Load a sound file and cache it
async function loadSound(url: string): Promise<AudioBuffer> {
  if (!audioContext || !(audioContext instanceof AudioContext)) {
    initAudioContext();
  }
  
  if (soundCache[url]) {
    return soundCache[url];
  }
  
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    if (audioContext && audioContext.decodeAudioData) {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      soundCache[url] = audioBuffer;
      return audioBuffer;
    } else {
      throw new Error("Audio context not available for decoding");
    }
  } catch (error) {
    console.error(`Error loading sound: ${url}`, error);
    throw error;
  }
}

// Play a sound with optional pitch and volume adjustment
export async function playSound(soundUrl: string, options: { volume?: number; pitch?: number } = {}) {
  try {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      initAudioContext();
    }
    
    if (audioContext?.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Set default options
    const { volume = 1.0, pitch = 1.0 } = options;
    
    // Load the sound if not already cached
    const audioBuffer = await loadSound(soundUrl);
    
    // Create audio source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    
    // Set playback rate (pitch)
    source.playbackRate.value = pitch;
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play the sound
    source.start(0);
    console.log(`Playing sound: ${soundUrl} (volume: ${volume}, pitch: ${pitch})`);
    
    // Return the source for potential stopping later
    return source;
  } catch (error) {
    console.error(`Failed to play sound: ${soundUrl}`, error);
    return null;
  }
}

// Hook for playing a sound
export function useSound(soundUrl: string, options: { volume?: number; pitch?: number; trigger?: any } = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const { volume = 1.0, pitch = 1.0, trigger } = options;
  
  // Play sound function
  const play = useCallback(async () => {
    try {
      setIsPlaying(true);
      sourceRef.current = await playSound(soundUrl, { volume, pitch });
      
      // Add ended event handler
      if (sourceRef.current) {
        sourceRef.current.onended = () => {
          setIsPlaying(false);
          sourceRef.current = null;
        };
      }
    } catch (error) {
      console.error(`Error playing sound: ${soundUrl}`, error);
      setIsPlaying(false);
    }
  }, [soundUrl, volume, pitch]);
  
  // Stop sound function
  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
        sourceRef.current = null;
        setIsPlaying(false);
      } catch (error) {
        console.error(`Error stopping sound: ${soundUrl}`, error);
      }
    }
  }, [soundUrl]);
  
  // Play sound when trigger changes
  useEffect(() => {
    if (trigger !== undefined) {
      play();
    }
    
    return () => {
      stop();
    };
  }, [trigger, play, stop]);
  
  return { play, stop, isPlaying };
}

// Function to speak text with a game announcer voice
export async function speakText(text: string, options: { volume?: number; pitch?: number; rate?: number } = {}) {
  // Check if speech synthesis is available
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported in this browser');
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  // Create a new speech utterance
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set default options
  const { volume = 1.0, pitch = 0.7, rate = 0.9 } = options;
  
  // Configure utterance
  utterance.volume = volume;  // 0 to 1
  utterance.rate = rate;      // 0.1 to 10
  utterance.pitch = pitch;    // 0 to 2
  
  // Try to use a deep male voice if available
  try {
    const voices = window.speechSynthesis.getVoices();
    const maleVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('male') || 
      voice.name.toLowerCase().includes('man') ||
      voice.name.toLowerCase().includes('bruce') ||
      voice.name.toLowerCase().includes('deep')
    );
    
    if (maleVoices.length > 0) {
      utterance.voice = maleVoices[0];
    }
  } catch (e) {
    console.error('Error selecting voice:', e);
  }
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
  
  console.log(`Speaking: "${text}" (volume: ${volume}, pitch: ${pitch}, rate: ${rate})`);
  
  return new Promise<void>((resolve) => {
    utterance.onend = () => {
      resolve();
    };
    
    // Fallback to resolve if onend doesn't fire
    setTimeout(resolve, text.length * 100);
  });
}

// Hook for text-to-speech functionality
export function useSpeech() {
  const speak = useCallback(async (text: string, options = {}) => {
    return speakText(text, options);
  }, []);
  
  // Helper functions for common announcements
  const announceWinner = useCallback((playerName: string, amount: number) => {
    const text = `${playerName} wins ${amount} Naira!`;
    return speak(text, { pitch: 0.6, rate: 0.8 });
  }, [speak]);
  
  const announceNumber = useCallback((number: number) => {
    let text = number.toString();
    // For special numbers, add emphasis
    if ([1000, 500, 3355, 6624].includes(number)) {
      text = `Big ${text}!`;
    }
    return speak(text, { pitch: 0.7, rate: 0.9 });
  }, [speak]);
  
  return { speak, announceWinner, announceNumber };
}

// Preload all sounds to avoid delays
export function preloadAllSounds() {
  if (typeof window !== 'undefined') {
    Object.values(SOUNDS).forEach(soundUrl => {
      loadSound(soundUrl).catch(e => {
        console.warn(`Failed to preload sound: ${soundUrl}`, e);
      });
    });
  }
}

// Initialize audio on page load or interaction
export function initAudio() {
  // Initialize the audio context
  initAudioContext();
  
  // Try to unlock audio on iOS
  function unlockAudio() {
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(e => {
        console.error("Failed to unlock audio:", e);
      });
    }
    
    // Remove event listeners
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  }
  
  // Add event listeners for user interaction
  document.addEventListener('click', unlockAudio);
  document.addEventListener('touchstart', unlockAudio);
  
  // Preload all sounds
  preloadAllSounds();
}

// Call this on app initialization
if (typeof window !== 'undefined') {
  initAudio();
}
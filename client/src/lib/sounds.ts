// Sound effects system for the game
let soundEnabled = true;
let audioContext: AudioContext | null = null;

// Cache for preloaded audio files
const audioCache: Record<string, HTMLAudioElement> = {};

// Initialize the AudioContext for better audio control
export function initAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  
  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContext = new AudioContextClass();
      }
    }
    
    // Resume AudioContext if it's suspended (browsers often require user interaction)
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(err => {
        console.warn('Failed to resume AudioContext:', err);
      });
    }
    
    return audioContext;
  } catch (err) {
    console.error('Failed to initialize AudioContext:', err);
    return null;
  }
}

// Available sound files
export const SOUND_FILES = {
  // Game sounds
  CLICK: '/click.mp3',
  ROLLING_DICE: '/rolling-dice.mp3',
  DICE_LANDING: '/dice-landing.mp3',
  
  // Notification sounds
  NOTIFICATION: '/notification.mp3',
  ERROR: '/error.mp3',
  SUCCESS: '/success.mp3',
  
  // Voice chat sounds
  VOICE_CONNECTED: '/voice-connected.mp3',
  VOICE_DISCONNECTED: '/voice-disconnected.mp3',
  VOICE_MUTE: '/mute.mp3',
  VOICE_UNMUTE: '/unmute.mp3',
};

// Preload sounds for faster playback
export function preloadSounds(soundsToPreload: string[] = Object.values(SOUND_FILES)) {
  if (typeof window === 'undefined') return; // Skip if not in browser
  
  soundsToPreload.forEach(sound => {
    try {
      if (!audioCache[sound]) {
        const audio = new Audio(sound);
        audio.load(); // Begins loading the audio
        audioCache[sound] = audio;
      }
    } catch (err) {
      console.error(`Failed to preload sound: ${sound}`, err);
    }
  });
}

// Set sound enabled status
export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

// Get sound enabled status
export function isSoundEnabled() {
  return soundEnabled;
}

// Play a sound effect
export function playSound(soundPath: string, volume = 0.5) {
  if (!soundEnabled || typeof window === 'undefined') return;
  
  try {
    // Use cached audio if available or create a new one
    let audio = audioCache[soundPath];
    
    if (!audio) {
      audio = new Audio(soundPath);
      audioCache[soundPath] = audio;
    } else {
      // Reset audio to beginning if it's already playing
      audio.currentTime = 0;
    }
    
    // Set volume and play
    audio.volume = volume;
    audio.play().catch(err => {
      console.error(`Error playing sound ${soundPath}:`, err);
    });
  } catch (err) {
    console.error(`Error with sound playback for ${soundPath}:`, err);
  }
}

// Play a sound by its key
export function playSoundByKey(soundKey: keyof typeof SOUND_FILES, volume = 0.5) {
  const soundPath = SOUND_FILES[soundKey];
  if (soundPath) {
    playSound(soundPath, volume);
  } else {
    console.error(`Sound key not found: ${soundKey}`);
  }
}

// Interface for managing audio elements with controls
export interface SoundControl {
  play: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isPlaying: () => boolean;
}

// Create a controlled sound that can be played, stopped, and adjusted
export function createControlledSound(soundPath: string, initialVolume = 0.5): SoundControl {
  let audio: HTMLAudioElement | null = null;
  let volume = initialVolume;
  
  // Initialize the audio element
  const initialize = () => {
    if (typeof window === 'undefined') return;
    
    if (!audio) {
      audio = audioCache[soundPath] || new Audio(soundPath);
      audio.volume = volume;
      audioCache[soundPath] = audio;
    }
  };
  
  return {
    play: () => {
      if (!soundEnabled) return;
      initialize();
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error(`Error playing controlled sound:`, err);
        });
      }
    },
    stop: () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    },
    setVolume: (newVolume: number) => {
      volume = Math.max(0, Math.min(1, newVolume)); // Clamp between 0 and 1
      if (audio) {
        audio.volume = volume;
      }
    },
    isPlaying: () => {
      return !!(audio && !audio.paused);
    }
  };
}

// Play a random tone for testing/demo purposes
export function playRandomTone(minFreq = 200, maxFreq = 800, duration = 300, volume = 0.5) {
  if (!soundEnabled || typeof window === 'undefined') return;
  
  try {
    // Initialize audio context if needed
    const ctx = initAudioContext();
    if (!ctx) return;
    
    // Create an oscillator
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Generate a random frequency
    const randomFreq = Math.floor(Math.random() * (maxFreq - minFreq) + minFreq);
    
    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.value = randomFreq;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Set volume
    gainNode.gain.value = volume;
    
    // Play the tone
    oscillator.start();
    
    // Stop after duration
    setTimeout(() => {
      oscillator.stop();
      oscillator.disconnect();
      gainNode.disconnect();
    }, duration);
  } catch (err) {
    console.error(`Error playing random tone:`, err);
  }
}

// Play a winning sound sequence
export function playWinSound() {
  if (!soundEnabled || typeof window === 'undefined') return;
  
  try {
    playSound(SOUND_FILES.SUCCESS, 0.5);
  } catch (err) {
    console.error('Error playing win sound:', err);
  }
}

// Export by default a simplified version that just references the SOUND_FILES
export default SOUND_FILES;
// Sound effects utility module

let audioContext: AudioContext | null = null;

// Background music instance
let backgroundMusicElement: HTMLAudioElement | null = null;

// Sound effect paths
export const SOUND_EFFECTS = {
  // Game sounds
  STONE_ROLL: '/rolling-dice.mp3',
  STONE_LAND: '/dice-landing.mp3',
  CLICK: '/click.mp3',
  BUTTON_PRESS: '/button-press.mp3',
  COUNTDOWN: '/countdown.mp3',
  GAME_START: '/game-start.mp3',
  GAME_END: '/game-end.mp3',
  
  // Game outcome sounds
  WIN: '/win.mp3',
  LOSE: '/lose.mp3',
  TIE: '/tie.mp3',
  SPECIAL_WIN: '/special-win.mp3',  // For big wins
  JACKPOT: '/jackpot.mp3',
  
  // Stone-specific sounds (for special stones)
  STONE_1000: '/stone-1000.mp3',  // Special yellow stone sound
  STONE_500: '/stone-500.mp3',    // Special yellow stone sound
  STONE_3355: '/stone-3355.mp3',  // Super red stone sound
  STONE_6624: '/stone-6624.mp3',  // Super red stone sound
  
  // UI sounds
  NOTIFICATION: '/notification.mp3',
  ERROR: '/error.mp3',
  WARNING: '/warning.mp3',
  SUCCESS: '/success.mp3',
  
  // Wallet sounds
  DEPOSIT_SUCCESS: '/deposit-success.mp3',
  WITHDRAWAL_SUCCESS: '/withdrawal-success.mp3',
  COINS: '/coins.mp3',
  
  // Voice chat sounds
  VOICE_CONNECTED: '/voice-connected.mp3',
  VOICE_DISCONNECTED: '/voice-disconnected.mp3',
  VOICE_MUTE: '/mute.mp3',
  VOICE_UNMUTE: '/unmute.mp3',
  VOICE_JOIN: '/voice-join.mp3',
  VOICE_LEAVE: '/voice-leave.mp3',
  VOICE_NEW_MESSAGE: '/voice-message.mp3',
  
  // Background music
  BG_MUSIC_MAIN: '/bg-music-main.mp3',
  BG_MUSIC_INTENSE: '/bg-music-intense.mp3',
  BG_MUSIC_CALM: '/bg-music-calm.mp3',
};

// Initialize audio context (needed for Safari and iOS)
export function initAudioContext(): AudioContext | null {
  try {
    // Check if AudioContext is supported
    if (typeof AudioContext !== 'undefined') {
      audioContext = audioContext || new AudioContext();
      return audioContext;
    } else if (typeof (window as any).webkitAudioContext !== 'undefined') {
      // Fallback for Safari
      audioContext = audioContext || new (window as any).webkitAudioContext();
      return audioContext;
    }
  } catch (error) {
    console.error('Failed to initialize AudioContext:', error);
  }
  return null;
}

// Resume audio context on user interaction
export function resumeAudioContext(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(err => {
      console.error('Failed to resume audio context:', err);
    });
  }
}

// Play a sound effect
export function playSound(sound: keyof typeof SOUND_EFFECTS, volume = 0.5): void {
  try {
    // Resume audio context if needed
    resumeAudioContext();
    
    // Create audio element
    const audio = new Audio(SOUND_EFFECTS[sound]);
    audio.volume = volume;
    
    // Play the sound
    audio.play().catch(err => {
      console.error(`Error playing sound ${sound}:`, err);
    });
  } catch (error) {
    console.error(`Error creating audio for ${sound}:`, error);
  }
}

// Generate random sounds within a range (for testing)
export function playRandomTone(minFreq = 220, maxFreq = 880, duration = 0.3): void {
  try {
    // Initialize or resume audio context
    const ctx = initAudioContext();
    if (!ctx) return;
    
    resumeAudioContext();
    
    // Create oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Random frequency
    const freq = minFreq + Math.random() * (maxFreq - minFreq);
    osc.frequency.value = freq;
    
    // Waveform type
    osc.type = 'sine';
    
    // Envelope
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    // Connect and play
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.1);
  } catch (error) {
    console.error('Error playing random tone:', error);
  }
}

// Play a winning sound effect for when a user wins a game
export function playWinSound(): void {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    resumeAudioContext();
    
    // Create oscillators for a chord
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const oscC = ctx.createOscillator();
    
    // Create gain nodes
    const gainA = ctx.createGain();
    const gainB = ctx.createGain();
    const gainC = ctx.createGain();
    
    // Set frequencies for a major chord
    oscA.frequency.value = 440; // A4
    oscB.frequency.value = 554.37; // C#5
    oscC.frequency.value = 659.25; // E5
    
    // Set waveform types
    oscA.type = 'sine';
    oscB.type = 'triangle';
    oscC.type = 'square';
    
    // Configure envelopes
    const now = ctx.currentTime;
    
    gainA.gain.value = 0;
    gainA.gain.setValueAtTime(0, now);
    gainA.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainA.gain.linearRampToValueAtTime(0, now + 1.5);
    
    gainB.gain.value = 0;
    gainB.gain.setValueAtTime(0, now);
    gainB.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gainB.gain.linearRampToValueAtTime(0, now + 1.2);
    
    gainC.gain.value = 0;
    gainC.gain.setValueAtTime(0, now);
    gainC.gain.linearRampToValueAtTime(0.2, now + 0.2);
    gainC.gain.linearRampToValueAtTime(0, now + 1.0);
    
    // Connect nodes
    oscA.connect(gainA);
    oscB.connect(gainB);
    oscC.connect(gainC);
    
    gainA.connect(ctx.destination);
    gainB.connect(ctx.destination);
    gainC.connect(ctx.destination);
    
    // Start and stop oscillators
    oscA.start(now);
    oscB.start(now + 0.05);
    oscC.start(now + 0.1);
    
    oscA.stop(now + 1.5);
    oscB.stop(now + 1.2);
    oscC.stop(now + 1.0);
  } catch (error) {
    console.error('Error playing win sound:', error);
  }
}

// Sound effect specifically for stone rolling with dynamic volume based on stake
export function playStoneRollSound(stoneNumber?: number, stake?: number): void {
  try {
    // Default to generic roll sound
    let soundKey: keyof typeof SOUND_EFFECTS = 'STONE_ROLL';
    let volume = 0.5; // Default volume
    
    // Adjust volume based on stake
    if (stake) {
      // Higher stakes = slightly louder sound (max 0.9)
      volume = Math.min(0.4 + (stake / 50000) * 0.5, 0.9);
    }
    
    // Use special stone sounds if available
    if (stoneNumber) {
      if (stoneNumber === 1000 && 'STONE_1000' in SOUND_EFFECTS) {
        soundKey = 'STONE_1000';
      } else if (stoneNumber === 500 && 'STONE_500' in SOUND_EFFECTS) {
        soundKey = 'STONE_500';
      } else if (stoneNumber === 3355 && 'STONE_3355' in SOUND_EFFECTS) {
        soundKey = 'STONE_3355';
      } else if (stoneNumber === 6624 && 'STONE_6624' in SOUND_EFFECTS) {
        soundKey = 'STONE_6624';
      }
    }
    
    // Play the chosen sound
    playSound(soundKey, volume);
    
    // For special stones, add a secondary sound effect
    if (stoneNumber === 1000 || stoneNumber === 500) {
      setTimeout(() => playSound('SPECIAL_WIN', 0.3), 300);
    } else if (stoneNumber === 3355 || stoneNumber === 6624) {
      setTimeout(() => playSound('JACKPOT', 0.4), 300);
    }
  } catch (error) {
    console.error('Error playing stone roll sound:', error);
  }
}

// Sound for wallet transactions
export function playTransactionSound(type: 'deposit' | 'withdrawal' | 'win' | 'bet', amount?: number): void {
  try {
    let soundKey: keyof typeof SOUND_EFFECTS;
    let volume = 0.5;
    
    // Select sound based on transaction type
    switch (type) {
      case 'deposit':
        soundKey = 'DEPOSIT_SUCCESS';
        break;
      case 'withdrawal':
        soundKey = 'WITHDRAWAL_SUCCESS';
        break;
      case 'win':
        // For wins, volume scales with amount
        if (amount && amount > 10000) {
          soundKey = 'JACKPOT';
          volume = 0.7;
        } else {
          soundKey = 'WIN';
          volume = amount ? Math.min(0.4 + (amount / 10000) * 0.5, 0.9) : 0.5;
        }
        break;
      case 'bet':
        soundKey = 'COINS';
        break;
      default:
        soundKey = 'COINS';
    }
    
    playSound(soundKey, volume);
  } catch (error) {
    console.error('Error playing transaction sound:', error);
  }
}

// Play voice chat notification sounds
export function playVoiceChatSound(action: 'connect' | 'disconnect' | 'mute' | 'unmute' | 'join' | 'leave' | 'message'): void {
  try {
    let soundKey: keyof typeof SOUND_EFFECTS;
    
    // Map action to sound key
    switch (action) {
      case 'connect':
        soundKey = 'VOICE_CONNECTED';
        break;
      case 'disconnect':
        soundKey = 'VOICE_DISCONNECTED';
        break;
      case 'mute':
        soundKey = 'VOICE_MUTE';
        break;
      case 'unmute':
        soundKey = 'VOICE_UNMUTE';
        break;
      case 'join':
        soundKey = 'VOICE_JOIN';
        break;
      case 'leave':
        soundKey = 'VOICE_LEAVE';
        break;
      case 'message':
        soundKey = 'VOICE_NEW_MESSAGE';
        break;
      default:
        return;
    }
    
    playSound(soundKey, 0.4);
  } catch (error) {
    console.error('Error playing voice chat sound:', error);
  }
}

// Play UI sounds for different events
export function playUISound(type: 'notification' | 'error' | 'warning' | 'success' | 'click' | 'button'): void {
  try {
    let soundKey: keyof typeof SOUND_EFFECTS;
    
    // Map UI action to sound key
    switch (type) {
      case 'notification':
        soundKey = 'NOTIFICATION';
        break;
      case 'error':
        soundKey = 'ERROR';
        break;
      case 'warning':
        soundKey = 'WARNING';
        break;
      case 'success':
        soundKey = 'SUCCESS';
        break;
      case 'click':
        soundKey = 'CLICK';
        break;
      case 'button':
        soundKey = 'BUTTON_PRESS';
        break;
      default:
        return;
    }
    
    playSound(soundKey, 0.3);
  } catch (error) {
    console.error('Error playing UI sound:', error);
  }
}

// Sound settings object for user preferences
export const soundSettings = {
  masterVolume: 0.7,
  gameSoundsEnabled: true,
  voiceChatSoundsEnabled: true,
  uiSoundsEnabled: true,
  walletSoundsEnabled: true,
  backgroundMusicEnabled: true,
  backgroundMusicVolume: 0.3,
};

// Function to update sound settings
export function updateSoundSettings(settings: Partial<typeof soundSettings>): void {
  Object.assign(soundSettings, settings);
  
  // Apply background music volume changes if music is playing
  if (backgroundMusicElement && 'backgroundMusicVolume' in settings) {
    backgroundMusicElement.volume = soundSettings.backgroundMusicVolume;
  }
  
  // Toggle background music if that setting was changed
  if ('backgroundMusicEnabled' in settings) {
    if (settings.backgroundMusicEnabled) {
      if (backgroundMusicElement) {
        backgroundMusicElement.play().catch(err => {
          console.error('Failed to play background music:', err);
        });
      }
    } else {
      if (backgroundMusicElement) {
        backgroundMusicElement.pause();
      }
    }
  }
}

// Play background music
export function playBackgroundMusic(
  musicKey: 'BG_MUSIC_MAIN' | 'BG_MUSIC_INTENSE' | 'BG_MUSIC_CALM' = 'BG_MUSIC_MAIN', 
  volume = soundSettings.backgroundMusicVolume,
  loop = true
): void {
  try {
    // Stop any existing background music
    if (backgroundMusicElement) {
      backgroundMusicElement.pause();
      backgroundMusicElement = null;
    }
    
    // If music is disabled in settings, don't start new music
    if (!soundSettings.backgroundMusicEnabled) {
      return;
    }
    
    // Make sure we have a valid audio context
    initAudioContext();
    resumeAudioContext();
    
    // Create new audio element
    backgroundMusicElement = new Audio(SOUND_EFFECTS[musicKey]);
    backgroundMusicElement.volume = volume;
    backgroundMusicElement.loop = loop;
    
    // Add event listeners for looping and error handling
    backgroundMusicElement.addEventListener('ended', () => {
      if (loop && backgroundMusicElement) {
        backgroundMusicElement.currentTime = 0;
        backgroundMusicElement.play().catch(err => {
          console.error('Failed to loop background music:', err);
        });
      }
    });
    
    // Start playing
    backgroundMusicElement.play().catch(err => {
      console.error('Failed to play background music:', err);
    });
  } catch (error) {
    console.error('Error starting background music:', error);
  }
}

// Stop background music
export function stopBackgroundMusic(): void {
  if (backgroundMusicElement) {
    backgroundMusicElement.pause();
    backgroundMusicElement = null;
  }
}

// Fade background music (useful for transitions)
export function fadeBackgroundMusic(targetVolume: number, duration: number = 2000): void {
  if (!backgroundMusicElement) return;
  
  const startVolume = backgroundMusicElement.volume;
  const startTime = Date.now();
  
  const fadeInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (backgroundMusicElement) {
      backgroundMusicElement.volume = startVolume + (targetVolume - startVolume) * progress;
      
      if (progress === 1) {
        clearInterval(fadeInterval);
        if (targetVolume === 0 && backgroundMusicElement) {
          backgroundMusicElement.pause();
        }
      }
    } else {
      clearInterval(fadeInterval);
    }
  }, 50);
}

export default {
  initAudioContext,
  resumeAudioContext,
  playSound,
  playRandomTone,
  playWinSound,
  playStoneRollSound,
  playTransactionSound,
  playVoiceChatSound,
  playUISound,
  updateSoundSettings,
  soundSettings,
  SOUND_EFFECTS,
  playBackgroundMusic,
  stopBackgroundMusic,
  fadeBackgroundMusic
};
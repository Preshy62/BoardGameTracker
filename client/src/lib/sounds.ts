// Sound effects utility module

let audioContext: AudioContext | null = null;

// Sound effect paths
export const SOUND_EFFECTS = {
  // Game sounds
  STONE_ROLL: '/rolling-dice.mp3',
  STONE_LAND: '/dice-landing.mp3',
  CLICK: '/click.mp3',
  
  // Voice chat sounds
  VOICE_CONNECTED: '/voice-connected.mp3',
  VOICE_MUTE: '/mute.mp3',
  VOICE_UNMUTE: '/unmute.mp3',
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

export default {
  initAudioContext,
  resumeAudioContext,
  playSound,
  playRandomTone,
  playWinSound,
  SOUND_EFFECTS
};
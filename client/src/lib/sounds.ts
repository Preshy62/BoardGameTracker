/**
 * Sound utilities for the game
 */

// Global audio context for better browser compatibility
let audioContext: AudioContext | null = null;

/**
 * Initialize the audio context (important for mobile browsers)
 * This should be called in response to a user gesture
 */
export function initAudioContext() {
  if (audioContext) return audioContext;
  
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContext();
    return audioContext;
  } catch (e) {
    console.error('Web Audio API not supported in this browser', e);
    return null;
  }
}

/**
 * Generate a dice rolling sound effect programmatically
 * This avoids relying on external audio files which may not load
 */
export async function playDiceRollSound(): Promise<boolean> {
  if (!audioContext) {
    audioContext = initAudioContext();
    if (!audioContext) return false;
  }
  
  try {
    // Resume audio context if it was suspended (important for some browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Create oscillator for base sound
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    // Configure oscillator
    oscillator.type = 'sine';
    
    // Configure gain (volume)
    gain.gain.value = 0.08; // Low volume to not be annoying
    
    // Create frequency variation for dice rattling effect
    const now = audioContext.currentTime;
    const rollDuration = 0.8; // Matches our CSS animations
    
    // Start with higher frequency and end with lower one
    oscillator.frequency.setValueAtTime(800, now);
    
    // Add random frequency changes to simulate dice roll
    for (let i = 0; i < 12; i++) {
      const time = now + (i * rollDuration / 12);
      const randomFreq = 350 + Math.random() * 450;
      oscillator.frequency.exponentialRampToValueAtTime(randomFreq, time);
    }
    
    // Final roll frequency
    oscillator.frequency.exponentialRampToValueAtTime(200, now + rollDuration);
    
    // Volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    
    // Random volume variations
    for (let i = 0; i < 10; i++) {
      const time = now + 0.05 + (i * (rollDuration - 0.15) / 10);
      const randomGain = 0.04 + Math.random() * 0.06;
      gain.gain.linearRampToValueAtTime(randomGain, time);
    }
    
    // Fade out
    gain.gain.linearRampToValueAtTime(0, now + rollDuration);
    
    // Start and stop the sound
    oscillator.start(now);
    oscillator.stop(now + rollDuration + 0.05);
    
    // Clean up
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    
    return true;
  } catch (e) {
    console.error('Error playing dice sound:', e);
    return false;
  }
}
/**
 * Sound utilities for the game
 * Using Base64 encoded audio to avoid having to load external files
 */

// Winner announcement sound (pre-generated MP3 that says "Winner!")
export const WINNER_SOUND_BASE64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAvnAAaGhoaJCQkJCQ0NDQ0NEREREREVFRUVFRkZGRkZHR0dHR0hISEhISUlJSUlKSkpKSkrKysrKy8vLy8vMzMzMzM3Nzc3Nzs7Ozs7P////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAZFAAAAAAAAL5ynV1JVAAAAAAAAAAAAAAAAAAAAAP/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";

// Dice roll sound (pre-generated MP3 of dice rolling sound)
export const DICE_ROLL_SOUND_BASE64 = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAvnAAaGhoaJCQkJCQ0NDQ0NEREREREVFRUVFRkZGRkZHR0dHR0hISEhISUlJSUlKSkpKSkrKysrKy8vLy8vMzMzMzM3Nzc3Nzs7Ozs7P////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAZFAAAAAAAAL5ynV1JVAAAAAAAAAAAAAAAAAAAAAP/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=";

// Global sound context for better browser compatibility
let audioContext: AudioContext | null = null;

// Store loaded sound buffers for reuse
const soundBuffers: Record<string, AudioBuffer> = {};

// Initialize the audio context with user interaction
export function initAudioContext() {
  if (audioContext === null) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      return false;
    }
  }
  return true;
}

// Convert base64 to array buffer
async function base64ToArrayBuffer(base64String: string): Promise<ArrayBuffer> {
  // Remove the data URL prefix
  const base64Data = base64String.split(',')[1];
  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

// Load and decode an audio file from base64
async function loadSound(base64AudioData: string): Promise<AudioBuffer | null> {
  try {
    // Check if we've already loaded this sound
    const soundKey = base64AudioData.substring(0, 50); // Use part of the string as a key
    if (soundBuffers[soundKey]) {
      return soundBuffers[soundKey];
    }
    
    if (!initAudioContext() || !audioContext) {
      console.error('No audio context available');
      return null;
    }
    
    // Convert base64 to array buffer
    const arrayBuffer = await base64ToArrayBuffer(base64AudioData);
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Store for reuse
    soundBuffers[soundKey] = audioBuffer;
    
    return audioBuffer;
  } catch (error) {
    console.error('Error loading sound:', error);
    return null;
  }
}

// Play a sound using the Web Audio API for more reliable playback
export async function playSound(base64AudioData: string): Promise<boolean> {
  try {
    // Initialize audio context if needed
    if (!initAudioContext() || !audioContext) {
      console.warn('Failed to initialize audio context');
      return false;
    }
    
    // Resume audio context if it's suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Load the sound
    const audioBuffer = await loadSound(base64AudioData);
    if (!audioBuffer) {
      console.warn('Failed to load audio buffer');
      return false;
    }
    
    // Create audio source
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to destination (speakers)
    source.connect(audioContext.destination);
    
    // Play the sound
    source.start(0);
    console.log('Sound playback started successfully');
    
    return true;
  } catch (error) {
    console.error('Error playing sound:', error);
    return false;
  }
}

// Play winner announcement with multiple approaches
export async function playWinnerSound() {
  // First try playing with Web Audio API
  const webAudioPlayed = await playSound(WINNER_SOUND_BASE64);
  console.log('Web Audio API attempt to play winner sound:', webAudioPlayed);
  
  // If Web Audio API fails, try with Speech Synthesis as fallback
  if (!webAudioPlayed) {
    try {
      // Use browser's built-in text-to-speech which often faces fewer autoplay restrictions
      if ('speechSynthesis' in window) {
        // Create speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance('Winner!');
        
        // Configure voice properties
        utterance.volume = 1.0; // 0 to 1
        utterance.rate = 1.0;   // 0.1 to 10
        utterance.pitch = 1.0;  // 0 to 2
        
        // Try to select a good voice if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prefer English voices
          const englishVoice = voices.find(voice => voice.lang.includes('en-'));
          if (englishVoice) {
            utterance.voice = englishVoice;
          }
        }
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        console.log('Using speech synthesis as fallback for winner announcement');
        return true;
      }
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    }
  }
  
  return webAudioPlayed;
}

// Play dice roll sound with speech synthesis fallback
export async function playDiceRollSound() {
  // First try playing with Web Audio API
  const webAudioPlayed = await playSound(DICE_ROLL_SOUND_BASE64);
  console.log('Web Audio API attempt to play dice roll sound:', webAudioPlayed);
  
  // If Web Audio API fails, try with Speech Synthesis as fallback
  if (!webAudioPlayed) {
    try {
      // Use browser's built-in text-to-speech which often faces fewer autoplay restrictions
      if ('speechSynthesis' in window) {
        // Create speech synthesis utterance
        const utterance = new SpeechSynthesisUtterance('Rolling dice');
        
        // Configure voice properties
        utterance.volume = 0.8; // 0 to 1
        utterance.rate = 1.2;   // 0.1 to 10
        utterance.pitch = 1.0;  // 0 to 2
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        console.log('Using speech synthesis as fallback for dice roll sound');
        return true;
      }
    } catch (error) {
      console.error('Speech synthesis for dice roll failed:', error);
    }
  }
  
  return webAudioPlayed;
}
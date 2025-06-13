// Audio management library for game sounds and background music

export type MusicTrack = 'BG_MUSIC_MAIN' | 'BG_MUSIC_INTENSE' | 'BG_MUSIC_CALM';

class AudioManager {
  private context: AudioContext | null = null;
  private currentMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();
  private musicVolume = 0.3;
  private soundVolume = 0.5;
  private isMuted = false;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private createAudioElement(src: string): HTMLAudioElement {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = this.soundVolume;
    return audio;
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.isMuted ? 0 : this.musicVolume;
    }
  }

  setSoundVolume(volume: number) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    this.soundEffects.forEach(audio => {
      audio.volume = this.isMuted ? 0 : this.soundVolume;
    });
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.currentMusic) {
      this.currentMusic.volume = muted ? 0 : this.musicVolume;
    }
    this.soundEffects.forEach(audio => {
      audio.volume = muted ? 0 : this.soundVolume;
    });
  }

  async playBackgroundMusic(track?: MusicTrack) {
    // Stop current music
    this.stopAllMusic();

    // For now, we'll use a silent approach since we don't have actual audio files
    // In a real implementation, you would load and play actual audio files
    console.log(`Playing background music: ${track || 'default'}`);
  }

  stopAllMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
    }
  }

  async playSound(soundName: string) {
    try {
      // For now, we'll use a silent approach since we don't have actual audio files
      // In a real implementation, you would load and play actual sound files
      console.log(`Playing sound: ${soundName}`);
      
      // Create a simple beep using Web Audio API if available
      if (this.context && !this.isMuted) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.setValueAtTime(440, this.context.currentTime);
        gainNode.gain.setValueAtTime(this.soundVolume * 0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
      }
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  preloadSounds(soundNames: string[]) {
    soundNames.forEach(name => {
      if (!this.soundEffects.has(name)) {
        // In a real implementation, you would preload actual audio files
        console.log(`Preloading sound: ${name}`);
      }
    });
  }

  dispose() {
    this.stopAllMusic();
    this.soundEffects.clear();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Export convenient functions
export const playBackgroundMusic = (track?: MusicTrack) => audioManager.playBackgroundMusic(track);
export const stopAllMusic = () => audioManager.stopAllMusic();
export const playSound = (soundName: string) => audioManager.playSound(soundName);
export const setMusicVolume = (volume: number) => audioManager.setMusicVolume(volume);
export const setSoundVolume = (volume: number) => audioManager.setSoundVolume(volume);
export const setAudioMuted = (muted: boolean) => audioManager.setMuted(muted);
export const preloadSounds = (soundNames: string[]) => audioManager.preloadSounds(soundNames);

// Initialize some common sounds
preloadSounds([
  'click',
  'roll',
  'win',
  'lose',
  'notification',
  'join',
  'leave'
]);

export default audioManager;
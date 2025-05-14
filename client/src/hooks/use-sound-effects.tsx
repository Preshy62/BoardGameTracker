import { useCallback, useEffect, useState } from 'react';
import {
  SOUND_EFFECTS,
  playSound,
  playStoneRollSound,
  playTransactionSound,
  playVoiceChatSound,
  playUISound,
  playWinSound,
  soundSettings,
  updateSoundSettings
} from '@/lib/sounds';

// Hook for using the sound system
export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(() => {
    // Check if sound is muted in localStorage
    const storedPreference = localStorage.getItem('bbg-sound-muted');
    return storedPreference === 'true';
  });

  // Update sound settings when mute state changes
  useEffect(() => {
    const allEnabled = !isMuted;
    updateSoundSettings({
      gameSoundsEnabled: allEnabled,
      voiceChatSoundsEnabled: allEnabled,
      uiSoundsEnabled: allEnabled,
      walletSoundsEnabled: allEnabled,
      masterVolume: allEnabled ? 0.7 : 0,
    });
    
    // Save preference to localStorage
    localStorage.setItem('bbg-sound-muted', isMuted.toString());
  }, [isMuted]);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Wrapper function that checks if sounds are enabled
  const playSoundWrapper = useCallback((
    sound: keyof typeof SOUND_EFFECTS,
    volume = 0.5
  ) => {
    if (!isMuted) {
      playSound(sound, volume * soundSettings.masterVolume);
    }
  }, [isMuted]);

  // Wrapper for stone roll sound
  const playStoneRollSoundWrapper = useCallback((
    stoneNumber?: number,
    stake?: number
  ) => {
    if (!isMuted && soundSettings.gameSoundsEnabled) {
      playStoneRollSound(stoneNumber, stake);
    }
  }, [isMuted]);

  // Wrapper for transaction sounds
  const playTransactionSoundWrapper = useCallback((
    type: 'deposit' | 'withdrawal' | 'win' | 'bet',
    amount?: number
  ) => {
    if (!isMuted && soundSettings.walletSoundsEnabled) {
      playTransactionSound(type, amount);
    }
  }, [isMuted]);

  // Wrapper for voice chat sounds
  const playVoiceChatSoundWrapper = useCallback((
    action: 'connect' | 'disconnect' | 'mute' | 'unmute' | 'join' | 'leave' | 'message'
  ) => {
    if (!isMuted && soundSettings.voiceChatSoundsEnabled) {
      playVoiceChatSound(action);
    }
  }, [isMuted]);

  // Wrapper for UI sounds
  const playUISoundWrapper = useCallback((
    type: 'notification' | 'error' | 'warning' | 'success' | 'click' | 'button'
  ) => {
    if (!isMuted && soundSettings.uiSoundsEnabled) {
      playUISound(type);
    }
  }, [isMuted]);

  // Wrapper for win sound
  const playWinSoundWrapper = useCallback(() => {
    if (!isMuted && soundSettings.gameSoundsEnabled) {
      playWinSound();
    }
  }, [isMuted]);

  return {
    isMuted,
    toggleMute,
    playSound: playSoundWrapper,
    playStoneRollSound: playStoneRollSoundWrapper,
    playTransactionSound: playTransactionSoundWrapper,
    playVoiceChatSound: playVoiceChatSoundWrapper,
    playUISound: playUISoundWrapper,
    playWinSound: playWinSoundWrapper,
  };
}

export default useSoundEffects;
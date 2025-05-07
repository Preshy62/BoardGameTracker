import { useEffect, useState, useCallback } from 'react';

interface UseSpeechSynthesisProps {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: number; // Index of voice to use
  autoSpeak?: boolean;
}

interface UseSpeechSynthesisReturn {
  speak: () => void;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
  voices: SpeechSynthesisVoice[];
}

export const useSpeechSynthesis = ({
  text,
  rate = 1.0,
  pitch = 1.0,
  volume = 1.0, 
  voice = 0,
  autoSpeak = false,
}: UseSpeechSynthesisProps): UseSpeechSynthesisReturn => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      setSupported(true);
      
      // Initialize voices
      const voicesChanged = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      
      // Chrome loads voices asynchronously
      window.speechSynthesis.onvoiceschanged = voicesChanged;
      voicesChanged();
      
      // Cleanup
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const speak = useCallback(() => {
    if (!supported) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    if (text) {
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set properties
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      // Set voice if available
      if (voices.length > 0) {
        // Choose a male voice when possible
        const maleVoices = voices.filter(v => v.name.includes('Male') || v.name.includes('male'));
        
        // Use a male voice if available, otherwise use the specified voice index
        if (maleVoices.length > 0) {
          utterance.voice = maleVoices[0];
        } else if (voices.length > voice) {
          utterance.voice = voices[voice];
        }
      }
      
      // Event handlers
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      
      // Speak
      window.speechSynthesis.speak(utterance);
    }
  }, [supported, text, rate, pitch, volume, voice, voices]);

  const cancel = useCallback(() => {
    if (!supported) return;
    setSpeaking(false);
    window.speechSynthesis.cancel();
  }, [supported]);

  // Auto-speak when enabled
  useEffect(() => {
    if (autoSpeak && text) {
      speak();
    }
    
    return () => {
      if (speaking) {
        cancel();
      }
    };
  }, [autoSpeak, speak, cancel, text, speaking]);

  return { speak, cancel, speaking, supported, voices };
};

export default useSpeechSynthesis;
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
    try {
      if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        setSupported(true);
        
        // Initialize voices
        const voicesChanged = () => {
          try {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices && availableVoices.length > 0) {
              setVoices(availableVoices);
            }
          } catch (error) {
            console.log('Error getting voices:', error);
          }
        };
        
        // Try to get voices immediately first
        voicesChanged();
        
        // Chrome and some browsers load voices asynchronously
        try {
          window.speechSynthesis.onvoiceschanged = voicesChanged;
        } catch (error) {
          console.log('Error setting voices changed handler:', error);
        }
        
        // Cleanup
        return () => {
          try {
            window.speechSynthesis.cancel();
          } catch (error) {
            console.log('Error in cleanup:', error);
          }
        };
      } else {
        console.log('Speech synthesis not fully supported in this browser');
      }
    } catch (error) {
      console.log('Error initializing speech synthesis:', error);
    }
  }, []);

  const speak = useCallback(() => {
    if (!supported) return;
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      if (text) {
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set properties
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        
        // Set voice if available (wrapped in try-catch for browser inconsistencies)
        try {
          if (voices.length > 0) {
            // Choose a deep male voice when possible, prioritizing certain voices
            const deepMaleVoices = voices.filter(v => 
              (v.name.includes('Male') || v.name.includes('male')) &&
              (v.name.includes('Deep') || v.name.includes('deep') || 
               v.name.includes('Bass') || v.name.includes('bass') ||
               v.name.includes('Low') || v.name.includes('low'))
            );
            
            // Next preference is any male voice
            const maleVoices = voices.filter(v => 
              v.name.includes('Male') || v.name.includes('male')
            );
            
            // For deeper sound, adjust the pitch lower
            utterance.pitch = 0.7; // Lower pitch for deeper voice (range 0-2)
            
            // Use deepest male voice if available, then any male voice, then specified voice index
            if (deepMaleVoices.length > 0) {
              console.log('Using deep male voice:', deepMaleVoices[0].name);
              utterance.voice = deepMaleVoices[0];
            } else if (maleVoices.length > 0) {
              console.log('Using male voice:', maleVoices[0].name);
              utterance.voice = maleVoices[0];
            } else if (voices.length > voice) {
              console.log('Using default voice:', voices[voice].name);
              utterance.voice = voices[voice];
            }
          }
        } catch (voiceError) {
          console.log('Voice selection error:', voiceError);
          // Continue with default voice
        }
        
        // Event handlers with try-catch for browser safety
        try {
          utterance.onstart = () => setSpeaking(true);
          utterance.onend = () => setSpeaking(false);
          utterance.onerror = (event) => {
            console.log('Speech synthesis error:', event);
            setSpeaking(false);
          };
          
          // Speak
          window.speechSynthesis.speak(utterance);
        } catch (eventError) {
          console.log('Speech event handling error:', eventError);
          setSpeaking(false);
        }
      }
    } catch (error) {
      console.log('Speech synthesis error:', error);
      setSpeaking(false);
    }
  }, [supported, text, rate, pitch, volume, voice, voices]);

  const cancel = useCallback(() => {
    if (!supported) return;
    setSpeaking(false);
    try {
      window.speechSynthesis.cancel();
    } catch (error) {
      console.log('Error canceling speech:', error);
    }
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
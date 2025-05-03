import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { Game } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface VoiceChatProps {
  game: Game;
  isEnabled: boolean;
  currentUserId: number;
}

const VoiceChat = ({ game, isEnabled, currentUserId }: VoiceChatProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isHighStakesGame, setIsHighStakesGame] = useState(false);
  const [isVoiceChatSupported, setIsVoiceChatSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  
  // Check if game is high stakes (over ₦50,000)
  useEffect(() => {
    // Wrap everything in try/catch to avoid crashing the app
    try {
      // Safely check if game exists and has stake property
      const isHighStakes = game && typeof game.stake === 'number' && game.stake >= 50000;
      setIsHighStakesGame(isHighStakes);
      
      // If not high stakes, don't proceed with initialization
      if (!isHighStakes) {
        return;
      }
      
      // Check browser support for voice chat with safe null checks
      if (typeof navigator === 'undefined' || 
          !navigator.mediaDevices || 
          typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setIsVoiceChatSupported(false);
        console.warn("Voice chat is not supported in this browser.");
        return;
      }
      
      // Safely check speech synthesis with proper type guards
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          // Get available voices safely
          const getVoices = () => {
            try {
              const voices = window.speechSynthesis?.getVoices();
              return Array.isArray(voices) && voices.length > 0 ? voices : null;
            } catch (voiceErr) {
              console.error("Error getting voices:", voiceErr);
              return null;
            }
          };
          
          const voices = getVoices();
          if (voices) {
            setAvailableVoices(voices);
            setSelectedVoice(voices[0]);
          }
          
          // Handle voices changed event safely
          if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
              const updatedVoices = getVoices();
              if (updatedVoices) {
                setAvailableVoices(updatedVoices);
                setSelectedVoice(updatedVoices[0]);
              }
            };
          }
        } catch (speechErr) {
          console.error("Speech synthesis error:", speechErr);
        }
      } else {
        console.warn("Speech synthesis not supported in this browser");
      }
    } catch (err) {
      // Catch-all for any unexpected errors
      console.error("Voice chat initialization error:", err);
      setIsVoiceChatSupported(false);
    }
    
    return () => {
      try {
        // Cleanup voice synthesis
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        
        // Cleanup audio streams
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          tracks.forEach(track => track.stop());
        }
        
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (err) {
        console.error("Error cleaning up voice chat:", err);
      }
    };
  }, [game?.stake]);
  
  // Function to toggle mute
  const toggleMute = async () => {
    if (!isHighStakesGame || !isEnabled || !isVoiceChatSupported) {
      return;
    }
    
    try {
      if (isMuted) {
        // Initialize audio context if needed
        if (!audioContextRef.current) {
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              audioContextRef.current = new AudioContext();
            } else {
              throw new Error("AudioContext not supported");
            }
          } catch (err) {
            console.error("Error creating AudioContext:", err);
            toast({
              title: "Voice Chat Error",
              description: "Could not initialize audio. Voice chat unavailable.",
              variant: "destructive"
            });
            return;
          }
        }
        
        try {
          // Get microphone access
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          // Try to announce unmuting with voice synthesis
          const announcement = `Player ${currentUserId} has joined voice chat.`;
          speakAnnouncement(announcement);
          
          setIsMuted(false);
        } catch (err) {
          console.error('Error accessing microphone:', err);
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use voice chat.",
            variant: "destructive"
          });
        }
      } else {
        // Stop all tracks
        if (streamRef.current) {
          try {
            const tracks = streamRef.current.getTracks();
            tracks.forEach(track => track.stop());
            
            // Try to announce muting with voice synthesis
            const announcement = `Player ${currentUserId} has left voice chat.`;
            speakAnnouncement(announcement);
            
            setIsMuted(true);
          } catch (err) {
            console.error('Error stopping audio tracks:', err);
            setIsMuted(true); // Still set to muted even if there's an error
          }
        } else {
          setIsMuted(true);
        }
      }
    } catch (err) {
      // Catch-all for any unexpected errors
      console.error('Unexpected error in toggleMute:', err);
      toast({
        title: "Voice Chat Error",
        description: "An error occurred with voice chat. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to speak announcements
  const speakAnnouncement = (text: string) => {
    try {
      if (!window.speechSynthesis || !selectedVoice) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Error with speech synthesis:", err);
    }
  };
  
  // If voice chat is not available, don't render anything
  if (!isHighStakesGame || !isEnabled) {
    return null;
  }
  
  if (!isVoiceChatSupported) {
    return (
      <div className="voice-chat-controls p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <VolumeX className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Voice Chat</span>
          </div>
          <span className="text-xs text-gray-500">Not supported in this browser</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="voice-chat-controls p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isMuted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
          <span className="text-sm font-medium">Voice Chat</span>
        </div>
        
        <Button 
          onClick={toggleMute} 
          variant="outline" 
          size="sm"
          className={`flex items-center ${!isMuted ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}`}
        >
          {isMuted ? (
            <>
              <MicOff className="h-4 w-4 mr-2" />
              <span>Unmute</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              <span>Mute</span>
            </>
          )}
        </Button>
      </div>
      
      {!isMuted && (
        <div className="mt-2 text-xs text-gray-600 bg-primary/10 p-2 rounded">
          Your microphone is active. Other players in this high-stakes game can hear you.
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
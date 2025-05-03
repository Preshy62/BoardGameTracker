import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { Game } from "@shared/schema";

interface VoiceChatProps {
  game: Game;
  isEnabled: boolean;
  currentUserId: number;
}

const VoiceChat = ({ game, isEnabled, currentUserId }: VoiceChatProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isHighStakesGame, setIsHighStakesGame] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Check if game is high stakes (over ₦50,000)
  useEffect(() => {
    const isHighStakes = game.stake >= 50000;
    setIsHighStakesGame(isHighStakes);
    
    // If speech synthesis is available
    if (window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        
        // Select a default voice (preferably a UK male voice)
        const ukMaleVoice = voices.find(voice => voice.name.includes('UK') && voice.name.includes('Male'));
        if (ukMaleVoice) {
          setSelectedVoice(ukMaleVoice);
          console.log("Using voice:", ukMaleVoice.name);
        } else {
          setSelectedVoice(voices[0]);
          console.log("Using voice:", voices[0].name);
        }
      }
      
      // Log available voices
      console.log("Available voices:", voices.map(v => v.name));
      
      // Handle onvoiceschanged event
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        setAvailableVoices(updatedVoices);
      };
    }
    
    return () => {
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
    };
  }, [game.stake]);
  
  // Function to toggle mute
  const toggleMute = async () => {
    if (!isHighStakesGame || !isEnabled) return;
    
    try {
      if (isMuted) {
        // Initialize audio context if needed
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Announce unmuting with voice synthesis
        const announcement = `${currentUserId} has joined voice chat.`;
        speakAnnouncement(announcement);
      } else {
        // Stop all tracks
        if (streamRef.current) {
          const tracks = streamRef.current.getTracks();
          tracks.forEach(track => track.stop());
        }
        
        // Announce muting with voice synthesis
        const announcement = `${currentUserId} has left voice chat.`;
        speakAnnouncement(announcement);
      }
      
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };
  
  // Function to speak announcements
  const speakAnnouncement = (text: string) => {
    if (!window.speechSynthesis || !selectedVoice) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  };
  
  // If voice chat is not available, don't render anything
  if (!isHighStakesGame || !isEnabled) {
    return null;
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
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SoundTest() {
  const { toast } = useToast();
  const [volume, setVolume] = useState(1.0);
  const [pitch, setPitch] = useState(0.7);
  const [rate, setRate] = useState(0.9);
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  
  // Game number sounds
  const gameNumbers = [1000, 500, 3355, 6624];
  
  // Load available voices
  useEffect(() => {
    // Check if speech synthesis is available
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Speech Synthesis Not Supported",
        description: "Your browser does not support speech synthesis",
        variant: "destructive",
      });
      return;
    }
    
    // Function to handle voices changed
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a male voice
      const maleVoice = availableVoices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man')
      );
      
      if (maleVoice) {
        setSelectedVoice(maleVoice.name);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };
    
    // Firefox loads voices synchronously
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Chrome & Safari load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      }
      
      // Try to get voices immediately
      handleVoicesChanged();
    }
    
    // Clean up
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [toast]);
  
  // Function to speak text
  const speak = (textToSpeak: string, options = {}) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create a new speech utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set default options
    const { volume: vol = volume, pitch: ptch = pitch, rate: rt = rate } = options as any;
    
    // Configure utterance
    utterance.volume = vol;
    utterance.rate = rt;
    utterance.pitch = ptch;
    
    // Set selected voice if available
    if (selectedVoice) {
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    // Speak the text
    window.speechSynthesis.speak(utterance);
    
    toast({
      title: "Speaking",
      description: textToSpeak.length > 30 ? textToSpeak.substring(0, 30) + "..." : textToSpeak,
    });
  };
  
  // Function to play system speech synthesis
  const playSpeech = () => {
    if (text.trim() === "") return;
    speak(text, { volume, pitch, rate });
  };
  
  // Game-like announcement examples
  const announceGameEvent = (event: string) => {
    switch (event) {
      case "welcome":
        speak("Welcome to Big Boys Game! Place your bets and get ready to roll!", { pitch: 0.7, rate: 0.9 });
        break;
      case "start":
        speak("Game is starting! All bets are locked in!", { pitch: 0.7, rate: 0.9 });
        break;
      case "turn":
        speak("It's your turn to roll! Press the roll button now!", { pitch: 0.7, rate: 0.9 });
        break;
      case "winner":
        speak("Precious wins twenty five thousand Naira!", { pitch: 0.6, rate: 0.8 });
        break;
      default:
        break;
    }
  };
  
  // Function to announce numbers
  const announceNumber = (number: number) => {
    let text = number.toString();
    // For special numbers, add emphasis
    if ([1000, 500, 3355, 6624].includes(number)) {
      text = `Big ${text}!`;
    }
    speak(text, { pitch: 0.7, rate: 0.9 });
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Game Sound Test</CardTitle>
          <CardDescription>
            Test voice announcements for the game using speech synthesis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Game Announcements</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => announceGameEvent("welcome")}>Welcome Message</Button>
              <Button onClick={() => announceGameEvent("start")}>Game Start</Button>
              <Button onClick={() => announceGameEvent("turn")}>Your Turn</Button>
              <Button onClick={() => announceGameEvent("winner")}>Announce Winner</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Number Announcements</h3>
            <div className="grid grid-cols-2 gap-3">
              {gameNumbers.map(number => (
                <Button 
                  key={number} 
                  onClick={() => announceNumber(number)}
                  variant={number >= 3000 ? "destructive" : "secondary"}
                >
                  Announce {number}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-medium text-lg">Custom Speech</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="speech-text">Text to Speak</Label>
                <textarea 
                  id="speech-text"
                  className="w-full p-2 border rounded-md mt-1"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to speak..."
                />
              </div>
              
              {voices.length > 0 && (
                <div>
                  <Label htmlFor="voice-select">Voice</Label>
                  <select
                    id="voice-select"
                    className="w-full p-2 border rounded-md mt-1"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                  >
                    {voices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="volume-slider">Volume: {volume.toFixed(1)}</Label>
                  </div>
                  <Slider
                    id="volume-slider"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[volume]}
                    onValueChange={(value) => setVolume(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="pitch-slider">Pitch: {pitch.toFixed(1)}</Label>
                  </div>
                  <Slider
                    id="pitch-slider"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={[pitch]}
                    onValueChange={(value) => setPitch(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="rate-slider">Speed: {rate.toFixed(1)}</Label>
                  </div>
                  <Slider
                    id="rate-slider"
                    min={0.1}
                    max={2}
                    step={0.1}
                    value={[rate]}
                    onValueChange={(value) => setRate(value[0])}
                  />
                </div>
              </div>
              
              <Button onClick={playSpeech} className="w-full">Speak Text</Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Troubleshooting Tips</h4>
            <ul className="space-y-1">
              <li>• If you don't hear any sound, try clicking somewhere on the page first</li>
              <li>• Some voices may not be available in all browsers</li>
              <li>• Chrome offers the best speech synthesis quality</li>
              <li>• If speech doesn't work, try refreshing the page</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
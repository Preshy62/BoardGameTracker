import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function VoiceRecorderTest() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [maxRecordingTime] = useState(10); // Max recording time in seconds
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        toast({
          title: "Recording completed",
          description: `Recorded ${recordingTime.toFixed(1)} seconds of audio`,
        });
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRecordingTime(elapsed);
        
        if (elapsed >= maxRecordingTime) {
          stopRecording();
        }
      }, 100);
      
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak now to test your microphone",
      });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone access error",
        description: "Please allow microphone access to use the recorder",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Voice Recorder Test</CardTitle>
          <CardDescription>
            Record your voice and play it back to test microphone and audio playback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {isRecording ? (
              <>
                <div className="mb-4 text-center">
                  <p className="text-lg font-medium">Recording: {recordingTime.toFixed(1)}s</p>
                  <Progress value={(recordingTime / maxRecordingTime) * 100} className="mt-2" />
                </div>
                <Button 
                  variant="destructive" 
                  onClick={stopRecording}
                  className="px-8"
                >
                  Stop Recording
                </Button>
              </>
            ) : (
              <Button 
                onClick={startRecording}
                className="px-8"
                disabled={!!audioURL}
              >
                Start Recording
              </Button>
            )}
          </div>
          
          {audioURL && (
            <div className="mt-6">
              <p className="text-sm font-medium mb-2">Your Recording:</p>
              <audio 
                src={audioURL} 
                controls 
                className="w-full"
                autoPlay
              />
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAudioURL(null);
                    setRecordingTime(0);
                  }}
                >
                  Record Again
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-8 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Troubleshooting Tips</h4>
            <ul className="space-y-1">
              <li>• Make sure your microphone is connected and working</li>
              <li>• Check browser permissions to allow microphone access</li>
              <li>• If you can't hear your recording, check your speaker/headphone volume</li>
              <li>• Try using Chrome or Firefox for best compatibility</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
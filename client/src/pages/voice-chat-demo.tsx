import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import DemoVoiceChat from "@/components/game/DemoVoiceChat";
import DemoTextChat from "@/components/game/DemoTextChat";

export default function VoiceChatDemoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stakeAmount, setStakeAmount] = useState(50000); // Premium by default
  const [showVoice, setShowVoice] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Big Boys Game</h1>
            <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">VOICE CHAT DEMO</span>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setLocation('/')} 
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold">Voice Chat Demo</h1>
            <p className="text-gray-600">Test the premium voice chat features for high-stakes games</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Demo Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Game Stake Amount</h3>
                  <div className="flex flex-col gap-2">
                    <Slider
                      value={[stakeAmount]}
                      min={5000}
                      max={100000}
                      step={5000}
                      onValueChange={(value) => setStakeAmount(value[0])}
                      className="w-full"
                    />
                    <div className="flex justify-between">
                      <span className="text-xs">₦{stakeAmount.toLocaleString()}</span>
                      <span className="text-xs font-medium">
                        {stakeAmount >= 50000 ? '✨ Premium' : stakeAmount >= 20000 ? '🔊 Voice Enabled' : '🔇 Voice Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Display Options</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowVoice(true)}
                      variant={showVoice ? "default" : "outline"}
                      size="sm"
                      className="w-1/2"
                    >
                      Voice Chat
                    </Button>
                    <Button
                      onClick={() => setShowVoice(false)}
                      variant={!showVoice ? "default" : "outline"}
                      size="sm"
                      className="w-1/2"
                    >
                      Text Chat
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      toast({
                        title: "Testing Voice Chat",
                        description: `${stakeAmount >= 50000 ? 'Premium' : 'Standard'} voice chat for game with ₦${stakeAmount.toLocaleString()} stake.`,
                      });
                    }}
                    className="w-full"
                  >
                    Test Notification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Chat Components */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {stakeAmount >= 50000 
                  ? "Premium Voice Chat" 
                  : stakeAmount >= 20000 
                    ? "Standard Voice Chat" 
                    : "Text Chat Only"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={showVoice ? "voice" : "text"} value={showVoice ? "voice" : "text"}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="voice" onClick={() => setShowVoice(true)}>Voice Chat</TabsTrigger>
                  <TabsTrigger value="text" onClick={() => setShowVoice(false)}>Text Chat</TabsTrigger>
                </TabsList>
                <TabsContent value="voice" className="pt-4">
                  <DemoVoiceChat stakeAmount={stakeAmount} demo={true} />
                </TabsContent>
                <TabsContent value="text" className="pt-4">
                  <DemoTextChat stakeAmount={stakeAmount} demo={true} />
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <h3 className="font-medium text-amber-800 mb-2">Voice Chat Features:</h3>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  <li>Voice chat automatically enabled for games with stakes ≥₦20,000</li>
                  <li>Premium UI and features for high-stakes games (≥₦50,000)</li>
                  <li>Automatic joining for premium voice chat</li>
                  <li>Visual indicators showing premium status</li>
                  <li>Support for multiple players in the voice channel</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
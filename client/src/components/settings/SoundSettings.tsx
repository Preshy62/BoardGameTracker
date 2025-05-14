import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useSoundEffects from '@/hooks/use-sound-effects';
import { updateSoundSettings, soundSettings, playUISound } from '@/lib/sounds';

export function SoundSettings() {
  const { isMuted, toggleMute, playUISound: playUI } = useSoundEffects();
  
  // Local state for sound settings
  const [settings, setSettings] = useState({
    masterVolume: soundSettings.masterVolume,
    gameSoundsEnabled: soundSettings.gameSoundsEnabled,
    voiceChatSoundsEnabled: soundSettings.voiceChatSoundsEnabled,
    uiSoundsEnabled: soundSettings.uiSoundsEnabled,
    walletSoundsEnabled: soundSettings.walletSoundsEnabled,
  });
  
  // Update global sound settings when local settings change
  useEffect(() => {
    updateSoundSettings(settings);
  }, [settings]);
  
  // Handle master volume change
  const handleMasterVolumeChange = (value: number[]) => {
    setSettings(prev => ({
      ...prev,
      masterVolume: value[0],
    }));
    
    // Play a test sound when adjusting volume
    if (!isMuted) {
      // We need to fix this - playUISound doesn't accept volume param
      playUI('click');
    }
  };
  
  // Handle sound category toggle
  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => {
      const newValue = !prev[key];
      
      // Play a test sound when enabling a category
      if (newValue && !isMuted) {
        playUI('click');
      }
      
      return {
        ...prev,
        [key]: newValue,
      };
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Sound Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4 text-primary" />
            )}
            <Label htmlFor="master-toggle" className="text-base">Master Sound</Label>
          </div>
          <Switch 
            id="master-toggle" 
            checked={!isMuted}
            onCheckedChange={() => {
              toggleMute();
              if (isMuted) {
                // Play a test sound when unmuting
                setTimeout(() => playUI('success'), 100);
              }
            }}
          />
        </div>
        
        {/* Master Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="master-volume" className="text-sm">Volume</Label>
            <span className="text-xs text-muted-foreground">
              {Math.round(settings.masterVolume * 100)}%
            </span>
          </div>
          <Slider
            id="master-volume"
            disabled={isMuted}
            value={[settings.masterVolume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleMasterVolumeChange}
          />
        </div>
        
        {/* Sound Categories */}
        <div className="space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="game-sounds" className="text-sm">Game Sounds</Label>
            <Switch 
              id="game-sounds" 
              disabled={isMuted}
              checked={settings.gameSoundsEnabled}
              onCheckedChange={() => handleToggle('gameSoundsEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="voice-sounds" className="text-sm">Voice Chat Sounds</Label>
            <Switch 
              id="voice-sounds" 
              disabled={isMuted}
              checked={settings.voiceChatSoundsEnabled}
              onCheckedChange={() => handleToggle('voiceChatSoundsEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="ui-sounds" className="text-sm">Interface Sounds</Label>
            <Switch 
              id="ui-sounds" 
              disabled={isMuted}
              checked={settings.uiSoundsEnabled}
              onCheckedChange={() => handleToggle('uiSoundsEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="wallet-sounds" className="text-sm">Wallet Sounds</Label>
            <Switch 
              id="wallet-sounds" 
              disabled={isMuted}
              checked={settings.walletSoundsEnabled}
              onCheckedChange={() => handleToggle('walletSoundsEnabled')}
            />
          </div>
        </div>
        
        {/* Sound Test Buttons */}
        {!isMuted && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium mb-2">Test Sounds</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="px-2 py-1 text-xs border rounded hover:bg-accent transition-colors"
                onClick={() => playUI('click')}
              >
                Click
              </button>
              <button
                className="px-2 py-1 text-xs border rounded hover:bg-accent transition-colors"
                onClick={() => playUI('success')}
              >
                Success
              </button>
              <button
                className="px-2 py-1 text-xs border rounded hover:bg-accent transition-colors"
                onClick={() => playUI('error')}
              >
                Error
              </button>
              <button
                className="px-2 py-1 text-xs border rounded hover:bg-accent transition-colors"
                onClick={() => playUI('notification')}
              >
                Notification
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SoundSettings;
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAdmin } from '@/hooks/use-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'wouter';
import { Mic, Volume2, Crown, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import VoiceChat from '@/components/game/VoiceChat';

export default function VoiceChatTest() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [, setLocation] = useLocation();
  const [testStake, setTestStake] = useState(25000);

  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      setLocation('/');
    }
  }, [user, isAdmin, setLocation]);

  if (!user || !isAdmin) {
    return null;
  }

  // Create mock game data for testing
  const mockGame = {
    id: 999,
    creatorId: user.id,
    maxPlayers: 4,
    stake: testStake,
    status: 'active' as const,
    commissionPercentage: 0.1,
    createdAt: new Date().toISOString(),
    endedAt: null,
    winnerIds: null,
    winningNumber: null,
    voiceChatEnabled: testStake >= 20000,
    textChatEnabled: true,
    currency: 'NGN',
    stakePot: testStake * 4,
    region: null,
    language: 'en'
  };

  const mockPlayers = [
    {
      id: 1,
      gameId: 999,
      userId: user.id,
      status: 'joined' as const,
      joinedAt: new Date().toISOString(),
      rolledNumber: null,
      isWinner: false,
      winShare: null,
      user: {
        username: user.username,
        avatarInitials: user.avatarInitials || 'AD'
      }
    },
    {
      id: 2,
      gameId: 999,
      userId: 100,
      status: 'joined' as const,
      joinedAt: new Date().toISOString(),
      rolledNumber: null,
      isWinner: false,
      winShare: null,
      user: {
        username: 'TestPlayer1',
        avatarInitials: 'TP'
      }
    },
    {
      id: 3,
      gameId: 999,
      userId: 101,
      status: 'joined' as const,
      joinedAt: new Date().toISOString(),
      rolledNumber: null,
      isWinner: false,
      winShare: null,
      user: {
        username: 'TestPlayer2',
        avatarInitials: 'T2'
      }
    }
  ];

  // Check if voice chat should be enabled
  const isVoiceChatEnabled = testStake >= 20000;
  const isPremiumUI = testStake >= 50000;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Voice Chat Test</h1>
          <p className="text-muted-foreground">Test premium voice chat functionality with different stakes</p>
        </div>
      </div>

      {/* Agora Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Agora Configuration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {import.meta.env.VITE_AGORA_APP_ID ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700">Agora App ID configured</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">Agora App ID missing</span>
              </>
            )}
          </div>
          
          {import.meta.env.VITE_AGORA_APP_ID && (
            <div className="text-sm text-muted-foreground">
              App ID: {(import.meta.env.VITE_AGORA_APP_ID as string).substring(0, 8)}...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Adjust the stake amount to test different voice chat behaviors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stake">Test Stake (₦)</Label>
              <Input
                id="stake"
                type="number"
                value={testStake}
                onChange={(e) => setTestStake(Number(e.target.value))}
                min={1000}
                max={100000}
                step={1000}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quick Amounts</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setTestStake(10000)}>
                  ₦10K
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTestStake(25000)}>
                  ₦25K
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTestStake(75000)}>
                  ₦75K
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="space-y-1">
                <Badge variant={isVoiceChatEnabled ? "default" : "secondary"} className="block w-fit">
                  <Mic className="h-3 w-3 mr-1" />
                  Voice Chat: {isVoiceChatEnabled ? "Enabled" : "Disabled"}
                </Badge>
                {isPremiumUI && (
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 block w-fit">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium UI
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-slate-50">
            <h3 className="text-sm font-medium mb-2">Voice Chat Rules</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Voice chat disabled: Stakes under ₦20,000</li>
              <li>• Voice chat enabled: Stakes ₦20,000 and above</li>
              <li>• Premium UI: Stakes ₦50,000 and above</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Voice Chat Component Test */}
      <Card>
        <CardHeader>
          <CardTitle>Live Voice Chat Test</CardTitle>
          <CardDescription>
            This tests the actual voice chat component with current stake: ₦{testStake.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceChat
            game={mockGame}
            players={mockPlayers}
            currentUserId={user.id}
          />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. Set the stake to ₦25,000 or higher to enable voice chat</p>
          <p>2. Set the stake to ₦75,000 or higher to see premium UI</p>
          <p>3. Click "Join Voice Chat" to test Agora connection</p>
          <p>4. Multiple browser tabs can simulate different players</p>
        </CardContent>
      </Card>
    </div>
  );
}
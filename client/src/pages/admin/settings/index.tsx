import { useAdmin } from "@/hooks/use-admin";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Save, RefreshCw, Trophy, Gift, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function AdminSettings() {
  const { isAdmin, isLoading } = useAdmin();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "We're currently performing scheduled maintenance. Please check back soon."
  );
  
  // Game Settings State
  const [allowNewGames, setAllowNewGames] = useState(true);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(true);
  
  // Monthly Lottery State
  const [lotteryEnabled, setLotteryEnabled] = useState(false);
  const [lotteryMultiplier, setLotteryMultiplier] = useState("2x");
  const [lastLotteryDate, setLastLotteryDate] = useState<string | null>(null);
  const [canActivateLottery, setCanActivateLottery] = useState(true);
  
  // Redirect if not admin
  if (!isAdmin && !isLoading) {
    navigate("/admin");
    return null;
  }
  
  // Fetch the current maintenance status
  const fetchMaintenanceStatus = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/maintenance");
      const data = await response.json();
      setMaintenanceMode(data.enabled);
      if (data.message) {
        setMaintenanceMessage(data.message);
      }
    } catch (error) {
      console.error("Failed to fetch maintenance status", error);
    }
  };

  // Fetch game settings
  const fetchGameSettings = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/game-settings");
      const data = await response.json();
      setAllowNewGames(data.allowNewGames ?? true);
      setVoiceChatEnabled(data.voiceChatEnabled ?? true);
    } catch (error) {
      console.error("Failed to fetch game settings", error);
    }
  };
  
  // Fetch lottery status
  const fetchLotteryStatus = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/lottery/status");
      const data = await response.json();
      setLotteryEnabled(data.enabled);
      setLotteryMultiplier(data.multiplier || "2x");
      setLastLotteryDate(data.lastActivated);
      setCanActivateLottery(data.canActivate);
    } catch (error) {
      console.error("Failed to fetch lottery status", error);
    }
  };

  // Fetch maintenance status on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchMaintenanceStatus();
      fetchLotteryStatus();
    }
  }, [isAdmin]);
  
  // Update maintenance mode
  const toggleMaintenanceMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest("POST", "/api/admin/maintenance", {
          enabled: !maintenanceMode,
          message: maintenanceMessage
        });
        
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Maintenance toggle error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setMaintenanceMode(data.enabled);
      toast({
        title: data.enabled ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        description: data.enabled 
          ? "The system is now in maintenance mode. Only admins can access the site." 
          : "The system is now accessible to all users.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/maintenance"] });
    },
    onError: (error: any) => {
      console.error('Toggle maintenance error details:', error);
      toast({
        title: "Failed to update maintenance mode",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  // Monthly Lottery Mutations
  const activateLotteryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/lottery/activate", {
        multiplier: lotteryMultiplier
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setLotteryEnabled(true);
      setLastLotteryDate(data.activatedAt);
      setCanActivateLottery(false);
      toast({
        title: "Monthly Lottery Activated!",
        description: `${lotteryMultiplier} multiplier is now active for all single player games this month.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lottery"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to activate lottery",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  const deactivateLotteryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/lottery/deactivate");
      return await response.json();
    },
    onSuccess: () => {
      setLotteryEnabled(false);
      toast({
        title: "Monthly Lottery Deactivated",
        description: "Multiplayer games will now use normal payout rates.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lottery"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to deactivate lottery",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  // Game Settings Mutation
  const saveGameSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/game-settings", {
        allowNewGames,
        voiceChatEnabled
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Game settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="lottery">Monthly Lottery</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Site Name</Label>
                    <Input id="site-name" defaultValue="Big Boys Game" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input id="support-email" type="email" defaultValue="support@bigboysgame.com" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Game Settings</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-new-games">Allow New Games</Label>
                      <p className="text-sm text-muted-foreground">
                        Users can create new games when enabled
                      </p>
                    </div>
                    <Switch 
                      id="allow-new-games" 
                      checked={allowNewGames}
                      onCheckedChange={setAllowNewGames}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice-chat">Enable Voice Chat</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow voice chat in premium games
                      </p>
                    </div>
                    <Switch 
                      id="voice-chat" 
                      checked={voiceChatEnabled}
                      onCheckedChange={setVoiceChatEnabled}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setAllowNewGames(true);
                    setVoiceChatEnabled(true);
                  }}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button 
                    onClick={() => saveGameSettingsMutation.mutate()}
                    disabled={saveGameSettingsMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saveGameSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lottery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Monthly Lottery Management
              </CardTitle>
              <CardDescription>
                Control special multipliers for single player games (once per month)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Status */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Gift className="h-6 w-6 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold">Lottery Status</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lotteryEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {lotteryEnabled ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Current Multiplier</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {lotteryEnabled ? lotteryMultiplier : 'None'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Last Activated</p>
                    <p className="text-sm font-medium">
                      {lastLotteryDate 
                        ? new Date(lastLotteryDate).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Can Activate</p>
                    <p className="text-sm font-medium">
                      {canActivateLottery ? 'Yes' : 'Wait until next month'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lottery Controls */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="multiplier-select">Multiplier Amount</Label>
                    <div className="mt-2">
                      <select
                        id="multiplier-select"
                        value={lotteryMultiplier}
                        onChange={(e) => setLotteryMultiplier(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={lotteryEnabled}
                      >
                        <option value="2x">2x Multiplier</option>
                        <option value="3x">3x Multiplier</option>
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose the multiplier that will apply to all single player games
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => activateLotteryMutation.mutate()}
                    disabled={!canActivateLottery || lotteryEnabled || activateLotteryMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    {activateLotteryMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-4 w-4" />
                        Activate Monthly Lottery
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => deactivateLotteryMutation.mutate()}
                    disabled={!lotteryEnabled || deactivateLotteryMutation.isPending}
                    variant="outline"
                    size="lg"
                  >
                    {deactivateLotteryMutation.isPending ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Deactivate Lottery
                      </>
                    )}
                  </Button>
                </div>

                {/* Information Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">How Monthly Lottery Works:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Can only be activated once per calendar month</li>
                    <li>• Applies {lotteryMultiplier} multiplier to ALL single player games</li>
                    <li>• Does not affect multiplayer games (only for individual players)</li>
                    <li>• Players will see lottery notifications during active period</li>
                    <li>• Automatically resets permission at start of new month</li>
                  </ul>
                </div>

                {!canActivateLottery && !lotteryEnabled && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800">
                      <strong>Monthly limit reached:</strong> You have already used the monthly lottery feature this month. 
                      You can activate it again starting next month.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and access control settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch id="two-factor" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out inactive admin users
                    </p>
                  </div>
                  <Switch id="session-timeout" defaultChecked />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button>Save Security Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email alerts for important events
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="withdrawal-alerts">Withdrawal Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when users request withdrawals
                    </p>
                  </div>
                  <Switch id="withdrawal-alerts" defaultChecked />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button>Save Notification Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>
                Control system maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Put the system in maintenance mode
                    </p>
                  </div>
                  <Switch 
                    id="maintenance-mode" 
                    checked={maintenanceMode}
                    onCheckedChange={() => toggleMaintenanceMutation.mutate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Input 
                    id="maintenance-message" 
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    variant={maintenanceMode ? "outline" : "destructive"}
                    onClick={() => toggleMaintenanceMutation.mutate()}
                    disabled={toggleMaintenanceMutation.isPending}
                  >
                    {toggleMaintenanceMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Processing...
                      </>
                    ) : maintenanceMode ? (
                      "Disable Maintenance Mode"
                    ) : (
                      "Enable Maintenance Mode"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
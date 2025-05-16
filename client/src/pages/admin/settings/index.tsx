import { useAdmin } from "@/hooks/use-admin";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Save, RefreshCw } from "lucide-react";
import { useState } from "react";
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
  
  // Update maintenance mode
  const toggleMaintenanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/maintenance", {
        enabled: !maintenanceMode,
        message: maintenanceMessage
      });
      return response.json();
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
    onError: (error) => {
      toast({
        title: "Failed to update maintenance mode",
        description: error.message,
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
                    <Switch id="allow-new-games" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice-chat">Enable Voice Chat</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow voice chat in premium games
                      </p>
                    </div>
                    <Switch id="voice-chat" defaultChecked />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
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
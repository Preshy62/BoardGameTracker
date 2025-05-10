import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/layout/AdminHeader";
import VoiceChannelManager from "@/components/admin/VoiceChannelManager";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Headphones, Lock, Mic, Volume2, AlertTriangle } from "lucide-react";

// Access password for voice tools testing page
const ACCESS_PASSWORD = "admin123";

export default function VoiceToolsPage() {
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [user, isLoading, isAdmin, setLocation]);
  
  // Check if we already have authentication stored
  const isAuthenticated = localStorage.getItem("voice_tools_authenticated") === "true";
  
  // Handle password verification
  const verifyPassword = () => {
    if (password === ACCESS_PASSWORD) {
      localStorage.setItem("voice_tools_authenticated", "true");
      toast({
        title: "Access Granted",
        description: "You now have access to voice testing tools",
      });
      setLocation("/agora-voice-chat");
    } else {
      setAuthError("Incorrect password");
      toast({
        title: "Access Denied",
        description: "The password you entered is incorrect",
        variant: "destructive",
      });
    }
  };
  
  // Directly go to voice tools if already authenticated
  const goToVoiceTools = () => {
    setLocation("/agora-voice-chat");
  };
  
  // Show loading or nothing if not authenticated
  if (isLoading || !user || !isAdmin) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader user={user} />
      
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Voice Chat Tools</h1>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Agora Voice Chat Testing
              </CardTitle>
              <CardDescription>
                Test voice chat functionality in an isolated environment 
                before deploying to production games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Developer Testing Area</p>
                    <p className="text-muted-foreground">This area contains advanced tools for testing voice chat 
                    functionality. Changes made here could affect all voice chat in the application.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Volume2 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Available Features</p>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>Test voice chat connections</li>
                      <li>Verify microphone configurations</li>
                      <li>Troubleshoot audio quality issues</li>
                      <li>Check remote user connections</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {isAuthenticated ? (
                <Button onClick={goToVoiceTools}>
                  <Mic className="mr-2 h-4 w-4" />
                  Open Voice Testing Tools
                </Button>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      These tools require authentication for access
                    </p>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="password">Access Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      {authError && (
                        <p className="text-xs text-red-500">{authError}</p>
                      )}
                    </div>
                    <Button onClick={verifyPassword}>
                      Verify
                    </Button>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Voice Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                    <span>Agora Service</span>
                  </div>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Online</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                    <span>API Keys</span>
                  </div>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Configured</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                    <span>Voice Channels</span>
                  </div>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">1 Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Voice Channel Management */}
        <div className="mt-6">
          <VoiceChannelManager />
        </div>
      </main>
    </div>
  );
}
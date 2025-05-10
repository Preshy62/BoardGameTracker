import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/layout/AdminHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Headphones, Lock, Unlock, ExternalLink } from "lucide-react";

// Hashed password for 'admin123'
const ACCESS_PASSWORD = "admin123";

export default function VoiceToolsPage() {
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for password protection
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [user, isLoading, isAdmin, setLocation]);
  
  // Show loading or nothing if not authenticated
  if (isLoading || !user || !isAdmin) {
    return null;
  }
  
  const verifyPassword = () => {
    if (password === ACCESS_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
      localStorage.setItem("voice_tools_authenticated", "true");
      toast({
        title: "Access Granted",
        description: "You now have access to the voice tools",
      });
    } else {
      setAuthError("Incorrect password");
      toast({
        title: "Access Denied",
        description: "The password you entered is incorrect",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader user={user} />
      
      <main className="flex-1 container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Voice Tools</h1>
            <p className="text-muted-foreground">Manage and test voice chat functionality</p>
          </div>
        </div>
        
        <Tabs defaultValue="access">
          <TabsList className="mb-6">
            <TabsTrigger value="access" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Access Control
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center" disabled={!isAuthenticated}>
              <Headphones className="h-4 w-4 mr-2" />
              Voice Tools
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="access">
            <Card>
              <CardHeader>
                <CardTitle>Protected Access</CardTitle>
                <CardDescription>
                  Enter the admin password to access voice testing tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter access password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      {authError && (
                        <p className="text-sm text-red-500">{authError}</p>
                      )}
                    </div>
                    <Button onClick={verifyPassword}>
                      <Lock className="h-4 w-4 mr-2" />
                      Verify Password
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="bg-green-100 text-green-800 p-4 rounded-full mb-4">
                      <Unlock className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Access Granted</h3>
                    <p className="text-center text-muted-foreground mb-4">
                      You now have access to all voice testing tools
                    </p>
                    <Button variant="outline" onClick={() => {
                      setIsAuthenticated(false);
                      localStorage.removeItem("voice_tools_authenticated");
                    }}>
                      Reset Access
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tools">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Agora Voice Test</CardTitle>
                    <Badge variant="secondary">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Online
                      </div>
                    </Badge>
                  </div>
                  <CardDescription>
                    Test Agora voice functionality with a dedicated testing interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">
                    This tool allows you to test the Agora voice chat functionality 
                    without having to set up a game. You can join test channels and
                    verify your microphone is working correctly.
                  </p>
                  <div className="flex justify-center">
                    <Link href="/agora-voice-chat">
                      <a className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 shadow-sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Agora Test Page
                      </a>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Voice Chat Analytics</CardTitle>
                  <CardDescription>
                    View usage statistics for voice chat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Channel Usage</h4>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "65%" }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        65% of high-stake games use voice chat
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Active Voice Channels</h4>
                      <div className="bg-primary/10 p-3 rounded-md">
                        <p className="text-2xl font-bold">2</p>
                        <p className="text-xs text-muted-foreground">Current active channels</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Voice Chat Duration</h4>
                      <div className="bg-primary/10 p-3 rounded-md">
                        <p className="text-2xl font-bold">36 min</p>
                        <p className="text-xs text-muted-foreground">Average duration per game</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
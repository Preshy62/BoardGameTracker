import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Login from "./auth/login";
import Register from "./auth/register";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const isDemo = searchParams.get('demo') === 'true';
  const isVerified = searchParams.get('verified') === 'true';
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  
  // Show notification when email is verified
  useEffect(() => {
    if (isVerified) {
      toast({
        title: "Email verified successfully",
        description: "Your account is now active. You can log in with your credentials.",
        variant: "default",
      });
    }
  }, [isVerified, toast]);
  
  // If in demo mode, automatically log in with demo account
  useEffect(() => {
    if (isDemo && !user && !loginMutation.isPending) {
      loginMutation.mutate({
        username: "demo",
        password: "demo123"
      }, {
        onSuccess: async (userData) => {
          toast({
            title: "Demo Account Created",
            description: "You're now logged in with a demo account with ₦200,000 balance",
          });
          
          // Automatically create a game with a bot
          try {
            const response = await apiRequest('POST', '/api/games', {
              maxPlayers: 2,
              stake: 5000,
              playWithBot: true,
              commissionPercentage: 5
            });
            
            if (response.ok) {
              const game = await response.json();
              // Redirect to the new game
              setLocation(`/game/${game.id}`);
            } else {
              // If failed to create game, go to home
              setLocation('/home');
            }
          } catch (err) {
            console.error('Error creating demo game:', err);
            // Go to home page if there's an error
            setLocation('/home');
          }
        },
        onError: (error) => {
          console.error('Demo login error:', error);
          toast({
            title: "Demo Error",
            description: "Couldn't create a demo account. Please try again.",
            variant: "destructive"
          });
        }
      });
    }
  }, [isDemo, user, loginMutation, setLocation, toast]);
  
  // If user is already logged in, redirect to home
  if (user) {
    return <Redirect to="/home" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section - Left on mobile, Right on desktop */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 flex flex-col justify-center items-center text-center md:text-left">
        <div className="max-w-md mx-auto md:mx-0 md:ml-auto">
          <h1 className="text-4xl font-bold text-white mb-6">
            Welcome to <span className="text-blue-400">Big Boys Game</span>
          </h1>
          <p className="text-white/90 text-lg mb-8">
            The sophisticated multiplayer gaming platform with enhanced bot game mechanics and real-time interactive gameplay.
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Gaming Excellence</h2>
            <ul className="text-white/90 space-y-3">
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">✓</span> 
                Enhanced AI bot opponents
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">✓</span> 
                Real-time multiplayer gaming
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">✓</span> 
                Strategic complexity and depth
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-blue-400">✓</span> 
                WebSocket-based communication
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Auth Forms - Right on mobile, Left on desktop */}
      <div className="w-full md:w-1/2 bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Tabs 
            defaultValue={activeTab} 
            className="w-full" 
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Login isDemo={isDemo} />
            </TabsContent>
            <TabsContent value="register">
              <Register />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Login from "./auth/login";
import Register from "./auth/register";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const isDemo = searchParams.get('demo') === 'true';
  const { toast } = useToast();
  
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
              setLocation('/');
            }
          } catch (err) {
            console.error('Error creating demo game:', err);
            // Go to home page if there's an error
            setLocation('/');
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
  
  // Redirect if already logged in
  if (user) {
    // Don't redirect in demo mode as we're handling that separately
    if (!isDemo) {
      setLocation("/");
      return null;
    }
    return null; // Return null while we create the game automatically
  }
  
  return <Login isDemo={isDemo} />;
}

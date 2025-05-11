import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import CreateGame from "@/pages/create-game";
import GamePage from "@/pages/game";
import Dashboard from "@/pages/dashboard";
import DemoNewPage from "@/pages/demo-new";
import LandingPage from "@/pages/landing-page";
import WalletPage from "@/pages/wallet-page";
import Checkout from "@/pages/checkout";
import VoiceChatTest from "@/pages/voice-chat-test";
import VoiceRecorderTest from "@/pages/voice-recorder-test";
import SimpleVoiceChat from "@/pages/simple-voice-chat";
import SoundTest from "@/pages/sound-test";
import AgoraVoiceChat from "@/pages/agora-voice-chat";
import AdminDashboard from "@/pages/admin/index";
import AdminVoiceTools from "@/pages/admin/voice-tools";
import VerifyEmail from "@/pages/auth/verify-email";
import ResetPassword from "@/pages/auth/reset-password";
import { useEffect } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AuthProvider, { useAuth } from "./hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function HomeOrLanding() {
  const { user } = useAuth();
  return user ? <Home /> : <LandingPage />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/landing" component={LandingPage} />
      <Route path="/" component={HomeOrLanding} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email/:token" component={VerifyEmail} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/demo-new" component={DemoNewPage} />
      <Route path="/voice-chat-test" component={VoiceChatTest} />
      <Route path="/voice-recorder-test" component={VoiceRecorderTest} />
      <Route path="/simple-voice-chat" component={SimpleVoiceChat} />
      <Route path="/sound-test" component={SoundTest} />
      <Route path="/agora-voice-chat" component={AgoraVoiceChat} />
      
      {/* Protected routes - require login */}
      <ProtectedRoute path="/home" component={Home} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/create-game" component={CreateGame} />
      <ProtectedRoute path="/game/:id" component={GamePage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/checkout/:amount" component={Checkout} />
      
      {/* Admin routes - hidden from regular navigation */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/voice-tools" component={AdminVoiceTools} />
      
      {/* Legacy routes - disabled */}
      
      {/* 404 route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Add error logging to help debug session issues
  console.log('App rendering, checking if cookies are enabled:', navigator.cookieEnabled);
  
  // Initialize audio context early to ensure sound effects work
  useEffect(() => {
    // Initialize audio context as early as possible for better compatibility
    const initAudio = async () => {
      try {
        // Dynamically import to avoid circular dependencies
        const { initAudioContext } = await import('@/lib/sounds');
        const initialized = initAudioContext();
        console.log('Audio context initialized early in App:', initialized);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };
    
    initAudio();
    
    // Set up user interaction listeners to initialize audio if needed
    const handleUserInteraction = async () => {
      // Re-initialize on user interaction (important for iOS/Safari)
      initAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

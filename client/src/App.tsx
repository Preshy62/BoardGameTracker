import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Game from "@/pages/game";
// Legacy auth components removed
import AuthPage from "@/pages/auth-page";
import Wallet from "@/pages/wallet";
import Checkout from "@/pages/checkout";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import DemoPage from "@/pages/demo-new";
import { useEffect } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AuthProvider from "./hooks/use-auth";
import { ProtectedRoute, AdminRoute, PublicDemoRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      {/* Redirect legacy auth routes to new consolidated auth page */}
      <Route path="/login">
        {() => <Redirect to="/auth" />}
      </Route>
      <Route path="/register">
        {() => <Redirect to="/auth" />}
      </Route>
      <ProtectedRoute path="/game/:id" component={({ params }) => <Game id={params.id} />} />
      <ProtectedRoute path="/wallet" component={Wallet} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <AdminRoute path="/admin" component={Admin} />
      <ProtectedRoute path="/checkout/:amount" component={({ params }) => <Checkout amount={params.amount} />} />
      <PublicDemoRoute path="/demo" component={DemoPage} />
      <PublicDemoRoute path="/demo-new" component={DemoPage} />
      <ProtectedRoute path="/" component={Home} />
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

import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import DemoPage from "@/pages/demo-new";
import { useEffect } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AuthProvider from "./hooks/use-auth";
import { ProtectedRoute, PublicDemoRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <PublicDemoRoute path="/demo-new" component={DemoPage} />
      
      {/* Protected routes - require login */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/game/:id" component={Home} />
      
      {/* Redirects for legacy routes */}
      <Route path="/demo">
        {() => <Redirect to="/demo-new" />}
      </Route>
      <Route path="/simple-demo">
        {() => <Redirect to="/demo-new" />}
      </Route>
      <Route path="/ball-demo">
        {() => <Redirect to="/demo-new" />}
      </Route>
      
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

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
import SettingsPage from "@/pages/settings-page";
import VoiceChatTest from "@/pages/voice-chat-test";
import VoiceRecorderTest from "@/pages/voice-recorder-test";
import SimpleVoiceChat from "@/pages/simple-voice-chat";
import SoundTest from "@/pages/sound-test";
import AgoraVoiceChat from "@/pages/agora-voice-chat";
import VoiceTest from "@/pages/voice-test";
import BoardTest from "@/pages/board-test";
import TestPaystack from "@/pages/test-paystack";
import AdminDashboard from "@/pages/admin/index";
import AdminUsers from "@/pages/admin/users/index";
import AdminUserDetail from "@/pages/admin/users/[id]";
import AdminVoiceTools from "@/pages/admin/voice-tools";
import AdminTransactions from "@/pages/admin/transactions/index";
import AdminTransactionDetail from "@/pages/admin/transactions/[id]";
import AdminSettings from "@/pages/admin/settings/index";
import AdminGames from "@/pages/admin/games/index";
import BotGamePage from "@/pages/bot-game";
import SingleBotGamePage from "@/pages/single-bot-game";
import DebugTransaction from "@/pages/admin/debug-transaction";
import { AdminLayout } from "@/layouts/AdminLayout";
import VerifyEmail from "@/pages/auth/verify-email";
import ResetPassword from "@/pages/auth/reset-password";
import AboutPage from "@/pages/about";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import ContactPage from "@/pages/contact";
import ResponsibleGamingPage from "@/pages/responsible-gaming";
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
      <Route path="/about" component={AboutPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/responsible-gaming" component={ResponsibleGamingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email/:token" component={VerifyEmail} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/demo-new" component={DemoNewPage} />
      <Route path="/voice-chat-test" component={VoiceChatTest} />
      <Route path="/voice-recorder-test" component={VoiceRecorderTest} />
      <Route path="/simple-voice-chat" component={SimpleVoiceChat} />
      <Route path="/sound-test" component={SoundTest} />
      <Route path="/agora-voice-chat" component={AgoraVoiceChat} />
      <Route path="/voice-test" component={VoiceTest} />
      <Route path="/board-test" component={BoardTest} />
      <Route path="/test-paystack" component={TestPaystack} />
      
      {/* Protected routes - require login */}
      <ProtectedRoute path="/home" component={Home} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/create-game" component={CreateGame} />
      <ProtectedRoute path="/game/:id" component={GamePage} />
      <ProtectedRoute path="/bot-game/:id" component={BotGamePage} />
      <ProtectedRoute path="/single-bot-game/:id" component={SingleBotGamePage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/checkout/:amount" component={Checkout} />
      
      {/* Admin routes - with individual wrappers */}
      <Route path="/admin">
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout>
          <AdminUsers />
        </AdminLayout>
      </Route>
      <Route path="/admin/users/:id">
        {params => (
          <AdminLayout>
            <AdminUserDetail id={params.id} />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/voice-tools">
        <AdminLayout>
          <AdminVoiceTools />
        </AdminLayout>
      </Route>
      <Route path="/admin/transactions">
        <AdminLayout>
          <AdminTransactions />
        </AdminLayout>
      </Route>
      <Route path="/admin/transactions/:id">
        {params => (
          <AdminLayout>
            <AdminTransactionDetail id={params.id} />
          </AdminLayout>
        )}
      </Route>
      <Route path="/admin/games">
        <AdminLayout>
          <AdminGames />
        </AdminLayout>
      </Route>
      <Route path="/admin/settings">
        <AdminLayout>
          <AdminSettings />
        </AdminLayout>
      </Route>
      <Route path="/admin/debug-transaction">
        <AdminLayout>
          <DebugTransaction />
        </AdminLayout>
      </Route>
      
      {/* Legacy routes - disabled */}
      
      {/* 404 route - only for non-admin paths */}
      <Route path="/:rest*" component={NotFound} />
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

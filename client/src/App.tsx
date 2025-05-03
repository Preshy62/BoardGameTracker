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

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AuthProvider from "./hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";

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
      <ProtectedRoute path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Add error logging to help debug session issues
  console.log('App rendering, checking if cookies are enabled:', navigator.cookieEnabled);
  
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

import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Game from "@/pages/game";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Wallet from "@/pages/wallet";
import Checkout from "@/pages/checkout";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import AuthProvider from "@/hooks/use-auth";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
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

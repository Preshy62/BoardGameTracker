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
import { useState, useEffect } from "react";
import { User } from "@shared/schema";

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Not authenticated');
      })
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Home /> : <Login />}
      </Route>
      <Route path="/register">
        {user ? <Home /> : <Register />}
      </Route>
      <Route path="/game/:id">
        {params => (user ? <Game id={params.id} /> : <Login />)}
      </Route>
      <Route path="/wallet">
        {user ? <Wallet /> : <Login />}
      </Route>
      <Route path="/dashboard">
        {user ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/admin">
        {user?.isAdmin ? <Admin /> : (user ? <Dashboard /> : <Login />)}
      </Route>
      <Route path="/checkout/:amount">
        {params => (user ? <Checkout amount={params.amount} /> : <Login />)}
      </Route>
      <Route path="/">
        {user ? <Home /> : <Login />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;

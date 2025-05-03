import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Login from "./auth/login";
import Register from "./auth/register";

export default function AuthPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Redirect if already logged in
  if (user) {
    setLocation("/");
    return null;
  }
  
  return <Login />;
}

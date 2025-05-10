import { useAuth } from "@/hooks/use-auth";

// List of admin usernames
const ADMIN_USERNAMES = ["admin", "precious"];

export function useAdmin() {
  const { user } = useAuth();
  
  // Check if the current user is an admin
  const isAdmin = user ? ADMIN_USERNAMES.includes(user.username) : false;
  
  return {
    isAdmin
  };
}
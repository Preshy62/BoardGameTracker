import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// List of admin usernames - fallback only
const ADMIN_USERNAMES = ["admin", "precious"];

export function useAdmin() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use React Query to check admin status from server
  const { data, isError } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      if (!user) return { isAdmin: false };
      
      try {
        const response = await apiRequest("GET", "/api/admin/check");
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error checking admin status:", error);
        // Fallback to client-side check if API fails
        return { 
          isAdmin: ADMIN_USERNAMES.includes(user.username),
          fromFallback: true
        };
      }
    },
    enabled: !!user, // Only run query if user is logged in
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
  
  // Determine admin status - use server response if available, otherwise fallback
  const isAdmin = data?.isAdmin || false;
  
  return {
    isAdmin,
    isLoading: isLoading && !isError,
    isError
  };
}
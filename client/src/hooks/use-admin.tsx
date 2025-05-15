import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

/**
 * Custom hook to check if the current user has admin privileges
 * This hook helps protect admin routes and conditionally render admin-only UI elements
 */
export function useAdmin() {
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery<{ isAdmin: boolean, username: string }>({
    queryKey: ["/api/admin/check"],
    queryFn: getQueryFn({ on401: "returnUndefined" }),
    staleTime: 60 * 1000, // Cache for 1 minute
    retry: false, // Don't retry if it fails - likely means user doesn't have admin access
  });
  
  // Default to non-admin if data is undefined or error occurred
  const isAdmin = data?.isAdmin ?? false;
  const username = data?.username;
  
  return { 
    isAdmin,
    username,
    isLoading,
    error
  };
}
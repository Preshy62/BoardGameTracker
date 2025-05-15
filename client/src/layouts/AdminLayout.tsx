import { useEffect } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdmin } from "@/hooks/use-admin";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, isLoading } = useAdmin();
  const [, setLocation] = useLocation();
  
  // Redirect non-admin users to home
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/");
    }
  }, [isAdmin, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Checking admin permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // Will be redirected by the useEffect
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
}
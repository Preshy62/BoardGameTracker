import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AllTransactions } from "@/components/admin/AllTransactions";
import { PendingWithdrawals } from "@/components/admin/PendingWithdrawals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function AdminTransactionsPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [, setLocation] = useLocation();
  
  // Redirect if not admin
  useEffect(() => {
    if (!isUserLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [user, isUserLoading, isAdmin, setLocation]);
  
  // Show loading or nothing if not authenticated
  if (isUserLoading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader user={user} />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Transactions Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all transactions and payment processing
          </p>
        </div>
        
        <div className="space-y-8">
          <PendingWithdrawals />
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <AllTransactions />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
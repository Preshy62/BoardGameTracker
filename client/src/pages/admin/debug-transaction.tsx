import { useEffect } from "react";
import { useLocation } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugTransactionPage() {
  const [location, navigate] = useLocation();

  const handleGoToTransaction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = formData.get('transactionId') as string;
    
    if (id && !isNaN(parseInt(id))) {
      console.log(`Debug: Navigating to transaction ID ${id}`);
      navigate(`/admin/transactions/${id}`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Debug Transaction Navigation</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Navigate to Transaction</CardTitle>
            <CardDescription>
              Enter a transaction ID to navigate to its detail page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGoToTransaction} className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <label htmlFor="transactionId" className="text-sm font-medium">
                  Transaction ID
                </label>
                <Input 
                  id="transactionId"
                  name="transactionId" 
                  type="number" 
                  placeholder="Enter transaction ID"
                  min="1"
                />
              </div>
              <Button type="submit">Go to Transaction</Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Test navigation to known transaction IDs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 10, 13, 20].map(id => (
                <Button 
                  key={id} 
                  variant="outline"
                  onClick={() => {
                    console.log(`Debug: Navigating to transaction ID ${id}`);
                    navigate(`/admin/transactions/${id}`);
                  }}
                >
                  Transaction #{id}
                </Button>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/transactions')}
                className="w-full"
              >
                Back to Transactions List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
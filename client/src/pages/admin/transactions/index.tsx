import { AdminLayout } from "@/layouts/AdminLayout";
import { AllTransactions } from "@/components/admin/AllTransactions";
import { PendingWithdrawals } from "@/components/admin/PendingWithdrawals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminTransactionsPage() {
  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold mb-8">Transaction Management</h1>
      
      <PendingWithdrawals />
      
      <div className="mt-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <AllTransactions />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
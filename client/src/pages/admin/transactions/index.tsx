
import { AllTransactions } from "@/components/admin/AllTransactions";
import { PendingWithdrawals } from "@/components/admin/PendingWithdrawals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { Link } from "wouter";
import { ArrowRightIcon, Bug } from "lucide-react";

export default function AdminTransactionsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transaction Management</h1>
        
        <Link href="/admin/debug-transaction">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Transactions
            <ArrowRightIcon className="h-3 w-3" />
          </Button>
        </Link>
      </div>
      
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
    </div>
  );
}
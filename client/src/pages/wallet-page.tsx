import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { User, Transaction } from "@shared/schema";
import WalletBalance from "@/components/wallet/WalletBalance";
import FundManagement from "@/components/wallet/FundManagement";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import { Loader2, Wallet as WalletIcon, CreditCard, History } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function WalletPage() {
  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  // Calculate total earnings (deposits + winnings)
  const calculateTotalEarnings = () => {
    if (!transactions) return 0;
    
    return transactions
      .filter(t => t.status === 'completed' && (t.type === 'deposit' || t.type === 'winnings'))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <WalletIcon className="h-8 w-8 mr-3 text-primary" />
            <h1 className="text-3xl font-bold font-sans">Wallet Dashboard</h1>
          </div>
          <p className="text-gray-600">Manage your funds and track transactions for Big Boys Game</p>
        </div>
        
        {/* Balance cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <WalletBalance 
              user={user} 
              totalEarnings={calculateTotalEarnings()}
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-center flex-grow flex flex-col justify-center items-center">
              <CreditCard className="h-12 w-12 text-primary mb-2" />
              <h3 className="text-lg font-medium">Need quick funds?</h3>
              <p className="text-gray-500 text-sm mb-4">Use demo funds for testing or deposit real money</p>
              <div className="w-4/5 h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="bg-primary h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              <p className="text-xs text-gray-400">Instant deposits available</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 shadow-sm text-white flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Transaction Count</h3>
                <p className="text-2xl font-bold">{transactions?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fund Management */}
          <div className="lg:col-span-1">
            <FundManagement user={user} />
          </div>
          
          {/* Transaction History */}
          <div className="lg:col-span-2">
            <TransactionHistory 
              transactions={transactions} 
              isLoading={isTransactionsLoading} 
            />
          </div>
        </div>
        
        {/* Information Section */}
        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <WalletIcon className="h-5 w-5 mr-2 text-primary" />
            Wallet Information
          </h2>
          <Separator className="mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800">Deposits</h3>
              <p className="text-sm text-gray-600">
                Add funds to your wallet using our quick deposit option or through Stripe for secure card payments.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800">Withdrawals</h3>
              <p className="text-sm text-gray-600">
                Withdraw your winnings to your preferred bank account. Withdrawals are processed within 24 hours.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-800">Transaction History</h3>
              <p className="text-sm text-gray-600">
                Monitor your financial activity with detailed transaction records. Filter and search for specific transactions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
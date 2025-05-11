import { User } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Wallet as WalletIcon, TrendingUp, CreditCard, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface WalletBalanceProps {
  user: User;
  totalEarnings?: number;
  className?: string;
}

export default function WalletBalance({ user, totalEarnings = 0, className }: WalletBalanceProps) {
  const [hideBalance, setHideBalance] = useState(false);
  
  // Calculate progress for the progress bar (arbitrary goal of 100,000)
  const goalAmount = 100000;
  const progressPercentage = Math.min(Math.round((user.walletBalance / goalAmount) * 100), 100);
  
  return (
    <Card className={cn("overflow-hidden bg-gradient-to-br from-primary to-primary-light", className)}>
      <CardContent className="p-0">
        <div className="relative p-6 pb-8">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="30" stroke="white" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="15" stroke="white" strokeWidth="0.5" />
              <path d="M0 40H80" stroke="white" strokeWidth="0.5" />
              <path d="M40 0L40 80" stroke="white" strokeWidth="0.5" />
              <path d="M0 0L80 80" stroke="white" strokeWidth="0.5" />
              <path d="M80 0L0 80" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>
          
          {/* Content */}
          <div className="relative text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <WalletIcon className="h-6 w-6 mr-2" />
                <h2 className="text-lg font-medium">Wallet Balance</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setHideBalance(!hideBalance)}
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              >
                {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="mb-6">
              <div className="text-4xl font-bold">
                {hideBalance ? "••••••" : formatCurrency(user.walletBalance)}
              </div>
              <div className="text-white/60 text-sm mt-1">
                Available funds for games
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="flex items-center text-sm text-white/80 mb-1">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-300" />
                  <span>Total Earnings</span>
                </div>
                <div className="text-xl font-semibold">
                  {hideBalance ? "••••••" : formatCurrency(totalEarnings)}
                </div>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="flex items-center text-sm text-white/80 mb-1">
                  <CreditCard className="h-4 w-4 mr-1 text-blue-300" />
                  <span>Username</span>
                </div>
                <div className="text-xl font-semibold truncate">
                  {user.username}
                </div>
              </div>
            </div>
            
            <div className="text-sm mb-1 flex justify-between">
              <span>Balance Goal</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-white/20" />
          </div>
        </div>
        
        {/* Bottom gradient bar */}
        <div className="h-3 bg-gradient-to-r from-yellow-500 via-primary to-primary-light"></div>
      </CardContent>
    </Card>
  );
}
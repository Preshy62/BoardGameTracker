import { User } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Wallet as WalletIcon, TrendingUp, CreditCard, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface WalletBalanceProps {
  user: User;
  totalEarnings?: number;
  className?: string;
}

export default function WalletBalance({ user, totalEarnings = 0, className }: WalletBalanceProps) {
  // Initial state from localStorage or default to false (visible)
  const [hideBalance, setHideBalance] = useState(() => {
    const saved = localStorage.getItem('bbg-hide-balance');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Animation states
  const [showTransition, setShowTransition] = useState(false);
  const [isBlurred, setIsBlurred] = useState(hideBalance);
  
  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('bbg-hide-balance', JSON.stringify(hideBalance));
    
    // Add visual transition when changing state
    if (hideBalance !== isBlurred) {
      setShowTransition(true);
      const timer = setTimeout(() => {
        setIsBlurred(hideBalance);
        setShowTransition(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hideBalance]);
  
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
                <div>
                  <h2 className="text-lg font-medium">Wallet Balance</h2>
                  {hideBalance && (
                    <Badge variant="outline" className="text-[10px] py-0 mt-1 font-normal text-amber-100 border-amber-300/50 bg-amber-500/10">
                      <Lock className="h-2.5 w-2.5 mr-1" />
                      Hidden
                    </Badge>
                  )}
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setHideBalance(!hideBalance)}
                      className={`h-8 px-2 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300
                        ${hideBalance ? 'bg-white/5' : ''}`}
                    >
                      {hideBalance ? (
                        <><Eye className="h-3.5 w-3.5 mr-1.5" /> Show</>
                      ) : (
                        <><EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide</>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{hideBalance ? "Show your balance" : "Hide your balance"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="mb-6">
              <div className={`text-4xl font-bold relative overflow-hidden ${showTransition ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                {isBlurred ? (
                  <div className="flex items-center">
                    <div className="mr-2 bg-white/20 rounded-md px-3 py-1">•••••••</div>
                    <Lock className="h-5 w-5 text-amber-300/80" />
                  </div>
                ) : (
                  formatCurrency(user.walletBalance)
                )}
              </div>
              <div className="text-white/60 text-sm mt-1 flex items-center">
                Available funds for games
                {!hideBalance && user.walletBalance > 0 && (
                  <Badge variant="outline" className="ml-2 text-[10px] py-0 text-green-100 border-green-300/50 bg-green-500/10">
                    Ready to play
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <div className="flex items-center text-sm text-white/80 mb-1">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-300" />
                  <span>Total Earnings</span>
                </div>
                <div className={`text-xl font-semibold ${showTransition ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                  {isBlurred ? (
                    <div className="flex items-center">
                      <div className="bg-white/10 rounded px-2 py-0.5 text-sm">•••••</div>
                    </div>
                  ) : (
                    formatCurrency(totalEarnings)
                  )}
                </div>
              </div>
              
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm relative">
                <div className="flex items-center text-sm text-white/80 mb-1">
                  <CreditCard className="h-4 w-4 mr-1 text-blue-300" />
                  <span>Username</span>
                </div>
                <div className="text-xl font-semibold truncate flex items-center">
                  {user.username}
                  <Badge variant="default" className="ml-2 h-5 text-[9px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-400/20">
                    {user.id ? `ID: ${user.id}` : 'Player'}
                  </Badge>
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
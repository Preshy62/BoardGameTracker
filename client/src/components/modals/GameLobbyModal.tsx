import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, calculateCommission, calculateWinnings } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GameLobbyModalProps {
  open: boolean;
  onClose: () => void;
  onCreateGame: (playerCount: number, stake: number) => void;
}

const GameLobbyModal = ({ open, onClose, onCreateGame }: GameLobbyModalProps) => {
  const [playerCount, setPlayerCount] = useState(5);
  const [stake, setStake] = useState(1000);
  const [stakeInput, setStakeInput] = useState("1,000");
  const { toast } = useToast();

  // Calculate derived values
  const totalPool = playerCount * stake;
  const commissionRate = calculateCommission(stake);
  const commissionAmount = totalPool * commissionRate;
  const winnerAmount = calculateWinnings(totalPool, commissionRate);

  // Handle player count changes
  const handleDecrementPlayers = () => {
    if (playerCount > 2) {
      setPlayerCount(playerCount - 1);
    }
  };

  const handleIncrementPlayers = () => {
    if (playerCount < 10) {
      setPlayerCount(playerCount + 1);
    }
  };

  // Handle stake input changes
  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    
    if (value) {
      const numValue = parseInt(value, 10);
      setStake(numValue);
      setStakeInput(numValue.toLocaleString());
    } else {
      setStakeInput('');
      setStake(0);
    }
  };

  // Validate stake on blur
  const handleStakeBlur = () => {
    if (stake < 1000) {
      setStake(1000);
      setStakeInput("1,000");
      toast({
        title: "Invalid stake amount",
        description: "Minimum stake is ₦1,000",
        variant: "destructive"
      });
    }
  };

  // Handle game creation
  const handleCreateGame = () => {
    if (stake < 1000) {
      toast({
        title: "Invalid stake amount",
        description: "Minimum stake is ₦1,000",
        variant: "destructive"
      });
      return;
    }
    
    onCreateGame(playerCount, stake);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-sans font-bold">Create Game</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-6">
            <Label className="block text-gray-700 font-medium mb-2">Number of Players</Label>
            <div className="flex items-center">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleDecrementPlayers}
                className="rounded-l-md px-4 py-2"
              >
                -
              </Button>
              <div className="w-16 text-center border-t border-b border-gray-300 py-2">
                {playerCount}
              </div>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleIncrementPlayers}
                className="rounded-r-md px-4 py-2"
              >
                +
              </Button>
              <span className="ml-3 text-sm text-gray-500">(2-10 players)</span>
            </div>
          </div>
          
          <div className="mb-6">
            <Label className="block text-gray-700 font-medium mb-2">Stake Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5">₦</span>
              <Input 
                type="text" 
                className="pl-8 pr-3 py-2"
                value={stakeInput}
                onChange={handleStakeChange}
                onBlur={handleStakeBlur}
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">Minimum: ₦1,000</p>
          </div>
          
          <div className="mb-6">
            <Label className="block text-gray-700 font-medium mb-2">Game Summary</Label>
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex justify-between mb-2">
                <span>Players:</span>
                <span className="font-semibold">{playerCount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Stake per player:</span>
                <span className="font-semibold">{formatCurrency(stake)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Total pool:</span>
                <span className="font-semibold">{formatCurrency(totalPool)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Platform fee:</span>
                <span className="font-semibold">
                  {(commissionRate * 100)}% ({formatCurrency(commissionAmount)})
                </span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-gray-300">
                <span>Winner gets:</span>
                <span className="text-success font-bold">{formatCurrency(winnerAmount)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
              onClick={handleCreateGame}
            >
              Find Players
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameLobbyModal;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, calculateCommission, calculateWinnings } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Volume2, VolumeX } from "lucide-react";

interface GameLobbyModalProps {
  open: boolean;
  onClose: () => void;
  onCreateGame: (playerCount: number, stake: number, playWithBot?: boolean, voiceChatEnabled?: boolean) => void;
  initialSinglePlayer?: boolean;
}

// Predefined stake options for quick selection
const stakeOptions = [
  { label: 'Standard: ₦1,000', value: 1000 },
  { label: 'Medium: ₦10,000', value: 10000 },
  { label: 'High: ₦50,000', value: 50000 },
  { label: 'Premium: ₦100,000', value: 100000 },
  { label: 'VIP: ₦250,000', value: 250000 },
  { label: 'Custom Value', value: 'custom' }
];

const GameLobbyModal = ({ open, onClose, onCreateGame, initialSinglePlayer = false }: GameLobbyModalProps) => {
  const [playerCount, setPlayerCount] = useState(5);
  const [stake, setStake] = useState(1000);
  const [stakeInput, setStakeInput] = useState("1,000");
  const [singlePlayer, setSinglePlayer] = useState(initialSinglePlayer);
  const [stakeOption, setStakeOption] = useState<string | number>(1000);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(true);
  
  // Update singlePlayer state when initialSinglePlayer prop changes
  useEffect(() => {
    setSinglePlayer(initialSinglePlayer);
  }, [initialSinglePlayer]);
  const { toast } = useToast();

  // Calculate derived values
  const effectivePlayerCount = singlePlayer ? 2 : playerCount; // For single player, we use 2 (player + bot)
  const totalPool = effectivePlayerCount * stake;
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

  // Handle stake option selection
  const handleStakeOptionChange = (value: string) => {
    setStakeOption(value);
    
    // If a predefined value is selected, update the stake
    if (value !== 'custom') {
      const numValue = parseInt(value, 10);
      setStake(numValue);
      setStakeInput(numValue.toLocaleString());
    }
  };

  // Handle stake input changes for custom amounts
  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    
    if (value) {
      const numValue = parseInt(value, 10);
      setStake(numValue);
      setStakeInput(numValue.toLocaleString());
      
      // If the value doesn't match any predefined options, switch to custom
      if (!stakeOptions.some(option => option.value === numValue)) {
        setStakeOption('custom');
      } else {
        setStakeOption(numValue);
      }
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
      setStakeOption(1000);
      toast({
        title: "Invalid stake amount",
        description: "Minimum stake is ₦1,000",
        variant: "destructive"
      });
    }
  };
  
  // Toggle voice chat
  const handleVoiceChatToggle = () => {
    setVoiceChatEnabled(!voiceChatEnabled);
  };

  // Handle game creation
  const handleCreateGame = () => {
    // Validate stake amount
    if (stake < 1000) {
      toast({
        title: "Invalid stake amount",
        description: "Minimum stake is ₦1,000",
        variant: "destructive"
      });
      return;
    }

    // Validate player count if not in single player mode
    if (!singlePlayer && (playerCount < 2 || playerCount > 10)) {
      toast({
        title: "Invalid player count",
        description: "Number of players must be between 2 and 10",
        variant: "destructive"
      });
      return;
    }
    
    // For high stakes games, check if voice chat is enabled
    const isHighStakesGame = stake >= 50000;
    const voiceChatSetting = isHighStakesGame ? voiceChatEnabled : false;
    
    // Call the parent component's handler with proper data for the server
    // For single player mode, we pass 1 as player count and include playWithBot flag
    // This will trigger the server to properly handle the bot setup
    if (singlePlayer) {
      // For single player games, pass additional playWithBot flag
      onCreateGame(1, stake, true, voiceChatSetting);
    } else {
      // For normal multiplayer games
      onCreateGame(playerCount, stake, false, voiceChatSetting);
    }
    
    // Log creation info for debugging
    if (isHighStakesGame) {
      console.log(`Creating ${singlePlayer ? 'single player' : 'multiplayer'} game with voice chat ${voiceChatEnabled ? 'enabled' : 'disabled'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-sans font-bold">Create Game</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <div className="flex items-center mb-2 p-3 border border-secondary rounded-md bg-secondary/10">
              <input
                type="checkbox"
                id="singlePlayer"
                checked={singlePlayer}
                onChange={(e) => setSinglePlayer(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <Label htmlFor="singlePlayer" className="text-gray-700 font-bold">
                DEMO: Play Against Computer
              </Label>
            </div>
            <p className="text-sm text-gray-700 mb-4 font-medium">⚠️ Select this option to play immediately against a computer bot without waiting for other players.</p>
          </div>

          {!singlePlayer && (
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
          )}
          
          <div className="mb-6">
            <Label className="block text-gray-700 font-medium mb-2">Stake Amount</Label>
            
            {/* Stake options selector */}
            <Select
              value={stakeOption.toString()}
              onValueChange={handleStakeOptionChange}
            >
              <SelectTrigger className="w-full mb-2">
                <SelectValue placeholder="Select stake amount" />
              </SelectTrigger>
              <SelectContent>
                {stakeOptions.map((option) => (
                  <SelectItem key={option.value.toString()} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Custom stake input */}
            <div className="relative mt-2">
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
            
            {/* Voice chat option for high stakes games */}
            {stake >= 50000 && (
              <div className="mt-4 p-3 border border-secondary rounded-md bg-secondary/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {voiceChatEnabled ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                    <Label htmlFor="voice-chat" className="text-gray-700 font-bold">
                      Voice Chat
                    </Label>
                  </div>
                  <Switch
                    id="voice-chat"
                    checked={voiceChatEnabled}
                    onCheckedChange={handleVoiceChatToggle}
                  />
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  {voiceChatEnabled
                    ? "Voice chat is enabled for this high-stakes game."
                    : "Enable voice chat to communicate with other players."}
                </p>
              </div>
            )}
          </div>
          
          <div className="mb-6">
            <Label className="block text-gray-700 font-medium mb-2">Game Summary</Label>
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex justify-between mb-2">
                <span>Players:</span>
                <span className="font-semibold">{singlePlayer ? "You vs Computer" : playerCount}</span>
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
              {singlePlayer ? "Start Game" : "Find Players"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameLobbyModal;

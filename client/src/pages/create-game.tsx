import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Header from "@/components/layout/Header";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

// Form schema for game creation
const gameSchema = z.object({
  maxPlayers: z.coerce.number().min(2, "Minimum 2 players").max(10, "Maximum 10 players"),
  stake: z.coerce.number().min(1000, "Minimum stake is ₦1,000"),
  playWithBot: z.boolean().default(false),
  voiceChatEnabled: z.boolean().default(false),
  currency: z.string().default("NGN"),
});

type GameFormValues = z.infer<typeof gameSchema>;

export default function CreateGame() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<GameFormValues>({
    resolver: zodResolver(gameSchema),
    defaultValues: {
      maxPlayers: 4,
      stake: 5000,
      playWithBot: false,
      voiceChatEnabled: false,
      currency: "NGN",
    },
  });

  // Game creation mutation
  const createGameMutation = useMutation({
    mutationFn: async (gameData: GameFormValues) => {
      const response = await apiRequest("POST", "/api/games", gameData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create game");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Game Created",
        description: "Your game has been created successfully!",
      });
      // Redirect to the game page
      setLocation(`/game/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GameFormValues) => {
    // If play with bot is selected, redirect to demo-new page
    if (data.playWithBot) {
      toast({
        title: "Demo Mode",
        description: "Starting a quick demo game with virtual opponent.",
      });
      setLocation('/demo-new');
      return;
    }
    
    // Regular game creation flow
    if (user && user.walletBalance < data.stake) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${formatCurrency(data.stake)} to create this game.`,
        variant: "destructive",
      });
      return;
    }
    
    createGameMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Create New Game</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Game Settings</CardTitle>
              <CardDescription>
                Set up your game parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="maxPlayers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Players</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select number of players" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num} {num === 1 ? "player" : "players"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The maximum number of players who can join this game
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stake Amount (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1000"
                            step="1000"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Each player contributes this amount to the pot
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="playWithBot"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Play with Bot</FormLabel>
                          <FormDescription>
                            Start a single-player game against the computer
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="voiceChatEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Voice Chat</FormLabel>
                          <FormDescription>
                            Allow players to communicate via voice
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between pt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setLocation("/")}
                    >
                      Cancel
                    </Button>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Your Balance</p>
                        <p className="font-medium">{formatCurrency(user.walletBalance)}</p>
                      </div>
                      
                      <Button 
                        type="submit"
                        className="bg-secondary hover:bg-secondary-dark text-primary font-bold"
                        disabled={createGameMutation.isPending}
                      >
                        {createGameMutation.isPending ? "Creating..." : "Create Game"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/layouts/AdminLayout";
import { BarChart3, Target, AlertCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatCurrency, formatDate } from "@/lib/format";

const botSettingsSchema = z.object({
  dailyWinLimit: z.coerce.number().min(0, "Cannot be negative").max(1000, "Too high"),
  minStake: z.coerce.number().min(0, "Cannot be negative"),
  maxStake: z.coerce.number().min(500, "Must be at least ₦500"),
  platformFeePercent: z.coerce.number().min(0, "Cannot be negative").max(100, "Cannot exceed 100%"),
  winChancePercent: z.coerce.number().min(1, "Must be at least 1%").max(100, "Cannot exceed 100%"),
  doubleStoneMultiplier: z.coerce.number().min(1, "Must be at least 1x"),
  tripleStoneMultiplier: z.coerce.number().min(1, "Must be at least 1x"),
});

export default function BotGamesAdminPage() {
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvingBonus, setApprovingBonus] = useState<number | null>(null);

  const form = useForm<z.infer<typeof botSettingsSchema>>({
    resolver: zodResolver(botSettingsSchema),
    defaultValues: {
      dailyWinLimit: 20,
      minStake: 500,
      maxStake: 20000,
      platformFeePercent: 5,
      winChancePercent: 25,
      doubleStoneMultiplier: 2,
      tripleStoneMultiplier: 3,
    },
  });

  // Fetch bot game settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/bot-games/settings");
        const data = await res.json();
        form.reset(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch bot game settings:", error);
        toast({
          title: "Failed to load bot game settings",
          description: "There was a problem loading the bot game settings.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    const fetchDailyStats = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/bot-games/stats");
        const data = await res.json();
        setDailyStats(data);
      } catch (error) {
        console.error("Failed to fetch bot game stats:", error);
        toast({
          title: "Failed to load bot game statistics",
          description: "There was a problem loading the daily statistics.",
          variant: "destructive",
        });
      }
    };
    
    const fetchPendingApprovals = async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/bot-games/pending-approvals");
        const data = await res.json();
        setPendingApprovals(data);
      } catch (error) {
        console.error("Failed to fetch pending approvals:", error);
        toast({
          title: "Failed to load pending approvals",
          description: "There was a problem loading special stone bonus approvals.",
          variant: "destructive",
        });
      }
    };

    if (isAdmin) {
      fetchSettings();
      fetchDailyStats();
      fetchPendingApprovals();
    }
  }, [isAdmin, toast, form]);

  // Update bot game settings
  const onSubmit = async (data: z.infer<typeof botSettingsSchema>) => {
    try {
      const res = await apiRequest("POST", "/api/admin/bot-games/settings", data);
      const updatedSettings = await res.json();
      
      form.reset(updatedSettings);
      
      toast({
        title: "Settings updated",
        description: "Bot game settings have been updated successfully.",
      });
      
    } catch (error) {
      console.error("Failed to update bot game settings:", error);
      toast({
        title: "Failed to update settings",
        description: "There was a problem updating the bot game settings.",
        variant: "destructive",
      });
    }
  };
  
  // Handle approving a special stone bonus
  const handleApproveBonus = async (transactionId: number) => {
    try {
      setApprovingBonus(transactionId);
      
      await apiRequest("POST", `/api/admin/bot-games/approve-bonus/${transactionId}`);
      
      toast({
        title: "Bonus approved",
        description: "The special stone bonus has been credited to the player.",
      });
      
      // Refresh pending approvals list
      const res = await apiRequest("GET", "/api/admin/bot-games/pending-approvals");
      const data = await res.json();
      setPendingApprovals(data);
      
      // Refresh stats as well
      const statsRes = await apiRequest("GET", "/api/admin/bot-games/stats");
      const statsData = await statsRes.json();
      setDailyStats(statsData);
      
      setApprovingBonus(null);
    } catch (error) {
      console.error("Failed to approve special stone bonus:", error);
      toast({
        title: "Approval failed",
        description: "There was a problem approving the special stone bonus.",
        variant: "destructive",
      });
      setApprovingBonus(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Bot Game Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Games</CardTitle>
              <CardDescription>Total bot games played today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">
                  {dailyStats ? dailyStats.totalGamesPlayed : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Wins</CardTitle>
              <CardDescription>Player wins against the bot today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Target className="h-8 w-8 text-green-500" />
                <span className="text-3xl font-bold text-green-600">
                  {dailyStats ? dailyStats.totalWins : '-'}
                  {dailyStats && (
                    <span className="text-xs ml-2 text-green-700">
                      / {form.getValues("dailyWinLimit")}
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Payouts</CardTitle>
              <CardDescription>Total paid to players today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <AlertCircle className="h-8 w-8 text-blue-500" />
                <span className="text-3xl font-bold text-blue-600">
                  {dailyStats ? formatCurrency(dailyStats.totalPayouts) : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {pendingApprovals.length > 0 && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle>
                Pending Special Stone Bonuses
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {pendingApprovals.length} pending
                </span>
              </CardTitle>
              <CardDescription>
                These are the 20% bonuses from special stone wins that require manual admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">{approval.user.username}</p>
                      <p className="text-sm text-gray-500">{approval.description}</p>
                      <p className="text-sm text-gray-500">Game #{approval.gameId} • {new Date(approval.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(approval.amount)}
                      </span>
                      <Button 
                        variant="default" 
                        size="sm"
                        disabled={approvingBonus === approval.id}
                        onClick={() => handleApproveBonus(approval.id)}
                      >
                        {approvingBonus === approval.id ? "Processing..." : "Approve"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Bot Game Settings</CardTitle>
            <CardDescription>
              Configure the parameters for single-player bot games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dailyWinLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Win Limit</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" />
                        </FormControl>
                        <FormDescription>
                          Maximum number of player wins allowed per day
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="winChancePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Win Chance (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1" max="100" />
                        </FormControl>
                        <FormDescription>
                          Percentage chance of player winning against the bot
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="minStake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stake (₦)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" />
                        </FormControl>
                        <FormDescription>
                          Minimum stake amount in Naira
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxStake"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Stake (₦)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="500" />
                        </FormControl>
                        <FormDescription>
                          Maximum stake amount in Naira
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="platformFeePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Fee (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" max="100" />
                        </FormControl>
                        <FormDescription>
                          Platform fee percentage on winnings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="md:col-span-2">
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium mb-4">Payout Multipliers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="doubleStoneMultiplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Double Stone Multiplier</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" step="0.1" />
                            </FormControl>
                            <FormDescription>
                              Payout multiplier for double stones (500, 1000)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="tripleStoneMultiplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Triple Stone Multiplier</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="1" step="0.1" />
                            </FormControl>
                            <FormDescription>
                              Payout multiplier for triple stones (3355, 6624)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto"
                    disabled={isLoading || !form.formState.isDirty}
                  >
                    {isLoading ? "Loading..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Bot Game Rules</CardTitle>
            <CardDescription>
              How bot games work in the Big Boys Game platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do bot games work?</AccordionTrigger>
                <AccordionContent>
                  Bot games allow players to play against the computer with stakes between ₦{form.getValues("minStake")} 
                  and ₦{form.getValues("maxStake")}. Players have a {form.getValues("winChancePercent")}% chance to win
                  against the bot, with special bonuses for special stone values.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>What are the special payouts?</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Regular win: 2x stake (minus platform fee)</li>
                    <li>Double stone win (500, 1000): {form.getValues("doubleStoneMultiplier")}x stake (minus platform fee)</li>
                    <li>Triple stone win (3355, 6624): {form.getValues("tripleStoneMultiplier")}x stake (minus platform fee)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Daily Win Limits</AccordionTrigger>
                <AccordionContent>
                  To ensure platform sustainability, there's a limit of {form.getValues("dailyWinLimit")} total wins per day across all 
                  players. After this limit is reached, players can still play bot games, but they won't win until the next day.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
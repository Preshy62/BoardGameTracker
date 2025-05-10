import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Headphones, X, RefreshCw, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type VoiceChannel = {
  roomId: string;
  userCount: number;
  createdAt: string;
};

export default function VoiceChannelManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch active voice channels
  const { 
    data: channels = [],
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<VoiceChannel[]>({
    queryKey: ["/api/admin/voice/channels"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/voice/channels");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch voice channels");
      }
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
  
  // Mutation to close a channel
  const closeChannelMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const response = await apiRequest("POST", `/api/admin/voice/channels/${roomId}/close`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to close voice channel");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch channels
      queryClient.invalidateQueries({ queryKey: ["/api/admin/voice/channels"] });
      toast({
        title: "Channel Closed",
        description: "Voice channel has been successfully closed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to close channel: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
  };
  
  // Handle channel close
  const handleCloseChannel = (roomId: string) => {
    if (confirm(`Are you sure you want to close voice channel "${roomId}"?`)) {
      closeChannelMutation.mutate(roomId);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Active Voice Channels
          </CardTitle>
          <CardDescription>
            Manage current voice chat channels
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="flex items-center gap-2 p-4 border rounded-md bg-red-50 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading voice channels: {(error as Error)?.message || "Unknown error"}</span>
          </div>
        ) : channels.length === 0 ? (
          <div className="p-4 border rounded-md bg-muted/50 text-center text-muted-foreground">
            No active voice channels found
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map((channel) => (
              <div 
                key={channel.roomId}
                className="flex justify-between items-center p-3 border rounded-md hover:bg-accent/5"
              >
                <div>
                  <div className="font-medium">{channel.roomId}</div>
                  <div className="text-sm text-muted-foreground">
                    {channel.userCount} {channel.userCount === 1 ? "user" : "users"} connected
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(channel.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCloseChannel(channel.roomId)}
                  disabled={closeChannelMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
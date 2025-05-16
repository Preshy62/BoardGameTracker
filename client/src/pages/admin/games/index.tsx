import { useAdmin } from "@/hooks/use-admin";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatCurrency } from "@/lib/format";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { 
  Search, 
  Eye, 
  Gamepad2,
  Clock,
  Check,
  X,
  Filter,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

type Game = {
  id: number;
  creatorId: number;
  name: string;
  description: string;
  status: string;
  minPlayers: number;
  maxPlayers: number;
  stake: number;
  currency: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  playerCount: number;
  winningNumber?: number | null;
};

export default function AdminGamesPage() {
  const { isAdmin, isLoading } = useAdmin();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Redirect if not admin
  if (!isAdmin && !isLoading) {
    navigate("/admin");
    return null;
  }
  
  // Fetch games with query
  const { data: games = [], isLoading: gamesLoading } = useQuery<Game[]>({
    queryKey: ["/api/admin/games"],
    queryFn: () => apiRequest("GET", "/api/admin/games").then(res => res.json()),
    enabled: !!isAdmin,
  });
  
  // Apply filters
  const filteredGames = games.filter(game => {
    // Apply search filter
    const matchesSearch = 
      searchTerm === "" ||
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.id.toString().includes(searchTerm) ||
      (game.description && game.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = 
      statusFilter === "all" ||
      game.status.toLowerCase() === statusFilter.toLowerCase();
      
    return matchesSearch && matchesStatus;
  });
  
  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">{status}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-600 text-green-600">{status}</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-600 text-yellow-600">{status}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Management</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Search games..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="ml-auto flex space-x-1 bg-muted p-1 rounded-md">
          <Button 
            variant={statusFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === "active" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>
          <Button 
            variant={statusFilter === "completed" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </Button>
          <Button 
            variant={statusFilter === "pending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Games
          </CardTitle>
          <CardDescription>
            {filteredGames.length} games found {searchTerm ? `matching "${searchTerm}"` : ""}
            {statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gamesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading games...</p>
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-8">
              <Gamepad2 className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No games found matching your criteria</p>
              {(searchTerm || statusFilter !== "all") && (
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Stake</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGames.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">{game.id}</TableCell>
                      <TableCell>{game.name}</TableCell>
                      <TableCell>{getStatusBadge(game.status)}</TableCell>
                      <TableCell>
                        {game.playerCount} / {game.maxPlayers}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(game.stake, game.currency)}
                      </TableCell>
                      <TableCell>
                        {formatDate(game.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/games/${game.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
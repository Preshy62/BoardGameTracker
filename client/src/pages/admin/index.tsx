import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  Headphones, 
  DollarSign, 
  BarChart4, 
  Clock, 
  AlertCircle 
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const [, setLocation] = useLocation();
  
  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      setLocation("/");
    }
  }, [user, isLoading, isAdmin, setLocation]);
  
  // Show loading or nothing if not authenticated
  if (isLoading || !user || !isAdmin) {
    return null;
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <BarChart4 className="h-5 w-5 mr-2" />
              Active Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1</p>
            <p className="text-sm text-muted-foreground">Games in progress</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="h-5 w-5 mr-2" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₦120,000</p>
            <p className="text-sm text-muted-foreground">Total platform fees</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] sm:h-[300px]">
              <div className="space-y-4">
                <div className="flex items-start pb-4 border-b">
                  <div className="w-2 h-2 mt-1 rounded-full bg-green-500 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium">New game created</p>
                    <p className="text-xs text-muted-foreground">Game #5 - ₦10,000 stake</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start pb-4 border-b">
                  <div className="w-2 h-2 mt-1 rounded-full bg-blue-500 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium">New user registered</p>
                    <p className="text-xs text-muted-foreground">user123</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start pb-4 border-b">
                  <div className="w-2 h-2 mt-1 rounded-full bg-yellow-500 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium">Withdrawal request</p>
                    <p className="text-xs text-muted-foreground">₦50,000 - user456</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                  <span>Database</span>
                </div>
                <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                  <span>WebSocket Server</span>
                </div>
                <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                  <span>Stripe Integration</span>
                </div>
                <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                  <span>Agora Voice</span>
                </div>
                <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
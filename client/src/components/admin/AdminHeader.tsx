import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { 
  LayoutDashboard, 
  Users, 
  Box, 
  DollarSign, 
  LogOut,
  BarChart,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Games", href: "/admin/games", icon: Box },
  { name: "Transactions", href: "/admin/transactions", icon: DollarSign },
  { name: "Statistics", href: "/admin/stats", icon: BarChart },
];

interface AdminHeaderProps {
  user: User;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-xl flex items-center">
            <span className="text-primary mr-1">Big</span>
            <span>Boys Game</span>
            <span className="ml-2 text-xs text-muted-foreground font-normal px-2 py-0.5 border rounded">Admin</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-5">
            {navigation.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/admin" && location.startsWith(item.href));
                
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`text-sm font-medium flex items-center transition-colors hover:text-primary ${
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-1" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username?.substring(0, 2).toUpperCase() || "UN"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  Return to Main App
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <nav className="md:hidden border-t">
        <div className="container flex justify-between py-2">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/admin" && location.startsWith(item.href));
              
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center p-2 rounded transition-colors ${
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
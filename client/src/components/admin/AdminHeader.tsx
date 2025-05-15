import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  CircleDollarSign, 
  Gamepad2, 
  LogOut, 
  Settings,
  Menu,
  Headphones
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const ADMIN_ROUTES = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/transactions", label: "Transactions", icon: CircleDollarSign },
  { path: "/admin/games", label: "Games", icon: Gamepad2 },
  { path: "/admin/voice-tools", label: "Voice Tools", icon: Headphones },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminHeader() {
  const { isAdmin, username, isLoading } = useAdmin();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Note: Redirection is now handled by AdminLayout
  // This component assumes it only renders for admin users
  
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  // If still checking admin status, show loading
  if (isLoading) {
    return <div className="p-4">Checking admin permissions...</div>;
  }
  
  return (
    <header className="sticky top-0 z-50 w-full bg-background shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-xl font-bold">
            BBG Admin
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {ADMIN_ROUTES.map((route) => {
            const isActive = location.startsWith(route.path);
            const Icon = route.icon;
            
            return (
              <Link 
                key={route.path} 
                href={route.path}
                className={`text-sm font-medium transition-colors relative flex items-center gap-2 ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {route.label}
                {isActive && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User menu */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {username?.charAt(0)?.toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{username || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground">
                    Administrator
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="w-full cursor-pointer">
                  Return to App
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {ADMIN_ROUTES.map((route) => {
                    const isActive = location.startsWith(route.path);
                    const Icon = route.icon;
                    
                    return (
                      <Link
                        key={route.path}
                        href={route.path}
                        className={`flex items-center gap-2 text-sm font-medium ${
                          isActive 
                            ? "text-primary" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {route.label}
                      </Link>
                    );
                  })}
                  <Separator className="my-2" />
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Return to App
                  </Link>
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive px-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
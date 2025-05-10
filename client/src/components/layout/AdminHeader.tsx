import { Link } from "wouter";
import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Settings, LogOut, ChevronDown, Headphones, 
  LayoutDashboard, Home, Shield 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminHeaderProps {
  user: User;
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">BBG Admin</span>
            </a>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/admin">
              <a className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/admin/voice-tools">
              <a className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                <Headphones className="h-4 w-4" />
                <span>Voice Tools</span>
              </a>
            </Link>
            <Link href="/">
              <a className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
                <Home className="h-4 w-4" />
                <span>Return to Site</span>
              </a>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-8">
                <div className="font-medium">{user.username}</div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                  <a className="flex w-full cursor-pointer items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
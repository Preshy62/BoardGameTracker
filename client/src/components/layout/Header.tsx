import { useState } from "react";
import { Link } from "wouter";
import WalletButton from "../WalletButton";
import ProfileButton from "../ProfileButton";
import { User } from "@shared/schema";
import { Home, LayoutDashboard, LogOut, Wallet, User as UserIcon, Shield, Settings, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: User;
}

const Header = ({ user }: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const { isAdmin } = useAdmin();

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-lg sm:text-2xl font-bold font-sans tracking-wider cursor-pointer">
              <span className="text-secondary">BIG BOYS</span> GAME
            </h1>
          </Link>
          
          <nav className="hidden lg:flex ml-6 xl:ml-10 space-x-6">
            <Link href="/" className="flex items-center text-white hover:text-secondary transition-colors">
              <Home className="h-4 w-4 mr-1" />
              Games
            </Link>
            <Link href="/dashboard" className="flex items-center text-white hover:text-secondary transition-colors">
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
            <Link href="/wallet" className="flex items-center text-white hover:text-secondary transition-colors">
              <Wallet className="h-4 w-4 mr-1" />
              Wallet
            </Link>
            <Link href="/settings" className="flex items-center text-white hover:text-secondary transition-colors">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex items-center text-white hover:text-secondary transition-colors">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <WalletButton balance={user.walletBalance} />
          
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 text-white hover:text-secondary hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="relative hidden lg:block">
            <ProfileButton 
              initials={user.avatarInitials} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            />
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                
                <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
                
                <Link href="/wallet" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Link>
                
                <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
                
                {isAdmin && (
                  <Link href="/admin" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Link>
                )}
                
                <div className="border-t border-gray-200 mt-1"></div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-primary border-t border-white/20">
            <div className="container mx-auto px-2 sm:px-4 py-4">
              <nav className="space-y-2">
                <Link 
                  href="/" 
                  className="flex items-center py-3 px-3 text-white hover:text-secondary hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5 mr-3" />
                  Games
                </Link>
                <Link 
                  href="/dashboard" 
                  className="flex items-center py-3 px-3 text-white hover:text-secondary hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
                <Link 
                  href="/wallet" 
                  className="flex items-center py-3 px-3 text-white hover:text-secondary hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Wallet className="h-5 w-5 mr-3" />
                  Wallet
                </Link>
                <Link 
                  href="/settings" 
                  className="flex items-center py-3 px-3 text-white hover:text-secondary hover:bg-white/10 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="flex items-center py-3 px-3 text-white hover:text-secondary hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield className="h-5 w-5 mr-3" />
                    Admin Panel
                  </Link>
                )}
                
                <div className="border-t border-white/20 my-2"></div>
                
                <div className="px-3 py-2 text-sm text-white/70">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs">{user.email}</div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full py-3 px-3 text-white hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

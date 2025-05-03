import { useState } from "react";
import { Link, useLocation } from "wouter";
import WalletButton from "../WalletButton";
import ProfileButton from "../ProfileButton";
import { User } from "@shared/schema";

interface HeaderProps {
  user: User;
}

const Header = ({ user }: HeaderProps) => {
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold font-sans tracking-wider cursor-pointer">
              <span className="text-secondary">BIG BOYS</span> GAME
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <WalletButton balance={user.walletBalance} />
          
          <div className="relative">
            <ProfileButton 
              initials={user.avatarInitials} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            />
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  {user.username}
                </div>
                <Link href="/wallet">
                  <a className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Wallet
                  </a>
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

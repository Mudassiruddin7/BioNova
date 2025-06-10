'use client';

import { useAuthState, useAuthMethods, useAuth } from '@/lib/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import { toast } from 'sonner';

export const UserInfo = () => {
  const { user, isLoading } = useAuthState();
  const { user: storeUser, isLoading: storeIsLoading } = useAuth();
  const { logout } = useAuthMethods();
  
  // Use either context or store user
  const userInfo = user || storeUser;
  const isUserLoading = isLoading || storeIsLoading;

  const handleLogout = async () => {
    try {
      // Directly clear auth from localStorage before calling logout
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('guestId');
        localStorage.removeItem('isGuestSessionActive');
      }
      
      await logout();
      toast.success('You have been logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, force a redirect to login page
      window.location.href = '/login';
    }
  };

  if (!userInfo) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-indigo-600/30 bg-indigo-900/20 hover:bg-indigo-800/30 text-indigo-100">
          <Avatar className="h-8 w-8 border border-indigo-500/30">
            <AvatarImage src={userInfo.profileImageUrl} alt={userInfo.name || "User"} />
            <AvatarFallback className="bg-indigo-700 text-indigo-200 text-xs">
              {userInfo.name ? userInfo.name[0].toUpperCase() : userInfo.email ? userInfo.email[0].toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate hidden md:inline">
            {userInfo.name || userInfo.email?.split('@')[0] || userInfo.walletAddress?.substring(0, 6) + '...' + userInfo.walletAddress?.substring(38)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="bg-gray-900 border border-indigo-800/50 text-indigo-100">
        <div className="flex items-center gap-2 p-2 border-b border-indigo-800/30">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userInfo.profileImageUrl} alt={userInfo.name || "User"} />
            <AvatarFallback className="bg-indigo-700 text-indigo-200">
              {userInfo.name ? userInfo.name[0].toUpperCase() : userInfo.email ? userInfo.email[0].toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{userInfo.name || "User"}</p>
            <p className="text-xs text-indigo-300/70">{userInfo.email || userInfo.walletAddress?.substring(0, 6) + '...' + userInfo.walletAddress?.substring(38) || "No email"}</p>
          </div>
        </div>
        
        <DropdownMenuItem 
          className="hover:bg-indigo-900/50 hover:text-indigo-300 focus:bg-indigo-900/50"
          onClick={() => toast.info('Profile settings coming soon')}
        >
          <User className="mr-2 h-4 w-4 text-indigo-400" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="hover:bg-indigo-900/50 hover:text-indigo-300 focus:bg-indigo-900/50"
          onClick={() => toast.info('Settings coming soon')}
        >
          <Settings className="mr-2 h-4 w-4 text-indigo-400" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="hover:bg-red-900/30 hover:text-red-300 focus:bg-red-900/30 text-red-400"
          onClick={handleLogout}
          disabled={isUserLoading}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isUserLoading ? 'Logging out...' : 'Logout'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 
'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Settings, User, LogOut, Wallet, Shield, Moon, Sun, Activity, Bell, ChevronDown, FileText, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { profileAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Link from 'next/link';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { useActivityData } from '@/lib/hooks/useActivityData';

// Import GeneList component
const GeneList = dynamic(() => import('./dashboard/GeneList'), {
  loading: () => <div className="text-center py-4 animate-pulse">Loading predictions...</div>,
  ssr: false,
});

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, 
    y: 0,
    transition: { 
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

// Fix the dynamic import with a proper client-side loading approach
const GuestDataExample = dynamic(() => import('./GuestDataExample'), {
  loading: () => <div className="text-center py-4 animate-pulse">Loading guest data...</div>,
  ssr: false, // Disable SSR to avoid hydration issues
});

export default function DashboardClient() {
  const { user, logout, changePassword, isLoading: authLoading } = useAuth(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isMounted, setIsMounted] = useState(false);
  
  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  
  // Add the useActivityData hook
  const { activities, isLoading: isLoadingActivities, error: activitiesError } = useActivityData();
  
  // Set isMounted state on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const response = await profileAPI.getProfile();
        setProfile(response.data.data.profile);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Handle dark mode toggle
  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try {
      await profileAPI.updatePreferences({ theme: newMode ? 'dark' : 'light' });
      toast.success(`${newMode ? 'Dark' : 'Light'} mode enabled`);
    } catch (error) {
      console.error('Failed to update theme preference:', error);
      toast.error('Failed to update theme preference');
      setDarkMode(!newMode); // Revert on error
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError('');
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordError('Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950/90 to-gray-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
          </div>
          <p className="text-indigo-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950/90 to-gray-900 text-white pb-12">
      <motion.div
          className="container mx-auto pt-8 px-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-cyan-300">Dashboard</h1>
              <p className="text-gray-400 mt-1">Manage your account and view your data</p>
            </motion.div>
        </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
          {/* Guest Data Example - For demonstration */}
          {isMounted && user?.role === 'guest' && (
            <motion.div variants={fadeIn} custom={-1} className="md:col-span-3 mb-6">
              <Card className="backdrop-blur-sm bg-gray-900/30 border-amber-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-900/10 rounded-lg"></div>
                <CardHeader className="relative pb-4 border-b border-amber-500/10">
                  <CardTitle className="text-amber-100">Guest Mode Active</CardTitle>
                  <CardDescription className="text-amber-300/70">
                    You are currently using a guest account. Your data is stored locally in this browser.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 relative">
                  <div className="mb-6">
                    <p className="text-white mb-4">This example demonstrates how your data is handled in guest mode:</p>
                    <div className="mt-4">
                      {/* Import and use the GuestDataExample component */}
                      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                        <GuestDataExample />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* User Profile Card */}
            <motion.div variants={fadeIn} custom={0}>
              <Card className="backdrop-blur-sm bg-gray-900/30 border-indigo-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10 rounded-lg"></div>
                <CardHeader className="relative pb-4 border-b border-indigo-500/10">
                  <CardTitle className="text-indigo-100">Profile</CardTitle>
                  <CardDescription className="text-indigo-300/70">Your personal information</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center pb-0 relative pt-6">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 flex items-center justify-center">
                    <Avatar className="h-16 w-16 border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                    <AvatarImage src={user.profileImageUrl} alt={user.name || "User"} />
                      <AvatarFallback className="bg-indigo-700 text-indigo-200 text-xl">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mt-8 mb-1">{user.name || "User"}</h3>
                  <p className="text-indigo-300/70">{user.email || "No email provided"}</p>
                  
                  <div className="mt-6 w-full border-t border-indigo-500/10 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-indigo-300/70">Role</span>
                      <motion.span 
                        className="font-medium text-white capitalize px-2.5 py-1 bg-indigo-700/30 rounded-full text-sm"
                        whileHover={{ scale: 1.05 }}
                      >
                        {user.role}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-indigo-300/70">Account Type</span>
                      <motion.span 
                        className="font-medium text-white px-2.5 py-1 bg-indigo-700/30 rounded-full text-sm"
                        whileHover={{ scale: 1.05 }}
                      >
                        {user.email ? 'Email' : 'Wallet'}
                      </motion.span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-300/70">Member Since</span>
                      <motion.span 
                        className="font-medium text-white px-2.5 py-1 bg-indigo-700/30 rounded-full text-sm"
                        whileHover={{ scale: 1.05 }}
                      >
                        {new Date().toLocaleDateString()}
                      </motion.span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center pt-6 pb-6 relative">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="border-indigo-500/30 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-100">
                        <FileText className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-gray-900 border-l border-indigo-500/20 text-white">
                      <SheetHeader>
                        <SheetTitle className="text-indigo-100">Edit Profile</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-indigo-300">Display Name</Label>
                          <Input 
                            id="name" 
                            placeholder="Your name" 
                            defaultValue={user.name || ''} 
                            className="bg-gray-800/50 border-indigo-500/30 focus:border-indigo-400 text-white"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-indigo-300">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            disabled 
                            value={user.email || ''} 
                            className="bg-gray-800/50 border-indigo-500/30 text-gray-400"
                          />
                          <p className="text-xs text-indigo-400">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-indigo-500/20">
                          <h3 className="font-medium text-indigo-100">Password</h3>
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-indigo-300">Current Password</Label>
                            <Input 
                              id="currentPassword" 
                              type="password" 
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="bg-gray-800/50 border-indigo-500/30 focus:border-indigo-400 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-indigo-300">New Password</Label>
                            <Input 
                              id="newPassword" 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="bg-gray-800/50 border-indigo-500/30 focus:border-indigo-400 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-indigo-300">Confirm Password</Label>
                            <Input 
                              id="confirmPassword" 
                              type="password" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="bg-gray-800/50 border-indigo-500/30 focus:border-indigo-400 text-white"
                            />
                          </div>
                          
                          {passwordError && (
                            <p className="text-sm text-red-400 mt-2">{passwordError}</p>
                          )}
                          
                          <Button 
                            onClick={handleChangePassword} 
                            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                          >
                            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Wallet Card */}
            <motion.div variants={fadeIn} custom={1}>
              <Card className="backdrop-blur-sm bg-gray-900/30 border-indigo-500/20 overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10 rounded-lg"></div>
                <CardHeader className="relative pb-4 border-b border-indigo-500/10">
                  <CardTitle className="text-indigo-100">Wallet Connection</CardTitle>
                  <CardDescription className="text-indigo-300/70">Manage your blockchain wallet</CardDescription>
                </CardHeader>
                <CardContent className="pb-0 relative pt-6">
                  <motion.div 
                    className="flex items-center justify-between mb-6"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-900/50 p-3 rounded-full border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                        <Wallet className="h-6 w-6 text-indigo-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Wallet Status</h3>
                        <p className="text-sm text-indigo-300/70">
                      {isConnected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <div>
                  {isConnected ? (
                        <Badge className="bg-green-900/30 text-green-300 border border-green-500/30">
                      Active
                    </Badge>
                  ) : (
                        <Badge className="bg-gray-800/50 text-gray-300 border border-gray-600/30">
                      Inactive
                      </Badge>
                  )}
                    </div>
                  </motion.div>

                  <AnimatePresence>
              {isConnected && address && (
                      <motion.div 
                        className="mb-6 p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/20"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                  <div className="flex justify-between items-center">
                          <span className="text-sm text-indigo-300/70">Address</span>
                          <motion.span 
                            className="text-sm font-mono font-medium text-indigo-100 bg-indigo-800/30 px-2 py-1 rounded-md"
                            whileHover={{ scale: 1.05 }}
                          >
                      {`${address.substring(0, 6)}...${address.substring(38)}`}
                          </motion.span>
                  </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div 
                    className="flex justify-between items-center"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-900/30 p-3 rounded-full border border-orange-500/30 shadow-lg shadow-orange-500/5">
                        <Shield className="h-5 w-5 text-orange-300" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">Secured Connection</h3>
                        <p className="text-sm text-indigo-300/70">End-to-end encryption</p>
                      </div>
                    </div>
                    <Switch 
                      defaultChecked 
                      disabled 
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </motion.div>
                </CardContent>
                <CardFooter className="pt-6 pb-6 relative">
                <Link href="/chainSight" passHref>
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                    >
                    <Wallet className="h-4 w-4 mr-2" />
                    Go to Wallet Hub
                    <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Settings Card */}
            {/* <motion.div variants={fadeIn} custom={2}>
              <Card className="backdrop-blur-sm bg-gray-900/30 border-indigo-500/20 overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10 rounded-lg"></div>
                <CardHeader className="relative pb-4 border-b border-indigo-500/10">
                  <CardTitle className="text-indigo-100">Settings</CardTitle>
                  <CardDescription className="text-indigo-300/70">Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="relative pt-6">
              <div className="space-y-6">
                      <motion.div
                      className="flex justify-between items-center" 
                        whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                  <div className="flex items-center space-x-3">
                        <div className="bg-blue-900/30 p-3 rounded-full border border-blue-500/30 shadow-lg shadow-blue-500/5">
                      {darkMode ? (
                            <Moon className="h-5 w-5 text-blue-300" />
                      ) : (
                            <Sun className="h-5 w-5 text-blue-300" />
                      )}
                    </div>
                          <div>
                          <h3 className="font-medium text-white">Dark Mode</h3>
                          <p className="text-sm text-indigo-300/70">Toggle dark or light theme</p>
                          </div>
                        </div>
                      <Switch 
                        checked={darkMode} 
                        onCheckedChange={toggleDarkMode} 
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      </motion.div>

                    <motion.div 
                      className="flex justify-between items-center"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                  <div className="flex items-center space-x-3">
                        <div className="bg-purple-900/30 p-3 rounded-full border border-purple-500/30 shadow-lg shadow-purple-500/5">
                          <Bell className="h-5 w-5 text-purple-300" />
                    </div>
                    <div>
                          <h3 className="font-medium text-white">Notifications</h3>
                          <p className="text-sm text-indigo-300/70">Receive email updates</p>
                      </div>
                  </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                    </motion.div>

                    <motion.div 
                      className="flex justify-between items-center"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                  <div className="flex items-center space-x-3">
                        <div className="bg-green-900/30 p-3 rounded-full border border-green-500/30 shadow-lg shadow-green-500/5">
                          <Activity className="h-5 w-5 text-green-300" />
                    </div>
                    <div>
                          <h3 className="font-medium text-white">Activity Logs</h3>
                          <p className="text-sm text-indigo-300/70">Track your account activity</p>
                        </div>
                    </div>
                      <Switch className="data-[state=checked]:bg-indigo-600" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div> */}
          </motion.div>

          {/* Recent Activity Section */}
          <motion.div 
            className="mt-8"
            variants={fadeIn}
            custom={3}
            initial="hidden"
            animate="visible"
          >
            <Card className="backdrop-blur-sm bg-gray-900/30 border-indigo-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10 rounded-lg"></div>
              <CardHeader className="relative pb-4 border-b border-indigo-500/10">
                <CardTitle className="text-indigo-100">Recent Activity</CardTitle>
                <CardDescription className="text-indigo-300/70">Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent className="relative pt-6">
                <Tabs 
                  defaultValue="all" 
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="mb-6 bg-gray-800/50 border border-indigo-500/20">
                    <TabsTrigger 
                      value="all"
                      className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300"
                    >
                      All
                    </TabsTrigger>
                    <TabsTrigger 
                      value="predictions"
                      className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300"
                    >
                      Predictions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="transactions"
                      className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300"
                    >
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="monitoring"
                      className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-gray-300"
                    >
                      Monitoring
                    </TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isLoadingProfile ? (
                        <div className="flex justify-center items-center py-12">
                          <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
                            <div className="absolute inset-3 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
                          </div>
                        </div>
                      ) : activeTab === 'all' ? (
                        <ActivityFeed limit={8} />
                      ) : activeTab === 'predictions' ? (
                        <div className="space-y-6">
                          {/* Full Gene Predictions List */}
                          <GeneList />
                        </div>
                      ) : activeTab === 'transactions' ? (
                        <div className="space-y-6">
                          {/* Show transactions from activity data */}
                          {isLoadingActivities ? (
                            <div className="flex justify-center items-center py-12">
                              <div className="relative w-12 h-12">
                                <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
                                <div className="absolute inset-3 rounded-full border-t-2 border-l-2 border-cyan-400 animate-spin-slow"></div>
                              </div>
                            </div>
                          ) : activitiesError ? (
                            <motion.div 
                              className="text-center py-12 bg-red-900/10 rounded-lg border border-red-500/10"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              <FileText className="h-12 w-12 mx-auto mb-4 text-red-400/50" />
                              <p className="text-lg text-red-300">Error Loading Transactions</p>
                              <p className="text-sm text-red-300/70 mt-1">{activitiesError}</p>
                            </motion.div>
                          ) : (
                            <>
                              {activities.filter(activity => activity.type === 'transaction').length > 0 ? (
                                <div className="overflow-x-auto bg-gray-900/30 rounded-lg border border-indigo-500/20">
                                  <table className="w-full text-sm">
                                    <tbody>
                                      {activities
                                        .filter(activity => activity.type === 'transaction')
                                        .map((transaction) => (
                                          <tr 
                                            key={transaction.id}
                                            className="border-b border-indigo-500/10 hover:bg-indigo-900/30 transition-colors"
                                          >
                                            <td className="py-4 pl-4 pr-2">
                                              <div className="font-medium text-indigo-100">
                                                {/* Use transaction title or default based on type */}
                                                Registered {transaction.data.type ? (
                                                  <>
                                                    {transaction.data.type === 'sample' && 'Sample: '}
                                                    {transaction.data.type === 'experiment' && 'Experiment for Specimen: '}
                                                    {transaction.data.type === 'ip' && 'IP: '}
                                                    {transaction.data.type === 'access' && 'Access: '}
                                                    {transaction.data.type === 'workflow' && 'Workflow: '}
                                                    {transaction.data.type === 'other' && ''}
                                                  </>
                                                ) : ''}
                                                <span className="text-indigo-300">
                                                  {transaction.title.replace('Blockchain Transaction', '').replace('Transaction', '')}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="py-4 px-2">
                                              <Link 
                                                href={`/chainSight/transaction/${transaction.id}`} 
                                                className="text-indigo-300 hover:text-indigo-200 transition font-mono"
                                              >
                                                {transaction.data.hash && (
                                                  <>0x{transaction.data.hash.substring(0, 5)}...{transaction.data.hash.substring(transaction.data.hash.length - 3)}</>
                                                )}
                                              </Link>
                                            </td>
                                            <td className="py-4 px-2 text-indigo-300/70">
                                              {new Date(transaction.timestamp).toLocaleString('en-US', {
                                                month: 'numeric',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                              })}
                                            </td>
                                            <td className="py-4 px-2">
                                              {transaction.data.status === 'confirmed' && (
                                                <div className="flex items-center">
                                                  <CheckCircle className="h-4 w-4 text-green-400 mr-1.5" />
                                                  <span className="text-green-400">Confirmed</span>
                                                </div>
                                              )}
                                              {transaction.data.status === 'pending' && (
                                                <div className="flex items-center">
                                                  <Clock className="h-4 w-4 text-yellow-400 mr-1.5" />
                                                  <span className="text-yellow-400">Pending</span>
                                                </div>
                                              )}
                                              {transaction.data.status === 'failed' && (
                                                <div className="flex items-center">
                                                  <XCircle className="h-4 w-4 text-red-400 mr-1.5" />
                                                  <span className="text-red-400">Failed</span>
                                                </div>
                                              )}
                                            </td>
                                            <td className="py-4 pl-2 pr-4 text-right">
                                              <Link 
                                                href={`/chainSight/transaction/${transaction.id}`}
                                                className="text-indigo-300 hover:text-indigo-200 transition flex items-center justify-end"
                                              >
                                                View <ExternalLink className="h-3.5 w-3.5 ml-1" />
                                              </Link>
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <motion.div 
                                  className="text-center py-12 bg-indigo-900/10 rounded-lg border border-indigo-500/10"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <FileText className="h-12 w-12 mx-auto mb-4 text-indigo-400/50" />
                                  <p className="text-lg text-indigo-300">No Transactions Found</p>
                                  <p className="text-sm text-indigo-300/70 mt-1">Your transaction history will appear here</p>
                                </motion.div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        profile?.recentActivity?.filter((a: any) => a.type === 'monitoring')?.length > 0 ? (
                          <div className="space-y-4">
                            {profile.recentActivity
                              .filter((activity: any) => activity.type === 'monitoring')
                              .map((activity: any, index: number) => (
                                <motion.div 
                                  key={index}
                                  className="flex justify-between p-4 bg-indigo-900/20 rounded-lg border border-indigo-500/20"
                                  whileHover={{ scale: 1.01 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                  <div>
                                    <p className="font-medium text-white">IoT Monitoring</p>
                                    <p className="text-sm text-indigo-300/70">
                                      {activity.data.summary || 'Monitoring data recorded'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-indigo-300/70">
                                      {new Date(activity.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                          </div>
                        ) : (
                          <motion.div 
                            className="text-center py-12 bg-indigo-900/10 rounded-lg border border-indigo-500/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <FileText className="h-12 w-12 mx-auto mb-4 text-indigo-400/50" />
                            <p className="text-lg text-indigo-300">No monitoring data found</p>
                            <p className="text-sm text-indigo-300/70 mt-1">Your IoT monitoring data will appear here</p>
                          </motion.div>
                        )
                      )}
                    </motion.div>
                  </AnimatePresence>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </MotionConfig>
  );
}

// Badge component
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span 
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  );
} 
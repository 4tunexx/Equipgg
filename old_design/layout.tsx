
'use client';

import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gamepad2,
  Home,
  Crown,
  Swords,
  Shield,
  ShoppingBag,
  Users,
  LogOut,
  User as UserIcon,
  Gem,
  Star,
  Coins,
  Box,
  Cog,
  Puzzle,
  MessagesSquare,
  LifeBuoy,
  Bell,
  BadgeCheck,
  Percent,
  History,

} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/user-avatar';
import { Progress } from '@/components/ui/progress';
import { PrestigeActivityFeed } from '@/components/prestige-activity-feed';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getRoleColors, getRoleInlineStyle } from '@/lib/role-colors';
import { useAuth } from '@/components/auth-provider';
import { AdminBalanceManager } from '@/components/admin-balance-manager';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { XpDisplay } from '@/components/xp-display';
import { XPManager } from '@/components/xp-manager';
import { BalanceProvider, useBalance } from '@/contexts/balance-context';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/betting', label: 'Betting', icon: Swords },
  { href: '/dashboard/arcade', label: 'Arcade', icon: Puzzle },
  { href: '/dashboard/inventory', label: 'Inventory', icon: Shield },
  { href: '/dashboard/crates', label: 'Crates', icon: Box },
  { href: '/dashboard/missions', label: 'Missions', icon: Crown },
  { href: '/dashboard/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Users },
  { href: '/dashboard/community', label: 'Community', icon: MessagesSquare },
  { href: '/dashboard/profile', label: 'Profile', icon: UserIcon },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
];

function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const { siteSettings } = useSiteSettings();
  const { user, signOutUser, enabled, loading, refreshUser } = useAuth();
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const { balance } = useBalance();

  // All hooks must be called before any conditional returns
  const [summary, setSummary] = React.useState<{ xp: number; level: number; coins: number; gems: number; dailyCompleted: number; totalDaily: number } | null>(null);
  const [notifications, setNotifications] = React.useState<{unreadCount: number, notifications: any[]}>({unreadCount: 0, notifications: []});
  const [messages, setMessages] = React.useState<{unreadCount: number, messages: any[]}>({unreadCount: 0, messages: []});

  // Refresh user data when component mounts to get updated role
  React.useEffect(() => {
    if (user && refreshUser) {
      refreshUser();
    }
  }, [refreshUser]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/notifications', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const notifications = data.notifications || [];
        const unreadCount = notifications.filter((n: any) => !n.read).length;
        setNotifications({
          unreadCount,
          notifications: notifications
        });
      } else if (response.status === 401) {
        // Session expired, don't log as error
        console.log('Notifications: Session expired');
      } else {
        console.error('Error fetching notifications:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch notifications when user changes
  React.useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // VIP purchase handler
  const handleVipPurchase = async () => {
    try {
      const response = await fetch('/api/user/upgrade-vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "VIP Upgrade Successful!",
          description: "You are now a VIP member with exclusive perks!",
        });
        // Refresh user data
        window.location.reload();
      } else {
        toast({
          title: "Upgrade Failed",
          description: data.error || "Failed to upgrade to VIP",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upgrade to VIP",
        variant: "destructive"
      });
    }
  };

  // Function to refresh user data
  const refreshUserData = async () => {
    if (!user) return;

    try {
      // Fetch user data first
      const userResponse = await fetch('/api/me', { credentials: 'include' });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Fetch other data in parallel, but handle 401s gracefully
        const [missionResponse, notificationsResponse, messagesResponse] = await Promise.allSettled([
          fetch('/api/missions/summary', { credentials: 'include' }),
          fetch('/api/notifications', { credentials: 'include' }),
          fetch('/api/messages', { credentials: 'include' })
        ]);

        const missionData = missionResponse.status === 'fulfilled' && missionResponse.value.ok 
          ? await missionResponse.value.json() : null;
        const notificationsData = notificationsResponse.status === 'fulfilled' && notificationsResponse.value.ok 
          ? await notificationsResponse.value.json() : null;
        const messagesData = messagesResponse.status === 'fulfilled' && messagesResponse.value.ok 
          ? await messagesResponse.value.json() : null;
        
        setSummary({
          xp: userData.user?.xp || 0,
          level: userData.user?.level || 1,
          coins: userData.user?.coins || 0,
          gems: userData.user?.gems || 0,
          dailyCompleted: missionData?.dailyCompleted || 0,
          totalDaily: missionData?.totalDaily || 0
        });
        
        if (notificationsData) {
          const notifications = notificationsData.notifications || [];
          const unreadCount = notifications.filter((n: any) => !n.read).length;
          setNotifications({
            unreadCount,
            notifications: notifications
          });
        }
        
        if (messagesData) {
          const messages = messagesData.messages || [];
          const unreadMessages = messages.filter((m: any) => !m.read).length;
          setMessages({
            unreadCount: unreadMessages,
            messages: messages
          });
        }
      } else if (userResponse.status === 401) {
        console.log('Session expired during user data refresh');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Load user stats and mission summary
  React.useEffect(() => {
    if (!user) {
      // Clear summary when user logs out
      setSummary(null);
      return;
    }

    const loadUserData = async () => {
      // Add a small delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 300));
      await refreshUserData();
    };

    loadUserData();
  }, [user?.uid, user?.role]); // Also depend on user ID and role to refresh when switching accounts

  
  const currentPage = navLinks.find((link) => pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard'));
  const pageTitle = currentPage ? currentPage.label : 'Dashboard';
  const isAdminPage = pathname.startsWith('/dashboard/admin');
  const isModeratorPage = pathname.startsWith('/dashboard/moderator');
  const isAdmin = Boolean(user?.role === 'admin');
  const isModerator = Boolean(user?.role === 'moderator');


  // Authentication is now handled by middleware - no client-side redirects needed

  // Data fetching is now handled by refreshUserData in the useEffect above
  // This prevents duplicate API calls and ensures consistent data loading

  // Listen for game completion events to refresh user data
  React.useEffect(() => {
    const handleGameCompletion = () => {
      console.log('🔄 Dashboard layout: Refreshing user data due to game completion event');
      refreshUserData();
    };

    const handleBalanceUpdate = () => {
      console.log('🔄 Dashboard layout: Refreshing user data due to balance update event');
      refreshUserData();
    };

    // Listen for custom game completion events
    window.addEventListener('gameCompleted', handleGameCompletion);
    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('xpUpdated', handleGameCompletion);

    return () => {
      window.removeEventListener('gameCompleted', handleGameCompletion);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('xpUpdated', handleGameCompletion);
    };
  }, [user]);

  // Early return for loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not loading but no user, show error state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access the dashboard.</p>
          <button 
            onClick={() => window.location.href = '/signin'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <SidebarProvider>
        <Sidebar variant="floating" collapsible="icon">
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center justify-center">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center group/logo"
                >
                  {siteSettings?.logo_url ? (
                    <Image
                      src={siteSettings.logo_url}
                      alt="EquipGG Logo"
                      width={200}
                      height={60}
                      className="h-12 w-auto max-w-full object-contain transition-transform duration-300 group-hover/logo:scale-110 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-auto"
                      quality={100}
                      priority
                      unoptimized={process.env.NODE_ENV === 'development'}
                    />
                  ) : (
                    <Gamepad2 className="size-12 shrink-0 text-primary transition-transform duration-300 group-hover/logo:scale-110 group-data-[collapsible=icon]:size-8" />
                  )}
                </Link>
                {enabled ? (
                  user ? null : (
                    <Link href="/signin" className="ml-auto group-data-[collapsible=icon]:hidden">
                      <Button size="sm" variant="outline">Sign in</Button>
                    </Link>
                  )
                ) : null}
              </div>
            </SidebarHeader>

            <div className="flex flex-col gap-4 p-2">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar 
                      user={{
                        username: user?.displayName || user?.email?.split('@')[0] || 'User',
                        name: user?.displayName,
                        avatar: user?.photoURL,
                        role: user?.role,
                        provider: user?.provider,
                        steamProfile: user?.steamProfile
                      }} 
                      size="md" 
                      showRoleBorder={true}
                    />
                    <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                      <p className={`truncate font-semibold ${getRoleColors(user?.role || 'user').text}`} style={getRoleInlineStyle(user?.role || 'user')}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={signOutUser} 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 group-data-[collapsible=icon]:hidden"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
              </div>
              <div className="space-y-3 group-data-[collapsible=icon]:hidden">
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-yellow-400">
                            <Gem className="size-3" />
                            <span>{balance?.gems ?? 0} Gems</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-400">
                            <Coins className="size-3" />
                            <span>{balance?.coins ?? 0} Coins</span>
                        </div>
                    </div>
                    <XpDisplay 
                        xp={balance?.xp ?? 0} 
                        level={balance?.level ?? 1}
                        userId={user?.id}
                        autoFetch={true}
                        className=""
                    />
                </div>
                 <div className="space-y-1">
                    <Progress value={summary && summary.totalDaily ? (summary.dailyCompleted / summary.totalDaily) * 100 : 0} className="h-2 [&>div]:bg-sky-400" />
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Daily Missions</span>
                        <span className="text-sky-400">{summary?.dailyCompleted ?? 0} / {summary?.totalDaily ?? 0}</span>
                    </div>
                </div>
                
                {/* Admin Balance Manager */}
                {isAdmin && (
                  <div className="pt-2 border-t border-border/50">
                    <AdminBalanceManager
                      userCoins={balance?.coins ?? 0}
                      userGems={balance?.gems ?? 0}
                      onBalanceUpdate={(coins, gems) => {
                        // Balance updates are now handled by the context
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <SidebarSeparator className="group-data-[collapsible=icon]:hidden" />

            <SidebarMenu className="px-2">
              {navLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard')}
                    tooltip={link.label}
                  >
                    <Link href={link.href}>
                      <link.icon />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            {isAdmin ? (
              <>
                <SidebarSeparator />
                <SidebarMenu className="px-2">
                  <SidebarMenuItem>
                    <Link 
                      href="/dashboard/admin"
                      className={cn(
                        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-base outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                        isAdminPage ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      )}
                    >
                      <Cog />
                      <span>Admin Panel</span>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
              </>
            ) : null}
            {isModerator && !isAdmin ? (
              <>
                <SidebarSeparator />
                <SidebarMenu className="px-2">
                  <SidebarMenuItem>
                    <Link 
                      href="/dashboard/moderator"
                      className={cn(
                        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-base outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
                        isModeratorPage ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                      )}
                    >
                      <Shield />
                      <span>Moderator Panel</span>
                    </Link>
                  </SidebarMenuItem>
                </SidebarMenu>
              </>
            ) : null}
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col h-screen max-h-screen w-full">
            <PrestigeActivityFeed />
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/95 px-6 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-8 w-8" />
                <h2 className="text-xl font-semibold">{isAdminPage ? 'Admin Panel' : isModeratorPage ? 'Moderator Panel' : pageTitle}</h2>
              </div>
               <div className="flex items-center gap-4">
                 <Link href="/dashboard/gems">
                   <Button variant="outline" className="flex items-center gap-2">
                     <Gem className="h-4 w-4" />
                     Gems
                   </Button>
                 </Link>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                          <Crown className="mr-2 h-4 w-4" />
                          Upgrade to VIP
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Crown className="text-primary w-6 h-6" /> Upgrade to VIP
                            </DialogTitle>
                            <DialogDescription>
                                Unlock exclusive perks and stand out from the crowd.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <h4 className="font-semibold">VIP Perks:</h4>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <Star className="w-5 h-5 text-purple-400" />
                                    <div>
                                        <p className="font-semibold">Purple Glowing Nickname</p>
                                        <p className="text-xs text-muted-foreground">Make your name shine in chat and leaderboards.</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Percent className="w-5 h-5 text-green-400" />
                                     <div>
                                        <p className="font-semibold">+5% Coins on Won Bets</p>
                                        <p className="text-xs text-muted-foreground">Get more from every victory.</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <BadgeCheck className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <p className="font-semibold">Exclusive Profile Badge</p>
                                        <p className="text-xs text-muted-foreground">Show off your VIP status on your mini profile card.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:flex-row">
                             <div className="flex items-center justify-center gap-2 text-lg font-bold text-yellow-400 bg-secondary/50 p-2 rounded-md w-full">
                                <Gem className='w-5 h-5' />
                                <span>10,000 Coins</span>
                            </div>
                            <DialogTrigger asChild>
                                <Button onClick={handleVipPurchase} className="w-full">Confirm Purchase</Button>
                            </DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className='relative'>
                            <MessagesSquare className="h-5 w-5" />
                            {messages.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                              </span>
                            )}
                            <span className="sr-only">Messages</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Messages & Updates</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {messages.unreadCount > 0 ? (
                          <div className="max-h-64 overflow-y-auto">
                            {[
                              {
                                id: 'sample-1',
                                type: 'news',
                                from: 'EquipGG Team',
                                fromRole: 'admin',
                                subject: '🎉 New Features Released!',
                                preview: 'We\'ve added new betting options, improved the arcade games, and enhanced the user experience...',
                                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                                read: false
                              },
                              {
                                id: 'sample-2',
                                type: 'update',
                                from: 'System',
                                fromRole: 'admin',
                                subject: '🔄 Platform Maintenance Complete',
                                preview: 'Scheduled maintenance has been completed successfully. All services are now running optimally...',
                                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                                read: false
                              },
                              {
                                id: 'sample-3',
                                type: 'admin_announcement',
                                from: 'Admin',
                                fromRole: 'admin',
                                subject: '📢 Important: New Security Features',
                                preview: 'We\'ve implemented enhanced security measures to protect your account and transactions...',
                                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                                read: true
                              },
                              {
                                id: 'sample-4',
                                type: 'mod_announcement',
                                from: 'Moderator',
                                fromRole: 'moderator',
                                subject: '🎮 Weekly Tournament Results',
                                preview: 'Congratulations to all participants! Check out the leaderboard for this week\'s tournament winners...',
                                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                                read: true
                              }
                            ].slice(0, 4).map((message) => {
                              const getMessageIcon = (type: string) => {
                                switch (type) {
                                  case 'news': return '📰';
                                  case 'update': return '🔄';
                                  case 'admin_announcement': return '📢';
                                  case 'mod_announcement': return '🎮';
                                  case 'system_notification': return '⚙️';
                                  default: return '💬';
                                }
                              };

                              const getMessageColor = (type: string) => {
                                switch (type) {
                                  case 'news': return 'text-blue-600';
                                  case 'update': return 'text-green-600';
                                  case 'admin_announcement': return 'text-red-600';
                                  case 'mod_announcement': return 'text-purple-600';
                                  case 'system_notification': return 'text-gray-600';
                                  default: return 'text-gray-600';
                                }
                              };

                              const getRoleColor = (role: string) => {
                                switch (role) {
                                  case 'admin': return 'text-red-500';
                                  case 'moderator': return 'text-blue-500';
                                  default: return 'text-gray-500';
                                }
                              };

                              return (
                                <DropdownMenuItem
                                  key={message.id}
                                  className={`${!message.read ? 'bg-muted border-l-4 border-l-orange-500' : ''} cursor-pointer hover:bg-muted/50 p-3`}
                                  onClick={() => {
                                    // Mark as read if unread
                                    if (!message.read) {
                                      setMessages(prev => ({
                                        ...prev,
                                        unreadCount: Math.max(0, prev.unreadCount - 1)
                                      }));
                                    }
                                  }}
                                >
                                  <div className="flex items-start gap-3 w-full">
                                    <div className="text-lg flex-shrink-0">
                                      {getMessageIcon(message.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`font-medium ${getMessageColor(message.type)}`}>
                                        {message.subject}
                                      </div>
                                      <div className="text-sm text-muted-foreground truncate">
                                        {message.preview}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs ${getRoleColor(message.fromRole)}`}>
                                          {message.from}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(message.timestamp).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                    {!message.read && (
                                      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                                    )}
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        ) : (
                          <DropdownMenuItem disabled>No new messages</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/dashboard/messages')}>
                          View all messages
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className='relative'>
                            <Bell className="h-5 w-5" />
                            {notifications.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                              </span>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {notifications.notifications.length === 0 ? (
                            <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
                        ) : (
                            notifications.notifications.slice(0, 5).map((notification) => {
                                const getNotificationIcon = (type: string) => {
                                    switch (type) {
                                        case 'bet_won':
                                        case 'bet_lost':
                                        case 'game_result':
                                            return '🎯';
                                        case 'coin_reward':
                                        case 'purchase':
                                            return '💰';
                                        case 'admin_announcement':
                                        case 'news_update':
                                            return '📢';
                                        case 'support_ticket':
                                            return '🎫';
                                        case 'friend_request':
                                        case 'message_received':
                                            return '👥';
                                        case 'achievement':
                                            return '🏆';
                                        case 'level_up':
                                            return '⬆️';
                                        default:
                                            return '🔔';
                                    }
                                };

                                const getNotificationColor = (type: string) => {
                                    switch (type) {
                                        case 'bet_won':
                                        case 'coin_reward':
                                            return 'text-green-600';
                                        case 'bet_lost':
                                            return 'text-red-600';
                                        case 'admin_announcement':
                                            return 'text-blue-600';
                                        case 'news_update':
                                            return 'text-purple-600';
                                        case 'support_ticket':
                                            return 'text-orange-600';
                                        default:
                                            return 'text-gray-600';
                                    }
                                };

                                return (
                                    <DropdownMenuItem 
                                        key={notification.id}
                                        className={`${!notification.read ? 'bg-muted border-l-4 border-l-blue-500' : ''} cursor-pointer hover:bg-muted/50`}
                                        onClick={() => {
                                            // Mark as read if unread
                                            if (!notification.read) {
                                                fetch('/api/notifications', {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ notificationIds: [notification.id] })
                                                }).then(() => fetchNotifications());
                                            }
                                            
                                            // Navigate to relevant page if navigation data exists
                                            if (notification.navigationData) {
                                                const { route, params } = notification.navigationData;
                                                
                                                // Build URL with query parameters
                                                const url = new URL(route, window.location.origin);
                                                if (params) {
                                                    Object.entries(params).forEach(([key, value]) => {
                                                        if (value !== null && value !== undefined) {
                                                            url.searchParams.set(key, String(value));
                                                        }
                                                    });
                                                }
                                                
                                                router.push(url.pathname + url.search);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3 w-full">
                                            <div className="text-lg flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium ${getNotificationColor(notification.type)}`}>
                                                    {notification.title}
                                                </div>
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {notification.message}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })
                        )}
                        {notifications.notifications.length > 5 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
                                    View all notifications
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {enabled ? (
                  user ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.displayName || user?.email || 'User')}`} />
                        <AvatarFallback>{(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm" onClick={signOutUser}>Sign out</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link href="/signin"><Button size="sm">Sign in</Button></Link>
                      <Link href="/signup"><Button size="sm" variant="secondary">Sign up</Button></Link>
                    </div>
                  )
                ) : null}
              </div>
            </header>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </SidebarInset>
        </SidebarProvider>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  return (
    <BalanceProvider>
      <DashboardSidebar>{children}</DashboardSidebar>
      {/* XP Manager for level-up animations */}
      <XPManager userId={user?.id} showDisplay={false} showAnimations={true} />
    </BalanceProvider>
  );
}


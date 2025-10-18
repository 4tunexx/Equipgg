

'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { useAuth } from "../../../hooks/use-auth";
import { createSupabaseQueries } from "../../../lib/supabase/queries";
import { supabase } from "../../../lib/supabase/client";
import type { DBUser, DBItem, DBAchievement, DBInventoryItem } from "../../../lib/supabase/queries";
import { CheckCircle, Gem, Trophy, Copy, Upload, VenetianMask, Edit, BadgeCheck, History, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { UserAvatar } from "../../../components/user-avatar";
import { Progress } from "../../../components/ui/progress";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Badge as UiBadge } from "../../../components/ui/badge";
import { useToast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import { Switch } from "../../../components/ui/switch";
import { BettingHistory } from "../../../components/profile/betting-history";
import { TradeUpHistory } from "../../../components/profile/trade-up-history";
import { MiniProfileCard } from "../../../components/mini-profile-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useBalance } from "../../../contexts/balance-context";
import { useState, useEffect } from "react";
import { getRoleColors, getRoleInlineStyle } from "../../../lib/role-colors";
import { XpDisplay } from "../../../components/xp-display";


export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const { balance } = useBalance();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState({
    items: 0,
    betsWon: 0,
    winRate: 0
  });
  const [achievements, setAchievements] = useState<any>({});
  const [userHistory, setUserHistory] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [ranks, setRanks] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const referralCode = "REF-4F2B9A1C";
  // Fetch ranks from database - use user API instead of admin API
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        // Try user ranks API first, fallback to admin API
        let response = await fetch('/api/user/ranks', { credentials: 'include' });
        if (!response.ok) {
          response = await fetch('/api/admin/ranks');
        }
        if (response.ok) {
          const data = await response.json();
          setRanks(data.ranks || []);
        }
      } catch (error) {
        console.error('Error fetching ranks:', error);
        // Set empty ranks array instead of mock data
        setRanks([]);
      }
    };

    fetchRanks();
  }, []);

  // Fetch user badges from database
  useEffect(() => {
    const fetchUserBadges = async () => {
      let username = user?.username;
      
      // If no username in user context, try to fetch from /api/me
      if (!username) {
        console.log('No username in user context, checking /api/me...');
        try {
          const meResponse = await fetch('/api/me', { credentials: 'include' });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log('User data from /api/me:', meData);
            if (meData.user?.username) {
              username = meData.user.username;
            } else if (meData.user?.email) {
              // If no username but has email, try to derive username
              const emailUsername = meData.user.email.split('@')[0];
              username = emailUsername;
              console.log('Using email-derived username:', username);
            }
          }
        } catch (error) {
          console.error('Error fetching user from /api/me:', error);
        }
      }

      // If we have a username, try to fetch real badges
      if (username) {
        try {
          console.log('Fetching badges for username:', username);
          const response = await fetch(`/api/user/${username}/badges`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Badges API response:', data);
            setUserBadges(data.badges || []);
            return; // Exit early on success
          } else {
            console.error('Badge API response not ok:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching user badges:', error);
        }
      }
      
      // If we reach here, show fallback badges
      console.log('Using fallback badges - no username or API failed');
      setUserBadges([
        { id: 1, name: 'First Win', description: 'Win your first bet', category: 'Betting', rarity: 'Common', earned: true, icon_url: null },
        { id: 2, name: 'Lucky Streak', description: 'Win 5 bets in a row', category: 'Betting', rarity: 'Rare', earned: false, icon_url: null },
        { id: 3, name: 'Service Medal - Level 1', description: 'Awarded for reaching Level 1', category: 'Level', rarity: 'Common', earned: true, icon_url: null },
      ]);
    };

    fetchUserBadges();
  }, [user?.username]);

  const getRankByLevel = (level: number) => {
    // Find the appropriate rank based on actual level
    const currentRank = ranks.find(rank =>
      level >= rank.min_level && (rank.max_level === null || level <= rank.max_level)
    );
    return currentRank?.name || 'Unranked';
  };
  
  const achievedItems = new Set([
    "First Win Badge",
    "Lucky Streak Badge",
    "High Roller Badge"
  ]);
  
  const equippedItems = {
    primary: { id: "ak47-redline", name: "AK-47 | Redline" },
    secondary: { id: "glock-fade", name: "Glock-18 | Fade" },
    knife: { id: "karambit-doppler", name: "Karambit | Doppler" }
  };
  
  const inventoryData = [
    { id: "ak47-redline", name: "AK-47 | Redline" },
    { id: "m4a4-asiimov", name: "M4A4 | Asiimov" },
    { id: "glock-fade", name: "Glock-18 | Fade" }
  ];
  
  const referrals = [
    { id: "1", name: "Player123", username: "Player123", date: "2024-01-15", status: "active", bonus: 500 },
    { id: "2", name: "GamerPro", username: "GamerPro", date: "2024-01-20", status: "active", bonus: 300 }
  ];
  
  // Fetch user stats from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileResponse, achievementsResponse, historyResponse] = await Promise.all([
          fetch('/api/user/profile', { credentials: 'include' }),
          fetch('/api/user/achievements', { credentials: 'include' }),
          fetch('/api/user/history', { credentials: 'include' })
        ]);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.profile) {
            setUserStats({
              items: profileData.profile.stats.itemCount || 0,
              betsWon: profileData.profile.stats.betsWon || 0,
              winRate: profileData.profile.stats.winRate || 0
            });
            // Set username from profile data
            setUsername(profileData.profile.user.displayName || '');
          }
        }
        
        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          if (achievementsData.success) {
            // Use categories data which groups achievements by category
            const categorizedData: any = {};
            if (achievementsData.categories && Array.isArray(achievementsData.categories)) {
              achievementsData.categories.forEach((category: any) => {
                categorizedData[category.name] = category.achievements || [];
              });
            }
            setAchievements(categorizedData);
          }
        }
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.success) {
            setUserHistory(historyData.history);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    if (user) {
      setUsername(user.displayName || user.email?.split('@')[0] || '');
      setEmail(user.email || '');
      fetchUserData();
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }
  
  const isVip = user.role === 'vip';
  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const avatarUrl = (user as any).avatar_url || user.photoURL || user.steamProfile?.avatar;
  const roleColors = getRoleColors(user.role || 'user');
  const roleInlineStyle = getRoleInlineStyle(user.role || 'user');

  // Fix the UserAvatar props to use the correct field mapping
  const userAvatarProps = {
    username: displayName,
    avatar_url: (user as any).avatar_url,
    avatar: user.photoURL,
    role: user.role,
    provider: user.provider,
    steam_verified: (user as any).steam_verified,
    steam_id: (user as any).steam_id,
    steamProfile: user.steamProfile
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied to clipboard!",
      description: "Your referral code has been copied.",
    });
  };

  // Refresh user data after avatar/profile updates
  const refreshUserData = async () => {
    if (refreshUser) {
      await refreshUser();
    }
    // Also refresh profile data
    const profileResponse = await fetch('/api/user/profile', { credentials: 'include' });
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      if (profileData.success && profileData.profile) {
        setUsername(profileData.profile.user.displayName || '');
      }
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 1MB.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Avatar updated!",
          description: "Your avatar has been successfully updated.",
        });
        // Refresh user data instead of reloading the page
        await refreshUserData();
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload avatar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading your avatar.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Avatar removed!",
          description: "Your avatar has been reset to default.",
        });
        // Refresh user data instead of reloading the page
        await refreshUserData();
      } else {
        toast({
          title: "Removal failed",
          description: result.error || "Failed to remove avatar.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Avatar removal error:', error);
      toast({
        title: "Removal failed",
        description: "An error occurred while removing your avatar.",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async () => {
    if (!username.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid username.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: username }),
        credentials: 'include',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Profile updated!",
          description: "Your profile has been successfully updated.",
        });
        // Refresh user data instead of reloading the page
        await refreshUserData();
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update profile.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* User Profile Card */}
      <Card className="overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-secondary h-24" />
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-end gap-4 -mt-12">
            <UserAvatar user={userAvatarProps} size="lg" className={cn("w-24 h-24 border-4 border-background ring-2 ring-primary", isVip && "ring-purple-400")} />
            <div>
              <h1 className={cn("text-2xl font-bold font-headline", isVip && "text-purple-400 animate-pulse", roleColors.text)} style={roleInlineStyle}>{displayName}</h1>
              <p className="text-muted-foreground">{user.provider === 'steam' ? 'Steam User' : 'Registered User'}</p>
            </div>
             {isVip && <BadgeCheck className="w-6 h-6 text-purple-400" />}
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <XpDisplay 
                xp={balance?.xp || 0} 
                level={balance?.level || 1}
                userId={user?.id}
                autoFetch={true}
                className=""
                progressClassName="h-3"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <Card className="bg-secondary/50 p-3">
                <p className="text-xl font-bold">{(balance?.coins || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Coins</p>
              </Card>
              <Card className="bg-secondary/50 p-3">
                <p className="text-xl font-bold text-yellow-500">{(balance?.gems || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Gems</p>
              </Card>
              <Card className="bg-secondary/50 p-3">
                <p className="text-xl font-bold">{userStats.items}</p>
                <p className="text-xs text-muted-foreground">Items</p>
              </Card>
               <Card className="bg-secondary/50 p-3">
                <p className="text-xl font-bold">{userStats.betsWon}</p>
                <p className="text-xs text-muted-foreground">Bets Won</p>
              </Card>
               <Card className="bg-secondary/50 p-3">
                <p className="text-xl font-bold">{userStats.winRate}%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="showcase" className="w-full">
        <TabsList>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="ranks">Ranks</TabsTrigger>
          <TabsTrigger value="showcase">Profile Card</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="gem-history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Gem History
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="achievements" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Track your progress and unlock rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(achievements).length > 0 ? (
                Object.entries(achievements).map(([category, items]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-xl font-bold mb-2">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.isArray(items) ? items.map((item: any) => {
                        const isAchieved = item.achieved || item.unlocked || item.unlocked_at;
                        return (
                          <Card key={item.id} className={cn(
                            "transition-all hover:scale-105",
                            isAchieved ? "bg-secondary/50 border-green-500/20" : "bg-secondary/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                          )}>
                            <CardHeader className="flex-row items-center gap-4">
                              <Trophy className={cn(
                                "w-6 h-6",
                                isAchieved ? "text-yellow-500" : "text-muted-foreground"
                              )}/>
                              <div className="flex-1">
                                <p className={cn(
                                  "font-semibold",
                                  isAchieved && "text-green-600"
                                )}>
                                  {item.title || item.name}
                                  {isAchieved && " ✓"}
                                </p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                {(item.reward_xp || item.xp_reward) && (
                                  <p className="text-xs text-yellow-600">
                                    +{item.reward_xp || item.xp_reward} XP
                                  </p>
                                )}
                                {(item.reward_coins || item.coin_reward) && (
                                  <p className="text-xs text-green-600">
                                    +{item.reward_coins || item.coin_reward} Coins
                                  </p>
                                )}
                                {isAchieved && (
                                  <UiBadge variant="default" className="text-xs bg-green-600 mt-1">
                                    Unlocked
                                  </UiBadge>
                                )}
                              </div>
                            </CardHeader>
                          </Card>
                        );
                      }) : <p className="text-muted-foreground">Invalid achievement data for category: {category}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No achievements available yet. Start playing to unlock achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="badges" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Your earned achievement badges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBadges.map((badge) => {
                    const isEarned = badge.earned || badge.earned_at;
                    return (
                      <Card key={badge.id} className={cn(
                        "transition-all",
                        isEarned ? "bg-secondary/50 border-green-500/20" : "bg-secondary/50 opacity-60 grayscale"
                      )}>
                        <CardHeader className="flex-row items-center gap-4">
                          {badge.icon_url ? (
                            <img
                              src={badge.icon_url}
                              alt={badge.name}
                              className={cn(
                                "w-8 h-8 rounded",
                                !isEarned && "grayscale opacity-50"
                              )}
                              onError={(e) => {
                                e.currentTarget.src = `/badges/${badge.name.toLowerCase().replace(/\s+/g, '')}.png`;
                              }}
                            />
                          ) : (
                            <Award className={cn(
                              "w-6 h-6",
                              isEarned ? "text-primary" : "text-muted-foreground"
                            )}/>
                          )}
                          <div className="flex-1">
                            <p className={cn(
                              "font-semibold",
                              isEarned && "text-green-600"
                            )}>
                              {badge.name}
                              {isEarned && " ✓"}
                            </p>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                            <div className="flex gap-2 mt-1">
                              <UiBadge variant="secondary" className="text-xs">
                                {badge.category}
                              </UiBadge>
                              <UiBadge variant="outline" className="text-xs">
                                {badge.rarity}
                              </UiBadge>
                              {isEarned && (
                                <UiBadge variant="default" className="text-xs bg-green-600">
                                  Earned
                                </UiBadge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {user?.username 
                      ? `No badges loaded for user: ${user.username}` 
                      : 'Please log in to view your badges'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Check browser console for API debugging info
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ranks" className="mt-4">
           <Card>
            <CardHeader>
              <CardTitle>Ranks</CardTitle>
              <CardDescription>Your rank is determined by your Level. You earn a new rank for every two levels you gain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Competitive Ranks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ranks.map((rank, index) => {
                    const userLevel = balance?.level || 1;
                    const currentRankName = getRankByLevel(userLevel);
                    const isCurrentRank = rank.name === currentRankName;
                    const isAchieved = userLevel >= rank.min_level;

                    return (
                      <Card key={rank.id} className={cn(
                        "transition-all",
                        isCurrentRank ? "bg-primary/20 border-primary" : "bg-secondary/50",
                        !isAchieved && "opacity-50 grayscale"
                      )}>
                        <CardHeader className="flex-row items-center gap-4">
                           <CheckCircle className={cn(
                             "w-6 h-6",
                             isCurrentRank ? "text-primary" : isAchieved ? "text-green-500" : "text-muted-foreground"
                           )}/>
                           <div>
                            <p className={cn(
                              "font-semibold",
                              isCurrentRank && "text-primary"
                            )}>
                              {rank.name}
                              {isCurrentRank && " (Current)"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Level: {rank.min_level}{rank.max_level ? ` - ${rank.max_level}` : '+'} | Tier: {rank.tier}
                            </p>
                           </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
                <div className="mt-6 pt-6 border-t">
                    <h3 className="text-xl font-bold mb-2">Prestige Ranks ✨</h3>
                    <p className="text-muted-foreground">When you reach Level 100, you can choose to Prestige. This resets your level to 1, increases your prestige rank, and gives your base rank icons a new, elite appearance to show off your dedication.</p>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="showcase" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Your Profile Card Showcase</CardTitle>
                    <CardDescription>Choose what others see when they hover over your name. New slots unlock as you level up.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="flex items-center justify-center p-4 bg-secondary/30 rounded-lg">
                         <MiniProfileCard user={{
                           name: user?.displayName || 'User',
                           avatar: (user as any)?.avatar_url || user?.photoURL,
                           dataAiHint: 'user profile',
                           xp: balance?.xp || 0,
                           level: balance?.level || 1,
                           rank: 1,
                           role: user?.role || 'player'
                         }} />
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                           <Label htmlFor="showcase-achievement">Showcase Achievement (Unlocked at Lvl 5)</Label>
                            <Select defaultValue="master-predictor" disabled={(balance?.level || 0) < 5}>
                                <SelectTrigger id="showcase-achievement">
                                    <SelectValue placeholder="Select an achievement" />
                                </SelectTrigger>
                                <SelectContent>
                                   {Array.from(achievedItems).map(item => <SelectItem key={item} value={item.toLowerCase().replace(/\s/g, '-')}>{item}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="showcase-item">Showcase Item (Unlocked at Lvl 10)</Label>
                            <Select defaultValue={equippedItems.primary.id} disabled={(balance?.level || 0) < 10}>
                                <SelectTrigger id="showcase-item">
                                    <SelectValue placeholder="Select an item from your inventory" />
                                </SelectTrigger>
                                <SelectContent>
                                   {inventoryData.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="showcase-item-2">Showcase Item 2 (Unlocked at Lvl 25)</Label>
                            <Select defaultValue={equippedItems.secondary.id} disabled={(balance?.level || 0) < 25}>
                                <SelectTrigger id="showcase-item-2">
                                    <SelectValue placeholder="Select an item from your inventory" />
                                </SelectTrigger>
                                <SelectContent>
                                   {inventoryData.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="showcase-item-3">Showcase Item 3 (Unlocked at Lvl 50)</Label>
                            <Select defaultValue={equippedItems.knife.id} disabled={(balance?.level || 0) < 50}>
                                <SelectTrigger id="showcase-item-3">
                                    <SelectValue placeholder="Select an item from your inventory" />
                                </SelectTrigger>
                                <SelectContent>
                                   {inventoryData.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="showcase-rank">Showcase Rank (Unlocked at Lvl 10)</Label>
                           <Input id="showcase-rank" value={getRankByLevel(balance?.level || 1) || 'No Rank'} disabled />
                           <p className="text-xs text-muted-foreground">Your highest achieved rank is always shown.</p>
                        </div>
                        <Button>
                            <Edit className="mr-2 h-4 w-4"/>
                            Save Showcase
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="history" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Betting History</CardTitle>
              </CardHeader>
              <CardContent>
                {userHistory?.betting && userHistory.betting.length > 0 ? (
                  <div className="space-y-4">
                    {userHistory.betting.map((bet: any) => (
                      <div key={bet.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                        <div>
                          <p className="font-semibold">{bet.match}</p>
                          <p className="text-sm text-muted-foreground">Bet: {bet.bet} • Amount: {bet.amount} coins</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-semibold", bet.result === 'won' ? 'text-green-400' : 'text-red-400')}>
                            {bet.result === 'won' ? `+${bet.payout}` : `-${bet.amount}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(bet.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No betting history yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trade-Up History</CardTitle>
              </CardHeader>
              <CardContent>
                {userHistory?.tradeUp && userHistory.tradeUp.length > 0 ? (
                  <div className="space-y-4">
                    {userHistory.tradeUp.map((trade: any) => (
                      <div key={trade.id} className="p-4 bg-secondary/50 rounded-lg">
                        <p className="font-semibold mb-2">Trade-Up Result</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Input: {trade.inputItems.join(', ')}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Output: {trade.outputItem}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No trade-up history yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="settings" className="mt-4">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your public profile information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <Avatar className="w-20 h-20">
                            <AvatarImage src={(user as any).avatar_url || user.photoURL || user.steamProfile?.avatar} data-ai-hint="user avatar" />
                            <AvatarFallback>{(user.displayName || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                             <input
                                type="file"
                                id="avatar-upload"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                             <Button
                                onClick={() => document.getElementById('avatar-upload')?.click()}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Change Avatar
                            </Button>
                            {user.photoURL && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAvatarRemove}
                                >
                                    Remove Avatar
                                </Button>
                            )}
                            <p className="text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support if needed.</p>
                  </div>
                  <Button 
                    onClick={handleProfileUpdate} 
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? "Saving..." : "Save Profile Changes"}
                  </Button>
                   <div className="space-y-2">
                        <Label>Connect Account</Label>
                         <Button variant="outline" className="w-full justify-start">
                            <VenetianMask className="mr-2 h-4 w-4" />
                            Connect with Steam
                        </Button>
                        <p className="text-xs text-muted-foreground">Connect your Steam account to sync your avatar and display a verification badge.</p>
                   </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>
              <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Choose how you want to be notified.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Notification Type</TableHead>
                                <TableHead className="text-center w-32">Email</TableHead>
                                <TableHead className="text-center w-32">Push</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>
                                    <p className="font-medium">Match Reminders</p>
                                    <p className="text-xs text-muted-foreground">Get notified 15 minutes before a match you bet on starts.</p>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch id="email-match-reminders" defaultChecked />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch id="push-match-reminders" defaultChecked />
                                </TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>
                                    <p className="font-medium">Bet Results</p>
                                    <p className="text-xs text-muted-foreground">Receive an update as soon as a match you bet on is finished.</p>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch id="email-bet-results" />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Switch id="push-bet-results" defaultChecked />
                                </TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>
                                    <p className="font-medium">Level Up & Rewards</p>
                                    <p className="text-xs text-muted-foreground">Get notified when you level up or receive a special reward.</p>
                                </TableCell>
                               <TableCell className="text-center">
                                    <Switch id="email-level-up" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch id="push-level-up" defaultChecked />
                                </TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>
                                    <p className="font-medium">New Promotions</p>
                                    <p className="text-xs text-muted-foreground">Stay up-to-date with new crates, events, and special offers.</p>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch id="email-promotions" defaultChecked />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Switch id="push-promotions" />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                      </Table>
                  </CardContent>
                   <CardFooter>
                     <Button>Save Notification Settings</Button>
                  </CardFooter>
                </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Program</CardTitle>
                  <CardDescription>Invite friends and earn rewards when they join and play.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="referral-code">Your Unique Referral Code</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input id="referral-code" value={referralCode} readOnly className="font-mono bg-secondary/50"/>
                        <Button variant="outline" size="icon" onClick={handleCopy}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Your Referrals</h4>
                       <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Friend</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrals.map((ref) => (
                            <TableRow key={ref.id}>
                              <TableCell className="font-medium">{ref.name}</TableCell>
                              <TableCell className="text-xs">{ref.date}</TableCell>
                              <TableCell>
                                 <UiBadge variant={ref.status === 'Completed' ? 'default' : 'secondary'} className={cn(ref.status === 'Completed' ? 'bg-green-600' : '','text-xs')}>
                                  {ref.status}
                                </UiBadge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Rewards are credited to your account once your friend completes the onboarding missions.
                    </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gem-history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Gem Transaction History
              </CardTitle>
              <CardDescription>View your gem transactions and purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Gem History</h3>
                <p className="text-muted-foreground mb-4">
                  Your gem transaction history is now integrated into your profile!
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
                    <Gem className="h-5 w-5 text-purple-500" />
                    <span className="font-bold">{balance?.gems?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">Gems Available</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Track all your gem purchases, exchanges, and CS2 skin transactions here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



'use client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../components/ui/alert-dialog";
import { useAuth } from "../../../hooks/use-auth";
import { createSupabaseQueries } from "../../../lib/supabase/queries";
import { supabase } from "../../../lib/supabase/client";
import type { DBUser, DBItem, DBAchievement, DBInventoryItem } from "../../../lib/supabase/queries";
import { CheckCircle, Gem, Trophy, Copy, Upload, VenetianMask, Edit, BadgeCheck, History, Award, Coins, Target, TrendingUp, Trash2, Mail, Bell, MessageSquare } from "lucide-react";
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
import { getBannerGradient, PROFILE_BANNERS, getBannerById } from "../../../lib/profile-banners";
import { XpDisplay } from "../../../components/xp-display";


export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const { balance } = useBalance();
  const { toast } = useToast();
  const [currentBanner, setCurrentBanner] = useState<string | undefined>(user?.equipped_banner);
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
  const [referralCode, setReferralCode] = useState('');
  const [referredUsers, setReferredUsers] = useState<any[]>([]);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  const [gemHistory, setGemHistory] = useState<any[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<any>({});
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [claimingAchievement, setClaimingAchievement] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFinalDeleteWarning, setShowFinalDeleteWarning] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  // Showcase tab state
  const [showcaseAchievement, setShowcaseAchievement] = useState<string>('');
  const [showcaseItem1, setShowcaseItem1] = useState<string>('');
  const [showcaseItem2, setShowcaseItem2] = useState<string>('');
  const [showcaseItem3, setShowcaseItem3] = useState<string>('');
  const [userInventory, setUserInventory] = useState<any[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<any[]>([]);
  // Cosmetics state
  const [ownedCosmetics, setOwnedCosmetics] = useState<any[]>([]);
  const [isLoadingCosmetics, setIsLoadingCosmetics] = useState(true);
  const [equippingBanner, setEquippingBanner] = useState<string | null>(null);
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
  
  // Mock data removed - using real data from state (unlockedAchievements, userInventory)
  
  const referrals = [
    { id: "1", name: "Player123", username: "Player123", date: "2024-01-15", status: "active", bonus: 500 },
    { id: "2", name: "GamerPro", username: "GamerPro", date: "2024-01-20", status: "active", bonus: 300 }
  ];
  
  // Fetch all new data from new APIs
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          referralResponse,
          activityResponse,
          gemHistoryResponse,
          notificationPrefsResponse,
          emailStatusResponse
        ] = await Promise.all([
          fetch('/api/user/referral', { credentials: 'include' }),
          fetch('/api/user/activity-history', { credentials: 'include' }),
          fetch('/api/user/gem-history', { credentials: 'include' }),
          fetch('/api/user/notification-preferences', { credentials: 'include' }),
          fetch('/api/user/confirm-email', { credentials: 'include' })
        ]);

        if (referralResponse.ok) {
          const data = await referralResponse.json();
          if (data.success) {
            setReferralCode(data.referralCode);
            setReferredUsers(data.referredUsers || []);
          }
        }

        if (activityResponse.ok) {
          const data = await activityResponse.json();
          if (data.success) {
            setActivityHistory(data.activities || []);
          }
        }

        if (gemHistoryResponse.ok) {
          const data = await gemHistoryResponse.json();
          if (data.success) {
            setGemHistory(data.transactions || []);
          }
        }

        if (notificationPrefsResponse.ok) {
          const data = await notificationPrefsResponse.json();
          if (data.success) {
            setNotificationPrefs(data.preferences || {});
          }
        }

        if (emailStatusResponse.ok) {
          const data = await emailStatusResponse.json();
          if (data.success) {
            setEmailConfirmed(data.emailConfirmed || false);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Fetch owned cosmetics
  useEffect(() => {
    const fetchOwnedCosmetics = async () => {
      if (!user) {
        setIsLoadingCosmetics(false);
        return;
      }
      setIsLoadingCosmetics(true);
      try {
        const response = await fetch(`/api/cosmetics/owned?t=${Date.now()}`, { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOwnedCosmetics(data.cosmetics || []);
        }
      } catch (error) {
        console.error('Failed to fetch owned cosmetics:', error);
      } finally {
        setIsLoadingCosmetics(false);
      }
    };
    fetchOwnedCosmetics();
  }, [user, user?.equipped_banner]);

  // Handle banner equip
  const handleEquipBanner = async (bannerId: string) => {
    setEquippingBanner(bannerId);
    try {
      const response = await fetch('/api/cosmetics/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cosmeticId: bannerId })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Banner equipped!",
          description: data.message || "Your new banner is now active!"
        });
        
        // Update local state immediately for instant UI update
        setCurrentBanner(bannerId);
        
        // Update ownedCosmetics to reflect the new equipped status
        setOwnedCosmetics(prev => prev.map(cosmetic => ({
          ...cosmetic,
          equipped: cosmetic.cosmetic_id === bannerId
        })));
        
        // Dispatch events to update banner everywhere
        window.dispatchEvent(new CustomEvent('bannerEquipped', { 
          detail: { bannerId } 
        }));
        window.dispatchEvent(new Event('userUpdated'));
        window.dispatchEvent(new Event('balanceUpdated'));
        
        // Force immediate refresh with cache busting
        await refreshUser();
        
        // Refetch cosmetics to ensure everything is in sync
        setTimeout(async () => {
          try {
            const response = await fetch('/api/cosmetics/owned', { credentials: 'include' });
            if (response.ok) {
              const data = await response.json();
              setOwnedCosmetics(data.cosmetics || []);
            }
          } catch (error) {
            console.error('Failed to refresh cosmetics:', error);
          }
        }, 500);
        
        // Force multiple refreshes to ensure UI updates everywhere
        setTimeout(() => {
          refreshUser();
        }, 100);
        setTimeout(() => {
          refreshUser();
        }, 500);
        setTimeout(() => {
          refreshUser();
        }, 1000);
      } else {
        toast({
          title: "Failed to equip banner",
          description: data.error || "An error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Equip error:', error);
      toast({
        title: "Error",
        description: "An error occurred while equipping the banner.",
        variant: "destructive"
      });
    } finally {
      setEquippingBanner(null);
    }
  };

  // Update current banner when user changes or component mounts
  useEffect(() => {
    // Always sync with user's equipped_banner from database
    const bannerFromUser = user?.equipped_banner;
    if (bannerFromUser) {
      setCurrentBanner(bannerFromUser);
    } else if (bannerFromUser === null || bannerFromUser === undefined) {
      // If no banner set, use default
      setCurrentBanner('banner_default');
    }
  }, [user?.equipped_banner, user?.id]);

  // Listen for banner equip events to refresh user data
  useEffect(() => {
    const handleBannerEquipped = (event: CustomEvent) => {
      if (event.detail?.bannerId) {
        setCurrentBanner(event.detail.bannerId);
      }
      refreshUser();
    };
    
    const handleUserUpdate = () => {
      refreshUser();
    };
    
    window.addEventListener('bannerEquipped', handleBannerEquipped as EventListener);
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('bannerEquipped', handleBannerEquipped as EventListener);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, [refreshUser]);

  // Fetch showcase data and inventory
  useEffect(() => {
    const fetchShowcaseData = async () => {
      try {
        const [showcaseRes, inventoryRes] = await Promise.all([
          fetch('/api/user/showcase', { credentials: 'include' }),
          fetch('/api/inventory', { credentials: 'include' })
        ]);

        if (showcaseRes.ok) {
          const showcaseData = await showcaseRes.json();
          if (showcaseData.success && showcaseData.showcase) {
            setShowcaseAchievement(showcaseData.showcase.achievement_id?.toString() || '');
            setShowcaseItem1(showcaseData.showcase.item_id_1 || '');
            setShowcaseItem2(showcaseData.showcase.item_id_2 || '');
            setShowcaseItem3(showcaseData.showcase.item_id_3 || '');
          }
        }

        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json();
          if (inventoryData.success && inventoryData.inventory) {
            setUserInventory(inventoryData.inventory);
          }
        }
      } catch (error) {
        console.error('Error fetching showcase data:', error);
      }
    };

    if (user) {
      fetchShowcaseData();
    }
  }, [user]);
  
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
            const unlockedList: any[] = [];
            if (achievementsData.categories && Array.isArray(achievementsData.categories)) {
              achievementsData.categories.forEach((category: any) => {
                categorizedData[category.name] = category.achievements || [];
                // Extract unlocked achievements for showcase
                category.achievements?.forEach((ach: any) => {
                  if (ach.unlocked) {
                    unlockedList.push(ach);
                  }
                });
              });
            }
            setAchievements(categorizedData);
            setUnlockedAchievements(unlockedList);
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
      setUsername(user.displayName || user.email?.split('@')[0] || user.username || '');
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

  const handleClaimAchievement = async (achievementId: number) => {
    setClaimingAchievement(achievementId);
    try {
      const response = await fetch('/api/user/achievements/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ achievementId })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Achievement Claimed!",
          description: `You earned ${result.rewards.coins} coins, ${result.rewards.gems} gems, and ${result.rewards.xp} XP!`,
        });
        
        // Refresh user data to update balance
        await refreshUser();
        
        // Refresh achievements
        const achievementsResponse = await fetch('/api/user/achievements', { credentials: 'include' });
        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          if (achievementsData.success) {
            const categorizedData: any = {};
            if (achievementsData.categories && Array.isArray(achievementsData.categories)) {
              achievementsData.categories.forEach((category: any) => {
                categorizedData[category.name] = category.achievements || [];
              });
            }
            setAchievements(categorizedData);
          }
        }
      } else {
        toast({
          title: "Claim failed",
          description: result.error || "Failed to claim achievement.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Achievement claim error:', error);
      toast({
        title: "Claim failed",
        description: "An error occurred while claiming the achievement.",
        variant: "destructive",
      });
    } finally {
      setClaimingAchievement(null);
    }
  };

  const handleConfirmEmail = async () => {
    // For Steam users, validate the new email input
    if ((user?.provider === 'steam' || email.includes('@steam.local')) && !newEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingEmail(true);
    try {
      const response = await fetch('/api/user/confirm-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          newEmail: (user?.provider === 'steam' || email.includes('@steam.local')) ? newEmail : undefined 
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setEmailConfirmed(true);
        if (newEmail) {
          setEmail(newEmail); // Update email state
        }
        toast({
          title: "Email Confirmed!",
          description: result.message || `You earned 10 coins!`,
        });
        setNewEmail('');
        
        // Refresh user data to update balance
        await refreshUser();
      } else {
        toast({
          title: "Confirmation failed",
          description: result.error || "Failed to confirm email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      toast({
        title: "Confirmation failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAddingEmail(false);
    }
  };

  const handleSaveNotificationPrefs = async () => {
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(notificationPrefs)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Settings Saved!",
          description: "Your notification preferences have been updated.",
        });
      } else {
        toast({
          title: "Save failed",
          description: result.error || "Failed to save preferences.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save preferences error:', error);
      toast({
        title: "Save failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleInitiateDelete = () => {
    setShowDeleteDialog(true);
    setDeleteConfirmation('');
  };

  const handleFirstConfirmation = () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE exactly as shown.",
        variant: "destructive",
      });
      return;
    }
    
    setShowDeleteDialog(false);
    setShowFinalDeleteWarning(true);
  };

  const handleFinalDelete = async () => {
    setShowFinalDeleteWarning(false);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmation: 'DELETE' })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted. Redirecting...",
        });
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        toast({
          title: "Deletion failed",
          description: result.error || "Failed to delete account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Deletion failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleSaveShowcase = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          achievement_id: showcaseAchievement ? parseInt(showcaseAchievement) : null,
          item_id_1: showcaseItem1 || null,
          item_id_2: showcaseItem2 || null,
          item_id_3: showcaseItem3 || null
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Showcase Saved!",
          description: result.message || "Your profile showcase has been updated.",
        });
      } else {
        toast({
          title: "Save failed",
          description: result.error || "Failed to save showcase settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Showcase save error:', error);
      toast({
        title: "Save failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* User Profile Card */}
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="p-0">
          <div 
            className="h-32" 
            style={{ background: getBannerGradient(currentBanner || user?.equipped_banner || 'banner_default') }}
          />
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-end gap-4 -mt-16">
            <div className="w-24 h-24 rounded-full border-4 border-background ring-2 ring-primary shadow-lg overflow-hidden bg-secondary">
              {(user as any)?.avatar_url || user?.photoURL ? (
                <img 
                  src={(user as any)?.avatar_url || user?.photoURL || ''} 
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-3xl font-bold">
                    {(displayName || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
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
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-green-500" />
                  <p className="text-xl font-bold text-green-500">{(balance?.coins || 0).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">Coins</p>
              </Card>
              <Card className="bg-secondary/50 p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gem className="w-5 h-5 text-purple-500" />
                  <p className="text-xl font-bold text-purple-500">{(balance?.gems || 0).toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">Gems</p>
              </Card>
              <Card className="bg-secondary/50 p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-blue-500" />
                <p className="text-xl font-bold">{userStats.items}</p>
                </div>
                <p className="text-xs text-muted-foreground">Items</p>
              </Card>
               <Card className="bg-secondary/50 p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-orange-500" />
                <p className="text-xl font-bold">{userStats.betsWon}</p>
                </div>
                <p className="text-xs text-muted-foreground">Bets Won</p>
              </Card>
               <Card className="bg-secondary/50 p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                <p className="text-xl font-bold">{userStats.winRate}%</p>
                </div>
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
          <TabsTrigger value="delete-account" className="flex items-center gap-2 text-red-500">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </TabsTrigger>
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
                                {isAchieved ? (
                                  <UiBadge variant="default" className="text-xs bg-green-600 mt-1">
                                    Unlocked
                                  </UiBadge>
                                ) : item.unlocked && !item.claimed ? (
                                  <Button
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => handleClaimAchievement(item.id)}
                                    disabled={claimingAchievement === item.id}
                                  >
                                    {claimingAchievement === item.id ? 'Claiming...' : 'Claim Reward'}
                                  </Button>
                                ) : null}
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
                           ...user,
                           equipped_banner: currentBanner || user?.equipped_banner,
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
                            <Select 
                              value={showcaseAchievement} 
                              onValueChange={setShowcaseAchievement}
                              disabled={(balance?.level || 0) < 5}
                            >
                                <SelectTrigger id="showcase-achievement">
                                    <SelectValue placeholder="Select an achievement" />
                                </SelectTrigger>
                                <SelectContent>
                                   {unlockedAchievements.map(ach => (
                                     <SelectItem key={ach.id} value={ach.id.toString()}>
                                       {ach.name}
                                     </SelectItem>
                                   ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="showcase-item">Showcase Item (Unlocked at Lvl 10)</Label>
                            <Select 
                              value={showcaseItem1} 
                              onValueChange={setShowcaseItem1}
                              disabled={(balance?.level || 0) < 10}
                            >
                                <SelectTrigger id="showcase-item">
                                    <SelectValue placeholder="Select an item from your inventory" />
                                </SelectTrigger>
                                <SelectContent>
                                   {userInventory.map(item => (
                                     <SelectItem key={item.id} value={item.item_id || item.id}>
                                       {item.items?.name || item.name || 'Unknown Item'}
                                     </SelectItem>
                                   ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="showcase-item-2">Showcase Item 2 (Unlocked at Lvl 25)</Label>
                            <Select 
                              value={showcaseItem2} 
                              onValueChange={setShowcaseItem2}
                              disabled={(balance?.level || 0) < 25}
                            >
                                <SelectTrigger id="showcase-item-2">
                                    <SelectValue placeholder="Select an item from your inventory" />
                                </SelectTrigger>
                                <SelectContent>
                                   {userInventory.map(item => (
                                     <SelectItem key={item.id} value={item.item_id || item.id}>
                                       {item.items?.name || item.name || 'Unknown Item'}
                                     </SelectItem>
                                   ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="showcase-item-3">Showcase Item 3 (Unlocked at Lvl 50)</Label>
                            <Select 
                              value={showcaseItem3} 
                              onValueChange={setShowcaseItem3}
                              disabled={(balance?.level || 0) < 50}
                            >
                                <SelectTrigger id="showcase-item-3">
                                    <SelectValue placeholder="Select an item from your inventory" />
                                </SelectTrigger>
                                <SelectContent>
                                   {userInventory.map(item => (
                                     <SelectItem key={item.id} value={item.item_id || item.id}>
                                       {item.items?.name || item.name || 'Unknown Item'}
                                     </SelectItem>
                                   ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                           <Label htmlFor="showcase-rank">Showcase Rank (Unlocked at Lvl 10)</Label>
                           <Input id="showcase-rank" value={getRankByLevel(balance?.level || 1) || 'No Rank'} disabled />
                           <p className="text-xs text-muted-foreground">Your highest achieved rank is always shown.</p>
                        </div>
                        <Button onClick={handleSaveShowcase} disabled={isSaving}>
                            <Edit className="mr-2 h-4 w-4"/>
                            {isSaving ? 'Saving...' : 'Save Showcase'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="history" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>All your recent activities</CardDescription>
              </CardHeader>
              <CardContent>
                {activityHistory && activityHistory.length > 0 ? (
                  <div className="space-y-4">
                    {activityHistory.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {activity.type === 'bet' && <Target className="h-5 w-5 text-orange-500" />}
                          {activity.type === 'game' && <Trophy className="h-5 w-5 text-blue-500" />}
                          {activity.type === 'crate_opening' && <Award className="h-5 w-5 text-purple-500" />}
                          {activity.type === 'trade_up' && <TrendingUp className="h-5 w-5 text-cyan-500" />}
                          {activity.type === 'purchase' && <Coins className="h-5 w-5 text-green-500" />}
                          {activity.type === 'achievement' && <Trophy className="h-5 w-5 text-yellow-500" />}
                        <div>
                            <p className="font-semibold capitalize">{activity.type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {activity.type === 'bet' && `Bet ${activity.data?.amount || 0} coins • ${activity.data?.status || 'pending'}`}
                              {activity.type === 'game' && `${activity.data?.gameType || 'Unknown'} • Bet: ${activity.data?.bet || 0} • Won: ${activity.data?.payout || 0} coins`}
                              {activity.type === 'crate_opening' && (activity.data?.crateName || 'Crate Opened')}
                              {activity.type === 'trade_up' && 'Traded 5 items for better rarity'}
                              {activity.type === 'purchase' && (activity.data?.itemName || 'Item Purchased')}
                              {activity.type === 'achievement' && (activity.data?.name || 'Achievement Unlocked')}
                            </p>
                        </div>
                      </div>
                        <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No activity history yet. Start playing!</p>
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
                      value={username || ''}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email || ''}
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
              </Card>

              {/* Profile Cosmetics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-500" />
                    Profile Cosmetics
                  </CardTitle>
                  <CardDescription>
                    Customize your profile with unique banners. Purchase more in the Shop → Cosmetics tab.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingCosmetics ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-sm text-muted-foreground">Loading cosmetics...</p>
                      </div>
                    </div>
                  ) : ownedCosmetics.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {ownedCosmetics.map((cosmetic) => {
                        const banner = getBannerById(cosmetic.cosmetic_id);
                        if (!banner) return null;
                        
                        // Check if this banner is currently equipped (prioritize currentBanner state, then user data)
                        const equippedBannerId = currentBanner || user?.equipped_banner || 'banner_default';
                        const isEquipped = cosmetic.cosmetic_id === equippedBannerId;
                        const isEquipping = equippingBanner === cosmetic.cosmetic_id;

                        return (
                          <div key={cosmetic.cosmetic_id || cosmetic.id} className="border rounded-lg overflow-hidden">
                            {/* Banner Preview */}
                            <div 
                              className="h-20 relative"
                              style={{ background: banner.gradient }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white font-bold drop-shadow-lg">
                                  {banner.name}
                                </span>
                              </div>
                              {isEquipped && (
                                <div className="absolute top-2 right-2">
                                  <UiBadge variant="secondary" className="bg-green-500 text-white">
                                    ✓ Equipped
                                  </UiBadge>
                                </div>
                              )}
                            </div>

                            {/* Banner Info */}
                            <div className="p-4 flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{banner.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {banner.rarity}
                                </p>
                              </div>
                              <Button 
                                onClick={() => handleEquipBanner(cosmetic.cosmetic_id)}
                                disabled={isEquipped || isEquipping}
                                size="sm"
                                variant={isEquipped ? "secondary" : "default"}
                              >
                                {isEquipping ? 'Equipping...' : isEquipped ? 'Equipped' : 'Equip'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 bg-secondary/50 rounded-lg">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">
                        You don't own any profile banners yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Visit the Shop → Cosmetics tab to purchase banners with coins
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Email Confirmation Card (for all users including Steam) */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Confirmation</CardTitle>
                  <CardDescription>
                    {user?.provider === 'steam' 
                      ? 'Add your real email address to earn 10 coins and enable account recovery'
                      : 'Verify your email address to unlock all features'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {emailConfirmed && !email.includes('@steam.local') ? (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-600">Email Verified!</p>
                        <p className="text-sm text-muted-foreground">
                          Your email {email} is confirmed and verified.
                        </p>
                      </div>
                      <UiBadge variant="default" className="bg-green-600">
                        ✓ Verified
                      </UiBadge>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-amber-600">
                            {user?.provider === 'steam' || email.includes('@steam.local') 
                              ? 'No Real Email Added'
                              : 'Email Not Verified'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user?.provider === 'steam' || email.includes('@steam.local')
                              ? 'Add and verify a real email to earn 10 Coins and enable account recovery!'
                              : 'Confirm your email to earn 10 Coins and unlock all features!'}
                          </p>
                        </div>
                      </div>

                      {user?.provider === 'steam' || email.includes('@steam.local') ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="new-email">Enter Your Real Email Address</Label>
                            <Input
                              id="new-email"
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="your.email@example.com"
                              disabled={isAddingEmail}
                            />
                            <p className="text-xs text-muted-foreground">
                              We'll send a confirmation link to this email address.
                            </p>
                          </div>

                          <Button
                            className="w-full"
                            onClick={handleConfirmEmail}
                            disabled={isAddingEmail || !newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            {isAddingEmail ? 'Adding Email...' : 'Add Email & Earn 10 Coins'}
                          </Button>

                          <p className="text-xs text-center text-muted-foreground">
                            Steam users need to add a real email for account recovery and rewards.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Current Email:</span>
                              <span className="text-sm font-medium">{email}</span>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            onClick={handleConfirmEmail}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Confirm Email & Earn 10 Coins
                          </Button>

                          <p className="text-xs text-center text-muted-foreground">
                            Check your inbox for a confirmation email (or click the button to send a new one).
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
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
                                    <Switch 
                                      checked={notificationPrefs.email_match_reminders || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, email_match_reminders: checked})}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch 
                                      checked={notificationPrefs.push_match_reminders || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, push_match_reminders: checked})}
                                    />
                                </TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>
                                    <p className="font-medium">Bet Results</p>
                                    <p className="text-xs text-muted-foreground">Receive an update as soon as a match you bet on is finished.</p>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch 
                                      checked={notificationPrefs.email_bet_results || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, email_bet_results: checked})}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Switch 
                                      checked={notificationPrefs.push_bet_results || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, push_bet_results: checked})}
                                    />
                                </TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>
                                    <p className="font-medium">Level Up & Rewards</p>
                                    <p className="text-xs text-muted-foreground">Get notified when you level up or receive a special reward.</p>
                                </TableCell>
                               <TableCell className="text-center">
                                    <Switch 
                                      checked={notificationPrefs.email_level_up || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, email_level_up: checked})}
                                    />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch 
                                      checked={notificationPrefs.push_level_up || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, push_level_up: checked})}
                                    />
                                </TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>
                                    <p className="font-medium">New Promotions</p>
                                    <p className="text-xs text-muted-foreground">Stay up-to-date with new crates, events, and special offers.</p>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Switch 
                                      checked={notificationPrefs.email_promotions || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, email_promotions: checked})}
                                    />
                                </TableCell>
                                 <TableCell className="text-center">
                                    <Switch 
                                      checked={notificationPrefs.push_promotions || false}
                                      onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, push_promotions: checked})}
                                    />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                      </Table>
                  </CardContent>
                   <CardFooter>
                     <Button onClick={handleSaveNotificationPrefs}>
                       <Bell className="mr-2 h-4 w-4" />
                       Save Notification Settings
                     </Button>
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
                        <Input id="referral-code" value={referralCode || ''} readOnly className="font-mono bg-secondary/50"/>
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
                          {referredUsers && referredUsers.length > 0 ? (
                            referredUsers.map((ref) => (
                            <TableRow key={ref.id}>
                                <TableCell className="font-medium">{ref.displayname || ref.username}</TableCell>
                                <TableCell className="text-xs">{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                  <UiBadge variant="default" className="bg-green-600 text-xs">
                                    Active
                                </UiBadge>
                              </TableCell>
                            </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">
                                No referrals yet. Share your code!
                              </TableCell>
                            </TableRow>
                          )}
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
              {gemHistory && gemHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gemHistory.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <UiBadge variant={transaction.type === 'purchase' ? 'default' : transaction.type === 'reward' ? 'secondary' : 'outline'}>
                            {transaction.type}
                          </UiBadge>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className={cn("text-right font-semibold", transaction.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </TableCell>
                        <TableCell className="text-right">{transaction.balance_after}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
              <div className="text-center py-8">
                  <Gem className="h-16 w-16 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-xl font-semibold mb-2">No Gem History</h3>
                <p className="text-muted-foreground mb-4">
                    You haven't made any gem transactions yet.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
                    <Gem className="h-5 w-5 text-purple-500" />
                    <span className="font-bold">{balance?.gems?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">Gems Available</span>
                  </div>
                </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delete-account" className="mt-4">
          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>Permanently delete your account and all associated data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <h4 className="font-semibold text-red-500 mb-2">⚠️ Warning: This action cannot be undone!</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>All your coins, gems, and XP will be lost</li>
                  <li>Your inventory items will be deleted</li>
                  <li>Your betting history and achievements will be removed</li>
                  <li>Your username will become available for others</li>
                  <li>You will be logged out immediately</li>
                </ul>
              </div>

              <div className="space-y-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleInitiateDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Permanently Delete My Account
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Need help? <a href="/support" className="text-primary hover:underline">Contact Support</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* First Confirmation Dialog - Type DELETE */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription>
              This action is permanent. All your data will be lost forever.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-500 mb-2">⚠️ You will lose:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>All coins, gems, and XP</li>
                <li>Your entire inventory</li>
                <li>All achievements and badges</li>
                <li>Betting history and statistics</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-input">
                Type <span className="font-bold text-red-500">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-input"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE"
                className="border-red-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deleteConfirmation === 'DELETE') {
                    handleFirstConfirmation();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFirstConfirmation}
              disabled={deleteConfirmation !== 'DELETE'}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Warning Alert Dialog */}
      <AlertDialog open={showFinalDeleteWarning} onOpenChange={setShowFinalDeleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 text-xl">
              ⚠️ FINAL WARNING - Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-base font-semibold">
                This will PERMANENTLY DELETE your account and ALL associated data.
              </p>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <p className="text-sm font-bold text-red-500 mb-2">
                  This action CANNOT be undone!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your account, coins, gems, XP, inventory, achievements, badges, betting history, 
                  and all other data will be permanently deleted and cannot be recovered.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                You will be immediately logged out and your username will become available for others to use.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinalDeleteWarning(false)}>
              Cancel - Keep My Account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete Everything Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

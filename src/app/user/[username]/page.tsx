'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { UserAvatar } from "../../../components/user-avatar";
import { MessageSquare, Trophy, Award, Target, TrendingUp, ArrowLeft, Home } from 'lucide-react';
import { cn } from "../../../lib/utils";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getBannerGradient } from "../../../lib/profile-banners";

export default function PublicUserProfile({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user info
        const meResponse = await fetch('/api/me', { credentials: 'include' });
        if (meResponse.ok) {
          const meData = await meResponse.json();
          setCurrentUser(meData.user);
        }

        // Fetch profile with cache busting
        const response = await fetch(`/api/user/${encodeURIComponent(resolvedParams.username)}/profile?t=${Date.now()}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('User not found');
        }

        const data = await response.json();
        
        if (data.success) {
          setProfile(data);
        } else {
          throw new Error(data.error || 'Failed to load profile');
        }
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Listen for banner updates with immediate refresh
    const handleBannerUpdate = async (event?: CustomEvent) => {
      // If viewing own profile, update immediately
      if (currentUser && profile?.user && currentUser.id === profile.user.id) {
        // For own profile, refetch immediately
        const response = await fetch(`/api/user/${encodeURIComponent(resolvedParams.username)}/profile?t=${Date.now()}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProfile(data);
          }
        }
      } else {
        // For other users, refresh normally
        fetchData();
      }
    };
    
    window.addEventListener('bannerEquipped', handleBannerUpdate as EventListener);
    window.addEventListener('userUpdated', handleBannerUpdate as EventListener);
    
    return () => {
      window.removeEventListener('bannerEquipped', handleBannerUpdate as EventListener);
      window.removeEventListener('userUpdated', handleBannerUpdate as EventListener);
    };
  }, [resolvedParams.username, currentUser, profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>

        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-500">Profile Not Found</CardTitle>
              <CardDescription>{error || 'This user does not exist or their profile is private.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => router.back()} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Link href="/dashboard" className="w-full block">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { user, stats, badges } = profile;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold">{user?.displayname || user?.username}'s Profile</h2>
              </div>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Profile Header */}
        <Card className="overflow-hidden mb-6 rounded-2xl">
          <div className="relative">
            <div 
              className="h-32 md:h-48" 
              style={{ background: getBannerGradient(user?.equipped_banner) }}
            />
            <div className="absolute -bottom-16 left-6">
              <div className="w-32 h-32 rounded-full border-4 border-background ring-4 ring-primary/20 shadow-xl overflow-hidden bg-secondary">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.displayname || user.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 rounded-full">
                    <span className="text-4xl font-bold">
                      {(user?.displayname || user?.username || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <CardContent className="pt-20 pb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2">
                  {user?.displayname || user?.username || 'Unknown User'}
                </h1>
                
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {user?.rank && (
                    <Badge variant="default" className="text-sm">
                      <Trophy className="mr-1 h-3 w-3" />
                      {user.rank}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-sm">
                    Level {user?.level || 1}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {user?.xp?.toLocaleString() || 0} XP
                  </Badge>
                  {user?.steam_verified && (
                    <Badge className="bg-[#1b2838] hover:bg-[#1b2838]/80 text-sm">
                      Steam Verified
                    </Badge>
                  )}
                  <Badge variant="secondary" className="capitalize text-sm">
                    {user?.role || 'User'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Unknown'}
                </p>
              </div>

              {/* Only show Send Message button if not viewing own profile */}
              {currentUser && user && currentUser.id !== user.id && (
                <Button className="gap-2 w-full md:w-auto">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Stats & Badges */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Player performance and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg border border-blue-500/20">
                    <Trophy className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl md:text-3xl font-bold">{stats?.itemCount || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Items Owned</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-lg border border-orange-500/20">
                    <Target className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl md:text-3xl font-bold">{stats?.betsWon || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Bets Won</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-lg border border-cyan-500/20">
                    <TrendingUp className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                    <p className="text-2xl md:text-3xl font-bold">{stats?.winRate || 0}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Win Rate</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-lg border border-yellow-500/20">
                    <Award className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl md:text-3xl font-bold">{stats?.achievementsUnlocked || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Achievements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  {stats?.badgesEarned || 0} badge{(stats?.badgesEarned || 0) !== 1 ? 's' : ''} earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {badges && badges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {badges.map((badge: any, index: number) => (
                      <div
                        key={badge.badge_id || index}
                        className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg border border-border hover:bg-secondary/80 transition-colors"
                      >
                        {badge.badges?.icon_url ? (
                          <img
                            src={badge.badges.icon_url}
                            alt={badge.badges.name || 'Badge'}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{badge.badges?.name || 'Unknown Badge'}</p>
                          <p className="text-xs text-muted-foreground">{badge.badges?.rarity || 'Common'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                    <p className="text-muted-foreground">No badges earned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Profile Info & Activity */}
          <div className="space-y-6">
            {/* Profile Info */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Profile Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm text-muted-foreground">Level</span>
                  <span className="font-bold text-lg">{user?.level || 1}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm text-muted-foreground">Rank</span>
                  <span className="font-semibold">{user?.rank || 'Unranked'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm text-muted-foreground">XP</span>
                  <span className="font-semibold">{user?.xp?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant="secondary" className="capitalize">{user?.role || 'User'}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Bets</span>
                  <span className="font-semibold">{stats?.totalBets || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Bets Won</span>
                  <span className="font-semibold text-green-500">{stats?.betsWon || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-semibold">{stats?.winRate || 0}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Items Owned</span>
                  <span className="font-semibold">{stats?.itemCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Achievements</span>
                  <span className="font-semibold">{stats?.achievementsUnlocked || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Badges</span>
                  <span className="font-semibold">{stats?.badgesEarned || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

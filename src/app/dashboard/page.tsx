
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Gem, Gift } from 'lucide-react';
import { Progress } from "../../components/ui/progress";
import { LiveChat } from "../../components/live-chat";
import { StatCard } from "../../components/stat-card";
import { ExtendedRarity } from "../../types/crate";

// Add window._persistentActivities interface
declare global {
  interface Window {
    _persistentActivities?: {
      crates: any[];
      other: any[];
    };
  }
}

import { useAuth } from "../../hooks/use-auth";
import { useBalance } from "../../contexts/balance-context";
import { useState, useEffect, useRef } from 'react';
import { createSupabaseQueries } from "../../lib/supabase/queries";
import { supabase } from "../../lib/supabase/client";
import type { DBUser, DBMission } from "../../lib/supabase/queries";
// Fetch rank from database (will be populated in useEffect)
let cachedRanks: any[] = [];

interface UserStats {
  level: number;
  coins: number;
  wins: number;
  totalBets: number;
  winRate: number;
  totalWinnings: number;
  totalWagered: number;
  xp: number;
  completedMissions: number;
}

interface Mission {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  completed: boolean;
}

interface Activity {
  id: string;
  type: 'bet' | 'mission' | 'vote' | 'crate';
  description: string;
  timestamp: string;
  amount?: number;
  status?: string;
  itemRarity?: string;
  itemName?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { balance } = useBalance();
  const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
  const [dailyStats, setDailyStats] = useState({ dailyCompleted: 0, totalDaily: 0, completedMissions: 0, totalMissions: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userRank, setUserRank] = useState<string>('Unranked');
  const [ranks, setRanks] = useState<any[]>([]);
  const [lastCrate, setLastCrate] = useState<any>(null);

  useEffect(() => {
    const fetchDailyMissions = async () => {
      try {
        // Fetch from API for now, TODO: move to Supabase
        const response = await fetch('/api/missions/summary', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setDailyStats(data);
        } else if (response.status === 401) {
          // Unauthorized - use default values
          console.log('Session issue, using default mission stats');
          setDailyStats({ dailyCompleted: 0, totalDaily: 0, completedMissions: 0, totalMissions: 0 });
        } else {
          console.error('Failed to fetch daily missions:', response.status, response.statusText);
          setDailyStats({ dailyCompleted: 0, totalDaily: 0, completedMissions: 0, totalMissions: 0 });
        }

        // Skip direct Supabase queries from client-side for now
        // The user_missions query requires proper authentication which is handled server-side
        // The API endpoint already provides fallback data and handles authentication properly
        console.log('Using API-based mission data (Supabase direct queries disabled due to auth requirements)');
      } catch (error) {
        console.error('Failed to fetch daily missions:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserStats = async () => {
      try {
        const response = await fetch('/api/user/stats', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserStats(data);
        } else if (response.status === 401) {
          // Session expired or invalid - don't log as error, just skip
          console.log('Session expired, skipping user stats fetch');
        } else {
          console.error('Failed to fetch user stats:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    // REMOVED old fetchUserActivity - now using direct Supabase query in separate useEffect
    // This prevents the flicker where it shows old activities then switches to crate activities
    
    // Only fetch data if user is available
    if (user) {
      fetchDailyMissions();
      fetchUserStats();
      // fetchUserActivity(); REMOVED - handled by separate useEffect below
    }
  }, [user]);

  // Fetch ranks from database
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        const response = await fetch('/api/user/ranks', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const fetchedRanks = data.ranks || [];
          setRanks(fetchedRanks);
          cachedRanks = fetchedRanks;
          
          // Calculate user rank based on level
          const level = userStats?.level || balance?.level || user?.level || 1;
          const currentRank = fetchedRanks.find((rank: any) =>
            level >= rank.min_level && (rank.max_level === null || level <= rank.max_level)
          );
          setUserRank(currentRank?.name || 'Unranked');
          console.log('🏆 User rank calculated:', currentRank?.name, 'for level', level);
        }
      } catch (error) {
        console.error('Error fetching ranks:', error);
      }
    };
    
    if (user) {
      fetchRanks();
    }
  }, [user, userStats?.level, balance?.level]);
  
  // IMPORTANT: We need to store the activities in a ref to prevent them from changing unexpectedly
  const lastActivitiesRef = useRef<Activity[]>([]);
  
  // FIXED ACTIVITY FEED - persistent crate priority
  useEffect(() => {
    const fetchActivityFeed = async () => {
      if (!user?.id) return;
      
      try {
        setActivityLoading(true);
        console.log('🔍 ACTIVITY FEED: Fetching for user:', user.id);
        
        // FIXED: Single query to get ALL activities, then sort in JavaScript
        const { data: allActivities, error: activityError } = await supabase
          .from('activity_feed')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (activityError) {
          console.error('❌ Query Error:', activityError);
          setActivityLoading(false);
          return;
        }
        
        const rawActivities = allActivities || [];
        
        console.log('📊 Raw activities from DB:', rawActivities.length);
        console.log('📋 Activity actions:', rawActivities.map(a => a.action).slice(0, 10));
        
        // Sort: Crate openings first, then everything else by timestamp
        const activityData = rawActivities.sort((a, b) => {
          // Crate openings always go first
          const aIsCrate = a.action === 'opened_crate';
          const bIsCrate = b.action === 'opened_crate';
          
          if (aIsCrate && !bIsCrate) return -1;
          if (!aIsCrate && bIsCrate) return 1;
          
          // Within same category, sort by timestamp (most recent first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        console.log('✅ Sorted activities:', {
          total: activityData.length,
          crates: activityData.filter(a => a.action === 'opened_crate').length,
          games: activityData.filter(a => a.action === 'won_game' || a.action === 'lost_game' || a.action?.includes('game')).length,
          other: activityData.filter(a => a.action !== 'opened_crate' && !a.action?.includes('game')).length
        });
        console.log('✅ Combined activities:', activityData?.length);
        
        if (!activityData || activityData.length === 0) {
          // If no activities, just return early
          console.log('🚧 No activities found');
          setActivityLoading(false);
          return;
        }
        
        console.log('📊 Processing', activityData.length, 'activities');
        
        // activityData already has crates first, then other activities from the query
        // Just limit to 10 most recent
        const prioritizedData = activityData.slice(0, 10);
        
        console.log('📋 Final activity list:', prioritizedData.length, 'activities');
        console.log('📦 Activities breakdown:', {
          crates: prioritizedData.filter(a => a.action === 'opened_crate').length,
          games: prioritizedData.filter(a => a.action === 'won_game' || a.action === 'lost_game').length,
          other: prioritizedData.filter(a => a.action !== 'opened_crate' && a.action !== 'won_game' && a.action !== 'lost_game').length
        });
        
        // STABILIZE: Check if the data has actually changed before updating state
        const dataChanged = JSON.stringify(prioritizedData) !== JSON.stringify(lastActivitiesRef.current);
        if (!dataChanged && lastActivitiesRef.current.length > 0) {
          console.log('🔄 Activity feed unchanged, keeping current state');
          setActivityLoading(false);
          return;
        }
        
        // STABLE FORMAT: Use a stable mapping function that won't cause re-renders
        const formattedActivities = prioritizedData.map(activity => {
          // Map action to type with type safety
          let type: 'bet' | 'mission' | 'vote' | 'crate' = 'bet';
          if (activity.action === 'opened_crate') type = 'crate';
          if (activity.action === 'won_game' || activity.action === 'lost_game') type = 'bet';
          if (activity.action === 'leveled_up') type = 'mission';
          if (activity.action === 'unlocked_achievement') type = 'mission';
          
          // Extract metadata
          const metadata = activity.metadata || {};
          let description = activity.description || 'Activity';
          
          // CRITICAL FIX: Special handling for crate openings to ensure consistent display
          if (type === 'crate' && metadata.itemName) {
            const itemRarity = metadata.itemRarity || 'Common';
            const itemName = metadata.itemName;
            description = `Opened a crate and received ${itemName} (${itemRarity})`;
          }
          
          // Ensure all fields have stable values (no undefined/null that can cause React re-renders)
          return {
            id: activity.id || crypto.randomUUID(),
            type, 
            description: description || 'Activity record',
            timestamp: activity.created_at || new Date().toISOString(),
            amount: metadata.amount || undefined,
            status: activity.action === 'won_game' ? 'won' : 
                    activity.action === 'lost_game' ? 'lost' : undefined,
            itemRarity: metadata.itemRarity || undefined,
            itemName: metadata.itemName || undefined
          };
        });
        
        // IMPORTANT: Save to ref so we can compare and prevent unnecessary re-renders
        lastActivitiesRef.current = formattedActivities;
        
        // Finally update state with the stable data
        setActivities(formattedActivities);
        console.log('✅ Set activity feed with', formattedActivities.length, 'items');
      } catch (error) {
        console.error('❌ Error fetching activity feed:', error);
      } finally {
        setActivityLoading(false);
      }
    };
    
    fetchActivityFeed();
    
    // CRITICAL: Remove the automatic refresh which causes the flicker
    // The user will get new activities when they navigate or refresh
    return () => {};
  }, [user?.id]);

  // Fetch last crate opening
  useEffect(() => {
    const fetchLastCrate = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('crate_openings')
          .select('crate_id, item_received_id, opened_at')
          .eq('user_id', user.id)
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error || !data) {
          return;
        }
        
        // Fetch related crate and item separately to avoid join issues
        const [crateData, itemData] = await Promise.all([
          supabase.from('crates').select('name, image_url').eq('id', data.crate_id).maybeSingle(),
          supabase.from('items').select('name, rarity, image_url').eq('id', data.item_received_id).maybeSingle()
        ]);
        
        if (crateData.data && itemData.data) {
          setLastCrate({
            ...data,
            crate: crateData.data,
            item: itemData.data
          });
        }
      } catch (error) {
        // Silently fail - user just hasn't opened crates yet
      }
    };
    
    fetchLastCrate();
  }, [user?.id]); // Add user as dependency

  return (
    <div className="flex flex-col h-full w-full overflow-x-hidden">
      <div className="flex flex-col lg:flex-row flex-1 p-4 sm:p-6 lg:p-8 gap-6 w-full max-w-full">
        {/* Main Content */}
        <main className="flex-1 min-w-0 max-w-full space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold font-headline">
                Welcome Back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!
              </h1>
              <p className="text-muted-foreground">
                Here&apos;s your mission briefing for today. Your current rank is <span className='font-bold text-primary'>{userRank}</span>.
              </p>
            </div>
            {/* Add user avatar display */}
            {user && ((user as any).avatar_url || user.photoURL || user.steamProfile?.avatar) && (
              <div className="flex items-center gap-3">
                <img 
                  src={(user as any).avatar_url || user.steamProfile?.avatar || user.photoURL} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full border-2 border-primary"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Optional marketing banner can be toggled later */}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-full">
            {statsLoading ? (
              <>
                <StatCard label="Wins" value={0} subtext="Loading..." />
                <StatCard label="Win Rate" value={0} subtext="Loading..." formatAsPercent />
                <StatCard label="Total Coins" value={0} subtext="Loading..." />
                <StatCard label="XP" value={0} subtext="Loading..." />
              </>
            ) : (
              <>
                <StatCard 
                  label="Wins" 
                  value={userStats?.wins || 0} 
                  subtext={userStats?.totalBets ? `${userStats.totalBets} total bets` : "No bets yet"} 
                />
                <StatCard 
                  label="Win Rate" 
                  value={userStats?.winRate || 0} 
                  subtext={userStats?.totalBets ? `${userStats.wins}/${userStats.totalBets} wins` : "No data yet"} 
                  formatAsPercent 
                />
                <StatCard 
                  label="Total Coins" 
                  value={balance?.coins || 0} 
                  subtext={userStats?.totalWinnings ? `+${userStats.totalWinnings} from bets` : "No winnings yet"}
                  valueClassName="text-green-500"
                />
                <StatCard 
                  label="XP" 
                  value={balance?.xp || 0} 
                  subtext={`Level ${balance?.level || 1}`}
                  valueClassName="text-orange-500"
                />
              </>
            )}
          </div>

          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle>Daily Missions</CardTitle>
              <CardDescription>Complete these for extra rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-center text-muted-foreground">Loading missions...</p>
              ) : (
                <>
                  <div className='space-y-4 mb-6'>
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center text-sm font-semibold'>
                        <span>Daily Progress</span>
                        <span className='text-orange-500'>
                          {dailyStats.totalDaily > 0 
                            ? `${Math.round((dailyStats.dailyCompleted / dailyStats.totalDaily) * 100)}% Complete`
                            : '0% Complete'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={dailyStats.totalDaily > 0 ? (dailyStats.dailyCompleted / dailyStats.totalDaily) * 100 : 0}
                        variant="xp"
                        className="h-3" 
                      />
                    </div>
                    <div className='space-y-2'>
                      <div className='flex justify-between items-center text-sm font-semibold'>
                        <span>Main Missions Progress</span>
                        <span className='text-red-500'>
                          {dailyStats.totalMissions > 0 
                            ? `${Math.round((dailyStats.completedMissions / dailyStats.totalMissions) * 100)}% Complete`
                            : '0% Complete'
                          }
                        </span>
                      </div>
                      <Progress 
                        value={dailyStats.totalMissions > 0 ? (dailyStats.completedMissions / dailyStats.totalMissions) * 100 : 0}
                        variant="main-mission"
                        className="h-3" 
                      />
                    </div>
                  </div>
                  {dailyMissions.slice(0, 1).map((mission) => (
                    <Card key={mission.id} className="hover:shadow-md transition-shadow cursor-pointer flex items-center p-4 space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Gift className="w-6 h-6 text-primary"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{mission.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{mission.description}</p>
                      </div>
                      <div className="text-sm font-medium text-orange-500">
                        +{mission.xp_reward} XP
                      </div>
                    </Card>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    {dailyStats.dailyCompleted}/{dailyStats.totalDaily} daily missions completed
                  </p>
                </>
              )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activityLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => {
                    const timeAgo = new Date(activity.timestamp).toLocaleDateString();
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'bet': return '🎲';
                        case 'mission': return '🎯';
                        case 'vote': return '🗳️';
                        case 'crate': return '📦';
                        default: return '📝';
                      }
                    };
                    
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg bg-secondary/50">
                        {activity.type === 'crate' ? (
                          <div className="w-6 h-6 flex-shrink-0 bg-primary/20 rounded flex items-center justify-center overflow-hidden">
                            <Gift className="w-4 h-4 text-primary" />
                          </div>
                        ) : (
                          <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo}</p>
                        </div>
                        {activity.amount && (
                          <span className={`text-xs font-mono px-2 py-1 rounded ${
                            activity.type === 'bet' && activity.status === 'won' 
                              ? 'bg-green-500/20 text-green-400'
                              : activity.type === 'bet' && activity.status === 'lost'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {activity.type === 'mission' ? '+' : ''}{activity.amount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Right Sidebar */}
        <aside className="w-full lg:w-80 xl:w-96 shrink-0 min-w-0 space-y-6 overflow-y-auto">
          <Card className="h-[400px] flex flex-col">
            <LiveChat title="Public Chat" lobby="dashboard" />
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>News</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                News and updates will be shown here.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Last Crate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {lastCrate ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
                    {lastCrate.crate?.image_url ? (
                      <img 
                        src={lastCrate.crate.image_url}
                        alt={lastCrate.crate.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback to Gift icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const icon = document.createElement('div');
                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M20 12v10H4V12"></path><path d="M2 7h20v5H2z"></path><path d="M12 22V7"></path><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>';
                            parent.appendChild(icon);
                          }
                        }}
                      />
                    ) : (
                      <Gift className="w-32 h-32 text-primary" />
                    )}
                  </div>
                  <p className="text-center font-semibold text-lg mt-4">{lastCrate.crate?.name || 'Level Up Crate'}</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    You received a <span className="font-bold text-primary">{lastCrate.item?.rarity || 'Common'}</span> item: <span className="font-semibold">{lastCrate.item?.name || 'Unknown Item'}</span>!
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Gift className="w-24 h-24 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    No crates opened yet. Visit the Crates page to get started!
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

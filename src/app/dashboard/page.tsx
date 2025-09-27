
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
import { useAuth } from "../../hooks/use-auth";
import { useBalance } from "../../contexts/balance-context";
import { useState, useEffect } from 'react';
import { createSupabaseQueries } from "../../lib/supabase/queries";
import { supabase } from "../../lib/supabase/client";
import type { DBUser, DBMission } from "../../lib/supabase/queries";

// Helper function to get rank by level (temporary until we move to Supabase)
function getRankByLevel(level: number): string {
  if (level >= 50) return 'Grandmaster';
  if (level >= 40) return 'Master';
  if (level >= 30) return 'Expert';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Intermediate';
  return 'Beginner';
}

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
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { balance } = useBalance();
  const [dailyMissions, setDailyMissions] = useState<Mission[]>([]);
  const [dailyStats, setDailyStats] = useState({ dailyCompleted: 0, totalDaily: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

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
        } else {
          console.error('Failed to fetch daily missions:', response.status, response.statusText);
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

    const fetchUserActivity = async () => {
      try {
        const response = await fetch('/api/user/activity', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        } else if (response.status === 401) {
          // Session expired or invalid - don't log as error, just skip
          console.log('Session expired, skipping user activity fetch');
        } else {
          console.error('Failed to fetch user activity:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch user activity:', error);
      } finally {
        setActivityLoading(false);
      }
    };

    // Only fetch data if user is available
    if (user) {
      fetchDailyMissions();
      fetchUserStats();
      fetchUserActivity();
    }
  }, [user]); // Add user as dependency

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
                Here&apos;s your mission briefing for today. Your current rank is <span className='font-bold text-primary'>{getRankByLevel(userStats?.level || user?.level || 1)}</span>.
              </p>
            </div>
            {/* Add user avatar display */}
            {user && (user.photoURL || user.steamProfile?.avatar) && (
              <div className="flex items-center gap-3">
                <img 
                  src={user.steamProfile?.avatar || user.photoURL} 
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
                />
                <StatCard 
                  label="XP" 
                  value={balance?.xp || 0} 
                  subtext={`Level ${balance?.level || 1}`} 
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
                  <div className='space-y-2 mb-6'>
                    <div className='flex justify-between items-center text-sm font-semibold'>
                      <span>Daily Progress</span>
                      <span className='text-primary'>
                        {dailyStats.totalDaily > 0 
                          ? `${Math.round((dailyStats.dailyCompleted / dailyStats.totalDaily) * 100)}% Complete`
                          : '0% Complete'
                        }
                      </span>
                    </div>
                    <Progress 
                      value={dailyStats.totalDaily > 0 ? (dailyStats.dailyCompleted / dailyStats.totalDaily) * 100 : 0} 
                      className="h-3" 
                    />
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
                      <div className="text-sm font-medium text-primary">
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
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
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
              <div className="relative">
                <Gift className="w-24 h-24 text-primary animate-pulse" />
                <Gem className="w-8 h-8 text-purple-400 absolute -top-1 -right-1" />
              </div>
              <p className="text-center font-semibold">&quot;Prime Gaming&quot; Crate</p>
              <p className="text-sm text-muted-foreground text-center">
                You received an Epic item from your last crate opening!
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

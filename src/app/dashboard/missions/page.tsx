
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
// Removed mock data import - now using real API data
import { CheckCircle, Gem, Star } from "lucide-react";
import { cn } from "../../../lib/utils";
import { MissionSummaryCard } from "../../../components/mission-summary-card";
import { useAuth } from "../../../components/auth-provider";
import { useState, useEffect } from "react";

interface Mission {
  id: string;
  name: string;
  description: string;
  mission_type: string;
  tier: number;
  xp_reward: number;
  coin_reward: number;
  gem_reward: number;
  requirement_type: string;
  requirement_value: number;
  is_repeatable: boolean;
  is_active: boolean;
  created_at: string;
}

export default function MissionsPage() {
  const { user } = useAuth();
  const [missionProgress, setMissionProgress] = useState<Record<string, number>>({});
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchMissionData = async () => {
      try {
        console.log('🔄 Fetching mission data...');
        // Fetch missions, summary, and progress in parallel
        const [missionsResponse, summaryResponse, progressResponse] = await Promise.all([
          fetch('/api/missions', { credentials: 'include' }),
          fetch('/api/missions/summary', { credentials: 'include' }),
          fetch('/api/missions/progress', { credentials: 'include' })
        ]);

        console.log('📡 API Responses:', {
          missions: missionsResponse.status,
          summary: summaryResponse.status,
          progress: progressResponse.status
        });

        // Handle missions data
        if (missionsResponse.ok) {
          const missionsData = await missionsResponse.json();
          console.log('✅ Missions data:', missionsData);
          if (missionsData.success) {
            setMissions(missionsData.missions);
            console.log(`📋 Set ${missionsData.missions.length} missions`);
          } else {
            console.error('❌ Missions API returned success: false');
          }
        } else {
          console.error('❌ Missions API failed:', missionsResponse.status);
        }

        // Handle summary data
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          console.log('📊 Summary data:', summaryData);
          setDailyStats(summaryData);
        } else {
          console.error('❌ Summary API failed:', summaryResponse.status);
        }

        // Handle progress data
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          console.log('📈 Progress data:', progressData);
          if (progressData.success && progressData.progress) {
            // Convert progress array to progress object
            const progressMap: Record<string, number> = {};
            progressData.progress.forEach((item: any) => {
              progressMap[item.mission_id] = item.progress || 0;
            });
            setMissionProgress(progressMap);
            console.log('📈 Set mission progress:', progressMap);
          }
        } else {
          console.error('❌ Progress API failed:', progressResponse.status);
        }
      } catch (error) {
        console.error('💥 Failed to fetch mission data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      console.log('👤 User authenticated, fetching mission data for:', user.id);
      fetchMissionData();
    } else {
      console.log('❌ No user found');
    }
  }, [user]);

  const getProgress = (id: string) => missionProgress[id] || 0;

  if (!user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to view your missions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading missions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group missions by type and tier
  const dailyMissions = missions.filter(m => m.mission_type === 'daily');
  const mainMissions = missions.filter(m => m.mission_type === 'main');
  
  console.log('🎯 Mission breakdown:', {
    total: missions.length,
    daily: dailyMissions.length,
    main: mainMissions.length,
    tier1: mainMissions.filter(m => m.tier === 1).length,
    tier2: mainMissions.filter(m => m.tier === 2).length,
    tier3: mainMissions.filter(m => m.tier === 3).length,
    tier4: mainMissions.filter(m => m.tier === 4).length,
  });
  
  const missionTiers = {
    "Daily Missions": dailyMissions,
    "Tier 1: Onboarding": mainMissions.filter(m => m.tier === 1),
    "Tier 2: The Regular": mainMissions.filter(m => m.tier === 2),
    "Tier 3: The Veteran": mainMissions.filter(m => m.tier === 3),
    "Tier 4: The Master": mainMissions.filter(m => m.tier === 4),
  };

  const completedMainMissions = mainMissions.filter(m => getProgress(m.id) === 100).length;
  const mainMissionProgress = (completedMainMissions / mainMissions.length) * 100;
  
  const allMissions = [...dailyMissions, ...mainMissions];
  const totalXpEarned = allMissions.reduce((total, mission) => {
    if (getProgress(mission.id) === 100) {
      return total + mission.xp_reward;
    }
    return total;
  }, 0);

  const totalCoinsEarned = mainMissions.reduce((total, mission) => {
    if (getProgress(mission.id) === 100 && mission.coin_reward) {
        return total + mission.coin_reward;
    }
    return total;
  }, 0);


  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Missions Hub</h1>
          <p className="text-muted-foreground">Complete tasks to earn XP, coins, and other rewards.</p>
        </div>
      </div>

      <MissionSummaryCard 
        mainMissionProgress={mainMissionProgress}
        totalXpEarned={totalXpEarned}
        totalCoinsEarned={totalCoinsEarned}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {Object.entries(missionTiers).map(([tierTitle, missions]) => (
            <Card key={tierTitle}>
              <CardHeader>
                <CardTitle>{tierTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {missions.map((mission) => {
                  const progress = getProgress(mission.id);
                  const isComplete = progress === 100;
                  return (
                    <div key={mission.id} className={cn("flex items-center gap-4 p-3 bg-secondary/30 rounded-lg transition-opacity", isComplete ? 'opacity-100' : "opacity-60 hover:opacity-100")}>
                      <div className={`p-2 bg-background rounded-md ${isComplete ? 'text-green-400' : 'text-primary/70'}`}>
                        {isComplete ? <CheckCircle className="w-8 h-8" /> : <Star className="w-8 h-8" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold">{mission.name}</p>
                        <p className="text-xs text-muted-foreground">{mission.description}</p>
                        {progress > 0 && progress < 100 && (
                           <Progress value={progress} className="h-2" />
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-sky-400">
                           <Star className="w-4 h-4"/> +{mission.xp_reward} XP
                        </div>
                        {mission.coin_reward && (
                          <div className="flex items-center justify-end gap-2 text-sm font-semibold text-yellow-400">
                            <Gem className="w-4 h-4"/> +{mission.coin_reward} Coins
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
           ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Missions</CardTitle>
              <CardDescription>These tasks reset every day.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dailyMissions.map((mission) => {
                const progress = getProgress(mission.id);
                const isComplete = progress === 100;
                return (
                  <div key={mission.id} className={cn("flex items-center gap-3 transition-opacity", !isComplete && "opacity-60 hover:opacity-100")}>
                     <div className="p-1.5 bg-secondary rounded-md">
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Star className="w-5 h-5 text-primary/70" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{mission.name}</p>
                      <Progress value={progress} className="h-2 mt-1" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">+{mission.xp_reward} XP</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

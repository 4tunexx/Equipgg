
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
  title: string;
  description: string;
  type: string;
  tier: number;
  xp_reward: number;
  coin_reward: number;
  gem_reward: number;
  crate_reward: string | null;
  requirement_type: string;
  requirement_value: number;
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
        // Fetch missions, summary, and progress in parallel
        const [missionsResponse, summaryResponse, progressResponse] = await Promise.all([
          fetch('/api/missions', { credentials: 'include' }),
          fetch('/api/missions/summary', { credentials: 'include' }),
          fetch('/api/missions/progress', { credentials: 'include' })
        ]);

        // Handle missions data
        if (missionsResponse.ok) {
          const missionsData = await missionsResponse.json();
          if (missionsData.success) {
            setMissions(missionsData.missions);
          }
        }

        // Handle summary data
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setDailyStats(summaryData);
        }

        // Handle progress data
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setMissionProgress(progressData);
        }
      } catch (error) {
        console.error('Failed to fetch mission data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchMissionData();
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
  const dailyMissions = missions.filter(m => m.type === 'daily');
  const mainMissions = missions.filter(m => m.type === 'main');
  
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
                        <p className="font-semibold">{mission.title}</p>
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
                         {mission.crate_reward && <p className="text-xs text-accent text-right">+{mission.crate_reward}</p>}
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
                      <p className="text-sm font-semibold">{mission.title}</p>
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

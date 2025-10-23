'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
// Removed mock data import - now using real API data
import { CheckCircle, Coins, Star } from 'lucide-react';
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
        console.log('\n🎖️🎖️🎖️ MISSIONS PAGE - START LOADING 🎖️🎖️🎖️');
        console.log('🔄 Fetching mission data...');
        
        // First fetch missions
        const missionsResponse = await fetch('/api/missions', { credentials: 'include' });
        console.log('📡 Missions API Response:', missionsResponse.status);

        let fetchedMissions: Mission[] = [];
        if (missionsResponse.ok) {
          const missionsData = await missionsResponse.json();
          console.log('✅ Missions API Response:', missionsData);
          if (missionsData.success) {
            fetchedMissions = missionsData.missions;
            setMissions(fetchedMissions);
            console.log(`📋 Total missions from Supabase: ${fetchedMissions.length}`);
            console.log('👀 Mission breakdown:');
            console.log('  - Daily missions:', fetchedMissions.filter((m: any) => m.mission_type === 'daily').length);
            console.log('  - Main missions:', fetchedMissions.filter((m: any) => m.mission_type === 'main').length);
            console.log('👀 First 3 missions:', fetchedMissions.slice(0, 3).map((m: any) => ({ id: m.id, name: m.name, type: m.mission_type })));
          } else {
            console.error('❌ Missions API returned success: false');
          }
        } else {
          console.error('❌ Missions API failed:', missionsResponse.status);
        }

        // Then fetch summary and progress in parallel
        const [summaryResponse, progressResponse] = await Promise.all([
          fetch('/api/missions/summary', { credentials: 'include' }),
          fetch('/api/missions/progress', { credentials: 'include' })
        ]);

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
          console.log('📈 Progress API Response:', progressData);
          console.log('👀 Progress items count:', progressData.progress?.length || 0);
          if (progressData.success && progressData.progress) {
            // Convert progress array to progress object with percentage calculation
            const progressMap: Record<string, number> = {};
            progressData.progress.forEach((item: any) => {
              // Find the mission to get requirement_value
              const mission = fetchedMissions.find((m: any) => m.id === item.mission_id);
              if (mission) {
                const currentProgress = item.current_progress || item.progress || 0;
                const requirement = mission.requirement_value || 1;
                const percentage = Math.min(100, Math.round((currentProgress / requirement) * 100));
                progressMap[item.mission_id] = percentage;
              } else {
                progressMap[item.mission_id] = item.progress || 0;
              }
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
        console.log('🎖️🎖️🎖️ MISSIONS PAGE - FINISHED LOADING 🎖️🎖️🎖️\n');
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
    console.log('⏳ MISSIONS PAGE: Showing loading state...');
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading missions from Supabase...</p>
            <p className="text-center text-xs text-muted-foreground mt-2">Check console for details</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (missions.length === 0) {
    console.warn('⚠️ MISSIONS PAGE: No missions loaded!');
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">No missions found in Supabase.</p>
            <p className="text-center text-xs text-muted-foreground mt-2">Check Supabase missions table</p>
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
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{mission.name}</p>
                          {!isComplete && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {Math.round((progress / 100) * mission.requirement_value)}/{mission.requirement_value}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{mission.description}</p>
                        {!isComplete && (
                          <div className="space-y-1">
                            <Progress value={progress} variant="main-mission" className="h-2" />
                            <p className="text-xs text-muted-foreground">{progress}% complete</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end gap-2 text-sm font-semibold text-orange-500">
                           <Star className="w-4 h-4"/> +{mission.xp_reward} XP
                        </div>
                        {mission.coin_reward && (
                          <div className="flex items-center justify-end gap-2 text-sm font-semibold text-green-500">
                            <Coins className="w-4 h-4"/> +{mission.coin_reward} Coins
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
                      <Progress value={progress} variant="xp" className="h-2 mt-1" />
                    </div>
                    <span className="text-xs font-mono text-orange-500">+{mission.xp_reward} XP</span>
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

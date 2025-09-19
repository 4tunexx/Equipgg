'use client';

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Gem, TrendingUp } from 'lucide-react';

interface InventoryLevelProgressionProps {
  currentLevel: number;
  currentSlots: number;
}

// Calculate inventory slots based on user level: 10 slots at level 1, +5 every 5 levels
const getInventorySlots = (level: number): number => {
  if (level <= 1) return 10;
  if (level <= 5) return 15;
  if (level <= 10) return 20;
  if (level <= 15) return 25;
  if (level <= 20) return 30;
  if (level <= 25) return 35;
  if (level <= 30) return 40;
  if (level <= 35) return 45;
  if (level <= 40) return 50;
  if (level <= 45) return 55;
  if (level <= 50) return 60;
  // For levels above 50, add 5 slots every 5 levels
  return Math.min(60 + Math.floor((level - 50) / 5) * 5, 100); // Max 100 slots
};

export function InventoryLevelProgression({ currentLevel, currentSlots }: InventoryLevelProgressionProps) {
  const nextMilestone = Math.ceil(currentLevel / 5) * 5 + 1;
  const nextMilestoneSlots = getInventorySlots(nextMilestone);
  const progressToNext = ((currentLevel % 5) / 5) * 100;
  
  const milestones = [
    { level: 1, slots: 10, label: 'Starter' },
    { level: 5, slots: 15, label: 'Novice' },
    { level: 10, slots: 20, label: 'Apprentice' },
    { level: 15, slots: 25, label: 'Journeyman' },
    { level: 20, slots: 30, label: 'Expert' },
    { level: 25, slots: 35, label: 'Master' },
    { level: 30, slots: 40, label: 'Grandmaster' },
    { level: 35, slots: 45, label: 'Legend' },
    { level: 40, slots: 50, label: 'Mythic' },
    { level: 45, slots: 55, label: 'Transcendent' },
    { level: 50, slots: 60, label: 'Divine' },
  ];

  const currentMilestone = milestones.find(m => currentLevel >= m.level) || milestones[0];
  const nextMilestoneData = milestones.find(m => m.level > currentLevel);

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-yellow-400" />
          Inventory Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{currentSlots}</div>
          <div className="text-sm text-muted-foreground">Current Slots</div>
          <Badge variant="outline" className="mt-2">
            Level {currentLevel} - {currentMilestone.label}
          </Badge>
        </div>

        {/* Progress to Next Milestone */}
        {nextMilestoneData && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {nextMilestoneData.level}</span>
              <span>{nextMilestoneData.slots} slots</span>
            </div>
            <Progress value={progressToNext} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {nextMilestoneData.level - currentLevel} levels to go
            </div>
          </div>
        )}

        {/* Milestone Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Upcoming Milestones
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {milestones
              .filter(m => m.level > currentLevel)
              .slice(0, 4)
              .map((milestone) => (
                <div
                  key={milestone.level}
                  className={`p-2 rounded border ${
                    milestone.level === nextMilestone
                      ? 'border-primary bg-primary/10'
                      : 'border-muted bg-muted/20'
                  }`}
                >
                  <div className="font-medium">Level {milestone.level}</div>
                  <div className="text-muted-foreground">{milestone.slots} slots</div>
                  <div className="text-muted-foreground">{milestone.label}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Level Benefits */}
        <div className="text-xs text-muted-foreground text-center">
          <p>• Gain +5 inventory slots every 5 levels</p>
          <p>• Maximum 100 slots at high levels</p>
          <p>• Level up by earning XP through gameplay</p>
        </div>
      </CardContent>
    </Card>
  );
}

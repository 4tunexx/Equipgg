'use client';

import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Package } from 'lucide-react';
import { useState } from 'react';

interface InventoryLevelProgressionProps {
  currentLevel: number;
  currentSlots: number;
}

export function InventoryLevelProgression({ currentLevel, currentSlots }: InventoryLevelProgressionProps) {
  const [isHovered, setIsHovered] = useState(false);
  
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
  const progressToNext = nextMilestoneData ? ((currentLevel - currentMilestone.level) / (nextMilestoneData.level - currentMilestone.level)) * 100 : 100;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact Progression Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs text-muted-foreground">Inventory Progression</span>
          </div>
          <Badge variant="outline" className="text-xs border-green-500/50 text-green-500">
            {currentSlots} slots
          </Badge>
        </div>
        
        {nextMilestoneData && (
          <>
            <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-600 to-green-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Level {currentLevel} - {currentMilestone.label}</span>
              <span>{nextMilestoneData.level - currentLevel} to go</span>
            </div>
          </>
        )}
      </div>

      {/* Floating Details Card on Hover */}
      {isHovered && (
        <Card className="absolute left-0 right-0 top-full mt-2 z-50 bg-card/95 backdrop-blur-sm border-green-500/50 shadow-xl shadow-green-500/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-500">
              <Package className="h-4 w-4" />
              Progression Details
            </div>

            {/* Current Status Highlight */}
            <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-500">{currentSlots} Slots</div>
              <div className="text-xs text-muted-foreground mt-1">
                Level {currentLevel} - {currentMilestone.label}
              </div>
            </div>

            {/* Next Milestone */}
            {nextMilestoneData && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next Milestone</span>
                  <span className="font-medium text-green-500">Level {nextMilestoneData.level}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{nextMilestoneData.label}</span>
                  <span>{nextMilestoneData.slots} slots</span>
                </div>
                <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-600 to-green-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressToNext}%` }}
                  ></div>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {nextMilestoneData.level - currentLevel} {nextMilestoneData.level - currentLevel === 1 ? 'level' : 'levels'} remaining
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded-lg">
              <p className="flex items-center gap-1">
                <span className="text-green-500">•</span> +5 slots every 5 levels
              </p>
              <p className="flex items-center gap-1">
                <span className="text-green-500">•</span> Maximum 100 slots
              </p>
              <p className="flex items-center gap-1">
                <span className="text-green-500">•</span> Level up by earning XP
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

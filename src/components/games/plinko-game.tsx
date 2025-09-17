
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserProfileLink } from '../user-profile-link';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Dynamic multiplier generation based on risk and rows
function generatePlinkoMultipliers(risk: string, rows: number) {
  const slots = rows + 1;
  const multipliers = new Array(slots).fill(0);
  
  // Base multipliers for different risk levels
  const riskMultipliers = {
    low: { max: 5.6, min: 0.5, center: 1.0 },
    medium: { max: 33, min: 0.2, center: 1.0 },
    high: { max: 1000, min: 0, center: 0.2 }
  };
  
  const config = riskMultipliers[risk as keyof typeof riskMultipliers] || riskMultipliers.medium;
  
  // Generate symmetric multiplier distribution
  for (let i = 0; i < slots; i++) {
    const distanceFromCenter = Math.abs(i - (slots - 1) / 2);
    const normalizedDistance = distanceFromCenter / ((slots - 1) / 2);
    
    if (risk === 'low') {
      // Low risk: higher center values, lower edge values
      multipliers[i] = config.center + (config.max - config.center) * Math.pow(1 - normalizedDistance, 2);
    } else if (risk === 'high') {
      // High risk: very low center, extremely high edges
      if (i === 0 || i === slots - 1) {
        multipliers[i] = config.max;
      } else {
        multipliers[i] = config.center * (1 - normalizedDistance * 0.8);
      }
    } else {
      // Medium risk: balanced distribution
      if (normalizedDistance > 0.8) {
        multipliers[i] = config.max * Math.pow(normalizedDistance, 3);
      } else {
        multipliers[i] = config.center + (config.max - config.center) * Math.pow(normalizedDistance, 1.5) * 0.3;
      }
    }
    
    // Ensure minimum values
    multipliers[i] = Math.max(multipliers[i], config.min);
    // Round to 1 decimal place
    multipliers[i] = Math.round(multipliers[i] * 10) / 10;
  }
  
  return multipliers;
}

function getMultiplierColor(multiplier: number): string {
  if (multiplier >= 100) return 'bg-red-500';
  if (multiplier >= 10) return 'bg-orange-500';
  if (multiplier >= 5) return 'bg-orange-400';
  if (multiplier >= 2) return 'bg-yellow-500';
  if (multiplier >= 1) return 'bg-yellow-400';
  if (multiplier >= 0.5) return 'bg-yellow-300';
  return 'bg-yellow-200';
}

interface GameHistoryItem {
    id: string;
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
    betAmount: number;
    result?: {
        multiplier?: number;
    };
    profit: number;
}

const Peg = ({ hasBall }: { hasBall?: boolean }) => (
  <div className="relative flex items-center justify-center">
    <div className="w-2 h-2 rounded-full bg-gray-400" />
    {hasBall && (
      <div className="absolute w-3 h-3 rounded-full bg-blue-500 animate-pulse z-10 shadow-lg" />
    )}
  </div>
);

export function PlinkoGame() {
    return (
        <div className="flex items-center justify-center min-h-[600px]">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Under Maintenance
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The Plinko game is currently under maintenance. We're working to fix some issues and will have it back up soon!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Thank you for your patience.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
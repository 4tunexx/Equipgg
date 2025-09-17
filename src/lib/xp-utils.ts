// XP calculation utilities - Updated to use new progressive system
import { 
  getLevelFromXP, 
  getLevelInfo as getNewLevelInfo, 
  getXPForLevel,
  getXPToNextLevel,
  getXPForCurrentLevel,
  defaultXPConfig,
  type LevelInfo as NewLevelInfo
} from './xp-config';

// Legacy interface for backward compatibility
export interface LevelInfo {
  level: number;
  xpRequired: number;
  totalXpNeeded: number;
  xpToNext: number;
}

// Updated function to use new progressive XP system
export function calculateLevel(xp: number): number {
  return getLevelFromXP(xp, defaultXPConfig);
}

// Updated function to use new progressive XP system
export function getLevelInfo(currentXp: number): LevelInfo {
  const newLevelInfo = getNewLevelInfo(currentXp, defaultXPConfig);
  
  // Convert to legacy format for backward compatibility
  return {
    level: newLevelInfo.level,
    xpRequired: newLevelInfo.currentLevelXP,
    totalXpNeeded: newLevelInfo.totalXPNeeded,
    xpToNext: newLevelInfo.xpToNext,
  };
}

// Updated function to use new progressive XP system
export function getXpRequirements(): Array<{level: number, xpNeeded: number, totalXp: number}> {
  const requirements = [];
  
  requirements.push({ level: 1, xpNeeded: 0, totalXp: 0 });
  
  for (let i = 2; i <= 20; i++) {
    const xpNeeded = getXPForCurrentLevel(i, defaultXPConfig);
    const totalXp = getXPForLevel(i, defaultXPConfig);
    requirements.push({ level: i, xpNeeded, totalXp });
  }
  
  return requirements;
}

// New function to get XP for a specific level
export function getXPForLevelLegacy(level: number): number {
  return getXPForLevel(level, defaultXPConfig);
}

// New function to get XP needed for next level
export function getXPToNextLevelLegacy(currentXP: number): number {
  return getXPToNextLevel(currentXP, defaultXPConfig);
}
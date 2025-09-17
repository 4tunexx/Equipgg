// XP Configuration for Progressive Leveling System
// Hybrid formula: XP_required = base + step * level + scale * (level ^ 2)

export interface XPConfig {
  base: number;      // Base XP required (minimum)
  step: number;      // Linear progression step
  scale: number;     // Quadratic scaling factor
}

// Default configuration for smooth progression
export const defaultXPConfig: XPConfig = {
  base: 500,    // Base XP for level 1
  step: 200,    // Linear step increase
  scale: 10     // Quadratic scaling
};

// Alternative configurations for different game feels
export const xpConfigs = {
  // Current default - balanced progression
  balanced: defaultXPConfig,
  
  // Faster early levels, slower late game
  casual: {
    base: 300,
    step: 150,
    scale: 15
  },
  
  // Slower early levels, faster late game
  hardcore: {
    base: 800,
    step: 300,
    scale: 5
  },
  
  // Very fast early levels, very slow late game
  mobile: {
    base: 200,
    step: 100,
    scale: 25
  }
};

// Get XP required for a specific level
export function getXPForLevel(level: number, config: XPConfig = defaultXPConfig): number {
  if (level <= 1) return 0;
  
  // Calculate total XP needed to reach this level
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    const levelXP = config.base + (config.step * (i - 1)) + (config.scale * Math.pow(i - 1, 2));
    totalXP += levelXP;
  }
  
  return totalXP;
}

// Get level from total XP
export function getLevelFromXP(totalXP: number, config: XPConfig = defaultXPConfig): number {
  if (totalXP < 0) return 1;
  
  let level = 1;
  let xpNeeded = 0;
  
  while (xpNeeded <= totalXP) {
    level++;
    const levelXP = config.base + (config.step * (level - 1)) + (config.scale * Math.pow(level - 1, 2));
    xpNeeded += levelXP;
  }
  
  return level - 1;
}

// Get XP needed for next level
export function getXPToNextLevel(currentXP: number, config: XPConfig = defaultXPConfig): number {
  const currentLevel = getLevelFromXP(currentXP, config);
  const nextLevelXP = getXPForLevel(currentLevel + 1, config);
  return nextLevelXP - currentXP;
}

// Get XP needed for current level (from previous level)
export function getXPForCurrentLevel(level: number, config: XPConfig = defaultXPConfig): number {
  if (level <= 1) return 0;
  return config.base + (config.step * (level - 1)) + (config.scale * Math.pow(level - 1, 2));
}

// Get level info with all XP details
export interface LevelInfo {
  level: number;
  currentLevelXP: number;    // XP needed for current level
  totalXPNeeded: number;     // Total XP needed to reach current level
  xpToNext: number;          // XP needed to reach next level
  progressPercent: number;   // Progress percentage to next level
}

export function getLevelInfo(currentXP: number, config: XPConfig = defaultXPConfig): LevelInfo {
  const level = getLevelFromXP(currentXP, config);
  const totalXPNeeded = getXPForLevel(level, config);
  const xpToNext = getXPToNextLevel(currentXP, config);
  const currentLevelXP = getXPForCurrentLevel(level, config);
  
  // Calculate progress percentage
  const progressPercent = currentLevelXP > 0 ? 
    ((currentXP - totalXPNeeded) / currentLevelXP) * 100 : 0;
  
  return {
    level,
    currentLevelXP,
    totalXPNeeded,
    xpToNext,
    progressPercent: Math.max(0, Math.min(100, progressPercent))
  };
}

// Test function to validate XP progression
export function testXPProgression(config: XPConfig = defaultXPConfig): void {
  console.log('🧪 Testing XP Progression with config:', config);
  console.log('Level | Total XP | Level XP | XP to Next');
  console.log('------|----------|----------|-----------');
  
  const testLevels = [1, 5, 10, 20, 30, 50, 75, 100];
  
  for (const level of testLevels) {
    const totalXP = getXPForLevel(level, config);
    const levelXP = getXPForCurrentLevel(level, config);
    const nextLevelXP = getXPForLevel(level + 1, config);
    const xpToNext = nextLevelXP - totalXP;
    
    console.log(`${level.toString().padStart(5)} | ${totalXP.toLocaleString().padStart(8)} | ${levelXP.toLocaleString().padStart(8)} | ${xpToNext.toLocaleString().padStart(8)}`);
  }
  
  // Test reverse calculation
  console.log('\n🔄 Testing reverse calculation (XP -> Level):');
  const testXPValues = [100, 1000, 10000, 100000];
  
  for (const xp of testXPValues) {
    const level = getLevelFromXP(xp, config);
    const levelInfo = getLevelInfo(xp, config);
    console.log(`XP ${xp.toLocaleString().padStart(6)} -> Level ${level} (${levelInfo.progressPercent.toFixed(1)}% to next)`);
  }
}


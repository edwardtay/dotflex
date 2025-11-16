/**
 * Gamification System for DotFlex
 * 
 * Level up by flexing your DOT holdings with ZK proofs
 * Achievements, badges, and progression tracking
 */

export interface UserLevel {
  level: number
  xp: number
  xpToNextLevel: number
  totalXp: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: number
  category: 'balance' | 'proof' | 'staking' | 'social' | 'streak'
}

export interface FlexStats {
  totalProofsGenerated: number
  highestThresholdProved: bigint
  totalSnapshots: number
  longestStreak: number
  currentStreak: number
  lastProofDate: number
  badges: string[]
}

const XP_PER_PROOF = 10
const XP_PER_SNAPSHOT = 15
const XP_PER_THRESHOLD_100 = 5 // Bonus XP per 100 DOT threshold
const XP_PER_STREAK_DAY = 3

const XP_FOR_LEVEL = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1))
}

/**
 * Calculate user level from total XP
 */
export function calculateLevel(totalXp: number): UserLevel {
  let level = 1
  let xpForCurrentLevel = 0
  let xpToNextLevel = XP_FOR_LEVEL(1)
  
  while (totalXp >= xpForCurrentLevel + xpToNextLevel) {
    xpForCurrentLevel += xpToNextLevel
    level++
    xpToNextLevel = XP_FOR_LEVEL(level)
  }
  
  const xp = totalXp - xpForCurrentLevel
  
  return {
    level,
    xp,
    xpToNextLevel,
    totalXp
  }
}

/**
 * Award XP for generating a proof
 */
export function awardProofXp(threshold: bigint): number {
  const thresholdDOT = Number(threshold) / 10 ** 10
  const thresholdBonus = Math.floor(thresholdDOT / 100) * XP_PER_THRESHOLD_100
  return XP_PER_PROOF + thresholdBonus
}

/**
 * Award XP for creating a snapshot
 */
export function awardSnapshotXp(): number {
  return XP_PER_SNAPSHOT
}

/**
 * Check and update streak
 */
export function updateStreak(lastProofDate: number, currentStreak: number): {
  currentStreak: number
  streakBonus: number
} {
  const now = Date.now()
  const daysSinceLastProof = Math.floor((now - lastProofDate) / (1000 * 60 * 60 * 24))
  
  if (daysSinceLastProof === 0) {
    // Same day, no change
    return { currentStreak, streakBonus: 0 }
  } else if (daysSinceLastProof === 1) {
    // Consecutive day, increment streak
    const newStreak = currentStreak + 1
    return { 
      currentStreak: newStreak, 
      streakBonus: newStreak * XP_PER_STREAK_DAY 
    }
  } else {
    // Streak broken
    return { currentStreak: 1, streakBonus: XP_PER_STREAK_DAY }
  }
}

/**
 * Get all achievements
 */
export function getAllAchievements(): Achievement[] {
  return [
    {
      id: 'first-proof',
      name: 'First Flex',
      description: 'Generate your first ZK proof',
      icon: '🎯',
      unlocked: false,
      category: 'proof'
    },
    {
      id: 'whale-flex',
      name: 'Whale Flex',
      description: 'Prove balance > 10,000 DOT',
      icon: '🐋',
      unlocked: false,
      category: 'balance'
    },
    {
      id: 'dolphin-flex',
      name: 'Dolphin Flex',
      description: 'Prove balance > 1,000 DOT',
      icon: '🐬',
      unlocked: false,
      category: 'balance'
    },
    {
      id: 'shark-flex',
      name: 'Shark Flex',
      description: 'Prove balance > 100 DOT',
      icon: '🦈',
      unlocked: false,
      category: 'balance'
    },
    {
      id: 'snapshot-master',
      name: 'Snapshot Master',
      description: 'Create 10 historical snapshots',
      icon: '📸',
      unlocked: false,
      category: 'proof'
    },
    {
      id: 'proof-streak-7',
      name: 'Week Warrior',
      description: 'Generate proofs for 7 consecutive days',
      icon: '🔥',
      unlocked: false,
      category: 'streak'
    },
    {
      id: 'proof-streak-30',
      name: 'Monthly Flexer',
      description: 'Generate proofs for 30 consecutive days',
      icon: '💪',
      unlocked: false,
      category: 'streak'
    },
    {
      id: 'staker-flex',
      name: 'Staker Flex',
      description: 'Generate proof while staking DOT',
      icon: '💰',
      unlocked: false,
      category: 'staking'
    },
    {
      id: 'level-10',
      name: 'Level 10 Flexer',
      description: 'Reach level 10',
      icon: '⭐',
      unlocked: false,
      category: 'social'
    },
    {
      id: 'level-25',
      name: 'Level 25 Master',
      description: 'Reach level 25',
      icon: '🌟',
      unlocked: false,
      category: 'social'
    },
    {
      id: 'level-50',
      name: 'Level 50 Legend',
      description: 'Reach level 50',
      icon: '💎',
      unlocked: false,
      category: 'social'
    }
  ]
}

/**
 * Check achievements based on stats
 */
export function checkAchievements(
  stats: FlexStats,
  level: number,
  isStaking: boolean
): Achievement[] {
  const achievements = getAllAchievements()
  
  return achievements.map(achievement => {
    let unlocked = achievement.unlocked
    
    switch (achievement.id) {
      case 'first-proof':
        unlocked = stats.totalProofsGenerated > 0
        break
      case 'whale-flex':
        unlocked = stats.highestThresholdProved >= BigInt(10_000 * 10 ** 10)
        break
      case 'dolphin-flex':
        unlocked = stats.highestThresholdProved >= BigInt(1_000 * 10 ** 10)
        break
      case 'shark-flex':
        unlocked = stats.highestThresholdProved >= BigInt(100 * 10 ** 10)
        break
      case 'snapshot-master':
        unlocked = stats.totalSnapshots >= 10
        break
      case 'proof-streak-7':
        unlocked = stats.currentStreak >= 7
        break
      case 'proof-streak-30':
        unlocked = stats.currentStreak >= 30
        break
      case 'staker-flex':
        unlocked = isStaking
        break
      case 'level-10':
        unlocked = level >= 10
        break
      case 'level-25':
        unlocked = level >= 25
        break
      case 'level-50':
        unlocked = level >= 50
        break
    }
    
    return {
      ...achievement,
      unlocked
    }
  })
}

/**
 * Get flex title based on level
 */
export function getFlexTitle(level: number): string {
  if (level >= 50) return '💎 Legendary Flexer'
  if (level >= 25) return '🌟 Master Flexer'
  if (level >= 10) return '⭐ Elite Flexer'
  if (level >= 5) return '🔥 Advanced Flexer'
  if (level >= 2) return '💪 Flexer'
  return '🎯 Novice Flexer'
}


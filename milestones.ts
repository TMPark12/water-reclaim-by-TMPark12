// Milestone messages and tracking

export interface Milestone {
  level: number
  title: string
  message: string
  emoji: string
}

export const MILESTONES: Milestone[] = [
  {
    level: 1,
    title: 'Welcome to Water Reclaim!',
    message: '🌊 You\'ve started your mission to protect clean water. Let\'s go!',
    emoji: '🌊',
  },
  {
    level: 5,
    title: 'Making Progress!',
    message: '💪 Five levels down! You\'re getting better at finding clean water routes.',
    emoji: '💪',
  },
  {
    level: 10,
    title: 'One Challenge Completed!',
    message: '✅ You\'ve mastered the first 10 levels! Test your knowledge with trivia!',
    emoji: '✅',
  },
  {
    level: 15,
    title: 'Clean Water Champion!',
    message: '🏆 Fifteen levels defeated! Your water-finding skills are impressive.',
    emoji: '🏆',
  },
  {
    level: 20,
    title: 'Seriously Skilled!',
    message: '⭐ Twenty levels and counting! You\'re becoming a water protection expert.',
    emoji: '⭐',
  },
  {
    level: 25,
    title: 'Quarter Century Milestone!',
    message: '🎉 25 levels completed! This dedication will save lives in real communities.',
    emoji: '🎉',
  },
  {
    level: 30,
    title: 'Legendary Protector!',
    message: '👑 Thirty levels! Your commitment to clean water is truly legendary.',
    emoji: '👑',
  },
  {
    level: 50,
    title: 'ULTIMATE WATER GUARDIAN!',
    message: '💎 50 levels! You\'re a master of water reclamation and protection!',
    emoji: '💎',
  },
  {
    level: 100,
    title: 'IMMORTAL LEGEND!',
    message: '🌟 100 LEVELS! You are the greatest water protector in the world!',
    emoji: '🌟',
  },
]

export function getMilestoneForLevel(level: number): Milestone | null {
  return MILESTONES.find(m => m.level === level) || null
}

export function getNextMilestone(currentLevel: number): Milestone | null {
  return MILESTONES.find(m => m.level > currentLevel) || null
}

/**
 * Gamification utility functions
 * Handles points, levels, achievements, and missions
 */

export interface PointsConfig {
  booking: number;
  review: number;
  post: number;
  adoption: number;
  lostPet: number;
  vetVisit: number;
}

// Default points configuration
export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  booking: 50,
  review: 25,
  post: 10,
  adoption: 100,
  lostPet: 75,
  vetVisit: 30,
};

/**
 * Calculate level from points
 * Formula: level = floor(sqrt(points / 100)) + 1
 */
export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(Math.max(points, 0) / 100)) + 1;
}

/**
 * Calculate points needed for a specific level
 * Formula: points = (level - 1)^2 * 100
 */
export function pointsForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Calculate points needed for next level
 */
export function pointsForNextLevel(currentLevel: number): number {
  return pointsForLevel(currentLevel + 1);
}

/**
 * Calculate progress to next level (0-100)
 */
export function progressToNextLevel(currentPoints: number, currentLevel: number): number {
  const pointsForCurrent = pointsForLevel(currentLevel);
  const pointsForNext = pointsForNextLevel(currentLevel);
  const pointsInCurrentLevel = currentPoints - pointsForCurrent;
  const pointsNeeded = pointsForNext - pointsForCurrent;
  
  if (pointsNeeded === 0) return 100;
  return Math.min(100, Math.max(0, (pointsInCurrentLevel / pointsNeeded) * 100));
}

/**
 * Get points for an action type
 */
export function getPointsForAction(actionType: keyof PointsConfig, config: PointsConfig = DEFAULT_POINTS_CONFIG): number {
  return config[actionType] || 0;
}

/**
 * Award points for an action
 * This should be called from the backend, but we provide the utility here
 */
export async function awardPoints(
  userId: string,
  points: number,
  actionType: string,
  actionId?: string,
  description?: string
): Promise<void> {
  // This will be implemented as a Supabase function call
  // For now, it's a placeholder
  console.log(`Awarding ${points} points to user ${userId} for ${actionType}`);
}

/**
 * Check if user has achievement
 */
export function hasAchievement(achievements: string[], achievementCode: string): boolean {
  return achievements.includes(achievementCode);
}

/**
 * Get achievement icon
 */
export function getAchievementIcon(code: string): string {
  const icons: Record<string, string> = {
    first_booking: '🎉',
    booking_master: '📅',
    booking_expert: '⭐',
    first_review: '✍️',
    review_master: '📝',
    social_butterfly: '🦋',
    pet_hero: '🦸',
    adoption_angel: '👼',
    level_5: '🏆',
    level_10: '💎',
    level_20: '👑',
  };
  return icons[code] || '🏅';
}

/**
 * Format points with locale
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('es-CL');
}

/**
 * Get level name/color
 */
export function getLevelInfo(level: number): { name: string; color: string } {
  if (level >= 20) return { name: 'Leyenda', color: 'text-purple-600' };
  if (level >= 10) return { name: 'Experto', color: 'text-blue-600' };
  if (level >= 5) return { name: 'Avanzado', color: 'text-green-600' };
  return { name: 'Principiante', color: 'text-gray-600' };
}


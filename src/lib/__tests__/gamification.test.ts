import { describe, it, expect } from 'vitest';
import {
  calculateLevel,
  pointsForLevel,
  pointsForNextLevel,
  progressToNextLevel,
  getPointsForAction,
  hasAchievement,
  getAchievementIcon,
  formatPoints,
  getLevelInfo,
  DEFAULT_POINTS_CONFIG,
} from '../gamification';

describe('calculateLevel', () => {
  it('returns 1 for 0 points', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns 1 for 99 points', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('returns 2 for 100 points', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('returns 1 for negative points', () => {
    expect(calculateLevel(-50)).toBe(1);
  });

  it('returns 11 for 10000 points', () => {
    expect(calculateLevel(10000)).toBe(11);
  });
});

describe('pointsForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(pointsForLevel(1)).toBe(0);
  });

  it('returns 100 for level 2', () => {
    expect(pointsForLevel(2)).toBe(100);
  });

  it('returns 400 for level 3', () => {
    expect(pointsForLevel(3)).toBe(400);
  });
});

describe('pointsForNextLevel', () => {
  it('returns 100 for level 1', () => {
    expect(pointsForNextLevel(1)).toBe(100);
  });
});

describe('progressToNextLevel', () => {
  it('returns 0 at start of level', () => {
    expect(progressToNextLevel(0, 1)).toBe(0);
  });

  it('returns 50 at halfway', () => {
    expect(progressToNextLevel(50, 1)).toBe(50);
  });

  it('caps at 100', () => {
    expect(progressToNextLevel(200, 1)).toBe(100);
  });
});

describe('getPointsForAction', () => {
  it('returns correct points for booking', () => {
    expect(getPointsForAction('booking')).toBe(DEFAULT_POINTS_CONFIG.booking);
  });

  it('returns correct points for review', () => {
    expect(getPointsForAction('review')).toBe(25);
  });
});

describe('hasAchievement', () => {
  it('returns true when achievement exists', () => {
    expect(hasAchievement(['first_booking', 'level_5'], 'first_booking')).toBe(true);
  });

  it('returns false when achievement missing', () => {
    expect(hasAchievement(['first_booking'], 'level_5')).toBe(false);
  });
});

describe('getAchievementIcon', () => {
  it('returns correct icon for known code', () => {
    expect(getAchievementIcon('first_booking')).toBe('🎉');
  });

  it('returns default icon for unknown code', () => {
    expect(getAchievementIcon('unknown')).toBe('🏅');
  });
});

describe('formatPoints', () => {
  it('formats large numbers with locale', () => {
    const result = formatPoints(10000);
    expect(result).toContain('10');
  });
});

describe('getLevelInfo', () => {
  it('returns Principiante for level 1', () => {
    expect(getLevelInfo(1).name).toBe('Principiante');
  });

  it('returns Avanzado for level 5', () => {
    expect(getLevelInfo(5).name).toBe('Avanzado');
  });

  it('returns Experto for level 10', () => {
    expect(getLevelInfo(10).name).toBe('Experto');
  });

  it('returns Leyenda for level 20+', () => {
    expect(getLevelInfo(20).name).toBe('Leyenda');
    expect(getLevelInfo(25).name).toBe('Leyenda');
  });
});

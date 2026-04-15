import { describe, it, expect } from 'vitest';
import { getLevelFromPoints, LEVELS } from '../levels';

describe('LEVELS constant', () => {
  it('has 10 levels', () => {
    expect(LEVELS).toHaveLength(10);
  });

  it('starts at level 1 with 0 minPoints', () => {
    expect(LEVELS[0].level).toBe(1);
    expect(LEVELS[0].minPoints).toBe(0);
  });

  it('ends at level 10', () => {
    expect(LEVELS[LEVELS.length - 1].level).toBe(10);
  });

  it('has strictly increasing minPoints', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minPoints).toBeGreaterThan(LEVELS[i - 1].minPoints);
    }
  });

  it('has unique level numbers', () => {
    const levels = LEVELS.map((l) => l.level);
    expect(new Set(levels).size).toBe(levels.length);
  });
});

describe('getLevelFromPoints', () => {
  it('returns level 1 for 0 points', () => {
    const result = getLevelFromPoints(0);
    expect(result.level).toBe(1);
    expect(result.name).toBe('Cachorro');
    expect(result.progressPercent).toBe(0);
    expect(result.nextLevelPoints).toBe(150);
  });

  it('returns level 1 at 149 points with ~99% progress', () => {
    const result = getLevelFromPoints(149);
    expect(result.level).toBe(1);
    expect(result.progressPercent).toBe(99); // 149/150 = 99.3 → 99
  });

  it('returns level 2 at exactly 150 points', () => {
    const result = getLevelFromPoints(150);
    expect(result.level).toBe(2);
    expect(result.name).toBe('Explorador');
    expect(result.progressPercent).toBe(0);
    expect(result.nextLevelPoints).toBe(400);
  });

  it('returns level 10 at 12000 points', () => {
    const result = getLevelFromPoints(12000);
    expect(result.level).toBe(10);
    expect(result.name).toBe('Paw Master');
    expect(result.nextLevelPoints).toBeNull();
    expect(result.progressPercent).toBe(100);
  });

  it('returns level 10 for points beyond max', () => {
    const result = getLevelFromPoints(999999);
    expect(result.level).toBe(10);
    expect(result.progressPercent).toBe(100);
  });

  it('calculates mid-level progress correctly', () => {
    // Level 3: minPoints=400, nextLevel=800 (range 400)
    // At 600: (600-400)/(800-400) = 200/400 = 50%
    const result = getLevelFromPoints(600);
    expect(result.level).toBe(3);
    expect(result.progressPercent).toBe(50);
  });

  it('handles each level threshold exactly', () => {
    const thresholds = [0, 150, 400, 800, 1500, 2500, 4000, 6000, 8500, 12000];
    thresholds.forEach((pts, idx) => {
      const result = getLevelFromPoints(pts);
      expect(result.level).toBe(idx + 1);
    });
  });

  it('handles one point below each threshold', () => {
    const thresholds = [150, 400, 800, 1500, 2500, 4000, 6000, 8500, 12000];
    thresholds.forEach((pts, idx) => {
      const result = getLevelFromPoints(pts - 1);
      expect(result.level).toBe(idx + 1); // still at previous level
    });
  });

  it('handles negative points gracefully', () => {
    const result = getLevelFromPoints(-10);
    expect(result.level).toBe(1);
  });
});

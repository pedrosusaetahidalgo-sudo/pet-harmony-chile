interface LevelInfo {
  level: number;
  name: string;
  icon: string;
  color: string;
  minPoints: number;
  nextLevelPoints: number | null;
  progressPercent: number;
}

const LEVELS = [
  { level: 1, name: "Cachorro", icon: "🐾", color: "text-gray-500", minPoints: 0 },
  { level: 2, name: "Explorador", icon: "🔍", color: "text-blue-500", minPoints: 150 },
  { level: 3, name: "Compañero", icon: "🤝", color: "text-green-500", minPoints: 400 },
  { level: 4, name: "Protector", icon: "🛡️", color: "text-teal-500", minPoints: 800 },
  { level: 5, name: "Guardián", icon: "⭐", color: "text-yellow-500", minPoints: 1500 },
  { level: 6, name: "Guardián Senior", icon: "🌟", color: "text-amber-500", minPoints: 2500 },
  { level: 7, name: "Héroe Animal", icon: "🦸", color: "text-orange-500", minPoints: 4000 },
  { level: 8, name: "Leyenda", icon: "👑", color: "text-red-500", minPoints: 6000 },
  { level: 9, name: "Campeón", icon: "🏆", color: "text-purple-500", minPoints: 8500 },
  { level: 10, name: "Paw Master", icon: "💎", color: "text-primary", minPoints: 12000 },
];

export function getLevelFromPoints(points: number): LevelInfo {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (points >= lvl.minPoints) current = lvl;
    else break;
  }

  const nextLevel = LEVELS.find((l) => l.level === current.level + 1);
  const nextLevelPoints = nextLevel?.minPoints ?? null;

  let progressPercent = 100;
  if (nextLevelPoints !== null) {
    const pointsInLevel = points - current.minPoints;
    const pointsNeeded = nextLevelPoints - current.minPoints;
    progressPercent = Math.min(Math.round((pointsInLevel / pointsNeeded) * 100), 100);
  }

  return {
    ...current,
    nextLevelPoints,
    progressPercent,
  };
}

export { LEVELS };
export type { LevelInfo };

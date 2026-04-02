import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Crown, Star, Zap, Flame, Trophy } from "lucide-react";

interface GuardianLevel {
  id: string;
  level_number: number;
  level_name: string;
  min_points: number;
  max_points: number;
  badge_icon: string | null;
  bonus_multiplier: number;
  description: string | null;
}

interface UserProgress {
  id: string;
  user_id: string;
  total_paw_points: number;
  current_level: number;
  current_level_points: number;
  streak_days: number;
  last_activity_date: string | null;
}

interface GuardianProgressProps {
  userProgress: UserProgress | null;
  currentLevel: GuardianLevel | null;
  nextLevel: GuardianLevel | null;
  progressPercent: number;
}

// 10 Tiers with unique colors and icons
const TIERS = [
  { min: 1, max: 1, name: "Cachorro Curioso", icon: Zap, gradient: "from-gray-400 to-gray-500", color: "text-gray-400" },
  { min: 2, max: 2, name: "Explorador Novato", icon: Zap, gradient: "from-green-400 to-emerald-500", color: "text-green-400" },
  { min: 3, max: 4, name: "Guardián Aprendiz", icon: Star, gradient: "from-emerald-500 to-teal-500", color: "text-emerald-400" },
  { min: 5, max: 7, name: "Protector de Patitas", icon: Star, gradient: "from-cyan-500 to-blue-500", color: "text-cyan-400" },
  { min: 8, max: 10, name: "Héroe Animal", icon: Star, gradient: "from-blue-500 to-indigo-500", color: "text-blue-400" },
  { min: 11, max: 15, name: "Campeón de Huellas", icon: Trophy, gradient: "from-indigo-500 to-purple-500", color: "text-indigo-400" },
  { min: 16, max: 20, name: "Maestro Guardian", icon: Trophy, gradient: "from-purple-500 to-pink-500", color: "text-purple-400" },
  { min: 21, max: 30, name: "Leyenda Peluda", icon: Crown, gradient: "from-pink-500 to-rose-500", color: "text-pink-400" },
  { min: 31, max: 40, name: "Guardián Supremo", icon: Crown, gradient: "from-amber-500 to-orange-500", color: "text-amber-400" },
  { min: 41, max: 999, name: "Deidad de las Mascotas", icon: Crown, gradient: "from-yellow-400 via-amber-400 to-orange-400", color: "text-yellow-300" },
];

const getTier = (level: number) => {
  return TIERS.find(t => level >= t.min && level <= t.max) || TIERS[0];
};

const getLevelIcon = (level: number) => {
  const tier = getTier(level);
  const Icon = tier.icon;
  return <Icon className={`h-8 w-8 ${tier.color}`} />;
};

const getLevelGradient = (level: number) => {
  return getTier(level).gradient;
};

export const GuardianProgress = ({ 
  userProgress, 
  currentLevel, 
  nextLevel,
  progressPercent 
}: GuardianProgressProps) => {
  const level = userProgress?.current_level || 1;
  const points = userProgress?.total_paw_points || 0;
  const streak = userProgress?.streak_days || 0;
  const multiplier = currentLevel?.bonus_multiplier || 1;

  return (
    <Card className="bg-background/60 backdrop-blur border-0 shadow-xl mt-4">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Level Badge */}
          <div className="flex items-center gap-4">
            <div className={`relative p-4 rounded-2xl bg-gradient-to-br ${getLevelGradient(level)} shadow-lg`}>
              {getLevelIcon(level)}
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full px-2 py-0.5 shadow-md border">
                <span className="text-xs font-bold">{level}</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">{currentLevel?.level_name || getTier(level).name}</h3>
              <p className="text-sm text-muted-foreground">{currentLevel?.description || "Comenzando tu aventura"}</p>
              {multiplier > 1 && (
                <Badge variant="secondary" className="mt-1 bg-yellow-500/10 text-yellow-600">
                  <Zap className="h-3 w-3 mr-1" />
                  x{multiplier} bonus
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 w-full md:w-auto">
            {/* Progress to next level */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Progreso al nivel {level + 1}</span>
                <span className="font-semibold text-primary">
                  {points.toLocaleString()} / {nextLevel?.min_points?.toLocaleString() || '∞'} pts
                </span>
              </div>
              <Progress 
                value={Math.min(progressPercent, 100)} 
                className="h-3 bg-muted"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                <p className="text-lg font-bold">{points.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">PawPoints</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Star className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <p className="text-lg font-bold">{level}</p>
                <p className="text-[10px] text-muted-foreground">Nivel</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                <p className="text-lg font-bold">{streak}</p>
                <p className="text-[10px] text-muted-foreground">Racha días</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

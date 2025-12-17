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

const getLevelIcon = (level: number) => {
  if (level >= 40) return <Crown className="h-8 w-8 text-yellow-400" />;
  if (level >= 25) return <Trophy className="h-8 w-8 text-purple-400" />;
  if (level >= 10) return <Star className="h-8 w-8 text-blue-400" />;
  return <Zap className="h-8 w-8 text-emerald-400" />;
};

const getLevelGradient = (level: number) => {
  if (level >= 40) return "from-yellow-500 via-amber-500 to-orange-500";
  if (level >= 25) return "from-purple-500 via-pink-500 to-rose-500";
  if (level >= 10) return "from-blue-500 via-cyan-500 to-teal-500";
  return "from-emerald-500 via-green-500 to-lime-500";
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
              <h3 className="font-bold text-lg">{currentLevel?.level_name || "Cachorro Curioso"}</h3>
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

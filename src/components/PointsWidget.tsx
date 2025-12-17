import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { calculateLevel, pointsForNextLevel, progressToNextLevel, formatPoints, getLevelInfo } from "@/lib/gamification";

interface PointsWidgetProps {
  points: number;
  level?: number;
  showProgress?: boolean;
  compact?: boolean;
}

const PointsWidget = ({ points, level, showProgress = true, compact = false }: PointsWidgetProps) => {
  const currentLevel = level || calculateLevel(points);
  const nextLevelPoints = pointsForNextLevel(currentLevel);
  const progress = progressToNextLevel(points, currentLevel);
  const levelInfo = getLevelInfo(currentLevel);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-sm">{formatPoints(points)}</span>
        </div>
        <Badge variant="outline" className={levelInfo.color}>
          Nivel {currentLevel}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Puntos</p>
              <p className="text-2xl font-bold">{formatPoints(points)}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={levelInfo.color.replace('text-', 'bg-').replace('-600', '-100') + ' ' + levelInfo.color}>
              Nivel {currentLevel}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">{levelInfo.name}</p>
          </div>
        </div>

        {showProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progreso al siguiente nivel</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {formatPoints(nextLevelPoints - points)} puntos para nivel {currentLevel + 1}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Gana puntos completando acciones</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsWidget;


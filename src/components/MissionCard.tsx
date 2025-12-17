import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface MissionCardProps {
  mission: {
    id: string;
    name: string;
    description: string;
    mission_type: "daily" | "weekly" | "special";
    target_count: number;
    points_reward: number;
    progress?: number;
    completed?: boolean;
    expires_at?: string;
  };
  onComplete?: () => void;
}

const MissionCard = ({ mission, onComplete }: MissionCardProps) => {
  const progress = mission.progress || 0;
  const progressPercent = Math.min(100, (progress / mission.target_count) * 100);
  const isCompleted = mission.completed || progress >= mission.target_count;
  const isExpired = mission.expires_at && new Date(mission.expires_at) < new Date();

  const typeColors = {
    daily: "bg-blue-500",
    weekly: "bg-purple-500",
    special: "bg-orange-500",
  };

  const typeLabels = {
    daily: "Diaria",
    weekly: "Semanal",
    special: "Especial",
  };

  return (
    <Card className={isCompleted ? "opacity-75" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${typeColors[mission.mission_type]} text-white text-xs`}>
                {typeLabels[mission.mission_type]}
              </Badge>
              {isCompleted && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completada
                </Badge>
              )}
              {isExpired && !isCompleted && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  Expirada
                </Badge>
              )}
            </div>
            <h4 className="font-semibold text-sm">{mission.name}</h4>
            <p className="text-xs text-muted-foreground">{mission.description}</p>
          </div>
          <div className="text-right">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">
              {progress} / {mission.target_count}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {mission.expires_at && !isExpired && (
              <span>Expira {formatDistanceToNow(new Date(mission.expires_at), { addSuffix: true, locale: es })}</span>
            )}
            {isExpired && <span>Expirada</span>}
          </div>
          <Badge variant="outline" className="text-xs">
            +{mission.points_reward} puntos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default MissionCard;


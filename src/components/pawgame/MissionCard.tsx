import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Lock, 
  ArrowRight, 
  CheckCircle2,
  Dog,
  Syringe,
  Users,
  Heart,
  MapPin,
  Camera,
  Star,
  MessageCircle,
  Search,
  Calendar,
  Stethoscope,
  PawPrint,
  BookOpen
} from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  category: string;
  target_action: string;
  target_count: number;
  points_reward: number;
  icon: string | null;
  required_level: number;
  story_chapter: number | null;
  is_active: boolean;
}

interface MissionCardProps {
  mission: Mission;
  userLevel: number;
  onNavigate: (path: string) => void;
  isStory?: boolean;
  currentProgress?: number;
}

const getActionIcon = (action: string) => {
  const icons: Record<string, any> = {
    'walk': Dog,
    'vaccine': Syringe,
    'social': Users,
    'adopt': Heart,
    'explore': MapPin,
    'post': Camera,
    'review': Star,
    'chat': MessageCircle,
    'search': Search,
    'appointment': Calendar,
    'vet': Stethoscope,
    'pet': PawPrint,
    'story': BookOpen,
  };
  return icons[action] || PawPrint;
};

const getActionPath = (action: string) => {
  const paths: Record<string, string> = {
    'walk': '/dog-walkers',
    'vaccine': '/medical-records',
    'social': '/shared-walks',
    'adopt': '/adoption',
    'explore': '/maps',
    'post': '/feed',
    'review': '/dog-walkers',
    'chat': '/chat',
    'search': '/places',
    'appointment': '/medical-records',
    'vet': '/home-vets',
    'pet': '/my-pets',
  };
  return paths[action] || '/home';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'health': 'from-emerald-500 to-teal-500',
    'activity': 'from-blue-500 to-cyan-500',
    'community': 'from-purple-500 to-pink-500',
    'adoption': 'from-rose-500 to-red-500',
    'exploration': 'from-orange-500 to-amber-500',
    'social': 'from-indigo-500 to-violet-500',
  };
  return colors[category] || 'from-gray-500 to-slate-500';
};

export const MissionCard = ({ 
  mission, 
  userLevel, 
  onNavigate,
  isStory = false,
  currentProgress = 0
}: MissionCardProps) => {
  const Icon = getActionIcon(mission.target_action);
  const isLocked = mission.required_level > userLevel;
  const isCompleted = currentProgress >= mission.target_count;
  const progressPercent = Math.min((currentProgress / mission.target_count) * 100, 100);

  return (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${isLocked ? 'opacity-60' : ''} ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
      {isStory && mission.story_chapter && (
        <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg">
          Cap. {mission.story_chapter}
        </div>
      )}
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${getCategoryColor(mission.category)} flex-shrink-0`}>
            {isLocked ? (
              <Lock className="h-5 w-5 text-white" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-white" />
            ) : (
              <Icon className="h-5 w-5 text-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold truncate">{mission.title}</h4>
              {isCompleted && (
                <Badge className="bg-green-500/10 text-green-600 text-[10px]">
                  ✓ Completada
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {mission.description}
            </p>
            
            {/* Progress bar */}
            {!isLocked && !isCompleted && (
              <div className="mb-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{currentProgress}/{mission.target_count}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5" />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 text-xs">
                +{mission.points_reward} pts
              </Badge>
              
              {isLocked ? (
                <span className="text-[10px] text-muted-foreground">
                  Nivel {mission.required_level} requerido
                </span>
              ) : !isCompleted ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => onNavigate(getActionPath(mission.target_action))}
                >
                  Ir
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

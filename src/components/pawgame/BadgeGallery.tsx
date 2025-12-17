import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Activity, 
  Users, 
  Sparkles,
  Lock,
  CheckCircle2,
  Shield,
  Star,
  Award,
  PawPrint,
  Syringe,
  Dog,
  Home,
  Search,
  MessageCircle
} from "lucide-react";

interface PawBadge {
  id: string;
  badge_key: string;
  name: string;
  description: string;
  category: string;
  unlock_condition: string;
  unlock_value: number;
  points_bonus: number;
  rarity: string;
  icon: string | null;
}

interface BadgeGalleryProps {
  badges: PawBadge[];
  userBadges: string[];
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    'health': Shield,
    'activity': Activity,
    'community': Users,
    'adoption': Heart,
    'services': Home,
    'special': Sparkles,
  };
  return icons[category] || Award;
};

const getBadgeIcon = (icon: string | null, category: string) => {
  if (!icon) return getCategoryIcon(category);
  const icons: Record<string, any> = {
    'paw': PawPrint,
    'heart': Heart,
    'shield': Shield,
    'star': Star,
    'syringe': Syringe,
    'dog': Dog,
    'users': Users,
    'home': Home,
    'search': Search,
    'message': MessageCircle,
    'activity': Activity,
  };
  return icons[icon] || getCategoryIcon(category);
};

const getRarityColor = (rarity: string) => {
  const colors: Record<string, string> = {
    'common': 'from-gray-400 to-slate-500',
    'uncommon': 'from-green-400 to-emerald-500',
    'rare': 'from-blue-400 to-cyan-500',
    'epic': 'from-purple-400 to-pink-500',
    'legendary': 'from-yellow-400 to-orange-500',
  };
  return colors[rarity] || colors['common'];
};

const getRarityBorder = (rarity: string) => {
  const borders: Record<string, string> = {
    'common': 'border-gray-300',
    'uncommon': 'border-green-400',
    'rare': 'border-blue-400',
    'epic': 'border-purple-400',
    'legendary': 'border-yellow-400 ring-2 ring-yellow-400/30',
  };
  return borders[rarity] || borders['common'];
};

const categories = [
  { key: 'all', label: 'Todos', icon: Award },
  { key: 'health', label: 'Salud', icon: Shield },
  { key: 'activity', label: 'Actividad', icon: Activity },
  { key: 'community', label: 'Comunidad', icon: Users },
  { key: 'adoption', label: 'Adopción', icon: Heart },
  { key: 'special', label: 'Especiales', icon: Sparkles },
];

export const BadgeGallery = ({ badges, userBadges }: BadgeGalleryProps) => {
  const earnedCount = userBadges.length;
  const totalCount = badges.length;

  const renderBadgeCard = (badge: PawBadge) => {
    const isEarned = userBadges.includes(badge.id);
    const Icon = getBadgeIcon(badge.icon, badge.category);

    return (
      <Card 
        key={badge.id} 
        className={`relative overflow-hidden transition-all hover:scale-105 ${!isEarned ? 'opacity-50 grayscale' : ''} ${getRarityBorder(badge.rarity)}`}
      >
        {isEarned && (
          <div className="absolute top-1 right-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
        
        <CardContent className="p-4 text-center">
          <div className={`w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center shadow-lg`}>
            {isEarned ? (
              <Icon className="h-7 w-7 text-white" />
            ) : (
              <Lock className="h-6 w-6 text-white/70" />
            )}
          </div>
          
          <h4 className="font-semibold text-sm mb-1 line-clamp-1">{badge.name}</h4>
          <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
            {badge.description}
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-[10px] capitalize ${isEarned ? 'bg-primary/10' : ''}`}
            >
              {badge.rarity}
            </Badge>
            {badge.points_bonus > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600">
                +{badge.points_bonus} pts
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">{earnedCount} / {totalCount}</h3>
              <p className="text-sm text-muted-foreground">Logros desbloqueados</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-bold">{Math.round((earnedCount / totalCount) * 100)}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Completado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/50 p-2 rounded-xl">
          {categories.map((cat) => (
            <TabsTrigger 
              key={cat.key}
              value={cat.key}
              className="flex-1 min-w-[80px] text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <cat.icon className="h-3 w-3 mr-1" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {badges.map(renderBadgeCard)}
          </div>
        </TabsContent>

        {categories.slice(1).map((cat) => (
          <TabsContent key={cat.key} value={cat.key} className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {badges.filter(b => b.category === cat.key).map(renderBadgeCard)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

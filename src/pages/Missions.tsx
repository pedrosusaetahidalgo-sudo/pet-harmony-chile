import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Trophy,
  Sparkles,
  CheckCircle2,
  Lock,
  Crown,
  Star,
  Heart,
  Users,
  PawPrint,
  Flame,
  Zap,
} from '@/lib/icons';
import { useMissions, type MissionProgress } from '@/hooks/useMissions';
import { useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';
import { PawLabsBanner } from '@/components/PawLabsBanner';

type CategoryTab =
  | 'all'
  | 'collection_species'
  | 'collection_quantity'
  | 'collection_rarity'
  | 'social'
  | 'care';

const CATEGORY_CONFIG: { key: CategoryTab; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Todas', icon: Trophy },
  { key: 'collection_species', label: 'Especies', icon: PawPrint },
  { key: 'collection_quantity', label: 'Cantidad', icon: Star },
  { key: 'collection_rarity', label: 'Rareza', icon: Sparkles },
  { key: 'social', label: 'Social', icon: Users },
  { key: 'care', label: 'Cuidado', icon: Heart },
];

function MissionCardNew({ mission }: { mission: MissionProgress }) {
  const progressPercent =
    mission.target > 0 ? Math.min(100, (mission.current / mission.target) * 100) : 0;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        mission.unlocked
          ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/30'
          : 'border-border'
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0',
              mission.unlocked
                ? 'bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/25'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
            )}
          >
            {mission.unlocked ? (
              <Trophy className="h-5 w-5 text-white" />
            ) : (
              <Lock className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-semibold text-sm truncate">{mission.title}</h4>
              {mission.unlocked && (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{mission.description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {mission.current} / {mission.target}
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress
            value={progressPercent}
            className={cn('h-2', mission.unlocked && '[&>div]:bg-amber-400')}
          />
        </div>

        {/* Achievement title */}
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              mission.unlocked
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            )}
          >
            {mission.unlocked ? (
              <Crown className="h-3 w-3 mr-1" />
            ) : (
              <Lock className="h-3 w-3 mr-1" />
            )}
            {mission.achievementTitle}
          </Badge>
          {mission.unlockedAt && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(mission.unlockedAt).toLocaleDateString('es-CL')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementSelector({
  achievements,
  activeTitle,
  onSelect,
}: {
  achievements: { achievementTitle: string }[];
  activeTitle: string | null;
  onSelect: (title: string | null) => void;
}) {
  if (achievements.length === 0) return null;

  return (
    <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50 p-4">
      <p className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1.5">
        <Crown className="h-3.5 w-3.5" />
        Tu titulo activo
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
            !activeTitle
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
          )}
        >
          Sin titulo
        </button>
        {achievements.map((a) => (
          <button
            key={a.achievementTitle}
            onClick={() => onSelect(a.achievementTitle)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
              activeTitle === a.achievementTitle
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-400 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
            )}
          >
            {a.achievementTitle}
          </button>
        ))}
      </div>
    </div>
  );
}

const Missions = () => {
  const navigate = useNavigate();
  const { data: missions = [], isLoading } = useMissions();
  const { achievements, activeTitle, setActiveTitle } = useAchievements();
  const [tab, setTab] = useState<CategoryTab>('all');

  const filtered = tab === 'all' ? missions : missions.filter((m) => m.category === tab);
  const unlockedCount = missions.filter((m) => m.unlocked).length;

  return (
    <>
      <Helmet>
        <title>Misiones — Paw Friend</title>
      </Helmet>

      <div className="container px-4 py-8 max-w-4xl mx-auto animate-fade-in space-y-6">
        <PawLabsBanner description="Completa misiones de cuidado para desbloquear logros. Sistema en mejora continua." />

        {/* Contexto Paw Points — clarifica qué son y qué podrán hacer
            (auditoría top-tier 2026-04-20, C.4). Disipa confusión
            reportada por Palo: "veo puntos pero no sé para qué". */}
        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-yellow-50/40">
          <CardContent className="p-4 text-sm text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <Crown className="h-4 w-4 text-amber-600" />
              ¿Qué son los Paw Points?
            </div>
            <p className="leading-relaxed text-amber-900/85">
              Son reconocimiento por cuidar bien a tus peludos: completar recordatorios, llevar la
              ficha al día, agregar vacunas, invitar a tu vet. Los acumulás completando misiones.{' '}
              <span className="font-medium">Pronto</span> se podrán canjear por descuentos con
              nuestros Paw Partners (tiendas, peluquerías, seguros).
            </p>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display font-semibold text-3xl tracking-tight flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Misiones
            </h1>
            <p className="text-sm text-muted-foreground">
              Completa misiones para desbloquear logros
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Flame className="h-3 w-3 mr-1" />
            {unlockedCount} / {missions.length}
          </Badge>
        </div>

        {/* Achievement Selector */}
        <div className="mb-6">
          <AchievementSelector
            achievements={achievements}
            activeTitle={activeTitle}
            onSelect={(title) => setActiveTitle.mutate(title)}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_CONFIG.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={tab === key ? 'default' : 'outline'}
              size="sm"
              className={cn('shrink-0', tab === key ? 'bg-purple-600 hover:bg-purple-700' : '')}
              onClick={() => setTab(key)}
            >
              <Icon className="mr-1 h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton" />
                    <div className="h-3 w-48 skeleton" />
                  </div>
                </div>
                <div className="h-2 skeleton" />
              </div>
            ))}
          </div>
        )}

        {/* Missions Grid */}
        {!isLoading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((mission, i) => (
              <div
                key={mission.id}
                className={i < 6 ? 'animate-fade-in-up' : ''}
                style={i < 6 ? { animationDelay: `${i * 40}ms` } : undefined}
              >
                <MissionCardNew mission={mission} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground">No hay misiones en esta categoria</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Missions;

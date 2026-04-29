import { PawPrint, Users, TrendingUp, Compass } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface FeedEmptyStateProps {
  type: 'all' | 'following' | 'popular' | 'explore';
  onAction?: () => void;
}

const STATES = {
  all: {
    icon: PawPrint,
    title: 'No hay publicaciones todavía',
    description: '¡Sé el primero en compartir una foto de tu mascota!',
    actionLabel: 'Publicar',
  },
  following: {
    icon: Users,
    title: 'Aún no sigues a nadie',
    description: 'Explora para encontrar mascotas increíbles y sigue a sus dueños.',
    actionLabel: 'Explorar',
  },
  popular: {
    icon: TrendingUp,
    title: 'Sin publicaciones populares',
    description: 'Las publicaciones con más likes aparecerán aquí.',
    actionLabel: null,
  },
  explore: {
    icon: Compass,
    title: 'Nada que explorar todavía',
    description: 'Cuando haya más publicaciones, aparecerán aquí.',
    actionLabel: null,
  },
};

export function FeedEmptyState({ type, onAction }: FeedEmptyStateProps) {
  const state = STATES[type];
  const Icon = state.icon;
  const showIllustration = type === 'all' || type === 'explore';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {showIllustration ? (
        <img
          src="/brand-assets/illustrations/empty-states/no_feed.svg"
          alt=""
          aria-hidden="true"
          className="w-44 h-32 mb-3"
          loading="lazy"
        />
      ) : (
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1">{state.title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{state.description}</p>
      {state.actionLabel && onAction && (
        <Button onClick={onAction} className="bg-warm-gradient">
          {state.actionLabel}
        </Button>
      )}
    </div>
  );
}

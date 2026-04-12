import { PawPrint, Users, TrendingUp, Compass } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface FeedEmptyStateProps {
  type: 'all' | 'following' | 'popular' | 'explore';
  onAction?: () => void;
}

const STATES = {
  all: {
    icon: PawPrint,
    title: 'No hay publicaciones todavia',
    description: '¡Se el primero en compartir una foto de tu mascota!',
    actionLabel: 'Publicar',
  },
  following: {
    icon: Users,
    title: 'Aun no sigues a nadie',
    description: 'Explora para encontrar mascotas increibles y sigue a sus duenos.',
    actionLabel: 'Explorar',
  },
  popular: {
    icon: TrendingUp,
    title: 'Sin publicaciones populares',
    description: 'Las publicaciones con mas likes apareceran aqui.',
    actionLabel: null,
  },
  explore: {
    icon: Compass,
    title: 'Nada que explorar todavia',
    description: 'Cuando haya mas publicaciones, apareceran aqui.',
    actionLabel: null,
  },
};

export function FeedEmptyState({ type, onAction }: FeedEmptyStateProps) {
  const state = STATES[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
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

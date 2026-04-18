import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ExternalLink, Sparkles, Megaphone } from '@/lib/icons';
import { usePublicPawVoices } from '@/hooks/usePawVoices';
import { cn } from '@/lib/utils';

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  otro: 'Otro',
};

const PLATFORM_COLOR: Record<string, string> = {
  instagram: 'from-pink-500 via-fuchsia-500 to-orange-500',
  tiktok: 'from-slate-900 to-rose-500',
  youtube: 'from-red-500 to-red-700',
  linkedin: 'from-sky-600 to-sky-800',
  twitter: 'from-slate-700 to-slate-900',
  otro: 'from-violet-500 to-fuchsia-500',
};

function formatFollowers(n: number | null | undefined): string | null {
  if (!n || n < 1) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

interface PawVoicesGridProps {
  className?: string;
  limit?: number;
}

export function PawVoicesGrid({ className, limit }: PawVoicesGridProps) {
  const { data, isLoading, isError } = usePublicPawVoices();

  if (isError) return null;

  if (isLoading) {
    return (
      <section className={cn('space-y-3', className)} aria-label="Paw Voices">
        <Skeleton className="h-6 w-48 mx-auto" />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  const voices = typeof limit === 'number' ? data.slice(0, limit) : data;

  return (
    <section className={cn('space-y-4', className)} aria-label="Paw Voices">
      <header className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 rounded-full">
          <Megaphone className="h-3.5 w-3.5" />
          Paw Voices · red de creadores peludos
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Las voces que{' '}
          <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            amplifican la misión
          </span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Creadores peludos que comparten Paw Friend con su comunidad. ¿Te animas?{' '}
          <a
            href="#aplicar"
            className="underline underline-offset-2 font-medium"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('aplicar')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Aplica aquí
          </a>
          .
        </p>
      </header>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {voices.map((voice) => {
          const platformLabel = PLATFORM_LABEL[voice.platform] ?? voice.platform;
          const platformColor = PLATFORM_COLOR[voice.platform] ?? PLATFORM_COLOR.otro;
          const followers = formatFollowers(voice.followers_estimated);
          const content = (
            <CardContent className="p-4 space-y-2.5 h-full flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {voice.avatar_url ? (
                    <img
                      src={voice.avatar_url}
                      alt={`Avatar de ${voice.name}`}
                      loading="lazy"
                      className="h-10 w-10 rounded-full object-cover bg-muted"
                    />
                  ) : (
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center text-white',
                        `bg-gradient-to-br ${platformColor}`
                      )}
                    >
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{voice.name}</div>
                    {voice.handle && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {voice.handle}
                      </div>
                    )}
                  </div>
                </div>
                {voice.featured && (
                  <Badge className="shrink-0 text-[9px] bg-amber-500">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                    Destacado
                  </Badge>
                )}
              </div>
              <div className="flex-1 space-y-1">
                {voice.bio && (
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-3">
                    {voice.bio}
                  </p>
                )}
                {voice.speciality && (
                  <div className="text-[10px] text-violet-600 dark:text-violet-300 italic">
                    {voice.speciality}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dashed text-[11px] text-muted-foreground">
                <span className="truncate">{platformLabel}</span>
                {followers && <span>{followers} seguidores</span>}
              </div>
            </CardContent>
          );

          if (voice.profile_url) {
            return (
              <a
                key={voice.id}
                href={voice.profile_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block group"
              >
                <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5 border-violet-100 dark:border-violet-900/40">
                  {content}
                </Card>
              </a>
            );
          }

          return (
            <Card key={voice.id} className="h-full border-violet-100 dark:border-violet-900/40">
              {content}
            </Card>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <a
          href="#aplicar"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('aplicar')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-300 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          ¿Eres creador peludo? Suma tu voz
        </a>
      </div>
    </section>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, ExternalLink, Sparkles, PawPrint, Crown } from '@/lib/icons';
import { usePublicPawCompanys } from '@/hooks/usePawCompanys';
import { cn } from '@/lib/utils';

const TIER_STYLES: Record<
  'bronze' | 'silver' | 'gold',
  { label: string; badgeClass: string; cardClass: string }
> = {
  bronze: {
    label: 'Bronze',
    badgeClass:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200',
    cardClass: 'border-amber-200/60',
  },
  silver: {
    label: 'Silver',
    badgeClass:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
    cardClass: 'border-slate-200/80',
  },
  gold: {
    label: 'Gold',
    badgeClass: 'bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-900 border-amber-400',
    cardClass: 'border-amber-300/80 ring-1 ring-amber-200/60',
  },
};

interface PawCompanysGridProps {
  className?: string;
}

export function PawCompanysGrid({ className }: PawCompanysGridProps) {
  const { data, isLoading, isError } = usePublicPawCompanys();

  if (isError) return null;

  if (isLoading) {
    return (
      <section className={cn('space-y-3', className)} aria-label="Paw Companys">
        <Skeleton className="h-6 w-48 mx-auto" />
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className={cn('space-y-4', className)} aria-label="Paw Companys">
      <header className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full">
          <Sparkles className="h-3.5 w-3.5" />
          Paw Companys · empresas con corazón peludo
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Empresas que{' '}
          <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
            hacen posible Paw Friend
          </span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Aliados que patrocinan la causa todos los meses. ¿Tu empresa también ama a los peludos?{' '}
          <a
            href="mailto:pawfriendcl@gmail.com?subject=Quiero%20ser%20Paw%20Company"
            className="underline underline-offset-2 font-medium"
          >
            Escríbenos
          </a>
          .
        </p>
      </header>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {data.map((company) => {
          const tier = TIER_STYLES[company.tier];
          const isFounder = company.is_founder;
          const content = (
            <CardContent className="p-4 space-y-2.5 h-full flex flex-col">
              <div className="flex items-start justify-between gap-2">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`Logo ${company.name}`}
                    loading="lazy"
                    className="h-10 w-10 rounded-md object-contain bg-white border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col items-end gap-1">
                  {isFounder && (
                    <Badge
                      variant="outline"
                      className="text-[9px] font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 text-white border-0 px-2 py-0.5"
                    >
                      <Crown className="h-3 w-3 mr-0.5" />
                      FUNDADORA
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn('text-[10px]', tier.badgeClass)}>
                    <PawPrint className="h-3 w-3 mr-0.5" />
                    {tier.label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-0.5 flex-1">
                <h3 className="font-semibold text-sm leading-tight">{company.name}</h3>
                {company.description && (
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-3">
                    {company.description}
                  </p>
                )}
              </div>
              {company.website && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-dashed">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">Ver sitio</span>
                </div>
              )}
            </CardContent>
          );

          const founderCardClass = isFounder
            ? 'ring-2 ring-offset-2 ring-purple-400/60 shadow-purple-200/40'
            : '';

          if (company.website) {
            return (
              <a
                key={company.id}
                href={company.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block group"
              >
                <Card
                  className={cn(
                    'h-full transition-all hover:shadow-md hover:-translate-y-0.5',
                    tier.cardClass,
                    founderCardClass
                  )}
                >
                  {content}
                </Card>
              </a>
            );
          }

          return (
            <Card key={company.id} className={cn('h-full', tier.cardClass, founderCardClass)}>
              {content}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/**
 * /insights/:slug — Landing publica con stats agregadas anonimas.
 *
 * Refactor Maestro Fase 1 §6.5.
 *
 * Soporta 3 tipos de slug:
 *   - 'peso-promedio-{breed}-chile' → stats por raza (RPC get_public_insight)
 *   - 'mascotas-{species}-chile' → overview por especie (RPC get_public_species_insight)
 *   - 'top-razas-{species}-chile' → top 10 razas (RPC get_public_breeds_by_species)
 *
 * Threshold privacy: pet_count >= 50 en TODAS las queries.
 * Si el slug no existe o no llega al threshold → CTA "Agregar tu mascota"
 * (viral loop: cada signup acerca otro insight a estar publicado).
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, BarChart3, Heart, Sparkles, Activity } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/featureFlags';

type SlugKind = 'breed' | 'species' | 'breed_rank' | 'unknown';

interface BreedInsight {
  kind: 'breed';
  slug: string;
  title: string;
  breed: string;
  species: string;
  pet_count: number;
  avg_weight_kg: number;
  min_weight_kg: number;
  max_weight_kg: number;
  avg_age_years: number;
  count_male: number;
  count_female: number;
  count_neutered: number;
  refreshed_at: string;
}

interface SpeciesInsight {
  kind: 'species';
  slug: string;
  title: string;
  species: string;
  pet_count: number;
  avg_weight_kg: number;
  min_weight_kg: number;
  max_weight_kg: number;
  avg_age_years: number;
  count_male: number;
  count_female: number;
  count_neutered: number;
  distinct_breeds: number;
  refreshed_at: string;
}

interface BreedRankRow {
  slug: string;
  title: string;
  species: string;
  total_pets: number;
  total_breeds: number;
  rank: number;
  breed: string;
  breed_count: number;
  avg_weight_kg: number;
}

interface BreedRankInsight {
  kind: 'breed_rank';
  slug: string;
  title: string;
  species: string;
  total_pets: number;
  total_breeds: number;
  rows: BreedRankRow[];
}

type AnyInsight = BreedInsight | SpeciesInsight | BreedRankInsight;

function detectSlugKind(slug: string): SlugKind {
  if (slug.startsWith('peso-promedio-') && slug.endsWith('-chile')) return 'breed';
  if (slug.startsWith('mascotas-') && slug.endsWith('-chile')) return 'species';
  if (slug.startsWith('top-razas-') && slug.endsWith('-chile')) return 'breed_rank';
  return 'unknown';
}

export default function InsightsLanding() {
  const { slug } = useParams<{ slug: string }>();
  const flagEnabled = isFeatureEnabled('PUBLIC_INSIGHTS');
  const kind = slug ? detectSlugKind(slug) : 'unknown';

  const { data, isLoading } = useQuery<AnyInsight | null>({
    queryKey: ['public-insight', slug, kind],
    enabled: !!slug && flagEnabled && kind !== 'unknown',
    queryFn: async () => {
      if (!slug) return null;
      if (kind === 'breed') {
        const { data, error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .rpc('get_public_insight' as any, { p_slug: slug });
        if (error) throw error;
        const row = (data as Omit<BreedInsight, 'kind'>[] | null)?.[0];
        return row ? ({ kind: 'breed', ...row } as BreedInsight) : null;
      }
      if (kind === 'species') {
        const { data, error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .rpc('get_public_species_insight' as any, { p_slug: slug });
        if (error) throw error;
        const row = (data as Omit<SpeciesInsight, 'kind'>[] | null)?.[0];
        return row ? ({ kind: 'species', ...row } as SpeciesInsight) : null;
      }
      if (kind === 'breed_rank') {
        const { data, error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .rpc('get_public_breeds_by_species' as any, { p_slug: slug });
        if (error) throw error;
        const rows = (data as BreedRankRow[] | null) ?? [];
        if (rows.length === 0) return null;
        const first = rows[0];
        return {
          kind: 'breed_rank',
          slug: first.slug,
          title: first.title,
          species: first.species,
          total_pets: first.total_pets,
          total_breeds: first.total_breeds,
          rows,
        } as BreedRankInsight;
      }
      return null;
    },
  });

  if (!flagEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold">Próximamente</h1>
          <p className="text-sm text-muted-foreground">
            Estamos preparando estos insights con la masa crítica de mascotas.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Insight no disponible · Paw Friend</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <main className="container max-w-2xl mx-auto p-4 py-12 text-center space-y-4">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Aún no tenemos suficiente data</h1>
          <p className="text-muted-foreground">
            Para publicar este insight necesitamos al menos 50 mascotas de esa raza registradas. Si
            agregás la tuya, ayudás a que esta página exista.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link to="/auth?next=/onboarding-mascota">Agregar mi mascota</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Inicio</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Common meta values
  const metaDescription =
    data.kind === 'breed'
      ? `${data.pet_count} ${data.breed} en Chile registrados en Paw Friend. Peso promedio ${data.avg_weight_kg} kg, edad promedio ${data.avg_age_years} años.`
      : data.kind === 'species'
        ? `${data.pet_count} ${data.species}s en Chile. Peso promedio ${data.avg_weight_kg} kg. ${data.distinct_breeds} razas distintas registradas en Paw Friend.`
        : `Top ${data.rows.length} razas de ${data.species}s en Chile. ${data.total_pets} mascotas registradas en Paw Friend.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: data.title,
    description: metaDescription,
    url: `https://pawfriend.cl/insights/${data.slug}`,
    creator: { '@type': 'Organization', name: 'Paw Friend' },
    keywords:
      data.kind === 'breed'
        ? [data.breed, data.species, 'peso', 'Chile'].join(', ')
        : [data.species, 'Chile', 'mascotas', 'razas'].join(', '),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{data.title} · Paw Friend</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={data.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={`https://pawfriend.cl/insights/${data.slug}`} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://pawfriend.cl/insights/${data.slug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <header className="border-b bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/insights">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" /> Insight Paw Friend
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground capitalize">{data.species}</p>
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <p className="text-sm text-muted-foreground">
            {data.kind === 'breed' && (
              <>
                Basado en <strong>{data.pet_count}</strong> {data.breed} registrados en Paw Friend.
              </>
            )}
            {data.kind === 'species' && (
              <>
                Basado en <strong>{data.pet_count}</strong> {data.species}s registrados en Paw
                Friend.
              </>
            )}
            {data.kind === 'breed_rank' && (
              <>
                Basado en <strong>{data.total_pets}</strong> {data.species}s registrados (
                {data.total_breeds} razas distintas).
              </>
            )}
          </p>
        </div>

        {/* Render según tipo */}
        {(data.kind === 'breed' || data.kind === 'species') && (
          <>
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Peso promedio
                </p>
                <p className="text-5xl font-bold text-purple-700">{data.avg_weight_kg} kg</p>
                <p className="text-sm text-muted-foreground">
                  Rango: {data.min_weight_kg} – {data.max_weight_kg} kg
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<Activity className="h-5 w-5 text-emerald-600" />}
                label="Edad promedio"
                value={`${data.avg_age_years} años`}
                bg="bg-emerald-50 border-emerald-200"
              />
              <StatCard
                icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
                label="Esterilizadas"
                value={`${Math.round((data.count_neutered / data.pet_count) * 100)}%`}
                bg="bg-blue-50 border-blue-200"
              />
              <StatCard
                icon={<Sparkles className="h-5 w-5 text-sky-600" />}
                label="Machos"
                value={String(data.count_male)}
                bg="bg-sky-50 border-sky-200"
              />
              <StatCard
                icon={<Heart className="h-5 w-5 text-pink-600" />}
                label="Hembras"
                value={String(data.count_female)}
                bg="bg-pink-50 border-pink-200"
              />
            </div>

            {data.kind === 'species' && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <p className="text-xs text-amber-900 font-semibold uppercase tracking-wider mb-1">
                    Diversidad genética
                  </p>
                  <p className="text-2xl font-bold text-amber-700">{data.distinct_breeds} razas</p>
                  <Link
                    to={`/insights/top-razas-${data.species.toLowerCase()}-chile`}
                    className="text-xs text-amber-800 hover:underline mt-1 inline-block"
                  >
                    Ver top razas más comunes →
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {data.kind === 'breed_rank' && (
          <Card>
            <CardContent className="p-4 space-y-2">
              {data.rows.map((row) => (
                <Link
                  key={row.breed}
                  to={`/insights/peso-promedio-${row.breed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-chile`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <span className="shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm">
                    {row.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{row.breed}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.breed_count} mascotas · Peso promedio {row.avg_weight_kg} kg
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((row.breed_count / data.total_pets) * 100)}%
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* CTA viral */}
        <Card className="border-dashed">
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-sm font-medium">
              {data.kind === 'breed'
                ? `¿Tenés un ${data.breed}?`
                : data.kind === 'species'
                  ? `¿Tenés un ${data.species}?`
                  : `¿Tu mascota es ${data.species}?`}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Agregá a tu mascota a Paw Friend gratis y ayudás a que estos insights sean cada vez
              más precisos.
            </p>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/auth?next=/onboarding-mascota">Agregar a mi mascota</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <Card className={bg}>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

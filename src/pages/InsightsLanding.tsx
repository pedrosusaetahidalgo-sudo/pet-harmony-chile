/**
 * /insights/:slug — Landing publica con stats agregadas anonimas.
 *
 * Refactor Maestro Fase 1 §6.5.
 *
 * Genera trafico organico exponiendo data agregada de la base de Paw
 * Friend. Slug ejemplo: 'peso-promedio-golden-retriever-chile'.
 *
 * Threshold privacy: solo se publica si la raza tiene >=50 mascotas
 * registradas (RPC get_public_insight aplica el filtro).
 *
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

interface InsightData {
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

export default function InsightsLanding() {
  const { slug } = useParams<{ slug: string }>();
  const flagEnabled = isFeatureEnabled('PUBLIC_INSIGHTS');

  const { data, isLoading } = useQuery({
    queryKey: ['public-insight', slug],
    enabled: !!slug && flagEnabled,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .rpc('get_public_insight' as any, { p_slug: slug });
      if (error) throw error;
      const row = (data as InsightData[] | null)?.[0];
      return row ?? null;
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

  // Schema.org structured data para Google
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: data.title,
    description: `${data.title}. ${data.pet_count} mascotas registradas. Peso promedio ${data.avg_weight_kg} kg.`,
    url: `https://pawfriend.cl/insights/${data.slug}`,
    creator: { '@type': 'Organization', name: 'Paw Friend' },
    keywords: [data.breed, data.species, 'peso', 'Chile', 'mascotas'].join(', '),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{data.title} · Paw Friend</title>
        <meta
          name="description"
          content={`${data.pet_count} ${data.breed} en Chile registrados en Paw Friend. Peso promedio ${data.avg_weight_kg} kg, edad promedio ${data.avg_age_years} años.`}
        />
        <meta property="og:title" content={data.title} />
        <meta
          property="og:description"
          content={`Stats reales de ${data.pet_count} ${data.breed} chilenos`}
        />
        <meta property="og:url" content={`https://pawfriend.cl/insights/${data.slug}`} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://pawfriend.cl/insights/${data.slug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <header className="border-b bg-card">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
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
            Basado en <strong>{data.pet_count}</strong> {data.breed} registrados en Paw Friend.
          </p>
        </div>

        {/* Big stat: avg weight */}
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

        {/* Stats grid */}
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

        {/* CTA viral */}
        <Card className="border-dashed">
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-sm font-medium">¿Tenés un {data.breed}?</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Agregá a tu mascota a Paw Friend gratis y ayudás a que estos insights sean cada vez
              más precisos.
            </p>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/auth?next=/onboarding-mascota">Agregar a mi mascota</Link>
            </Button>
          </CardContent>
        </Card>

        <p className="text-[11px] text-center text-muted-foreground pt-4">
          Data anónima agregada · {data.pet_count} mascotas · Actualizado{' '}
          {new Date(data.refreshed_at).toLocaleDateString('es-CL')}
        </p>
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

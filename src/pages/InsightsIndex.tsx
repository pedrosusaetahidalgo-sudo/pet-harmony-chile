/**
 * /insights — index de todas las landings SEO disponibles.
 *
 * Refactor Maestro Fase 1 §6.5.
 *
 * Llama a RPC list_public_insights que devuelve todos los slugs con
 * pet_count >= 50 (threshold privacy). Si ninguno cumple → empty
 * state con CTA "Agregar mi mascota" (viral loop).
 *
 * El sitemap.xml debería incluir esta página + cada /insights/:slug
 * para que Google las indexe.
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, ArrowLeft, ArrowRight } from 'lucide-react';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface InsightSummary {
  slug: string;
  title: string;
  breed: string;
  species: string;
  pet_count: number;
  avg_weight_kg: number;
}

export default function InsightsIndex() {
  const flagEnabled = isFeatureEnabled('PUBLIC_INSIGHTS');

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['public-insights-list'],
    enabled: flagEnabled,
    queryFn: async () => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .rpc('list_public_insights' as any);
      if (error) throw error;
      return (data as InsightSummary[]) ?? [];
    },
  });

  if (!flagEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center space-y-3">
          <h1 className="text-lg font-semibold">Próximamente</h1>
          <p className="text-sm text-muted-foreground">
            Estamos preparando insights con la masa crítica de mascotas.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Insights mascotas Chile · Paw Friend</title>
        <meta
          name="description"
          content="Stats reales y actualizadas de mascotas chilenas: peso promedio por raza, edad, prevalencia. Data anónima agregada de Paw Friend."
        />
        <link rel="canonical" href="https://pawfriend.cl/insights" />
        <meta property="og:title" content="Insights mascotas Chile · Paw Friend" />
        <meta property="og:url" content="https://pawfriend.cl/insights" />
      </Helmet>

      <header className="border-b bg-card">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BarChart3 className="h-3 w-3" /> Paw Friend Insights
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Insights de mascotas en Chile</h1>
          <p className="text-muted-foreground">
            Data agregada y anónima de las mascotas registradas en Paw Friend. Cada insight requiere
            al menos 50 mascotas para publicarse, así protegemos la privacidad.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && insights.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-3">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="font-semibold text-lg">Todavía no hay insights publicados</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Necesitamos al menos 50 mascotas de la misma raza registradas para publicar un
                insight. Si agregás la tuya, ayudás a que estos datos existan.
              </p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link to="/auth?next=/onboarding-mascota">Agregar mi mascota</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && insights.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insights.map((insight) => (
              <Link key={insight.slug} to={`/insights/${insight.slug}`} className="group">
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
                        {insight.species}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                    </div>
                    <h3 className="font-semibold leading-tight">{insight.title}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {insight.pet_count} {insight.breed}s
                      </span>
                      <span className="font-semibold text-purple-700">
                        ⌀ {insight.avg_weight_kg} kg
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <p className="text-[11px] text-center text-muted-foreground pt-6">
          Threshold privacy: 50+ mascotas por insight · Data refrescada periódicamente
        </p>
      </main>
    </div>
  );
}

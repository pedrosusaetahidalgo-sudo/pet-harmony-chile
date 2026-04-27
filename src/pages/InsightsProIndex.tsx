/**
 * /insights-pro — Index publico de correlations correlativas publicadas.
 *
 * Refactor Maestro Fase 3 §2.9.
 *
 * Equivalente a /insights pero para correlations (data MAS profunda que
 * los breed_stats agregados). Solo muestra definitions con status='published'.
 *
 * Si no hay published, fallback "Estamos preparando research mas profundo"
 * con CTA a /insights (los stats basicos).
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, ArrowLeft, ArrowRight, BarChart3 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface CorrelationSummary {
  slug: string;
  question: string;
  category: string;
  input_dimensions: string[];
  output_metric: string;
}

const CATEGORY_BADGES: Record<string, string> = {
  longevity: 'bg-purple-100 text-purple-700',
  nutrition: 'bg-orange-100 text-orange-700',
  health: 'bg-blue-100 text-blue-700',
  behavior: 'bg-pink-100 text-pink-700',
  spend: 'bg-emerald-100 text-emerald-700',
};

export default function InsightsProIndex() {
  const { data: correlations = [], isLoading } = useQuery<CorrelationSummary[]>({
    queryKey: ['public-correlations-list'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await sb
        .from('correlation_definitions')
        .select('slug, question, category, input_dimensions, output_metric')
        .eq('status', 'published')
        .order('category');
      if (error) {
        console.warn('[InsightsProIndex] error', error);
        return [];
      }
      return (data ?? []) as CorrelationSummary[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Insights Pro · Paw Friend Research</title>
        <meta
          name="description"
          content="Research correlacional profundo sobre mascotas chilenas: longevidad por raza, nutricion, salud. Data agregada anonima de Paw Friend."
        />
        <link rel="canonical" href="https://pawfriend.cl/insights-pro" />
        <meta property="og:title" content="Insights Pro · Paw Friend Research" />
        <meta property="og:url" content="https://pawfriend.cl/insights-pro" />
      </Helmet>

      <header className="border-b bg-card">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="h-3 w-3" /> Paw Friend Insights Pro
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Research correlacional</h1>
          <p className="text-muted-foreground">
            Análisis profundo de correlaciones entre variables de las mascotas chilenas. Cada
            estudio requiere mínimo 50 mascotas con consent opt-in en cada combinación
            (k-anonymity).
          </p>
        </div>

        {/* Comparacion con /insights basico */}
        <Card className="bg-slate-50/40">
          <CardContent className="p-4 text-sm space-y-1">
            <p className="font-medium">¿Diferencia con /insights?</p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
              <li>
                <Link to="/insights" className="text-purple-600 hover:underline">
                  /insights
                </Link>
                : stats agregadas por raza o especie (peso promedio, edad). Threshold n≥50.
              </li>
              <li>
                <strong>/insights-pro</strong>: correlaciones causales (ej. paseo vs longevidad,
                alimento vs cristaluria). Requiere consent opt-in + threshold n≥50 por bucket.
              </li>
            </ul>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && correlations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-3">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
              <h2 className="font-semibold text-lg">Estamos preparando research más profundo</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Las correlaciones requieren más volumen y consent opt-in. Mientras tanto, puedes ver
                stats agregadas básicas (peso por raza, edad promedio).
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild>
                  <Link to="/insights">Ver insights básicos</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/auth?next=/onboarding-mascota">Sumar mi mascota</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && correlations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {correlations.map((corr) => (
              <Link key={corr.slug} to={`/insights-pro/${corr.slug}`} className="group">
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={CATEGORY_BADGES[corr.category] ?? ''}>
                        {corr.category}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                    </div>
                    <h3 className="font-semibold text-sm leading-tight">{corr.question}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-mono">{corr.input_dimensions.join(' × ')}</span> →{' '}
                      <span className="font-mono">{corr.output_metric}</span>
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <p className="text-[11px] text-center text-muted-foreground pt-6">
          Threshold privacy: n≥50 por bucket · Consent opt-in obligatorio · Licencia CC-BY-NC 4.0
        </p>
      </main>
    </div>
  );
}

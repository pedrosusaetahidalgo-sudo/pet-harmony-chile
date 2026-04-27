/**
 * /insights-pro/:slug — Landing publica para una correlation_definition
 * con status='published' (Fase 3 §2.9).
 *
 * Lee de:
 *   - correlation_definitions (filtra status=published)
 *   - get_correlation_insights(definition_id) RPC con threshold k>=50
 *
 * Diseño:
 *   - Hero con la pregunta (la del plan §2.9.1)
 *   - Lista de buckets con sample_size + output_value
 *   - Citation-ready: "Según N=X mascotas chilenas en Paw Friend, Y..."
 *   - JSON-LD Dataset schema para Google Scholar / search
 *   - CTA al fondo: "Tu data anonima ayuda a generar este insight" → /paw-core
 *
 * Privacy: el RPC ya enforza pet_count >= 50. Pagina solo muestra lo
 * que el RPC retorna. Si no llega al threshold, fallback "no disponible".
 *
 * Cuando Pedro publique la primera correlation, ejecutar
 * `npx supabase functions deploy generate-sitemap` para que se incluyan
 * los slugs en sitemap.xml.
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, BarChart3, Database, ExternalLink } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

interface CorrelationDefinition {
  id: string;
  slug: string;
  question: string;
  hypothesis: string | null;
  category: string;
  input_dimensions: string[];
  output_metric: string;
  potential_buyers: string[] | null;
}

interface ObservationRow {
  bucket: Record<string, string | number>;
  sample_size: number;
  output_value: number;
  output_stddev: number | null;
  confidence_level: 'low' | 'medium' | 'high' | null;
}

const CATEGORY_BADGES: Record<string, string> = {
  longevity: 'bg-purple-100 text-purple-700',
  nutrition: 'bg-orange-100 text-orange-700',
  health: 'bg-blue-100 text-blue-700',
  behavior: 'bg-pink-100 text-pink-700',
  spend: 'bg-emerald-100 text-emerald-700',
};

export default function CorrelationLanding() {
  const { slug } = useParams<{ slug: string }>();

  // Query 1: definition (solo si status=published)
  const { data: def, isLoading: defLoading } = useQuery<CorrelationDefinition | null>({
    queryKey: ['correlation-def', slug],
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await sb
        .from('correlation_definitions')
        .select(
          'id, slug, question, hypothesis, category, input_dimensions, output_metric, potential_buyers'
        )
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) {
        console.warn('[CorrelationLanding] def error', error);
        return null;
      }
      return data as CorrelationDefinition | null;
    },
  });

  // Query 2: observations (RPC con threshold k>=50)
  const { data: observations = [], isLoading: obsLoading } = useQuery<ObservationRow[]>({
    queryKey: ['correlation-observations', def?.id],
    enabled: !!def?.id,
    staleTime: 60 * 60 * 1000, // 1 hour cache
    queryFn: async () => {
      if (!def?.id) return [];
      const { data, error } = await sb.rpc('get_correlation_insights', {
        p_definition_id: def.id,
        p_min_sample_size: 50,
      });
      if (error) {
        console.warn('[CorrelationLanding] obs error', error);
        return [];
      }
      return (data ?? []) as ObservationRow[];
    },
  });

  if (defLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  // No publicada o no existe
  if (!def) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Insight no disponible · Paw Friend</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <main className="container max-w-2xl mx-auto p-4 py-12 text-center space-y-4">
          <Database className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Este insight todavía no está publicado</h1>
          <p className="text-muted-foreground">
            Estamos esperando data suficiente. Cuando crucemos las 50 mascotas con consent opt-in en
            cada combinación, este insight estará disponible.
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link to="/insights">Ver insights publicados</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Inicio</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Schema.org Dataset markup para search engines + Google Scholar
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: def.question,
    description:
      def.hypothesis ??
      `Análisis de correlación entre ${def.input_dimensions.join(', ')} y ${def.output_metric}.`,
    url: `https://pawfriend.cl/insights-pro/${def.slug}`,
    creator: { '@type': 'Organization', name: 'Paw Friend', url: 'https://pawfriend.cl' },
    keywords: [...def.input_dimensions, def.output_metric, 'Chile', 'mascotas'].join(', '),
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    isAccessibleForFree: true,
    spatialCoverage: 'Chile',
  };

  const isLoading = obsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{def.question} · Paw Friend Insights</title>
        <meta
          name="description"
          content={`Análisis correlacional sobre ${def.input_dimensions.join(' y ')} vs ${def.output_metric} en mascotas chilenas. Data agregada anónima de Paw Friend.`}
        />
        <meta property="og:title" content={`${def.question} · Paw Friend Insights`} />
        <meta property="og:url" content={`https://pawfriend.cl/insights-pro/${def.slug}`} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://pawfriend.cl/insights-pro/${def.slug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <header className="border-b bg-card">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/insights">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="h-3 w-3" /> Paw Friend Insights Pro
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto p-4 space-y-6">
        {/* Hero */}
        <div className="space-y-3">
          <Badge variant="outline" className={CATEGORY_BADGES[def.category] ?? ''}>
            {def.category}
          </Badge>
          <h1 className="text-3xl font-bold leading-tight">{def.question}</h1>
          {def.hypothesis && (
            <p className="text-sm text-muted-foreground italic">
              <strong>Hipótesis:</strong> {def.hypothesis}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              <strong>Variables:</strong> {def.input_dimensions.join(' × ')}
            </span>
            <span>•</span>
            <span>
              <strong>Métrica:</strong> {def.output_metric}
            </span>
          </div>
        </div>

        {/* Observations */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && observations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Aún no tenemos buckets con muestra suficiente (n≥50). Cuando suficientes dueños den
                consent y la data crezca, los resultados aparecerán aquí.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && observations.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-2 font-semibold text-xs uppercase tracking-wider text-slate-600">
                        Bucket
                      </th>
                      <th className="text-right px-4 py-2 font-semibold text-xs uppercase tracking-wider text-slate-600">
                        N
                      </th>
                      <th className="text-right px-4 py-2 font-semibold text-xs uppercase tracking-wider text-slate-600">
                        {def.output_metric}
                      </th>
                      <th className="text-right px-4 py-2 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden sm:table-cell">
                        ± stddev
                      </th>
                      <th className="text-center px-4 py-2 font-semibold text-xs uppercase tracking-wider text-slate-600 hidden md:table-cell">
                        Confianza
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((obs, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(obs.bucket).map(([k, v]) => (
                              <Badge key={k} variant="outline" className="text-[10px]">
                                {k}: {String(v)}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">{obs.sample_size}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-purple-700">
                          {obs.output_value}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">
                          {obs.output_stddev ? `±${obs.output_stddev}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center hidden md:table-cell">
                          {obs.confidence_level && (
                            <Badge
                              variant="outline"
                              className={
                                obs.confidence_level === 'high'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : obs.confidence_level === 'medium'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                              }
                            >
                              {obs.confidence_level}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Methodology + privacy */}
        <Card className="bg-slate-50/40">
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="font-semibold">Metodología</p>
            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>Data agregada anónima de mascotas registradas en Paw Friend.</li>
              <li>
                <strong>Threshold privacy</strong>: solo se muestran buckets con n≥50 mascotas.
              </li>
              <li>
                Solo incluye usuarios que dieron consent opt-in explícito a research (
                <Link to="/paw-core" className="text-purple-600 hover:underline">
                  cómo participar
                </Link>
                ).
              </li>
              <li>
                Licencia: Creative Commons Attribution-NonCommercial 4.0. Citar como "Paw Friend
                Insights, {def.slug}".
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA viral */}
        <Card className="border-dashed">
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-sm font-medium">¿Quieres que la próxima edición sea más precisa?</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Cada mascota agregada con consent opt-in suma un dato más al estudio. Si tu mascota
              participa, ayudás a que estos insights existan y mejoren.
            </p>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/auth?next=/onboarding-mascota">Sumar mi mascota</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Footer attribution */}
        <p className="text-[11px] text-center text-muted-foreground pt-4">
          Paw Friend Insights · Data agregada con threshold privacy · ¿Eres investigador?{' '}
          <Link to="/paw-core" className="hover:underline inline-flex items-center gap-0.5">
            Solicitar acceso B2B <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </p>
      </main>
    </div>
  );
}

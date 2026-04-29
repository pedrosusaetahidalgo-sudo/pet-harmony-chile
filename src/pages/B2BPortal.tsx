/**
 * B2B Portal · pawfriend.cl/b2b
 *
 * Pagina publica que sirve dos casos de uso:
 *   1. Onboarding info para potenciales clientes B2B (aseguradoras, pharma,
 *      academia, retail, plataformas pet). Tiers, scopes, casos de uso, CTA
 *      al form /aplicar?tipo=b2b_api.
 *   2. Self-stats para clientes B2B activos: pegan su API key plaintext y ven
 *      su uso (req/mes, rate limit, scopes). RPC publica get_b2b_self_stats
 *      valida hash y devuelve solo sus stats.
 *
 * No requiere auth Supabase. La autenticacion del portal se hace con la API
 * key misma (validacion server-side via SHA256 hash match).
 */
import { useState, lazy, Suspense } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, ArrowRight, Building2 } from '@/lib/icons';
import { KeyRound, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Lazy chart para evitar inflar el bundle del portal publico.
const UsageTimelineChart = lazy(() => import('@/components/b2b/UsageTimelineChart'));

interface SelfStats {
  name: string;
  tier: 'free' | 'research' | 'enterprise';
  scopes: string[];
  rate_limit_per_hour: number;
  is_active: boolean;
  expires_at: string | null;
  total_requests: number;
  last_used_at: string | null;
  last_24h_requests: number;
  last_7d_requests: number;
}

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    rate: '100 req/h',
    scopes: ['breed_stats'],
    target: 'Tesis academicas, prototipos, exploracion.',
  },
  {
    name: 'Research',
    price: 'Contactar',
    rate: '1.000 req/h',
    scopes: ['breed_stats', 'species_stats'],
    target: 'Universidades, INIA, papers cientificos.',
  },
  {
    name: 'Enterprise',
    price: 'A medida',
    rate: '10.000+ req/h',
    scopes: ['breed_stats', 'species_stats', 'risk_score', 'correlations'],
    target: 'Aseguradoras, pharma, retail con integracion productiva.',
  },
] as const;

const ENDPOINTS = [
  {
    path: 'breed_stats',
    desc: 'Stats agregadas por raza (peso medio, edad media, esterilizacion %).',
    tiers: ['free', 'research', 'enterprise'] as const,
  },
  {
    path: 'species_stats',
    desc: 'Stats agregadas por especie (DOG/CAT) con desglose comuna.',
    tiers: ['research', 'enterprise'] as const,
  },
  {
    path: 'correlation_insights',
    desc: 'Correlaciones precomputadas (ej: edad esterilizacion vs comuna).',
    tiers: ['research', 'enterprise'] as const,
  },
  {
    path: 'risk_score',
    desc: 'Risk score por pet_id para underwriting (requiere consent del dueno).',
    tiers: ['enterprise'] as const,
  },
] as const;

export default function B2BPortal() {
  const [apiKey, setApiKey] = useState('');
  const [stats, setStats] = useState<SelfStats | null>(null);

  const checkStats = useMutation({
    mutationFn: async (key: string) => {
      const { data, error } = await supabase.rpc('get_b2b_self_stats', { p_api_key: key });
      if (error) throw error;
      const arr = (data as SelfStats[] | null) ?? [];
      return arr[0] ?? null;
    },
    onSuccess: (data) => {
      if (!data) {
        toast.error('Key invalida o revocada');
        setStats(null);
        return;
      }
      setStats(data);
    },
    onError: (err) => {
      toast.error('No pudimos validar la key', {
        description: err instanceof Error ? err.message : 'Intenta de nuevo.',
      });
      setStats(null);
    },
  });

  const handleCheck = () => {
    const trimmed = apiKey.trim();
    if (!trimmed.startsWith('pf_live_') || trimmed.length < 24) {
      toast.error('Formato de key invalido', {
        description: 'Las keys empiezan con pf_live_ y tienen ~40 caracteres.',
      });
      return;
    }
    checkStats.mutate(trimmed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <Helmet>
        <title>API B2B · Paw Friend</title>
        <meta
          name="description"
          content="Acceso programatico a stats agregadas de mascotas chilenas para aseguradoras, pharma, academia y retail."
        />
      </Helmet>

      <div className="container max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            API B2B v1
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Datos pet chilenos,{' '}
            <span className="bg-gradient-to-br from-purple-600 to-teal-600 bg-clip-text text-transparent">
              programaticamente
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stats agregadas con consent + privacy threshold ≥50 pets. Para aseguradoras, pharma,
            academia y retail que necesitan data viva de mascotas chilenas.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Link to="/aplicar?tipo=b2b_api">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Solicitar acceso
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#tiers">
              <Button size="lg" variant="outline">
                Ver tiers y precios
              </Button>
            </a>
          </div>
        </div>

        {/* Self-stats portal */}
        <Card className="mb-12 border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-purple-600" />
              Tienes una API key? Mira tu uso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Label htmlFor="apikey" className="sr-only">
                  API key
                </Label>
                <Input
                  id="apikey"
                  type="password"
                  placeholder="pf_live_..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheck();
                  }}
                  autoComplete="off"
                />
              </div>
              <Button onClick={handleCheck} disabled={checkStats.isPending}>
                {checkStats.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Ver mi uso
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              La key se valida en servidor con SHA256 hash. No queda guardada en tu navegador.
            </p>

            {stats && (
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {stats.name}
                  </p>
                  <Badge variant={stats.is_active ? 'default' : 'destructive'}>
                    {stats.is_active ? 'Activa' : 'Revocada'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <Stat label="Tier" value={stats.tier.toUpperCase()} />
                  <Stat label="Rate limit" value={`${stats.rate_limit_per_hour}/h`} />
                  <Stat label="Reqs 24h" value={stats.last_24h_requests.toLocaleString('es-CL')} />
                  <Stat label="Reqs 7d" value={stats.last_7d_requests.toLocaleString('es-CL')} />
                  <Stat
                    label="Total historico"
                    value={stats.total_requests.toLocaleString('es-CL')}
                  />
                  <Stat
                    label="Ultimo uso"
                    value={
                      stats.last_used_at
                        ? new Date(stats.last_used_at).toLocaleDateString('es-CL')
                        : 'nunca'
                    }
                  />
                  <Stat
                    label="Expira"
                    value={
                      stats.expires_at
                        ? new Date(stats.expires_at).toLocaleDateString('es-CL')
                        : 'no expira'
                    }
                  />
                  <Stat label="Scopes" value={stats.scopes.length.toString()} />
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <strong>Scopes activos:</strong> {stats.scopes.join(', ')}
                </div>
                {/* Timeline chart 24h */}
                <div className="pt-3 border-t">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Uso ultimas 24 horas
                  </p>
                  <Suspense fallback={<div className="h-32 bg-muted/30 rounded animate-pulse" />}>
                    <UsageTimelineChart apiKey={apiKey} />
                  </Suspense>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tiers */}
        <h2 id="tiers" className="text-2xl font-bold mb-6">
          Tiers
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {TIERS.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tier.name}
                  <span className="text-lg font-bold text-purple-600">{tier.price}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm">
                <p className="text-muted-foreground">{tier.target}</p>
                <p>
                  <strong>Rate:</strong> {tier.rate}
                </p>
                <div>
                  <strong>Scopes:</strong>
                  <ul className="mt-1 space-y-1">
                    {tier.scopes.map((s) => (
                      <li key={s} className="text-xs font-mono text-muted-foreground">
                        · {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Endpoints */}
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Code2 className="h-6 w-6" />
          Endpoints
        </h2>
        <Card className="mb-12">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold">Endpoint</th>
                  <th className="text-left p-3 font-semibold">Descripcion</th>
                  <th className="text-left p-3 font-semibold">Tiers</th>
                </tr>
              </thead>
              <tbody>
                {ENDPOINTS.map((e) => (
                  <tr key={e.path} className="border-t">
                    <td className="p-3 font-mono text-xs">/b2b/{e.path}</td>
                    <td className="p-3 text-muted-foreground">{e.desc}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {e.tiers.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Quickstart */}
        <h2 className="text-2xl font-bold mb-6">Quickstart</h2>
        <Card className="mb-12">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Una vez tu API key emitida, autentica con header <code>X-Pawfriend-Api-Key</code>:
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
              <code>{`curl https://gwailbjlvevkhwcrovfd.functions.supabase.co/b2b-api/breed_stats \\
  -H "X-Pawfriend-Api-Key: pf_live_..." \\
  -H "Content-Type: application/json"

# Response 200:
# {
#   "data": [
#     { "breed": "Pastor Aleman", "n": 387, "avg_weight_kg": 32.4, "lifespan_avg": 10.2 },
#     ...
#   ]
# }`}</code>
            </pre>
            <p className="text-xs text-muted-foreground">
              Privacy threshold: solo razas con n ≥ 50 son publicables. Rate limit segun tu tier; si
              excedes recibes <code>429</code> con header
              <code> Retry-After</code>.
            </p>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6 space-y-2">
            <p className="font-semibold">Cumplimiento</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Ley 19.628 (privacidad) + Ley 21.719 (proteccion de datos)</li>
              <li>Privacy threshold: solo razas / cohorts con n ≥ 50</li>
              <li>Consent opt-in del dueno via profiles.anonymous_data_research_consent</li>
              <li>Datos siempre agregados, nunca individualizables</li>
              <li>API key hasheada SHA256, plain key visible 1 sola vez al emitir</li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA final */}
        <div className="text-center mt-12">
          <Link to="/aplicar?tipo=b2b_api">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Solicitar mi API key
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-2">
            Te respondemos en 48h habiles con tu key + onboarding.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold truncate">{value}</p>
    </div>
  );
}

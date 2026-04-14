import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, Crown, X, HelpCircle } from '@/lib/icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { useToast } from '@/hooks/use-toast';
import { LINKS } from '@/lib/links';
import { PageHeader } from '@/components/PageHeader';

type Plan = 'monthly' | 'yearly';

const FEATURES = [
  'Mascotas ilimitadas',
  'Ficha clínica completa y descargable',
  'Recordatorios de vacunas y controles ilimitados',
  'Exportación de ficha clínica en PDF',
  'Compartir ficha con veterinario',
  'Resumen semanal con IA',
  'Sin publicidad',
  'Soporte prioritario',
];

const COMPARISON_TABLE = [
  { feature: 'Mascotas registradas', free: '2', premium: 'Ilimitadas', key: 'max_pets' },
  { feature: 'Recordatorios activos', free: '3', premium: 'Ilimitados', key: 'max_reminders' },
  { feature: 'Ficha clínica PDF', free: false, premium: true, key: 'export_pdf' },
  { feature: 'Compartir ficha con vet', free: false, premium: true, key: 'share_clinical' },
  { feature: 'Ficha clínica', free: '6 meses', premium: 'Completa', key: 'medical_history' },
  { feature: 'Resumen semanal IA', free: false, premium: true, key: 'weekly_summary' },
  { feature: 'Asistente veterinario IA', free: false, premium: true, key: 'ai_vet_assistant' },
  { feature: 'Sin publicidad', free: false, premium: true, key: 'ad_free' },
  { feature: 'Soporte prioritario', free: false, premium: true, key: 'priority_support' },
];

const FAQ_ITEMS = [
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí. Sin permanencia ni penalizaciones. Tu plan seguirá activo hasta el final del periodo pagado.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos tarjetas de crédito y débito a través de Flow, la pasarela de pago líder en Chile.',
  },
  {
    q: '¿Pierdo mis datos si vuelvo al plan Gratis?',
    a: 'No. Tus mascotas y registros se mantienen. Solo se limita el acceso a funciones Premium como PDF y compartir ficha.',
  },
  {
    q: '¿Qué pasa con la oferta de lanzamiento?',
    a: 'Los primeros 500 usuarios que activen Premium mantienen el precio de $3.990/mes para siempre, sin importar futuros aumentos.',
  },
];

export default function Upgrade() {
  const { user } = useAuth();
  const { isPremium } = usePlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<Plan | null>(null);
  const [searchParams] = useSearchParams();
  const highlightFeature = searchParams.get('feature');
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightFeature && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightFeature]);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke('flow-create-subscription', {
        body: { plan },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error('Respuesta inválida del servidor de pagos');
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: 'No se pudo iniciar el pago',
        description: msg,
        variant: 'destructive',
      });
      setLoading(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Paw Friend Premium — Cuida mejor a tu mascota</title>
        <meta
          name="description"
          content="Activa Premium desde $3.990/mes. Mascotas ilimitadas, ficha clinica PDF, recordatorios y mas para cuidar a tu mascota."
        />
      </Helmet>
      <PageHeader title="Plan Premium" onBack={() => navigate(LINKS.profile())} />
      {/* Fondo dorado sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(45 100% 92% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(42 90% 88% / 0.4), transparent 70%)',
        }}
      />

      <div className="container px-4 py-12 max-w-4xl mx-auto animate-fade-in">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-premium-gradient blur-xl opacity-50" />
              <div className="relative h-16 w-16 rounded-full bg-premium-gradient flex items-center justify-center shadow-premium">
                <Crown className="h-8 w-8 text-premium-foreground" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-3 tracking-tight">
            Paw Friend{' '}
            <span className="bg-premium-gradient bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Cuida a todas tus mascotas con la ficha médica completa, recordatorios ilimitados y todo
            el directorio de vets.
          </p>
        </div>

        {/* Grandfathering banner — solo visible para usuarios no premium */}
        {!isPremium && (
          <div className="mb-8 rounded-xl border-2 border-purple-300 bg-purple-50 p-4 sm:p-5 text-center">
            <Badge className="bg-purple-500 text-white border-0 mb-2">Oferta de lanzamiento</Badge>
            <p className="text-sm sm:text-base text-purple-900 font-medium leading-relaxed">
              Los primeros 500 usuarios que activen Premium mantienen{' '}
              <strong>$3.990/mes para siempre</strong>. Sin importar futuros aumentos.
            </p>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {/* Mensual */}
          <Card className="border-2 hover:border-premium/30 transition-colors">
            <CardHeader>
              <CardTitle className="text-xl">Mensual</CardTitle>
              <CardDescription>Sin permanencia. Cancela cuando quieras.</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold tracking-tight">$3.990</span>
                <span className="text-muted-foreground text-base"> / mes</span>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-12 text-base"
                variant="outline"
                onClick={() => handleSubscribe('monthly')}
                disabled={loading !== null}
              >
                {loading === 'monthly' ? 'Redirigiendo a Flow…' : 'Activar Premium mensual'}
              </Button>
            </CardContent>
          </Card>

          {/* Anual — destacado */}
          <Card className="border-2 border-premium/60 relative overflow-hidden bg-premium-gradient-soft animate-premium-shimmer">
            {/* Highlight stripe */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-premium-gradient" />
            <Badge className="absolute -top-0 right-4 translate-y-3 bg-premium-gradient text-premium-foreground border-0 shadow-premium-sm font-semibold tracking-wide">
              <Sparkles className="h-3 w-3 mr-1" />2 MESES GRATIS
            </Badge>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                Anual
                <Crown className="h-4 w-4 text-premium" />
              </CardTitle>
              <CardDescription>2 meses gratis vs el plan mensual</CardDescription>
              <div className="pt-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight bg-premium-gradient bg-clip-text text-transparent">
                  $39.900
                </span>
                <span className="text-muted-foreground text-base">/ año</span>
              </div>
              <p className="text-xs text-premium-dark/80 font-medium">Equivale a $3.325 por mes</p>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-12 text-base font-semibold bg-premium-gradient hover:opacity-90 text-premium-foreground shadow-premium border-0"
                onClick={() => handleSubscribe('yearly')}
                disabled={loading !== null}
              >
                {loading === 'yearly' ? 'Redirigiendo a Flow…' : 'Activar Premium anual'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <Card className="border-premium/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-premium" />
              Qué incluye Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-premium-light flex items-center justify-center shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 text-premium-dark" strokeWidth={3} />
                  </div>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Comparison table */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Gratis vs Premium</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Función</th>
                    <th className="text-center p-3 font-medium w-28">Gratis</th>
                    <th className="text-center p-3 font-medium w-28 text-premium-dark">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_TABLE.map((row) => {
                    const isHighlighted = highlightFeature === row.key;
                    return (
                      <tr
                        key={row.feature}
                        ref={isHighlighted ? highlightRef : undefined}
                        className={`border-b last:border-0 transition-colors ${isHighlighted ? 'bg-purple-50 ring-2 ring-purple-300 ring-inset' : ''}`}
                      >
                        <td className="p-3">{row.feature}</td>
                        <td className="p-3 text-center">
                          {typeof row.free === 'boolean' ? (
                            row.free ? (
                              <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="text-muted-foreground">{row.free}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {typeof row.premium === 'boolean' ? (
                            row.premium ? (
                              <CheckCircle className="h-4 w-4 text-premium-dark mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground mx-auto" />
                            )
                          ) : (
                            <span className="font-medium">{row.premium}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Social proof */}
        {!isPremium && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-green-50 border border-green-200 px-5 py-2.5">
              <div className="flex -space-x-2">
                {['🐕', '🐈', '🐾'].map((emoji, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full bg-white border-2 border-green-200 flex items-center justify-center text-sm"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <p className="text-sm text-green-800 font-medium">
                Dueños de mascotas ya cuidan mejor con Premium
              </p>
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            Preguntas frecuentes
          </h2>
          {FAQ_ITEMS.map((item) => (
            <Collapsible key={item.q}>
              <Card>
                <CollapsibleTrigger className="w-full text-left p-4 font-medium text-sm hover:bg-muted/50 transition-colors rounded-lg">
                  {item.q}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>

        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-muted-foreground">
            Pago seguro procesado por Flow. Cancela cuando quieras, sin permanencia.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate(LINKS.myPets())}>
            Volver a mis mascotas
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  CheckCircle,
  Sparkles,
  PawPrint,
  Loader2,
  Home,
  FileText,
  MapPin,
  Building2,
  Megaphone,
  MessageCircle,
  Pencil,
  Route,
} from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { PawVoicesWall } from '@/components/PawVoicesWall';
import { PawCompanysGrid } from '@/components/PawCompanysGrid';
import { DonationsTransparency } from '@/components/DonationsTransparency';
import { MyDonationRecap } from '@/components/MyDonationRecap';
import { AdSlot } from '@/components/AdSlot';
import { cn } from '@/lib/utils';
import { track, EVENTS } from '@/lib/analytics';
import { FEATURE_FLAGS, isFeatureEnabled } from '@/lib/featureFlags';
import { errorMessageForUser } from '@/lib/errors';
import {
  DONATION_PRESETS,
  DONATION_MIN_CLP,
  DONATION_MAX_CLP,
  CONTACT_EMAIL,
} from '@/lib/config/marketingConfig';

// Presets de donacion vienen de marketingConfig (editables via config o env)
const PRESETS = DONATION_PRESETS;

const STRENGTHS = [
  {
    icon: FileText,
    title: 'Ficha clínica completa',
    text: 'Todo el historial médico de tu peludo, exportable a PDF cuando lo necesites.',
  },
  {
    icon: MapPin,
    title: 'Directorio de veterinarios',
    text: 'Encuentra profesionales verificados en tu comuna, con precios y reseñas reales.',
  },
  {
    icon: Heart,
    title: 'Comunidad de tutores',
    text: 'Rutinas, recordatorios, memorial, donantes de sangre y adopciones. Todo en un lugar.',
  },
];

// Limites de monto vienen de marketingConfig (override env VITE_DONATION_MIN_CLP / MAX).
const MIN = DONATION_MIN_CLP;
const MAX = DONATION_MAX_CLP;

export default function Donaciones() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  const [selected, setSelected] = useState<number | null>(5000);
  const [custom, setCustom] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  // Si la URL trae ?frecuencia=monthly (ej: clic desde PlanComparisonTableB2C
  // en /paw-member), preseleccionamos la frecuencia mensual para que el user
  // caiga directo en el flujo de membresia recurrente.
  const frecuenciaParam = searchParams.get('frecuencia');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>(
    frecuenciaParam === 'monthly' ? 'monthly' : 'once'
  );

  // Donaciones dirigidas a refugio. Feature-flagged: la UI y el envio al
  // backend viven aca pero el boton de dirigir solo aparece cuando
  // FEATURE_FLAGS.SHELTER_DONATIONS = true (activar cuando Flow migre a SpA).
  // Si llegan con ?refugio=ID, preseleccionamos ese refugio.
  const shelterDonationsEnabled = isFeatureEnabled('SHELTER_DONATIONS');
  const refugioParam = searchParams.get('refugio');
  const [beneficiaryShelterId, setBeneficiaryShelterId] = useState<string | null>(
    shelterDonationsEnabled ? refugioParam : null
  );

  const { data: shelterOptions } = useQuery<
    Array<{ id: string; legal_name: string; commune: string }>
  >({
    queryKey: ['donation-shelter-options'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('adoption_centers' as any) as any)
        .select('id, legal_name, commune')
        .eq('status', 'active')
        .eq('accepts_donations', true)
        .order('legal_name');
      return (data as Array<{ id: string; legal_name: string; commune: string }>) || [];
    },
    enabled: shelterDonationsEnabled,
  });

  const beneficiaryShelter = useMemo(
    () =>
      shelterDonationsEnabled && beneficiaryShelterId
        ? (shelterOptions || []).find((s) => s.id === beneficiaryShelterId) || null
        : null,
    [shelterDonationsEnabled, beneficiaryShelterId, shelterOptions]
  );

  const amount = custom ? Math.floor(Number(custom)) : (selected ?? 0);
  const validAmount = Number.isFinite(amount) && amount >= MIN && amount <= MAX;

  const handleDonate = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!validAmount) {
      toast.error(
        `Ingresa un monto entre $${MIN.toLocaleString('es-CL')} y $${MAX.toLocaleString('es-CL')}`
      );
      return;
    }
    setLoading(true);
    track({
      event: EVENTS.DONATION_INITIATED,
      properties: {
        amount,
        is_custom: Boolean(custom),
        is_public: isPublic,
        has_message: Boolean(donorMessage.trim()),
        frequency,
        source: 'donaciones_page',
        beneficiary_type: beneficiaryShelter ? 'adoption_center' : 'general',
        beneficiary_adoption_center_id: beneficiaryShelter?.id ?? null,
      },
    });
    try {
      const { data, error } = await supabase.functions.invoke('flow-create-donation', {
        body: {
          amount,
          source: 'donaciones_page',
          donor_name: donorName.trim() || null,
          message: donorMessage.trim() || null,
          is_public: isPublic,
          // Requiere edge fn con soporte recurring=true (activar tras migrar
          // Flow a cuenta SpA + actualizar flow-create-donation). Hoy flag
          // DONATIONS_MONTHLY=false → siempre viaja 'once'.
          frequency,
          // Donacion dirigida a un refugio (feature-flagged). Si el flag esta
          // apagado viaja undefined y la edge fn usa beneficiary_type='general'
          // por default (la columna tiene DEFAULT 'general' en DB).
          beneficiary_type: beneficiaryShelter ? 'adoption_center' : undefined,
          beneficiary_adoption_center_id: beneficiaryShelter?.id,
        },
      });
      if (error) throw error;
      const url = (data as { url?: string; error?: string })?.url;
      const errMsg = (data as { url?: string; error?: string })?.error;
      if (errMsg) throw new Error(errMsg);
      if (!url) throw new Error('Respuesta invalida del servidor de pagos');
      window.location.href = url;
    } catch (err) {
      const msg = errorMessageForUser(err);
      toast.error('No pudimos iniciar la donacion', { description: msg });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'success') {
      track({
        event: EVENTS.DONATION_COMPLETED,
        properties: { source: 'flow_redirect' },
      });
    }
  }, [status]);

  if (status === 'success') {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <Helmet>
          <title>Gracias por tu donación — Paw Friend</title>
        </Helmet>
        <PageHeader title="Gracias" onBack={() => navigate('/home')} />
        <div className="container max-w-xl mx-auto px-4 py-16 text-center space-y-5">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <Heart className="h-10 w-10 text-white fill-white" />
          </div>
          <h1 className="font-display font-semibold text-3xl md:text-4xl tracking-tight">
            ¡Gracias, de verdad!
          </h1>
          <p className="text-muted-foreground">
            Tu donación ayuda a que Paw Friend siga siendo gratis para miles de tutores peludos en
            Chile. Vamos a actualizar la meta en los próximos días.
          </p>
          <Button onClick={() => navigate('/home')} className="mt-4">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Paw Support — Apoya a Paw Friend</title>
        <meta
          name="description"
          content="Paw Friend es un proyecto hecho en Chile por amantes de las mascotas. Con tu apoyo ayudamos a que siga gratis para toda la comunidad peluda. Modelo Mapcity: el dueno nunca paga."
        />
      </Helmet>
      <PageHeader title="Paw Support" onBack={() => navigate('/home')} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(340 100% 92% / 0.6), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, hsl(45 90% 88% / 0.4), transparent 70%)',
        }}
      />

      <div className="container max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
        {/* Recap personal del user logueado (si ya dono) */}
        <MyDonationRecap />

        {/* Meta y transparencia — primer toque antes del hero emocional */}
        <DonationsTransparency />
        <div className="text-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-primary"
          >
            <a href="/transparencia">Ver desglose completo de transparencia →</a>
          </Button>
        </div>

        {/* Hero emocional */}
        <section className="text-center space-y-3">
          <Badge variant="outline" className="bg-pink-50 border-pink-200 text-pink-700 text-[11px]">
            <Sparkles className="h-3 w-3 mr-1" />
            Home-made en Chile
          </Badge>
          <h1 className="font-display font-semibold text-4xl md:text-5xl leading-[1.08] tracking-tight">
            Si las donaciones alcanzan,
            <br />
            <span className="bg-brand-gold-gradient bg-clip-text text-transparent">
              Paw Friend sigue gratis.
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            Somos una sola persona detras del proyecto, en Chile, cuidando cada detalle por amor a
            los peludos. No vendemos tus datos ni llenamos la app de publicidad. Si te sirve, puedes
            darle una mano voluntaria.
          </p>
        </section>

        {/* Promesa */}
        <Card className="border-2 border-dashed border-pink-200 bg-gradient-to-br from-pink-50/80 to-amber-50/80 dark:from-pink-950/30 dark:to-amber-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-pink-500" />
              <h2 className="font-semibold">Nuestra promesa</h2>
            </div>
            <ul className="text-sm space-y-1.5 text-foreground/80">
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  Cada peso va primero a mantener los servidores, edge functions y seguridad de tus
                  datos.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  Si sobra, destinamos el excedente a refugios y hogares de transito aliados (vamos
                  a publicar quienes reciben cada mes).
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  Nunca vamos a bloquear features core (ficha clinica, PDF, directorio de vets) para
                  presionarte a donar.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Mensaje personal */}
        <Card className="border-pink-200/60">
          <CardContent className="p-5 space-y-2">
            <p className="text-sm leading-relaxed">
              Queremos que sepas algo: <b>detras de esto hay alguien como tu</b>, que ama a los
              animales, que los quiere cuidar, y que lo va a hacer con un poquito de ayuda tuya. No
              somos una empresa gigante — somos una persona peluda mas, con las mismas ganas de que
              a ningun peludo le falte nada.
            </p>
          </CardContent>
        </Card>

        {/* Para los reales amantes */}
        <section className="grid md:grid-cols-3 gap-3">
          {STRENGTHS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="bg-white/70 dark:bg-slate-900/60">
                <CardContent className="p-4 space-y-1.5">
                  <Icon className="h-5 w-5 text-pink-500" />
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{s.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Plan: hacia donde vamos */}
        <Card className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/20 border-rose-200/60">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-rose-500" />
              <h2 className="font-semibold">Hacia donde vamos con tu ayuda</h2>
            </div>
            <ul className="text-sm space-y-2.5 text-foreground/80">
              <li className="flex gap-2 items-start">
                <PawPrint className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Hoy:</b> mantener la app gratis y segura para tutores y vets de todo Chile.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Route className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Pronto:</b> mapa de <b>callejeros</b> reportables con apoyo colectivo — comida,
                  rescate, esterilización.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Home className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Siguiente fase:</b> módulo de <b>adopciones</b> con refugios aliados
                  verificados y seguimiento post-adopción.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Heart
                  className="h-4 w-4 text-pink-500 fill-pink-500 shrink-0 mt-0.5"
                  aria-hidden
                />
                <span>
                  <b>Futuro:</b> canal transparente para <b>derivar excedentes</b> a hogares de
                  tránsito y clínicas veterinarias de bajo costo.
                </span>
              </li>
            </ul>
            <p className="text-[11px] text-muted-foreground italic pt-1">
              Esto es una hoja de ruta honesta, no una promesa con letra chica. Si Paw Friend crece
              gracias a donantes y partners, publicamos donde va cada peso.
            </p>
          </CardContent>
        </Card>

        {/* Otras formas de aportar (sin plata) — Paw Voices & Paw Companys */}
        <Card className="border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/70 dark:from-violet-950/30 dark:to-fuchsia-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-violet-500" />
              <h2 className="font-semibold">No solo necesitamos plata</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Buscamos <b>Paw Voices</b> (creadores) y <b>Paw Companys</b> (empresas con corazon
              peludo) que amplifiquen la mision.
            </p>
            <p className="text-sm text-foreground/80">
              Donar es <b>una</b> forma de ayudar, pero hay otras igual de valiosas. Si sientes que
              Paw Friend te representa, puedes aportar sin gastar un peso:
            </p>
            <ul className="text-sm space-y-2 text-foreground/80">
              <li className="flex gap-2 items-start">
                <Megaphone className="h-4 w-4 text-fuchsia-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Paw Voices:</b> ser una de las voces peludas de la marca en TikTok, Instagram,
                  FB o YouTube. Creadores chicos, medianos y grandes bienvenidos. Te damos un{' '}
                  <b>badge oficial de Paw Voice</b> para tu perfil.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Building2 className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Paw Companys:</b> alianza con empresas que aman a los animales. Banner y página
                  de logos de partners, más <b>badge oficial de Paw Company</b> para usar en sus
                  canales y productos.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <MessageCircle className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Compartir</b> la app con otros tutores, veterinarios o rescatistas que
                  conozcas.
                </span>
              </li>
              <li className="flex gap-2 items-start">
                <Pencil className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
                <span>
                  <b>Mandarnos feedback</b> honesto: qué te sirve, qué no, qué extrañas.
                </span>
              </li>
            </ul>
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-dashed border-violet-200/50 dark:border-violet-900/40 mt-1">
              <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0">
                <PawPrint className="h-3 w-3 mr-1" />
                Paw Voice
              </Badge>
              <Badge className="bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Paw Company
              </Badge>
              <span className="text-[11px] text-muted-foreground italic">
                Borradores oficiales. Se los entregamos a cada alianza.
              </span>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Quiero%20aportar%20a%20Paw%20Friend`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-300 hover:underline"
            >
              Escríbenos a {CONTACT_EMAIL} →
            </a>
          </CardContent>
        </Card>

        {/* Muralla Paw Voices — voces reales de la comunidad */}
        <PawVoicesWall />

        {/* Paw Companys — grid de sponsors empresariales */}
        <PawCompanysGrid />

        {/* Slot patrocinado (si hay ads activos en donations_page) */}
        <AdSlot placement="donations_page" />

        {/* Donar */}
        <Card className="border-pink-200/70">
          <CardContent className="p-5 space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">Elige tu aporte</h2>
              <p className="text-xs text-muted-foreground">
                {frequency === 'monthly'
                  ? 'Aporte recurrente mensual · cancela cuando quieras'
                  : 'Pago seguro via Flow. Sin suscripción ni cobros recurrentes.'}
              </p>
            </div>

            {FEATURE_FLAGS.DONATIONS_MONTHLY && (
              <div
                role="tablist"
                aria-label="Frecuencia del aporte"
                className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={frequency === 'once'}
                  onClick={() => setFrequency('once')}
                  className={cn(
                    'rounded-lg py-2 text-sm font-semibold transition-all',
                    frequency === 'once'
                      ? 'bg-white text-pink-700 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Una vez
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={frequency === 'monthly'}
                  onClick={() => setFrequency('monthly')}
                  className={cn(
                    'rounded-lg py-2 text-sm font-semibold transition-all',
                    frequency === 'monthly'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Cada mes 💛
                </button>
              </div>
            )}

            {/* Donacion dirigida a refugio (feature-flagged hasta migrar Flow a SpA) */}
            {shelterDonationsEnabled && (shelterOptions?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-900">
                      Dirigir la donacion a un refugio
                    </span>
                  </div>
                  {beneficiaryShelterId && (
                    <button
                      type="button"
                      onClick={() => setBeneficiaryShelterId(null)}
                      className="text-[11px] text-purple-700 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-purple-700/80">
                  Paw Friend actua como intermediario. Retenemos una comision operativa y
                  transferimos el saldo al refugio elegido.
                </p>
                <label htmlFor="donation-shelter-select" className="sr-only">
                  Refugio beneficiario
                </label>
                <select
                  id="donation-shelter-select"
                  value={beneficiaryShelterId ?? ''}
                  onChange={(e) => setBeneficiaryShelterId(e.target.value || null)}
                  className="w-full h-9 rounded-md border border-purple-200 bg-white px-3 text-sm"
                >
                  <option value="">Fondo general de Paw Friend</option>
                  {(shelterOptions || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.legal_name} · {s.commune}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PRESETS.map((p) => {
                const active = !custom && selected === p.amount;
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => {
                      setSelected(p.amount);
                      setCustom('');
                    }}
                    className={cn(
                      'relative rounded-xl border-2 p-3 text-center transition-all',
                      active
                        ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-amber-50 scale-[1.02] shadow'
                        : 'border-border hover:border-pink-200 hover:bg-pink-50/40'
                    )}
                  >
                    {p.featured && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] px-1.5 py-0">
                        Favorito
                      </Badge>
                    )}
                    <div className="text-lg font-bold">{p.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{p.sub}</div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="donation-custom-amount"
                className="text-xs font-medium text-muted-foreground"
              >
                O elige un monto libre (CLP)
              </label>
              <div className="flex gap-2">
                <input
                  id="donation-custom-amount"
                  aria-label="Monto libre en pesos chilenos"
                  type="number"
                  inputMode="numeric"
                  min={MIN}
                  max={MAX}
                  value={custom}
                  placeholder="Ej: 7500"
                  onChange={(e) => {
                    setCustom(e.target.value);
                    setSelected(null);
                  }}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
                <span className="self-center text-xs text-muted-foreground">
                  Min ${MIN.toLocaleString('es-CL')} · Max ${MAX.toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {/* Formulario del donante */}
            <div className="space-y-3 pt-1 border-t border-dashed border-pink-200/60">
              <p className="text-xs font-medium text-muted-foreground pt-3">
                Para agradecerte personalmente
              </p>
              <div className="space-y-1">
                <label htmlFor="donation-donor-name" className="text-xs text-muted-foreground">
                  ¿Como te llamamos?
                </label>
                <input
                  id="donation-donor-name"
                  aria-label="Nombre o apodo del donante"
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value.slice(0, 80))}
                  placeholder="Tu nombre o apodo (ej: Sofi y Kai)"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="donation-message" className="text-xs text-muted-foreground">
                  Mensaje opcional (lo leeremos, de verdad)
                </label>
                <textarea
                  id="donation-message"
                  aria-label="Mensaje opcional para el equipo de Paw Friend"
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value.slice(0, 500))}
                  placeholder="Por mis peludos. Ojala lleguen a hacer el mapa de callejeros 🐾"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {donorMessage.length}/500
                </p>
              </div>
              <label className="flex items-start gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Autorizo que mi nombre aparezca en la muralla de apoyos"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="text-muted-foreground">
                  Podemos mencionar tu nombre y mensaje publicamente en la futura muralla de apoyos
                  de Paw Friend. (Si no marcas, queda anonimo.)
                </span>
              </label>
            </div>

            <Button
              onClick={handleDonate}
              disabled={!validAmount || loading}
              className="w-full h-11 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:via-rose-600 hover:to-amber-600 text-white font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Heart className="h-4 w-4 mr-2 fill-current" />
              )}
              Donar{' '}
              {validAmount
                ? beneficiaryShelter
                  ? `$${amount.toLocaleString('es-CL')} a ${beneficiaryShelter.legal_name}`
                  : `$${amount.toLocaleString('es-CL')}`
                : beneficiaryShelter
                  ? `a ${beneficiaryShelter.legal_name}`
                  : 'a Paw Friend'}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground italic">
              Esto es un aporte voluntario, no te da Premium. Queremos que la app siga siendo gratis
              para todos.
            </p>

            {frequency === 'monthly' && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200/70 p-3 text-center text-xs text-emerald-900">
                <b>Sin miedo:</b> cancelas cuando quieras desde tu perfil · si el primer mes no te
                convence, te devolvemos sin preguntas (escribe a {CONTACT_EMAIL}).
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cierre emocional */}
        <section className="text-center text-sm text-muted-foreground space-y-1">
          <p className="flex items-center justify-center gap-1.5">
            <Home className="h-3.5 w-3.5" />
            Home-made · Chile · Para los peludos amigos
          </p>
          <p className="text-[11px]">
            Si no puedes donar hoy, igual puedes ayudar compartiendo Paw Friend con otro tutor
            peludo. Gracias por estar aca 💛
          </p>
        </section>

        {/* Pie legal — cumplimiento normativa Chile */}
        <section
          className="rounded-lg border border-muted bg-muted/30 p-4 space-y-2 text-[11px] leading-relaxed text-muted-foreground"
          aria-label="Información legal sobre los aportes"
        >
          <h3 className="text-xs font-semibold text-foreground">Información legal</h3>
          <ul className="space-y-1.5 list-disc pl-4">
            <li>
              Los aportes son <b>voluntarios</b> y no constituyen pago por servicio ni membresía.
              Paw Friend es y seguirá siendo gratis para todos los tutores.
            </li>
            <li>
              <b>No son deducibles de impuestos.</b> Paw Friend SpA es una empresa comercial y no
              está inscrita como donataria en el registro del SII (Ley 19.885 sobre donaciones con
              beneficios tributarios).
            </li>
            <li>
              Tienes derecho a solicitar la <b>devolución del aporte dentro de 10 días corridos</b>{' '}
              desde la transacción, conforme a la Ley 19.496 de Protección al Consumidor,
              escribiendo a{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Solicitud%20de%20devoluci%C3%B3n%20de%20aporte`}
                className="underline hover:text-foreground"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </li>
            <li>
              El aporte <b>no otorga</b> membresía Premium, beneficios tributarios, ventajas ni
              acceso preferente en la plataforma.
            </li>
            <li>
              Los pagos se procesan a través de <b>Flow.cl</b>. No almacenamos los datos de tu
              tarjeta. Para más detalles revisa nuestra{' '}
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="underline hover:text-foreground"
              >
                Política de Privacidad
              </button>{' '}
              y{' '}
              <button
                type="button"
                onClick={() => navigate('/terms')}
                className="underline hover:text-foreground"
              >
                Términos y Condiciones
              </button>
              .
            </li>
          </ul>
          <p className="text-[10px] italic pt-1 border-t border-dashed">
            Paw Friend es un proyecto <i>home-made</i> desarrollado por una persona en Chile. Los
            aportes cubren servidores, edge functions, seguridad de datos y desarrollo continuo.
          </p>
        </section>
      </div>
    </div>
  );
}

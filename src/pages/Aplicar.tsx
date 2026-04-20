/**
 * Pagina publica de aplicaciones / postulaciones. Ruta: /aplicar?tipo=<kind>.
 *
 * Recibe tipo por query param y muestra el form apropiado para cada
 * audiencia (refugios, partners, vets, companys, voices, corfo, startup,
 * angels, otro). Al submit, inserta en pitch_applications + llama a la
 * edge fn notify-pitch-application que envia email al equipo.
 *
 * Los tipos con onboarding propio (refugio, vet) tambien ofrecen un CTA
 * directo al onboarding de la app en lugar de/ademas del form.
 */
import { useMemo, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, CheckCircle2, Loader2, Users, MessageCircle } from 'lucide-react';
import { CategoryIcon, type CategoryKind } from '@/components/CategoryIcon';

type Kind =
  | 'corfo'
  | 'startup_chile'
  | 'paw_companys'
  | 'angels_vc'
  | 'refugio'
  | 'paw_partners'
  | 'vet'
  | 'paw_voices'
  | 'otro';

interface KindConfig {
  label: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  /**
   * Referencia al set de iconos de categoria (v2 brand kit). `null`
   * usa un icono generico Lucide (para tipos sin categoria publica:
   * corfo, startup_chile, angels_vc, otro).
   */
  categoryIcon: CategoryKind | null;
  color: string;
  orgLabel?: string;
  extraFields?: Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    options?: string[];
    placeholder?: string;
    required?: boolean;
  }>;
  /** CTA alternativo a un onboarding existente (ej. refugio -> /onboarding-shelter). */
  onboardingCta?: { href: string; label: string; description: string };
}

const KIND_CONFIG: Record<Kind, KindConfig> = {
  refugio: {
    label: 'Hogar de adopcion',
    eyebrow: 'Refugios · ONGs · Rescatistas',
    headline: 'Registra tu hogar de adopcion',
    subhead:
      'Gestion gratis de mascotas, carga masiva, ficha medica PDF y transferencia al adoptante.',
    categoryIcon: 'shelter',
    color: 'purple',
    orgLabel: 'Nombre del refugio / fundacion',
    extraFields: [
      {
        key: 'type',
        label: 'Tipo de organizacion',
        type: 'select',
        options: ['Refugio', 'ONG', 'Fundacion', 'Rescatista independiente', 'Municipal'],
        required: true,
      },
      { key: 'commune', label: 'Comuna base', type: 'text', required: true },
      {
        key: 'animals_in_care',
        label: 'Animales a cargo aproximados',
        type: 'text',
        placeholder: '50',
      },
    ],
    onboardingCta: {
      href: '/onboarding-shelter',
      label: 'Registrarme directo en la app',
      description: 'Si prefieres saltar este form y crear tu cuenta de refugio ahora mismo.',
    },
  },
  paw_partners: {
    label: 'Paw Partner',
    eyebrow: 'Tiendas · Servicios · Alianzas',
    headline: 'Suma tu marca como Paw Partner',
    subhead:
      'Ofrece un descuento a nuestros Paw Members y aparece gratis en el directorio de alianzas.',
    categoryIcon: 'partner',
    color: 'pink',
    orgLabel: 'Nombre comercial de tu marca',
    extraFields: [
      {
        key: 'vertical',
        label: 'Categoria',
        type: 'select',
        options: [
          'Accesorios y retail',
          'Comida y snacks',
          'Veterinaria',
          'Grooming',
          'Guarderia / Hospedaje',
          'Seguros',
          'Restaurantes pet-friendly',
          'Otro',
        ],
        required: true,
      },
      {
        key: 'discount',
        label: 'Descuento para Paw Members',
        type: 'text',
        placeholder: '10% off en toda la tienda · Envio gratis sobre $20.000',
        required: true,
      },
      {
        key: 'commune',
        label: 'Comuna / Zona de cobertura',
        type: 'text',
        placeholder: 'Las Condes · RM · Nacional',
      },
    ],
  },
  paw_companys: {
    label: 'Paw Company',
    eyebrow: 'Sponsors · Empresas pet-friendly',
    headline: 'Patrocina Paw Friend',
    subhead: 'Aporte mensual con badge publico (Bronze $49.9k · Silver $99.9k · Gold $199.9k).',
    categoryIcon: 'company',
    color: 'amber',
    orgLabel: 'Razon social de la empresa',
    extraFields: [
      {
        key: 'tier',
        label: 'Tier de interes',
        type: 'select',
        options: [
          'Bronze ($49.900/mes)',
          'Silver ($99.900/mes)',
          'Gold ($199.900/mes)',
          'A conversar',
        ],
        required: true,
      },
      {
        key: 'rut',
        label: 'RUT empresa',
        type: 'text',
        placeholder: '76.123.456-7',
      },
      {
        key: 'description',
        label: 'Giro / descripcion corta',
        type: 'text',
        placeholder: 'Tiendas de accesorios para mascotas con locales en RM',
      },
    ],
  },
  paw_voices: {
    label: 'Paw Voice',
    eyebrow: 'Creadores · Influencers peludos',
    headline: 'Unete como Paw Voice',
    subhead:
      'Amplifica adopciones y contenido emocional a tu audiencia. Badge oficial + codigo promo.',
    categoryIcon: 'voice',
    color: 'pink',
    orgLabel: 'Nombre artistico (opcional)',
    extraFields: [
      {
        key: 'platform',
        label: 'Plataforma principal',
        type: 'select',
        options: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Twitter', 'Otra'],
        required: true,
      },
      { key: 'handle', label: '@usuario', type: 'text', placeholder: '@kai_el_pastor' },
      {
        key: 'followers',
        label: 'Seguidores aprox.',
        type: 'text',
        placeholder: '8000',
      },
      {
        key: 'bio',
        label: 'Sobre ti y tu peludo',
        type: 'textarea',
        placeholder: 'Cuentanos en 1-2 parrafos de que trata tu cuenta.',
      },
    ],
  },
  vet: {
    label: 'Veterinario',
    eyebrow: 'Profesionales clinicos',
    headline: 'Suma tu clinica o consulta a Paw Friend',
    subhead:
      'Directorio publico, ficha clinica compartida, recordatorios automaticos. Plan Basica gratis.',
    categoryIcon: 'vet',
    color: 'teal',
    orgLabel: 'Nombre de la clinica (opcional)',
    extraFields: [
      { key: 'rut_profesional', label: 'RUT profesional', type: 'text', required: true },
      {
        key: 'especialidad',
        label: 'Especialidad principal',
        type: 'text',
        placeholder: 'Medicina general, felinos...',
      },
      { key: 'commune', label: 'Comuna', type: 'text', required: true },
    ],
    onboardingCta: {
      href: '/registro-veterinario',
      label: 'Registro directo como veterinario',
      description: 'Prefiero crear mi cuenta profesional y activar mi directorio ahora.',
    },
  },
  corfo: {
    label: 'CORFO SSAF-I',
    eyebrow: 'Fondos publicos',
    headline: 'Postulacion CORFO · Semilla Expande · SSAF-I',
    subhead: 'Material interno / apoyo en postulacion. No va a directorio publico.',
    categoryIcon: 'investor',
    color: 'teal',
  },
  startup_chile: {
    label: 'Start-Up Chile',
    eyebrow: 'Aceleradora publica',
    headline: 'Start-Up Chile Ignite',
    subhead: 'Material interno / apoyo en postulacion. No va a directorio publico.',
    categoryIcon: 'investor',
    color: 'amber',
  },
  angels_vc: {
    label: 'Angels / VC',
    eyebrow: 'Inversionistas',
    headline: 'Pre-seed / seed round',
    subhead: 'Conversacion privada con inversionistas. No va a directorio publico.',
    categoryIcon: 'investor',
    color: 'purple',
  },
  otro: {
    label: 'Otra propuesta',
    eyebrow: 'Contacto',
    headline: 'Cuentanos en que estas pensando',
    subhead: 'Alianza, medio de prensa, gobierno, integracion tecnica. Te respondemos siempre.',
    categoryIcon: null,
    color: 'purple',
  },
};

const baseSchema = z.object({
  contact_name: z.string().trim().min(2, 'Nombre muy corto').max(120),
  contact_email: z.string().trim().email('Email invalido'),
  contact_phone: z.string().trim().max(30).optional().or(z.literal('')),
  organization_name: z.string().trim().max(200).optional().or(z.literal('')),
  website: z
    .string()
    .trim()
    .refine((s) => s === '' || /^https?:\/\//i.test(s), 'URL debe empezar con http(s)://')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

function resolveKind(raw: string | null): Kind {
  const v = (raw || '').toLowerCase();
  if (v in KIND_CONFIG) return v as Kind;
  return 'otro';
}

export default function Aplicar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const kind = resolveKind(params.get('tipo'));
  const cfg = KIND_CONFIG[kind];

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    organization_name: '',
    website: '',
    message: '',
  });
  const [extra, setExtra] = useState<Record<string, string>>({});

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setExtraField = (k: string, v: string) => setExtra((e) => ({ ...e, [k]: v }));

  const colorClasses = useMemo(() => {
    switch (cfg.color) {
      case 'pink':
        return {
          bg: 'bg-pink-600',
          bgSoft: 'bg-pink-100',
          text: 'text-pink-700',
          hover: 'hover:bg-pink-700',
        };
      case 'amber':
        return {
          bg: 'bg-amber-600',
          bgSoft: 'bg-amber-100',
          text: 'text-amber-700',
          hover: 'hover:bg-amber-700',
        };
      case 'teal':
        return {
          bg: 'bg-teal-600',
          bgSoft: 'bg-teal-100',
          text: 'text-teal-700',
          hover: 'hover:bg-teal-700',
        };
      default:
        return {
          bg: 'bg-purple-600',
          bgSoft: 'bg-purple-100',
          text: 'text-purple-700',
          hover: 'hover:bg-purple-700',
        };
    }
  }, [cfg.color]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parse = baseSchema.safeParse(form);
    if (!parse.success) {
      const first = parse.error.issues[0];
      toast.error(first?.message || 'Revisa los campos');
      return;
    }

    // Campos requeridos extra
    for (const f of cfg.extraFields || []) {
      if (f.required && !(extra[f.key] || '').trim()) {
        toast.error(`Falta: ${f.label}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(extra).filter(([, v]) => v && v.trim() !== '')
      );

      const { data, error } = await supabase
        .from('pitch_applications')
        .insert({
          kind,
          contact_name: form.contact_name.trim(),
          contact_email: form.contact_email.trim().toLowerCase(),
          contact_phone: form.contact_phone.trim() || null,
          organization_name: form.organization_name.trim() || null,
          website: form.website.trim() || null,
          message: form.message.trim() || null,
          payload,
          source_url: window.location.href,
          user_agent: navigator.userAgent,
          status: 'submitted',
        })
        .select('id')
        .single();

      if (error) throw error;

      // Fire-and-forget notification. Si falla, la postulacion ya quedo registrada.
      if (data?.id) {
        try {
          await supabase.functions.invoke('notify-pitch-application', {
            body: { application_id: data.id },
          });
        } catch {
          /* silent */
        }
      }

      setSubmitted(true);
      toast.success('Recibimos tu postulacion');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos enviar la postulacion';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-pink-50/40">
        <Helmet>
          <title>Gracias · Paw Friend</title>
        </Helmet>
        <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <CardContent className="p-8 text-center space-y-4">
            <div
              className={`mx-auto h-16 w-16 rounded-full ${colorClasses.bgSoft} flex items-center justify-center`}
            >
              <CheckCircle2 className={`h-8 w-8 ${colorClasses.text}`} />
            </div>
            <h1 className="text-2xl font-display font-semibold">¡Gracias!</h1>
            <p className="text-sm text-muted-foreground">
              Recibimos tu postulacion para <strong>{cfg.label}</strong>. Te respondemos a tu email
              en los proximos dias habiles.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => navigate('/')}
                className={`${colorClasses.bg} ${colorClasses.hover} text-white`}
              >
                Volver al inicio
              </Button>
              <Button variant="ghost" onClick={() => setSubmitted(false)}>
                Enviar otra postulacion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50/40">
      <Helmet>
        <title>{cfg.headline} · Paw Friend</title>
        <meta name="description" content={cfg.subhead} />
      </Helmet>

      <div className="container max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center space-y-4">
          <Badge
            variant="outline"
            className={`${colorClasses.text} ${colorClasses.bgSoft} border-transparent`}
          >
            {cfg.eyebrow}
          </Badge>
          {cfg.categoryIcon ? (
            <CategoryIcon
              kind={cfg.categoryIcon}
              badge
              size="lg"
              className="shadow-lg"
              aria-label={cfg.label}
            />
          ) : (
            <div
              className={`mx-auto h-14 w-14 rounded-full ${colorClasses.bg} text-white flex items-center justify-center shadow-lg`}
            >
              <MessageCircle className="h-7 w-7" />
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-display font-semibold tracking-tight">
            {cfg.headline}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{cfg.subhead}</p>
        </div>

        {/* CTA alternativo (si existe) */}
        {cfg.onboardingCta && (
          <Card className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">{cfg.onboardingCta.label}</p>
                  <p className="text-xs text-purple-700/80 mt-0.5">
                    {cfg.onboardingCta.description}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="border-purple-300">
                <Link to={cfg.onboardingCta.href}>
                  Ir <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contact_name">Nombre *</Label>
                  <Input
                    id="contact_name"
                    required
                    value={form.contact_name}
                    onChange={(e) => setField('contact_name', e.target.value)}
                    placeholder="Como te llamas"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    required
                    value={form.contact_email}
                    onChange={(e) => setField('contact_email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone">Telefono (opcional)</Label>
                  <Input
                    id="contact_phone"
                    value={form.contact_phone}
                    onChange={(e) => setField('contact_phone', e.target.value)}
                    placeholder="+56 9 ..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="organization_name">
                    {cfg.orgLabel || 'Organizacion (opcional)'}
                  </Label>
                  <Input
                    id="organization_name"
                    value={form.organization_name}
                    onChange={(e) => setField('organization_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Sitio web o red social (opcional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setField('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Campos extra por tipo */}
              {(cfg.extraFields || []).map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label htmlFor={`extra-${f.key}`}>
                    {f.label}
                    {f.required ? ' *' : ''}
                  </Label>
                  {f.type === 'textarea' ? (
                    <Textarea
                      id={`extra-${f.key}`}
                      value={extra[f.key] || ''}
                      onChange={(e) => setExtraField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                    />
                  ) : f.type === 'select' ? (
                    <Select
                      value={extra[f.key] || ''}
                      onValueChange={(v) => setExtraField(f.key, v)}
                    >
                      <SelectTrigger id={`extra-${f.key}`}>
                        <SelectValue placeholder="Elige una opcion" />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options || []).map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`extra-${f.key}`}
                      value={extra[f.key] || ''}
                      onChange={(e) => setExtraField(f.key, e.target.value)}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}

              <div className="space-y-1.5">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setField('message', e.target.value)}
                  placeholder="Contexto, proyecto, lo que quieras contar"
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-[11px] text-muted-foreground text-right">
                  {form.message.length}/2000
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className={`w-full ${colorClasses.bg} ${colorClasses.hover} text-white`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Enviando
                  </>
                ) : (
                  <>
                    Enviar postulacion <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                Tus datos solo se usan para responderte. No se comparten con terceros. Leer{' '}
                <Link to="/privacy" className="underline hover:text-foreground">
                  politica de privacidad
                </Link>
                .
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Form inline generico de postulacion por categoria. Se usa embebido al
 * final de paginas como /paw-partners, /refugios-hogares, etc.
 *
 * Internamente hace INSERT en pitch_applications con el kind indicado
 * + llama a notify-pitch-application. Maneja rate limit con mensaje
 * amigable. Renderiza pantalla de gracias post-submit.
 *
 * Los campos extra son configurables por kind (igual que /aplicar pero
 * inline y mas compacto para embebido).
 */
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryIcon, type CategoryKind } from '@/components/CategoryIcon';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

type ApplyKind = 'paw_partners' | 'refugio' | 'paw_voices' | 'paw_companys';

interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

interface Props {
  kind: ApplyKind;
  /** Icono de categoria a mostrar en el header del form. */
  categoryIcon: CategoryKind;
  /** Titulo corto (ej. "Postula en 2 minutos"). */
  title: string;
  /** Subtitulo opcional (ej. "El equipo revisa y te contactamos"). */
  subtitle: string;
  /** Label del campo organizacion (ej. "Nombre comercial", "Nombre del refugio"). */
  orgLabel: string;
  /** Campos extra especificos por tipo. */
  extraFields?: FieldConfig[];
  /** Label del boton principal de submit. */
  submitLabel: string;
  /** CTA alternativo opcional al onboarding propio (ej. refugio). */
  directOnboarding?: { href: string; label: string };
  /** Color de acento del header (Tailwind class). Default gradient purple+pink. */
  headerGradient?: string;
  /** Texto post-submit personalizado. */
  successMessage?: string;
  /** CTA extra en la pantalla de exito. */
  successCta?: { href: string; label: string };
  /** Callback cuando se envia exitosamente. */
  onSuccess?: () => void;
  /** Nodo extra opcional arriba del form (imagen hero, decorativo). */
  headerExtra?: ReactNode;
}

const baseSchema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto').max(120),
  email: z.string().trim().email('Email invalido'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  organization: z.string().trim().max(200).optional().or(z.literal('')),
  website: z
    .string()
    .trim()
    .refine((s) => s === '' || /^https?:\/\//i.test(s), 'URL debe empezar con http(s)://')
    .optional()
    .or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
});

export function CategoryApplyInlineForm({
  kind,
  categoryIcon,
  title,
  subtitle,
  orgLabel,
  extraFields = [],
  submitLabel,
  directOnboarding,
  headerGradient = 'bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500',
  successMessage,
  successCta,
  onSuccess,
  headerExtra,
}: Props) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    website: '',
    message: '',
  });
  const [extras, setExtras] = useState<Record<string, string>>({});

  const setField = <K extends keyof typeof form>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setExtra = (key: string, value: string) => setExtras((e) => ({ ...e, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = baseSchema.safeParse(form);
    if (!parse.success) {
      toast.error(parse.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    for (const f of extraFields) {
      if (f.required && !(extras[f.key] || '').trim()) {
        toast.error(`Falta: ${f.label}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(extras).filter(([, v]) => v && v.trim() !== '')
      );
      const { data, error } = await supabase
        .from('pitch_applications')
        .insert({
          kind,
          contact_name: form.name.trim(),
          contact_email: form.email.trim().toLowerCase(),
          contact_phone: form.phone.trim() || null,
          organization_name: form.organization.trim() || null,
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
      onSuccess?.();
      toast.success('Recibimos tu postulacion');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos enviar la postulacion';
      if (/rate_limit_exceeded|duplicate_application/.test(msg)) {
        toast.error('Ya tienes una postulacion activa · revisa tu email o espera 24h');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-700" />
          </div>
          <h3 className="text-2xl font-display font-semibold">
            ¡Gracias, {form.name.split(' ')[0]}!
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {successMessage ||
              `Recibimos tu postulacion. El equipo de Paw Friend revisa en 1-3 dias habiles y te escribimos al email ${form.email}.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {successCta && (
              <Button
                onClick={() => navigate(successCta.href)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {successCta.label} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Enviar otra postulacion
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 shadow-xl rounded-2xl overflow-hidden">
      <div className={`${headerGradient} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-2">
          <CategoryIcon
            kind={categoryIcon}
            variant="icon"
            className="h-10 w-10 bg-white/20 rounded-full p-1"
          />
          <div className="flex-1">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="text-xs text-white/85">{subtitle}</p>
          </div>
        </div>
        {headerExtra}
      </div>
      <CardContent className="p-6">
        {directOnboarding && (
          <div className="mb-4 p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-between gap-3">
            <p className="text-xs text-purple-900">
              ¿Prefieres saltar este form y crear tu cuenta ahora?
            </p>
            <Button asChild size="sm" variant="outline" className="border-purple-300 flex-shrink-0">
              <a href={directOnboarding.href}>
                {directOnboarding.label} <ArrowRight className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${kind}-name`}>Nombre *</Label>
              <Input
                id={`${kind}-name`}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required
                placeholder="Como te llamas"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${kind}-email`}>Email *</Label>
              <Input
                id={`${kind}-email`}
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${kind}-phone`}>Telefono</Label>
              <Input
                id={`${kind}-phone`}
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+56 9 ..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${kind}-org`}>{orgLabel}</Label>
              <Input
                id={`${kind}-org`}
                value={form.organization}
                onChange={(e) => setField('organization', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`${kind}-web`}>Sitio web o red social</Label>
            <Input
              id={`${kind}-web`}
              type="url"
              value={form.website}
              onChange={(e) => setField('website', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {extraFields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`${kind}-${f.key}`}>
                {f.label}
                {f.required ? ' *' : ''}
              </Label>
              {f.type === 'textarea' ? (
                <Textarea
                  id={`${kind}-${f.key}`}
                  value={extras[f.key] || ''}
                  onChange={(e) => setExtra(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                />
              ) : f.type === 'select' ? (
                <Select value={extras[f.key] || ''} onValueChange={(v) => setExtra(f.key, v)}>
                  <SelectTrigger id={`${kind}-${f.key}`}>
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
                  id={`${kind}-${f.key}`}
                  value={extras[f.key] || ''}
                  onChange={(e) => setExtra(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor={`${kind}-message`}>Mensaje</Label>
            <Textarea
              id={`${kind}-message`}
              value={form.message}
              onChange={(e) => setField('message', e.target.value)}
              placeholder="Contexto, detalles, lo que quieras contar"
              rows={3}
              maxLength={1000}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 h-12 font-bold"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando
              </>
            ) : (
              <>
                {submitLabel} <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            Tus datos solo se usan para responderte. No se comparten con terceros.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

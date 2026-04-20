/**
 * Form de postulacion de veterinario embebido en /para-veterinarios.
 * Hace INSERT en pitch_applications con kind='vet' y llama a la edge fn
 * notify-pitch-application. El admin lo aprueba y el vet recibe email
 * con link a /registro-veterinario para completar su perfil.
 *
 * Alternativa rapida: CTA "Crear cuenta profesional directamente" que
 * lleva a /registro-veterinario con los datos precargados via query params.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight, CheckCircle2, Stethoscope } from 'lucide-react';
import { SANTIAGO_COMUNAS } from '@/lib/vetDirectory';

const schema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto').max(120),
  email: z.string().trim().email('Email invalido'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  rut: z.string().trim().max(15).optional().or(z.literal('')),
  commune: z.string().trim().min(1, 'Comuna requerida'),
  speciality: z.string().trim().max(200).optional().or(z.literal('')),
  clinic_name: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
});

export function VetOnboardingInlineForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    commune: '',
    speciality: '',
    clinic_name: '',
    message: '',
  });

  const setField = <K extends keyof typeof form>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = schema.safeParse(form);
    if (!parse.success) {
      toast.error(parse.error.issues[0]?.message || 'Revisa los campos');
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('pitch_applications')
        .insert({
          kind: 'vet',
          contact_name: form.name.trim(),
          contact_email: form.email.trim().toLowerCase(),
          contact_phone: form.phone.trim() || null,
          organization_name: form.clinic_name.trim() || null,
          message: form.message.trim() || null,
          payload: {
            rut_profesional: form.rut.trim() || null,
            commune: form.commune,
            especialidad: form.speciality.trim() || null,
          },
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
      toast.success('Recibimos tu postulacion');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No pudimos enviar la postulacion';
      // Rate limit message bonito
      if (/rate_limit_exceeded|duplicate_application/.test(msg)) {
        toast.error('Ya tienes una postulacion activa · revisa tu email o espera 24h');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goDirect = () => {
    const qs = new URLSearchParams({
      name: form.name,
      email: form.email,
      commune: form.commune,
    }).toString();
    navigate(`/registro-veterinario?${qs}`);
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
            Recibimos tu postulacion como veterinario. El equipo de Paw Friend revisa en 1-3 dias
            habiles y te escribimos al email <strong>{form.email}</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => navigate('/registro-veterinario')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Completar mi perfil ahora <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
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
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CategoryIcon
            kind="vet"
            variant="icon"
            className="h-10 w-10 bg-white/20 rounded-full p-1"
          />
          <div>
            <h3 className="text-lg font-bold">Postula en 2 minutos</h3>
            <p className="text-xs text-purple-100">
              El equipo revisa, te contactamos, y quedas como Founding Vet.
            </p>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vet-name">Nombre completo *</Label>
              <Input
                id="vet-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Ej. Dra. Sofia Rosi"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vet-email">Email *</Label>
              <Input
                id="vet-email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vet-phone">Telefono</Label>
              <Input
                id="vet-phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+56 9 ..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vet-rut">RUT profesional</Label>
              <Input
                id="vet-rut"
                value={form.rut}
                onChange={(e) => setField('rut', e.target.value)}
                placeholder="12.345.678-9"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vet-commune">Comuna *</Label>
              <Select value={form.commune} onValueChange={(v) => setField('commune', v)}>
                <SelectTrigger id="vet-commune">
                  <SelectValue placeholder="Elige tu comuna" />
                </SelectTrigger>
                <SelectContent>
                  {SANTIAGO_COMUNAS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="Otra">Otra región</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vet-speciality">Especialidad principal</Label>
              <Input
                id="vet-speciality"
                value={form.speciality}
                onChange={(e) => setField('speciality', e.target.value)}
                placeholder="Medicina general, felinos..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vet-clinic">Clinica / consulta (opcional)</Label>
            <Input
              id="vet-clinic"
              value={form.clinic_name}
              onChange={(e) => setField('clinic_name', e.target.value)}
              placeholder="Nombre de tu clinica o 'Consulta independiente'"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vet-message">Cuentanos de ti (opcional)</Label>
            <Textarea
              id="vet-message"
              value={form.message}
              onChange={(e) => setField('message', e.target.value)}
              placeholder="Anos de experiencia, lo que te motiva, como atiendes..."
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 h-12 font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando
                </>
              ) : (
                <>
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Postular como veterinario
                </>
              )}
            </Button>
            <Button type="button" variant="outline" className="h-12" onClick={goDirect}>
              O crear cuenta directo
            </Button>
          </div>

          <p className="text-[11px] text-center text-muted-foreground pt-1">
            Respetamos tu privacidad. Tus datos solo se usan para contactarte.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

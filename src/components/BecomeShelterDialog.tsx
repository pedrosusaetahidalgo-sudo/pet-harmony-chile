/**
 * Dialog para que un user registrado cree una cuenta de refugio / hogar
 * de adopcion. Wizard de 3 pasos:
 *   1. Tipo de centro + nombre legal + RUT (opcional)
 *   2. Ubicacion (comuna, region, direccion, email, telefono, web)
 *   3. Mision + tipos de animales + capacidad + aceptar donaciones
 *
 * Al submit: inserta en public.adoption_centers con status='active' (decision
 * 2026-04-20: auto-activo, verificacion admin posterior).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';
import { SANTIAGO_COMUNAS } from '@/lib/vetDirectory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  Building2,
  HomeIcon,
  Landmark,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

type ShelterType = 'ong' | 'fundacion' | 'refugio' | 'independiente' | 'municipal';

const TYPE_OPTIONS: {
  value: ShelterType;
  icon: typeof Heart;
  title: string;
  desc: string;
}[] = [
  {
    value: 'ong',
    icon: Users,
    title: 'ONG',
    desc: 'Organizacion no gubernamental con personalidad juridica.',
  },
  {
    value: 'fundacion',
    icon: Building2,
    title: 'Fundacion',
    desc: 'Fundacion sin fines de lucro.',
  },
  {
    value: 'refugio',
    icon: HomeIcon,
    title: 'Refugio',
    desc: 'Refugio fisico que alberga animales rescatados.',
  },
  {
    value: 'independiente',
    icon: Heart,
    title: 'Rescatista independiente',
    desc: 'Persona natural que rescata y da en adopcion.',
  },
  {
    value: 'municipal',
    icon: Landmark,
    title: 'Municipal',
    desc: 'Programa de proteccion animal de municipalidad.',
  },
];

const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapaca',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaiso',
  'Metropolitana',
  "O'Higgins",
  'Maule',
  'Nuble',
  'Biobio',
  'La Araucania',
  'Los Rios',
  'Los Lagos',
  'Aysen',
  'Magallanes',
];

const ANIMAL_TYPE_OPTIONS = [
  { value: 'perros', label: 'Perros' },
  { value: 'gatos', label: 'Gatos' },
  { value: 'conejos', label: 'Conejos' },
  { value: 'aves', label: 'Aves' },
  { value: 'equinos', label: 'Equinos' },
  { value: 'otros', label: 'Otros' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BecomeShelterDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { setRole } = useActiveRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Paso 1
  const [type, setType] = useState<ShelterType | null>(null);
  const [legalName, setLegalName] = useState('');
  const [rut, setRut] = useState('');

  // Paso 2
  const [region, setRegion] = useState('Metropolitana');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');

  // Paso 3
  const [mission, setMission] = useState('');
  const [animalTypes, setAnimalTypes] = useState<string[]>(['perros', 'gatos']);
  const [capacity, setCapacity] = useState('');
  const [acceptsDonations, setAcceptsDonations] = useState(true);

  const canContinueStep1 = !!type && legalName.trim().length >= 3;
  const canContinueStep2 = !!commune && !!region;
  const canSubmit =
    canContinueStep1 && canContinueStep2 && mission.trim().length >= 20 && animalTypes.length > 0;

  const toggleAnimalType = (v: string) => {
    setAnimalTypes((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const handleSubmit = async () => {
    if (!user || !canSubmit || !type) return;
    setSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        legal_name: legalName.trim(),
        rut: rut.trim() || null,
        type,
        mission: mission.trim(),
        region,
        commune,
        address: address.trim() || null,
        contact_email: contactEmail.trim() || user.email || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
        social_media: instagram.trim() ? { instagram: instagram.trim() } : {},
        animal_types: animalTypes,
        capacity: capacity ? Number(capacity) : null,
        accepts_donations: acceptsDonations,
        status: 'active' as const,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('adoption_centers' as any) as any).insert(payload);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['is-shelter-role'] });
      setRole('shelter');
      onOpenChange(false);
      toast.success('¡Bienvenido! Tu refugio ya esta activo en Paw Friend.');
      navigate('/shelter/dashboard');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No pudimos crear tu refugio. Intenta de nuevo.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 0 && '¿Que tipo de hogar de adopcion eres?'}
            {step === 1 && 'Ubicacion y contacto'}
            {step === 2 && 'Tu mision y alcance'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 0: Tipo + nombre legal */}
        {step === 0 && (
          <div className="space-y-3 mt-2">
            <div className="space-y-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-start gap-3 ${
                      active
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <div
                      className={`rounded-full p-2 ${
                        active ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{opt.title}</h3>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {active && (
                      <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label>Nombre del hogar o refugio *</Label>
              <Input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Refugio Huellitas Felices"
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <Label>RUT (opcional)</Label>
              <Input
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="76.123.456-7"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground">
                Si eres ONG o fundacion con RUT, nos ayuda a verificarte mas rapido.
              </p>
            </div>

            <Button className="w-full mt-2" disabled={!canContinueStep1} onClick={() => setStep(1)}>
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 1: Ubicacion + contacto */}
        {step === 1 && (
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Region *</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONES_CHILE.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Comuna *</Label>
                {region === 'Metropolitana' ? (
                  <Select value={commune} onValueChange={setCommune}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige comuna" />
                    </SelectTrigger>
                    <SelectContent>
                      {SANTIAGO_COMUNAS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="Comuna"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Direccion (opcional)</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Siempre Viva 123"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email de contacto</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={user?.email || 'contacto@refugio.cl'}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefono</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sitio web</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@refugio_huellitas"
                />
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Atras
              </Button>
              <Button disabled={!canContinueStep2} onClick={() => setStep(2)}>
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mision + alcance */}
        {step === 2 && (
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label>Tu mision *</Label>
              <Textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Que hacen, por que, a quien ayudan..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {mission.length}/500 · minimo 20 caracteres. Esto aparecera en tu pagina publica.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Animales que rescatan * (al menos 1)</Label>
              <div className="flex flex-wrap gap-1.5">
                {ANIMAL_TYPE_OPTIONS.map((opt) => {
                  const active = animalTypes.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleAnimalType(opt.value)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition ${
                        active
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-foreground border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Capacidad aproximada (numero de animales)</Label>
              <Input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="50"
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
              <Checkbox
                id="accepts_donations"
                checked={acceptsDonations}
                onCheckedChange={(v) => setAcceptsDonations(!!v)}
                className="mt-0.5"
              />
              <label htmlFor="accepts_donations" className="text-sm cursor-pointer flex-1">
                <span className="font-semibold">Quiero recibir donaciones dirigidas</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  La comunidad puede donar directamente a tu refugio desde el perfil publico y desde
                  /donaciones seleccionandote como beneficiario.
                </p>
              </label>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Atras
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creando...
                  </>
                ) : (
                  'Activar mi refugio'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

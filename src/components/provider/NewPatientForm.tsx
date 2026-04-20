import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, ChevronDown } from '@/lib/icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PET_COLORS } from '@/lib/petOptions';
import { SelectWithOther } from '@/components/ui/select-with-other';
import { ComboboxWithOther } from '@/components/ui/combobox-with-other';
import { BREEDS_BY_SPECIES } from '@/lib/breeds';
import { newPatientSchema, type NewPatientFormData } from '@/lib/schemas';
import { track, EVENTS } from '@/lib/analytics';

const SPECIES_OPTIONS = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'conejo', label: 'Conejo' },
  { value: 'hamster', label: 'Hámster' },
  { value: 'ave', label: 'Ave' },
  { value: 'pez', label: 'Pez' },
  { value: 'reptil', label: 'Reptil' },
  { value: 'tortuga', label: 'Tortuga' },
  { value: 'otro', label: 'Otro' },
];

interface NewPatientFormProps {
  onCreated?: () => void;
}

export function NewPatientForm({ onCreated }: NewPatientFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateBypass, setDuplicateBypass] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showClinical, setShowClinical] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewPatientFormData>({
    resolver: zodResolver(newPatientSchema),
    defaultValues: {
      name: '',
      species: '',
      breed: '',
      birth_date: '',
      sex: '',
      weight: '',
      color: '',
      owner_name: '',
      owner_email: '',
      microchip_number: '',
      blood_type: '',
      known_allergies: '',
      chronic_conditions: '',
    },
  });

  const speciesValue = watch('species');
  const sexValue = watch('sex');
  const colorValue = watch('color');

  const onSubmit = async (data: NewPatientFormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const resp = await supabase.functions.invoke('create-patient', {
        body: {
          name: data.name.trim(),
          species: data.species,
          breed: data.breed?.trim() || undefined,
          birth_date: data.birth_date || undefined,
          sex: data.sex || undefined,
          weight: data.weight || undefined,
          color: data.color?.trim() || undefined,
          owner_name: data.owner_name.trim(),
          owner_email: data.owner_email.trim(),
          microchip_number: data.microchip_number?.trim() || undefined,
          blood_type: data.blood_type || undefined,
          known_allergies: data.known_allergies?.trim() || undefined,
          chronic_conditions: data.chronic_conditions?.trim() || undefined,
          force_create: duplicateBypass,
        },
      });

      if (resp.error) {
        throw new Error(resp.error.message || 'Error al crear el paciente');
      }

      const result = resp.data;

      // Handle duplicate detection from server
      if (result?.code === 'DUPLICATE_DETECTED') {
        toast.info(result.error);
        setDuplicateBypass(true);
        setSubmitting(false);
        return;
      }
      if (result?.code === 'DUPLICATE_MICROCHIP') {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      // Handle non-success responses (edge function returned error JSON with 4xx/5xx)
      if (result?.error && !result?.success) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      setDuplicateBypass(false);
      toast.success(`Paciente ${data.name} creado correctamente`);

      track({
        event: EVENTS.VET_PATIENT_CREATED,
        properties: {
          species: data.species,
          owner_already_registered: Boolean(result?.owner_already_registered),
          email_sent: Boolean(result?.email_sent),
          via: 'new_patient_form',
        },
      });

      if (result?.owner_already_registered) {
        toast.success(
          `${data.name} se vinculó automáticamente con ${data.owner_name}. Ya tiene acceso a la ficha.`
        );
      } else if (result?.email_sent) {
        toast.success(
          `Invitación enviada a ${data.owner_email}. Cuando se registre, ${data.name} se vinculará automáticamente.`
        );
      } else if (result?.invitation_error) {
        toast.info(result.invitation_error);
      }

      reset();
      setOpen(false);
      onCreated?.();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Error al crear el paciente';
      logger.error('NewPatientForm error:', err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar nuevo paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="np-name">Nombre de la mascota *</Label>
            <Input id="np-name" placeholder="Ej: Luna" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Especie */}
          <div className="space-y-1.5">
            <Label>Especie *</Label>
            <Select
              value={speciesValue}
              onValueChange={(v) => setValue('species', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona especie" />
              </SelectTrigger>
              <SelectContent>
                {SPECIES_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.species && <p className="text-xs text-destructive">{errors.species.message}</p>}
            <input type="hidden" {...register('species')} />
          </div>

          {/* Nombre del dueno */}
          <div className="space-y-1.5">
            <Label htmlFor="np-owner-name">Nombre del dueño *</Label>
            <Input id="np-owner-name" placeholder="Ej: María López" {...register('owner_name')} />
            {errors.owner_name && (
              <p className="text-xs text-destructive">{errors.owner_name.message}</p>
            )}
          </div>

          {/* Email del dueno */}
          <div className="space-y-1.5">
            <Label htmlFor="np-email">Email del dueño *</Label>
            <Input
              id="np-email"
              type="email"
              placeholder="dueno@ejemplo.cl"
              {...register('owner_email')}
            />
            {errors.owner_email && (
              <p className="text-xs text-destructive">{errors.owner_email.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              El dueño recibirá una invitación para vincular a su mascota.
            </p>
          </div>

          {/* Hint "modo rapido": solo 4 campos obligatorios visibles por default.
              El resto queda en acordeones plegados. */}
          <p className="text-[11px] text-muted-foreground bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
            Puedes crear al paciente con solo estos datos y completar el resto desde la ficha
            clínica. Los campos de abajo son opcionales.
          </p>

          {/* Detalles basicos opcionales */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between text-sm text-muted-foreground"
              >
                Detalles básicos (raza, fecha, sexo, peso, color)
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {/* Raza */}
              <div className="space-y-1.5">
                <Label>Raza</Label>
                <ComboboxWithOther
                  options={BREEDS_BY_SPECIES[watch('species')] || []}
                  value={watch('breed') || ''}
                  onValueChange={(v) => setValue('breed', v)}
                  placeholder="Selecciona raza"
                  searchPlaceholder="Buscar raza..."
                  emptyMessage="Raza no encontrada."
                  otherPlaceholder="Escribe la raza..."
                />
              </div>

              {/* Fecha nacimiento */}
              <div className="space-y-1.5">
                <Label htmlFor="np-birth">Fecha de nacimiento</Label>
                <Input id="np-birth" type="date" {...register('birth_date')} />
              </div>

              {/* Sexo */}
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <Select value={sexValue} onValueChange={(v) => setValue('sex', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                    <SelectItem value="desconocido">Desconocido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Peso */}
              <div className="space-y-1.5">
                <Label htmlFor="np-weight">Peso (kg)</Label>
                <Input
                  id="np-weight"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 8.5"
                  {...register('weight')}
                />
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label>Color</Label>
                <SelectWithOther
                  options={[...PET_COLORS]}
                  value={colorValue}
                  onValueChange={(v) => setValue('color', v)}
                  placeholder="Selecciona color"
                  otherPlaceholder="Describe el color..."
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Datos clínicos opcionales */}
          <Collapsible open={showClinical} onOpenChange={setShowClinical}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between text-sm text-muted-foreground"
              >
                Datos clínicos (opcional)
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showClinical ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="np-microchip">Microchip (15 dígitos ISO)</Label>
                <Input
                  id="np-microchip"
                  placeholder="Ej: 982000123456789"
                  {...register('microchip_number')}
                />
                {errors.microchip_number && (
                  <p className="text-xs text-destructive">{errors.microchip_number.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-blood">Grupo sanguíneo</Label>
                <Input id="np-blood" placeholder="Ej: DEA 1.1+" {...register('blood_type')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-allergies">Alergias conocidas</Label>
                <Input
                  id="np-allergies"
                  placeholder="Separar con comas: pollo, penicilina"
                  {...register('known_allergies')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-chronic">Condiciones crónicas</Label>
                <Input
                  id="np-chronic"
                  placeholder="Separar con comas: diabetes, epilepsia"
                  {...register('chronic_conditions')}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear paciente'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

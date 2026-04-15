import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { generatePawCardData } from '@/hooks/useHoloPattern';
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
      // Duplicate detection: check if this pet already exists for this owner email
      if (!duplicateBypass) {
        const ownerEmail = data.owner_email.trim().toLowerCase();
        // Check by name+species+email (pending or registered owner)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingPets } = await (supabase.from('pets') as any)
          .select('id, name, owner_id, pending_owner_email')
          .ilike('name', data.name.trim())
          .eq('species', data.species)
          .or(`pending_owner_email.eq.${ownerEmail},owner_id.not.is.null`);

        const match = existingPets?.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p: any) => p.pending_owner_email === ownerEmail || p.owner_id
        );
        if (match) {
          if (match.owner_id) {
            toast.info(
              `Ya existe "${match.name}" en el sistema con un dueño registrado. Puedes solicitar acceso desde tu lista de pacientes.`
            );
          } else {
            toast.info(
              `Otro profesional ya registró "${match.name}" para ${ownerEmail}. Presiona "Crear" de nuevo si quieres crear otro registro.`
            );
          }
          setDuplicateBypass(true);
          setSubmitting(false);
          return;
        }

        // Microchip uniqueness check
        if (data.microchip_number) {
          const { data: chipMatch } = await supabase
            .from('pets')
            .select('id, name')
            .eq('microchip_number', data.microchip_number.trim())
            .limit(1);

          if (chipMatch && chipMatch.length > 0) {
            toast.error(
              `Este microchip ya está asociado a "${chipMatch[0].name}". Verifica el número.`
            );
            setSubmitting(false);
            return;
          }
        }
      }
      setDuplicateBypass(false);

      const pawCard = generatePawCardData();
      const insertPayload: Record<string, unknown> = {
        name: data.name.trim(),
        species: data.species,
        created_by_vet_id: user.id,
        pending_owner_email: data.owner_email.trim().toLowerCase(),
        pending_owner_name: data.owner_name.trim() || null,
        breed: data.breed.trim() || null,
        birth_date: data.birth_date || null,
        gender: data.sex || null,
        weight: data.weight ? parseFloat(data.weight) : null,
        color: data.color.trim() || null,
        holo_pattern: pawCard.holoPattern,
        paw_card_id: pawCard.pawCardId,
        microchip_number: data.microchip_number?.trim() || null,
        blood_type: data.blood_type || null,
      };

      // Clinical fields (optional, stored as comma-separated → arrays)
      if (data.known_allergies?.trim()) {
        insertPayload.allergies = data.known_allergies
          .split(',')
          .map((a: string) => a.trim())
          .filter(Boolean);
      }
      if (data.chronic_conditions?.trim()) {
        insertPayload.chronic_conditions = data.chronic_conditions
          .split(',')
          .map((c: string) => c.trim())
          .filter(Boolean);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: petRow, error } = await (supabase.from('pets') as any)
        .insert(insertPayload)
        .select('id')
        .single();
      if (error) throw error;

      toast.success(`Paciente ${data.name} creado correctamente`);

      // Enviar invitación al dueño por email (solo si no está registrado)
      if (petRow?.id) {
        try {
          const resp = await supabase.functions.invoke('send-pet-invitation', {
            body: { pet_id: petRow.id },
          });
          if (resp.error) {
            logger.error('Error sending invitation:', resp.error);
            toast.info(
              'Paciente creado. No se pudo enviar la invitación por email, pero puedes reenviarla desde tu panel.'
            );
          } else if (resp.data?.owner_already_registered) {
            toast.success(
              `${data.name} se vinculó automáticamente con ${data.owner_name}. Ya tiene acceso a la ficha.`
            );
          } else {
            toast.success(
              `Invitación enviada a ${data.owner_email}. Cuando se registre, ${data.name} se vinculará automáticamente.`
            );
          }
        } catch (invErr) {
          logger.error('Invitation edge function error:', invErr);
          // No bloquear — el paciente ya fue creado
        }
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
      logger.error('NewPatientForm insert error:', err);
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

          {/* Nombre del dueno */}
          <div className="space-y-1.5">
            <Label htmlFor="np-owner-name">Nombre del dueño *</Label>
            <Input id="np-owner-name" placeholder="Ej: Pedro Susaeta" {...register('owner_name')} />
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

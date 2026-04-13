import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
import { Plus, Loader2 } from '@/lib/icons';
import { PET_COLORS } from '@/lib/petOptions';
import { SelectWithOther } from '@/components/ui/select-with-other';
import { ComboboxWithOther } from '@/components/ui/combobox-with-other';
import { BREEDS_BY_SPECIES } from '@/lib/breeds';

interface NewPatientFormData {
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  sex: string;
  weight: string;
  color: string;
  owner_name: string;
  owner_email: string;
}

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
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewPatientFormData>({
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
    },
  });

  const speciesValue = watch('species');
  const sexValue = watch('sex');
  const colorValue = watch('color');

  const onSubmit = async (data: NewPatientFormData) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const pawCard = generatePawCardData();
      const insertPayload = {
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
      };

      const { data: petRow, error } = await supabase
        .from('pets')
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
            console.error('Error sending invitation:', resp.error);
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
          console.error('Invitation edge function error:', invErr);
          // No bloquear — el paciente ya fue creado
        }
      }

      reset();
      setOpen(false);
      onCreated?.();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : null) || 'Error al crear el paciente');
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
            <Input
              id="np-name"
              placeholder="Ej: Luna"
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
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
            {!speciesValue && errors.species && (
              <p className="text-xs text-destructive">Selecciona una especie</p>
            )}
            <input type="hidden" {...register('species', { required: true })} />
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
            <Input
              id="np-owner-name"
              placeholder="Ej: Pedro Susaeta"
              {...register('owner_name', { required: 'El nombre del dueño es obligatorio' })}
            />
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
              {...register('owner_email', {
                required: 'El email del dueño es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingresa un email válido',
                },
              })}
            />
            {errors.owner_email && (
              <p className="text-xs text-destructive">{errors.owner_email.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              El dueño recibirá una invitación para vincular a su mascota.
            </p>
          </div>

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

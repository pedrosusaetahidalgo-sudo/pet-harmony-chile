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

interface NewPatientFormData {
  name: string;
  species: string;
  breed: string;
  birth_date: string;
  sex: string;
  weight: string;
  color: string;
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
      const insertPayload: Record<string, unknown> = {
        name: data.name.trim(),
        species: data.species,
        owner_id: user.id,
        created_by_vet_id: user.id,
        pending_owner_email: data.owner_email.trim().toLowerCase(),
      };
      if (data.breed.trim()) insertPayload.breed = data.breed.trim();
      if (data.birth_date) insertPayload.birth_date = data.birth_date;
      if (data.sex) insertPayload.gender = data.sex;
      if (data.weight) insertPayload.weight = parseFloat(data.weight);
      if (data.color.trim()) insertPayload.color = data.color.trim();

      // Paw Card data for new pet
      const pawCard = generatePawCardData();
      insertPayload.holo_pattern = pawCard.holoPattern;
      insertPayload.paw_card_id = pawCard.pawCardId;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('pets') as any).insert(insertPayload);
      if (error) throw error;

      toast.success(`Paciente ${data.name} creado correctamente`);
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
            <Label htmlFor="np-breed">Raza</Label>
            <Input id="np-breed" placeholder="Ej: Labrador" {...register('breed')} />
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

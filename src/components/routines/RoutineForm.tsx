import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DaySelector } from './DaySelector';
import { categoryLucideIcon } from './RoutineCard';
import { RoutineCategory, RoutineInput, ROUTINE_CATEGORIES, Routine } from '@/hooks/useRoutines';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const schema = z.object({
  pet_id: z.string().min(1, 'Selecciona una mascota'),
  category: z.string().min(1, 'Selecciona una categoria'),
  title: z.string().min(1, 'Titulo requerido').max(100, 'Maximo 100 caracteres'),
  description: z.string().optional(),
  days_of_week: z.array(z.number()).min(1, 'Selecciona al menos un dia'),
  time_of_day: z.string().min(1, 'Hora requerida'),
  duration_minutes: z.string().optional(),
  notify_before_minutes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  paseo: 'Paseo matutino',
  comida: 'Almuerzo',
  medicacion: 'Omeprazol 10mg',
  higiene: 'Bano semanal',
  entrenamiento: 'Sesion obediencia',
  juego: 'Juego en el parque',
  suplemento: 'Vitamina E',
  otro: 'Mi rutina',
};

const DURATION_OPTIONS = [
  { value: '', label: 'Sin definir' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1.5 horas' },
  { value: '120', label: '2 horas' },
];

const NOTIFY_OPTIONS = [
  { value: '0', label: 'Sin alerta' },
  { value: '5', label: '5 min antes' },
  { value: '15', label: '15 min antes' },
  { value: '30', label: '30 min antes' },
  { value: '60', label: '1 hora antes' },
];

interface RoutineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoutineInput) => void;
  defaultPetId?: string;
  editRoutine?: Routine | null;
  isLoading?: boolean;
}

export function RoutineForm({
  open,
  onOpenChange,
  onSubmit,
  defaultPetId,
  editRoutine,
  isLoading,
}: RoutineFormProps) {
  const { user } = useAuth();

  const { data: pets = [] } = useQuery({
    queryKey: ['my-pets-select', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, photo_url')
        .eq('owner_id', user.id)
        .eq('lifecycle_status', 'active')
        .order('name');
      return data || [];
    },
    enabled: !!user && open,
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      pet_id: defaultPetId || '',
      category: '',
      title: '',
      description: '',
      days_of_week: [],
      time_of_day: '08:00',
      duration_minutes: '',
      notify_before_minutes: '15',
    },
  });

  useEffect(() => {
    if (editRoutine) {
      reset({
        pet_id: editRoutine.pet_id,
        category: editRoutine.category,
        title: editRoutine.title,
        description: editRoutine.description || '',
        days_of_week: editRoutine.days_of_week,
        time_of_day: editRoutine.time_of_day.slice(0, 5),
        duration_minutes: editRoutine.duration_minutes?.toString() || '',
        notify_before_minutes: editRoutine.notify_before_minutes.toString(),
      });
    } else {
      reset({
        pet_id: defaultPetId || '',
        category: '',
        title: '',
        description: '',
        days_of_week: [],
        time_of_day: '08:00',
        duration_minutes: '',
        notify_before_minutes: '15',
      });
    }
  }, [editRoutine, defaultPetId, open, reset]);

  const selectedCategory = watch('category');

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      pet_id: values.pet_id,
      category: values.category as RoutineCategory,
      title: values.title,
      description: values.description || undefined,
      days_of_week: values.days_of_week,
      time_of_day: values.time_of_day,
      duration_minutes: values.duration_minutes ? parseInt(values.duration_minutes) : undefined,
      notify_before_minutes: parseInt(values.notify_before_minutes || '15'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRoutine ? 'Editar rutina' : 'Nueva rutina'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Pet selector */}
          <div className="space-y-1.5">
            <Label>Mascota</Label>
            <Controller
              name="pet_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona mascota" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={pet.photo_url || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {pet.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {pet.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.pet_id && <p className="text-xs text-destructive">{errors.pet_id.message}</p>}
          </div>

          {/* Category grid */}
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-2">
                  {(
                    Object.entries(ROUTINE_CATEGORIES) as [
                      RoutineCategory,
                      typeof ROUTINE_CATEGORIES.paseo,
                    ][]
                  ).map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => field.onChange(key)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors',
                        field.value === key
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-border hover:border-purple-200'
                      )}
                    >
                      {(() => {
                        const Icon = categoryLucideIcon(key);
                        return <Icon className="h-4 w-4" />;
                      })()}
                      <span className="truncate w-full text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Titulo</Label>
            <Input
              {...register('title')}
              placeholder={CATEGORY_PLACEHOLDERS[selectedCategory] || 'Nombre de la rutina'}
              maxLength={100}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Descripcion (opcional)</Label>
            <Textarea {...register('description')} rows={2} placeholder="Notas adicionales" />
          </div>

          {/* Days of week */}
          <div className="space-y-1.5">
            <Label>Dias de la semana</Label>
            <Controller
              name="days_of_week"
              control={control}
              render={({ field }) => <DaySelector value={field.value} onChange={field.onChange} />}
            />
            {errors.days_of_week && (
              <p className="text-xs text-destructive">{errors.days_of_week.message}</p>
            )}
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hora</Label>
              <Input type="time" {...register('time_of_day')} />
              {errors.time_of_day && (
                <p className="text-xs text-destructive">{errors.time_of_day.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Duracion</Label>
              <Controller
                name="duration_minutes"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin definir" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Notification */}
          <div className="space-y-1.5">
            <Label>Notificacion</Label>
            <Controller
              name="notify_before_minutes"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Guardando...' : editRoutine ? 'Guardar cambios' : 'Crear rutina'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Reutilizamos el mapeo Lucide de RoutineCard para mantener consistencia.
// Emojis dejaron de renderizarse en UI; si routine.icon string legacy
// viene de DB, el RoutineCard lo ignora y usa este helper.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2 } from '@/lib/icons';
import { logger } from '@/lib/logger';
import {
  compressImage,
  compressedToFile,
  validateImageFile,
  IMAGE_PRESETS,
} from '@/lib/imageUtils';
import {
  HEALTH_STATUS_OPTIONS,
  ADOPTION_REASON_OPTIONS,
  PERSONALITY_OPTIONS,
} from '@/lib/petOptions';
import { SelectWithOther } from '@/components/ui/select-with-other';
import { ComboboxWithOther } from '@/components/ui/combobox-with-other';
import { BREEDS_BY_SPECIES } from '@/lib/breeds';

interface CreateAdoptionPostProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Schema de origen: bloquea adoption_posts con description pobre o sin fotos
// (eran ~60% de los warnings del audit). La validacion previa era solo
// `{ required: true }` sobre description y location — permitia "Bsjsjsbs".
const adoptionPostSchema = z.object({
  pet_name: z.string().trim().min(1, 'Nombre requerido').max(50, 'Maximo 50 caracteres'),
  species: z.string().min(1, 'Selecciona una especie'),
  breed: z.string().trim().max(80).optional().or(z.literal('')),
  age_years: z.string().optional().or(z.literal('')),
  age_months: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  size: z.string().optional().or(z.literal('')),
  description: z
    .string()
    .trim()
    .min(30, 'Describe al menos 30 caracteres: personalidad, habitos, historia')
    .max(1000, 'Maximo 1000 caracteres'),
  reason_for_adoption: z.string().optional().or(z.literal('')),
  health_status: z.string().optional().or(z.literal('')),
  good_with_kids: z.boolean().optional(),
  good_with_dogs: z.boolean().optional(),
  good_with_cats: z.boolean().optional(),
  location: z.string().trim().min(2, 'Ubicacion requerida').max(100),
});

type AdoptionPostFormData = z.infer<typeof adoptionPostSchema>;

export function CreateAdoptionPost({ open, onOpenChange, onSuccess }: CreateAdoptionPostProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [selectedTemperament, setSelectedTemperament] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdoptionPostFormData>({ resolver: zodResolver(adoptionPostSchema) });

  const species = watch('species');
  const healthStatusValue = watch('health_status') ?? '';
  const reasonValue = watch('reason_for_adoption') ?? '';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const validationError = validateImageFile(file);
        if (validationError) {
          toast.error(validationError);
          return null;
        }

        // Compress before upload
        let uploadFile: File;
        if (file.type === 'image/gif') {
          uploadFile = file;
        } else {
          const compressed = await compressImage(file, IMAGE_PRESETS.feed);
          uploadFile = compressedToFile(
            compressed,
            `adoption-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          );
        }

        const filePath = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${uploadFile.name.split('.').pop()}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('pet-photos').getPublicUrl(filePath);

        return { url: publicUrl, path: filePath };
      });

      const results = (await Promise.all(uploadPromises)).filter(Boolean) as {
        url: string;
        path: string;
      }[];
      if (results.length > 0) {
        setPhotoUrls((prev) => [...prev, ...results.map((r) => r.url)]);
        setPhotoPaths((prev) => [...prev, ...results.map((r) => r.path)]);
        toast.success('Fotos subidas exitosamente');
      }
    } catch (error) {
      logger.error('Error uploading photos:', error);
      toast.error('Error al subir las fotos');
    }
  };

  const onSubmit = async (data: AdoptionPostFormData) => {
    if (!user) return;

    // Validacion de origen: sin fotos no se publica. Antes permitia submit
    // y el post aparecia vacio en el feed.
    if (photoUrls.length === 0) {
      toast.error('Sube al menos una foto para publicar la adopcion');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: adoptionPost, error } = await supabase
        .from('adoption_posts')
        .insert({
          user_id: user.id,
          pet_name: data.pet_name,
          species: data.species,
          breed: data.breed,
          age_years: parseInt(data.age_years ?? '0') || 0,
          age_months: parseInt(data.age_months ?? '0') || 0,
          gender: data.gender,
          size: data.size,
          description: data.description,
          reason_for_adoption: data.reason_for_adoption,
          health_status: data.health_status,
          temperament: selectedTemperament,
          good_with_kids: data.good_with_kids || false,
          good_with_dogs: data.good_with_dogs || false,
          good_with_cats: data.good_with_cats || false,
          photos: photoUrls,
          location: data.location,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Award points for adoption action
      try {
        await supabase.rpc('award_points', {
          p_user_id: user.id,
          p_points: 100, // DEFAULT_POINTS_CONFIG.adoption
          p_action_type: 'adoption',
          p_action_id: adoptionPost.id,
          p_description: 'Publicación de adopción creada',
        });
      } catch (pointsError) {
        logger.error('Error awarding points:', pointsError);
        // Don't fail the adoption post creation if points fail
      }

      // Defensa en profundidad: invalidamos aqui tambien por si el caller
      // no lo hace (bug historico en Adoption.tsx donde refetch() no corria
      // si la query estaba disabled en el tab shelters).
      queryClient.invalidateQueries({ queryKey: ['adoption-posts'] });

      toast.success('Publicación creada exitosamente');
      reset();
      setPhotoUrls([]);
      setPhotoPaths([]);
      setSelectedTemperament([]);
      onSuccess();
    } catch (error) {
      if (photoPaths.length > 0) {
        await supabase.storage
          .from('pet-photos')
          .remove(photoPaths)
          .catch(() => {});
      }
      logger.error('Error creating post:', error);
      toast.error('Error al crear la publicación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] h-full sm:h-auto overflow-y-auto sm:rounded-lg rounded-none w-full sm:w-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-warm-gradient bg-clip-text text-transparent">
            Publicar Mascota en Adopción
          </DialogTitle>
          <DialogDescription>
            Completa la información de la mascota que deseas dar en adopción
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pet_name">Nombre de la Mascota *</Label>
              <Input id="pet_name" {...register('pet_name')} />
              {errors.pet_name && (
                <p className="text-sm text-destructive mt-1">{errors.pet_name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="species">Especie *</Label>
              <Select onValueChange={(value) => setValue('species', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="perro">Perro</SelectItem>
                  <SelectItem value="gato">Gato</SelectItem>
                  <SelectItem value="conejo">Conejo</SelectItem>
                  <SelectItem value="hamster">Hámster</SelectItem>
                  <SelectItem value="ave">Ave</SelectItem>
                  <SelectItem value="tortuga">Tortuga</SelectItem>
                  <SelectItem value="pez">Pez</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
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

            <div>
              <Label htmlFor="gender">Género</Label>
              <Select onValueChange={(value) => setValue('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                  <SelectItem value="desconocido">Desconocido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="age_years">Años</Label>
              <Input type="number" id="age_years" {...register('age_years')} min="0" />
            </div>

            <div>
              <Label htmlFor="age_months">Meses</Label>
              <Input type="number" id="age_months" {...register('age_months')} min="0" max="11" />
            </div>

            <div>
              <Label htmlFor="size">Tamaño</Label>
              <Select onValueChange={(value) => setValue('size', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="miniatura">Miniatura (&lt; 1 kg)</SelectItem>
                  <SelectItem value="pequeño">Pequeño</SelectItem>
                  <SelectItem value="mediano">Mediano</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                  <SelectItem value="gigante">Gigante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción * (mínimo 30 caracteres)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe a la mascota, su personalidad, hábitos, historia..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label>Motivo de adopción</Label>
            <SelectWithOther
              options={[...ADOPTION_REASON_OPTIONS]}
              value={reasonValue}
              onValueChange={(v) => setValue('reason_for_adoption', v)}
              placeholder="Selecciona motivo"
              otherPlaceholder="Describe el motivo..."
            />
          </div>

          <div>
            <Label>Estado de salud</Label>
            <SelectWithOther
              options={[...HEALTH_STATUS_OPTIONS]}
              value={healthStatusValue}
              onValueChange={(v) => setValue('health_status', v)}
              placeholder="Selecciona estado de salud"
              otherPlaceholder="Describe el estado..."
            />
          </div>

          <div className="space-y-2">
            <Label>Temperamento</Label>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS.map((trait) => (
                <Badge
                  key={trait}
                  variant={selectedTemperament.includes(trait) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80 transition-colors py-1.5 text-xs"
                  onClick={() =>
                    setSelectedTemperament((prev) =>
                      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
                    )
                  }
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Convivencia</Label>
            <div className="flex flex-wrap gap-4">
              <label htmlFor="good-with-kids" className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="good-with-kids"
                  onCheckedChange={(checked) => setValue('good_with_kids', checked === true)}
                />
                <span className="text-sm">Bueno con niños</span>
              </label>
              <label htmlFor="good-with-dogs" className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="good-with-dogs"
                  onCheckedChange={(checked) => setValue('good_with_dogs', checked === true)}
                />
                <span className="text-sm">Bueno con perros</span>
              </label>
              <label htmlFor="good-with-cats" className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="good-with-cats"
                  onCheckedChange={(checked) => setValue('good_with_cats', checked === true)}
                />
                <span className="text-sm">Bueno con gatos</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Ubicación *</Label>
            <Input id="location" {...register('location')} placeholder="Ciudad, región..." />
            {errors.location && (
              <p className="text-sm text-destructive mt-1">{errors.location.message}</p>
            )}
          </div>

          <div>
            <Label>Fotos * (al menos una)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                aria-label="Subir fotos"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para subir fotos ({photoUrls.length} subidas)
                </p>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                'Publicar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

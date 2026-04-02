import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2 } from "lucide-react";

interface CreateAdoptionPostProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAdoptionPost({ open, onOpenChange, onSuccess }: CreateAdoptionPostProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const { register, handleSubmit, watch, setValue, reset } = useForm();

  const species = watch("species");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("pet-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("pet-photos")
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setPhotoUrls((prev) => [...prev, ...urls]);
      toast.success("Fotos subidas exitosamente");
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast.error("Error al subir las fotos");
    }
  };

  const onSubmit = async (data: any) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { data: adoptionPost, error } = await supabase.from("adoption_posts").insert({
        user_id: user.id,
        pet_name: data.pet_name,
        species: data.species,
        breed: data.breed,
        age_years: parseInt(data.age_years) || 0,
        age_months: parseInt(data.age_months) || 0,
        gender: data.gender,
        size: data.size,
        description: data.description,
        reason_for_adoption: data.reason_for_adoption,
        health_status: data.health_status,
        temperament: data.temperament?.split(",").map((t: string) => t.trim()) || [],
        good_with_kids: data.good_with_kids || false,
        good_with_dogs: data.good_with_dogs || false,
        good_with_cats: data.good_with_cats || false,
        photos: photoUrls,
        location: data.location,
      }).select().maybeSingle();

      if (error) throw error;

      // Award points for adoption action
      try {
        await supabase.rpc("award_points", {
          p_user_id: user.id,
          p_points: 100, // DEFAULT_POINTS_CONFIG.adoption
          p_action_type: "adoption",
          p_action_id: adoptionPost.id,
          p_description: "Publicación de adopción creada",
        });
      } catch (pointsError) {
        console.error("Error awarding points:", pointsError);
        // Don't fail the adoption post creation if points fail
      }

      toast.success("Publicación creada exitosamente");
      reset();
      setPhotoUrls([]);
      onSuccess();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Error al crear la publicación");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Input id="pet_name" {...register("pet_name", { required: true })} />
            </div>

            <div>
              <Label htmlFor="species">Especie *</Label>
              <Select onValueChange={(value) => setValue("species", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="perro">Perro</SelectItem>
                  <SelectItem value="gato">Gato</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breed">Raza</Label>
              <Input id="breed" {...register("breed")} />
            </div>

            <div>
              <Label htmlFor="gender">Género</Label>
              <Select onValueChange={(value) => setValue("gender", value)}>
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
              <Input type="number" id="age_years" {...register("age_years")} min="0" />
            </div>

            <div>
              <Label htmlFor="age_months">Meses</Label>
              <Input type="number" id="age_months" {...register("age_months")} min="0" max="11" />
            </div>

            <div>
              <Label htmlFor="size">Tamaño</Label>
              <Select onValueChange={(value) => setValue("size", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="pequeño">Pequeño</SelectItem>
                  <SelectItem value="mediano">Mediano</SelectItem>
                  <SelectItem value="grande">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción *</Label>
            <Textarea 
              id="description" 
              {...register("description", { required: true })}
              placeholder="Describe a la mascota, su personalidad, hábitos..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="reason_for_adoption">Motivo de Adopción</Label>
            <Textarea 
              id="reason_for_adoption" 
              {...register("reason_for_adoption")}
              placeholder="¿Por qué estás dando en adopción?"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="health_status">Estado de Salud</Label>
            <Input 
              id="health_status" 
              {...register("health_status")}
              placeholder="Vacunas, esterilización, condiciones médicas..."
            />
          </div>

          <div>
            <Label htmlFor="temperament">Temperamento</Label>
            <Input 
              id="temperament" 
              {...register("temperament")}
              placeholder="Amigable, juguetón, tranquilo... (separados por comas)"
            />
          </div>

          <div className="space-y-3">
            <Label>Convivencia</Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  onCheckedChange={(checked) => setValue("good_with_kids", checked)}
                />
                <span className="text-sm">Bueno con niños</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  onCheckedChange={(checked) => setValue("good_with_dogs", checked)}
                />
                <span className="text-sm">Bueno con perros</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox 
                  onCheckedChange={(checked) => setValue("good_with_cats", checked)}
                />
                <span className="text-sm">Bueno con gatos</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Ubicación *</Label>
            <Input 
              id="location" 
              {...register("location", { required: true })}
              placeholder="Ciudad, región..."
            />
          </div>

          <div>
            <Label>Fotos</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
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
                "Publicar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PromotionFormData {
  service_type: string;
  title: string;
  description: string;
}

export const CreateServicePromotion = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<PromotionFormData>();

  const serviceType = watch('service_type');

  const onSubmit = async (data: PromotionFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Create promotion post
      const { data: promotion, error } = await supabase
        .from('service_promotions')
        .insert({
          user_id: user.id,
          service_type: data.service_type,
          title: data.title,
          description: data.description,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger AI moderation
      const { error: moderationError } = await supabase.functions.invoke('moderate-service-promotion', {
        body: { promotionId: promotion.id }
      });

      if (moderationError) {
        console.error('Error en moderación AI:', moderationError);
        toast.info('Publicación creada. Será revisada manualmente.');
      } else {
        toast.success('¡Publicación enviada para revisión!');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear la publicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Promociona tus Servicios</CardTitle>
        <CardDescription>
          Crea una publicación para promocionar tus servicios profesionales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service_type">Tipo de Servicio</Label>
            <Select onValueChange={(value) => setValue('service_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dog_walker">Paseador de Perros</SelectItem>
                <SelectItem value="dogsitter">Cuidador de Mascotas</SelectItem>
                <SelectItem value="veterinarian">Veterinario a Domicilio</SelectItem>
              </SelectContent>
            </Select>
            {errors.service_type && (
              <p className="text-sm text-red-500">Este campo es requerido</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ej: Paseador profesional con 5 años de experiencia"
              {...register('title', { required: true })}
            />
            {errors.title && (
              <p className="text-sm text-red-500">Este campo es requerido</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe tus servicios, experiencia y lo que te hace único..."
              rows={5}
              {...register('description', { required: true })}
            />
            {errors.description && (
              <p className="text-sm text-red-500">Este campo es requerido</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useGamification } from "@/hooks/useGamification";
import { DEFAULT_POINTS_CONFIG } from "@/lib/gamification";

interface CreateReviewFormProps {
  reviewType: "walk" | "dogsitter" | "vet";
  bookingId: string;
  providerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

const CreateReviewForm = ({ reviewType, bookingId, providerId, onSuccess, onCancel }: CreateReviewFormProps) => {
  const { user } = useAuth();
  const { awardPoints } = useGamification();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ReviewFormData>();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error("Máximo 3 fotos permitidas");
      return;
    }
    setPhotos([...photos, ...files.slice(0, 3 - photos.length)]);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('walk-photos')
        .upload(filePath, photo);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('walk-photos')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }

    setUploading(true);
    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos();
      }

      const tableName = reviewType === "walk" 
        ? "walk_reviews" 
        : reviewType === "dogsitter" 
        ? "dogsitter_reviews" 
        : "vet_reviews";

      const reviewData: any = {
        booking_id: bookingId,
        owner_id: user!.id,
        rating: rating,
        comment: data.comment || null,
        photos: photoUrls,
        is_verified: true
      };

      if (reviewType === "walk") {
        reviewData.walker_id = providerId;
      } else if (reviewType === "dogsitter") {
        reviewData.dogsitter_id = providerId;
      } else {
        reviewData.vet_id = providerId;
      }

      const { data: review, error } = await supabase
        // Table name is dynamic based on reviewType; cast required for Supabase typed client
        .from(tableName as "walk_reviews" | "dogsitter_reviews" | "vet_reviews")
        .insert(reviewData)
        .select()
        .maybeSingle();

      if (error) throw error;

      // Award points for writing review
      try {
        awardPoints({
          points: DEFAULT_POINTS_CONFIG.review,
          actionType: "review",
          actionId: review.id,
          description: "Reseña escrita",
        });
      } catch (pointsError) {
        console.error("Error awarding points:", pointsError);
        // Don't fail the review creation if points fail
      }

      toast.success("¡Reseña publicada exitosamente!");
      onSuccess();
    } catch (error) {
      console.error("Error creating review:", error);
      toast.error("Error al publicar la reseña");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">Calificación</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="comment">Comentario (opcional)</Label>
          <Textarea
            id="comment"
            {...register("comment")}
            placeholder="Comparte tu experiencia con otros usuarios..."
            rows={4}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="mb-2 block">Fotos (opcional, máx. 3)</Label>
          <div className="space-y-3">
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {photos.length < 3 && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Subir fotos ({photos.length}/3)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={uploading} className="flex-1">
            {uploading ? "Publicando..." : "Publicar reseña"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateReviewForm;

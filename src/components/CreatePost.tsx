import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Image, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { DEFAULT_POINTS_CONFIG } from "@/lib/gamification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreatePostProps {
  onSuccess?: () => void;
}

export function CreatePost({ onSuccess }: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { awardPoints } = useGamification();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [petId, setPetId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);

  // Load user's pets
  useEffect(() => {
    const loadPets = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("pets")
        .select("id, name, photo_url")
        .eq("owner_id", user.id);

      if (!error && data) {
        setPets(data);
      }
      setLoadingPets(false);
    };
    loadPets();
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const uploadImage = async () => {
    if (!imageFile || !user) return null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("pet-photos")
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("pet-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para publicar",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Escribe algo para publicar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const { data: post, error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        pet_id: petId || null,
      }).select().single();

      if (error) throw error;

      // Award points for creating post
      try {
        awardPoints({
          points: DEFAULT_POINTS_CONFIG.post,
          actionType: "post",
          actionId: post.id,
          description: "Post creado",
        });
      } catch (pointsError) {
        console.error("Error awarding points:", pointsError);
        // Don't fail the post creation if points fail
      }

      toast({
        title: "¡Publicado!",
        description: "Tu publicación se ha compartido con la comunidad",
      });

      setContent("");
      setPetId("");
      removeImage();
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la publicación",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Inicia sesión para crear publicaciones
        </p>
        <Button onClick={() => navigate("/auth")}>Iniciar Sesión</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="¿Qué quieres compartir?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[120px] resize-none"
      />

      {pets.length > 0 && (
        <Select value={petId} onValueChange={setPetId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una mascota (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {pets.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {imagePreview && (
        <div className="relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("post-image")?.click()}
        >
          <Image className="h-4 w-4 mr-2" />
          Agregar Foto
        </Button>
        <input
          id="post-image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="ml-auto bg-warm-gradient"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Publicar
        </Button>
      </div>
    </form>
  );
}

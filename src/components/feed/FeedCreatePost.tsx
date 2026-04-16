import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useGamification } from '@/hooks/useGamification';
import { DEFAULT_POINTS_CONFIG } from '@/lib/gamification';
import { POST_TYPES } from '@/lib/postTypes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from '@/lib/icons';
import { FeedImageUploader } from './FeedImageUploader';
import { logger } from '@/lib/logger';
import { describeSupabaseError } from '@/lib/supabaseErrors';

interface FeedCreatePostProps {
  onSuccess?: () => void;
}

export function FeedCreatePost({ onSuccess }: FeedCreatePostProps) {
  const { user } = useAuth();
  const { awardPoints } = useGamification();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<string>('foto');
  const [petId, setPetId] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pets, setPets] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('pets')
      .select('id, name')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        if (data) setPets(data);
      });
  }, [user]);

  const handleAddImages = useCallback((files: File[]) => {
    setImages((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const handleRemoveImage = useCallback(
    (index: number) => {
      URL.revokeObjectURL(previews[index]);
      setImages((prev) => prev.filter((_, i) => i !== index));
      setPreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [previews]
  );

  const uploadImage = async (file: File): Promise<{ url: string; path: string }> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('pet-photos').upload(path, file);
    if (error) throw error;

    const { data } = supabase.storage.from('pet-photos').getPublicUrl(path);
    return { url: data.publicUrl, path };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    const uploadedImagePaths: string[] = [];

    try {
      // Upload images
      let imageUrl: string | null = null;
      if (images.length > 0) {
        try {
          const total = images.length;
          const urls: string[] = [];
          for (let i = 0; i < total; i++) {
            const result = await uploadImage(images[i]);
            urls.push(result.url);
            uploadedImagePaths.push(result.path);
            setUploadProgress(Math.round(((i + 1) / total) * 100));
          }
          imageUrl = urls[0]; // Primary image
        } catch (err) {
          logger.error('[FeedCreatePost] image upload failed', err);
          if (uploadedImagePaths.length > 0) {
            await supabase.storage
              .from('pet-photos')
              .remove(uploadedImagePaths)
              .catch(() => {});
          }
          toast.error('No pudimos subir la foto', {
            description:
              describeSupabaseError(err as Parameters<typeof describeSupabaseError>[0]) ||
              'Revisa tu conexion y vuelve a intentar.',
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
          pet_id: petId || null,
          post_type: postType || null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Award points
      try {
        awardPoints({
          points: DEFAULT_POINTS_CONFIG.post,
          actionType: 'post',
          actionId: post.id,
          description: 'Post creado',
        });
      } catch {
        // Don't fail post if points fail
      }

      toast('¡Publicado!', { description: 'Tu publicación se ha compartido con la comunidad' });

      // Reset form
      setContent('');
      setPostType('foto');
      setPetId('');
      previews.forEach((p) => URL.revokeObjectURL(p));
      setImages([]);
      setPreviews([]);

      // Refresh feed — await to ensure data is fresh before closing dialog
      await queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      await queryClient.refetchQueries({ queryKey: ['feed-posts'] });
      onSuccess?.();
    } catch (err) {
      if (uploadedImagePaths.length > 0) {
        await supabase.storage
          .from('pet-photos')
          .remove(uploadedImagePaths)
          .catch(() => {});
      }
      logger.error('[FeedCreatePost] submit failed', err);
      toast.error('No pudimos guardar tu publicación', {
        description:
          describeSupabaseError(err as Parameters<typeof describeSupabaseError>[0]) ||
          'Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!user) return null;

  const placeholder =
    postType === 'pregunta'
      ? '¿Que quieres preguntar a la comunidad?'
      : postType === 'consejo'
        ? 'Comparte tu consejo o tip...'
        : postType === 'perdido'
          ? 'Describe a la mascota perdida o encontrada...'
          : '¿Que quieres compartir sobre tu mascota?';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Post type selector as chips */}
      <div className="flex flex-wrap gap-2">
        {POST_TYPES.map((pt) => (
          <Badge
            key={pt.value}
            variant={postType === pt.value ? 'default' : 'outline'}
            className="cursor-pointer text-xs px-3 py-1.5 transition-all"
            onClick={() => setPostType(pt.value)}
          >
            {pt.emoji} {pt.label}
          </Badge>
        ))}
      </div>

      {/* Image uploader */}
      <FeedImageUploader
        images={images}
        previews={previews}
        onAdd={handleAddImages}
        onRemove={handleRemoveImage}
        disabled={isSubmitting}
      />

      {/* Upload progress */}
      {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Text content */}
      <Textarea
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base px-0"
        disabled={isSubmitting}
      />

      {/* Pet selector */}
      {pets.length > 0 && (
        <Select value={petId} onValueChange={setPetId}>
          <SelectTrigger className="w-full">
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

      {/* Submit */}
      <div className="flex justify-end pt-2 border-t">
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="bg-warm-gradient px-6"
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
  );
}

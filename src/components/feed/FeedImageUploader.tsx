import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Loader2 } from '@/lib/icons';
import { toast } from 'sonner';
import {
  compressImage,
  compressedToFile,
  validateImageFile,
  IMAGE_PRESETS,
} from '@/lib/imageUtils';

interface FeedImageUploaderProps {
  images: File[];
  previews: string[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function FeedImageUploader({
  images,
  previews,
  onAdd,
  onRemove,
  maxImages = 10,
  disabled,
}: FeedImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const remaining = maxImages - images.length;
    const filesToProcess: File[] = [];

    for (let i = 0; i < Math.min(fileList.length, remaining); i++) {
      const file = fileList[i];
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      filesToProcess.push(file);
    }

    if (filesToProcess.length > 0) {
      setCompressing(true);
      try {
        const compressed = await Promise.all(
          filesToProcess.map(async (file) => {
            // GIFs skip compression to preserve animation
            if (file.type === 'image/gif') return file;
            const result = await compressImage(file, IMAGE_PRESETS.feed);
            return compressedToFile(
              result,
              `feed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            );
          })
        );
        onAdd(compressed);
      } catch (err: unknown) {
        toast.error((err as Error)?.message || 'Error al comprimir imagenes');
      } finally {
        setCompressing(false);
      }
    }

    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((preview, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
              <img
                src={preview}
                alt={`Preview ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                disabled={disabled}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {i === 0 && previews.length > 1 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                  Portada
                </span>
              )}
            </div>
          ))}

          {/* Add more button */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary/50 transition-colors"
            >
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Initial upload button */}
      {previews.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors bg-muted/30"
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sube hasta {maxImages} fotos</span>
        </button>
      )}

      <label htmlFor="feed-image-upload" className="sr-only">
        Subir imagenes
      </label>
      <input
        id="feed-image-upload"
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        aria-label="Subir imagen al feed"
        className="hidden"
        onChange={handleFiles}
        disabled={disabled}
      />
    </div>
  );
}

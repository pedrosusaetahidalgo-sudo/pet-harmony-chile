import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Upload, Camera } from '@/lib/icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toTitleCase } from '@/lib/format';
import { logger } from '@/lib/logger';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import {
  compressImage,
  compressedToFile,
  validateImageFile,
  IMAGE_PRESETS,
  MIN_DIMENSIONS,
} from '@/lib/imageUtils';

interface EditProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    display_name?: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
  } | null;
  onSaved: () => void;
}

const avatarSeeds = [
  'Luna',
  'Rocky',
  'Simba',
  'Nala',
  'Max',
  'Miso',
  'Buddy',
  'Pelusa',
  'Canela',
  'Toby',
  'Coco',
  'Thor',
  'Kira',
  'Zeus',
  'Lola',
  'Bruno',
  'Miel',
  'Otto',
  'Indie',
  'Chloe',
];

const avatarColors = [
  { bg: 'ffc2a1', shape: 'f28c6e', label: 'Coral' },
  { bg: 'c4b5fd', shape: '8b5cf6', label: 'Lavanda' },
  { bg: 'a7f3d0', shape: '34d399', label: 'Menta' },
  { bg: 'bfdbfe', shape: '60a5fa', label: 'Celeste' },
  { bg: 'fde68a', shape: 'f59e0b', label: 'Durazno' },
  { bg: 'fecdd3', shape: 'fb7185', label: 'Rosa' },
];

type TabValue = 'avatar' | 'photo';

export function EditProfileDrawer({
  open,
  onOpenChange,
  profile,
  onSaved,
}: EditProfileDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('avatar');

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [open, profile]);

  // DiceBear adventurer-neutral style (replaces thumbs)
  const avatarOptions = avatarSeeds.map(
    (seed) =>
      `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}&backgroundColor=${avatarColors[selectedColor].bg}&shapeColor=${avatarColors[selectedColor].shape}`
  );

  // --- Photo upload flow ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    const error = validateImageFile(file, 5 * 1024 * 1024);
    if (error) {
      toast({ title: error, variant: 'destructive' });
      return;
    }

    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setShowCrop(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    setUploadingPhoto(true);
    try {
      // Compress the cropped blob
      const croppedFile = new File([croppedBlob], 'avatar-crop.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(croppedFile, IMAGE_PRESETS.avatar);
      const finalFile = compressedToFile(compressed, `avatar-${Date.now()}`);

      const path = `${user.id}/avatar-${Date.now()}.${compressed.format === 'webp' ? 'webp' : 'jpg'}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, finalFile, { upsert: true, cacheControl: '3600' });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      toast({ title: 'Foto subida' });
    } catch (err) {
      logger.error('Avatar upload failed', err);
      toast({ title: 'No se pudo subir la foto', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!avatarUrl) {
      toast({
        title: 'Selecciona un avatar o sube una foto antes de guardar',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: toTitleCase(displayName),
      bio,
      location,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      logger.error('Error saving profile:', error);
      toast({
        title: 'Algo salio mal',
        description: 'No se pudo guardar el perfil. Intenta de nuevo.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Perfil guardado',
        description: 'Tus cambios se han guardado correctamente.',
      });
      onSaved();
      onOpenChange(false);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar mi perfil</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Current avatar preview */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl ? <AvatarImage key={avatarUrl} src={avatarUrl} alt="Avatar" /> : null}
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{displayName || 'Sin nombre'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* Tab switcher */}
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  activeTab === 'avatar'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Elige un avatar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('photo')}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  activeTab === 'photo'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sube tu foto
              </button>
            </div>

            {/* Tab: Generated avatars */}
            {activeTab === 'avatar' && (
              <>
                {/* Color picker */}
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Color de fondo
                  </Label>
                  <div className="flex gap-2 mt-2">
                    {avatarColors.map((color, i) => (
                      <button
                        key={color.label}
                        type="button"
                        onClick={() => setSelectedColor(i)}
                        className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                          selectedColor === i
                            ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                            : ''
                        }`}
                        style={{
                          backgroundColor: `#${color.bg}`,
                          border: `2px solid #${color.shape}`,
                        }}
                        title={color.label}
                        aria-label={`Color ${color.label}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Avatar picker */}
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Estilo
                  </Label>
                  <div className="grid grid-cols-5 gap-3 mt-2">
                    {avatarOptions.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                          avatarUrl === url
                            ? 'border-primary ring-2 ring-primary/30 scale-110'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Avatar ${avatarSeeds[i]}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tab: Photo upload */}
            {activeTab === 'photo' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 p-8 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  ) : (
                    <Camera className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium">Seleccionar foto</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG o WebP &middot; min 200x200 px &middot; max 5 MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                  aria-label="Seleccionar foto de perfil"
                />
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Nombre para mostrar</Label>
              <Input
                id="editDisplayName"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editBio">Bio</Label>
              <Textarea
                id="editBio"
                placeholder="Cuentanos sobre ti y tus mascotas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLocation">Ubicacion</Label>
              <Input
                id="editLocation"
                placeholder="Ej: Santiago, Chile"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} disabled={saving || uploadingPhoto} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar perfil'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Crop dialog */}
      {cropSrc && (
        <ImageCropDialog
          open={showCrop}
          onOpenChange={(v) => {
            setShowCrop(v);
            if (!v && cropSrc) {
              URL.revokeObjectURL(cropSrc);
              setCropSrc(null);
            }
          }}
          imageSrc={cropSrc}
          aspect={1}
          cropShape="round"
          title="Ajusta tu foto de perfil"
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}

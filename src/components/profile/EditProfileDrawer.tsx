import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2 } from '@/lib/icons';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toTitleCase } from '@/lib/format';
import { logger } from '@/lib/logger';

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
];
const avatarColors = [
  { bg: 'e8dbf5', shape: '7c3aed', label: 'Morado' },
  { bg: 'dbeafe', shape: '2563eb', label: 'Azul' },
  { bg: 'd1fae5', shape: '059669', label: 'Verde' },
  { bg: 'fce7f3', shape: 'db2777', label: 'Rosa' },
  { bg: 'ffedd5', shape: 'ea580c', label: 'Naranja' },
  { bg: 'fef3c7', shape: 'd97706', label: 'Amarillo' },
];

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

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [open, profile]);

  const avatarOptions = avatarSeeds.map(
    (seed) =>
      `https://api.dicebear.com/9.x/thumbs/svg?seed=${seed}&backgroundColor=${avatarColors[selectedColor].bg}&shapeColor=${avatarColors[selectedColor].shape}`
  );

  const handleSave = async () => {
    if (!user) return;
    if (!avatarUrl) {
      toast({ title: 'Selecciona un avatar antes de guardar', variant: 'destructive' });
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
        title: 'Algo salió mal',
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

          {/* Color picker */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              1. Elige un color de fondo
            </Label>
            <div className="flex gap-2 mt-2">
              {avatarColors.map((color, i) => (
                <button
                  key={color.label}
                  type="button"
                  onClick={() => setSelectedColor(i)}
                  className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                    selectedColor === i ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
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
              2. Elige un estilo
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
                  <img src={url} alt={`Avatar ${i + 1}`} loading="lazy" className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>

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
              placeholder="Cuéntanos sobre ti y tus mascotas..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editLocation">Ubicación</Label>
            <Input
              id="editLocation"
              placeholder="Ej: Santiago, Chile"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
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
  );
}

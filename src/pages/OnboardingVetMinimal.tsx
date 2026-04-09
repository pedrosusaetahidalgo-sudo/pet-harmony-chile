import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SANTIAGO_COMUNAS, VET_SPECIALTIES } from '@/lib/vetDirectory';
import { errorMessage } from '@/types/vetDirectory';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function OnboardingVetMinimal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [commune, setCommune] = useState('');
  const [communeOpen, setCommuneOpen] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = displayName.trim().length > 2;

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión primero.');
      return;
    }
    setSubmitting(true);
    try {
      let avatarUrl: string | null = null;

      // Upload photo if provided
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `providers/${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const payload = {
        user_id: user.id,
        display_name: displayName.trim(),
        commune: commune || null,
        specialties: specialties.length > 0 ? specialties : null,
        avatar_url: avatarUrl,
        provider_type: 'individual' as const,
        provider_plan: 'provider_free',
        is_directory_visible: false,
        status: 'pending',
      };

      const { error: insertErr } = await supabase
        .from('service_providers')
        .insert(payload);
      if (insertErr) throw insertErr;

      toast.info('Tu perfil está al 40%. Completar para aparecer en el directorio.', {
        duration: 6000,
      });
      navigate('/provider/dashboard');
    } catch (err: unknown) {
      toast.error(errorMessage(err, 'Error al crear tu perfil'));
    } finally {
      setSubmitting(false);
    }
  };

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">Crea tu perfil veterinario</h1>
            <p className="text-sm text-muted-foreground">
              Solo necesitamos lo básico. Puedes completar el resto después.
            </p>
          </div>

          {/* Photo */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
            >
              <Avatar className="h-20 w-20 border-2 border-purple-200">
                {photoPreview ? (
                  <AvatarImage src={photoPreview} alt="Foto de perfil" />
                ) : null}
                <AvatarFallback className="bg-purple-100 text-purple-700 text-lg font-semibold">
                  {initials || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="vet-name">Nombre *</Label>
            <Input
              id="vet-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dr. Juan Pérez"
            />
          </div>

          {/* Commune autocomplete */}
          <div>
            <Label>Comuna principal</Label>
            <Popover open={communeOpen} onOpenChange={setCommuneOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={communeOpen}
                  className="w-full justify-between font-normal"
                >
                  {commune || 'Selecciona tu comuna'}
                  <Check
                    className={`ml-2 h-4 w-4 shrink-0 ${commune ? 'opacity-100' : 'opacity-0'}`}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar comuna..." />
                  <CommandList>
                    <CommandEmpty>Sin resultados.</CommandEmpty>
                    <CommandGroup>
                      {SANTIAGO_COMUNAS.map((c) => (
                        <CommandItem
                          key={c}
                          value={c}
                          onSelect={() => {
                            setCommune(c);
                            setCommuneOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${commune === c ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {c}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Specialties multi-select */}
          <div>
            <Label className="mb-2 block">Especialidades</Label>
            <div className="flex flex-wrap gap-2">
              {VET_SPECIALTIES.map((s) => {
                const active = specialties.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      active
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-foreground border-slate-300 hover:border-purple-400'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            size="lg"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando perfil...
              </>
            ) : (
              'Crear perfil'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
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
import { Megaphone, Loader2, CheckCircle } from '@/lib/icons';
import { useApplyAsPawVoice, type PawVoicePlatform } from '@/hooks/usePawVoices';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function PawVoiceApplyForm() {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<PawVoicePlatform>('instagram');
  const [profileUrl, setProfileUrl] = useState('');
  const [bio, setBio] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [followers, setFollowers] = useState<string>('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const apply = useApplyAsPawVoice();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim()) {
      toast.error('Nombre y correo de contacto son obligatorios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error('Correo inválido');
      return;
    }

    const slugBase = slugify(handle || name);
    if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slugBase)) {
      toast.error('Nombre o handle inválido', {
        description: 'Usa letras, números y espacios normales.',
      });
      return;
    }

    try {
      await apply.mutateAsync({
        name: name.trim(),
        slug: slugBase,
        handle: handle.trim() || null,
        platform,
        profile_url: profileUrl.trim() || null,
        bio: bio.trim() || null,
        speciality: speciality.trim() || null,
        followers_estimated: followers ? Number(followers) : null,
        contact_email: contactEmail.trim(),
      });
      setSubmitted(true);
      toast.success('¡Gracias por aplicar!', {
        description: 'Te respondemos en 48 horas a tu correo.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.includes('slug')) {
        toast.error('Ya existe un Paw Voice con ese nombre', {
          description: 'Intenta con un handle distinto.',
        });
      } else {
        toast.error('No pudimos enviar tu aplicación', { description: msg });
      }
    }
  }

  if (submitted) {
    return (
      <Card className="border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20">
        <CardContent className="p-6 text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-white" />
          </div>
          <h3 className="font-bold text-lg">¡Gracias por sumarte! 💛</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Recibimos tu aplicación. Te respondemos en las próximas 48 horas con el kit de
            bienvenida (gráficas + reel + link personalizado).
          </p>
          <p className="text-[11px] text-muted-foreground italic">
            Si tienes urgencia, escríbenos directo a{' '}
            <a
              href="mailto:pedrosusaeta@pawfriend.cl?subject=Aplicación%20Paw%20Voice"
              className="underline"
            >
              pedrosusaeta@pawfriend.cl
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      id="aplicar"
      className="border-violet-200/70 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/20"
    >
      <CardContent className="p-5 space-y-4">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-violet-600" />
            <h2 className="font-semibold text-lg">Quiero ser Paw Voice</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Cuéntanos quién eres y te respondemos en 48 horas con el kit de bienvenida.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pv-name" className="text-xs">
                Nombre o alias <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pv-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 80))}
                placeholder="Ej: Sofía y Kai"
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pv-email" className="text-xs">
                Correo de contacto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pv-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pv-platform" className="text-xs">
                Plataforma principal
              </Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as PawVoicePlatform)}>
                <SelectTrigger id="pv-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="twitter">X / Twitter</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pv-handle" className="text-xs">
                Usuario en la plataforma
              </Label>
              <Input
                id="pv-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.slice(0, 64))}
                placeholder="@tuusername"
                maxLength={64}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pv-url" className="text-xs">
              Link a tu perfil
            </Label>
            <Input
              id="pv-url"
              type="url"
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
              placeholder="https://instagram.com/tuusername"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pv-followers" className="text-xs">
                Seguidores aproximados
              </Label>
              <Input
                id="pv-followers"
                type="number"
                min={0}
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                placeholder="Ej: 2500"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pv-speciality" className="text-xs">
                Tu foco peludo
              </Label>
              <Input
                id="pv-speciality"
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value.slice(0, 80))}
                placeholder="Ej: Perros rescatados"
                maxLength={80}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pv-bio" className="text-xs">
              ¿Por qué te gustaría sumarte? (opcional)
            </Label>
            <Textarea
              id="pv-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 400))}
              rows={3}
              maxLength={400}
              placeholder="Cuéntanos brevemente qué te mueve a apoyar Paw Friend..."
            />
            <p className="text-[10px] text-muted-foreground text-right">{bio.length}/400</p>
          </div>

          <Button
            type="submit"
            disabled={apply.isPending || !name.trim() || !contactEmail.trim()}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90"
          >
            {apply.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Megaphone className="h-4 w-4 mr-2" />
            )}
            Enviar aplicación
          </Button>

          <p className="text-[11px] text-center text-muted-foreground italic pt-1">
            Sin letra chica. Si no encajamos ahora, quedas en nuestra lista para próximas campañas.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

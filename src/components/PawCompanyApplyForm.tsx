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
import { Building2, Loader2, CheckCircle } from '@/lib/icons';
import { useApplyAsPawCompany, type PawCompanyTier } from '@/hooks/usePawCompanys';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function PawCompanyApplyForm() {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState<PawCompanyTier>('bronze');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const apply = useApplyAsPawCompany();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim()) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error('Correo inválido');
      return;
    }
    const slugBase = slugify(name);
    if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(slugBase)) {
      toast.error('Nombre de empresa inválido', {
        description: 'Usa letras, números y espacios normales.',
      });
      return;
    }

    try {
      await apply.mutateAsync({
        name: name.trim(),
        slug: slugBase,
        logo_url: logoUrl.trim() || null,
        website: website.trim() || null,
        description: description.trim() || null,
        tier,
        contact_email: contactEmail.trim(),
      });
      setSubmitted(true);
      toast.success('¡Gracias por sumar tu empresa!', {
        description: 'Te respondemos en 48 horas.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      if (msg.toLowerCase().includes('duplicate') || msg.includes('slug')) {
        toast.error('Ya existe una Paw Company con ese nombre', {
          description: 'Si es tu empresa, escríbenos a pedrosusaeta@pawfriend.cl.',
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
          <h3 className="font-bold text-lg">¡Gracias por sumar tu empresa! 💛</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Recibimos tu aplicación. Te respondemos en las próximas 48 horas con los detalles del
            convenio y el kit de bienvenida (logos, badges, plantillas).
          </p>
          <p className="text-[11px] text-muted-foreground italic">
            Si tienes urgencia, escríbenos directo a{' '}
            <a href="mailto:pedrosusaeta@pawfriend.cl?subject=Paw%20Company" className="underline">
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
      className="border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-rose-50/50 dark:from-amber-950/30 dark:to-rose-950/20"
    >
      <CardContent className="p-5 space-y-4">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-lg">Quiero que mi empresa sea Paw Company</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Cuéntanos sobre tu empresa y te respondemos en 48 horas con los detalles del convenio.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pc-name" className="text-xs">
                Nombre de la empresa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pc-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 80))}
                placeholder="Ej: Pet Shop Ñuñoa"
                maxLength={80}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pc-email" className="text-xs">
                Correo de contacto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pc-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contacto@empresa.cl"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pc-website" className="text-xs">
              Sitio web
            </Label>
            <Input
              id="pc-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://tuempresa.cl"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pc-logo" className="text-xs">
              Logo URL
            </Label>
            <Input
              id="pc-logo"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://... (PNG/JPG/SVG)"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pc-tier" className="text-xs">
              Nivel de alianza propuesto
            </Label>
            <Select value={tier} onValueChange={(v) => setTier(v as PawCompanyTier)}>
              <SelectTrigger id="pc-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">Bronze — $49.9k+/mes</SelectItem>
                <SelectItem value="silver">Silver — $99.9k+/mes</SelectItem>
                <SelectItem value="gold">Gold — $199.9k+/mes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Es una propuesta inicial, conversamos el monto en la llamada.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pc-desc" className="text-xs">
              ¿Qué hace tu empresa? (máx 280)
            </Label>
            <Textarea
              id="pc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 280))}
              rows={3}
              maxLength={280}
              placeholder="Ej: Pet shop local con productos naturales para perros y gatos..."
            />
            <p className="text-[10px] text-muted-foreground text-right">{description.length}/280</p>
          </div>

          <Button
            type="submit"
            disabled={apply.isPending || !name.trim() || !contactEmail.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90"
          >
            {apply.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 mr-2" />
            )}
            Enviar aplicación
          </Button>

          <p className="text-[11px] text-center text-muted-foreground italic pt-1">
            Sin letra chica. La alianza la armamos juntos, sin contratos blindados.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

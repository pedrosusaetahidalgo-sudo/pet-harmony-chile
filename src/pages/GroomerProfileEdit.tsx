import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, Scissors } from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyGroomerProfile,
  useUpsertGroomerProfile,
  GROOMER_SERVICES,
  type GroomerProfileForm,
} from '@/hooks/useGroomerProfile';
import { SANTIAGO_COMUNAS } from '@/lib/vetDirectory';
import { LINKS } from '@/lib/links';

const EMPTY: GroomerProfileForm = {
  business_name: '',
  bio: '',
  experience_years: null,
  base_price_clp: null,
  services_offered: [],
  accepts_cats: true,
  accepts_dogs: true,
  accepts_long_hair: true,
  mobile_service: false,
  commune: null,
  service_areas: [],
};

export default function GroomerProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyGroomerProfile();
  const upsert = useUpsertGroomerProfile();
  const [form, setForm] = useState<GroomerProfileForm>(EMPTY);

  useEffect(() => {
    if (!profile) return;
    setForm({
      business_name: profile.business_name ?? '',
      bio: profile.bio ?? '',
      experience_years: profile.experience_years,
      base_price_clp: profile.base_price_clp,
      services_offered: profile.services_offered ?? [],
      accepts_cats: profile.accepts_cats ?? true,
      accepts_dogs: profile.accepts_dogs ?? true,
      accepts_long_hair: profile.accepts_long_hair ?? true,
      mobile_service: profile.mobile_service ?? false,
      commune: profile.commune,
      service_areas: profile.service_areas ?? [],
    });
  }, [profile]);

  if (!user) {
    return (
      <div className="container max-w-md mx-auto p-6 text-center">
        <p className="mb-4">Debes iniciar sesión para crear tu perfil de peluquero.</p>
        <Button onClick={() => navigate(LINKS.authReturn('/peluquero/perfil'))}>
          Iniciar sesión
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const update = <K extends keyof GroomerProfileForm>(k: K, v: GroomerProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleService = (service: string) => {
    setForm((f) => ({
      ...f,
      services_offered: f.services_offered.includes(service)
        ? f.services_offered.filter((s) => s !== service)
        : [...f.services_offered, service],
    }));
  };

  const toggleArea = (area: string) => {
    setForm((f) => ({
      ...f,
      service_areas: f.service_areas.includes(area)
        ? f.service_areas.filter((a) => a !== area)
        : [...f.service_areas, area],
    }));
  };

  const handleSave = async () => {
    if (!form.business_name.trim()) {
      toast.error('El nombre del negocio es obligatorio');
      return;
    }
    if (form.services_offered.length === 0) {
      toast.error('Selecciona al menos un servicio');
      return;
    }
    try {
      await upsert.mutateAsync(form);
      toast.success('Perfil guardado. Será revisado por nuestro equipo antes de publicarse.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mi perfil de peluquero"
        subtitle="Completa tu información para aparecer en el directorio."
        onBack={() => navigate('/provider/dashboard')}
      />
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
      <div>
        {profile?.status === 'pending' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            Tu perfil está pendiente de aprobación por el equipo de Paw Friend.
          </div>
        )}
        {profile?.status === 'rejected' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            Tu perfil fue rechazado. Edítalo y guárdalo nuevamente para volver a postular.
          </div>
        )}
        {profile?.status === 'approved' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            ✓ Tu perfil está aprobado y visible en el directorio.
          </div>
        )}
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Información del negocio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del negocio *</Label>
            <Input
              id="name"
              value={form.business_name}
              onChange={(e) => update('business_name', e.target.value)}
              placeholder="Peluquería Canina Las Patitas"
            />
          </div>

          <div>
            <Label htmlFor="bio">Descripción</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="Cuéntanos tu experiencia, estilo y qué te diferencia…"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/500</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="years">Años de experiencia</Label>
              <Input
                id="years"
                type="number"
                min={0}
                value={form.experience_years ?? ''}
                onChange={(e) =>
                  update('experience_years', e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
            <div>
              <Label htmlFor="price">Precio desde (CLP)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.base_price_clp ?? ''}
                onChange={(e) =>
                  update('base_price_clp', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="15000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Servicios que ofreces</CardTitle>
          <CardDescription>Selecciona al menos uno.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {GROOMER_SERVICES.map((s) => {
              const active = form.services_offered.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    active
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-white text-foreground border-slate-300 hover:border-pink-400'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tipo de mascota */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. ¿Qué mascotas atiendes?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="dogs">Perros</Label>
            <Switch
              id="dogs"
              checked={form.accepts_dogs}
              onCheckedChange={(v) => update('accepts_dogs', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cats">Gatos</Label>
            <Switch
              id="cats"
              checked={form.accepts_cats}
              onCheckedChange={(v) => update('accepts_cats', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="long">Pelo largo / razas con mucho pelaje</Label>
            <Switch
              id="long"
              checked={form.accepts_long_hair}
              onCheckedChange={(v) => update('accepts_long_hair', v)}
            />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <Label htmlFor="mobile">Servicio a domicilio</Label>
            <Switch
              id="mobile"
              checked={form.mobile_service}
              onCheckedChange={(v) => update('mobile_service', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Zona de atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="commune">Comuna base</Label>
            <Select value={form.commune ?? ''} onValueChange={(v) => update('commune', v || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Elige tu comuna principal" />
              </SelectTrigger>
              <SelectContent>
                {SANTIAGO_COMUNAS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.mobile_service && (
            <div>
              <Label className="mb-2 block">Comunas que atiendes a domicilio</Label>
              <div className="flex flex-wrap gap-2">
                {SANTIAGO_COMUNAS.map((c) => {
                  const active = form.service_areas.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArea(c)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        active
                          ? 'bg-pink-600 text-white border-pink-600'
                          : 'bg-white text-foreground border-slate-300 hover:border-pink-400'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="sticky bottom-4 z-10">
        <Card className="shadow-lg border-pink-200">
          <CardContent className="py-3 flex items-center justify-end gap-3">
            <Button
              onClick={handleSave}
              disabled={upsert.isPending}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {upsert.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Guardar perfil
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

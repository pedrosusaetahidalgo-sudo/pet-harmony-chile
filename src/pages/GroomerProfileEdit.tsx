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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GROOMER_SERVICES } from '@/hooks/useGroomerProfile';
import { SANTIAGO_COMUNAS } from '@/lib/vetDirectory';
import { LINKS } from '@/lib/links';

interface GroomerForm {
  business_name: string;
  bio: string;
  experience_years: number | null;
  base_price_clp: number | null;
  services_offered: string[];
  accepts_cats: boolean;
  accepts_dogs: boolean;
  accepts_long_hair: boolean;
  mobile_service: boolean;
  commune: string | null;
  service_areas: string[];
}

const EMPTY: GroomerForm = {
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
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GroomerForm>(EMPTY);

  // Query groomer data from unified service_providers table
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-groomer-sp', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user!.id)
        .eq('primary_service_type', 'grooming')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (formData: GroomerForm) => {
      if (!user) throw new Error('No autenticado');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        user_id: user.id,
        display_name: formData.business_name.trim() || null,
        business_name: formData.business_name.trim() || null,
        bio: formData.bio.trim() || null,
        experience_years: formData.experience_years,
        base_price_clp: formData.base_price_clp,
        price_from: formData.base_price_clp,
        services_offered: formData.services_offered,
        accepts_cats: formData.accepts_cats,
        accepts_dogs: formData.accepts_dogs,
        accepts_long_hair: formData.accepts_long_hair,
        mobile_service: formData.mobile_service,
        commune: formData.commune,
        service_areas: formData.service_areas,
        primary_service_type: 'grooming',
      };

      if (profile?.id) {
        // Update existing
        const { error } = await supabase
          .from('service_providers')
          .update(payload)
          .eq('id', profile.id);
        if (error) throw error;
      } else {
        // Create new
        payload.provider_plan = 'provider_free';
        payload.is_directory_visible = false;
        payload.status = 'pending';
        const { data: newProvider, error } = await supabase
          .from('service_providers')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;

        // Auto-crear provider_service_offerings
        if (newProvider?.id) {
          await supabase.from('provider_service_offerings').upsert(
            {
              provider_id: newProvider.id,
              service_type: 'grooming',
              price_base: formData.base_price_clp || 0,
              price_unit: 'session',
              is_active: true,
            },
            { onConflict: 'provider_id,service_type' }
          );
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-groomer-sp'] });
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
      toast.success('Perfil guardado. Será revisado por nuestro equipo antes de publicarse.');
    },
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      business_name: profile.business_name ?? profile.display_name ?? '',
      bio: profile.bio ?? '',
      experience_years: profile.experience_years,
      base_price_clp: profile.base_price_clp ?? profile.price_from,
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

  const update = <K extends keyof GroomerForm>(k: K, v: GroomerForm[K]) =>
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
      await upsertMutation.mutateAsync(form);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const status = profile?.status;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mi perfil de peluquero"
        subtitle="Completa tu información para aparecer en el directorio."
        onBack={() => navigate('/provider/dashboard')}
      />
      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <div>
          {status === 'pending' && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              Tu perfil está pendiente de aprobación por el equipo de Paw Friend.
            </div>
          )}
          {status === 'rejected' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              Tu perfil fue rechazado. Edítalo y guárdalo nuevamente para volver a postular.
            </div>
          )}
          {status === 'approved' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              Tu perfil está aprobado y visible en el directorio.
            </div>
          )}
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Zona de atención</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commune">Comuna base</Label>
              <Select
                value={form.commune ?? ''}
                onValueChange={(v) => update('commune', v || null)}
              >
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

        <div className="sticky bottom-4 z-10">
          <Card className="shadow-lg border-pink-200">
            <CardContent className="py-3 flex items-center justify-end gap-3">
              <Button
                onClick={handleSave}
                disabled={upsertMutation.isPending}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {upsertMutation.isPending ? (
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

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ExternalLink, Loader2, Save, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  useMyProvider,
  useUpsertProviderProfile,
  uploadProviderAvatar,
  calculateProfileCompleteness,
  REQUIRED_FOR_DIRECTORY_SCORE,
  type ProviderProfileForm,
} from '@/hooks/useProviderProfile';
import { useAuth } from '@/hooks/useAuth';
import { SANTIAGO_COMUNAS, VET_SPECIALTIES } from '@/lib/vetDirectory';

const EMPTY: ProviderProfileForm = {
  display_name: '',
  bio: '',
  provider_type: 'individual',
  specialties: [],
  service_areas: [],
  commune: null,
  license_number: '',
  experience_years: null,
  price_from: null,
  avatar_url: null,
  public_email: null,
  public_phone: null,
  is_directory_visible: false,
};

export default function ProviderProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: provider, isLoading } = useMyProvider();
  const upsert = useUpsertProviderProfile();

  const [form, setForm] = useState<ProviderProfileForm>(EMPTY);
  const [uploading, setUploading] = useState(false);

  // Hidratar form cuando carga el provider
  useEffect(() => {
    if (!provider) return;
    setForm({
      display_name: provider.display_name ?? '',
      bio: provider.bio ?? '',
      provider_type: (provider.provider_type as ProviderProfileForm['provider_type']) ?? 'individual',
      specialties: provider.specialties ?? [],
      service_areas: provider.service_areas ?? [],
      commune: provider.commune ?? null,
      license_number: provider.license_number ?? '',
      experience_years: provider.experience_years ?? null,
      price_from: provider.price_from ?? null,
      avatar_url: provider.avatar_url ?? null,
      public_email: provider.public_email ?? null,
      public_phone: provider.public_phone ?? null,
      is_directory_visible: provider.is_directory_visible ?? false,
    });
  }, [provider]);

  const { score, missing } = useMemo(() => calculateProfileCompleteness(form), [form]);
  const canBeVisible = score >= REQUIRED_FOR_DIRECTORY_SCORE;

  const update = <K extends keyof ProviderProfileForm>(k: K, v: ProviderProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleInArray = (key: 'specialties' | 'service_areas', value: string) => {
    setForm((f) => {
      const current = f[key];
      const next = current.includes(value)
        ? current.filter((x) => x !== value)
        : [...current, value];
      return { ...f, [key]: next };
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5 MB');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadProviderAvatar(user.id, file);
      update('avatar_url', url);
      toast.success('Foto subida');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo subir la foto. Verificá que el bucket "avatars" exista en Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.display_name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    if (form.is_directory_visible && !canBeVisible) {
      toast.error(`Necesitás al menos ${REQUIRED_FOR_DIRECTORY_SCORE}% de perfil completo para aparecer en el directorio`);
      return;
    }
    try {
      await upsert.mutateAsync(form);
      toast.success('Perfil guardado');
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((err as any)?.message ?? 'Error al guardar');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/provider/dashboard')} className="mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <h1 className="text-2xl font-bold">Mi perfil profesional</h1>
          <p className="text-muted-foreground text-sm">
            Completá tu información para aparecer en el directorio público.
          </p>
        </div>
        {provider?.slug && (
          <Link to={`/veterinarios/${provider.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" /> Ver perfil público
            </Button>
          </Link>
        )}
      </div>

      {/* Completeness */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Completitud del perfil</CardTitle>
            <span className="text-2xl font-bold text-purple-700">{score}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={score} className="mb-3" />
          {missing.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              <strong>Te falta:</strong> {missing.join(' · ')}
            </p>
          ) : (
            <p className="text-xs text-green-700">¡Perfil completo!</p>
          )}
          {!canBeVisible && (
            <Alert className="mt-3">
              <AlertTitle className="text-sm">Necesitás {REQUIRED_FOR_DIRECTORY_SCORE}% para aparecer en el directorio</AlertTitle>
              <AlertDescription className="text-xs">
                Completá los campos faltantes y luego activá "Aparecer en el directorio público".
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 1. Información profesional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Información profesional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-purple-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
                  <Stethoscope className="h-10 w-10 text-purple-400" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="inline-flex items-center gap-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-md text-sm">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {form.avatar_url ? 'Cambiar foto' : 'Subir foto'}
                </div>
              </Label>
              <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              <p className="text-xs text-muted-foreground mt-1">JPG o PNG · máx 5 MB</p>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Nombre completo / del negocio *</Label>
            <Input id="name" value={form.display_name} onChange={(e) => update('display_name', e.target.value)} placeholder="Dr. Juan Pérez" />
          </div>

          <div>
            <Label htmlFor="type">Tipo de atención *</Label>
            <Select value={form.provider_type} onValueChange={(v) => update('provider_type', v as ProviderProfileForm['provider_type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Consulta individual</SelectItem>
                <SelectItem value="home_visit">Atención a domicilio</SelectItem>
                <SelectItem value="clinic">Clínica veterinaria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bio">Bio profesional *</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              placeholder="Contá tu experiencia, enfoque y qué te diferencia…"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/500 · mínimo 50 caracteres</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="years">Años de experiencia</Label>
              <Input id="years" type="number" min={0} value={form.experience_years ?? ''} onChange={(e) => update('experience_years', e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div>
              <Label htmlFor="license">N° Colmevet</Label>
              <Input id="license" value={form.license_number} onChange={(e) => update('license_number', e.target.value)} placeholder="12345" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email público</Label>
              <Input id="email" type="email" value={form.public_email ?? ''} onChange={(e) => update('public_email', e.target.value || null)} placeholder="contacto@vet.cl" />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono público</Label>
              <Input id="phone" value={form.public_phone ?? ''} onChange={(e) => update('public_phone', e.target.value || null)} placeholder="+56 9 1234 5678" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Especialidades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. Especialidades</CardTitle>
          <CardDescription>Elegí al menos 1.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {VET_SPECIALTIES.map((s) => {
              const active = form.specialties.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleInArray('specialties', s)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    active
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-foreground border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Zonas de atención */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Zonas de atención</CardTitle>
          <CardDescription>Comunas donde atendés (al menos 1).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="commune">Comuna base</Label>
            <Select value={form.commune ?? ''} onValueChange={(v) => update('commune', v || null)}>
              <SelectTrigger><SelectValue placeholder="Elegí tu comuna principal" /></SelectTrigger>
              <SelectContent>
                {SANTIAGO_COMUNAS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Comunas que atendés</Label>
            <div className="flex flex-wrap gap-2">
              {SANTIAGO_COMUNAS.map((c) => {
                const active = form.service_areas.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleInArray('service_areas', c)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      active
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-foreground border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {form.service_areas.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">{form.service_areas.length} comuna(s) seleccionada(s)</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Precios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4. Precios</CardTitle>
          <CardDescription>Aparecerá como "Desde $X" en tu perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="price">Precio mínimo (CLP)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={form.price_from ?? ''}
              onChange={(e) => update('price_from', e.target.value ? Number(e.target.value) : null)}
              placeholder="25000"
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Visibilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5. Visibilidad pública</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Label htmlFor="visible" className="text-base">Aparecer en el directorio público</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Tu perfil será visible en pawfriend.cl/veterinarios para cualquier persona, sin login.
                {!canBeVisible && ' Necesitás completar más campos primero.'}
              </p>
              {form.is_directory_visible && canBeVisible && (
                <Badge variant="secondary" className="mt-2">Visible públicamente</Badge>
              )}
            </div>
            <Switch
              id="visible"
              checked={form.is_directory_visible}
              disabled={!canBeVisible}
              onCheckedChange={(v) => update('is_directory_visible', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10">
        <Card className="shadow-lg border-purple-200">
          <CardContent className="py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground hidden md:block">
              {upsert.isPending ? 'Guardando…' : 'Recordá guardar tus cambios'}
            </p>
            <Button onClick={handleSave} disabled={upsert.isPending} className="ml-auto">
              {upsert.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

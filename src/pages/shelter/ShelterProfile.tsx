/**
 * Editar perfil publico del refugio. Guarda cambios en adoption_centers.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useShelter } from '@/hooks/useShelter';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SANTIAGO_COMUNAS } from '@/lib/vetDirectory';
import { Loader2 } from 'lucide-react';

export default function ShelterProfile() {
  const navigate = useNavigate();
  const { shelter, isLoading, refetch } = useShelter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [legalName, setLegalName] = useState('');
  const [mission, setMission] = useState('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [capacity, setCapacity] = useState('');
  const [acceptsDonations, setAcceptsDonations] = useState(true);

  useEffect(() => {
    if (!shelter) return;
    setLegalName(shelter.legal_name);
    setMission(shelter.mission || '');
    setCommune(shelter.commune);
    setAddress(shelter.address || '');
    setContactEmail(shelter.contact_email || '');
    setContactPhone(shelter.contact_phone || '');
    setWebsite(shelter.website || '');
    setInstagram((shelter.social_media?.instagram as string) || '');
    setCapacity(shelter.capacity?.toString() || '');
    setAcceptsDonations(shelter.accepts_donations);
  }, [shelter]);

  const handleSave = async () => {
    if (!shelter) return;
    if (legalName.trim().length < 3) {
      toast.error('El nombre debe tener al menos 3 caracteres');
      return;
    }
    setSaving(true);
    try {
      // INIT-23: si address o commune cambió, geocodear via Nominatim
      // para mostrar el refugio en el mapa de adopción con coords reales.
      // Si falla, guardar igual sin coords (no bloqueante).
      type GeocodeUpdate = { latitude?: number; longitude?: number };
      const addressChanged = (shelter.address || '') !== address.trim();
      const communeChanged = shelter.commune !== commune;
      let geocodeUpdate: GeocodeUpdate = {};

      if ((addressChanged || communeChanged) && (address.trim() || commune)) {
        try {
          const { data: geo, error: geoErr } = await supabase.functions.invoke('geocode-address', {
            body: { address: address.trim(), commune },
          });
          if (!geoErr && geo?.lat && geo?.lng) {
            geocodeUpdate = { latitude: geo.lat, longitude: geo.lng };
          }
        } catch {
          // Geocoding no es crítico — el perfil se guarda igual
        }
      }

      const { error } = await // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('adoption_centers' as any) as any)
        .update({
          legal_name: legalName.trim(),
          mission: mission.trim() || null,
          commune,
          address: address.trim() || null,
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          website: website.trim() || null,
          social_media: instagram.trim() ? { instagram: instagram.trim() } : {},
          capacity: capacity ? Number(capacity) : null,
          accepts_donations: acceptsDonations,
          ...geocodeUpdate,
        })
        .eq('id', shelter.id);
      if (error) throw error;
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['shelter'] });
      if (geocodeUpdate.latitude) {
        toast.success('Perfil actualizado con ubicación en el mapa');
      } else {
        toast.success('Perfil actualizado');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!shelter) return null;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Editar perfil del refugio"
        subtitle={shelter.legal_name}
        onBack={() => navigate('/shelter/dashboard')}
      />
      <div className="container max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Mision</Label>
              <Textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Que hacen, por que, a quien ayudan..."
              />
              <p className="text-xs text-muted-foreground">{mission.length}/500</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Comuna</Label>
                <Select value={commune} onValueChange={setCommune}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-1.5">
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  min={0}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Direccion</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email de contacto</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefono</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+56 9 ..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sitio web</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@refugio"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
              <Checkbox
                id="accepts_donations"
                checked={acceptsDonations}
                onCheckedChange={(v) => setAcceptsDonations(!!v)}
                className="mt-0.5"
              />
              <label htmlFor="accepts_donations" className="text-sm cursor-pointer flex-1">
                <span className="font-semibold">Aceptar donaciones dirigidas</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  La comunidad podra donar directamente a tu causa (proximamente activo).
                </p>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Guardando
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

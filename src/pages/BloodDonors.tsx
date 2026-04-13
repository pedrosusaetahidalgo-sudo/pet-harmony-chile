import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Droplets, Search, MapPin, Heart, AlertTriangle, Info, Phone } from '@/lib/icons';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { COMUNAS_SANTIAGO } from '@/lib/locations';
import { useStartConversation } from '@/hooks/useStartConversation';

// Blood type options by species
const DOG_BLOOD_TYPES = ['DEA 1.1+', 'DEA 1.1-', 'DEA 3', 'DEA 4', 'DEA 5', 'DEA 7'];
const CAT_BLOOD_TYPES = ['A', 'B', 'AB'];

interface DonorPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photo_url: string | null;
  blood_type: string;
  birth_date: string | null;
  weight: number | null;
  owner_id: string;
  owner_name: string | null;
  owner_avatar: string | null;
  owner_location: string | null;
}

function getAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function isDonorEligible(pet: DonorPet): { eligible: boolean; reason?: string } {
  const age = getAge(pet.birth_date);
  if (pet.species === 'perro') {
    if (pet.weight && pet.weight < 25)
      return { eligible: false, reason: 'Peso mínimo: 25 kg para perros' };
    if (age !== null && (age < 1 || age > 8))
      return { eligible: false, reason: 'Edad: entre 1 y 8 años' };
  } else if (pet.species === 'gato') {
    if (pet.weight && pet.weight < 4)
      return { eligible: false, reason: 'Peso mínimo: 4 kg para gatos' };
    if (age !== null && (age < 1 || age > 8))
      return { eligible: false, reason: 'Edad: entre 1 y 8 años' };
  }
  return { eligible: true };
}

export default function BloodDonors() {
  const { user } = useAuth();
  const { startConversation } = useStartConversation();
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<string>('all');
  const [comunaFilter, setComunaFilter] = useState<string>('');
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // Fetch pets with blood_type set and public profiles
  const { data: donors, isLoading } = useQuery({
    queryKey: ['blood-donors', speciesFilter, bloodTypeFilter],
    queryFn: async (): Promise<DonorPet[]> => {
      let query = supabase
        .from('pets')
        .select(
          `
          id, name, species, breed, photo_url, blood_type, birth_date, weight, owner_id,
          profiles:owner_id (display_name, avatar_url, location)
        `
        )
        .not('blood_type', 'is', null)
        .neq('blood_type', '')
        .eq('lifecycle_status', 'active')
        .eq('is_public', true);

      if (speciesFilter !== 'all') {
        query = query.eq('species', speciesFilter);
      }
      if (bloodTypeFilter !== 'all') {
        query = query.eq('blood_type', bloodTypeFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      return (data || []).map((p) => {
        const profile = p.profiles as unknown as {
          display_name: string | null;
          avatar_url: string | null;
          location: string | null;
        } | null;
        return {
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          photo_url: p.photo_url,
          blood_type: p.blood_type!,
          birth_date: p.birth_date,
          weight: p.weight,
          owner_id: p.owner_id,
          owner_name: profile?.display_name || null,
          owner_avatar: profile?.avatar_url || null,
          owner_location: profile?.location || null,
        };
      });
    },
  });

  const filteredDonors = (donors || []).filter((d) => {
    if (
      comunaFilter &&
      d.owner_location &&
      !d.owner_location.toLowerCase().includes(comunaFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const bloodTypeOptions = speciesFilter === 'gato' ? CAT_BLOOD_TYPES : DOG_BLOOD_TYPES;

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Droplets className="h-7 w-7 text-red-500" />
          <h1 className="text-2xl font-bold">Banco de Sangre</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Encuentra donantes de sangre para tu mascota o registra a la tuya como donante. Un
          servicio gratuito de la comunidad Paw Friend.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInfoDialog(true)}
          className="text-xs gap-1"
        >
          <Info className="h-3.5 w-3.5" />
          ¿Cómo funciona la donación?
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={speciesFilter}
              onValueChange={(v) => {
                setSpeciesFilter(v);
                setBloodTypeFilter('all');
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Especie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="perro">Perros</SelectItem>
                <SelectItem value="gato">Gatos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo sangre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {bloodTypeOptions.map((bt) => (
                  <SelectItem key={bt} value={bt}>
                    {bt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por comuna..."
                value={comunaFilter}
                onChange={(e) => setComunaFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filteredDonors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Droplets className="h-12 w-12 text-red-200 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No se encontraron donantes</p>
            <p className="text-xs text-muted-foreground mt-1">
              Registra el tipo de sangre de tu mascota en su ficha para aparecer aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredDonors.map((donor) => {
            const age = getAge(donor.birth_date);
            const eligibility = isDonorEligible(donor);
            return (
              <Card key={donor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-14 w-14 rounded-xl flex-shrink-0">
                      <AvatarImage src={donor.photo_url || undefined} alt={donor.name} />
                      <AvatarFallback className="rounded-xl bg-red-50 text-red-600 font-bold text-lg">
                        {donor.name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{donor.name}</h3>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 text-xs font-bold flex-shrink-0"
                        >
                          {donor.blood_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {donor.species === 'perro' ? '🐕' : '🐈'} {donor.breed || donor.species}
                        {age !== null && ` · ${age} ${age === 1 ? 'año' : 'años'}`}
                        {donor.weight && ` · ${donor.weight} kg`}
                      </p>
                      {donor.owner_location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {donor.owner_location}
                        </p>
                      )}
                      {!eligibility.eligible && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          {eligibility.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={donor.owner_avatar || undefined} />
                        <AvatarFallback className="text-[10px] bg-purple-100 text-purple-700">
                          {donor.owner_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">
                        {donor.owner_name || 'Usuario'}
                      </span>
                    </div>
                    {user && user.id !== donor.owner_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-8 gap-1"
                        onClick={async () => {
                          await startConversation(donor.owner_id);
                        }}
                      >
                        <Heart className="h-3.5 w-3.5 text-red-500" />
                        Contactar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Educational Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-red-500" />
              Donación de sangre en mascotas
            </DialogTitle>
            <DialogDescription>
              Todo lo que necesitas saber sobre la donación de sangre animal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">¿Quién puede donar?</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • <strong>Perros</strong>: entre 1 y 8 años, peso mayor a 25 kg, vacunas al día,
                  sin enfermedades crónicas
                </li>
                <li>
                  • <strong>Gatos</strong>: entre 1 y 8 años, peso mayor a 4 kg, vacunas al día,
                  indoor preferible
                </li>
                <li>
                  • Ambos: desparasitados, sin medicación actual, sin haber donado en los últimos 3
                  meses
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Tipos de sangre</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • <strong>Perros</strong>: DEA 1.1+, DEA 1.1- (universal), DEA 3, DEA 4, DEA 5,
                  DEA 7
                </li>
                <li>
                  • <strong>Gatos</strong>: A (más común ~95%), B, AB (raro)
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">¿Cómo funciona?</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>1. Registra el tipo de sangre en la ficha de tu mascota</li>
                <li>2. Tu mascota aparece automáticamente como potencial donante</li>
                <li>3. Cuando alguien necesite sangre, te contacta por el chat de Paw Friend</li>
                <li>4. La donación se realiza siempre en una clínica veterinaria</li>
              </ul>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-800">
                <strong>Importante:</strong> Paw Friend facilita el contacto entre dueños pero NO
                certifica la aptitud para donar. Siempre consulta a tu veterinario antes de
                proceder.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

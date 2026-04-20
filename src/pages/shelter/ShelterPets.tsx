/**
 * Lista completa de mascotas del refugio. Filtros por estado (en cuidado /
 * adoptadas / todas) y busqueda por nombre/raza.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShelter } from '@/hooks/useShelter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/PageHeader';
import {
  PawPrint,
  Search,
  Heart,
  Home as HomeIcon,
  Upload,
  Loader2,
  Share2,
  FileText,
} from 'lucide-react';

type Filter = 'in_care' | 'adopted' | 'all';

interface ShelterPet {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  photo_url: string | null;
  owner_id: string | null;
  shelter_adopted_at: string | null;
  created_at: string;
}

export default function ShelterPets() {
  const navigate = useNavigate();
  const { shelter, isLoading: shelterLoading } = useShelter();
  const [filter, setFilter] = useState<Filter>('in_care');
  const [search, setSearch] = useState('');

  const { data: pets, isLoading } = useQuery<ShelterPet[]>({
    queryKey: ['shelter-pets', 'full', shelter?.id, filter],
    queryFn: async () => {
      if (!shelter?.id) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('pets')
        .select('id, name, species, breed, photo_url, owner_id, shelter_adopted_at, created_at')
        .eq('created_by_shelter_id', shelter.id)
        .order('created_at', { ascending: false });
      if (filter === 'in_care') {
        query = query.is('shelter_adopted_at', null);
      } else if (filter === 'adopted') {
        query = query.not('shelter_adopted_at', 'is', null);
      }
      const { data } = await query;
      return (data as ShelterPet[]) || [];
    },
    enabled: !!shelter?.id,
  });

  const filtered =
    pets?.filter((p) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(s) ||
        (p.breed || '').toLowerCase().includes(s) ||
        (p.species || '').toLowerCase().includes(s)
      );
    }) || [];

  if (shelterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mis mascotas"
        subtitle={shelter?.legal_name}
        onBack={() => navigate('/shelter/dashboard')}
      />
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, raza o especie"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/shelter/bulk-import')}>
              <Upload className="h-4 w-4 mr-1" /> Carga masiva
            </Button>
            <Button variant="outline" onClick={() => navigate('/add-pet')}>
              Agregar una
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="in_care">En cuidado</TabsTrigger>
            <TabsTrigger value="adopted">Adoptadas</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <PawPrint className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? 'No encontramos mascotas con ese filtro.'
                  : filter === 'adopted'
                    ? 'Aun no has entregado mascotas en adopcion.'
                    : 'No hay mascotas en cuidado. Empieza cargando una o subiendo un CSV.'}
              </p>
              {!search && filter !== 'adopted' && (
                <Button onClick={() => navigate('/shelter/bulk-import')}>
                  <Upload className="h-4 w-4 mr-1" /> Carga masiva
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => (
              <PetRow key={p.id} pet={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PetRow({ pet }: { pet: ShelterPet }) {
  const adopted = !!pet.shelter_adopted_at || !!pet.owner_id;
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="h-16 w-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
            {pet.photo_url ? (
              <img
                src={pet.photo_url}
                alt={pet.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <PawPrint className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-semibold text-sm truncate">{pet.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
            {adopted ? (
              <Badge variant="outline" className="text-[10px]">
                <Heart className="h-2.5 w-2.5 mr-1" /> Adoptada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                <HomeIcon className="h-2.5 w-2.5 mr-1" /> En cuidado
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          <Button variant="ghost" size="sm" asChild className="flex-1">
            <Link to={`/ficha/${pet.id}`}>
              <FileText className="h-3.5 w-3.5 mr-1" /> Ficha
            </Link>
          </Button>
          {!adopted && (
            <Button variant="ghost" size="sm" asChild className="flex-1">
              <Link to={`/shelter/transfer/${pet.id}`}>
                <Share2 className="h-3.5 w-3.5 mr-1" /> Entregar
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Directorio publico de refugios / hogares de adopcion verificados en
 * Paw Friend. Ruta: /refugios-hogares.
 *
 * Muestra solo refugios con status='active'. Filtros por comuna y tipo
 * (ong / fundacion / refugio / independiente / municipal).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Heart,
  Home as HomeIcon,
  MapPin,
  Building2,
  Users,
  Landmark,
  Globe,
  Instagram,
  Loader2,
  CheckCircle2,
  Search,
  PawPrint,
} from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';

type ShelterType = 'all' | 'ong' | 'fundacion' | 'refugio' | 'independiente' | 'municipal';

interface PublicShelter {
  id: string;
  legal_name: string;
  type: 'ong' | 'fundacion' | 'refugio' | 'independiente' | 'municipal';
  mission: string | null;
  commune: string;
  region: string | null;
  website: string | null;
  social_media: Record<string, string> | null;
  logo_url: string | null;
  banner_url: string | null;
  slug: string | null;
  animal_types: string[] | null;
  capacity: number | null;
  verified: boolean;
  accepts_donations: boolean;
  total_pets_adopted: number;
  total_pets_in_care: number;
}

const TYPE_LABEL: Record<PublicShelter['type'], string> = {
  ong: 'ONG',
  fundacion: 'Fundacion',
  refugio: 'Refugio',
  independiente: 'Rescatista',
  municipal: 'Municipal',
};

function typeIcon(type: PublicShelter['type']) {
  switch (type) {
    case 'ong':
      return <Users className="h-3 w-3" />;
    case 'fundacion':
      return <Building2 className="h-3 w-3" />;
    case 'refugio':
      return <HomeIcon className="h-3 w-3" />;
    case 'municipal':
      return <Landmark className="h-3 w-3" />;
    default:
      return <Heart className="h-3 w-3" />;
  }
}

export default function RefugiosHogares() {
  const [typeFilter, setTypeFilter] = useState<ShelterType>('all');
  const [commune, setCommune] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: shelters, isLoading } = useQuery<PublicShelter[]>({
    queryKey: ['public-shelters'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('adoption_centers' as any) as any)
        .select(
          'id, legal_name, type, mission, commune, region, website, social_media, logo_url, banner_url, slug, animal_types, capacity, verified, accepts_donations, total_pets_adopted, total_pets_in_care'
        )
        .eq('status', 'active')
        .order('verified', { ascending: false })
        .order('total_pets_adopted', { ascending: false });
      return (data as PublicShelter[]) || [];
    },
  });

  const communes = useMemo(() => {
    if (!shelters) return [];
    const s = new Set(shelters.map((s) => s.commune).filter(Boolean));
    return Array.from(s).sort();
  }, [shelters]);

  const filtered = useMemo(() => {
    if (!shelters) return [];
    return shelters.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (commune !== 'all' && s.commune !== commune) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.legal_name.toLowerCase().includes(q) ||
          (s.mission || '').toLowerCase().includes(q) ||
          s.commune.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shelters, typeFilter, commune, search]);

  const totalAdopted = useMemo(
    () => (shelters || []).reduce((acc, s) => acc + (s.total_pets_adopted || 0), 0),
    [shelters]
  );
  const totalInCare = useMemo(
    () => (shelters || []).reduce((acc, s) => acc + (s.total_pets_in_care || 0), 0),
    [shelters]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-purple-50 via-purple-50/60 to-white border-b border-purple-100">
        <div className="container max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
            <CategoryIcon kind="shelter" badge size="lg" className="shadow-lg" />
            <h1 className="text-3xl sm:text-4xl font-bold">Hogares de adopcion en Chile</h1>
            <p className="text-muted-foreground">
              Encuentra refugios, ONGs y rescatistas que estan dando en adopcion. Cuando adoptes, te
              entregamos la ficha medica completa de la mascota.
            </p>
            <div className="flex flex-wrap gap-6 pt-2 text-sm">
              <div className="flex items-center gap-2">
                <PawPrint className="h-4 w-4 text-purple-600" />
                <span>
                  <strong>{totalInCare}</strong> en cuidado
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-600" />
                <span>
                  <strong>{totalAdopted}</strong> ya adoptados
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>
                  <strong>{shelters?.length || 0}</strong> refugios en la red
                </span>
              </div>
            </div>
            <div className="pt-3">
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link to="/onboarding-shelter">¿Tienes un refugio? Registrate gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, comuna o mision"
              className="pl-9"
            />
          </div>
          <Select value={commune} onValueChange={setCommune}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda comuna</SelectItem>
              {communes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as ShelterType)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="refugio">Refugios</TabsTrigger>
            <TabsTrigger value="ong">ONGs</TabsTrigger>
            <TabsTrigger value="fundacion">Fundaciones</TabsTrigger>
            <TabsTrigger value="independiente">Rescatistas</TabsTrigger>
            <TabsTrigger value="municipal">Municipales</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Aun no hay refugios que coincidan con tu busqueda.
              </p>
              <Button variant="outline" asChild>
                <Link to="/onboarding-shelter">Registrar mi refugio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <ShelterCard key={s.id} shelter={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShelterCard({ shelter }: { shelter: PublicShelter }) {
  const hasLogo = !!shelter.logo_url;
  const animalLabel = (shelter.animal_types || []).slice(0, 3).join(' · ');
  const insta = shelter.social_media?.instagram;

  return (
    <Link
      to={shelter.slug ? `/refugios/${shelter.slug}` : `#`}
      className="block rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition overflow-hidden group"
    >
      {/* Banner */}
      <div
        className="h-24 bg-gradient-to-br from-purple-100 via-purple-50 to-pink-50"
        style={
          shelter.banner_url
            ? { backgroundImage: `url(${shelter.banner_url})`, backgroundSize: 'cover' }
            : undefined
        }
      />
      <div className="p-4 -mt-8">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-full bg-white border-2 border-white shadow-md overflow-hidden flex-shrink-0">
            {hasLogo ? (
              <img
                src={shelter.logo_url!}
                alt={shelter.legal_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <CategoryIcon
                kind="shelter"
                variant="icon"
                className="h-14 w-14"
                aria-label={shelter.legal_name}
              />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-6">
            <h3 className="font-semibold text-sm truncate group-hover:text-purple-700 transition">
              {shelter.legal_name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{shelter.commune}</span>
              <span>·</span>
              <span>{TYPE_LABEL[shelter.type]}</span>
            </div>
          </div>
        </div>

        {shelter.mission && (
          <p className="text-xs text-muted-foreground mt-3 line-clamp-3">{shelter.mission}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {shelter.verified && (
            <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">
              <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Verificado
            </Badge>
          )}
          {shelter.accepts_donations && (
            <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700">
              <Heart className="h-2.5 w-2.5 mr-1" /> Acepta donaciones
            </Badge>
          )}
          {animalLabel && (
            <Badge variant="outline" className="text-[10px]">
              {animalLabel}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{shelter.total_pets_in_care}</strong> en cuidado
            </span>
            <span>
              <strong className="text-foreground">{shelter.total_pets_adopted}</strong> adoptados
            </span>
          </div>
          <div className="flex gap-1 text-muted-foreground">
            {shelter.website && (
              <span title="Tiene sitio web">
                <Globe className="h-3.5 w-3.5" />
              </span>
            )}
            {insta && (
              <span title={`@${insta}`}>
                <Instagram className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

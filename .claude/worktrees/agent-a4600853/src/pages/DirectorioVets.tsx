import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, MapPin, Star, Stethoscope } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDirectoryVets, type DirectoryVetFilters } from '@/hooks/useDirectoryVets';
import {
  SANTIAGO_COMUNAS,
  VET_SPECIALTIES,
  unslugify,
  setSeoTags,
  formatCLP,
} from '@/lib/vetDirectory';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vet = any;

export default function DirectorioVets() {
  const { comuna: comunaParam, especialidad: espParam } = useParams();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [comuna, setComuna] = useState<string>(comunaParam ? unslugify(comunaParam) : 'all');
  const [specialty, setSpecialty] = useState<string>(espParam ? unslugify(espParam) : 'all');
  const [minRating, setMinRating] = useState<string>('0');

  const filters: DirectoryVetFilters = useMemo(
    () => ({
      search: search || undefined,
      type: type !== 'all' ? (type as DirectoryVetFilters['type']) : undefined,
      comuna: comuna !== 'all' ? comuna : undefined,
      specialty: specialty !== 'all' ? specialty : undefined,
      minRating: Number(minRating) || undefined,
    }),
    [search, type, comuna, specialty, minRating]
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDirectoryVets(filters);

  const vets: Vet[] = useMemo(() => data?.pages.flat() ?? [], [data]);

  useEffect(() => {
    const titleParts = ['Veterinarios'];
    if (comuna !== 'all') titleParts.push(`en ${comuna}`);
    if (specialty !== 'all') titleParts.push(`· ${specialty}`);
    setSeoTags({
      title: `${titleParts.join(' ')} | Paw Friend`,
      description:
        'Encuentra el mejor veterinario para tu mascota en Chile. Reseñas verificadas, atención a domicilio y en clínica.',
      canonical: `https://pawfriend.cl/veterinarios${
        comunaParam ? `/comuna/${comunaParam}` : ''
      }${espParam ? `/especialidad/${espParam}` : ''}`,
    });
  }, [comuna, specialty, comunaParam, espParam]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <PublicHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-amber-900 mb-3">
            Encuentra el veterinario ideal
          </h1>
          <p className="text-lg text-muted-foreground">
            para tu mascota en Chile · reseñas verificadas
          </p>
        </div>

        {/* Search + filters */}
        <Card className="p-4 md:p-6 mb-6 shadow-md">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o especialidad…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="home_visit">A domicilio</SelectItem>
                <SelectItem value="clinic">Clínica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={comuna} onValueChange={setComuna}>
              <SelectTrigger><SelectValue placeholder="Comuna" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las comunas</SelectItem>
                {SANTIAGO_COMUNAS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger><SelectValue placeholder="Especialidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las especialidades</SelectItem>
                {VET_SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={minRating} onValueChange={setMinRating}>
              <SelectTrigger><SelectValue placeholder="Rating mínimo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Cualquier rating</SelectItem>
                <SelectItem value="3">★★★ y más</SelectItem>
                <SelectItem value="4">★★★★ y más</SelectItem>
                <SelectItem value="4.5">★★★★½ y más</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : vets.length === 0 ? (
          <Card className="p-12 text-center">
            <Stethoscope className="h-12 w-12 mx-auto text-amber-300 mb-3" />
            <h3 className="font-semibold text-lg mb-1">Sin resultados</h3>
            <p className="text-muted-foreground text-sm">
              Prueba ajustar los filtros o busca en otra comuna.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {vets.map((vet) => (
              <VetCard key={vet.id} vet={vet} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Cargando…' : 'Ver más veterinarios'}
            </Button>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

function VetCard({ vet }: { vet: Vet }) {
  const areas: string[] = vet.service_areas ?? [];
  const specialties: string[] = vet.specialties ?? [];
  const rating = Number(vet.avg_rating ?? 0);
  const reviewCount = Number(vet.total_reviews ?? 0);

  return (
    <Link to={`/veterinarios/${vet.slug}`} className="block">
      <Card className="p-4 md:p-5 hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-shrink-0">
            {vet.avatar_url ? (
              <img
                src={vet.avatar_url}
                alt={vet.display_name ?? 'Veterinario'}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-amber-200"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-amber-100 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-amber-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-lg text-amber-900 truncate">
                {vet.display_name}
                {vet.is_verified && <span className="ml-1 text-blue-500">✓</span>}
              </h3>
              {vet.provider_type === 'home_visit' && (
                <Badge variant="secondary">A domicilio</Badge>
              )}
              {vet.provider_type === 'clinic' && (
                <Badge variant="secondary">Clínica</Badge>
              )}
            </div>

            {specialties.length > 0 && (
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {specialties.slice(0, 3).join(' · ')}
              </p>
            )}

            {areas.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{areas.slice(0, 4).join(', ')}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <strong>{rating.toFixed(1)}</strong>
                <span className="text-muted-foreground">({reviewCount} reseñas)</span>
              </div>
              {vet.price_from && (
                <span className="text-muted-foreground">
                  Desde <strong className="text-amber-700">{formatCLP(vet.price_from)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function PublicHeader() {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
        <Link to="/" className="font-bold text-amber-700 text-lg">
          🐾 Paw Friend
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Iniciar sesión</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm">Registrarse</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t bg-white mt-12 py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <p>© {new Date().getFullYear()} Paw Friend Chile · pawfriend.cl</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/terms" className="hover:text-amber-700">Términos</Link>
          <Link to="/privacy" className="hover:text-amber-700">Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}

export { PublicHeader, PublicFooter };

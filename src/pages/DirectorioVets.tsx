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
import { useAuth } from '@/hooks/useAuth';
import PriceEstimatorWidget from '@/components/PriceEstimatorWidget';
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

  // Stats derivados de los vets cargados para enriquecer la landing de comuna
  const comunaStats = useMemo(() => {
    if (!comunaParam || vets.length === 0) return null;
    const prices = vets
      .map((v: Vet) => v.price_from as number | null)
      .filter((p): p is number => p != null && p > 0);
    const allSpecs = vets.flatMap((v: Vet) => (v.specialties as string[]) ?? []);
    const uniqueSpecs = [...new Set(allSpecs)];
    return {
      count: vets.length,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      specialtyCount: uniqueSpecs.length,
    };
  }, [comunaParam, vets]);

  useEffect(() => {
    const comunaDisplay = comuna !== 'all' ? comuna : null;
    const titleParts = ['Veterinarios'];
    if (comunaDisplay) titleParts.push(`en ${comunaDisplay}`);
    if (specialty !== 'all') titleParts.push(`· ${specialty}`);

    const seoTitle = comunaDisplay
      ? `Veterinarios en ${comunaDisplay} — Directorio Paw Friend`
      : `${titleParts.join(' ')} | Paw Friend`;
    const seoDesc = comunaDisplay
      ? `Encuentra los mejores veterinarios en ${comunaDisplay}. Compara precios, lee resenas verificadas y agenda tu consulta online.`
      : 'Encuentra el mejor veterinario para tu mascota en Chile. Resenas verificadas, atencion a domicilio y en clinica.';

    setSeoTags({
      title: seoTitle,
      description: seoDesc,
      canonical: `https://pawfriend.cl/veterinarios${
        comunaParam ? `/comuna/${comunaParam}` : ''
      }${espParam ? `/especialidad/${espParam}` : ''}`,
    });
  }, [comuna, specialty, comunaParam, espParam]);

  // Cuando el user está logueado, la página se monta dentro de AppLayout
  // (que ya trae header + sidebar), por lo que NO debemos renderizar el
  // PublicHeader: si lo hacemos quedan dos headers superpuestos.
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 to-white">
      {!user && <PublicHeader />}

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {comunaParam && comuna !== 'all' ? (
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-purple-900 mb-3">
              Veterinarios en {comuna}
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Encuentra los mejores veterinarios en {comuna}. Compara precios, lee resenas verificadas y agenda tu consulta online.
            </p>
            {comunaStats && !isLoading && (
              <Card className="p-4 bg-purple-50/50 border-purple-200">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-purple-900">
                  <span>{comunaStats.count} veterinario{comunaStats.count !== 1 ? 's' : ''} verificado{comunaStats.count !== 1 ? 's' : ''}</span>
                  {comunaStats.minPrice && (
                    <span>Consulta general desde {formatCLP(comunaStats.minPrice)}</span>
                  )}
                  {comunaStats.specialtyCount > 0 && (
                    <span>{comunaStats.specialtyCount} especialidad{comunaStats.specialtyCount !== 1 ? 'es' : ''}</span>
                  )}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-purple-900 mb-3">
              Encuentra el veterinario ideal
            </h1>
            <p className="text-lg text-muted-foreground">
              para tu mascota en Chile · resenas verificadas
            </p>
          </div>
        )}

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

          {/* Comuna destacada arriba: en Chile el dueno busca SIEMPRE en su
              comuna, no en todo Santiago. Antes estaba escondida en una grid
              de 4 columnas con los demas filtros. */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
              📍 Tu comuna
            </label>
            <Select value={comuna} onValueChange={setComuna}>
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-600">
                <SelectValue placeholder="Selecciona tu comuna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las comunas</SelectItem>
                {SANTIAGO_COMUNAS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="home_visit">A domicilio</SelectItem>
                <SelectItem value="clinic">Clínica</SelectItem>
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

        {/* Estimador de precios — solo cuando hay comuna especifica */}
        {comuna !== 'all' && <PriceEstimatorWidget comuna={comuna} compact />}

        {/* Link al comparador completo */}
        <div className="text-center">
          <Link
            to={comuna !== 'all' ? `/precios-veterinarios` : '/precios-veterinarios'}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
          >
            Ver comparador de precios por comuna →
          </Link>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : vets.length === 0 ? (
          <Card className="p-12 text-center">
            <Stethoscope className="h-12 w-12 mx-auto text-purple-300 mb-3" />
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
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-purple-200"
              />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-purple-100 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-purple-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-lg text-purple-900 truncate">
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
              {reviewCount > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <strong>{rating.toFixed(1)}</strong>
                  <span className="text-muted-foreground">({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin reseñas aún</span>
              )}
              {vet.price_from && (
                <span className="text-muted-foreground">
                  Desde <strong className="text-purple-700">{formatCLP(vet.price_from)}</strong>
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
        <Link to="/" className="font-bold text-purple-700 text-lg">
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
        <p className="text-xs">Hecho en Chile, para Chile · Pagos seguros con Flow</p>
        <p>© {new Date().getFullYear()} Paw Friend Chile · pawfriend.cl</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link to="/terms" className="hover:text-purple-700">Términos</Link>
          <Link to="/privacy" className="hover:text-purple-700">Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}

export { PublicHeader, PublicFooter };

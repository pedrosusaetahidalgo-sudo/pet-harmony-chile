/**
 * Dashboard principal del refugio / hogar de adopcion.
 * Muestra:
 *   - Tarjetas de stats (en cuidado, adoptados totales, capacidad)
 *   - Accesos rapidos a bulk import, publicar mascota, editar perfil
 *   - Lista resumida de mascotas a cargo (hasta 6)
 *   - Intereses recientes de adoptantes
 *
 * Orientacion profesional: SIN gamificacion (igual que provider dashboard).
 */
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useShelter } from '@/hooks/useShelter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { ShelterMetricsPanel } from '@/components/shelter/ShelterMetricsPanel';
import {
  Upload,
  Heart,
  Home as HomeIcon,
  Users,
  Pencil,
  PawPrint,
  MessageCircle,
  Share2,
  Loader2,
} from 'lucide-react';

interface MiniPet {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  photo_url: string | null;
  owner_id: string | null;
  shelter_adopted_at: string | null;
}

export default function ShelterDashboard() {
  const navigate = useNavigate();
  const { shelter, isLoading } = useShelter();

  const { data: pets } = useQuery<MiniPet[]>({
    queryKey: ['shelter-pets', 'summary', shelter?.id],
    queryFn: async () => {
      if (!shelter?.id) return [];
      // Cast a any porque los tipos generados aun no conocen las columnas
      // created_by_shelter_id / shelter_adopted_at (se regeneran tras migracion).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('pets') as any)
        .select('id, name, species, breed, photo_url, owner_id, shelter_adopted_at')
        .eq('created_by_shelter_id', shelter.id)
        .order('created_at', { ascending: false })
        .limit(6);
      return (data as MiniPet[]) || [];
    },
    enabled: !!shelter?.id,
  });

  const { data: interestsCount = 0 } = useQuery({
    queryKey: ['shelter-interests-count', shelter?.user_id],
    queryFn: async () => {
      if (!shelter?.user_id) return 0;
      // Intereses sobre posts del refugio. adoption_posts.user_id es del refugio.
      const { data: myPosts } = await supabase
        .from('adoption_posts')
        .select('id')
        .eq('user_id', shelter.user_id);
      if (!myPosts?.length) return 0;
      const { count } = await supabase
        .from('adoption_interests')
        .select('id', { count: 'exact', head: true })
        .in(
          'adoption_post_id',
          myPosts.map((p) => p.id)
        )
        .eq('status', 'pending');
      return count || 0;
    },
    enabled: !!shelter?.user_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!shelter) return null;

  const inCare = shelter.total_pets_in_care;
  const adopted = shelter.total_pets_adopted;
  const capacityLabel = shelter.capacity ? `${inCare} / ${shelter.capacity}` : `${inCare}`;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={shelter.legal_name}
        subtitle={shelter.verified ? 'Refugio verificado en Paw Friend' : 'Bienvenido a tu panel'}
        onBack={() => navigate('/home')}
      />
      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<HomeIcon className="h-4 w-4" />}
            label="En cuidado"
            value={capacityLabel}
            color="purple"
          />
          <StatCard
            icon={<Heart className="h-4 w-4" />}
            label="Adoptados"
            value={adopted.toString()}
            color="pink"
          />
          <StatCard
            icon={<MessageCircle className="h-4 w-4" />}
            label="Intereses pendientes"
            value={interestsCount.toString()}
            color="teal"
          />
          <StatCard
            icon={<Users className="h-4 w-4" />}
            label="Estado"
            value={shelter.verified ? 'Verificado' : 'Activo'}
            color={shelter.verified ? 'green' : 'amber'}
          />
        </div>

        {/* Metricas operativas (si hay pets) */}
        <ShelterMetricsPanel shelter={shelter} />

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-3">
          <QuickAction
            to="/shelter/bulk-import"
            icon={<Upload className="h-5 w-5" />}
            title="Cargar mascotas masivamente"
            description="Sube un CSV con todas tus fichas en bloque."
          />
          <QuickAction
            to="/shelter/pets"
            icon={<PawPrint className="h-5 w-5" />}
            title="Ver todas mis mascotas"
            description="Listado completo, filtros y acciones."
          />
          <QuickAction
            to="/shelter/profile"
            icon={<Pencil className="h-5 w-5" />}
            title="Editar perfil publico"
            description="Que ve la gente cuando llega a tu refugio."
          />
        </div>

        {/* Pets recientes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mascotas a tu cargo</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/shelter/pets">Ver todas</Link>
            </Button>
          </div>
          {!pets || pets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <PawPrint className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Aun no has cargado mascotas. Empieza cargando una o sube muchas de una vez.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/shelter/bulk-import')}>
                    <Upload className="h-4 w-4 mr-1" /> Carga masiva
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/add-pet')}>
                    Agregar una
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pets.map((p) => (
                <PetMiniCard key={p.id} pet={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'purple' | 'pink' | 'teal' | 'green' | 'amber';
}) {
  const colorMap = {
    purple: 'bg-purple-100 text-purple-700',
    pink: 'bg-pink-100 text-pink-700',
    teal: 'bg-teal-100 text-teal-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${colorMap[color]}`}
        >
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group block p-4 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm transition"
    >
      <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

function PetMiniCard({ pet }: { pet: MiniPet }) {
  const adopted = !!pet.shelter_adopted_at || !!pet.owner_id;
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
            {pet.photo_url ? (
              <img
                src={pet.photo_url}
                alt={pet.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <PawPrint className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{pet.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ''}
            </p>
            <div className="mt-1">
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
          {!adopted && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/shelter/transfer/${pet.id}`}>
                <Share2 className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

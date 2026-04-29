import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  Target,
  Gamepad2,
  Heart,
  Droplets,
  PawPrint,
  Handshake,
  MapPin,
  Sparkles,
} from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';
import { isFeatureEnabled } from '@/lib/featureFlags';

/**
 * /explorar — hub de Paw Labs (modelo v2 producto invisible).
 *
 * Antes: el home del dueño mostraba Feed/Comunidad/Misiones/Paw Game
 * directamente en la sección "Explorar", contaminando el foco médico.
 * Después (modelo v2 2026-04-22): el home se
 * mantiene en ficha + recordatorios + urgencia + directorio. Las
 * features experimentales (Paw Labs) viven aquí en /explorar como
 * opt-in: el usuario que las quiera, las activa con un click.
 *
 * Cada tile respeta su feature flag — si está deshabilitada, no
 * renderiza el tile (no rompe la grid, solo desaparece).
 */

interface ExplorarTile {
  label: string;
  desc: string;
  to: string;
  Icon: typeof Activity;
  color: string;
  bg: string;
  /** Si la flag es false, no renderiza el tile. */
  flag?: 'LABS_ADOPTION' | 'LABS_BLOOD_DONORS' | 'LABS_COMMUNITY' | 'FEED' | 'CHAT';
  /** Etiqueta opcional ("Beta", "Nuevo", "Próximamente"). */
  badge?: string;
}

const TILES: ExplorarTile[] = [
  {
    label: 'Comunidad',
    desc: 'Grupos por raza y condición',
    to: '/comunidad',
    Icon: Users,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    flag: 'LABS_COMMUNITY',
    badge: 'Beta',
  },
  {
    label: 'Adopciones',
    desc: 'Refugios y mascotas en adopción',
    to: '/adoption',
    Icon: Handshake,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    flag: 'LABS_ADOPTION',
  },
  {
    label: 'Donantes de sangre',
    desc: 'Red de donadores caninos y felinos',
    to: '/donantes-sangre',
    Icon: Droplets,
    color: 'text-red-600',
    bg: 'bg-red-50',
    flag: 'LABS_BLOOD_DONORS',
    badge: 'Beta',
  },
  {
    label: 'Memorial',
    desc: 'Recuerda a tus peludos que partieron',
    to: '/en-memoria',
    Icon: Heart,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    label: 'Mapa pet-friendly',
    desc: 'Lugares donde puedes ir con tu peludo',
    to: '/maps',
    Icon: MapPin,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Feed',
    desc: 'Fotos y consejos de la comunidad',
    to: '/feed',
    Icon: Activity,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    flag: 'FEED',
  },
  {
    label: 'Misiones',
    desc: 'Gana Paw Points cuidando a tu peludo',
    to: '/misiones',
    Icon: Target,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: 'Paw Cards',
    desc: 'Colección de cartas de tus peludos',
    to: '/paw-collection',
    Icon: PawPrint,
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
  },
  {
    label: 'Paw Game',
    desc: 'Mini-juego para entretener a tu peludo',
    to: '/paw-game',
    Icon: Gamepad2,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

export default function Explorar() {
  const navigate = useNavigate();

  const visibleTiles = TILES.filter((tile) => {
    if (!tile.flag) return true;
    return isFeatureEnabled(tile.flag);
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Helmet>
        <title>Explorar Paw Friend — Paw Labs y comunidad</title>
        <meta
          name="description"
          content="Comunidad, adopciones, donantes de sangre, memorial, mapa pet-friendly, misiones y mini-juego. Todo lo extra de Paw Friend en un solo lugar."
        />
      </Helmet>
      <PageHeader title="Explorar" onBack={() => navigate('/home')} />

      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h2 className="text-lg font-semibold">Paw Labs y comunidad</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Features extra de Paw Friend. La ficha clínica, los recordatorios y el directorio de
            vets siguen siendo el corazón del producto — esto es lo que sumamos arriba para los que
            quieran. Todo opcional.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {visibleTiles.map((tile) => (
            <Card
              key={tile.to}
              className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 relative"
              onClick={() => navigate(tile.to)}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div
                  className={`mx-auto w-12 h-12 rounded-full ${tile.bg} flex items-center justify-center`}
                >
                  <tile.Icon className={`h-6 w-6 ${tile.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tile.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{tile.desc}</p>
                </div>
                {tile.badge && (
                  <Badge variant="outline" className="absolute top-2 right-2 text-[9px] py-0 px-1">
                    {tile.badge}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {visibleTiles.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Todas las features extra están desactivadas en este momento.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

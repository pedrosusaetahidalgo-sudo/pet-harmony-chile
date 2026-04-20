/**
 * Pagina standalone de onboarding para refugios / hogares de adopcion.
 * Envuelve BecomeShelterDialog abierto por defecto. Si el user cierra el
 * dialogo sin completar, lo devolvemos a /adoption.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Upload, Share2, HandHeart } from 'lucide-react';
import { BecomeShelterDialog } from '@/components/BecomeShelterDialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useActiveRole } from '@/hooks/useActiveRole';

export default function OnboardingShelter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isShelter, isShelterLoading } = useActiveRole();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth?returnTo=/onboarding-shelter', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!isShelterLoading && isShelter) {
      navigate('/shelter/dashboard', { replace: true });
    }
  }, [isShelter, isShelterLoading, navigate]);

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      navigate('/adoption');
    }
  };

  if (!user || isShelterLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      <div className="container max-w-3xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
            <Heart className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold">Registra tu hogar de adopcion en Paw Friend</h1>
          <p className="text-muted-foreground max-w-xl">
            Gestiona tus mascotas, carga sus fichas medicas y entregalas con todo su historial
            cuando alguien las adopte. Gratis para siempre.
          </p>
          <Button
            size="lg"
            onClick={() => setDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Comenzar registro
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Upload className="h-5 w-5" />}
            title="Carga masiva"
            description="Sube tus mascotas en bloque con un CSV o Excel. Sin formularios uno por uno."
          />
          <FeatureCard
            icon={<Share2 className="h-5 w-5" />}
            title="Transferencia al adoptar"
            description="Cuando alguien adopte, la ficha completa se entrega al nuevo dueno. No parten desde cero."
          />
          <FeatureCard
            icon={<HandHeart className="h-5 w-5" />}
            title="Donaciones dirigidas"
            description="La comunidad podra donar directamente a tu causa. Proximamente activo."
          />
        </div>

        <p className="text-xs text-center text-muted-foreground mt-8">
          Cualquier duda escribenos a{' '}
          <a href="mailto:pedrosusaeta@pawfriend.cl" className="text-purple-600 hover:underline">
            pedrosusaeta@pawfriend.cl
          </a>
          . Te respondemos siempre.
        </p>
      </div>

      <BecomeShelterDialog open={dialogOpen} onOpenChange={handleOpenChange} />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-purple-100 bg-white shadow-sm">
      <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

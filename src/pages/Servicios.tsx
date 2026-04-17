import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dog,
  ShieldCheck,
  GraduationCap,
  Scissors,
  ArrowRight,
  Building2,
  Heart,
  MapPin,
  Stethoscope,
  PawPrint,
} from '@/lib/icons';
import { LINKS } from '@/lib/links';
import { PageHeader } from '@/components/PageHeader';

type ServiceKey = 'walkers' | 'sitters' | 'trainers' | 'groomers';

interface ServiceItem {
  key: ServiceKey;
  title: string;
  description: string;
  icon: typeof Dog;
  gradient: string;
  iconColor: string;
  available: boolean;
}

const SERVICES: ServiceItem[] = [
  {
    key: 'walkers',
    title: 'Paseadores',
    description:
      'Profesionales verificados para sacar a tu perro a pasear con seguimiento GPS y reportes.',
    icon: Dog,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconColor: 'text-blue-600',
    available: true,
  },
  {
    key: 'sitters',
    title: 'Cuidadores',
    description: 'Hogares de confianza para cuidar a tu mascota cuando viajas o no puedes estar.',
    icon: ShieldCheck,
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconColor: 'text-purple-600',
    available: true,
  },
  {
    key: 'trainers',
    title: 'Entrenadores',
    description:
      'Entrenamiento canino positivo y especializado para todas las edades y necesidades.',
    icon: GraduationCap,
    gradient: 'from-orange-500/10 to-red-500/10',
    iconColor: 'text-orange-600',
    available: true,
  },
  {
    key: 'groomers',
    title: 'Peluquería',
    description: 'Baño, corte y arreglo profesional para perros y gatos.',
    icon: Scissors,
    gradient: 'from-pink-500/10 to-rose-500/10',
    iconColor: 'text-pink-600',
    available: true,
  },
];

interface DirectoryItem {
  title: string;
  description: string;
  icon: typeof Dog;
  gradient: string;
  iconColor: string;
  href: string;
}

const DIRECTORY_ITEMS: DirectoryItem[] = [
  {
    title: 'Tiendas de mascotas',
    description: 'SuperZoo, Petco, Petlandia y mas tiendas con ubicacion y contacto directo.',
    icon: Building2,
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-600',
    href: '/maps?tab=partners&chip=Tiendas',
  },
  {
    title: 'Seguros de mascotas',
    description: 'Cacttus, WOOF, Pawer, BCI y mas. Compara precios y coberturas.',
    icon: ShieldCheck,
    gradient: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-600',
    href: '/maps?tab=partners&chip=Seguros',
  },
  {
    title: 'Crematorios y cementerios',
    description: 'Servicios de despedida con retiro a domicilio, cremacion presencial y urnas.',
    icon: Heart,
    gradient: 'from-slate-500/10 to-slate-600/10',
    iconColor: 'text-slate-600',
    href: '/maps?tab=partners&chip=Crematorios',
  },
  {
    title: 'Transporte de mascotas',
    description: 'Traslado nacional e internacional con kennel, clima controlado y tracking.',
    icon: MapPin,
    gradient: 'from-indigo-500/10 to-violet-500/10',
    iconColor: 'text-indigo-600',
    href: '/maps?tab=partners&chip=Transporte',
  },
];

export default function Servicios() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Servicios"
        subtitle="Paseadores, cuidadores, entrenadores y más profesionales verificados."
        onBack={() => navigate(LINKS.home())}
      />
      <div className="container max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Destacados arriba: veterinarios (la mas usada) + adopcion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-5">
          <Card
            onClick={() => navigate(LINKS.vets())}
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-teal-200 hover:border-teal-400 bg-gradient-to-br from-teal-50 to-cyan-50"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-4 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                  <Stethoscope className="h-8 w-8 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">Veterinarios</h3>
                    <Badge className="text-[10px] bg-teal-600">Destacado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Directorio público de clínicas y veterinarios verificados. Con reseñas reales y
                    reserva directa.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-teal-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card
            onClick={() => navigate(LINKS.adoption())}
            className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-rose-200 hover:border-rose-400 bg-gradient-to-br from-rose-50 to-pink-50"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white p-4 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                  <PawPrint className="h-8 w-8 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">Adopción</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Mascotas buscando hogar, refugios y organizaciones en Chile.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-rose-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Servicios profesionales */}
        <h2 className="text-lg font-bold mb-3">Servicios profesionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            const handleClick = () => {
              if (!service.available) return;
              navigate(LINKS.services(service.key));
            };

            return (
              <Card
                key={service.key}
                onClick={handleClick}
                className={`group transition-all duration-300 ${
                  service.available
                    ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary/50'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`rounded-2xl bg-gradient-to-br ${service.gradient} p-4 flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-8 w-8 ${service.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{service.title}</h3>
                        {!service.available && (
                          <Badge variant="secondary" className="text-[10px]">
                            Próximamente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                    {service.available && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Directorio de partners */}
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-1">Directorio de servicios</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Tiendas, seguros, crematorios y transporte con ubicacion en el mapa.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {DIRECTORY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  onClick={() => navigate(item.href)}
                  className="group transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary/50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`rounded-2xl bg-gradient-to-br ${item.gradient} p-4 flex-shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className={`h-8 w-8 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-8 p-4 bg-muted/40 rounded-xl text-center text-sm text-muted-foreground">
          ¿Buscas un veterinario? Tenemos un{' '}
          <button
            onClick={() => navigate(LINKS.vets())}
            className="text-amber-700 font-semibold hover:underline"
          >
            directorio completo de veterinarios
          </button>{' '}
          con reseñas verificadas.
        </div>

        {/* CTA para partners */}
        <div className="mt-4 p-5 bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl border border-brand-200 text-center">
          <p className="text-sm font-semibold text-brand-800 mb-1">
            ¿Tienes un negocio relacionado con mascotas?
          </p>
          <p className="text-xs text-brand-600 mb-3">
            Veterinarias, tiendas, peluquerías, paseadores y más — registra tu negocio gratis.
          </p>
          <button
            onClick={() => navigate('/registro-partner')}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Registrar mi negocio
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

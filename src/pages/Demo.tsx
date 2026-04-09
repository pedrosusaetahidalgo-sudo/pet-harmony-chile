import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Building2, Home as HomeIcon, AlertCircle, ArrowRight, Search } from "@/lib/icons";
import { DEMO_VET_SLUGS } from "@/hooks/useDemoMode";
import { setSeoTags } from "@/lib/vetDirectory";
import { PublicHeader, PublicFooter } from "./DirectorioVets";

/**
 * Página de demostración para reuniones de venta.
 *
 * Pedro abre /demo en su celular antes de cada reunión y elige cuál de los
 * 5 perfiles target mostrar al vet/clínica con quien se está reuniendo.
 *
 * NO está linkeada desde ninguna parte de la navegación normal — es solo el
 * "menú" que Pedro usa en vivo.
 */

interface DemoOption {
  slug: string;
  title: string;
  segment: string;
  description: string;
  pitch: string;
  icon: typeof Stethoscope;
  color: string;
}

const DEMO_OPTIONS: DemoOption[] = [
  {
    slug: DEMO_VET_SLUGS.javieraMunoz,
    title: "Dra. Javiera Muñoz",
    segment: "Vet recién egresada · A domicilio",
    description: "Sector oriente · 1 año de experiencia · 8 reseñas",
    pitch: "Mostrar a vets que recién empiezan. En 3 meses pueden verse así.",
    icon: HomeIcon,
    color: "from-purple-600 to-teal-500",
  },
  {
    slug: DEMO_VET_SLUGS.matiasFernandez,
    title: "Dr. Matías Fernández",
    segment: "Especialista independiente",
    description: "Dermatología · 6 años · 47 reseñas",
    pitch: "Para vets con clientela que necesitan canal digital.",
    icon: Stethoscope,
    color: "from-blue-500 to-cyan-500",
  },
  {
    slug: DEMO_VET_SLUGS.clinicaPatitas,
    title: "Clínica Veterinaria Patitas",
    segment: "Clínica chica moderna",
    description: "Ñuñoa · 3 vets · 124 reseñas",
    pitch: "Para clínicas chicas que quieren profesionalizar su presencia digital.",
    icon: Building2,
    color: "from-purple-500 to-pink-500",
  },
  {
    slug: DEMO_VET_SLUGS.clinicaAltamira,
    title: "Clínica Veterinaria Altamira",
    segment: "Clínica grande tradicional",
    description: "Providencia · 8 vets · 340 reseñas · multi-especialidad",
    pitch: "Caso Cafati. Así se vería una clínica establecida en Paw Friend.",
    icon: Building2,
    color: "from-amber-500 to-orange-500",
  },
  {
    slug: DEMO_VET_SLUGS.cristianRojas,
    title: "Dr. Cristián Rojas",
    segment: "Emergencias 24 horas",
    description: "Toda la RM · 12 años · 78 reseñas",
    pitch: "Nicho poco cubierto que con Paw Friend se vuelve fácil de encontrar.",
    icon: AlertCircle,
    color: "from-red-500 to-rose-500",
  },
];

export default function Demo() {
  const navigate = useNavigate();

  useEffect(() => {
    setSeoTags({
      title: "Demo en vivo | Paw Friend",
      description: "Página interna de demostración para reuniones de venta.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PublicHeader />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header de la demo */}
        <div className="mb-6 text-center">
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 mb-2">
            🎯 Modo demostración
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Paw Friend — Demo en vivo</h1>
          <p className="text-sm text-muted-foreground">
            Elige qué perfil mostrar en la reunión según el tipo de profesional con quien te estás
            reuniendo.
          </p>
        </div>

        {/* Lista de perfiles demo */}
        <div className="space-y-3">
          {DEMO_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <Card
                key={opt.slug}
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50"
                onClick={() => navigate(`/veterinarios/${opt.slug}?demo=true`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-xl bg-gradient-to-br ${opt.color} p-3 flex-shrink-0 shadow-md`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">{opt.title}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                        {opt.segment}
                      </p>
                      <p className="text-sm mt-1">{opt.description}</p>
                      <p className="text-xs text-amber-700 italic mt-2 leading-snug">
                        💬 {opt.pitch}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground self-center flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Acceso al directorio completo */}
        <div className="mt-8 p-4 bg-muted/40 rounded-xl text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            O explora el directorio completo como lo verá un cliente real:
          </p>
          <Button
            onClick={() => navigate("/veterinarios?demo=true")}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Search className="h-4 w-4 mr-1" />
            Ver directorio público
          </Button>
        </div>

        {/* Aviso */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
          <strong>Nota:</strong> esta página es solo para uso interno de Pedro durante reuniones de
          venta. No está linkeada desde la navegación pública. Los 5 perfiles tienen datos
          ficticios marcados con <code>license_number LIKE 'DEMO%'</code> para identificarlos en la
          base de datos.
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LINKS } from "@/lib/links";
import { PublicHeader } from "@/components/PublicHeader";
import { LegalFooter } from "@/components/LegalFooter";
import Hero from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Stethoscope, FileText, Bell, ArrowRight, PawPrint, Calendar, Sparkles, Heart } from "@/lib/icons";

const BENEFITS = [
  {
    icon: Stethoscope,
    title: "Veterinarios cerca",
    description: "Directorio con reseñas reales en toda Santiago.",
    gradient: "from-purple-600/15 to-purple-600/0",
    iconBg: "bg-purple-600/10 text-purple-600",
  },
  {
    icon: FileText,
    title: "Ficha médica digital",
    description: "Vacunas, alergias e historial siempre a mano.",
    gradient: "from-amber-500/15 to-amber-500/0",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description: "Nunca más te olvides de un control o vacuna.",
    gradient: "from-rose-500/15 to-rose-500/0",
    iconBg: "bg-rose-500/10 text-rose-600",
  },
];

const STEPS = [
  {
    n: "1",
    icon: PawPrint,
    title: "Crea el perfil de tu mascota",
    description: "Cárgalo en menos de 2 minutos. Foto, raza, edad y datos clínicos básicos.",
  },
  {
    n: "2",
    icon: Stethoscope,
    title: "Encuentra a tu veterinario",
    description: "Busca por comuna, especialidad y reseñas verificadas. Sin intermediarios.",
  },
  {
    n: "3",
    icon: Calendar,
    title: "Lleva el control en un solo lugar",
    description: "Vacunas, controles, recordatorios y documentos. Todo siempre a mano.",
  },
];

const STATS = [
  {
    n: "80%",
    label: "de dueños chilenos",
    desc: "no tiene la salud de su mascota al día.",
  },
  {
    n: "55%",
    label: "no actualiza vacunas",
    desc: "ni lleva un calendario de controles.",
  },
  {
    n: "27%",
    label: "tiene microchip",
    desc: "el resto vive con riesgo de extravío.",
  },
];

const FAQ = [
  {
    q: "¿Cuánto cuesta usar Paw Friend?",
    a: "Es gratis para dueños con 1 mascota. Si tienes más mascotas, puedes activar Premium desde $3.990/mes para registrar todas las que quieras y desbloquear funciones extra.",
  },
  {
    q: "¿Cómo encuentro un veterinario?",
    a: "Entra al directorio público de vets, filtra por comuna y especialidad, y revisa reseñas verificadas de otros dueños antes de reservar.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Sí. Tu información médica está protegida y solo tú decides con qué veterinario compartirla. Cumplimos con la normativa de protección de datos en Chile.",
  },
  {
    q: "Soy veterinario, ¿cómo me sumo?",
    a: "Tenemos planes específicos para clínicas y profesionales independientes. Ingresa a la sección 'Para veterinarios' para ver los planes y crear tu perfil.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Si el usuario ya esta logueado, la landing publica no tiene sentido:
  // lo mandamos directo al feed/home post-login. Evita doble click obligado.
  useEffect(() => {
    if (!authLoading && user) {
      navigate(LINKS.home(), { replace: true });
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <Hero />

      {/* 1. Tres beneficios concretos */}
      <section className="container px-4 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Todo en un solo lugar
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Todo lo que tu mascota necesita
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Sin apps separadas, sin papeles. Una sola cuenta para cuidar a quien más quieres.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {BENEFITS.map(({ icon: Icon, title, description, gradient, iconBg }) => (
            <Card
              key={title}
              className={`relative overflow-hidden border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br ${gradient}`}
            >
              <CardContent className="p-6 space-y-3 relative">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 1.5. Cómo funciona en 3 pasos */}
      <section className="container px-4 pb-16 md:pb-24">
        <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 mb-4">
            <PawPrint className="h-3.5 w-3.5" />
            Así de fácil
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            Empieza en 3 pasos
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Sin instalar nada. Funciona en tu teléfono y en tu computador.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          {/* Línea conectora desktop */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />

          {STEPS.map(({ n, icon: Icon, title, description }) => (
            <div key={n} className="relative flex flex-col items-center text-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-xl ring-8 ring-background">
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-purple-400 text-white font-black text-sm flex items-center justify-center shadow-md ring-4 ring-background">
                  {n}
                </span>
              </div>
              <h3 className="font-bold text-lg mt-5 mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 1.7. Stats del mercado chileno */}
      <section className="px-4 py-16 md:py-24 bg-gradient-to-br from-primary/5 via-purple-50 to-rose-50">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 mb-4">
              <Heart className="h-3.5 w-3.5 fill-rose-500" />
              ¿Por qué importa?
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              La salud de las mascotas en Chile
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Datos reales del mercado chileno. Por eso construimos Paw Friend.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STATS.map(({ n, label, desc }) => (
              <Card key={label} className="border-2 border-primary/10 bg-white/80 backdrop-blur hover:border-primary/30 transition-colors">
                <CardContent className="p-8 text-center space-y-2">
                  <div className="text-5xl md:text-6xl font-black bg-warm-gradient bg-clip-text text-transparent">
                    {n}
                  </div>
                  <div className="font-bold text-base">{label}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Fuentes: Vetivery, SUBDERE/UC · Mercado chileno 2024
          </p>
        </div>
      </section>

      {/* 2. CTA secundario para veterinarios */}
      <section className="container px-4 pb-16 md:pb-24">
        <Card className="max-w-4xl mx-auto border bg-muted/30">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-semibold">¿Eres veterinario?</h3>
              <p className="text-sm text-muted-foreground">
                Suma tu clínica al directorio y atiende más mascotas en tu comuna.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/para-veterinarios")}
              className="shrink-0 w-full md:w-auto h-11"
            >
              Ver planes para vets
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* 3. FAQ (below the fold) */}
      <section className="container px-4 py-16 md:py-20 border-t">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-8">
            Preguntas frecuentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map(({ q, a }, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
};

export default Index;

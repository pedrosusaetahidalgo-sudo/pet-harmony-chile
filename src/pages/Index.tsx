import { useNavigate } from "react-router-dom";
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
import { Stethoscope, FileText, Bell, ArrowRight } from "@/lib/icons";

const BENEFITS = [
  {
    icon: Stethoscope,
    title: "Veterinarios cerca",
    description: "Directorio con reseñas reales en toda Santiago.",
  },
  {
    icon: FileText,
    title: "Ficha médica digital",
    description: "Vacunas, alergias e historial siempre a mano.",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description: "Nunca más te olvides de un control o vacuna.",
  },
];

const FAQ = [
  {
    q: "¿Cuánto cuesta usar Paw Friend?",
    a: "Es gratis para dueños con 1 mascota. Si tienes más mascotas, puedes activar Premium desde $2.990/mes para registrar todas las que quieras y desbloquear funciones extra.",
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

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <Hero />

      {/* 1. Tres beneficios concretos */}
      <section className="container px-4 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Todo lo que tu mascota necesita
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Sin apps separadas, sin papeles. Una sola cuenta para cuidar a quien más quieres.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border hover:shadow-medium transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
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

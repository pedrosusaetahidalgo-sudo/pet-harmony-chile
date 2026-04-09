import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PawPrint, Bell, MapPin, X, ArrowRight } from "@/lib/icons";
import { useGoToAddPet } from "@/hooks/useCanAddPet";

const STORAGE_KEY = "pf_home_onboarding_dismissed";

interface Hint {
  id: string;
  icon: typeof PawPrint;
  title: string;
  description: string;
  cta: string;
  colorBg: string;
  colorIcon: string;
  colorBorder: string;
}

const hints: Hint[] = [
  {
    id: "pet",
    icon: PawPrint,
    title: "1. Agrega tu primera mascota",
    description: "Crea su perfil con foto, raza y datos médicos. Es el corazón de Paw Friend.",
    cta: "Agregar mascota",
    colorBg: "bg-purple-50",
    colorIcon: "text-purple-700 bg-purple-100",
    colorBorder: "border-l-purple-600",
  },
  {
    id: "reminder",
    icon: Bell,
    title: "2. Crea tu primer recordatorio",
    description: "Vacunas, desparasitaciones, controles: no se te pasa ninguno.",
    cta: "Ir a mis mascotas",
    colorBg: "bg-amber-50",
    colorIcon: "text-amber-700 bg-amber-100",
    colorBorder: "border-l-amber-500",
  },
  {
    id: "vet",
    icon: MapPin,
    title: "3. Encuentra tu vet en tu comuna",
    description: "Directorio de veterinarios verificados cerca tuyo.",
    cta: "Explorar veterinarios",
    colorBg: "bg-indigo-50",
    colorIcon: "text-indigo-700 bg-indigo-100",
    colorBorder: "border-l-indigo-500",
  },
];

interface Props {
  hasPets: boolean;
}

/**
 * Hints de onboarding dirigido para usuarios nuevos sin mascotas.
 * Se muestra como 3 cards secuenciales arriba del Home y se persiste
 * el dismiss en localStorage. Si el usuario ya tiene mascotas, no rendea.
 */
export function HomeOnboardingHints({ hasPets }: Props) {
  const navigate = useNavigate();
  const goToAddPet = useGoToAddPet();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (hasPets || dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  const handleAction = (id: string) => {
    if (id === "pet") goToAddPet();
    else if (id === "reminder") navigate("/my-pets");
    else if (id === "vet") navigate("/veterinarios");
  };

  return (
    <section aria-label="Primeros pasos" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Primeros pasos
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          aria-label="Ocultar primeros pasos"
          className="h-11 w-11 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {hints.map((h) => {
          const Icon = h.icon;
          return (
            <Card
              key={h.id}
              className={`border-l-4 ${h.colorBorder} ${h.colorBg}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className={`inline-flex p-2.5 rounded-full ${h.colorIcon}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{h.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {h.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAction(h.id)}
                  className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {h.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Home, PawPrint, Calendar, MapPin, Heart, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a Paw Friend!",
    description: "Tu red social para mascotas en Chile. Te guiaremos por las principales funciones para que aproveches al máximo la app.",
    icon: <PawPrint className="h-12 w-12" />,
    color: "from-primary to-secondary",
  },
  {
    id: "home",
    title: "Tu Inicio Personalizado",
    description: "Desde el Home puedes ver tus mascotas, próximas citas y accesos rápidos a todos los servicios. ¡Todo en un solo lugar!",
    icon: <Home className="h-12 w-12" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "pets",
    title: "Crea el Perfil de tu Mascota",
    description: "Registra a tus mascotas con fotos, información médica y documentos. Podrás gestionar vacunas, citas y mucho más.",
    icon: <PawPrint className="h-12 w-12" />,
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "services",
    title: "Reserva Servicios",
    description: "Encuentra paseadores, veterinarios a domicilio y cuidadores verificados. Reserva y paga de forma segura desde la app.",
    icon: <Calendar className="h-12 w-12" />,
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "map",
    title: "Explora el Mapa",
    description: "Descubre lugares pet-friendly cerca de ti: parques, restaurantes, tiendas y más. Todo en un mapa interactivo.",
    icon: <MapPin className="h-12 w-12" />,
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "social",
    title: "Pet Social",
    description: "Comparte fotos de tu mascota, conecta con otros dueños, dale like a publicaciones y haz nuevos amigos peludos.",
    icon: <Heart className="h-12 w-12" />,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "rewards",
    title: "Gana Recompensas",
    description: "Completa actividades con tu mascota, gana puntos y canjea descuentos en servicios y productos. ¡Diviértete cuidando a tu mascota!",
    icon: <Trophy className="h-12 w-12" />,
    color: "from-amber-500 to-yellow-500",
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (hasSeenTutorial) {
      setIsVisible(false);
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    setIsVisible(false);
    onComplete();
  };

  if (!isVisible) return null;

  const step = tutorialSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] animate-fade-in" />

      {/* Tutorial Card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg mx-auto animate-scale-in shadow-2xl border-0 overflow-hidden">
          {/* Gradient Header */}
          <div className={`bg-gradient-to-br ${step.color} p-8 text-white relative`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                {step.icon}
              </div>
              <h2 className="text-2xl font-bold">{step.title}</h2>
            </div>
          </div>

          <CardContent className="p-6">
            <p className="text-center text-muted-foreground text-lg leading-relaxed mb-6">
              {step.description}
            </p>

            {/* Progress Indicators */}
            <div className="flex gap-1.5 justify-center mb-6">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={cn(
                  "flex-1 text-white",
                  `bg-gradient-to-r ${step.color} hover:opacity-90`
                )}
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  "¡Comenzar!"
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip Link */}
            <button 
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
            >
              Saltar tutorial
            </button>

            {/* Step Counter */}
            <div className="text-center mt-2 text-xs text-muted-foreground">
              Paso {currentStep + 1} de {tutorialSteps.length}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

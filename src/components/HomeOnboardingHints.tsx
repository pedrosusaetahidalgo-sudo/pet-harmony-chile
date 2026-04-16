import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PawPrint, Bell, MapPin, ArrowRight, CheckCircle, Sparkles, Trophy } from '@/lib/icons';
import { useGoToAddPet } from '@/hooks/useCanAddPet';

const STORAGE_KEY = 'pf_onboarding_completed';

interface Hint {
  id: string;
  icon: typeof PawPrint;
  title: string;
  description: string;
  cta: string;
  colorBg: string;
  colorIcon: string;
  colorBorder: string;
  doneBg: string;
}

const hints: Hint[] = [
  {
    id: 'pet',
    icon: PawPrint,
    title: '1. Agrega tu primera mascota',
    description: 'Crea su perfil con foto, raza y datos médicos. Es el corazón de Paw Friend.',
    cta: 'Agregar mascota',
    colorBg: 'bg-purple-50',
    colorIcon: 'text-purple-700 bg-purple-100',
    colorBorder: 'border-l-purple-600',
    doneBg: 'bg-purple-50/50',
  },
  {
    id: 'reminder',
    icon: Bell,
    title: '2. Crea tu primer recordatorio',
    description: 'Vacunas, desparasitaciones, controles: no se te pasa ninguno.',
    cta: 'Ir a mis mascotas',
    colorBg: 'bg-amber-50',
    colorIcon: 'text-amber-700 bg-amber-100',
    colorBorder: 'border-l-amber-500',
    doneBg: 'bg-amber-50/50',
  },
  {
    id: 'vet',
    icon: MapPin,
    title: '3. Encuentra tu vet en tu comuna',
    description: 'Directorio de veterinarios verificados cerca tuyo.',
    cta: 'Explorar veterinarios',
    colorBg: 'bg-indigo-50',
    colorIcon: 'text-indigo-700 bg-indigo-100',
    colorBorder: 'border-l-indigo-500',
    doneBg: 'bg-indigo-50/50',
  },
  {
    id: 'pawpoints',
    icon: Trophy,
    title: '4. Gana PawPoints cuidando a tu mascota',
    description:
      'Cada accion (vacunar, pasear, socializar) suma puntos. Sube de nivel y desbloquea recompensas.',
    cta: 'Ver mis PawPoints',
    colorBg: 'bg-orange-50',
    colorIcon: 'text-orange-700 bg-orange-100',
    colorBorder: 'border-l-orange-500',
    doneBg: 'bg-orange-50/50',
  },
];

function getCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveCompleted(completed: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    // ignore
  }
}

interface Props {
  hasPets: boolean;
}

/**
 * Hints de onboarding dirigido para usuarios nuevos.
 * Se auto-oculta solo cuando las 3 acciones estan completadas.
 * Trackea cada accion individualmente en localStorage.
 */
export function HomeOnboardingHints({ hasPets }: Props) {
  const navigate = useNavigate();
  const goToAddPet = useGoToAddPet();
  const [completed, setCompleted] = useState<Set<string>>(getCompleted);
  const [showCelebration, setShowCelebration] = useState(false);

  // Auto-mark "pet" as done when hasPets becomes true
  useEffect(() => {
    if (hasPets && !completed.has('pet')) {
      const next = new Set(completed);
      next.add('pet');
      setCompleted(next);
      saveCompleted(next);
    }
  }, [hasPets, completed]);

  const markDone = (id: string) => {
    const next = new Set(completed);
    next.add(id);
    setCompleted(next);
    saveCompleted(next);
  };

  const handleAction = (id: string) => {
    markDone(id);
    if (id === 'pet') goToAddPet();
    else if (id === 'reminder') navigate('/my-pets');
    else if (id === 'vet') navigate('/veterinarios');
    else if (id === 'pawpoints') navigate('/misiones');
  };

  const allDone = completed.size >= hints.length;

  // Show celebration briefly then hide forever
  useEffect(() => {
    if (allDone && !showCelebration) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [allDone, showCelebration]);

  // Hide completely after celebration ends
  if (allDone && !showCelebration) return null;

  // Celebration state
  if (allDone && showCelebration) {
    return (
      <section aria-label="Onboarding completado" className="space-y-3">
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6 text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-green-100 text-green-700">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-green-900">Completaste los primeros pasos</h3>
            <p className="text-sm text-green-700">
              Tu mascota ya tiene perfil, recordatorios y un vet cerca. Paw Friend esta listo para
              ti.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label="Primeros pasos" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Primeros pasos — {completed.size}/{hints.length}
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {hints.map((h) => {
          const Icon = h.icon;
          const isDone = completed.has(h.id);
          return (
            <Card
              key={h.id}
              className={`border-l-4 ${h.colorBorder} ${isDone ? h.doneBg : h.colorBg} ${isDone ? 'opacity-70' : ''} transition-opacity`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex p-2.5 rounded-full ${h.colorIcon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {isDone && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
                <div>
                  <h3
                    className={`font-bold text-sm leading-tight ${isDone ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {h.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{h.description}</p>
                </div>
                {!isDone && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(h.id)}
                    className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {h.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

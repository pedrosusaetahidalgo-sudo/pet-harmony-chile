import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Users,
  Stethoscope,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  Search,
  Edit,
} from '@/lib/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STEP_LABELS = ['Tu perfil', 'Disponibilidad', 'Primer paciente'];

export default function OnboardingVetMinimal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const completeOnboarding = () => {
    localStorage.setItem('pf_vet_onboarding_complete', 'true');
    toast.success('Bienvenido a Paw Friend');
    navigate('/provider/dashboard');
  };

  const skipAll = () => {
    localStorage.setItem('pf_vet_onboarding_complete', 'true');
    toast('Bienvenido a Paw Friend');
    navigate('/provider/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        {/* Progress indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Paso {step} de 3</span>
            <span>{STEP_LABELS[step - 1]}</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          {/* ============ STEP 1: Complete your professional profile ============ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <User className="h-7 w-7 text-purple-600" />
                </div>
                <h1 className="font-display font-semibold text-3xl md:text-4xl mb-1 tracking-tight">
                  Completa tu perfil profesional
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tu perfil es tu carta de presentacion ante los duenos de mascotas.
                </p>
              </div>

              {/* What to complete */}
              <div className="space-y-3">
                {[
                  {
                    icon: Stethoscope,
                    title: 'Bio y especialidades',
                    desc: 'Cuenta tu experiencia y que tipo de animales atiendes.',
                  },
                  {
                    icon: MapPin,
                    title: 'Comuna y direccion',
                    desc: 'Para que los duenos te encuentren cerca de su ubicacion.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Foto profesional',
                    desc: 'Los perfiles con foto reciben 3x mas consultas.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                      <item.icon className="h-4.5 w-4.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA to profile edit */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                <p className="text-sm text-purple-700 mb-2">
                  Puedes editar tu perfil ahora o hacerlo despues desde tu dashboard.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem('pf_vet_onboarding_complete', 'true');
                    navigate('/provider/profile-edit');
                  }}
                  className="text-purple-700 border-purple-300 hover:bg-purple-100"
                >
                  <Edit className="h-4 w-4 mr-1" /> Editar perfil ahora
                </Button>
              </div>

              <Button className="w-full" size="lg" onClick={() => setStep(2)}>
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <button
                onClick={skipAll}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Omitir — lo hago despues
              </button>
            </div>
          )}

          {/* ============ STEP 2: Availability & bookings ============ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <Calendar className="h-7 w-7 text-emerald-600" />
                </div>
                <h1 className="font-display font-semibold text-3xl md:text-4xl mb-1 tracking-tight">
                  Configura tu disponibilidad
                </h1>
                <p className="text-sm text-muted-foreground">
                  Los duenos podran agendar contigo directamente desde la app.
                </p>
              </div>

              {/* How bookings work */}
              <div className="space-y-3">
                {[
                  {
                    icon: Clock,
                    title: 'Define tus horarios',
                    desc: 'Configura los dias y bloques horarios en que atiendes.',
                  },
                  {
                    icon: Search,
                    title: 'Los duenos te encuentran',
                    desc: 'Tu perfil aparece en el directorio publico filtrable por comuna.',
                  },
                  {
                    icon: Calendar,
                    title: 'Reservas automaticas',
                    desc: 'Recibes notificaciones de cada reserva. Confirmas o reprogramas desde tu dashboard.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                      <item.icon className="h-4.5 w-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transparency */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm font-medium text-emerald-800 mb-1">Modelo transparente</p>
                <p className="text-xs text-emerald-600">
                  Plan gratuito: comision del 10% por reserva completada. Sin costo fijo mensual.
                  Planes pagados reducen la comision hasta 0%.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atras
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <button
                onClick={skipAll}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Omitir
              </button>
            </div>
          )}

          {/* ============ STEP 3: Your first patient ============ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Users className="h-7 w-7 text-blue-600" />
                </div>
                <h1 className="font-display font-semibold text-3xl md:text-4xl mb-1 tracking-tight">
                  Tu primer paciente
                </h1>
                <p className="text-sm text-muted-foreground">
                  Asi es como los duenos llegan a ti y como puedes crear pacientes.
                </p>
              </div>

              {/* How patients work */}
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Los duenos te buscan',
                    desc: 'Desde el directorio publico de pawfriend.cl, filtrable por comuna y especialidad.',
                  },
                  {
                    step: '2',
                    title: 'Agendan una cita',
                    desc: 'Ven tus servicios, precios y disponibilidad. Reservan con un click.',
                  },
                  {
                    step: '3',
                    title: 'Creas el paciente',
                    desc: 'Desde tu panel puedes crear pacientes, incluso si el dueno no tiene cuenta aun.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key features */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-blue-800">Herramientas incluidas</p>
                </div>
                <ul className="space-y-1.5 ml-6">
                  {[
                    'Ficha clinica digital de cada paciente',
                    'Notas de consulta y plantillas post-consulta',
                    'Boton "Ver como me ven los duenos"',
                    'Analytics de tu consulta',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-blue-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preview hint */}
              <div className="p-3 bg-slate-50 rounded-lg border text-center">
                <p className="text-xs text-slate-500">
                  Desde tu dashboard podras ver exactamente como te ven los duenos con el boton{' '}
                  <span className="font-medium text-purple-600">"Ver como me ven los duenos"</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atras
                </Button>
                <Button className="flex-1" size="lg" onClick={completeOnboarding}>
                  Ir a mi dashboard <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Puedes explorar todo esto despues desde tu dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

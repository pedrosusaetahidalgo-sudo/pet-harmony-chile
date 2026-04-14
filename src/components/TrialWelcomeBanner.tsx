import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, X, Clock } from '@/lib/icons';
import { usePlan } from '@/hooks/usePlan';

const WELCOME_SHOWN_KEY = 'pf_trial_welcome_shown';

/**
 * Full-screen welcome overlay shown once after signup (trial activation).
 * Shows a celebratory animation with premium features.
 */
export function TrialWelcomeOverlay() {
  const { isTrialActive, trialDaysLeft } = usePlan();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isTrialActive) return;
    try {
      const shown = localStorage.getItem(WELCOME_SHOWN_KEY);
      if (!shown) {
        setShow(true);
        localStorage.setItem(WELCOME_SHOWN_KEY, '1');
      }
    } catch {
      // ignore
    }
  }, [isTrialActive]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-sm mx-4 animate-scale-in">
        {/* Shimmer background */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 via-amber-400 to-purple-500 opacity-75 blur-lg animate-pulse" />

        <Card className="relative border-2 border-purple-300 bg-white overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600" />

          <CardContent className="p-6 text-center space-y-4">
            {/* Animated crown */}
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-amber-400 blur-xl opacity-60 animate-pulse" />
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center shadow-lg">
                <Crown className="h-10 w-10 text-white animate-bounce" strokeWidth={2} />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-amber-600 bg-clip-text text-transparent">
                Bienvenido a Premium
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tienes <strong className="text-purple-700">{trialDaysLeft} dias gratis</strong> para
                probar todo
              </p>
            </div>

            <div className="space-y-2 text-left">
              {[
                'Mascotas ilimitadas',
                'Ficha clinica PDF descargable',
                'Compartir ficha con veterinarios',
                'Asistente IA ilimitado',
                'OCR de carnet de vacunas',
                'Analytics y reportes',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Sin tarjeta de credito. Al terminar los {trialDaysLeft} dias, tu cuenta pasa al plan
              gratuito automaticamente.
            </p>

            <Button
              onClick={() => setShow(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:opacity-90 text-white font-semibold"
            >
              Empezar a explorar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Compact banner for Home showing trial days remaining.
 * Dismissible per session.
 */
export function TrialBanner() {
  const { isTrialActive, trialDaysLeft, isPremium } = usePlan();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!isTrialActive || dismissed) return null;

  const isUrgent = trialDaysLeft <= 3;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
        isUrgent
          ? 'bg-red-50 border border-red-200'
          : 'bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-200'
      }`}
    >
      <div className={`p-1.5 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-purple-100'}`}>
        {isUrgent ? (
          <Clock className="h-4 w-4 text-red-600" />
        ) : (
          <Crown className="h-4 w-4 text-purple-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${isUrgent ? 'text-red-800' : 'text-purple-900'}`}>
          {isUrgent
            ? `Tu trial Premium vence en ${trialDaysLeft} dia${trialDaysLeft !== 1 ? 's' : ''}`
            : `Premium activo — ${trialDaysLeft} dias restantes`}
        </p>
        <p className={`text-[10px] ${isUrgent ? 'text-red-600' : 'text-purple-600'}`}>
          {isUrgent
            ? 'Suscribete para no perder acceso a tus features Premium'
            : 'Disfruta todas las features sin limite'}
        </p>
      </div>
      {isUrgent && (
        <Button
          size="sm"
          onClick={() => navigate('/upgrade')}
          className="bg-red-600 hover:bg-red-700 text-white text-xs h-7 px-2 flex-shrink-0"
        >
          Suscribirse
        </Button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground flex-shrink-0"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

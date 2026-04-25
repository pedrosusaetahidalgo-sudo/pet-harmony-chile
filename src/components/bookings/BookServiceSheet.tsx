/**
 * BookServiceSheet — bottom sheet con 4 cards de servicios para reservar.
 *
 * Refactor 2026-04-25: aplicación filosofía FICHA_TABS_V2.
 * Antes: el dueño tocaba "Agendar cita" → iba a /veterinarios → buscaba.
 *        O exploraba /servicios → elegía tipo → directorio → reservaba.
 *        2-3 pasos antes del directorio.
 * Después: tap → 4 cards visibles → tap servicio → directorio filtrado.
 *
 * Sin cambios de lógica de booking — solo punto de entrada más claro.
 */
import { useNavigate } from 'react-router-dom';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Stethoscope, Sparkles, MapPin, MoreHorizontal } from 'lucide-react';

interface BookServiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ServiceCard {
  key: string;
  label: string;
  description: string;
  Icon: typeof Stethoscope;
  iconBg: string;
  iconColor: string;
  to: string;
}

const SERVICES: ServiceCard[] = [
  {
    key: 'vet',
    label: 'Veterinario',
    description: 'Control, urgencia, vacuna, especialista.',
    Icon: Stethoscope,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    to: '/veterinarios',
  },
  {
    key: 'grooming',
    label: 'Peluquería',
    description: 'Baño, corte de pelo, uñas.',
    Icon: Sparkles,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    to: '/services/groomer',
  },
  {
    key: 'walker',
    label: 'Paseador / Sitter',
    description: 'Paseo, cuidado en casa, hospedaje.',
    Icon: MapPin,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    to: '/services/walker',
  },
  {
    key: 'other',
    label: 'Otro servicio',
    description: 'Entrenamiento, fotografía, etc.',
    Icon: MoreHorizontal,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    to: '/servicios',
  },
];

export function BookServiceSheet({ open, onOpenChange }: BookServiceSheetProps) {
  const navigate = useNavigate();

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="¿Qué necesitás?"
      description="Te llevamos al directorio justo. Sin formularios."
    >
      <div className="grid grid-cols-2 gap-3 px-4 pb-6">
        {SERVICES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              navigate(s.to);
              onOpenChange(false);
            }}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-transparent hover:border-purple-300 transition-all text-left ${s.iconBg}`}
          >
            <div className="inline-flex h-9 w-9 rounded-full bg-white items-center justify-center">
              <s.Icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div>
              <p className="font-semibold text-sm">{s.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{s.description}</p>
            </div>
          </button>
        ))}
      </div>
    </ResponsiveModal>
  );
}

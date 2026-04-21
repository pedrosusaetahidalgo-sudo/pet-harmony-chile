/**
 * AdminLeadsCRM — sub-componentes reutilizables.
 * Extraido de AdminLeadsCRM.tsx (E.3 auditoria top-tier 2026-04-21).
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, MessageSquare, Mail, Instagram } from '@/lib/icons';
import type { VetLead, EstadoLead } from '@/hooks/useLeadsVets';
import { ESTADOS } from './constants';

// ── Stat card (panel KPIs) ─────────────────────────────────
export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-white',
  suffix = '',
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  suffix?: string;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className={`text-xl font-bold ${color}`}>
            {value}
            {suffix}
          </p>
          <p className="text-[10px] text-slate-400 uppercase">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Badges ─────────────────────────────────────────────────
export function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const styles: Record<string, string> = {
    alta: 'bg-red-500/20 text-red-300 border-red-500/30',
    media: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    baja: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[prioridad] || styles.baja}`}>
      {prioridad}
    </Badge>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const config = ESTADOS.find((e) => e.value === estado) || ESTADOS[0];
  return (
    <Badge className={`${config.color} text-white text-[10px] border-none`}>{config.label}</Badge>
  );
}

// ── Lead row (fila de tabla de leads con canales de contacto) ──
export function LeadRow({
  lead,
  isSelected,
  onToggleSelect,
  onOpenDetail,
}: {
  lead: VetLead;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenDetail: () => void;
  onQuickUpdateEstado: (estado: EstadoLead) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${
        isSelected ? 'bg-indigo-900/20' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="rounded border-slate-600 shrink-0"
        onClick={(e) => e.stopPropagation()}
        aria-label="Seleccionar lead"
      />

      <div
        className="flex-1 min-w-0"
        onClick={onOpenDetail}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white truncate">{lead.nombre_completo}</span>
          <PrioridadBadge prioridad={lead.prioridad_outreach} />
          <EstadoBadge estado={lead.estado_validacion} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
          {lead.instagram && <span>@{lead.instagram}</span>}
          {lead.comunas_cobertura?.length > 0 && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {lead.comunas_cobertura.slice(0, 2).join(', ')}
              {lead.comunas_cobertura.length > 2 && ` +${lead.comunas_cobertura.length - 2}`}
            </span>
          )}
          <span>{lead.fuente_dato}</span>
          {lead.intentos_contacto > 0 && (
            <span className="text-blue-400">{lead.intentos_contacto}x contactado</span>
          )}
        </div>
      </div>

      {/* Canales disponibles */}
      <div className="flex gap-1 shrink-0">
        {lead.whatsapp && (
          <a
            href={`https://wa.me/${lead.whatsapp.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-green-900/30 text-green-400"
            title="WhatsApp"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-blue-900/30 text-blue-400"
            title="Email"
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        )}
        {lead.instagram && (
          <a
            href={`https://instagram.com/${lead.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-pink-900/30 text-pink-400"
            title="Instagram"
          >
            <Instagram className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

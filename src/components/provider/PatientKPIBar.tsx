import { Card, CardContent } from '@/components/ui/card';
import { Users, Stethoscope, AlertTriangle, Clock, UserPlus } from '@/lib/icons';

interface KPI {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  ring: string;
  filterKey: string;
  // Si viene, el click llama a este handler en vez de onFilterChange
  onClickOverride?: () => void;
}

interface PatientKPIBarProps {
  totalActive: number;
  todayCount: number;
  overdueFollowups: number;
  pendingClaim: number;
  /** Vinculaciones dueno-vet por confirmar (solicitudes pending). */
  pendingLinks: number;
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
  /** Click en KPI Vinculaciones scroll al banner (no filtra el listado
   *  porque las vinculaciones se resuelven desde su propio banner rojo). */
  onClickPendingLinks?: () => void;
}

export function PatientKPIBar({
  totalActive,
  todayCount,
  overdueFollowups,
  pendingClaim,
  pendingLinks,
  activeFilter,
  onFilterChange,
  onClickPendingLinks,
}: PatientKPIBarProps) {
  const kpis: KPI[] = [
    {
      label: 'Activos',
      value: totalActive,
      icon: Users,
      color: 'text-teal-600',
      ring: 'ring-teal-500',
      filterKey: 'active',
    },
    {
      label: 'Hoy',
      value: todayCount,
      icon: Stethoscope,
      color: 'text-blue-600',
      ring: 'ring-blue-500',
      filterKey: 'today',
    },
    {
      label: 'Seguim. vencidos',
      value: overdueFollowups,
      icon: AlertTriangle,
      color: 'text-red-600',
      ring: 'ring-red-500',
      filterKey: 'overdue',
    },
    {
      label: 'Vinculaciones',
      value: pendingLinks,
      icon: UserPlus,
      color: pendingLinks > 0 ? 'text-red-600' : 'text-gray-400',
      ring: 'ring-red-500',
      filterKey: 'pending_links',
      onClickOverride: onClickPendingLinks,
    },
    {
      label: 'Pendiente reclamo',
      value: pendingClaim,
      icon: Clock,
      color: 'text-gray-500',
      ring: 'ring-gray-400',
      filterKey: 'pending_claim',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.filterKey;
        const clickable = !!kpi.onClickOverride || kpi.value >= 0;
        const handleClick = () => {
          if (kpi.onClickOverride) kpi.onClickOverride();
          else onFilterChange(isSelected ? null : kpi.filterKey);
        };
        return (
          <Card
            key={kpi.filterKey}
            className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? `ring-2 ${kpi.ring} shadow-md` : ''} ${!clickable ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={clickable ? handleClick : undefined}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground truncate">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

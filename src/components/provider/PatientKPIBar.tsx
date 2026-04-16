import { Card, CardContent } from '@/components/ui/card';
import { Users, Stethoscope, AlertTriangle, Clock } from '@/lib/icons';

interface KPI {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  filterKey: string;
}

interface PatientKPIBarProps {
  totalActive: number;
  todayCount: number;
  overdueFollowups: number;
  pendingClaim: number;
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
}

export function PatientKPIBar({
  totalActive,
  todayCount,
  overdueFollowups,
  pendingClaim,
  activeFilter,
  onFilterChange,
}: PatientKPIBarProps) {
  const kpis: KPI[] = [
    {
      label: 'Activos',
      value: totalActive,
      icon: Users,
      color: 'text-teal-600',
      filterKey: 'active',
    },
    {
      label: 'Hoy',
      value: todayCount,
      icon: Stethoscope,
      color: 'text-blue-600',
      filterKey: 'today',
    },
    {
      label: 'Seguim. vencidos',
      value: overdueFollowups,
      icon: AlertTriangle,
      color: 'text-red-600',
      filterKey: 'overdue',
    },
    {
      label: 'Pendiente reclamo',
      value: pendingClaim,
      icon: Clock,
      color: 'text-gray-500',
      filterKey: 'pending_claim',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isSelected = activeFilter === kpi.filterKey;
        return (
          <Card
            key={kpi.filterKey}
            className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-teal-500 shadow-md' : ''}`}
            onClick={() => onFilterChange(isSelected ? null : kpi.filterKey)}
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

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mic, Calendar, Stethoscope } from '@/lib/icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type DashboardPeriod = 'current_month' | 'last_month' | 'last_3_months';

interface QuickActionsBarProps {
  displayName: string;
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
  onNewPatient: () => void;
  onRecordConsultation: () => void;
}

export function QuickActionsBar({
  displayName,
  period,
  onPeriodChange,
  onNewPatient,
  onRecordConsultation,
}: QuickActionsBarProps) {
  const navigate = useNavigate();
  const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });
  const firstName = displayName?.split(/\s+/)[0] || 'Doctor';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-50 border border-teal-200">
          <Stethoscope className="h-5 w-5 text-teal-700" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-xl md:text-2xl text-slate-900 tracking-tight">
            Dr. {firstName}
          </h2>
          <p className="text-xs text-slate-500 capitalize">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={onNewPatient}
          className="gap-1.5 text-xs bg-teal-700 hover:bg-teal-600 text-white"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nuevo paciente</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRecordConsultation}
          className="gap-1.5 text-xs border-slate-300"
        >
          <Mic className="h-3.5 w-3.5 text-red-500" />
          <span className="hidden sm:inline">Grabar consulta</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/calendario')}
          className="gap-1.5 text-xs border-slate-300"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Calendario</span>
        </Button>

        <Select value={period} onValueChange={(v) => onPeriodChange(v as DashboardPeriod)}>
          <SelectTrigger className="w-[130px] h-8 text-xs border-slate-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_month">Este mes</SelectItem>
            <SelectItem value="last_month">Mes pasado</SelectItem>
            <SelectItem value="last_3_months">3 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

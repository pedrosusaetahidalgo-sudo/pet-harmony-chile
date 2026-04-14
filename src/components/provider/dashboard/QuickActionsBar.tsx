import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Mic, Calendar } from '@/lib/icons';
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
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  const firstName = displayName?.split(/\s+/)[0] || 'Doc';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">Hola, {firstName}</h2>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={onNewPatient} className="gap-1.5 text-xs">
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nuevo paciente</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRecordConsultation}
          className="gap-1.5 text-xs"
        >
          <Mic className="h-3.5 w-3.5 text-red-500" />
          <span className="hidden sm:inline">Grabar consulta</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/calendario')}
          className="gap-1.5 text-xs"
        >
          <Calendar className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Calendario</span>
        </Button>

        <Select value={period} onValueChange={(v) => onPeriodChange(v as DashboardPeriod)}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
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

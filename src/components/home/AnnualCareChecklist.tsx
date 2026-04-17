import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ClipboardList } from '@/lib/icons';
import { useReminders } from '@/hooks/useReminders';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LINKS } from '@/lib/links';

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  reminderTypes: string[];
}

const ANNUAL_CHECKLIST: ChecklistItem[] = [
  {
    key: 'vaccine',
    label: 'Vacunas al día',
    description: 'Antirrábica y polivalente dentro de los últimos 12 meses',
    reminderTypes: ['vaccine'],
  },
  {
    key: 'checkup',
    label: 'Control veterinario',
    description: 'Al menos 1 visita al vet en los últimos 6 meses',
    reminderTypes: ['checkup'],
  },
  {
    key: 'deworming',
    label: 'Desparasitación',
    description: 'Interna cada 3 meses, externa según indicación',
    reminderTypes: ['deworming'],
  },
  {
    key: 'flea',
    label: 'Antipulgas / garrapatas',
    description: 'Tratamiento preventivo vigente',
    reminderTypes: ['flea'],
  },
  {
    key: 'dental',
    label: 'Salud dental',
    description: 'Revisión o limpieza dental anual',
    reminderTypes: ['dental'],
  },
  {
    key: 'weight',
    label: 'Control de peso',
    description: 'Peso registrado en los últimos 3 meses',
    reminderTypes: ['weight'],
  },
];

interface Props {
  petId: string;
  petName: string;
}

export function AnnualCareChecklist({ petId, petName }: Props) {
  const navigate = useNavigate();
  const { reminders } = useReminders();

  const checkedItems = useMemo(() => {
    const petReminders = reminders.filter((r) => r.pet_id === petId);
    const now = new Date();
    const checked = new Set<string>();

    ANNUAL_CHECKLIST.forEach((item) => {
      const matching = petReminders.filter((r) => item.reminderTypes.includes(r.type));
      // Item is "done" if there's a completed reminder of this type in the last relevant period
      const hasRecent = matching.some((r) => {
        if (!r.is_completed || !r.completed_at) return false;
        const completedDate = new Date(r.completed_at);
        const monthsAgo = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        // Vaccines/dental/checkup: within 12 months. Others: within 3 months.
        const threshold = ['vaccine', 'dental', 'checkup'].includes(item.key) ? 12 : 3;
        return monthsAgo <= threshold;
      });
      if (hasRecent) checked.add(item.key);
    });

    return checked;
  }, [reminders, petId]);

  const total = ANNUAL_CHECKLIST.length;
  const done = checkedItems.size;
  const pct = Math.round((done / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-purple-500" />
            Checklist anual de {petName}
          </CardTitle>
          <span className="text-xs font-bold text-purple-600">{pct}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
          <div
            className="h-full bg-purple-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {ANNUAL_CHECKLIST.map((item) => {
          const isDone = checkedItems.has(item.key);
          return (
            <div
              key={item.key}
              className={cn(
                'flex items-start gap-2.5 p-2 rounded-lg transition-colors',
                isDone ? 'bg-green-50/50' : 'hover:bg-muted/50'
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', isDone && 'text-green-800')}>
                  {item.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
        {done < total && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-7 mt-1"
            onClick={() => navigate(LINKS.remindersTab())}
          >
            Crear recordatorios para lo pendiente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const DAYS = [
  { value: 1, label: 'L' },
  { value: 2, label: 'M' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'J' },
  { value: 5, label: 'V' },
  { value: 6, label: 'S' },
  { value: 0, label: 'D' },
];

const PRESETS = [
  { label: 'Todos los dias', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Dias de semana', days: [1, 2, 3, 4, 5] },
  { label: 'Fines de semana', days: [0, 6] },
];

interface DaySelectorProps {
  value: number[];
  onChange: (days: number[]) => void;
}

export function DaySelector({ value, onChange }: DaySelectorProps) {
  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {DAYS.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => toggle(d.value)}
            className={cn(
              'h-9 w-9 rounded-full text-xs font-medium transition-colors',
              'border border-border hover:border-purple-300',
              value.includes(d.value)
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-background text-muted-foreground'
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

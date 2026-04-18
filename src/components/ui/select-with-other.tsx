import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectWithOtherProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
  disabled?: boolean;
}

/**
 * Select que incluye una opcion "Otro". Cuando se elige, aparece un input
 * libre y el valor se guarda LIMPIO (sin prefijo). El modo "otro" se
 * infiere automaticamente al montar si el value no matchea ningun option
 * (retrocompat con datos tipo "Tabby" sin prefijo).
 */
export function SelectWithOther({
  options,
  value,
  onValueChange,
  placeholder = 'Selecciona...',
  otherLabel = 'Otro',
  otherPlaceholder = 'Especifica...',
  disabled,
}: SelectWithOtherProps) {
  // Retrocompat: datos antiguos pueden venir con prefijo "otro:" — lo limpiamos.
  React.useEffect(() => {
    if (value.startsWith('otro:')) {
      onValueChange(value.slice(5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inCatalog = options.some((opt) => opt.value === value);
  const [otherMode, setOtherMode] = React.useState<boolean>(() => !!value && !inCatalog);

  React.useEffect(() => {
    if (inCatalog && otherMode) setOtherMode(false);
  }, [inCatalog, otherMode]);

  const selectValue = otherMode || (!inCatalog && !!value) ? '__other__' : value;

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === '__other__') {
            onValueChange('');
            setOtherMode(true);
          } else {
            onValueChange(v);
            setOtherMode(false);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          <SelectItem value="__other__">{otherLabel}</SelectItem>
        </SelectContent>
      </Select>
      {otherMode && (
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={otherPlaceholder}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- input "Otro" aparece tras seleccionar opcion, el foco debe ir ahi
          autoFocus
        />
      )}
    </div>
  );
}

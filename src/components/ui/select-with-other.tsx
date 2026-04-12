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
 * Select dropdown that includes an "Otro" option.
 * When "Otro" is selected, a free-text input appears below.
 * The value is stored as "otro:texto" for custom entries.
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
  const isOtherValue = value.startsWith('otro:');
  const selectValue = isOtherValue ? 'otro' : value;
  const otherText = isOtherValue ? value.slice(5) : '';

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === 'otro') {
            onValueChange('otro:');
          } else {
            onValueChange(v);
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
          <SelectItem value="otro">{otherLabel}</SelectItem>
        </SelectContent>
      </Select>
      {selectValue === 'otro' && (
        <Input
          value={otherText}
          onChange={(e) => onValueChange(`otro:${e.target.value}`)}
          placeholder={otherPlaceholder}
          autoFocus
        />
      )}
    </div>
  );
}

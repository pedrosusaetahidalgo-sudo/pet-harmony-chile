import * as React from 'react';
import { Check, ChevronsUpDown } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxWithOtherProps {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  otherLabel?: string;
  otherPlaceholder?: string;
  disabled?: boolean;
}

/**
 * Searchable combobox (Command + Popover) with an "Otro" option.
 * When "Otro" is selected, a free-text input appears below.
 * The value is stored as "otro:texto" for custom entries.
 */
export function ComboboxWithOther({
  options,
  value,
  onValueChange,
  placeholder = 'Selecciona...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontró.',
  otherLabel = 'Otro',
  otherPlaceholder = 'Especifica...',
  disabled,
}: ComboboxWithOtherProps) {
  const [open, setOpen] = React.useState(false);

  const isOtherValue = value.startsWith('otro:');
  const otherText = isOtherValue ? value.slice(5) : '';

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = isOtherValue
    ? otherText
      ? `Otro: ${otherText}`
      : 'Otro'
    : (selectedOption?.label ?? '');

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className="truncate">
              {displayLabel || <span className="text-muted-foreground">{placeholder}</span>}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onValueChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === opt.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
                <CommandItem
                  value={otherLabel}
                  onSelect={() => {
                    onValueChange('otro:');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', isOtherValue ? 'opacity-100' : 'opacity-0')}
                  />
                  {otherLabel}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {isOtherValue && (
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

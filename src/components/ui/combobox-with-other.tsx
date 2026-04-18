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
 * Cuando el usuario elige "Otro", aparece un input libre y el valor se
 * guarda LIMPIO (sin prefijo). El modo "otro" se infiere automaticamente
 * al montar si `value` no matchea ningun option (retrocompat con datos
 * existentes tipo "Tabby" sin prefijo).
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

  // Retrocompat: datos antiguos pueden venir con prefijo "otro:" — lo limpiamos.
  React.useEffect(() => {
    if (value.startsWith('otro:')) {
      onValueChange(value.slice(5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inCatalog = options.some((opt) => opt.value === value);
  const [otherMode, setOtherMode] = React.useState<boolean>(() => !!value && !inCatalog);

  // Si el value cambia desde afuera y matchea catalog, salimos de otherMode.
  React.useEffect(() => {
    if (inCatalog && otherMode) setOtherMode(false);
  }, [inCatalog, otherMode]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption
    ? selectedOption.label
    : otherMode
      ? value
        ? `${otherLabel}: ${value}`
        : otherLabel
      : '';

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
                      setOtherMode(false);
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
                    onValueChange('');
                    setOtherMode(true);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      otherMode && !inCatalog ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {otherLabel}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface InboxFilters {
  searchQuery: string;
  serviceType: string; // 'all' | tipo especifico
  fromDate: string; // ''=sin filtro, "YYYY-MM-DD"
  toDate: string;
}

interface InboxFiltersBarProps {
  value: InboxFilters;
  onChange: (next: InboxFilters) => void;
  /** Opciones de tipo de servicio. Si no se pasan, se usa el set default vet. */
  serviceTypeOptions?: { value: string; label: string }[];
}

const DEFAULT_SERVICE_TYPES = [
  { value: 'all', label: 'Todos los servicios' },
  { value: 'consulta_general', label: 'Consulta general' },
  { value: 'vacunacion', label: 'Vacunacion' },
  { value: 'cirugia', label: 'Cirugia' },
  { value: 'emergencia', label: 'Emergencia' },
  { value: 'dental', label: 'Dental' },
];

// eslint-disable-next-line react-refresh/only-export-components -- constante co-ubicada con su consumidor directo
export const EMPTY_INBOX_FILTERS: InboxFilters = {
  searchQuery: '',
  serviceType: 'all',
  fromDate: '',
  toDate: '',
};

export function InboxFiltersBar({
  value,
  onChange,
  serviceTypeOptions = DEFAULT_SERVICE_TYPES,
}: InboxFiltersBarProps) {
  const hasAnyFilter =
    value.searchQuery.trim() !== '' ||
    value.serviceType !== 'all' ||
    value.fromDate !== '' ||
    value.toDate !== '';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            inputMode="search"
            placeholder="Buscar por mascota o dueno"
            value={value.searchQuery}
            onChange={(e) => onChange({ ...value, searchQuery: e.target.value })}
            className="pl-8 h-9 text-sm"
            aria-label="Buscar en bandeja"
          />
        </div>

        <Select
          value={value.serviceType}
          onValueChange={(v) => onChange({ ...value, serviceType: v })}
        >
          <SelectTrigger
            className="h-9 text-sm w-full sm:w-[180px]"
            aria-label="Filtrar por servicio"
          >
            <SelectValue placeholder="Servicio" />
          </SelectTrigger>
          <SelectContent>
            {serviceTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={value.fromDate}
          onChange={(e) => onChange({ ...value, fromDate: e.target.value })}
          aria-label="Fecha desde"
          className="h-9 text-sm w-full sm:w-[150px]"
        />

        <Input
          type="date"
          value={value.toDate}
          onChange={(e) => onChange({ ...value, toDate: e.target.value })}
          aria-label="Fecha hasta"
          className="h-9 text-sm w-full sm:w-[150px]"
        />
      </div>

      {hasAnyFilter && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Filtros activos se aplican a todas las pestanas.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onChange(EMPTY_INBOX_FILTERS)}
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}

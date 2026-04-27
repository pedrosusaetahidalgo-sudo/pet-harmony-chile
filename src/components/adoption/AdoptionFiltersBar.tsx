/**
 * Barra de filtros para feed unificado de adopcion.
 * Ver REFACTOR_ADOPCION_2026_04_24.md §2.4.
 */
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { AdoptionFilters } from '@/hooks/useAdoptionFeed';

interface AdoptionFiltersBarProps {
  filters: AdoptionFilters;
  onChange: (filters: AdoptionFilters) => void;
  hideSourceFilter?: boolean;
}

const ALL_VALUE = '__all__';

export function AdoptionFiltersBar({
  filters,
  onChange,
  hideSourceFilter,
}: AdoptionFiltersBarProps) {
  const hasAnyFilter =
    filters.comuna || filters.species || filters.size || filters.ageBucket || filters.sourceFilter;

  const update = (patch: Partial<AdoptionFilters>) => onChange({ ...filters, ...patch });

  const clear = () => onChange({});

  return (
    <div className="flex flex-wrap items-end gap-2 sm:gap-3 p-3 bg-muted/30 rounded-xl">
      <div className="flex-1 min-w-[140px]">
        <label
          htmlFor="adoption-filter-comuna"
          className="text-xs text-muted-foreground mb-1 block"
        >
          Comuna
        </label>
        <Input
          id="adoption-filter-comuna"
          type="text"
          placeholder="Ej: Providencia"
          value={filters.comuna ?? ''}
          onChange={(e) => update({ comuna: e.target.value || undefined })}
          className="h-9"
        />
      </div>

      <div className="min-w-[120px]">
        <label
          htmlFor="adoption-filter-species"
          className="text-xs text-muted-foreground mb-1 block"
        >
          Especie
        </label>
        <Select
          value={filters.species ?? ALL_VALUE}
          onValueChange={(v) => update({ species: v === ALL_VALUE ? undefined : v })}
        >
          <SelectTrigger id="adoption-filter-species" className="h-9">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            <SelectItem value="perro">Perro</SelectItem>
            <SelectItem value="gato">Gato</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[120px]">
        <label htmlFor="adoption-filter-size" className="text-xs text-muted-foreground mb-1 block">
          Tamaño
        </label>
        <Select
          value={filters.size ?? ALL_VALUE}
          onValueChange={(v) => update({ size: v === ALL_VALUE ? undefined : v })}
        >
          <SelectTrigger id="adoption-filter-size" className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos</SelectItem>
            <SelectItem value="chico">Chico</SelectItem>
            <SelectItem value="mediano">Mediano</SelectItem>
            <SelectItem value="grande">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[120px]">
        <label htmlFor="adoption-filter-age" className="text-xs text-muted-foreground mb-1 block">
          Edad
        </label>
        <Select
          value={filters.ageBucket ?? ALL_VALUE}
          onValueChange={(v) => update({ ageBucket: v === ALL_VALUE ? undefined : v })}
        >
          <SelectTrigger id="adoption-filter-age" className="h-9">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas</SelectItem>
            <SelectItem value="cachorro">Cachorro (&lt;6m)</SelectItem>
            <SelectItem value="joven">Joven (6m-2a)</SelectItem>
            <SelectItem value="adulto">Adulto (2-8a)</SelectItem>
            <SelectItem value="senior">Senior (8+a)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hideSourceFilter && (
        <div className="min-w-[140px]">
          <label
            htmlFor="adoption-filter-source"
            className="text-xs text-muted-foreground mb-1 block"
          >
            Origen
          </label>
          <Select
            value={filters.sourceFilter ?? 'all'}
            onValueChange={(v) => update({ sourceFilter: v as AdoptionFilters['sourceFilter'] })}
          >
            <SelectTrigger id="adoption-filter-source" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="shelters_only">Solo refugios</SelectItem>
              <SelectItem value="owners_only">Solo particulares</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {hasAnyFilter && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-9 gap-1">
          <X className="h-3 w-3" /> Limpiar
        </Button>
      )}
    </div>
  );
}

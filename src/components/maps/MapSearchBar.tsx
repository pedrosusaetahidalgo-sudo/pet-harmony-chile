/**
 * MapSearchBar — barra de busqueda flotante para el mapa.
 * Busca en providers, shelters, partners y pet friendly places locales.
 * Si Google Maps API esta disponible, tambien busca direcciones.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, LocateFixed, Loader2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

export interface MapSearchResult {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  subtitle?: string;
}

interface MapSearchBarProps {
  /** All searchable items from the map data (providers, shelters, etc.) */
  searchableItems: MapSearchResult[];
  /** Called when user selects a result */
  onSelectResult: (result: MapSearchResult) => void;
  /** Called when user taps the locate button */
  onLocateMe: () => void;
  /** Whether geolocation is in progress */
  locating?: boolean;
  className?: string;
}

export function MapSearchBar({
  searchableItems,
  onSelectResult,
  onLocateMe,
  locating = false,
  className,
}: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter results based on query
  const search = useCallback(
    (q: string) => {
      if (!q.trim() || q.length < 2) {
        setResults([]);
        return;
      }
      const lower = q.toLowerCase();
      const matched = searchableItems
        .filter(
          (item) =>
            item.name.toLowerCase().includes(lower) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(lower))
        )
        .slice(0, 6);
      setResults(matched);
    },
    [searchableItems]
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (result: MapSearchResult) => {
    setQuery(result.name);
    setFocused(false);
    setResults([]);
    onSelectResult(result);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const typeLabels: Record<string, string> = {
    veterinarian: 'Veterinaria',
    dog_walker: 'Paseador',
    dogsitter: 'Cuidador',
    trainer: 'Entrenador',
    grooming: 'Grooming',
    shelter: 'Refugio',
    store: 'Tienda',
    petFriendly: 'Pet Friendly',
    lost: 'Perdida',
    adoption: 'Adopcion',
  };

  const showDropdown = focused && results.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 h-11 px-3">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Buscar veterinaria, refugio, comuna..."
          aria-label="Buscar en el mapa"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 min-w-0"
        />
        {query && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <button
          onClick={onLocateMe}
          disabled={locating}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          title="Mi ubicacion"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4 text-primary" />
          )}
        </button>
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-[240px] overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="flex items-start gap-3 w-full px-3 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
            >
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{result.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {typeLabels[result.type] || result.type}
                  {result.subtitle && ` · ${result.subtitle}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Vista unificada de adopcion (cuando ADOPTION_UNIFIED_FEED=true).
 *
 * Reemplaza al feed legacy con 4 tabs cuando el flag esta activo.
 * Estructura: 2 tabs principales (Mascotas / Refugios) + filtros + cards uniformes.
 *
 * Ver REFACTOR_ADOPCION_2026_04_24.md §2.4-2.5.
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackRefactor, RefactorEvent } from '@/lib/refactorAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Building2, Search } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { LINKS } from '@/lib/links';
import {
  useAdoptionFeed,
  useShelterDirectory,
  type AdoptionFilters,
} from '@/hooks/useAdoptionFeed';
import { AdoptableItemCard } from './AdoptableItemCard';
import { AdoptionFiltersBar } from './AdoptionFiltersBar';

const VALID_TABS = ['mascotas', 'refugios'] as const;
type TabValue = (typeof VALID_TABS)[number];

export function AdoptionUnifiedView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromUrl = searchParams.get('tab');
  const initialTab: TabValue = (VALID_TABS as readonly string[]).includes(tabFromUrl ?? '')
    ? (tabFromUrl as TabValue)
    : 'mascotas';

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [filters, setFilters] = useState<AdoptionFilters>({});

  const { data: feedItems, isLoading: feedLoading } = useAdoptionFeed(filters);
  const { data: shelters, isLoading: sheltersLoading } = useShelterDirectory({
    comuna: filters.comuna,
  });

  useEffect(() => {
    trackRefactor(RefactorEvent.adoptionFeedViewed, { initial_tab: initialTab });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const filterCount = Object.values(filters).filter(Boolean).length;
    if (filterCount > 0) {
      trackRefactor(RefactorEvent.adoptionFiltersApplied, { count: filterCount });
    }
  }, [filters]);

  const handleTabChange = (value: string) => {
    if (!VALID_TABS.includes(value as TabValue)) return;
    setActiveTab(value as TabValue);
    setSearchParams((p) => {
      p.set('tab', value);
      return p;
    });
  };

  const totalShelterPets = useMemo(
    () => (feedItems ?? []).filter((i) => i.source === 'shelter_pet').length,
    [feedItems]
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Encontrá a tu próxima mascota"
        subtitle="Mascotas en adopción de refugios y particulares"
        onBack={() => navigate(LINKS.home())}
      />

      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="mascotas" className="gap-1.5">
              <Heart className="h-4 w-4" />
              <span>Mascotas</span>
            </TabsTrigger>
            <TabsTrigger value="refugios" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>Refugios</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB MASCOTAS */}
          <TabsContent value="mascotas" className="mt-4 space-y-4">
            <AdoptionFiltersBar filters={filters} onChange={setFilters} />

            {feedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-96 bg-muted/40 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : feedItems && feedItems.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {feedItems.length} {feedItems.length === 1 ? 'mascota' : 'mascotas'}
                  {totalShelterPets > 0 && <span> · {totalShelterPets} de refugios</span>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feedItems.map((item) => (
                    <AdoptableItemCard key={`${item.source}-${item.id}`} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 px-4 bg-muted/20 rounded-xl">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No encontramos mascotas</h3>
                <p className="text-sm text-muted-foreground">
                  Probá ajustar los filtros o volver más tarde.
                </p>
              </div>
            )}
          </TabsContent>

          {/* TAB REFUGIOS */}
          <TabsContent value="refugios" className="mt-4 space-y-4">
            <AdoptionFiltersBar
              filters={{ comuna: filters.comuna }}
              onChange={(f) => setFilters({ ...filters, comuna: f.comuna })}
              hideSourceFilter
            />

            {sheltersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted/40 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : shelters && shelters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shelters.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => s.slug && navigate(`/refugios/${s.slug}`)}
                    className="text-left p-4 rounded-xl border bg-card hover:shadow-md hover:border-purple-300 transition-all group"
                  >
                    <div className="flex gap-3 items-start">
                      {s.logo_url ? (
                        <img
                          src={s.logo_url}
                          alt={s.legal_name}
                          className="h-14 w-14 rounded-lg object-cover bg-muted flex-shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-6 w-6 text-purple-700" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-purple-700">
                          {s.legal_name}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {s.commune}
                          {s.type && ` · ${s.type}`}
                        </p>
                        {(s.total_pets_in_care ?? 0) > 0 && (
                          <p className="text-xs text-purple-600 font-medium mt-1">
                            {s.total_pets_in_care} mascota{s.total_pets_in_care === 1 ? '' : 's'} en
                            adopción
                          </p>
                        )}
                      </div>
                    </div>
                    {s.mission && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{s.mission}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-muted/20 rounded-xl">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No hay refugios todavía</h3>
                <p className="text-sm text-muted-foreground">
                  Estamos sumando refugios a la red. Volvé pronto.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

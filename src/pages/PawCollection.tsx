import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, PawPrint, Trophy, Filter, ArrowLeft, Sparkles, Users } from '@/lib/icons';
import { usePawCollection, usePawCollectionStats } from '@/hooks/usePawCollection';
import { PawCardHoloPattern } from '@/components/paw-cards/PawCardHoloPattern';
import { getRarity, RARITY_LABELS, RARITY_RING } from '@/components/PetCardCompact';
import { HOLO_PATTERN_MAP, getSpeciesPalette } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';
import type { CollectedCard } from '@/hooks/usePawCollection';

function MiniPawCard({ card, isOwn }: { card: CollectedCard; isOwn?: boolean }) {
  const navigate = useNavigate();
  // TODO: fetch real paw_points per collected pet when available
  const rarity = getRarity(0);
  const holoConfig = HOLO_PATTERN_MAP[card.pet.holoPattern as HoloPattern];
  const palette = getSpeciesPalette(card.pet.species);

  return (
    <button
      className="tcg-perspective w-full text-left group"
      onClick={() => navigate(`/paw-card/${card.pet.pawCardId}`)}
    >
      <div className="pet-card-tcg transition-transform hover:scale-[1.03]" data-rarity={rarity}>
        <div className="pet-card-tcg-inner" style={{ background: palette.lightBg }}>
          <div className="pet-card-tcg-rainbow" />
          <PawCardHoloPattern pattern={card.pet.holoPattern as HoloPattern} />
          <div className="pet-card-tcg-texture" />

          <div className="relative z-10 p-4 text-center flex flex-col items-center gap-2">
            {/* Mini top bar */}
            <div className="flex items-center justify-between w-full">
              <span className="tcg-rarity-badge" data-rarity={rarity} style={{ fontSize: '7px' }}>
                {RARITY_LABELS[rarity]}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm leading-none">{palette.icon}</span>
                {holoConfig && holoConfig.tier !== 'standard' && (
                  <span
                    className="paw-holo-tier-badge"
                    data-tier={holoConfig.tier}
                    style={{ fontSize: '7px' }}
                  >
                    {holoConfig.name}
                  </span>
                )}
              </div>
            </div>

            {/* Own badge */}
            {isOwn && (
              <span className="absolute top-2 right-2 text-[7px] font-bold uppercase tracking-wider bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                Tuya
              </span>
            )}

            {/* Avatar */}
            <Avatar className={`h-16 w-16 ring-2 ${RARITY_RING[rarity]} rounded-full shadow-md`}>
              <AvatarImage src={card.pet.photoUrl || undefined} alt={card.pet.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-300">
                <Heart className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div>
              <h3 className="pet-card-name font-bold text-sm leading-tight" data-rarity={rarity}>
                {card.pet.name}
              </h3>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: palette.accent }}>
                {card.pet.species}
              </p>
            </div>

            {card.ownerName && (
              <p className="text-[10px] text-muted-foreground/70 truncate max-w-full">
                de {card.ownerName}
              </p>
            )}

            <p className="text-[9px] font-mono text-muted-foreground/50">#{card.pet.pawCardId}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

type FilterType = 'all' | 'perro' | 'gato' | 'otro';

const PawCollection = () => {
  const navigate = useNavigate();
  const { data: collection = [], isLoading } = usePawCollection();
  const { data: stats } = usePawCollectionStats();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered =
    filter === 'all'
      ? collection
      : collection.filter((c) => {
          const sp = c.pet.species.toLowerCase();
          if (filter === 'perro') return sp.includes('perro') || sp.includes('dog');
          if (filter === 'gato') return sp.includes('gato') || sp.includes('cat');
          return (
            !sp.includes('perro') &&
            !sp.includes('dog') &&
            !sp.includes('gato') &&
            !sp.includes('cat')
          );
        });

  return (
    <>
      <Helmet>
        <title>Mi Paw Collection — Paw Friend</title>
      </Helmet>

      <div className="container px-4 py-8 max-w-6xl mx-auto animate-fade-in paw-collection-bg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-purple-500" />
              Mi Paw Collection
            </h1>
            <p className="text-sm text-muted-foreground">
              Tu coleccion de Paw Cards — tus mascotas y las que has escaneado
            </p>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/40 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.total}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Coleccionadas</p>
            </div>
            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/40 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <PawPrint className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {stats.ownCards}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Mis Paw Cards</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(
            [
              ['all', 'Todas'],
              ['perro', 'Perros'],
              ['gato', 'Gatos'],
              ['otro', 'Otros'],
            ] as [FilterType, string][]
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              className={filter === key ? 'bg-purple-600 hover:bg-purple-700' : ''}
              onClick={() => setFilter(key)}
            >
              <Filter className="mr-1 h-3 w-3" />
              {label}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full skeleton" />
                  <div className="h-4 w-20 skeleton" />
                  <div className="h-3 w-16 skeleton" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <Sparkles className="h-12 w-12 text-purple-300/50 mx-auto" />
            <h2 className="text-lg font-semibold">
              {filter === 'all' ? 'Tu coleccion esta vacia' : 'Sin resultados'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {filter === 'all'
                ? 'Escanea el QR en el reverso de las Paw Cards de otros usuarios para empezar a coleccionar'
                : 'No tienes cartas de este tipo'}
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((card, i) => (
              <div
                key={card.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
              >
                <MiniPawCard card={card} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PawCollection;

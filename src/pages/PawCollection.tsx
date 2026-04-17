import { useState, useRef, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Heart,
  PawPrint,
  Trophy,
  Filter,
  ArrowLeft,
  Sparkles,
  Users,
  Crown,
  ScanLine,
  X,
} from '@/lib/icons';
import { usePawCollection, usePawCollectionStats } from '@/hooks/usePawCollection';
import { usePawCardRanking } from '@/hooks/usePawCardRanking';
import { PawCardHoloPattern } from '@/components/paw-cards/PawCardHoloPattern';
import { PawCardFlippable } from '@/components/paw-cards/PawCardFlippable';
import { getRarity, RARITY_LABELS, RARITY_RING } from '@/components/PetCardCompact';
import { HOLO_PATTERN_MAP, getSpeciesPalette } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';
import type { CollectedCard } from '@/hooks/usePawCollection';
import { PawLabsBanner } from '@/components/PawLabsBanner';

function MiniPawCard({
  card,
  isOwn,
  onSelect,
}: {
  card: CollectedCard;
  isOwn?: boolean;
  onSelect: () => void;
}) {
  const rarity = getRarity(card.ownerPoints);
  const holoConfig = HOLO_PATTERN_MAP[card.pet.holoPattern as HoloPattern];
  const palette = getSpeciesPalette(card.pet.species);

  return (
    <button className="tcg-perspective w-full text-left group" onClick={onSelect}>
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
            <Avatar
              className={`h-16 w-16 ring-2 ${RARITY_RING[rarity]} rounded-full shadow-md paw-crystal-shine`}
            >
              <AvatarImage
                src={card.pet.photoUrl || undefined}
                alt={card.pet.name}
                loading="lazy"
              />
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

// ─── QR Scanner ─────────────────────────────────────────────────────────

function QRScanner({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5ScannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetected = useCallback(
    (url: string) => {
      // Match pawfriend.cl/paw-card/<id> or localhost/paw-card/<id>
      const match = url.match(/\/paw-card\/([A-Za-z0-9-]+)/);
      if (match) {
        // Stop scanner before navigating
        html5ScannerRef.current?.stop().catch(() => {});
        onClose();
        navigate(`/paw-card/${match[1]}`);
      }
    },
    [navigate, onClose]
  );

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;

        const scanner = new Html5Qrcode('qr-scanner-region');
        html5ScannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            handleDetected(decodedText);
          },
          () => {
            // QR not detected in this frame — ignore
          }
        );
      } catch (err) {
        if (mounted) {
          setError('No se pudo acceder a la camara. Verifica los permisos en tu navegador.');
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      html5ScannerRef.current?.stop().catch(() => {});
    };
  }, [handleDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-sm mx-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            html5ScannerRef.current?.stop().catch(() => {});
            onClose();
          }}
          className="absolute top-2 right-2 z-10 text-white bg-black/50 rounded-full h-10 w-10"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500 mx-4">
          <div id="qr-scanner-region" ref={scannerRef} className="w-full" />
        </div>

        <p className="text-center text-white/80 text-sm mt-4 px-4">
          Apunta la camara al QR de una Paw Card para agregarla a tu coleccion
        </p>

        {error && <p className="text-center text-amber-300 text-xs mt-2 px-4">{error}</p>}
      </div>
    </div>
  );
}

// ─── Card Zoom Overlay (TCG style) ──────────────────────────────────
function CardZoomOverlay({ card, onClose }: { card: CollectedCard; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleClose es estable tras el primer render; no queremos re-suscribir al keydown
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Map CollectedCard to PawCardFlippable's Pet interface
  const pet = {
    id: card.pet.id,
    name: card.pet.name,
    species: card.pet.species,
    breed: card.pet.breed,
    birth_date: null,
    photo_url: card.pet.photoUrl,
    gender: null,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: isVisible ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0)',
        backdropFilter: isVisible ? 'blur(8px)' : 'blur(0px)',
        transition: 'background-color 0.2s ease, backdrop-filter 0.2s ease',
      }}
      onClick={handleClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
        onClick={handleClose}
      >
        <X className="h-6 w-6" />
      </button>

      {/* Card — same PawCardFlippable used in MyPets */}
      <div
        className="tcg-perspective"
        style={{
          width: '280px',
          transform: isVisible ? 'scale(1)' : 'scale(0.7)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <PawCardFlippable
          pet={pet}
          score={card.ownerPoints}
          holoPattern={card.pet.holoPattern as HoloPattern}
          pawCardId={card.pet.pawCardId}
          viewOnly
          subtitle={card.ownerName ? `Mascota de ${card.ownerName}` : undefined}
        />
      </div>
    </div>
  );
}

type FilterType = 'all' | 'perro' | 'gato' | 'otro';

const PawCollection = () => {
  const navigate = useNavigate();
  const { data: collection = [], isLoading } = usePawCollection();
  const { data: stats } = usePawCollectionStats();
  const { data: ranking = [] } = usePawCardRanking(10);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CollectedCard | null>(null);

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
        <title>Mi Coleccion — Paw Friend</title>
      </Helmet>

      <div className="container px-4 py-8 max-w-6xl mx-auto animate-fade-in paw-collection-bg space-y-6">
        <PawLabsBanner description="Colecciona Paw Cards escaneando QR de otras mascotas. Sistema de coleccion en desarrollo." />
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-purple-500" />
              Mi Coleccion
            </h1>
            <p className="text-sm text-muted-foreground">Tus Paw Cards y las que has escaneado</p>
          </div>
          <Button
            onClick={() => setShowScanner(true)}
            className="bg-purple-600 hover:bg-purple-700 shrink-0"
            size="sm"
          >
            <ScanLine className="h-4 w-4 mr-1" />
            Escanear
          </Button>
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

        {/* Ranking - Top Paw Cards más coleccionadas */}
        {ranking.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Mas coleccionadas
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {ranking.slice(0, 5).map((card, i) => (
                  <button
                    key={card.petId}
                    onClick={() => navigate(`/paw-card/${card.pawCardId}`)}
                    className="flex-shrink-0 flex items-center gap-2 p-2 rounded-lg bg-white border border-amber-100 hover:shadow-sm transition-shadow min-w-[140px]"
                  >
                    <div className="relative">
                      <Avatar className="h-9 w-9 ring-2 ring-amber-200">
                        <AvatarImage
                          src={card.photoUrl || undefined}
                          alt={card.petName}
                          loading="lazy"
                        />
                        <AvatarFallback className="bg-amber-50 text-amber-400">
                          <PawPrint className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-amber-400 text-white text-[8px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold truncate">{card.petName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {card.collectorCount} {card.collectorCount === 1 ? 'scan' : 'scans'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
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
                className={i < 8 ? 'animate-fade-in-up' : ''}
                style={i < 8 ? { animationDelay: `${i * 40}ms` } : undefined}
              >
                <MiniPawCard
                  card={card}
                  isOwn={card.isOwn}
                  onSelect={() => setSelectedCard(card)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Scanner overlay */}
      {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}

      {/* Card zoom overlay */}
      {selectedCard && (
        <CardZoomOverlay card={selectedCard} onClose={() => setSelectedCard(null)} />
      )}
    </>
  );
};

export default PawCollection;

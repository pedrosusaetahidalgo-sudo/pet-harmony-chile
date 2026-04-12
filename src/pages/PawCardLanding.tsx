import { useRef, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, CheckCircle2, LogIn, PawPrint, Sparkles } from '@/lib/icons';
import { usePawCard, useHasCollected, collectPawCard } from '@/hooks/usePawCard';
import { useAuth } from '@/hooks/useAuth';
import { getRarity, RARITY_LABELS, RARITY_RING } from '@/components/PetCardCompact';
import { PawCardHoloPattern } from '@/components/paw-cards/PawCardHoloPattern';
import { HOLO_PATTERN_MAP } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';
import pawIcon from '@/assets/paw_friend_icon.svg';

const PawCardLanding = () => {
  const { pawCardId } = useParams<{ pawCardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [collecting, setCollecting] = useState(false);

  const { data: card, isLoading } = usePawCard(pawCardId);
  const { data: hasCollected, refetch: refetchCollected } = useHasCollected(card?.petId);

  const rarity = getRarity(0); // Landing doesn't expose scores
  const holoConfig = card ? HOLO_PATTERN_MAP[card.holoPattern as HoloPattern] : null;

  /* 3D tilt */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    const rotateX = ((rect.height / 2 - y) / (rect.height / 2)) * 12;
    el.style.setProperty('--tcg-rotate-x', `${rotateX}deg`);
    el.style.setProperty('--tcg-rotate-y', `${rotateY}deg`);
    el.style.setProperty('--tcg-glow-x', `${((x / rect.width) * 100).toFixed(1)}%`);
    el.style.setProperty('--tcg-glow-y', `${((y / rect.height) * 100).toFixed(1)}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--tcg-rotate-x', '0deg');
    el.style.setProperty('--tcg-rotate-y', '0deg');
    el.style.setProperty('--tcg-glow-x', '50%');
    el.style.setProperty('--tcg-glow-y', '50%');
  }, []);

  const handleCollect = async () => {
    if (!card) return;
    setCollecting(true);
    const result = await collectPawCard(card.petId);
    if (result.success) {
      toast.success('Paw Card coleccionada!');
      refetchCollected();
    } else {
      toast.error(result.error);
    }
    setCollecting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/30 dark:to-background">
        <div className="text-center space-y-4">
          <PawPrint className="h-12 w-12 text-purple-400 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Cargando Paw Card...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white dark:from-purple-950/30 dark:to-background">
        <div className="text-center space-y-4">
          <PawPrint className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <h1 className="text-xl font-bold">Paw Card no encontrada</h1>
          <p className="text-sm text-muted-foreground">Esta carta no existe o fue eliminada</p>
          <Button onClick={() => navigate('/')} variant="outline">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Paw Card de {card.petName} — Paw Friend</title>
        <meta
          name="description"
          content={`Colecciona la Paw Card de ${card.petName} en Paw Friend`}
        />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-purple-50 via-white to-purple-50/50 dark:from-purple-950/30 dark:via-background dark:to-purple-950/20">
        {/* Card preview */}
        <div className="tcg-perspective mb-6">
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            ref={cardRef}
            className="pet-card-tcg w-[280px]"
            data-rarity={rarity}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="pet-card-tcg-inner">
              <div className="pet-card-tcg-rainbow" />
              <PawCardHoloPattern pattern={card.holoPattern as HoloPattern} />
              <div className="pet-card-tcg-texture" />
              <div className="pet-card-tcg-shine" />

              <div className="relative z-10 pt-6 pb-6 px-6 text-center flex flex-col items-center gap-2">
                {/* Rarity badge */}
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="tcg-rarity-badge" data-rarity={rarity}>
                    {RARITY_LABELS[rarity]}
                  </span>
                  {holoConfig && holoConfig.tier !== 'standard' && (
                    <span className="paw-holo-tier-badge" data-tier={holoConfig.tier}>
                      {holoConfig.name}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar
                  className={`h-28 w-28 ring-[3px] ${RARITY_RING[rarity]} rounded-full shadow-lg`}
                >
                  <AvatarImage src={card.photoUrl || undefined} alt={card.petName} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-300">
                    <Heart className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="mt-3 space-y-1">
                  <h2 className="pet-card-name font-bold text-xl leading-tight">{card.petName}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase tracking-wider font-semibold bg-purple-100/80 text-purple-700"
                    >
                      {card.species}
                    </Badge>
                    {card.breed && (
                      <span className="text-xs text-muted-foreground">{card.breed}</span>
                    )}
                  </div>
                </div>

                {/* Collector count */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {card.collectorCount}{' '}
                    {card.collectorCount === 1 ? 'coleccionista' : 'coleccionistas'}
                  </span>
                </div>

                {/* Card ID */}
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
                  #{card.pawCardId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-[280px] space-y-3">
          {!user ? (
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Inicia sesion para coleccionar
            </Button>
          ) : hasCollected ? (
            <Button className="w-full" variant="outline" disabled>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Ya tienes esta Paw Card
            </Button>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
              onClick={handleCollect}
              disabled={collecting}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {collecting ? 'Coleccionando...' : 'Agregar a mi coleccion'}
            </Button>
          )}

          {card.ownerName && (
            <p className="text-center text-xs text-muted-foreground">Mascota de {card.ownerName}</p>
          )}
        </div>

        {/* Branding */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <img src={pawIcon} alt="Paw Friend" className="w-8 h-8 rounded-lg" />
          <p className="text-xs text-muted-foreground">
            Colecciona Paw Cards en{' '}
            <span className="font-semibold text-purple-600">Paw Friend</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default PawCardLanding;

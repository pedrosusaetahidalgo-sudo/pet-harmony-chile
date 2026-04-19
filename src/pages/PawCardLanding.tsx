import { useRef, useCallback, useState, useEffect } from 'react';
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

// ─── Transfer Animation (Pokemon-style) ─────────────────────────────────

function TransferAnimation({
  petName,
  photoUrl,
  onComplete,
}: {
  petName: string;
  photoUrl: string | null;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<'charge' | 'beam' | 'arrive' | 'done'>('charge');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('beam'), 1200),
      setTimeout(() => setPhase('arrive'), 2800),
      setTimeout(() => {
        setPhase('done');
        onComplete();
      }, 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden">
      {/* Particle field */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-ping"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `hsl(${270 + Math.random() * 60}, 80%, ${60 + Math.random() * 30}%)`,
              animationDuration: `${1 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: phase === 'beam' ? 0.8 : 0.3,
            }}
          />
        ))}
      </div>

      {/* Central beam line */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000"
        style={{
          width: phase === 'beam' ? '200vw' : '0px',
          height: '3px',
          background: 'linear-gradient(90deg, transparent, #a855f7, #ec4899, #a855f7, transparent)',
          opacity: phase === 'beam' ? 1 : 0,
          boxShadow: '0 0 30px 10px rgba(168, 85, 247, 0.4)',
          transform: `translateX(-50%) translateY(-50%) rotate(${phase === 'beam' ? '0deg' : '90deg'})`,
        }}
      />

      {/* Source orb (left side — the owner's card) */}
      <div
        className="absolute transition-all ease-in-out"
        style={{
          left: phase === 'charge' ? '50%' : phase === 'beam' ? '15%' : '15%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transitionDuration: phase === 'beam' ? '800ms' : '400ms',
        }}
      >
        <div
          className="relative transition-all duration-700"
          style={{
            transform:
              phase === 'charge' ? 'scale(1)' : phase === 'beam' ? 'scale(0.6)' : 'scale(0.5)',
            opacity: phase === 'arrive' || phase === 'done' ? 0.3 : 1,
          }}
        >
          <div
            className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-purple-400/60"
            style={{
              boxShadow:
                phase === 'charge'
                  ? '0 0 40px 15px rgba(168, 85, 247, 0.5), 0 0 80px 30px rgba(168, 85, 247, 0.2)'
                  : '0 0 20px 5px rgba(168, 85, 247, 0.3)',
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-20 h-20 object-cover" />
            ) : (
              <div className="w-full h-full bg-purple-200 flex items-center justify-center">
                <PawPrint className="h-8 w-8 text-purple-400" />
              </div>
            )}
          </div>
          {/* Charging ring */}
          {phase === 'charge' && (
            <div className="absolute inset-[-8px] rounded-full border-2 border-purple-400 animate-ping" />
          )}
        </div>
      </div>

      {/* Traveling energy orb */}
      <div
        className="absolute w-8 h-8 rounded-full transition-all ease-in-out"
        style={{
          background: 'radial-gradient(circle, #e879f9, #a855f7, transparent)',
          boxShadow:
            '0 0 30px 10px rgba(168, 85, 247, 0.6), 0 0 60px 20px rgba(232, 121, 249, 0.3)',
          left: phase === 'charge' ? '50%' : phase === 'beam' ? '85%' : '85%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transitionDuration: '1500ms',
          opacity: phase === 'beam' ? 1 : 0,
          scale: phase === 'beam' ? '1' : '0',
        }}
      />

      {/* Destination orb (right side — your collection) */}
      <div
        className="absolute transition-all ease-in-out"
        style={{
          left: '85%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transitionDuration: '600ms',
        }}
      >
        <div
          className="relative transition-all duration-500"
          style={{
            transform: phase === 'arrive' || phase === 'done' ? 'scale(1.2)' : 'scale(0.8)',
            opacity: phase === 'charge' ? 0.4 : phase === 'arrive' || phase === 'done' ? 1 : 0.6,
          }}
        >
          <div
            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
            style={{
              boxShadow:
                phase === 'arrive'
                  ? '0 0 60px 25px rgba(168, 85, 247, 0.6), 0 0 120px 50px rgba(232, 121, 249, 0.3)'
                  : '0 0 20px 5px rgba(168, 85, 247, 0.2)',
            }}
          >
            <PawPrint className="h-7 w-7 text-white" />
          </div>
          {/* Arrival burst */}
          {phase === 'arrive' && (
            <>
              <div className="absolute inset-[-12px] rounded-full border-2 border-pink-400 animate-ping" />
              <div
                className="absolute inset-[-24px] rounded-full border border-purple-300 animate-ping"
                style={{ animationDelay: '200ms' }}
              />
            </>
          )}
        </div>
      </div>

      {/* Status text */}
      <div className="absolute bottom-16 left-0 right-0 text-center">
        <p
          className="text-white font-bold text-lg transition-opacity duration-500"
          style={{ opacity: phase === 'done' ? 0 : 1 }}
        >
          {phase === 'charge' && 'Preparando transferencia...'}
          {phase === 'beam' && `Transfiriendo a ${petName}...`}
          {phase === 'arrive' && 'Paw Card recibida!'}
        </p>
        <div className="flex justify-center gap-1 mt-3">
          {['charge', 'beam', 'arrive'].map((p, i) => (
            <div
              key={p}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width:
                  phase === p || ['charge', 'beam', 'arrive'].indexOf(phase) > i ? '24px' : '8px',
                background:
                  ['charge', 'beam', 'arrive'].indexOf(phase) >= i
                    ? 'linear-gradient(90deg, #a855f7, #ec4899)'
                    : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const PawCardLanding = () => {
  const { pawCardId } = useParams<{ pawCardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [collecting, setCollecting] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

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
      setShowTransfer(true);
    } else {
      toast.error(result.error);
      setCollecting(false);
    }
  };

  const handleTransferComplete = useCallback(() => {
    setShowTransfer(false);
    setCollecting(false);
    toast.success('Paw Card coleccionada!');
    refetchCollected();
  }, [refetchCollected]);

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
          <h1 className="font-display font-semibold text-2xl tracking-tight">
            Paw Card no encontrada
          </h1>
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
                  className={`h-28 w-28 ring-[3px] ${RARITY_RING[rarity]} rounded-full shadow-lg paw-crystal-shine`}
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

      {/* Transfer animation */}
      {showTransfer && card && (
        <TransferAnimation
          petName={card.petName}
          photoUrl={card.photoUrl}
          onComplete={handleTransferComplete}
        />
      )}
    </>
  );
};

export default PawCardLanding;

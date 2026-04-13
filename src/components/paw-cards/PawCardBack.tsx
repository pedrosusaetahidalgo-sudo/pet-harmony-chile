import { useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Share2, Copy, PawPrint, Sparkles, Loader2 } from '@/lib/icons';
import { PawCardQR } from './PawCardQR';
import { PawCardHoloPattern } from './PawCardHoloPattern';
import { HOLO_PATTERN_MAP } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';
import type { Rarity } from '@/components/PetCardCompact';
import pawIcon from '@/assets/paw_friend_icon.svg';

interface PawCardBackProps {
  petName: string;
  species: string;
  pawCardId: string;
  holoPattern: HoloPattern;
  rarity: Rarity;
}

export function PawCardBack({
  petName,
  species,
  pawCardId,
  holoPattern,
  rarity,
}: PawCardBackProps) {
  const holoConfig = HOLO_PATTERN_MAP[holoPattern];
  const hasPawCard = !!pawCardId;
  const pawCardUrl = hasPawCard ? `https://pawfriend.cl/paw-card/${pawCardId}` : '';

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasPawCard) return;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Paw Card de ${petName} — Paw Friend`,
            text: `Escanea y colecciona la Paw Card de ${petName}`,
            url: pawCardUrl,
          });
        } catch {
          /* user cancelled */
        }
      } else {
        await navigator.clipboard.writeText(pawCardUrl);
        toast.success('Link copiado');
      }
    },
    [petName, pawCardUrl, hasPawCard]
  );

  const handleCopyId = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasPawCard) return;
      await navigator.clipboard.writeText(pawCardId);
      toast.success('ID copiado');
    },
    [pawCardId, hasPawCard]
  );

  return (
    <div className="paw-card-back h-full" data-rarity={rarity}>
      {/* Watermark background */}
      <div className="paw-card-back-watermark" />

      {/* Holo pattern overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none rounded-[inherit]">
        <PawCardHoloPattern pattern={holoPattern} />
      </div>

      {/* Decorative corner filigree */}
      <div className="paw-card-back-filigree paw-card-back-filigree-tl" />
      <div className="paw-card-back-filigree paw-card-back-filigree-tr" />
      <div className="paw-card-back-filigree paw-card-back-filigree-bl" />
      <div className="paw-card-back-filigree paw-card-back-filigree-br" />

      {/* Shine effect */}
      <div className="paw-card-back-shine" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-3 px-3 text-center">
        {/* Top: Logo + brand */}
        <div className="flex items-center gap-2">
          <img
            src={pawIcon}
            alt="Paw Friend"
            className="w-7 h-7 rounded-lg shadow-lg shadow-purple-500/30"
          />
          <span className="text-xs font-bold text-white/90 tracking-widest uppercase">
            Paw Friend
          </span>
        </div>

        {/* Center: QR or generating state */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="paw-card-back-ornament" />

          {hasPawCard ? (
            <>
              {/* QR frame with animated glow */}
              <div className="relative group">
                <div
                  className="absolute -inset-3 rounded-2xl paw-card-back-qr-glow"
                  data-rarity={rarity}
                />
                <div className="relative bg-white/95 rounded-xl p-2 shadow-xl shadow-purple-900/30 ring-1 ring-white/20">
                  <PawCardQR pawCardId={pawCardId} size={100} />
                </div>
              </div>
              <p className="shimmer-text text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                Escanea y colecciona
              </p>
            </>
          ) : (
            <>
              {/* Generating state — stylish placeholder */}
              <div className="relative group">
                <div
                  className="absolute -inset-3 rounded-2xl paw-card-back-qr-glow opacity-50"
                  data-rarity={rarity}
                />
                <div className="relative bg-white/10 backdrop-blur-sm rounded-xl w-[116px] h-[116px] shadow-xl shadow-purple-900/30 ring-1 ring-white/10 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 text-purple-300 animate-spin" />
                  <span className="text-[9px] text-purple-300/80 font-medium">Generando QR...</span>
                </div>
              </div>
              <p className="text-[10px] text-purple-300/60 font-medium mt-1">
                Tu Paw Card se esta creando
              </p>
            </>
          )}

          {/* Pet name + species pill */}
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
            <PawPrint className="h-3 w-3 text-purple-300" />
            <span className="text-[11px] font-semibold text-white/90">{petName}</span>
            <span className="text-purple-400/40">|</span>
            <span className="text-[11px] text-purple-300/80">{species}</span>
          </div>

          <div className="paw-card-back-ornament" />
        </div>

        {/* Bottom: holo badge + actions + ID */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {holoConfig && (
            <span className="paw-holo-tier-badge" data-tier={holoConfig.tier}>
              {holoConfig.tier === 'ultra-rare' && (
                <Sparkles className="inline h-2.5 w-2.5 mr-0.5" />
              )}
              {holoConfig.name}
            </span>
          )}

          {/* Actions row */}
          <div className="flex gap-1.5 w-full">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[10px] border-purple-400/20 text-purple-200 bg-purple-500/10 hover:bg-purple-500/25 backdrop-blur-sm rounded-lg disabled:opacity-40"
              onClick={handleShare}
              disabled={!hasPawCard}
            >
              <Share2 className="mr-1 h-3 w-3" />
              Compartir
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[10px] border-purple-400/20 text-purple-200 bg-purple-500/10 hover:bg-purple-500/25 backdrop-blur-sm rounded-lg disabled:opacity-40"
              onClick={handleCopyId}
              disabled={!hasPawCard}
            >
              <Copy className="mr-1 h-3 w-3" />
              Copiar ID
            </Button>
          </div>

          {/* Card ID */}
          <span className="text-[8px] font-mono text-purple-400/40 tracking-widest">
            {hasPawCard ? pawCardId : 'Generando...'}
          </span>
        </div>
      </div>
    </div>
  );
}

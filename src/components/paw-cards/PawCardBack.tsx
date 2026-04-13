import { useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Share2, Copy, PawPrint } from '@/lib/icons';
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
  const pawCardUrl = `https://pawfriend.cl/paw-card/${pawCardId}`;

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
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
    [petName, pawCardUrl]
  );

  const handleCopyId = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(pawCardId);
      toast.success('ID copiado');
    },
    [pawCardId]
  );

  return (
    <div className="paw-card-back h-full" data-rarity={rarity}>
      {/* Watermark background */}
      <div className="paw-card-back-watermark" />

      {/* Holo pattern overlay */}
      <div className="absolute inset-0 opacity-25 pointer-events-none rounded-[inherit]">
        <PawCardHoloPattern pattern={holoPattern} />
      </div>

      {/* Shine effect */}
      <div className="paw-card-back-shine" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full py-4 px-4 text-center">
        {/* Top: Logo + brand */}
        <div className="flex items-center gap-2">
          <img
            src={pawIcon}
            alt="Paw Friend"
            className="w-8 h-8 rounded-lg shadow-lg shadow-purple-500/30"
          />
          <span className="text-sm font-bold text-white/90 tracking-wide">Paw Friend</span>
        </div>

        {/* Center: QR + scan prompt */}
        <div className="flex flex-col items-center gap-2 -mt-1">
          {/* QR frame with glow */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-xl bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-purple-500/20 blur-sm" />
            <div className="relative bg-white/95 rounded-lg p-2 shadow-lg shadow-purple-500/20">
              <PawCardQR pawCardId={pawCardId} size={110} />
            </div>
          </div>

          {/* Scan text */}
          <p className="shimmer-text text-[11px] font-bold tracking-[0.15em] uppercase">
            Escanea para coleccionar
          </p>

          {/* Pet name + species */}
          <div className="flex items-center gap-1.5 text-purple-200/90">
            <PawPrint className="h-3 w-3" />
            <span className="text-xs font-semibold">{petName}</span>
            <span className="text-purple-400/50">·</span>
            <span className="text-xs text-purple-300/70">{species}</span>
          </div>
        </div>

        {/* Bottom: ID + holo badge + actions */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Holo tier badge */}
          {holoConfig && (
            <span className="paw-holo-tier-badge" data-tier={holoConfig.tier}>
              {holoConfig.name}
            </span>
          )}

          {/* Actions row */}
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[11px] border-purple-400/25 text-purple-200 bg-purple-500/10 hover:bg-purple-500/25 backdrop-blur-sm"
              onClick={handleShare}
            >
              <Share2 className="mr-1 h-3 w-3" />
              Compartir
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-[11px] border-purple-400/25 text-purple-200 bg-purple-500/10 hover:bg-purple-500/25 backdrop-blur-sm"
              onClick={handleCopyId}
            >
              <Copy className="mr-1 h-3 w-3" />
              ID
            </Button>
          </div>

          {/* Card ID small */}
          <span className="text-[9px] font-mono text-purple-400/50 tracking-wider">
            #{pawCardId.slice(0, 13)}
          </span>
        </div>
      </div>
    </div>
  );
}

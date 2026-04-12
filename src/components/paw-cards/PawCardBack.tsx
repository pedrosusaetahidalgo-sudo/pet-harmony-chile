import { useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy } from '@/lib/icons';
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

  const handleShare = useCallback(async () => {
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
  }, [petName, pawCardUrl]);

  const handleCopyId = useCallback(async () => {
    await navigator.clipboard.writeText(pawCardId);
    toast.success('ID copiado');
  }, [pawCardId]);

  return (
    <div className="paw-card-back h-full" data-rarity={rarity}>
      {/* Watermark background */}
      <div className="paw-card-back-watermark" />

      {/* Holo pattern overlay (muted) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none rounded-[inherit]">
        <PawCardHoloPattern pattern={holoPattern} />
      </div>

      {/* Shine effect */}
      <div className="paw-card-back-shine" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full py-5 px-4 text-center gap-3">
        {/* Logo */}
        <img
          src={pawIcon}
          alt="Paw Friend"
          className="w-12 h-12 rounded-xl shadow-lg shadow-purple-500/20"
        />

        {/* QR Code */}
        <PawCardQR pawCardId={pawCardId} size={120} />

        {/* Scan text */}
        <p className="shimmer-text text-xs font-semibold tracking-wider uppercase">
          Escanea para coleccionar
        </p>

        {/* Card ID */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopyId();
          }}
          className="flex items-center gap-1 text-[10px] font-mono text-purple-300/80 hover:text-purple-200 transition-colors"
          title="Copiar ID"
        >
          <span>Paw Card #{pawCardId}</span>
          <Copy className="h-2.5 w-2.5" />
        </button>

        {/* Pet info */}
        <p className="text-xs text-purple-200/70">
          {petName} · {species}
        </p>

        {/* Holo tier badge */}
        {holoConfig && (
          <span className="paw-holo-tier-badge" data-tier={holoConfig.tier}>
            {holoConfig.name}
          </span>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-purple-500/30 text-purple-200 bg-purple-500/10 hover:bg-purple-500/20"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
          >
            <Share2 className="mr-1 h-3 w-3" />
            Compartir
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-purple-500/30 text-purple-200 bg-purple-500/10 hover:bg-purple-500/20"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyId();
            }}
          >
            <Download className="mr-1 h-3 w-3" />
            ID
          </Button>
        </div>
      </div>
    </div>
  );
}

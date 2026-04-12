import { rollHoloPattern, generatePawCardId } from '@/lib/paw-cards';
import type { HoloPattern } from '@/lib/paw-cards';

/**
 * Genera un patron holografico y un paw card ID para una mascota nueva.
 * Se llama una sola vez al momento de crear la mascota.
 * Los valores se persisten en la tabla pets (holo_pattern, paw_card_id).
 */
export function generatePawCardData(): {
  holoPattern: HoloPattern;
  pawCardId: string;
} {
  return {
    holoPattern: rollHoloPattern(),
    pawCardId: generatePawCardId(),
  };
}

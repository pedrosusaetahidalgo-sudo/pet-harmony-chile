-- Prevent duplicate microchip numbers across pets.
-- ISO 11784/11785 standard: 15 numeric digits, globally unique.
-- Partial index: only enforced when value is non-null and non-empty.

CREATE UNIQUE INDEX IF NOT EXISTS idx_pets_microchip_unique
  ON public.pets (microchip_number)
  WHERE microchip_number IS NOT NULL AND microchip_number != '';

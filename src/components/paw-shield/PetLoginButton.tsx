/**
 * PetLoginButton — boton "Buscar mi mascota" en /home.
 *
 * Pet Login #7 RICE 180 (docs-raiz/PAW_SHIELD_IDEAS_BANK.md):
 *   Multi-pet owners pueden escanear el hocico para abrir directo la ficha
 *   sin elegir de lista.
 *
 * Solo se renderiza si:
 *   - Flag PAW_SHIELD_PETIFY=true
 *   - User tiene >=2 mascotas con petify_pet_id (Paw Shield activo)
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScanLine } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { PetLoginScanner } from './PetLoginScanner';

interface OwnedPet {
  id: string;
  name: string;
  petify_pet_id: string | null;
}

export function PetLoginButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: pets } = useQuery({
    queryKey: ['pet-login-eligibility', user?.id],
    enabled: !!user?.id && isFeatureEnabled('PAW_SHIELD_PETIFY'),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<OwnedPet[]> => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name, petify_pet_id')
        .eq('owner_id', user.id)
        .not('petify_pet_id', 'is', null);
      return (data as OwnedPet[]) ?? [];
    },
  });

  if (!isFeatureEnabled('PAW_SHIELD_PETIFY')) return null;
  if (!user?.id) return null;
  if (!pets || pets.length < 2) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
      >
        <ScanLine className="h-3.5 w-3.5" />
        Buscar mi mascota
      </Button>
      <PetLoginScanner open={open} onOpenChange={setOpen} ownedPets={pets} />
    </>
  );
}

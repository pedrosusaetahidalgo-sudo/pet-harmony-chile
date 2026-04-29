/**
 * BirthdayCouponsCard — Cupones de cumpleanos validados con biometria.
 *
 * #12 RICE 149 (docs-raiz/PAW_SHIELD_IDEAS_BANK.md):
 *   El dia del cumple del pet (±3 dias), tienda partner manda regalo
 *   virtual. Dueno llega a tienda → escanea hocico → tienda valida cupon.
 *
 * Llama RPC `list_active_birthday_coupons(p_pet_id)` que devuelve cupones
 * solo si el pet esta dentro de window. Auto-esconde si no hay cupones.
 *
 * MVP: muestra cupones con descuento + instrucciones. Sin redemption flow
 * todavia (espera firma de partner real).
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gift, ScanLine } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface BirthdayCoupon {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  discount_percent: number;
  category: string;
  partner_logo_url: string | null;
  partner_url: string | null;
  redemption_instructions: string;
}

interface BirthdayCouponsCardProps {
  petId: string;
  petName: string;
}

export function BirthdayCouponsCard({ petId, petName }: BirthdayCouponsCardProps) {
  const [openCoupon, setOpenCoupon] = useState<BirthdayCoupon | null>(null);

  const { data: coupons } = useQuery({
    queryKey: ['birthday-coupons', petId],
    enabled: !!petId && isFeatureEnabled('PAW_SHIELD_PETIFY'),
    staleTime: 60 * 60_000, // 1 hora · cumples no cambian seguido
    queryFn: async (): Promise<BirthdayCoupon[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('list_active_birthday_coupons', {
        p_pet_id: petId,
      });
      if (error) return [];
      return (data ?? []) as BirthdayCoupon[];
    },
  });

  if (!isFeatureEnabled('PAW_SHIELD_PETIFY')) return null;
  if (!coupons || coupons.length === 0) return null;

  return (
    <>
      <Card className="border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <Gift className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-amber-900">
                🎂 {petName} cumple — {coupons.length} cupon{coupons.length === 1 ? '' : 'es'} para
                celebrar
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Lleva a {petName} a la tienda y escanean su hocico para validar.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {coupons.slice(0, 3).map((c) => (
              <button
                key={c.id}
                onClick={() => setOpenCoupon(c)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white/70 hover:bg-white p-2 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.partner_logo_url ? (
                    <img
                      src={c.partner_logo_url}
                      alt={c.display_name}
                      className="h-8 w-8 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-amber-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700">
                      {c.display_name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.display_name}</p>
                    <p className="text-xs text-amber-700">{c.category}</p>
                  </div>
                </div>
                <Badge className="bg-amber-600 text-white text-[10px]">
                  -{c.discount_percent}%
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!openCoupon} onOpenChange={(v) => !v && setOpenCoupon(null)}>
        <DialogContent className="max-w-md">
          {openCoupon && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-amber-600" />
                  {openCoupon.display_name}
                </DialogTitle>
                <DialogDescription>{openCoupon.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-amber-600">
                      -{openCoupon.discount_percent}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                      descuento birthday
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <ScanLine className="h-3.5 w-3.5" /> Como canjear
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {openCoupon.redemption_instructions}
                  </p>
                </div>
                {openCoupon.partner_url && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-amber-300 text-amber-900"
                  >
                    <a href={openCoupon.partner_url} target="_blank" rel="noopener noreferrer">
                      Ver tienda
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

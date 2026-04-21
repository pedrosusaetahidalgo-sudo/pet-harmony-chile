import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Info } from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';

/**
 * PawMemberCancel — callback de Flow.cl cuando el usuario cancela el pago B2C.
 *
 * Origen: Lote D auditoría E2E pre-launch 2026-04-20 (Opción B: URLs limpias).
 */

export default function PawMemberCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Pago cancelado — Paw Friend</title>
      </Helmet>
      <PageHeader title="Pago cancelado" onBack={() => navigate('/paw-member')} />
      <div className="container px-4 py-16 max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center pt-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Info className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">No se hizo el cargo</CardTitle>
            <CardDescription className="mt-2 text-base">
              Cancelaste el pago antes de completarlo. No se realizó ningún cobro a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-8">
            <p className="text-sm text-muted-foreground text-center">
              Paw Friend seguirá siendo gratis para ti, como siempre. Si quieres volver a intentar,
              puedes hacerlo cuando quieras.
            </p>
            <Button className="w-full" onClick={() => navigate('/paw-member')}>
              <Heart className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/home')}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info } from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';

/**
 * ProviderUpgradeCancel — callback Flow.cl cuando el vet cancela el pago B2B.
 *
 * Origen: Lote D auditoría E2E pre-launch 2026-04-20.
 */

export default function ProviderUpgradeCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Pago cancelado — Paw Friend para veterinarios</title>
      </Helmet>
      <PageHeader title="Pago cancelado" onBack={() => navigate('/provider/upgrade')} />
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
              Tu plan actual sigue activo. Si quieres volver a intentar, puedes hacerlo cuando
              quieras desde el dashboard.
            </p>
            <Button className="w-full" onClick={() => navigate('/provider/upgrade')}>
              Volver a ver planes
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/provider/dashboard')}
            >
              Ir al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

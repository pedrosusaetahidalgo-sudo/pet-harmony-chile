/**
 * CTA compacta para usuarios que NO son profesionales.
 * Se muestra en el perfil y sidebar para incentivar el registro como proveedor.
 */
import { useNavigate } from 'react-router-dom';
import { useActiveRole } from '@/hooks/useActiveRole';
import { Stethoscope } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function BecomeProviderCTA() {
  const { isProvider } = useActiveRole();
  const navigate = useNavigate();

  // Solo se muestra si el usuario NO es proveedor
  if (isProvider) return null;

  return (
    <Card className="border-teal-200 bg-teal-50/50">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
          <Stethoscope className="h-5 w-5 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-teal-900">
            ¿Eres veterinario o profesional de mascotas?
          </p>
          <p className="text-xs text-teal-700 mt-0.5">
            Registra tu perfil y aparece en el directorio de Paw Friend
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-teal-300 text-teal-700 hover:bg-teal-100"
            onClick={() => navigate('/registro-veterinario')}
          >
            Registrarme
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Sprint 1 P1 COMP-002 (2026-04-28): export ARCO de portabilidad.
 *
 * Ley 19.628 (modernizada por Reglamento 21.719 vigente 2026) reconoce el
 * derecho del titular a recibir sus datos personales en formato estructurado.
 * Esta pagina llama al RPC export_user_data y entrega un JSON descargable.
 *
 * El RPC filtra por auth.uid() — la pagina solo necesita estar gateada por
 * ProtectedRoute para que llegue un JWT valido.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, FileText, ShieldCheck, Loader2 } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function ExportarMisDatos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.rpc('export_user_data');
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pawfriend-mis-datos-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Listo', {
        description: 'Tu archivo se descargó. Contiene toda tu info personal en Paw Friend.',
      });
    } catch (err) {
      logger.error('[ExportarMisDatos] failed', err);
      toast.error('No pudimos generar tu archivo', {
        description:
          'Inténtalo de nuevo en unos segundos. Si sigue, escríbenos a hola@pawfriend.cl y te lo enviamos manualmente.',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white px-4 py-6">
      <div className="container max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <CardTitle className="text-2xl">Descargar mis datos</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu información personal en Paw Friend, en un solo archivo JSON.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-900">
                    Tu derecho conforme a la Ley 19.628
                  </p>
                  <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                    Como titular de los datos, puedes pedir copia de toda tu información en
                    cualquier momento. Esta página te la entrega al instante, sin tener que
                    escribirnos.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">¿Qué incluye el archivo?</p>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Tu perfil (nombre, email, plan, consents)</li>
                <li>Todas tus mascotas con sus fichas y documentos</li>
                <li>Historial clínico, vacunas, antiparasitarios y consultas</li>
                <li>Recordatorios y eventos del timeline</li>
                <li>Reservas con veterinarios (V1 + V2)</li>
                <li>Aportes monetarios (donaciones / Paw Member)</li>
                <li>Postulaciones que hayas enviado vía /aplicar</li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p>
                <strong>Formato:</strong> JSON estándar, legible por máquina. Si necesitas el
                archivo en otro formato (CSV, PDF), escríbenos a{' '}
                <code className="text-[11px]">hola@pawfriend.cl</code> y lo preparamos a mano.
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={downloading || !user}
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando archivo…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar mi archivo JSON
                </>
              )}
            </Button>

            <p className="text-[11px] text-muted-foreground italic text-center pt-2">
              También puedes pedir cancelar tu cuenta en{' '}
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={() => navigate('/delete-account')}
              >
                Eliminar mi cuenta
              </button>
              . El derecho de oposición y rectificación lo gestionamos vía{' '}
              <code className="text-[10px]">hola@pawfriend.cl</code>.
            </p>

            <div className="pt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Ver{' '}
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={() => navigate('/privacy')}
              >
                Política de Privacidad
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

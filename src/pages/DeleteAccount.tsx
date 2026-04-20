import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@/lib/icons';

const DeleteAccount = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Eliminar cuenta | Paw Friend';
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Eliminación de cuenta y datos</CardTitle>
            <p className="text-muted-foreground">Última actualización: 16 de abril de 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold">Cómo eliminar tu cuenta</h2>
              <p>
                Si deseas eliminar tu cuenta de Paw Friend y todos los datos asociados, puedes
                hacerlo de las siguientes formas:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong>Desde la app:</strong> Ve a tu Perfil → scroll hacia abajo → "Eliminar
                  cuenta". Esto eliminará tu cuenta y todos tus datos de forma permanente.
                </li>
                <li>
                  <strong>Por email:</strong> Envía un correo a{' '}
                  <a href="mailto:pedrosusaeta@pawfriend.cl" className="text-primary underline">
                    pedrosusaeta@pawfriend.cl
                  </a>{' '}
                  con el asunto "Eliminar cuenta" desde el email asociado a tu cuenta. Procesaremos
                  tu solicitud en un máximo de 30 días.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Datos que se eliminan</h2>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Tu perfil de usuario (nombre, email, foto)</li>
                <li>Tus mascotas y sus fichas clínicas</li>
                <li>Tus recordatorios y rutinas</li>
                <li>Tus reservas y conversaciones</li>
                <li>Tus publicaciones en el feed</li>
                <li>Tu progreso de gamificación (Paw Points, misiones, badges)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Datos que se retienen</h2>
              <p>
                Por motivos legales y de seguridad, algunos datos pueden retenerse por un período
                limitado:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Registros de transacciones de pago (requerido por ley chilena, hasta 6 años)
                </li>
                <li>Logs de seguridad anonimizados (hasta 90 días)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Plazo de eliminación</h2>
              <p>
                La eliminación se procesa de forma inmediata al usar la opción desde la app. Si
                solicitas la eliminación por email, el plazo máximo es de 30 días calendario.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeleteAccount;

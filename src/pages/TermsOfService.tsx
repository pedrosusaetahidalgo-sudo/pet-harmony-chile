import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Términos y Condiciones | Paw Friend";
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Términos y Condiciones de Uso</CardTitle>
            <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-CL')}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground">
                Al acceder y utilizar Paw Friend, usted acepta estar sujeto a estos términos y condiciones de uso. 
                Si no está de acuerdo con alguno de estos términos, no debe utilizar esta aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Descripción del Servicio</h2>
              <p className="text-muted-foreground">
                Paw Friend es una red social para dueños de mascotas que permite:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Crear perfiles de mascotas y gestionar su información</li>
                <li>Conectar con otros dueños de mascotas</li>
                <li>Acceder a servicios profesionales (paseadores, cuidadores, veterinarios)</li>
                <li>Gestionar registros médicos de mascotas</li>
                <li>Publicar y buscar mascotas en adopción</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Registro y Cuenta de Usuario</h2>
              <p className="text-muted-foreground">
                Para utilizar ciertos servicios, debe crear una cuenta proporcionando información precisa y completa. 
                Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Uso Aceptable</h2>
              <p className="text-muted-foreground mb-2">Los usuarios se comprometen a:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Proporcionar información veraz sobre sus mascotas</li>
                <li>No publicar contenido ofensivo, ilegal o inapropiado</li>
                <li>Respetar a otros usuarios y sus mascotas</li>
                <li>No utilizar el servicio con fines comerciales no autorizados</li>
                <li>Cumplir con todas las leyes aplicables sobre bienestar animal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Servicios Profesionales</h2>
              <p className="text-muted-foreground">
                Los servicios de paseadores, cuidadores y veterinarios son proporcionados por profesionales independientes. 
                Paw Friend actúa como intermediario y no se hace responsable de la calidad de los servicios prestados. 
                Los usuarios deben verificar las credenciales de los profesionales antes de contratar servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Contenido Generado por Usuarios</h2>
              <p className="text-muted-foreground">
                Los usuarios conservan la propiedad del contenido que publican. Al publicar contenido, otorgan a Paw Friend 
                una licencia no exclusiva, libre de regalías, mundial y transferible para usar, reproducir, distribuir y 
                mostrar dicho contenido en relación con el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Privacidad y Protección de Datos</h2>
              <p className="text-muted-foreground">
                El uso de su información personal se rige por nuestra Política de Privacidad. Al usar Paw Friend, 
                acepta la recopilación y uso de información según dicha política.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Pagos y Reembolsos</h2>
              <p className="text-muted-foreground">
                Los pagos por servicios profesionales se procesan a través de proveedores de pago seguros. 
                Las políticas de reembolso dependen de cada proveedor de servicios y se especifican al momento de la contratación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground">
                Paw Friend no se hace responsable por daños directos, indirectos, incidentales o consecuentes derivados 
                del uso o la imposibilidad de uso del servicio. No garantizamos que el servicio esté libre de errores o interrupciones.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Modificaciones</h2>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Los cambios entrarán en vigor inmediatamente después de su publicación en la aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Legislación Aplicable</h2>
              <p className="text-muted-foreground">
                Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa se someterá a 
                la jurisdicción exclusiva de los tribunales chilenos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Contacto</h2>
              <p className="text-muted-foreground">
                Para cualquier consulta sobre estos términos, puede contactarnos a través de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Email: soporte@pawfriend.cl</li>
                <li>A través de la sección de Configuración en la aplicación</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;

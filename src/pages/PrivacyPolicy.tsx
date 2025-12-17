import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Política de Privacidad | Paw Friend";
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
            <CardTitle className="text-3xl">Política de Privacidad</CardTitle>
            <p className="text-muted-foreground">Última actualización: {new Date().toLocaleDateString('es-CL')}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Información que Recopilamos</h2>
              <p className="text-muted-foreground mb-2">Recopilamos los siguientes tipos de información:</p>
              
              <h3 className="text-xl font-semibold mt-4 mb-2">Información Personal</h3>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Nombre, correo electrónico y foto de perfil</li>
                <li>Ubicación (cuando utiliza servicios basados en geolocalización)</li>
                <li>Información de pago para transacciones de servicios</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-2">Información de Mascotas</h3>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Nombre, especie, raza, edad y características físicas</li>
                <li>Fotos y videos de mascotas</li>
                <li>Registros médicos y vacunaciones</li>
                <li>Historial de servicios contratados</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-2">Información de Uso</h3>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Interacciones en la aplicación</li>
                <li>Preferencias y configuraciones</li>
                <li>Datos de dispositivo y conexión</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Cómo Utilizamos su Información</h2>
              <p className="text-muted-foreground mb-2">Utilizamos la información recopilada para:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Facilitar conexiones entre usuarios y profesionales</li>
                <li>Procesar pagos y transacciones</li>
                <li>Personalizar su experiencia en la aplicación</li>
                <li>Enviar notificaciones importantes sobre servicios contratados</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Compartir Información</h2>
              <p className="text-muted-foreground mb-2">Compartimos información solo en las siguientes circunstancias:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li><strong>Con profesionales de servicios:</strong> Cuando contrata un servicio, compartimos información relevante con el proveedor</li>
                <li><strong>Con otros usuarios:</strong> La información pública de perfil y publicaciones es visible para otros usuarios</li>
                <li><strong>Con proveedores de servicios:</strong> Compartimos información con proveedores que nos ayudan a operar la aplicación</li>
                <li><strong>Por requerimiento legal:</strong> Cuando sea necesario para cumplir con leyes o procesos legales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Protección de Datos</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra 
                acceso no autorizado, pérdida, destrucción o alteración. Estas medidas incluyen:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Cifrado de datos en tránsito y en reposo</li>
                <li>Controles de acceso estrictos</li>
                <li>Auditorías de seguridad regulares</li>
                <li>Políticas de seguridad del personal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Sus Derechos</h2>
              <p className="text-muted-foreground mb-2">De acuerdo con la Ley N° 19.628 de Protección de Datos Personales de Chile, usted tiene derecho a:</p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar datos inexactos o incompletos</li>
                <li>Cancelar o eliminar sus datos</li>
                <li>Oponerse al tratamiento de sus datos</li>
                <li>Solicitar la portabilidad de sus datos</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Para ejercer estos derechos, puede contactarnos a través de la aplicación o por email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Retención de Datos</h2>
              <p className="text-muted-foreground">
                Conservamos su información personal mientras su cuenta esté activa o según sea necesario para 
                proporcionar servicios. Los datos se eliminan cuando cierra su cuenta, excepto cuando debamos 
                conservarlos por obligaciones legales o para resolver disputas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Menores de Edad</h2>
              <p className="text-muted-foreground">
                Nuestros servicios están destinados a personas mayores de 18 años. No recopilamos intencionadamente 
                información de menores sin el consentimiento parental. Si descubrimos que hemos recopilado información 
                de un menor sin autorización, la eliminaremos inmediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Cookies y Tecnologías Similares</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar el uso de la aplicación 
                y personalizar contenido. Puede configurar su navegador para rechazar cookies, pero esto puede afectar 
                la funcionalidad de la aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Transferencias Internacionales</h2>
              <p className="text-muted-foreground">
                Su información puede ser transferida y procesada en servidores ubicados fuera de Chile. 
                Nos aseguramos de que estas transferencias cumplan con las leyes de protección de datos aplicables 
                y que se implementen medidas de seguridad adecuadas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Cambios a esta Política</h2>
              <p className="text-muted-foreground">
                Podemos actualizar esta política de privacidad periódicamente. Le notificaremos sobre cambios 
                significativos mediante un aviso en la aplicación o por correo electrónico. 
                Le recomendamos revisar esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Contacto</h2>
              <p className="text-muted-foreground">
                Si tiene preguntas sobre esta política de privacidad o cómo manejamos sus datos, 
                puede contactarnos:
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

export default PrivacyPolicy;

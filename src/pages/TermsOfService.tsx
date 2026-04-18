import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@/lib/icons';

const TermsOfService = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Términos y Condiciones | Paw Friend';
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
            <CardTitle className="text-3xl">Términos y Condiciones de Uso</CardTitle>
            <p className="text-muted-foreground">Última actualización: 19 de abril de 2026</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground">
                Al acceder y utilizar Paw Friend, usted acepta estar sujeto a estos términos y
                condiciones de uso. Si no está de acuerdo con alguno de estos términos, no debe
                utilizar esta aplicación.
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
                Para utilizar ciertos servicios, debe crear una cuenta proporcionando información
                precisa y completa. Usted es responsable de mantener la confidencialidad de su
                cuenta y contraseña.
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
                Los servicios de paseadores, cuidadores y veterinarios son proporcionados por
                profesionales independientes. Paw Friend actúa como intermediario y no se hace
                responsable de la calidad de los servicios prestados. Los usuarios deben verificar
                las credenciales de los profesionales antes de contratar servicios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Contenido Generado por Usuarios</h2>
              <p className="text-muted-foreground">
                Los usuarios conservan la propiedad del contenido que publican. Al publicar
                contenido, otorgan a Paw Friend una licencia no exclusiva, libre de regalías,
                mundial y transferible para usar, reproducir, distribuir y mostrar dicho contenido
                en relación con el servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Privacidad y Protección de Datos</h2>
              <p className="text-muted-foreground">
                El uso de su información personal se rige por nuestra Política de Privacidad. Al
                usar Paw Friend, acepta la recopilación y uso de información según dicha política.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Pagos y Reembolsos</h2>
              <p className="text-muted-foreground">
                Los pagos por servicios profesionales se procesan a través de proveedores de pago
                seguros (Flow.cl). Las políticas de reembolso dependen de cada proveedor de
                servicios y se especifican al momento de la contratación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8.1. Donaciones y Aportes Voluntarios</h2>
              <p className="text-muted-foreground mb-2">
                Paw Friend permite realizar aportes voluntarios a través de la página{' '}
                <code>/donaciones</code>. Estos aportes se rigen por las siguientes condiciones:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1.5">
                <li>
                  <strong>Son estrictamente voluntarios</strong> y no constituyen pago por ningún
                  servicio, membresía, contraprestación ni ventaja en la plataforma.
                </li>
                <li>
                  <strong>No son deducibles de impuestos.</strong> Paw Friend SpA es una empresa
                  comercial constituida en Chile y no está inscrita como donataria en el registro
                  del Servicio de Impuestos Internos bajo la Ley 19.885 sobre donaciones con
                  beneficios tributarios.
                </li>
                <li>
                  <strong>Derecho de retracto</strong>: conforme a la Ley 19.496 de Protección al
                  Consumidor, el usuario puede solicitar la devolución del aporte dentro de los 10
                  días corridos desde la transacción escribiendo a{' '}
                  <code>pawfriendcl@gmail.com</code>. La devolución se realizará por el mismo medio
                  de pago utilizado.
                </li>
                <li>
                  El procesamiento del pago se realiza a través de <strong>Flow.cl</strong>. Paw
                  Friend no almacena los datos de tarjetas de crédito o débito.
                </li>
                <li>
                  Los aportes se destinan a cubrir costos operativos del proyecto (servidores,
                  infraestructura, seguridad de datos, desarrollo continuo). Si existe excedente,
                  Paw Friend puede derivarlo a refugios u hogares de tránsito aliados, publicando la
                  trazabilidad en la misma página.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                8.2. Membresía voluntaria "Paw Member"
              </h2>
              <p className="text-muted-foreground mb-2">
                Paw Friend ofrece una membresía voluntaria recurrente denominada{' '}
                <strong>Paw Member</strong>
                ($3.990 CLP mensuales o $39.900 CLP anuales) destinada a usuarios que deseen
                sostener el proyecto de forma periódica.
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1.5">
                <li>
                  La membresía <strong>no desbloquea funcionalidades exclusivas</strong>. Paw Friend
                  seguirá siendo gratuito para todos los tutores, con todas las funciones
                  disponibles sin restricciones.
                </li>
                <li>
                  La membresía otorga un badge visual de reconocimiento ("Paw Member") en el perfil,
                  como agradecimiento público al apoyo.
                </li>
                <li>
                  El usuario puede cancelar la membresía en cualquier momento desde su perfil. El
                  cobro se detiene al cierre del período en curso.
                </li>
                <li>Aplican las mismas condiciones de devolución de la sección 8.1.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8.3. Planes para Veterinarios</h2>
              <p className="text-muted-foreground mb-2">
                Paw Friend ofrece tres planes para veterinarios y clínicas profesionales:
                <strong> Free</strong>, <strong>Premium</strong> y <strong>Pro Max</strong>. A
                diferencia de las donaciones y la membresía Paw Member, estos planes constituyen una
                relación comercial con contraprestación definida.
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1.5">
                <li>
                  Los planes Premium y Pro Max son pagos mensuales que otorgan funcionalidades
                  avanzadas de gestión profesional detalladas en <code>/para-veterinarios</code>.
                </li>
                <li>
                  Paw Friend emite boleta electrónica (servicio) por cada pago, conforme a las
                  normas del SII.
                </li>
                <li>
                  Aplica derecho de retracto dentro de los primeros 10 días del cobro, conforme a la
                  Ley 19.496.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">
                8.4. Publicidad y Alianzas Comerciales
              </h2>
              <p className="text-muted-foreground mb-2">
                Paw Friend puede mostrar publicidad contratada por partners comerciales ("Paw
                Companys") y contenido promocionado por creadores aliados ("Paw Voices").
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1.5">
                <li>
                  Todo contenido publicitario estará claramente identificado con la etiqueta
                  <strong> "Patrocinado"</strong> o <strong>"Paw Company"</strong>, conforme a las
                  normas de publicidad transparente del SERNAC y la Ley 19.496.
                </li>
                <li>
                  Paw Friend no vende datos personales de sus usuarios a anunciantes. Los segmentos
                  publicitarios se construyen con datos agregados y anónimos.
                </li>
                <li>
                  Los usuarios pueden reportar anuncios inapropiados escribiendo a
                  <code> pawfriendcl@gmail.com</code>.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Limitación de Responsabilidad</h2>
              <p className="text-muted-foreground">
                Paw Friend no se hace responsable por daños directos, indirectos, incidentales o
                consecuentes derivados del uso o la imposibilidad de uso del servicio. No
                garantizamos que el servicio esté libre de errores o interrupciones.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Modificaciones</h2>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los
                cambios entrarán en vigor inmediatamente después de su publicación en la aplicación.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Legislación Aplicable</h2>
              <p className="text-muted-foreground">
                Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa se
                someterá a la jurisdicción exclusiva de los tribunales chilenos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Contacto</h2>
              <p className="text-muted-foreground">
                Para cualquier consulta sobre estos términos, devoluciones, publicidad, o contacto
                general, puede contactarnos a través de:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>
                  Email oficial: <code>pawfriendcl@gmail.com</code>
                </li>
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

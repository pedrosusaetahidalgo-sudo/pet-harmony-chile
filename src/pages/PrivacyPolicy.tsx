import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@/lib/icons';
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicLayout';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Política de Privacidad | Paw Friend';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white flex flex-col">
      <PublicHeader />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <Card className="border-purple-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl">Política de Privacidad</CardTitle>
              <p className="text-muted-foreground">Última actualización: 28 de abril de 2026</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-3">1. Información que Recopilamos</h2>
                <p className="text-muted-foreground mb-2">
                  Recopilamos los siguientes tipos de información:
                </p>

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
                <p className="text-muted-foreground mb-2">
                  Utilizamos la información recopilada para:
                </p>
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
                <p className="text-muted-foreground mb-2">
                  Compartimos información solo en las siguientes circunstancias:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>
                    <strong>Con profesionales de servicios:</strong> Cuando contrata un servicio,
                    compartimos información relevante con el proveedor
                  </li>
                  <li>
                    <strong>Con otros usuarios:</strong> La información pública de perfil y
                    publicaciones es visible para otros usuarios
                  </li>
                  <li>
                    <strong>Con proveedores de servicios:</strong> Compartimos información con
                    proveedores que nos ayudan a operar la aplicación
                  </li>
                  <li>
                    <strong>Por requerimiento legal:</strong> Cuando sea necesario para cumplir con
                    leyes o procesos legales
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">4. Protección de Datos</h2>
                <p className="text-muted-foreground">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger su
                  información personal contra acceso no autorizado, pérdida, destrucción o
                  alteración. Estas medidas incluyen:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                  <li>Cifrado de datos en tránsito y en reposo</li>
                  <li>Controles de acceso estrictos</li>
                  <li>Auditorías de seguridad regulares</li>
                  <li>Políticas de seguridad del personal</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">5. Sus Derechos (ARCO + Ley 21.719)</h2>
                <p className="text-muted-foreground mb-2">
                  De acuerdo con la <strong>Ley N° 19.628</strong> de Protección de Datos Personales
                  de Chile y la <strong>Ley N° 21.719</strong> sobre Marco de Ciberseguridad, tienes
                  derechos ARCO sobre tus datos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>
                    <strong>Acceder:</strong> conocer qué datos tuyos tenemos. Puedes descargarlos
                    en formato JSON desde <code>/exportar-mis-datos</code>.
                  </li>
                  <li>
                    <strong>Rectificar:</strong> corregir datos inexactos o incompletos desde tu
                    perfil o contactando soporte.
                  </li>
                  <li>
                    <strong>Cancelar:</strong> eliminar tu cuenta y todos tus datos asociados desde{' '}
                    <code>/delete-account</code>. La eliminación es definitiva en 30 días.
                  </li>
                  <li>
                    <strong>Oponerte:</strong> rechazar el tratamiento de tus datos para fines
                    específicos (analítica, marketing) desde la configuración de notificaciones.
                  </li>
                  <li>
                    <strong>Portar:</strong> exportar tus datos en formato estructurado (JSON) para
                    moverlos a otro servicio.
                  </li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Conforme a la <strong>Ley 21.719 (Marco de Ciberseguridad)</strong>, en caso de
                  incidente de seguridad que comprometa tus datos personales, te notificaremos
                  dentro del plazo legal aplicable (72 horas para incidentes graves) y reportaremos
                  a la Agencia Nacional de Ciberseguridad cuando corresponda.
                </p>
                <p className="text-muted-foreground mt-2">
                  Para ejercer estos derechos, contáctanos a <code>pedrosusaeta@pawfriend.cl</code>{' '}
                  o usa los flujos automáticos de la app. Respondemos en un máximo de 5 días
                  hábiles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">6. Retención de Datos</h2>
                <p className="text-muted-foreground mb-2">
                  Aplicamos retención mínima por tipo de dato. Tras los plazos descritos, los datos
                  se eliminan automáticamente o se anonimizan irreversiblemente:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>
                    <strong>Cuenta y perfil (email, nombre, foto):</strong> mientras la cuenta esté
                    activa. Tras solicitud de eliminación: 30 días en cola de borrado y luego se
                    purgan permanentemente.
                  </li>
                  <li>
                    <strong>Mascotas y ficha clínica:</strong> mientras la cuenta esté activa o
                    hasta que la mascota sea marcada como fallecida y pasen 12 meses (memorial
                    permanente con consentimiento del dueño).
                  </li>
                  <li>
                    <strong>Mensajes y feed social:</strong> mientras la cuenta esté activa. Al
                    cerrar cuenta, contenido público pasa a anónimo (no se borra para preservar
                    contexto de otros usuarios).
                  </li>
                  <li>
                    <strong>Pagos y donaciones:</strong> 7 años por exigencia tributaria del SII
                    chileno (Decreto Ley 825). No se borra al cerrar cuenta.
                  </li>
                  <li>
                    <strong>Logs de error y telemetría:</strong> 90 días. PII enmascarada antes de
                    persistir (emails, RUT, teléfonos +56).
                  </li>
                  <li>
                    <strong>Eventos de analítica anónima:</strong> 24 meses. No se vinculan a tu
                    identidad sin tu consentimiento explícito.
                  </li>
                  <li>
                    <strong>Backups encriptados:</strong> 35 días en frío. Tras eso se sobrescriben
                    en rotación.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">
                  6.1. Subprocesadores (terceros con acceso a datos)
                </h2>
                <p className="text-muted-foreground mb-2">
                  Para operar Paw Friend usamos servicios de terceros que pueden procesar tus datos
                  como encargados de tratamiento bajo nuestras instrucciones. Solo reciben los datos
                  mínimos necesarios para su función:
                </p>
                <div className="overflow-x-auto">
                  <table className="text-sm w-full border-collapse">
                    <thead>
                      <tr className="border-b border-purple-100 text-left">
                        <th className="py-2 pr-4 font-semibold">Proveedor</th>
                        <th className="py-2 pr-4 font-semibold">Función</th>
                        <th className="py-2 font-semibold">Datos accedidos</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>Supabase</strong> (US)
                        </td>
                        <td className="py-2 pr-4">Base de datos + auth + storage</td>
                        <td className="py-2">Email, perfil, mascotas, ficha clínica, mensajes</td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>GitHub Pages</strong> (US)
                        </td>
                        <td className="py-2 pr-4">Hosting de la app web (estático)</td>
                        <td className="py-2">IP del navegador (logs estándar HTTP)</td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>Flow.cl</strong> (Chile)
                        </td>
                        <td className="py-2 pr-4">Procesamiento de pagos</td>
                        <td className="py-2">Email, monto, ID de transacción (sin tarjetas)</td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>Resend</strong> (US)
                        </td>
                        <td className="py-2 pr-4">Envío de emails transaccionales</td>
                        <td className="py-2">Email, contenido del mensaje (recordatorios, etc.)</td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>PostHog</strong> (US/EU)
                        </td>
                        <td className="py-2 pr-4">Analítica de uso (con consentimiento)</td>
                        <td className="py-2">
                          Eventos anónimos. Email solo si das consentimiento explícito al banner.
                        </td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>Firebase Analytics</strong> (Google, US)
                        </td>
                        <td className="py-2 pr-4">Métricas mobile (Android/iOS)</td>
                        <td className="py-2">Identificador de dispositivo, eventos in-app</td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>Sentry</strong> (US)
                        </td>
                        <td className="py-2 pr-4">Monitoreo de errores en producción</td>
                        <td className="py-2">
                          Stacktrace + URL (con tokens enmascarados, sin emails ni RUT)
                        </td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>Anthropic (Claude API)</strong> (US)
                        </td>
                        <td className="py-2 pr-4">Asistente IA y análisis de imágenes</td>
                        <td className="py-2">
                          Texto/imagen de la consulta (sin email vinculado, no usado para training)
                        </td>
                      </tr>
                      <tr className="border-b border-purple-50">
                        <td className="py-2 pr-4">
                          <strong>Google Calendar API</strong> (US)
                        </td>
                        <td className="py-2 pr-4">Sync de citas (opcional, requiere OAuth)</td>
                        <td className="py-2">
                          Solo datos de la cita (mascota, vet, fecha) — solo si lo conectas
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4">
                          <strong>Hugging Face Inference API</strong> (US/EU)
                        </td>
                        <td className="py-2 pr-4">
                          Procesamiento de embeddings biométricos (huella nasal)
                        </td>
                        <td className="py-2">
                          Imagen de hocico recortada — sin asociación a la mascota en el
                          procesamiento
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground mt-3">
                  Todos los subprocesadores firmaron acuerdos de tratamiento de datos (DPA) o sus
                  términos contractuales equivalentes. La lista se actualiza si agregamos o
                  removemos proveedores; te avisamos con 30 días de anticipación cuando un cambio
                  afecte el procesamiento de tus datos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">7. Menores de Edad</h2>
                <p className="text-muted-foreground">
                  Nuestros servicios están destinados a personas mayores de 18 años. No recopilamos
                  intencionadamente información de menores sin el consentimiento parental. Si
                  descubrimos que hemos recopilado información de un menor sin autorización, la
                  eliminaremos inmediatamente.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">8. Cookies y Tecnologías Similares</h2>
                <p className="text-muted-foreground">
                  Utilizamos cookies y tecnologías similares para mejorar su experiencia, analizar
                  el uso de la aplicación y personalizar contenido. Puede configurar su navegador
                  para rechazar cookies, pero esto puede afectar la funcionalidad de la aplicación.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">
                  8.1. Procesamiento de Pagos y Donaciones
                </h2>
                <p className="text-muted-foreground mb-2">
                  Los pagos de servicios, membresías y donaciones se procesan a través de{' '}
                  <strong>Flow.cl</strong>, un proveedor externo certificado. Paw Friend recibe
                  únicamente los datos mínimos necesarios para registrar la transacción:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>ID de transacción y token de Flow</li>
                  <li>Monto, fecha y estado del pago</li>
                  <li>Correo electrónico del usuario (solo si está autenticado)</li>
                  <li>Nombre y mensaje opcionales del donante (si el usuario elige incluirlos)</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  <strong>No almacenamos</strong> datos de tarjetas de crédito, débito, CVV ni
                  códigos de seguridad. Para detalles sobre el procesamiento de tu información por
                  parte de Flow, consulta su política de privacidad en <code>flow.cl</code>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">
                  8.2. Publicidad y Contenido Patrocinado
                </h2>
                <p className="text-muted-foreground mb-2">
                  Paw Friend puede mostrar avisos publicitarios de partners comerciales (Paw
                  Companys) y contenido promocionado por creadores aliados (Paw Voices). En cuanto a
                  tus datos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  <li>
                    <strong>No vendemos tus datos personales a anunciantes.</strong> Los segmentos
                    publicitarios se construyen con información agregada y anónima (ej: comuna, tipo
                    de mascota), nunca con datos individuales identificables.
                  </li>
                  <li>
                    No compartimos tu correo, teléfono, dirección, nombres de mascotas ni historial
                    médico con terceros con fines publicitarios.
                  </li>
                  <li>
                    Las interacciones con publicidad (clicks, impresiones) se registran de forma
                    anónima para medir efectividad del anunciante, sin vincularlas a tu identidad.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">9. Transferencias Internacionales</h2>
                <p className="text-muted-foreground">
                  Su información puede ser transferida y procesada en servidores ubicados fuera de
                  Chile. Nos aseguramos de que estas transferencias cumplan con las leyes de
                  protección de datos aplicables y que se implementen medidas de seguridad
                  adecuadas.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">10. Cambios a esta Política</h2>
                <p className="text-muted-foreground">
                  Podemos actualizar esta política de privacidad periódicamente. Le notificaremos
                  sobre cambios significativos mediante un aviso en la aplicación o por correo
                  electrónico. Le recomendamos revisar esta política regularmente.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-3">11. Contacto</h2>
                <p className="text-muted-foreground">
                  Para cualquier consulta sobre el tratamiento de tus datos, ejercer tus derechos o
                  reportar anuncios inapropiados, escríbenos a{' '}
                  <code>pedrosusaeta@pawfriend.cl</code>.
                </p>
                <p className="text-muted-foreground mt-2">
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
      </main>
      <PublicFooter />
    </div>
  );
};

export default PrivacyPolicy;

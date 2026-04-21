/**
 * AdminLeadsCRM — estados + templates de outreach.
 * Extraido de AdminLeadsCRM.tsx (E.3 auditoria top-tier 2026-04-21).
 */
import { Clock, Send, MessageSquare, Star, CheckCircle2, XCircle } from '@/lib/icons';
import type { EstadoLead } from '@/hooks/useLeadsVets';

export const ESTADOS: {
  value: EstadoLead;
  label: string;
  color: string;
  icon: React.ElementType;
}[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-slate-500', icon: Clock },
  { value: 'contactado', label: 'Contactado', color: 'bg-blue-500', icon: Send },
  { value: 'respondio', label: 'Respondió', color: 'bg-yellow-500', icon: MessageSquare },
  { value: 'interesado', label: 'Interesado', color: 'bg-purple-500', icon: Star },
  { value: 'convertido', label: 'Convertido', color: 'bg-green-500', icon: CheckCircle2 },
  { value: 'descartado', label: 'Descartado', color: 'bg-red-500', icon: XCircle },
];

export const REGISTRO_VET_URL = 'https://pawfriend.cl/registro-veterinario';

export const TEMPLATES = {
  invitacion_email: {
    nombre: 'Invitacion a registrarse (Email)',
    asunto: 'Paw Friend te invita: tu perfil veterinario gratis + ficha clinica digital',
    cuerpo: `Hola {nombre},

Soy parte del equipo fundador de Paw Friend (pawfriend.cl), una plataforma chilena hecha para veterinarios y duenos de mascotas.

Te escribo porque vi que ofreces atencion en {comunas} y creo que Paw Friend te puede servir mucho. La plataforma tiene dos experiencias:

PARA TI COMO VETERINARIO:
- Perfil profesional publico en nuestro directorio (posicionado en Google)
- Dashboard clinico: gestiona pacientes, fichas clinicas digitales y notas de consulta
- Agenda online: los duenos te reservan directo, sin llamadas
- Recordatorios automaticos de vacunas y controles a tus pacientes
- Reportes semanales de tu actividad clinica
- Ficha medica PDF descargable por paciente (nuestra joya)

PARA LOS DUENOS DE TUS PACIENTES:
- Acceden a la ficha clinica de su mascota desde el celular
- Reciben recordatorios de vacunas, desparasitaciones y controles
- Pueden compartir la ficha con otro vet si viajan o necesitan urgencia

El registro es gratuito y toma 2 minutos:
${REGISTRO_VET_URL}

Si tienes dudas, respondeme este correo o escribeme por WhatsApp al +56 9 XXXX XXXX.

Saludos,
Equipo Paw Friend
pawfriend.cl
pedrosusaeta@pawfriend.cl`,
  },
  invitacion_whatsapp: {
    nombre: 'Invitacion a registrarse (WhatsApp)',
    asunto: '',
    cuerpo: `Hola {nombre}! Te escribimos desde Paw Friend (pawfriend.cl).

Vi que haces atencion veterinaria en {comunas} y queria invitarte a la plataforma.

Paw Friend tiene un panel profesional para vets donde puedes:
- Tener tu perfil publico en nuestro directorio
- Gestionar fichas clinicas digitales de tus pacientes
- Recibir reservas online
- Generar PDF de ficha medica por paciente

Los duenos de mascotas acceden a la ficha de su mascota, reciben recordatorios de vacunas y pueden compartir la ficha con otro vet.

Es gratis registrarse: ${REGISTRO_VET_URL}

Te interesa? Puedo ayudarte a configurar tu cuenta en 2 minutos.`,
  },
  seguimiento_email: {
    nombre: 'Seguimiento (Email)',
    asunto: 'Re: Paw Friend - tu perfil veterinario gratis',
    cuerpo: `Hola {nombre},

Te escribi hace unos dias sobre Paw Friend. Queria saber si tuviste oportunidad de ver la plataforma.

Los duenos de mascotas en {comunas} estan buscando veterinarios activamente y tu perfil podria aparecer en los primeros resultados de Google.

Registrarte toma 2 minutos y es gratis:
${REGISTRO_VET_URL}

Si prefieres, te ayudamos a crear tu cuenta y te enviamos el acceso listo.

Saludos,
Equipo Paw Friend`,
  },
  seguimiento_whatsapp: {
    nombre: 'Seguimiento (WhatsApp)',
    asunto: '',
    cuerpo: `Hola {nombre}! Te escribi hace unos dias sobre Paw Friend.

Queria recordarte que puedes tener tu perfil veterinario gratis en nuestra plataforma. Los duenos en {comunas} buscan vets como tu.

Registro gratis en 2 min: ${REGISTRO_VET_URL}

Te ayudo a configurarlo?`,
  },
};

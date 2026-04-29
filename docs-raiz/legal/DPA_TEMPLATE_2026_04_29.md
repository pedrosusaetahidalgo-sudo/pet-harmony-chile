# Paw Friend — Data Processing Agreement (DPA) Template (2026-04-29)

> **Borrador legal genérico** para acuerdos con subprocesadores y partners B2B.
> Debe ser revisado por abogado chileno antes de firmar oficialmente con
> contraparte real (CLP 200-500k revisión legal estimada).
>
> Versión: 1.0 (borrador)
> Compatible con: Ley 19.628 + Ley 21.719 + GDPR (referencial Europa).

---

## ACUERDO DE TRATAMIENTO DE DATOS PERSONALES

Entre:

**SUSAETA GARNHAM SOFTWARE ENGINEERING SpA** ("Paw Friend"), RUT
78.328.659-9, con domicilio en Luis Pasteur 6111 Dp 201, Vitacura,
Santiago, Chile, representada por su Gerente General Pedro Susaeta
Hidalgo, en adelante el "**Responsable**".

Y

**[NOMBRE LEGAL DE LA CONTRAPARTE]**, RUT [_______], con domicilio en
[___________], representada por [______], en adelante el "**Mandatario**"
(en algunos casos referido como "Encargado de Tratamiento" o
"Subprocesador").

(Conjuntamente las "Partes")

---

## CLÁUSULAS

### 1. Objeto del Acuerdo

El presente Acuerdo regula el tratamiento de datos personales que el
Mandatario realiza por cuenta del Responsable, en el marco del contrato
principal de prestación de servicios firmado entre ambas Partes con
fecha [FECHA] (el "Contrato Principal").

### 2. Alcance del tratamiento

El Mandatario tratará datos personales únicamente para los siguientes
fines:

[ESPECIFICAR según subprocesador. Ejemplos:]
- Para Petify: identificación biométrica de mascotas vía huella nasal +
  matching de pets perdidas.
- Para Supabase: hosting de base de datos, autenticación, edge
  functions, storage de archivos.
- Para Resend: envío de emails transaccionales (welcome, recordatorios,
  notificaciones de aporte).
- Para Sentry: monitoreo de errores y performance del producto.
- Para PostHog: analytics de comportamiento de usuario (con consent
  cookies).
- Para Flow.cl: procesamiento de pagos y facturación.

### 3. Categorías de datos tratados

El Mandatario tendrá acceso a las siguientes categorías de datos:

- **Identificación**: nombre, email, teléfono.
- **Datos de mascota**: nombre, especie, raza, edad, fotos.
- **Datos médicos**: vacunas, antiparasitarios, tratamientos, consultas
  veterinarias.
- **Datos financieros**: solo metadata de pagos (nunca PAN/CVV — Flow.cl
  los procesa directamente).
- **Datos biométricos animales**: embeddings de huella nasal (solo para
  Petify).
- **Datos de uso**: actividad in-app, dispositivos usados, sesiones.

[Ajustar según subprocesador específico.]

### 4. Categorías de titulares

Los datos pertenecen a:

- Dueños de mascotas registrados en Paw Friend.
- Veterinarios registrados como providers.
- Refugios y hogares de adopción.
- Empleados de partners B2B (cuando aplique).

### 5. Duración del tratamiento

El Mandatario tratará los datos durante:

- La vigencia del Contrato Principal.
- Más el período de retención exigido por ley:
  - 7 años para datos financieros (SII Chile).
  - 5 años para datos médicos veterinarios.
  - 3 años para datos generales (default).
  - Retención específica si la legislación lo exige.

Vencido el período, el Mandatario debe:
1. Devolver los datos al Responsable en formato estructurado.
2. Confirmar por escrito la eliminación segura de copias remanentes.

### 6. Obligaciones del Mandatario

El Mandatario se obliga a:

a. **Usar los datos solo para los fines del Contrato Principal**, no
   para fines propios sin consent expreso del Responsable.

b. **Implementar medidas de seguridad** apropiadas, incluyendo:
   - Cifrado en reposo (AES-256 mínimo).
   - Cifrado en tránsito (TLS 1.2+).
   - Control de acceso basado en roles (RBAC).
   - Auditoría de logs de acceso.
   - Pruebas de penetración periódicas.
   - Plan de continuidad y backup.

c. **Notificar incidentes de seguridad** dentro de las 48 horas
   siguientes a la detección, incluyendo: alcance, datos afectados,
   medidas tomadas, y plan de remediación.

d. **No transferir datos a terceros** (sub-subprocesadores) sin consent
   previo y escrito del Responsable.

e. **Cooperar con derechos ARCO** (Acceso, Rectificación, Cancelación,
   Oposición) de los titulares, cuando el Responsable solicite ejecutar
   uno.

f. **Permitir auditorías** del Responsable o de un auditor externo
   designado por él, con notice de 30 días, una vez al año máximo.

g. **Cumplir con leyes aplicables**: Ley 19.628 (Chile), Ley 21.719
   (Marco Ciberseguridad), GDPR (si datos de europeos) y normativa
   sectorial pertinente.

### 7. Transferencias internacionales

El Mandatario:

[Si Mandatario está fuera de Chile:]
- Está ubicado en [PAÍS] y los datos serán transferidos a esa
  jurisdicción.
- Se obliga a aplicar **garantías equivalentes** a las exigidas por la
  legislación chilena (Standard Contractual Clauses si aplica GDPR, o
  garantías específicas del subprocesador).
- Casos específicos:
  - Petify (Corea / US): aplicar SCC + medidas adicionales sobre
    embeddings biométricos.
  - Supabase (US): aplica DPA estándar Supabase v3 + cifrado TDE.
  - Resend (US): aplica DPA estándar Resend.
  - Sentry / PostHog (US/UK): aplican sus DPAs públicos.

### 8. Confidencialidad

El Mandatario y su personal mantendrán **confidencialidad** sobre los
datos del Responsable, incluso después de finalizado el Contrato
Principal. Esta obligación se extiende por **5 años post-término**.

### 9. Responsabilidad e indemnización

El Mandatario será responsable de daños y perjuicios causados por:
- Tratamiento contrario al presente Acuerdo.
- Incumplimiento de medidas de seguridad.
- Filtración o acceso no autorizado a datos por dolo o negligencia.

El Responsable se reserva el derecho de exigir indemnización de daño
moral y/o material a sus usuarios afectados.

**Limitación de responsabilidad**: el Mandatario responde hasta el
monto total pagado bajo el Contrato Principal en los últimos 12 meses
por casos de negligencia simple. Sin límite por casos de dolo o culpa
grave.

### 10. Vigencia y término

Este Acuerdo entra en vigencia desde su firma y permanece mientras esté
vigente el Contrato Principal o haya datos en posesión del Mandatario,
lo que ocurra después.

El Responsable puede dar término anticipado con 30 días de notice si:
- El Mandatario incumple obligaciones esenciales del Acuerdo.
- Hay un incidente de seguridad grave no remediado.
- Cambia el control corporativo del Mandatario sin notice previo.

### 11. Resolución de controversias

Cualquier disputa relacionada con este Acuerdo se resolverá según:

1. **Negociación directa** entre las Partes (30 días).
2. **Mediación** ante Centro de Arbitraje y Mediación de la Cámara de
   Comercio de Santiago.
3. **Arbitraje** ante el mismo Centro, con sede en Santiago, Chile,
   idioma español, ley aplicable: chilena.

### 12. Notificaciones

Para Paw Friend:
- Email: `pawfriendcl@gmail.com`
- Dirección postal: Luis Pasteur 6111 Dp 201, Vitacura, Santiago

Para el Mandatario:
- Email: [_______]
- Dirección postal: [_______]

---

## ANEXO A — Subprocesadores ya autorizados

El Responsable autoriza al Mandatario a usar los siguientes
sub-subprocesadores (si aplica):

| Sub-subprocesador | Función | Jurisdicción |
|---|---|---|
| AWS / GCP / Azure | Infraestructura cloud | US/Multi |
| Cloudflare | CDN / WAF | Multi |
| ... | ... | ... |

Cualquier nuevo sub-subprocesador requiere notice 30 días previos.

---

## ANEXO B — Medidas de seguridad técnicas y organizativas

[Detallar medidas específicas según el subprocesador y tipo de datos.]

### Técnicas
- Cifrado en reposo: AES-256.
- Cifrado en tránsito: TLS 1.2+.
- Autenticación: MFA para acceso administrativo.
- Backup: diario incremental + semanal completo + retención 90 días.
- Monitoreo: 24/7 con alertas automáticas.

### Organizativas
- Política de seguridad documentada y revisada anualmente.
- Capacitación anual al personal sobre privacidad y seguridad.
- Auditoría externa SOC 2 / ISO 27001 (si aplica).
- Plan de respuesta a incidentes documentado y probado anualmente.

---

## FIRMAS

**Por SUSAETA GARNHAM SOFTWARE ENGINEERING SpA**:

Nombre: Pedro Susaeta Hidalgo
Cargo: Gerente General
Fecha: [_______]
Firma: [_______]

**Por [CONTRAPARTE]**:

Nombre: [_______]
Cargo: [_______]
Fecha: [_______]
Firma: [_______]

---

## NOTAS PARA PEDRO (no incluir en contrato firmado)

### Cuándo usar este template

Cada vez que firmes con un nuevo subprocesador que toque datos de
usuarios. Preguntale primero si tienen su propio DPA estándar (la
mayoría sí — Supabase, Resend, Sentry, PostHog publican el suyo). En
ese caso firmas el de ellos y archivás copia.

Solo usás ESTE template cuando la contraparte:
- No tenga DPA propio publicado.
- Sea partner B2B que va a procesar data agregada (pharma, seguros,
  retail).
- Sea sub-contractor custom (ej: agencia de marketing manejando email
  list).

### Variantes específicas necesarias

| Subprocesador | DPA público propio | Acción |
|---|---|---|
| Supabase | Sí — supabase.com/dpa | Firmar el de ellos |
| Resend | Sí — resend.com/dpa | Firmar el de ellos |
| Sentry | Sí — sentry.io/legal/dpa | Firmar el de ellos |
| PostHog | Sí — posthog.com/dpa | Firmar el de ellos |
| Petify | A confirmar | Pedir el suyo, si no usar este template adaptado |
| Flow.cl | A confirmar | Pedir el suyo |
| Pharma partners (Centrovet, etc) | No | Usar este template |
| Seguros (Sura, BCI) | No | Usar este template |
| Retail (Master Dog, Falabella) | No | Usar este template |

### Próximos pasos

1. **Esta semana**: descargar DPAs públicos de Supabase, Resend, Sentry,
   PostHog. Revisar y firmar.
2. **Cuando contactes Petify (negociar PROD)**: pedir DPA propio. Si no
   tienen, usar este template.
3. **Antes de firmar primer pharma/seguros/retail**: customizar este
   template con abogado chileno (~CLP 300-500k revisión).

---

**Última actualización**: 2026-04-29 (borrador 1.0)
**Próxima revisión**: con abogado chileno antes de firmar primer
contrato real con partner B2B.

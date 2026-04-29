# Paw Friend — Contrato B2B Pro Max Template (2026-04-29)

> **Borrador legal** para clínicas veterinarias que contratan el plan
> Pro Max ($29.900/mes o tier custom Empresarial). Aplica cuando una
> clínica grande pide condiciones específicas o SLA formal.
>
> **NO usar tal cual** sin revisión por abogado chileno (CLP 200-400k
> recomendado). Este es el draft preparatorio.
>
> Versión: 1.0 (borrador 2026-04-29)
> Ley aplicable: chilena.

---

## CONTRATO DE PRESTACIÓN DE SERVICIOS SAAS

### Plan Pro Max — [NOMBRE CLÍNICA]

En Santiago de Chile, a [FECHA], comparecen:

**SUSAETA GARNHAM SOFTWARE ENGINEERING SpA** ("Paw Friend"), RUT
78.328.659-9, con domicilio en Luis Pasteur 6111 Dp 201, Vitacura,
representada por su Gerente General Pedro Susaeta Hidalgo, RUT
[_______], en adelante el "**Prestador**".

Y

**[NOMBRE CLÍNICA / RAZÓN SOCIAL]**, RUT [_______], con domicilio en
[_______], representada por [______], RUT [______], en su calidad de
[gerente / representante legal], en adelante el "**Cliente**".

(Conjuntamente las "Partes")

---

## CLÁUSULA PRIMERA — Antecedentes

1.1. El Prestador opera la plataforma SaaS "Paw Friend" (pawfriend.cl),
disponible vía web y apps móviles, que permite gestionar fichas
clínicas longitudinales de mascotas, agendamientos, pacientes,
notificaciones y reportes para veterinarios y clínicas veterinarias.

1.2. El Cliente es una clínica veterinaria con [N] sucursales y [M]
veterinarios habilitantes en Chile, que requiere una solución SaaS
profesional para gestionar sus pacientes y operación.

1.3. Las Partes desean formalizar la prestación de servicios bajo el
Plan Pro Max de Paw Friend.

---

## CLÁUSULA SEGUNDA — Objeto

2.1. El Prestador otorga al Cliente una licencia no exclusiva,
intransferible y limitada para usar la plataforma Paw Friend bajo el
**Plan Pro Max**, que incluye:

a. **Pacientes ilimitados** registrables en la plataforma.
b. **Veterinarios ilimitados** asignables como "seats" bajo la cuenta
   del Cliente (sub-usuarios).
c. **Multi-sucursal**: gestión de múltiples sucursales bajo un mismo
   panel administrativo.
d. **Branding completo**: personalización con logo y colores del Cliente
   en perfiles públicos, emails transaccionales y reportes.
e. **Bulk patient import**: importación masiva de pacientes via CSV/Excel.
f. **Analytics avanzado**: panel pro con métricas operativas detalladas.
g. **API access**: acceso a endpoints para integración con sistemas
   internos del Cliente (ERP, contabilidad, agenda).
h. **Soporte prioritario**: respuesta < 24h hábiles a incidentes.
i. **Comisión 0%** sobre bookings (vs 10% en Plan Básica).

2.2. El alcance específico de la integración técnica se detalla en el
**ANEXO A — Plan de Integración**.

---

## CLÁUSULA TERCERA — Precio y forma de pago

3.1. El Cliente pagará al Prestador una **tarifa mensual de
$29.900 CLP IVA incluido**, o el monto custom acordado en el ANEXO B —
Pricing.

3.2. **Forma de pago**: facturación mensual electrónica via Flow.cl.
Vencimiento al día 5 de cada mes.

3.3. **Reajuste**: el precio se reajustará anualmente en cada
aniversario del Contrato según IPC chileno (sin pasar 5% anual sin
acuerdo).

3.4. **Mora**: el atraso de más de 30 días en el pago habilita al
Prestador a suspender el servicio previo aviso por escrito de 7 días.

3.5. **Tributario**: el Prestador emitirá factura electrónica al
Cliente. IVA es asumido por el Cliente como contribuyente.

---

## CLÁUSULA CUARTA — Service Level Agreement (SLA)

4.1. El Prestador se compromete a los siguientes niveles de servicio:

| Métrica | Compromiso | Medición |
|---|---|---|
| Uptime mensual | ≥ 99.5% | Healthchecks automatizados Sentry/Cloudflare |
| Tiempo de respuesta promedio API | < 500ms (p95) | Logs Supabase + Sentry |
| Tiempo de respuesta soporte | < 24h hábiles | Email a `pawfriendcl@gmail.com` |
| Resolución incidentes críticos | < 8h hábiles | Definición incidente crítico en Anexo C |
| Backup datos | Diario incremental + semanal completo | Supabase native |
| Retención backups | 90 días | Supabase Pro plan |

4.2. **Compensación por incumplimiento de SLA**:

| Uptime mensual real | Crédito al mes siguiente |
|---|---|
| 99.5% - 99.0% | 5% del fee |
| 99.0% - 98.0% | 10% del fee |
| 98.0% - 95.0% | 25% del fee |
| < 95.0% | 100% del fee + derecho rescisión sin multa |

4.3. **Excepciones al SLA** (no contabilizan para uptime):
- Ventanas de mantenimiento programado con 48h de aviso.
- Causas de fuerza mayor (cortes nacionales, guerra, desastre).
- Indisponibilidad de servicios de terceros críticos (Supabase,
  Cloudflare) cuyo SLA propio se cumple.

---

## CLÁUSULA QUINTA — Datos y confidencialidad

5.1. **Propiedad de datos**: los datos cargados por el Cliente
(pacientes, fichas, citas) son **propiedad del Cliente** y/o de los
dueños de mascotas según corresponda. El Prestador es **encargado de
tratamiento** según Ley 19.628.

5.2. **Confidencialidad**: ambas Partes mantienen confidencialidad
sobre datos comerciales, técnicos y operativos compartidos. Esta
obligación se extiende **5 años post-término**.

5.3. **DPA (Data Processing Agreement)**: las Partes firman en este
acto el ANEXO D — Acuerdo de Tratamiento de Datos Personales (basado
en [DPA_TEMPLATE_2026_04_29.md](DPA_TEMPLATE_2026_04_29.md)).

5.4. **Datos médicos**: Paw Friend implementa medidas técnicas y
organizativas para proteger información médica veterinaria conforme a
estándares de la industria (cifrado, RLS, audit logs, ARCO, Ley
21.719).

5.5. **Portabilidad**: al término del Contrato, el Cliente puede
exportar todos sus datos en formato estructurado (JSON/CSV) durante
los 90 días siguientes. Después de ese plazo el Prestador puede
eliminarlos.

---

## CLÁUSULA SEXTA — Propiedad intelectual

6.1. El Prestador conserva todos los derechos de propiedad intelectual
sobre la plataforma Paw Friend, incluyendo código, diseño, marca y
documentación.

6.2. La licencia otorgada al Cliente es de uso, no de propiedad. El
Cliente no puede:
- Hacer ingeniería inversa de la plataforma.
- Sublicenciar el acceso a terceros.
- Copiar funcionalidades para construir productos competidores.

6.3. **Branding del Cliente**: el Cliente conserva propiedad sobre su
marca (logo, colores) y solo otorga licencia limitada al Prestador
para uso en la plataforma según ANEXO A.

---

## CLÁUSULA SÉPTIMA — Vigencia, renovación y término

7.1. **Vigencia inicial**: 12 meses contados desde la firma.

7.2. **Renovación automática**: por períodos sucesivos de 12 meses
salvo notice de no-renovación con 60 días de anticipación.

7.3. **Término sin causa**: cualquiera de las Partes puede terminar el
Contrato con notice de 60 días por escrito.

7.4. **Término con causa** (incumplimiento esencial):
- Falta de pago > 30 días tras requerimiento.
- Incumplimiento del SLA por 3 meses consecutivos.
- Filtración de datos por dolo o culpa grave.
- Bloqueo en el SII / liquidación de la SpA.

7.5. **Efectos del término**:
- Acceso suspendido a la plataforma 30 días post-término.
- Cliente exporta datos en los siguientes 90 días.
- Pasados 90 días, datos del Cliente eliminados (excepto los exigidos
  por ley: 7 años financieros, 5 años médicos veterinarios).

---

## CLÁUSULA OCTAVA — Limitación de responsabilidad

8.1. **Responsabilidad máxima del Prestador**: el monto total pagado
por el Cliente en los últimos 12 meses bajo este Contrato.

8.2. **Excepciones** (sin límite):
- Dolo o culpa grave del Prestador.
- Incumplimiento de obligaciones de confidencialidad.
- Daños a terceros por falta de medidas de seguridad documentadas.

8.3. **Daños indirectos**: ninguna Parte responde por lucro cesante,
daño emergente indirecto, pérdida de oportunidad de negocio o reputación,
salvo dolo.

---

## CLÁUSULA NOVENA — Garantías y seguros

9.1. El Prestador garantiza:
- Plataforma libre de malware en cada release publicado.
- Cumplimiento sustancial de Ley 21.719 (Ciberseguridad) y Ley 19.628
  (Datos Personales).
- Continuidad del servicio mientras dure el Contrato.

9.2. **Seguro responsabilidad civil**: el Prestador puede tomar póliza
de responsabilidad civil profesional cuando los ingresos lo justifiquen
(meta: tomar póliza ~CLP 3-5M anual cuando ARR > USD 500k/año).

---

## CLÁUSULA DÉCIMA — Resolución de controversias

10.1. Cualquier disputa se resuelve según:

a. **Negociación directa** entre representantes (30 días).

b. **Mediación** ante Centro de Arbitraje y Mediación de la Cámara
   de Comercio de Santiago.

c. **Arbitraje** ante el mismo Centro, sede Santiago, idioma
   español, normas vigentes del CAM.

10.2. **Ley aplicable**: chilena.

10.3. **Costas**: cada Parte asume las suyas, salvo que el árbitro
imponga costas a la Parte vencida.

---

## CLÁUSULA UNDÉCIMA — Misceláneos

11.1. **Domicilio**: para todos los efectos legales, las Partes fijan
domicilio en Santiago de Chile.

11.2. **Notificaciones**: por email a las direcciones del ANEXO E.
Aviso por carta certificada solo para términos con causa.

11.3. **Cesión**: ninguna Parte puede ceder el Contrato sin consent
escrito de la otra, salvo por reestructuración corporativa interna.

11.4. **Modificaciones**: cualquier modificación debe constar por
escrito y firma de ambas Partes.

11.5. **Independencia de cláusulas**: si una cláusula es declarada
inválida, las demás permanecen vigentes.

11.6. **Idioma**: español (Chile).

---

## ANEXOS

### ANEXO A — Plan de Integración (técnico)

[Detallar:]
- Cronograma de onboarding (semanas 1-4).
- Importación inicial de pacientes (formato CSV requerido).
- Capacitación al equipo del Cliente (online/presencial).
- Configuración de branding y sucursales.
- Setup de API si aplica.
- Pruebas de aceptación.

### ANEXO B — Pricing custom (si aplica)

[Solo si la clínica negocia precio distinto al $29.900 estándar:]
- Volumen / multi-año / integración profunda → discount.
- Servicios profesionales adicionales (custom report, integración con
  ERP) → fee separado.

### ANEXO C — Definición incidente crítico

| Severidad | Definición | Tiempo respuesta |
|---|---|---|
| Crítico (P0) | Plataforma 100% down para Cliente. Pacientes no accesibles | < 1h |
| Alto (P1) | Funcionalidad core rota (ej: agendamiento no funciona) | < 4h |
| Medio (P2) | Bug reproducible no bloqueante | < 24h hábiles |
| Bajo (P3) | UX/UI menor | < 7 días hábiles |

### ANEXO D — DPA (Data Processing Agreement)

Ver [DPA_TEMPLATE_2026_04_29.md](DPA_TEMPLATE_2026_04_29.md). Adjuntar
el doc firmado.

### ANEXO E — Datos de contacto

**Para Paw Friend**:
- Email comercial: `pawfriendcl@gmail.com`
- Email técnico/soporte: `pawfriendcl@gmail.com`
- Teléfono emergencia: [+56 9 _______]

**Para [CLIENTE]**:
- Email principal: [_______]
- Email facturación: [_______]
- Email técnico: [_______]
- Teléfono emergencia: [_______]

---

## FIRMAS

**Por SUSAETA GARNHAM SOFTWARE ENGINEERING SpA**:

Nombre: Pedro Susaeta Hidalgo
Cargo: Gerente General
RUT: [_______]
Fecha: [_______]
Firma: ______________________

**Por [CLIENTE]**:

Nombre: [_______]
Cargo: [_______]
RUT: [_______]
Fecha: [_______]
Firma: ______________________

---

## NOTAS PARA PEDRO (no incluir en contrato firmado)

### Cuándo usar este template

- Cuando una clínica grande / cadena pida contrato formal antes de
  pagar Pro Max.
- Cuando el cliente quiera SLA escrito o personalización profunda.
- Cuando el cliente B2B sea una entidad pública o municipal (vía Plan
  Pro Max custom).

### Cuándo NO usarlo

- Vets individuales (`provider_premium`) — basta con T&C estándar.
- Clínicas que toman Plan `provider_clinic_starter` ($19.900) sin
  pedir contrato — basta con T&C + email confirmación.
- Trial / piloto < 3 meses sin compromiso.

### Customización por cliente

Adaptar:
1. Razón social y RUT del Cliente.
2. Número de sucursales y veterinarios (afecta Anexo A).
3. SLA específicos si el Cliente exige más estricto (ej: 99.9%
   uptime → revisar viabilidad infra).
4. Pricing si negocia descuento o servicios extra.
5. Plan de integración técnico (Anexo A) detallado.

### Costos legales

- Revisión inicial del template por abogado chileno: CLP 200-400k.
- Customización por contrato firmado: CLP 50-100k por adaptación.
- Cuando facturación B2B > 10 contratos/año, considerar contrato marco
  + scope orders.

---

**Última actualización**: 2026-04-29 (borrador 1.0)
**Próxima revisión**: con abogado chileno cuando se firme primer
contrato real con cliente Pro Max.

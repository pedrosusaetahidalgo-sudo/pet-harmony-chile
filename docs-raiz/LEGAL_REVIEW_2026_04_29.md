# Paw Friend — Legal Review v2.1 (2026-04-29)

> Fase 5 del [pawfriend-prompt-v5.md](../pawfriend-prompt-v5.md).
> Estado actual de compliance + gaps + recomendaciones.
>
> **NOTA CRÍTICA**: este documento es preparatorio. Antes del lanzamiento
> público (1 junio 2026) los drafts T&C + Privacy DEBEN ser revisados por
> abogado chileno con licencia. Budget referencial: CLP 500k-1.5M.

---

## 1. Estado actual T&C ([src/pages/TermsOfService.tsx](../src/pages/TermsOfService.tsx))

### ✅ Cubre correctamente

- **Aportes voluntarios** (sección 8.1) con referencia explícita a Ley 19.885 sobre donaciones con beneficios tributarios. Aclara que NO se emiten certificados de donación al user (Paw Friend no es donatario calificado SII).
- **Devolución aporte** dentro de 10 días según Ley 19.496 sobre Protección al Consumidor.
- **Membresías Paw Member y Manada** (sección 8.2) con precios actualizados:
  - Paw Member $3.990/mes · $39.900/año · hasta 4 mascotas
  - Manada $9.990/mes · hasta 5 mascotas
- **Paw Shield biométrico** mencionado como feature de Paw Member.
- **Manada Fondo Refugios** explicado: aporte $2.000 mensual al fondo, donación efectiva la hace **Paw Friend SpA** (NO el user) — diseño legal anti-Ley 19.885.
- **Planes B2B vet** (sección 8.3) diferenciados de aportes/membresías como prestación de servicios SaaS.

### 🟡 Gaps menores (revisión recomendada)

- [ ] **Plan Manada anual ($99.900)** no aparece explícitamente en sección 8.2 — solo el mensual. Agregar ambos ciclos.
- [ ] **Política de cancelación** Paw Member/Manada: el flow de cancelar suscripción hoy abre email a `pawfriendcl@gmail.com` (no self-serve). T&C debería decir explícitamente cómo cancelar y plazos.
- [ ] **Renovación automática** (`auto_renew=true` en `subscriptions`): mencionar que las suscripciones se renuevan automáticamente y cómo desactivar.
- [ ] **Reembolso pro-rata** si cancelas a mitad de mes: política no clara hoy.
- [ ] **Conflicto de planes**: si downgrade de Manada → Paw Member, qué pasa con el aporte refugio del mes.

---

## 2. Estado actual Privacy ([src/pages/PrivacyPolicy.tsx](../src/pages/PrivacyPolicy.tsx))

### ✅ Cubre correctamente

- **Ley 21.719 (Marco de Ciberseguridad)** — referencia explícita, derechos ARCO ampliados.
- **Notificación de incidentes** dentro de plazos legales.
- **Retención de datos**:
  - Pagos y aportes 7 años (exigencia SII)
  - Otras categorías documentadas
- **Petify (PetNow)** declarado como subprocesador con jurisdicción Corea/US.
- **Paw Shield opt-in**: explicación clara que el user activa explícitamente la captura biométrica nasal.
- **Archivo de imágenes opt-in** para mejorar modelo propio (`paw_shield_data_archive`) declarado.
- **Procesamiento de embeddings biométricos** explicado.

### 🟡 Gaps menores

- [ ] **Manada Fondo Refugios** no está explicado en Privacy: cuando user cambia preferencia de refugio, eso queda registrado en `manada_refugio_preferences`. Mencionar como dato procesado.
- [ ] **Bitácora `manada_aportes_log`**: declarar como dato procesado bajo "Pagos y aportes".
- [ ] **Refugios como destinatarios**: agregar que si user opt-in a Manada, su nombre de aportante puede aparecer en transparencia pública del Fondo (si así lo decide).
- [ ] **Subprocesadores B2B futuros** (pharma, seguros, retail): T&C/Privacy debe contemplar que data agregada anonimizada puede licenciarse a partners B2B (con consent flag `anonymous_data_research_consent` ya existente).

---

## 3. Otros documentos legales necesarios

### 3.1 Política de cookies / consent banner

- [src/components/CookieConsentBanner.tsx](../src/components/CookieConsentBanner.tsx) ya existe.
- Verificar que la captura del consent quede registrada para auditoría (compliance Ley 21.719).
- Cookies de terceros (Sentry, PostHog) deben ser declaradas explícitamente.

### 3.2 Política de Uso Aceptable (AUP)

- **NO existe documento dedicado**. Debería crearse para regular:
  - Contenido inapropiado en posts/feed (si se habilita)
  - Mascotas falsas / fotos no propias
  - Violación de términos por vets (datos médicos no autorizados)
- Sugerencia: incluir como sección en T&C o documento separado `/uso-aceptable`.

### 3.3 Contrato B2B con clínicas (Pro Max)

- Plan Clínica/Pro Max usa T&C estándar pero debería tener **anexo contractual** específico:
  - Acuerdo de servicio (SLA básico)
  - Confidencialidad (datos médicos pacientes)
  - Limitación de responsabilidad
- Pedro necesita plantilla de contrato cuando firme primer Pro Max real.

### 3.4 Acuerdo de tratamiento de datos con partners B2B

- Cuando firme primer pharma/seguros: necesita **DPA (Data Processing Agreement)** que regule:
  - Qué data anonimizada se comparte
  - Cómo se anonimiza
  - Retention en partner
  - Audit rights
- Plantilla debe contemplar Art. 14 Ley 21.719 (responsable y mandatario del tratamiento).

---

## 4. Compliance check Ley 21.719 (Ciberseguridad)

| Requisito | Cumplimiento actual | Acción |
|---|---|---|
| **Notificación de incidente < 72h** a CERT.cl | Mencionado en Privacy | Crear procedimiento interno + responsable designado |
| **Auditoría anual** de seguridad | No hay aún | Programar Q3 2026 con consultor externo |
| **Hardening RLS Supabase** | ✅ 768 policies, audit 2026-04-30 | Cierre 4 hallazgos en mig 20260918 |
| **Cifrado en reposo** | ✅ Supabase nativo (AES-256) | Documentar en página interna |
| **Cifrado en tránsito** | ✅ HTTPS forzado | Confirmado en build |
| **Logging de eventos críticos** | ✅ withTelemetry + admin_audit_log + error_logs | Verificar retención 1 año mínimo |
| **Multi-factor auth para admin** | ⚠️ No verificado | Pedro debe activar 2FA en su cuenta admin |
| **Plan de continuidad / backup** | ⚠️ Backup weekly cron existe | Probar restore al menos 1 vez antes del launch |

---

## 5. Compliance check Ley 19.628 (Protección Datos)

| Requisito | Cumplimiento actual | Acción |
|---|---|---|
| **Consentimiento expreso para data sensible** | ✅ Research consent + Paw Shield opt-in | OK |
| **Finalidades declaradas** | ✅ En Privacy | OK |
| **Bases de licitud** | ✅ Contrato + consent + interés legítimo | OK |
| **Derechos ARCO** | ✅ `/profile/exportar-mis-datos` + `/profile/mis-datos-compartidos` | OK |
| **Registro de actividades** | ⚠️ Implícito en logs | Crear "Registro de Tratamiento" formal según Art. 14 Ley 19.628 actualizada |
| **Encargado de tratamiento** | ⚠️ Petify, Supabase, Resend, Sentry, PostHog | DPAs firmados con cada uno |
| **Transferencias internacionales** | ✅ Petify (Corea/US), Supabase (US) declarados | Verificar cláusulas de transferencia con cada uno |

---

## 6. Compliance tributario SpA

### 6.1 Estado actual SpA SUSAETA GARNHAM SOFTWARE ENGINEERING

- ✅ Constituida 2026-04-17 (RUT 78.328.659-9)
- ✅ Inicio actividades SII (Luis Pasteur 6111 Dp 201, Vitacura)
- 🟡 **Migración cuenta Flow.cl a SpA en curso** (memoria 2026-04-22) — bloqueante para suscripciones recurrentes
- 🟡 **Cuenta bancaria SpA**: Pedro confirmó proceso esta semana (2026-04-20)

### 6.2 IVA en SaaS B2C (Paw Member, Manada)

- Suscripciones Paw Member y Manada **están afectas a IVA 19%** según Art. 8 Ley IVA.
- **Decisión pendiente**: ¿el precio mostrado al user incluye IVA o se suma encima?
  - Hoy el código muestra "$3.990/mes" — debería clarificarse si es **CON IVA** (estándar B2C Chile) o sin.
  - Si **CON IVA**: Paw Friend recibe $3.353 neto + $637 IVA débito.
  - Si **SIN IVA**: Paw Friend recibe $3.990 + cobra $759 IVA al user.
- Recomendación: B2C en Chile típicamente muestra precios **CON IVA**. Ajustar copy si necesario y documentar interno.

### 6.3 Factura electrónica

- Cada cobro Paw Member/Manada/B2B debe emitir boleta o factura electrónica.
- **Pedro debe configurar** integración con SII/sistema de boletas (puede ser via Flow.cl si lo soporta, o sistema externo tipo Defontana, Toteat, etc).

### 6.4 Donaciones SpA → Refugios (Manada Fondo)

- Paw Friend SpA hace donación efectiva a refugios usando Art. 31 N°7 Ley sobre Impuesto a la Renta.
- **Deducible** del impuesto a la renta de la SpA si los refugios son **personas jurídicas sin fines de lucro** verificadas.
- **Recomendación**: para que las donaciones sean deducibles, los refugios receptores deben estar **inscritos en el Registro de Donatarios SII** o ser personas jurídicas sin fines de lucro registradas legalmente.
- Pedro debe pedir a cada refugio: RUT + estatutos + comprobante personería jurídica antes de donar.

---

## 7. Marca Paw Friend en INAPI

- 🟡 **Estado registro pendiente verificar**.
- Pedro debe consultar INAPI Chile (https://www.inapi.cl) si "Paw Friend" está registrable como marca:
  - Clase 9 (software / aplicaciones móviles)
  - Clase 35 (servicios de publicidad / business)
  - Clase 42 (servicios de tecnología / SaaS)
  - Clase 44 (servicios veterinarios / cuidado animal)
- **Riesgo**: si "Paw" o "Pawfriend" ya están registrados por otro tercero, podría haber conflicto.
- **Acción sugerida**: contratar gestor de marcas (~CLP 200-400k) para registrar oficialmente.

---

## 8. Riesgos legales identificados

| Riesgo | Severidad | Mitigación |
|---|---|---|
| **Cuenta Flow.cl en nombre persona natural mientras se cobran suscripciones** | Alta | URGENTE: completar migración a SpA antes del launch (1 junio) |
| **Donaciones de Paw Friend SpA a refugios sin verificar personería jurídica** | Media | Implementar checklist legal antes de cada donación |
| **Datos médicos de mascotas compartidos sin consent explícito** | Media | RLS ya cubre; verificar que `medical_share` token requiere consent |
| **Petify procesa imágenes de hocico (potencialmente identificable de mascota)** | Baja | Consent opt-in ya implementado; subprocesador declarado |
| **Marca "Paw Friend" sin registro INAPI** | Baja-media | Consultar disponibilidad + registrar antes de marketing masivo |

---

## 9. Recomendaciones para abogado externo

Cuando contrates al abogado chileno (budget CLP 500k-1.5M sugerido), pedirle revisar:

1. **T&C** (sección por sección): verificar gaps mencionados arriba + lenguaje legal correcto.
2. **Privacy Policy**: validar Ley 21.719 + Ley 19.628.
3. **DPAs** con subprocesadores (Petify, Supabase, Resend, Sentry, PostHog) — pedir las plantillas que ellos publican y firmar.
4. **Anexo contractual B2B Pro Max** — plantilla para clínicas grandes.
5. **DPA template** para futuros partners pharma/seguros/retail.
6. **Política Uso Aceptable** redacción.
7. **Política de cancelación y reembolso** detallada.
8. **Marca INAPI**: gestión de registro o referirte a gestor especializado.
9. **Tributario**: IVA en SaaS B2C, factura electrónica, donaciones SpA, retenciones a vets prestadores.

---

## 10. Checklist pre-launch (1 junio 2026)

**Bloqueantes legales para soltar al público**:

- [ ] T&C revisados por abogado chileno
- [ ] Privacy revisada por abogado chileno
- [ ] Cuenta Flow.cl migrada a SpA SUSAETA GARNHAM SOFTWARE ENGINEERING
- [ ] Cuenta bancaria SpA operativa
- [ ] Sistema de facturación electrónica configurado
- [ ] Política IVA decidida (incluido vs no incluido en precio mostrado) y documentada
- [ ] DPAs firmados con Petify, Supabase, Resend (al menos)
- [ ] 2FA activado en cuenta admin
- [ ] Plan respuesta incidentes (notificación 72h CERT) definido
- [ ] Marca INAPI: al menos consulta inicial sobre disponibilidad

**No bloqueantes pero recomendados**:

- [ ] Política Uso Aceptable redactada
- [ ] Plantilla contrato B2B Pro Max
- [ ] DPA template B2B partners
- [ ] Test de restore de backup

---

## 11. Próximos pasos para Pedro

1. **Esta semana** (29 abril - 5 mayo): contratar abogado chileno para revisión T&C + Privacy.
2. **Semana 2** (6-12 mayo): completar migración Flow.cl a SpA + cuenta bancaria.
3. **Semana 3** (13-19 mayo): integrar facturación electrónica.
4. **Semana 4** (20-26 mayo): firmar DPAs con subprocesadores principales.
5. **Pre-launch** (27-31 mayo): completar checklist sección 10.

---

**Conclusión**: el estado legal actual está **bien encaminado** comparado con startups en etapa similar. Los gaps son menores y específicos. La mayor urgencia es completar migración Flow → SpA (riesgo fiscal real).

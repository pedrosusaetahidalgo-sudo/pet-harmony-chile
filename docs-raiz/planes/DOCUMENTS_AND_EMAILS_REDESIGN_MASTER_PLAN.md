# Paw Friend — Rediseño de documentos y correos (Master Plan)

> Sistema documental y de emails premium, consistente y mantenible.
> Autor: Claude (bajo dirección de Pedro) · Fecha: **2026-04-21**
> Estado: Fase 1 (fundación + top 5 templates) **ejecutada**. Fases 2-4 pendientes.

## Por qué este plan

Paw Friend envía emails en ~15 flujos distintos (invitaciones, donaciones, outreach, pitch, refugios, reportes) y genera documentos descargables (PDF ficha, ZIP, CSV/XLSX). El estado previo a esta iteración era:

- Cada edge function inventaba sus propios hex, gradientes, header, footer y CTA.
- `send-lead-outreach` tenía **logo URL roto** (`/lovable-uploads/*`, no v2) y paleta **indigo `#4f46e5`** — fuera del brand.
- `send-donation-thanks` usaba background **peach `#fff7ed`** inconsistente con la paleta lavanda.
- `send-shelter-welcome` mezclaba purple → pink gradient (`#7c3aed → #ec4899`) que no existe en los tokens.
- `escapeHtml()` duplicado en 3+ archivos; sin helper centralizado.
- Cero preheaders (el texto invisible que aparece junto al subject en Gmail/Outlook).
- Cero responsive rules consistentes para mobile.

## Qué cambió en esta iteración (Fase 1)

### 1. Fundación — sistema compartido nuevo

Tres archivos nuevos en [`supabase/functions/_shared/`](../../supabase/functions/_shared/):

| Archivo | Propósito |
|---|---|
| [`email-theme.ts`](../../supabase/functions/_shared/email-theme.ts) | Tokens: `BRAND` (50–900), `GOLD`, `NEUTRAL`, `SEMANTIC`, `AUDIENCE` (voice/partner/company/investor), `FONT`, `SIZE`, `SPACE`, `RADIUS`, `SHADOW`, `ASSETS`, `TAGLINE`, `GRADIENT`, `WIDTH`. Espejo de `tailwind.config.ts` y `src/index.css`. |
| [`email-layout.ts`](../../supabase/functions/_shared/email-layout.ts) | `renderEmail()` (shell DOCTYPE + MSO hacks + preheader + media query mobile), `escapeHtml`, `escapeUrl`, `firstName`, **`sendEmail()`** wrapper centralizado sobre Resend con tags opcionales. |
| [`email-blocks.ts`](../../supabase/functions/_shared/email-blocks.ts) | 14 bloques reusables: `emailHeader` (logo/emoji/compact), `emailFooter`, `petBubble`, `callout` (+`calloutRaw`), `bulletList`, `cta`, `metaTable`, `statusBadge`, `statsGrid`, `blockquote`, `divider`, `spacer`, `dataTable`, `heading`, `paragraph`, `section`, `signature`. |

### 2. Top 5 templates refactorizados

| Función | Antes | Después |
|---|---|---|
| [`_shared/invitation-email.ts`](../../supabase/functions/_shared/invitation-email.ts) (vet → owner + co-owner → invitee) | 2 builders × ~170 líneas HTML inline cada uno, logo v2 correcto pero sin preheader | 2 builders × ~60 líneas; reusan `emailHeader`, `petBubble`, `bulletList`, `callout`, `cta`, `emailFooter`; preheader optimizado para bandeja |
| [`send-lead-outreach/index.ts`](../../supabase/functions/send-lead-outreach/index.ts) | Indigo `#4f46e5`, logo URL legacy roto, CTA mezclado con parser fragil de texto plano | Brand purple oficial, logo v2, parser de bloques (`templateToBlocks`) que convierte template texto plano en bullets/headers/párrafos reales |
| [`notify-pitch-application/index.ts`](../../supabase/functions/notify-pitch-application/index.ts) | HTML inline 150 líneas, tabla de payload cruda | Emoji header, contact card, `blockquote` para mensaje, `metaTable` para payload, `cta` al admin; envío via `sendEmail` shared |
| [`send-donation-thanks/index.ts`](../../supabase/functions/send-donation-thanks/index.ts) | Background peach, gradient rose → gold aislado, footer rudimentario | Gradient `warm` oficial, `blockquote` para mensaje del donante, `signature` de Pedro, footer con "hecho en Chile" |
| [`send-shelter-welcome/index.ts`](../../supabase/functions/send-shelter-welcome/index.ts) | Gradient purple→pink no tokenizado, checklist en `<ol>` plano | Emoji header, `bulletList` con iconos por paso, `cta` ghost al dashboard |

### 3. Mejoras laterales

- `notify-pitch-application` ahora **reutiliza** `sendEmail()` del layout en vez de su propio `fetch` a Resend → un solo lugar para cambiar headers/reply-to/from.
- Footer unificado: "pawfriend.cl · hecho en Chile por un founder + IA 🐾" — reemplaza 4 variantes distintas.
- Preheader añadido a los 5 templates — mejora *materialmente* el open rate en Gmail/Outlook.
- `color-scheme: light only` + `supported-color-schemes: light only` → Gmail dark mode no invierte colores del brand.

---

## 1. Inventario completo (edge functions + frontend)

### 1.1. Emails automáticos (edge functions)

Del mapeo exhaustivo de [`supabase/functions/`](../../supabase/functions/):

| Función | Trigger | Audiencia | Formato | Prioridad visual | Estado post-fase-1 |
|---|---|---|---|---|---|
| `send-pet-invitation` | Vet crea ficha sin cuenta owner | Owner (pending) | HTML | 🔴 Alto | ✅ Refactor (vía `invitation-email.ts`) |
| `send-pet-invitation` (shelter) | Refugio transfiere mascota | Adoptante | HTML | 🔴 Alto | ✅ Refactor |
| `send-co-owner-invitation` | Owner invita co-owner/familia/cuidador/trainer | Invitee | HTML | 🟠 Medio | ✅ Refactor (vía `invitation-email.ts`) |
| `send-lead-outreach` | Admin hace outreach a leads vets | Vet (lead) | HTML | 🔴 Alto (comercial) | ✅ Refactor |
| `notify-pitch-application` | `/aplicar` form public | Pedro (admin) | HTML | 🟠 Medio (interno) | ✅ Refactor |
| `send-donation-thanks` | Flow webhook marca `paid` | Donante | HTML + text | 🔴 Alto (retención) | ✅ Refactor |
| `send-shelter-welcome` | Trigger SQL AFTER INSERT en `adoption_centers` | Refugio | HTML | 🟠 Medio | ✅ Refactor |
| `send-monthly-vet-stats` | Cron mensual | Vet | HTML | 🟡 Pendiente | ⏳ Fase 2 |
| `send-new-pet-drip` | Drip post-crear mascota (día 1/3/7) | Owner | HTML | 🟡 Pendiente | ⏳ Fase 2 |
| `send-inactive-user-reminder` | 30 días sin actividad | Owner | HTML | 🟡 Pendiente | ⏳ Fase 2 |
| `send-pet-birthday-greeting` | Cumpleaños mascota | Owner | HTML | 🟡 Pendiente | ⏳ Fase 2 |
| `generate-weekly-owner-reports` | Cron semanal | Owner | HTML | 🔴 Alto (engagement) | ⏳ Fase 2 |
| `generate-weekly-vet-reports` | Cron semanal | Vet | HTML | 🔴 Alto (engagement) | ⏳ Fase 2 |
| `reminder-cron` + `send-whatsapp-reminder` | Recordatorios mascotas | Owner | email + WA | 🟠 Medio | ⏳ Fase 3 (WA Meta pendiente) |
| `booking-reminders-cron` | 24h antes de reserva vet | Owner + Vet | email + push | 🟠 Medio | ⏳ Fase 2 |
| `post-adoption-checkin-cron` | 7d post-adopción | Adoptante | HTML | 🟢 Bajo | ⏳ Fase 3 |
| `feedback-admin` | Form feedback usuario | Pedro | texto | 🟢 Bajo | ⏳ Fase 3 (convertir a HTML bonito) |
| `notify-vet-share` | Owner comparte ficha con vet específico | Vet | email + notif | 🟠 Medio | ⏳ Fase 2 |

### 1.2. Documentos descargables

| Pieza | Origen técnico | Audiencia | Formato | Estado |
|---|---|---|---|---|
| **PDF Ficha Clínica** (joya de la corona) | [`generate-medical-summary/index.ts`](../../supabase/functions/generate-medical-summary/index.ts) — usa `pdf-lib` server-side | Owner, Vet (vía share) | PDF | ⭐ Visual premium ya v3. Spec [`CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS.md`](../../docs-specs/CONSOLIDACION_FICHA_PDF_Y_DATOS_UNIFICADOS.md) pendiente Fase 3 del plan de coherencia. |
| **ZIP documentos médicos** | [`generate-medical-zip/index.ts`](../../supabase/functions/generate-medical-zip/index.ts) | Owner + Vet compartido | ZIP | ⚠️ Falta README.md interno estandarizado + ficha auto incluida (ver Fase 3) |
| **Resumen paciente vet (PDF)** | [`generate-vet-patient-summary/index.ts`](../../supabase/functions/generate-vet-patient-summary/index.ts) | Vet | PDF | ⚠️ Beta — validar con Sofia antes de generalizar |
| **Shelter report PDF** | [`generate-shelter-report-pdf/index.ts`](../../supabase/functions/generate-shelter-report-pdf/index.ts) | Shelter | PDF | 🟡 Nuevo — no auditado aún |
| **HTML imprimible ficha legacy** | [`src/pages/PetClinicalRecord/pdf.ts`](../../src/pages/PetClinicalRecord/pdf.ts) | Owner (print-to-PDF mobile) | HTML inline (256 líneas) | 🔴 **Candidato a eliminar** — la edge fn es autoritativa |
| **CSV usuarios/pets/vets/donaciones** | [`AdminDataExport.tsx`](../../src/components/admin/AdminDataExport.tsx) + [`lib/export/csv.ts`](../../src/lib/export/csv.ts) | Admin | CSV | ✅ Funcional |
| **XLSX audit export** | [`lib/auditExport.ts`](../../src/lib/auditExport.ts) (2463 líneas) | Admin | XLSX + JSON | 🟡 Refactor urgente (splitear) |
| **Shelter bulk import template** | [`ShelterBulkImport.tsx:151`](../../src/pages/shelter/ShelterBulkImport.tsx) | Shelter | CSV | ✅ Funcional, mejorable |
| **Calendario ICS** | [`lib/calendar/ics.ts`](../../src/lib/calendar/ics.ts) | Owner | ICS | ✅ RFC 5545 correcto |
| **QR PNG descarga** | [`PetQRDisplay.tsx`](../../src/components/medical/PetQRDisplay.tsx) + `PawCardQR.tsx` | Owner | PNG | ✅ Funcional |

### 1.3. Rutas públicas que renderizan HTML (no-email)

| Ruta | Componente | Audiencia | Token |
|---|---|---|---|
| `/medical-share/:token` | [`src/pages/MedicalShare.tsx`](../../src/pages/MedicalShare.tsx) | Vet/familia sin auth | 30 días, revocable |
| `/qr/:token` | [`src/pages/QRLanding.tsx`](../../src/pages/QRLanding.tsx) | Cualquiera escanea QR | permanente por mascota |
| `/resena/:token` | [`src/pages/DejarResena.tsx`](../../src/pages/DejarResena.tsx) | Owner → deja reseña pública | único por reserva |
| `/paw-card/:pawCardId` | [`src/pages/PawCardLanding.tsx`](../../src/pages/PawCardLanding.tsx) | Coleccionista | `paw_card_id` |

---

## 2. Sistema visual propuesto (y ya implementado)

### 2.1. Paleta unificada (`email-theme.ts`)

```
BRAND  · #faf5ff (50)  → #9333ea (600, primario) → #581c87 (900)
GOLD   · #fffbeb (50)  → #f59e0b (500, premium)  → #78350f (900)
NEUTRAL (fríos morado-tinte) · #f8fafc (50) → #0f172a (900)
SEMANTIC · success #16a34a · warning #d97706 · danger #dc2626 · info #2563eb
```

4 paletas de audiencia espejo de `tailwind.config.ts`:

| Audiencia | From → To | Uso |
|---|---|---|
| `brand` | `#9333ea → #c084fc` | Default owner/vet |
| `voice` | `#be185d → #ec4899` | Paw Voices (creadores) |
| `partner` | `#047857 → #10b981` | Paw Partners (barter) |
| `investor` | `#9333ea → #f59e0b` | Pitches, deck, onepagers |
| `company` | `#581c87 → #c084fc` | Sponsors B2B |

### 2.2. Tipografía

- **Display**: Fredoka (headings, KPIs). Fallback: Plus Jakarta Sans → system-ui.
- **Body**: Plus Jakarta Sans. Fallback: Segoe UI → Roboto → system.
- **Mono**: JetBrains Mono (IDs, códigos).
- Escala en `px` (Outlook no soporta `rem` consistentemente): 11, 12, 14, 15, 17, 18, 20, 22, 26, 30.

### 2.3. Espaciado, radios, sombras

- Spacing: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48` px.
- Radios: `6 / 10 / 14 / 18 / 24` + `999` (pill). Card por defecto 24px, mobile 18px.
- Sombras: tres niveles (`card`, `cta`, `avatar`). Muchos clientes las descartan — son refuerzo, no estructura.

### 2.4. Bloques del mini design system

Cada uno es autocontenido, retorna un `<tr>...</tr>` o fragmento `<td>`, usa solo tokens y escapa inputs.

| Bloque | Signature | Uso |
|---|---|---|
| `emailHeader({ variant, gradient, audience, tagline, emoji, title, eyebrow })` | Header completo | 3 variantes: `logo`, `emoji`, `compact` |
| `emailFooter({ note, secondary, homeMade, hideSiteLink })` | Footer | Consistente en todo el ecosistema |
| `petBubble({ message, petName, avatar })` | Chat bubble de mascota | Onboarding, invitación |
| `callout({ variant, label, body, icon })` | Bloque coloreado con mensaje | 6 variantes semánticas |
| `calloutRaw(...)` | Igual, pero body acepta HTML pre-sanitizado | Para `<strong>` embebido |
| `bulletList({ label, items })` | Lista con icono + texto | Beneficios, checklists |
| `cta({ text, url, variant, hint })` | Botón principal | `brand` / `gold` / `ghost` |
| `metaTable(rows)` | Tabla clave/valor | Pitches, reportes |
| `statusBadge(status, label?)` | Pill de estado | 8 estados semánticos |
| `statsGrid(items)` | Hasta 3 KPIs en fila | Reportes semanales |
| `blockquote(text, author?)` | Cita tipo pull quote | Mensajes de donantes, testimoniales |
| `dataTable({ columns, rows })` | Tabla de datos con zebra | Reportes, resúmenes |
| `signature({ name, role, intro })` | Firma del founder | Emails emocionales (donación) |
| `heading({ text, eyebrow, subtitle })` | H1 con eyebrow | Cuerpo del email |
| `paragraph({ text, align, muted, size })` | Párrafo simple | Default |
| `divider()` | HR consistente | Secciones |
| `spacer(height)` | `<tr>` de altura fija | Ritmo vertical |

### 2.5. Regla de uso

```ts
// ❌ NO hacer esto en una edge fn nueva:
const html = `<!DOCTYPE html><html>...<td style="background:#9333ea">...`;

// ✅ Hacer esto:
import { renderEmail, sendEmail } from '../_shared/email-layout.ts';
import { emailHeader, emailFooter, cta } from '../_shared/email-blocks.ts';

const html = renderEmail({
  title: 'Asunto para <title>',
  preheader: 'Texto que refuerza el subject en bandeja',
  body: [
    emailHeader({ variant: 'logo' }),
    // ...bloques...
    emailFooter(),
  ].join(''),
});

await sendEmail({ to, subject, html });
```

---

## 3. Sistema editorial (copy)

### 3.1. Voz de marca consolidada

- **Español chileno, tuteo**. "Tu mascota", no "vos" ni "su". NO voseo ni vosotros.
- **Cercano pero no infantil**: "Te espero adentro 🥺👉👈" funciona en onboarding owner, pero NO en outreach a vets.
- **Honesto sobre ser indie**: "hecho en Chile por un founder + IA" — usarlo en donaciones, shelter welcome, paw voices. NO en outreach a vets ni en pitch a inversionistas.
- **CTA con acción física concreta**: "🐾 Ver la ficha de Luna", "Ir al panel refugio", "Revisar en Admin". NO "Clic aquí" ni "Acceder".
- **Preheader = segunda mitad del subject**. Ejemplo:
  - Subject: "Luna ya tiene ficha veterinaria en Paw Friend 🐾"
  - Preheader: "Abrila y vas a ver su historial, vacunas y recordatorios. Es gratis."

### 3.2. Subjects + preheaders propuestos

| Pieza | Subject | Preheader |
|---|---|---|
| Invitación vet → owner | `{petName} ya tiene ficha veterinaria en Paw Friend 🐾` | `Abrila y vas a ver historial, vacunas y recordatorios. Es gratis.` |
| Invitación shelter → adoptante | `{petName} llega a tu casa con su ficha medica 🐾` | `Vacunas, peso y notas del refugio, listos en 1 minuto.` |
| Invitación co-owner | `{inviter} te invito a compartir {pet} en Paw Friend ({role})` | `Te agrego como {role}. Entra en 1 click.` |
| Gracias donación | `Gracias por tu aporte a Paw Friend, {name} 💛` | `Tu donacion ya llego. Este correo es un gracias humano, no automatico.` |
| Outreach vet | `Paw Friend — tu perfil veterinario gratis` | `Los dueños de Chile buscan vet todos los dias. Tu ficha digital te posiciona primero.` |
| Bienvenida refugio | `¡Bienvenidos a Paw Friend, {shelter}!` | `Tu refugio ya es parte de la red. Cargá las primeras mascotas en 10 minutos.` |
| Notificación pitch interna | `Nueva postulacion · {kind} · {name}` | `{kind} · {name} ({org}) · {email}` |
| Reporte semanal owner | `Cómo está {pet} esta semana 📋` | `Vacunas al día, próximo control y 2 tareas pendientes.` *(pendiente implementar)* |
| Reporte semanal vet | `Tu semana en Paw Friend · {N} consultas` | `{N} pacientes activos, rating {X}, {Y} reseñas nuevas.` *(pendiente implementar)* |
| Recordatorio cita 24h | `Recordatorio: {pet} tiene control mañana` | `{vet} · {hora} · {clinica}. Confirmá o cambiá en 1 click.` *(pendiente implementar)* |

### 3.3. Footers por contexto

Todos los emails comparten una base: `pawfriend.cl · hecho en Chile por un founder + IA 🐾`. La línea `note` cambia:

- Invitación vet: "{pet} te envió este correo con la ayuda de su vet y de"
- Invitación shelter: "{pet} te envió este correo con la ayuda del refugio y de"
- Donación: "Si no fuiste tu quien hizo esta donacion, respondenos y lo revisamos."
- Outreach: "Recibes este correo porque tu perfil profesional aparece en directorios publicos."
- Pitch interno (admin): "Notificación interna · Paw Friend admin" (+ `homeMade: false`)

---

## 4. Arquitectura técnica propuesta

### 4.1. Jerarquía (propiedad de cambio)

```
supabase/functions/_shared/
  ├── email-theme.ts       ← tokens (único sitio para HEX)
  ├── email-layout.ts      ← shell renderEmail + sendEmail + escapes
  ├── email-blocks.ts      ← bloques visuales
  └── invitation-email.ts  ← template builder específico (usa blocks)

supabase/functions/<fn-name>/index.ts
  └── import bloques → ensambla body → renderEmail → sendEmail
```

Regla: **ningún `<!DOCTYPE html>` dentro de `supabase/functions/*/index.ts`** después de Fase 2. Todos pasan por `renderEmail()`.

### 4.2. Convenciones

- Fetch a Resend va **siempre** por `sendEmail()` del layout. Ninguna función hace fetch directo a `api.resend.com/emails`.
- Colores: **cero HEX hardcoded** fuera de `email-theme.ts`. Si una función necesita un color, se agrega a `SEMANTIC` o `AUDIENCE`.
- Escaping: toda variable dinámica pasa por `escapeHtml()` (para contenido) o `escapeUrl()` (para atributos `href/src`).
- Preheader: requerido para todos los emails transaccionales y marketing. `title:` solo para interno admin.

### 4.3. Archivos huérfanos detectados (candidatos a borrar)

| Archivo | Razón |
|---|---|
| [`src/pages/PetClinicalRecord/pdf.ts`](../../src/pages/PetClinicalRecord/pdf.ts) | 256 líneas HTML inline que parecen no invocarse (la edge fn `generate-medical-summary` es autoritativa). Verificar con `grep` antes de borrar. |
| `public/paw-friend-assets-v2/email/*.html` | 7 templates HTML estáticos — sobreviven como *referencia visual* pero no son consumidos por ningún código. Decidir si mantener como documentación o eliminar. |

---

## 5. Propuesta de estructura ideal por tipo

### 5.1. Invitación (vet/shelter → owner)

```
Header (logo + wordmark + gradient brand + tagline)
Pet Bubble ("Hola {first}! Soy {pet}...")
Callout success (quién entrega: vet o refugio)
Bullet list "Qué vas a encontrar dentro" (6 bullets con emojis)
CTA primario (brand purple)
Pet Bubble cierre ("Te espero adentro!")
Footer (note contextual + home-made)
```

### 5.2. Recordatorio (cita 24h) — **pendiente implementar en Fase 2**

```
Header compact con tagline "Recordatorio"
Heading (Hola {first}, mañana tienes cita con {vet})
Meta table: fecha | hora | profesional | lugar | duración estimada
Callout info "Qué llevar" (bullets)
CTA primario "Ver la cita" + CTA ghost "Cancelar / reagendar"
Footer
```

### 5.3. Resumen clínico owner (weekly) — **pendiente**

```
Header emoji (🐾 + "Tu semana con {pet}")
Stats grid (3 KPIs: peso, próxima vacuna, tareas pendientes)
Callout warning si hay alerta (vacuna vencida, peso subió 10%)
Data table: eventos de la semana
Bullet list "Esta semana" (hitos)
CTA ghost "Ver ficha completa"
Signature opcional (si el reporte es firmado por Pedro ocasionalmente)
Footer
```

### 5.4. Reporte semanal vet — **pendiente**

```
Header compact vet tagline
Heading ("Tu semana en Paw Friend")
Stats grid (consultas / rating / nuevos pacientes)
Data table: top 5 pacientes atendidos
Callout brand "Esto se viene" (próximas citas)
CTA ghost "Ver dashboard"
Footer (sin home-made; es B2B profesional)
```

### 5.5. Documento compartible (PDF ficha) — ya refactorizado v3

Mantener como referencia editorial:
- Portada con foto + nombre + especie + ficha ID
- Timeline cronológica ASC
- Tabla vacunas con lote/serie
- Tabla peso histórico
- Notas vet intercaladas
- Footer con watermark + fecha emisión + QR

---

## 6. Backlog ejecutable (fases)

### Fase 1 — ejecutada 2026-04-21 ✅

- [x] `_shared/email-theme.ts`
- [x] `_shared/email-layout.ts`
- [x] `_shared/email-blocks.ts`
- [x] Refactor `invitation-email.ts` (vet/shelter + co-owner)
- [x] Refactor `send-lead-outreach`
- [x] Refactor `notify-pitch-application`
- [x] Refactor `send-donation-thanks`
- [x] Refactor `send-shelter-welcome`
- [x] Master plan (este documento)

### Fase 2 — siguiente sprint (una sola PR grande o 2-3 chicas)

- [ ] Refactor `send-monthly-vet-stats` (usar `statsGrid` + `dataTable`)
- [ ] Refactor `send-new-pet-drip` (los 3 emails del drip con la misma estructura)
- [ ] Refactor `send-inactive-user-reminder`
- [ ] Refactor `send-pet-birthday-greeting` (gradient `warm`, emoji 🎂)
- [ ] Refactor `generate-weekly-owner-reports` + `-vet-reports` (usar `statsGrid`, `dataTable`, `callout`)
- [ ] Refactor `booking-reminders-cron` emails (recordatorio 24h / 2h)
- [ ] Refactor `notify-vet-share` (cuando owner comparte ficha con vet específico)

### Fase 3 — post-lanzamiento (1-2 meses)

- [ ] Borrar [`src/pages/PetClinicalRecord/pdf.ts`](../../src/pages/PetClinicalRecord/pdf.ts) después de verificar que no se invoca
- [ ] ZIP médico: incluir `README.md` estandarizado + ficha auto-generada dentro del ZIP
- [ ] Splitear [`src/lib/auditExport.ts`](../../src/lib/auditExport.ts) (2463 líneas → 3-4 módulos: `sheets.ts`, `checks.ts`, `generate.ts`)
- [ ] Convertir `feedback-admin` a HTML bonito (hoy solo texto plano)
- [ ] `post-adoption-checkin-cron` redesign con bulletList
- [ ] Plantilla HTML imprimible compartida para `/medical-share/:token` (hoy es SPA; opcional print stylesheet)

### Fase 4 — design system maduro (mediano plazo)

- [ ] Versión "inspeccionable" del sistema — ruta interna `/admin/email-gallery` que renderiza todos los templates con datos mock. Útil para QA visual antes de cada release.
- [ ] Exportar tokens a variables CSS paralelas para el lado cliente (align PDF/HTML/emails con la misma fuente de verdad).
- [ ] Localización i18n (por si Paw Friend se abre a otros países LATAM).

---

## 7. Riesgos y compatibilidad

| Riesgo | Mitigación |
|---|---|
| Edge fns se deployan una a una. Deploy sin redeploy de `_shared/` queda con referencia rota. | `_shared/*.ts` se bundlea con cada edge fn en deploy. Pedro debe redeployar TODAS las fns que toqué en la misma tanda. Script sugerido: `npx supabase functions deploy invitation-email send-pet-invitation send-co-owner-invitation send-lead-outreach notify-pitch-application send-donation-thanks send-shelter-welcome`. |
| Outlook / Gmail mobile renderean diferente | Sistema usa solo `<table>` nested, inline styles, `mso-*` hacks y clases `.pf-*` bajo `@media max-width:480px`. Probado conceptualmente — QA real en [emailonacid](https://www.emailonacid.com/) o [litmus](https://litmus.com/) recomendado antes del lanzamiento 1 junio. |
| Dark mode de Gmail invierte colores | `<meta name="color-scheme" content="light only">` + `supported-color-schemes: light only` — fuerza light. Aún así Gmail iOS ignora a veces; QA pendiente. |
| Templates referenciados por docs externos (marketing, pitch deck) | Ninguna doc pública cita HTML interno de edge fns. Los HTML estáticos en `public/paw-friend-assets-v2/email/` son independientes. |
| Tests existentes pueden romperse | No hay unit tests para los templates edge fn actualmente. El único riesgo real es que el `subject` no cambie — lo mantuve idéntico para no romper analytics que filtran por subject line. |

## 8. QA checklist (antes de cada deploy)

- [ ] Preheader aparece correctamente (no leakeado en cuerpo visible)
- [ ] Desktop Gmail: header gradient, logo, wordmark visibles
- [ ] Gmail mobile (app iOS/Android): card ocupa 100% width, radios 18px, CTA respira
- [ ] Outlook web: tabla no colapsa, botón CTA visible con background
- [ ] Outlook desktop (si hay acceso): MSO conditional + font fallback correcto
- [ ] Apple Mail: gradient correcto (renderiza mejor que Outlook)
- [ ] Proton Mail (privacidad-forward): tracking pixels N/A pero imágenes deben cargar manualmente sin romper layout
- [ ] Dark mode Gmail iOS: colores NO se invierten
- [ ] Text fallback (ver-como-texto) legible y sin `<strong>` crudos
- [ ] Links: todos usan `escapeUrl()` (sin javascript: injection)
- [ ] CTA URL correcto (staging vs prod)
- [ ] Reply-to = `hola@pawfriend.cl`
- [ ] `from` = `Paw Friend <hola@pawfriend.cl>` (dominio verificado en Resend)
- [ ] Copy en español chileno (tuteo, NO voseo)

## 9. Resumen ejecutivo para Pedro

### Lo que tenés hoy

Un **mini design system documental** completo dentro de `supabase/functions/_shared/` — tokens, layout y bloques. Los **5 emails más visibles** del producto ya usan este sistema. Cambiar un color de marca en `email-theme.ts` se propaga automáticamente a todos.

### Lo que cambia para el usuario final

- Los emails de invitación (vet → owner, refugio → adoptante, owner → co-owner) ya tenían buen look — ahora además **aparecen correctamente en bandeja Gmail con preheader** (el texto gris que aparece junto al subject). El open rate debería subir 10-20% solo por esto.
- `send-donation-thanks` ya no parece un template distinto del resto — header warm, blockquote para el mensaje, firma de Pedro.
- `send-lead-outreach` (outreach a vets leads) **tenía el logo roto apuntando a `/lovable-uploads/*`**. Corregido. Paleta indigo → purple oficial.
- `send-shelter-welcome` unificado con el resto del ecosistema (gradient purple, no el rose→purple no-oficial).
- Admin recibe notificaciones de postulaciones con formato premium (metadata en tabla, mensaje en blockquote, CTA al panel).

### Lo que Pedro debe hacer

1. **Redeploy las 5 edge fns tocadas** (una sola tanda):
   ```bash
   npx supabase functions deploy send-pet-invitation send-co-owner-invitation send-lead-outreach notify-pitch-application send-donation-thanks send-shelter-welcome
   ```
   Nota: `invitation-email.ts` va dentro del bundle de `send-pet-invitation` y `send-co-owner-invitation` automáticamente.
2. **QA visual** en una bandeja real (Gmail + Outlook): manda un email de prueba de cada flujo, revisá preheader + mobile.
3. Confirmar que el dominio `pawfriend.cl` sigue verificado en Resend y que `hola@pawfriend.cl` responde (reply_to).
4. Ejecutar **Fase 2** cuando haya bandwidth (los 7 templates restantes).

---

**Siguiente paso sugerido**: Fase 2 — refactor de los 7 templates restantes en 1 PR o 2-3 chicas. Estimado: 3-4 horas de trabajo real.

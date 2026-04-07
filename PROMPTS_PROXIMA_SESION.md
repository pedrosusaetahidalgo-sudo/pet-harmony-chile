# Prompts listos para próxima(s) sesión(es)

> Generado al cierre de la sesión 2026-04-07. Cada prompt es self-contained: copiá-pegá uno en una conversación nueva con Claude Code y arranca con todo el contexto necesario.
>
> **Antes de empezar cualquier prompt**, verificá que las acciones manuales pendientes del `AUDIT_REPORT_2026_04_07.md` estén aplicadas (especialmente la migración `20260412000000` y los redeploys de las edge functions con ownership fix).

---

## Prompt 1 — Bugs pendientes en `generate-medical-summary`

```
Lee AUDIT_REPORT_2026_04_07.md sección "Bugs documentados pero NO fixeados".

En `supabase/functions/generate-medical-summary/index.ts`:

1. Traducir TODOS los literales del PDF al español (es producto chileno, joya de la corona):
   - "Pet Medical Summary" → "Resumen médico de la mascota"
   - "Pet Information" → "Información de la mascota"
   - Name/Species/Breed/Gender/Birth Date/Weight/Microchip/Neutered → Nombre/Especie/Raza/Sexo/Fecha de nacimiento/Peso/Microchip/Esterilizado
   - "Allergies" → "Alergias"
   - "Chronic Conditions" → "Condiciones crónicas"
   - "Owner Information" → "Información del dueño"
   - "Vaccination Overview" → "Vacunas"
   - "Recent Visits" → "Visitas recientes"
   - "Generated on" → "Generado el"

2. Bug overflow: cuando `yPosition < 50` se crea `newPage` pero el código sigue dibujando en la variable `page` original. Refactor: convertir `page` a `let`, reasignar `page = newPage`, resetear `yPosition`.

Después: redeploy y testear con un pet_id real desde la app.
`npx supabase functions deploy generate-medical-summary --project-ref gwailbjlvevkhwcrovfd`
```

---

## Prompt 2 — ZIP real para descargas médicas

```
Lee AUDIT_REPORT_2026_04_07.md sección "generate-medical-zip".

`supabase/functions/generate-medical-zip/index.ts` hoy devuelve URLs sueltas con un mensaje "ZIP generation not yet implemented". Implementar el ZIP real:

1. `import JSZip from "https://esm.sh/jszip@3.10.1"`
2. Por cada doc en `medical_documents`: download desde Storage, agregar al ZIP con nombre legible `${doc.title}.${ext}` (ext del mime_type)
3. Generar blob, subir a `medical-documents/zips/${pet_id}-${Date.now()}.zip`
4. Devolver signed URL del ZIP (1h)
5. Si hay >20 docs, chunks de 5 para no agotar memoria

Verificar que el ownership check (ya aplicado) sigue intacto. Redeploy y test con pet con 3+ docs.
```

---

## Prompt 3 — Premium B2C con Flow (sección 7.1)

```
Lee CONTEXTO_2026_04_07.md sección 7.1 + AUDIT_REPORT_2026_04_07.md sección "webpay-confirm".

Decisiones tomadas en sesión 2026-04-07:
- Pasarela: Flow (flow.cl), no Webpay. Razones: subscriptions recurrentes nativas, API REST moderna, soporta múltiples medios de pago.
- Credenciales Flow ya rotadas y cargadas como secrets de Supabase: `FLOW_API_KEY` y `FLOW_SECRET_KEY`.

Decisiones que TODAVÍA hay que tomar antes de codear (PEDIME estas 4):
1. Precio: ¿$2.990 mensual / $24.990 anual? ¿Otro?
2. Modelo: 1 plan multi-mascota o pago por mascota adicional?
3. Grandfathering: users que YA tienen 2+ mascotas → ¿se respeta gratis o forzar upgrade con período de gracia?
4. Trial: ¿7 días gratis para 2da mascota? ¿14? ¿Sin trial?

Cuando tenga las respuestas, plan:

A) Backend
   - Edge function `flow-create-subscription` → llama Flow API, devuelve URL de pago
   - Edge function `flow-webhook` → recibe callback, actualiza `subscriptions` + `profiles.premium_plan`
   - Verificar firma HMAC del webhook con FLOW_SECRET_KEY (NO confiar en payload sin verificar)
   - Migración para extender `subscriptions` con `flow_subscription_id`, `flow_customer_id`

B) Frontend
   - Hook `useCanAddPet()` → `{ can, reason? }`
   - Bloqueo en `AddPet.tsx` con toast + CTA "Suscribite"
   - Rutas `/upgrade`, `/upgrade/success`, `/upgrade/cancel`
   - Indicador "Premium" en perfil

C) UX delicada
   - NO comunicar como "se vendió a B2C". El pitch B2B con vets sigue siendo el centro. Premium B2C es complementario.

Gates: `npx tsc -b` + `npm run build` al final.
```

---

## Prompt 4 — Rediseño landing `Index.tsx` (sección 7.2)

```
Lee CONTEXTO_2026_04_07.md sección 7.2.

Objetivo: bajar `src/pages/Index.tsx` de ~700 a ~250 líneas. Estilo Linear/Strava/Cal.com: whitespace, copy directo, máximo 4 secciones above-the-fold + 2 below.

Estructura propuesta:
1. Hero — H1 corto + subtítulo 1 línea + CTA "Crear cuenta" + CTA "Ver vets cerca". Sin demo cards.
2. Prueba social — 1 línea con números (mascotas, vets) reales de Supabase si los hay.
3. 3 beneficios — ficha médica descargable, directorio público de vets, recordatorios. Iconos de @/lib/icons.
4. CTA final — banner único "Empezá gratis".

Below the fold:
5. Para vets — bloque corto con link a `/para-veterinarios` (NO duplicar contenido)
6. Footer existente

NO TOCAR `/para-veterinarios`.

Antes de borrar contenido viejo, listame las secciones actuales y cuáles vamos a eliminar. Decidí vos los detalles, no preguntes 50 cosas.

Gates: `npx tsc -b`, `npm run build`, comparar bundle antes/después.
```

---

## Prompt 5 — Pendientes legacy baratos (subset 7.6)

```
Lee CONTEXTO_2026_04_07.md sección 7.6.

SOLO los items mecánicos baratos:

#7 Migrar imports legacy
   - `from "lucide-react"` → `from "@/lib/icons"` SOLO si el icon existe en lib/icons.ts
   - URLs hardcoded ("/medical-records", "/profile", etc.) → helpers de lib/links.ts
   - Mantener cambios atómicos: 1 commit por dominio

#3 Eliminar edge function `get-google-maps-key` del Supabase Dashboard
   - Manual desde Dashboard. Solo dame instrucciones.

#4 Eliminar `VITE_GOOGLE_MAPS_API_KEY` del .env y deploy
   - Buscar referencias primero. Si hay alguna, NO borrar y reportar.

#13 Deploy `generate-sitemap` (ya auditada y funciona)
   - `npx supabase functions deploy generate-sitemap --project-ref gwailbjlvevkhwcrovfd`

NO toques en este turno: #6 god component, #8 paleta verde, #10 Google Calendar OAuth, #11 splash, #12 push.

Gates: `npx tsc -b`, `npm run build`.
```

---

## Prompt 6 — Material para reuniones con vets (sección 7.4)

```
Lee CONTEXTO_2026_04_07.md sección 7.4 + DEMO_GUIDE.md (si existe).

Pedro tiene reuniones con (a) una vet establecida y (b) recién egresados. Generar (todo en markdown, no código):

1. DEMO_GUIDE.md actualizado — reflejar el rediseño Joao (Home con status cards, social feed, /actividad, /upgrade si está). Demo de 5 min, paso a paso, qué cuenta de prueba usar.

2. PITCH_VETS.md nuevo — pitch B2B (NO B2C). 1 problema concreto + 1 solución + pricing claro:
   - Individual $9.900/mes
   - Clínica $29.900/mes
   - Pro $59.900/mes
   - 3 features killer por plan
   - Diferencial vs alternativas (Excel, papel, sistemas caros)

3. PDF_RESUMEN_VETS.md — material para dejar después de la reunión. 1 página máximo. Logo + tagline + 3 beneficios + pricing + QR a `/registro-veterinario`.

4. ESTRATEGIA_REUNIONES.md — orden recomendado (recién egresados primero, vet establecida después con lo aprendido). Preguntas para descubrir pain points reales.

Si necesitás verificar features actuales del producto, leelas del codebase.
```

---

## Notas operativas

- **Memoria persistente** en `~/.claude/projects/.../memory/`. Decisiones clave persisten entre sesiones.
- **Worktree del rediseño**: borrar `.claude/worktrees/agent-a4600853` cuando ya no haga falta.
- **Migration tracker**: aplicar SQL vía Dashboard SQL Editor (push automático falla en este proyecto), después marcar en `supabase_migrations.schema_migrations`.
- **Flow keys**: rotadas en sesión 2026-04-07 después de un escape al chat. Las nuevas DEBEN ir como secrets de Supabase, NUNCA en repo.

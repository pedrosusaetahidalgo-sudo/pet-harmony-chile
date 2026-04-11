# 02 — Gaps y riesgos

> Generado: 2026-04-10 | Versión: 1.0
> Cada gap corresponde a una dimensión marcada 🟡 o ❌ en `01_INVENTARIO_ACTUAL.md`.
> Severidad: 🔴 crítico / 🟠 alto / 🟡 medio / 🟢 bajo

---

## A. Observabilidad

### A1. Observabilidad de errores backend (edge functions) — 🟡→🔴

**Qué falta**: Las 21 edge functions logean a stdout pero no tienen Sentry, alertas, ni structured logging. Si `flow-webhook` falla procesando un pago, nadie se entera hasta que un usuario se queja.

**Riesgo para Paw Friend**: Un webhook de Flow.cl que falla silenciosamente significa que un usuario pagó Premium pero nunca se activó. En Chile, eso destruye confianza instantáneamente — el usuario va a dejar una reseña negativa en Google y no vuelve.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Pérdida de ingresos + reputación. Un solo pago perdido puede costar 10 usuarios por boca a boca negativo.

---

### A2. Logs estructurados — 🟡→🟠

**Qué falta**: `logger.ts` es un wrapper de `console.*` que solo logea en dev. En producción, los errores van a `console.error` sin contexto (userId, petId, ruta, stack trace estructurado). No hay servicio de logs centralizado.

**Riesgo para Paw Friend**: Cuando un usuario reporta "no me deja descargar el PDF", no hay forma de correlacionar con un error específico en los logs. El debugging es a ciegas.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Horas de debugging por cada bug reportado por WhatsApp. Ya pasó con el bug del form de mascota que se descubrió por una foto.

---

### A3. Analytics de producto sin provider — 🟡→🔴

**Qué falta**: 40+ eventos definidos en `analytics.ts` con `track()` y `identify()`, pero en producción no se envían a ningún lado. Solo logean en dev. No se sabe cuántos usuarios usan la ficha clínica, cuántos descargan PDF, ni cuántos abandonan el onboarding.

**Riesgo para Paw Friend**: Sin métricas de uso, no se puede priorizar features ni demostrar tracción a inversores. La estrategia de producto es a ciegas. El documento `ESTRATEGIA_MVP_2026.md` define métricas de validación pero no hay forma de medirlas.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Decisiones de producto basadas en intuición. Inversores preguntan "¿cuántos MAU tienen?" y la respuesta es "no sé".

---

### A4. Session replay limitada — 🟡→🟡

**Qué falta**: Sentry graba replays solo en errores (`replaysOnErrorSampleRate: 0.5`). No hay session replay proactiva para entender cómo navegan los usuarios.

**Riesgo para Paw Friend**: El QA video de 2026-04-11 encontró 81 issues. Un replay proactivo habría detectado muchos antes.

**Severidad**: 🟡 Medio

**Costo de no actuar**: Issues UX que solo se descubren cuando alguien graba un video manual.

---

### A5. AI ops — costos y calidad de LLM — ❌→🟠

**Qué falta**: 5+ edge functions llaman APIs de Anthropic/Gemini sin tracking de tokens, costo por request, latencia de respuesta, ni calidad de output. Rate limits hardcoded.

**Riesgo para Paw Friend**: El spend cap de Anthropic es "USD 10/mes — pendiente confirmar". Sin monitoring, un loop o abuso puede quemar el budget en horas. Además, la IA a veces devuelve JSON raw (P0 ya cerrado) — sin tracking de calidad, estos problemas se descubren por usuarios.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Factura sorpresa de API o degradación silenciosa de calidad de respuestas IA.

---

### A6. Monitoring de pagos (Flow webhooks) — 🟡→🔴

**Qué falta**: `flow-webhook` tiene idempotencia pero no hay alertas si falla, ni dashboard de transacciones, ni reconciliación automática Flow ↔ Supabase.

**Riesgo para Paw Friend**: Un pago exitoso en Flow que no se refleja en Paw Friend es el peor bug posible. El usuario pagó, no tiene Premium, y no hay alerta.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Pérdida directa de revenue y confianza. Imposible detectar sin que el usuario se queje.

---

### A7. Uptime monitoring — ❌→🟠

**Qué falta**: No hay pings, healthchecks, ni alertas si pawfriend.cl o las edge functions se caen.

**Riesgo para Paw Friend**: Si GitHub Pages tiene un outage o el DNS falla, Pedro se entera cuando un usuario le escribe por WhatsApp.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Downtime invisible. Para un producto que maneja salud de mascotas y pagos, esto es inaceptable.

---

## B. Testing

### B1. Cero tests de cualquier tipo — ❌→🔴

**Qué falta**: No existe un solo test en el repositorio. No hay framework de testing (Vitest, Jest, Playwright). No hay `npm run test`. Cero archivos `*.test.*` o `*.spec.*`.

**Riesgo para Paw Friend**: Cada cambio de código es una ruleta rusa. El QA video de 04-11 encontró 81 issues — muchos habrían sido detectados por tests unitarios (ej: "1 días" en vez de "1 día", NaN% en logros, edad "30 años" para perro). La ficha médica PDF (joya de la corona) puede romperse en cualquier push sin que nadie lo sepa.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Cada deploy es un acto de fe. Regresiones constantes. Tiempo de QA manual multiplicado. Imposible hacer refactors seguros.

---

### B2. Tests de accesibilidad — ❌→🟡

**Qué falta**: No hay `eslint-plugin-jsx-a11y`, ni auditorías de accesibilidad. No se sabe si los formularios tienen labels, si los botones tienen aria-labels, ni si hay contraste suficiente.

**Riesgo para Paw Friend**: En Chile, la Ley 20.422 establece igualdad de oportunidades para personas con discapacidad. No es enforcement activo para apps privadas todavía, pero una demanda de accesibilidad es posible. Más pragmáticamente: usuarios con baja visión no pueden usar la app.

**Severidad**: 🟡 Medio

**Costo de no actuar**: Exclusión de usuarios. Riesgo legal menor pero creciente.

---

### B3. RLS testing automatizado — ❌→🔴

**Qué falta**: ~80 tablas con políticas RLS que nunca se testean. El contexto menciona audit pendiente de RLS como Iniciativa A.

**Riesgo para Paw Friend**: Una política RLS mal configurada expone datos médicos de mascotas de un usuario a otro usuario. En un producto de salud, esto es un data breach. Tablas críticas: `medical_records`, `medical_documents`, `pets`, `profiles`, `vet_bookings`.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Data breach. En Chile, la nueva ley de protección de datos personales (en tramitación) puede imponer multas. Más inmediatamente: pérdida total de confianza si un usuario ve datos médicos de otro.

---

### B4. Schema diff / migration testing — ❌→🟠

**Qué falta**: 85 migraciones aplicadas manualmente vía SQL Editor. No hay validación pre-apply, no hay `supabase db reset` en CI, no hay forma de saber si una migración nueva rompe algo.

**Riesgo para Paw Friend**: Una migración con error de sintaxis o FK rota puede romper la app en producción. Ya hubo un commit específico de fix: `bffc96f fix: corregir migración seed demo — 15+ fixes de schema`.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Migraciones rotas en producción. Rollback manual doloroso.

---

## C. Seguridad

### C1. Edge functions sin JWT verification — 🟡→🔴

**Qué falta**: **TODAS** las 21 edge functions tienen `verify_jwt = false` en `supabase/config.toml`. La nota dice "manejan auth manualmente", pero esto significa que si alguna no valida correctamente, cualquiera puede llamarla.

**Riesgo para Paw Friend**: Un atacante puede llamar `generate-medical-summary` con un `pet_id` ajeno si la función no valida ownership correctamente. O llamar `flow-create-subscription` para generar suscripciones falsas.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Exfiltración de datos médicos. Manipulación de pagos. Abuso de APIs de IA (costo).

---

### C2. SAST y vulnerability scanning — ❌→🟠

**Qué falta**: No hay CodeQL, Semgrep, Snyk, ni `npm audit` automatizado. No hay forma de saber si las 97 dependencias tienen vulnerabilidades conocidas.

**Riesgo para Paw Friend**: Una CVE en `@supabase/supabase-js` o `react-router-dom` podría permitir XSS o token theft. Sin scanning, no se detecta.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Vulnerabilidades silenciosas en dependencias.

---

### C3. Secret scanning — ❌→🟠

**Qué falta**: GitHub Push Protection ya bloqueó una key una vez. Pero no hay scanning proactivo en CI (solo reactivo de GitHub).

**Riesgo para Paw Friend**: Ya pasó: una API key se filtró y tuvo que ser rotada. `.gitignore` excluye `.env*` pero hay un `MIS_API_KEYS.md` mencionado en gitignore, lo que sugiere que existió.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Leak de Supabase service_role key = acceso total a la base de datos.

---

### C4. Headers de seguridad (CSP, X-Frame-Options) — 🟡→🟡

**Qué falta**: GitHub Pages no permite headers custom. No hay CSP (Content Security Policy), X-Content-Type-Options, ni Permissions-Policy.

**Riesgo para Paw Friend**: Sin CSP, un XSS puede ejecutar scripts arbitrarios y robar tokens de Supabase de localStorage.

**Severidad**: 🟡 Medio (limitado por GitHub Pages — migración a Cloudflare Pages o Vercel lo resolvería)

**Costo de no actuar**: Surface de ataque XSS más amplio.

---

### C5. Cookie consent / Ley 19.628 — ❌→🟡

**Qué falta**: No hay banner de cookies ni gestión de consentimiento. La app usa `localStorage` para Supabase auth. Páginas `/terms` y `/privacy` existen pero no hay enforcement técnico.

**Riesgo para Paw Friend**: La nueva Ley de Datos Personales chilena (en tramitación, basada en GDPR) va a requerir consentimiento explícito. Si se aprueba antes de que Paw Friend lo implemente, hay riesgo regulatorio.

**Severidad**: 🟡 Medio (ley aún en tramitación)

**Costo de no actuar**: Riesgo regulatorio futuro. Mala óptica si un usuario pregunta por privacidad.

---

## D. Performance

### D1. Performance budget sin enforcement — ❌→🟡

**Qué falta**: Bundle de 288 kB gzip es bueno, pero no hay Lighthouse CI que lo proteja. Un import mal hecho puede inflar el bundle sin que nadie lo detecte.

**Severidad**: 🟡 Medio

---

### D2. Bundle analysis — ❌→🟢

**Qué falta**: No hay visualizador de bundle. Los chunks manuales están bien configurados pero no hay forma de ver qué crece.

**Severidad**: 🟢 Bajo (chunks ya optimizados)

---

### D3. Image optimization — ❌→🟠

**Qué falta**: Imágenes de Supabase Storage se sirven sin resize, sin WebP/AVIF conversion, sin lazy loading nativo (más allá del `loading="lazy"` de `<img>`). Hero video es 4.4 MB sin comprimir.

**Riesgo para Paw Friend**: En Chile, muchos usuarios tienen conexiones 4G lentas, especialmente fuera de Santiago. Cargar una foto de mascota de 3 MB en un feed con 10 posts = 30 MB. Eso mata la experiencia.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Abandono en conexiones lentas. Core Web Vitals malos → peor SEO.

---

## E. Dev Tooling

### E1. CI/CD — ❌→🔴

**Qué falta**: Cero automation. No hay `.github/workflows/`. Deploy es manual: `npm run build && git add docs/ && git push`. Ya hubo un incidente donde chunks nuevos no se commitearon (commit `1c69396`).

**Riesgo para Paw Friend**: Deploy manual significa errores humanos. El incidente de chunks faltantes dejó la app con 404 en producción hasta que se detectó manualmente.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Deploys rotos. Tiempo perdido. La app en pawfriend.cl puede estar rota por horas sin que nadie lo sepa.

---

### E2. Pre-commit hooks — ❌→🟠

**Qué falta**: No hay Husky ni lint-staged. Se puede commitear código con errores de lint, tipos rotos, o secrets accidentales.

**Severidad**: 🟠 Alto

---

### E3. Formatting (Prettier) — ❌→🟡

**Qué falta**: Sin Prettier, el formato del código depende de la configuración del editor de cada persona. Con un solo dev (Pedro + IA), no es crítico ahora, pero lo será al agregar contribuyentes.

**Severidad**: 🟡 Medio

---

### E4. Dependabot / Renovate — ❌→🟡

**Qué falta**: 97 dependencias sin actualización automatizada. No hay PRs automáticos para security patches.

**Severidad**: 🟡 Medio

---

## F. Comunicaciones

### F1. Email transaccional — ❌→🟠

**Qué falta**: No hay servicio de email. Supabase Auth usa emails genéricos. No hay confirmación de pago por email, ni resúmenes semanales, ni marketing automation.

**Riesgo para Paw Friend**: Un usuario paga Premium y solo recibe un toast en la app. Si cierra la ventana, no tiene confirmación. En Chile, la boleta/factura electrónica requiere envío al correo.

**Severidad**: 🟠 Alto

**Costo de no actuar**: Falta de comunicación post-pago. Riesgo de incumplimiento tributario con boletas.

---

### F2. Push notifications sin backend — 🟡→🟠

**Qué falta**: Plugin de Capacitor instalado y configurado. Pero no hay FCM project, no hay service worker, no hay backend que envíe notificaciones. Los recordatorios son solo in-app.

**Riesgo para Paw Friend**: El 80% de usuarios chilenos no tiene salud de mascota al día. Los recordatorios in-app son invisibles si el usuario no abre la app. Push notifications son el canal que cierra esa brecha.

**Severidad**: 🟠 Alto

---

### F3. Status page — ❌→🟡

**Qué falta**: No hay forma pública de comunicar downtime.

**Severidad**: 🟡 Medio

---

## G. Compliance

### G1. Database backups — ❌→🔴

**Qué falta**: Supabase free tier no incluye backups automáticos. ~80 tablas con datos de usuarios, mascotas, fichas médicas, pagos — todo sin respaldo.

**Riesgo para Paw Friend**: Si Supabase tiene un incident o alguien ejecuta un `DELETE` sin WHERE, se pierden TODOS los datos. Fichas médicas, historiales, pagos, perfiles. Todo.

**Severidad**: 🔴 Crítico

**Costo de no actuar**: Pérdida total de datos. Fin del producto.

---

### G2. Disaster recovery — ❌→🔴

**Qué falta**: No hay runbook de incidentes, no hay plan de DR, no hay replica de la DB, no hay backup de Storage (fotos de mascotas, documentos médicos).

**Severidad**: 🔴 Crítico

---

## H. Mobile

### H1. Config de producción inconsistente — 🟡→🟡

**Qué falta**: `capacitor.config.production.ts` usa `webDir: 'dist'` pero el build real va a `docs/`. Si alguien sigue las instrucciones del archivo, el build mobile no encuentra los archivos.

**Severidad**: 🟡 Medio

---

## Resumen de severidades

| Severidad | Cantidad | Gaps |
|---|---|---|
| 🔴 Crítico | 9 | Analytics sin provider, cero tests, RLS sin tests, CI/CD inexistente, backups inexistentes, disaster recovery, edge functions sin JWT, monitoring pagos, observabilidad backend |
| 🟠 Alto | 10 | Logs estructurados, AI ops, uptime, SAST, secrets, pre-commit, email, push notifications, image optimization, schema testing |
| 🟡 Medio | 8 | Session replay, accesibilidad, headers seguridad, cookie consent, performance budget, formatting, dependabot, status page, config mobile |
| 🟢 Bajo | 1 | Bundle analysis |

**Total de gaps**: 28 (de 50 dimensiones evaluadas)

---

*Ver `03_RECOMENDACIONES.md` para las herramientas que resuelven cada gap.*

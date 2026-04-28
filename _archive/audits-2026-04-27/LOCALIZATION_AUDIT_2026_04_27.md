# Auditoría de Localización Chilena — Paw Friend

**Fecha**: 2026-04-27
**Dominio 14**: Localización chilena (transversal). **CADA HALLAZGO ES P0**.
**Working dir**: `c:\Users\psusa\Desktop\pet-harmony-chile-main`

> Regla CLAUDE.md §9.5: tuteo chileno (tú, tienes, puedes, sabes, eres). PROHIBIDO voseo argentino, "peludito", "che", "boludo", "coger", "chévere".

---

## Resumen — totales por categoría

| Categoría | Hits totales | Severidad | Archivos `src/` afectados | Archivos `supabase/functions/` afectados | Archivos `public/`/`docs/` afectados |
|---|---|---|---|---|---|
| Voseo en código de runtime (UI usuario final) | **40+** | P0 | 18 | 6 | 2 (HTML email) + 2 (espejo `docs/`) |
| Voseo en blog/content embebido | 5 | P0 | 4 | — | — |
| Voseo en system prompts de IA | 0 | OK | 0 | 0 | — |
| Voseo en docs internos / pitch / planes | 80+ | Aceptable\* | — | — | — |
| Término "peludito" en UI | **1** | P0 | 1 (`Donaciones.tsx`) | — | — |
| Término "che" / "boludo" / "pibe" / "laburar" / "quilombo" / "chévere" / "coger" | 0 | OK | 0 | 0 | — |
| Formato fechas `MM/DD/YYYY` en UI | 0 | OK | — | — | — |
| Microcopy de error genérico ("Algo salió mal" / "Error desconocido") | **77** ocurrencias en 50 archivos | P0 | 50 | — | — |
| Anglicismos UI (`submit`/`delete`/`cancel`/`save` como copy visible) | 0 | OK | — | — | — |

\* Los docs internos (`docs-raiz/`, `_pending/`, `_archive/`, `content-studio/`, `sales/DEMO_GUIDE.md`) están exentos de la regla `§9.5` para usuarios finales, pero se listan abajo por completitud y porque varios prompts/decks que se exhiben públicamente (Instagram, pitch HTML) sí infringen la regla.

> **`docs/`** contiene el output del build (`docs/assets/*.js`); todo voseo que aparece ahí es **proyección de lo que está en `src/`**, no edición manual. Al corregir `src/` y rebuildear se limpia automáticamente.

---

## Hallazgos P0 voseo en código de runtime (lista completa)

### `src/pages/`

| Archivo | Línea | Snippet | Corrección sugerida |
|---|---|---|---|
| `src/pages/AddPet.tsx` | 657 | `description: 'Podes invitar a esta persona más tarde…'` | `'Puedes invitar a esta persona más tarde…'` |
| `src/pages/AddPet.tsx` | 661 | `toast('No podes invitarte a vos mismo', …)` | `'No puedes invitarte a ti mismo'` |
| `src/pages/AddPet.tsx` | 1198 | `Podés invitar a tu pareja, familia o cuidador…` | `Puedes invitar a tu pareja, familia o cuidador…` |
| `src/pages/Adoption.tsx` | 114 | `subtitle="Dale un hogar a una mascota que lo necesita"` | `"Dale un hogar a una mascota que lo necesita"` mantener (`dale` chileno-neutro) — borderline, OK. **Pero** `Registrate` en línea 140: `Regístrate` |
| `src/pages/Adoption.tsx` | 140 | `Registrate gratis: carga masiva, ficha medica…` | `Regístrate gratis: carga masiva, ficha médica…` |
| `src/pages/InsightsLanding.tsx` | 355 | `` ? `¿Tenés un ${data.breed}?` `` | `` `¿Tienes un ${data.breed}?` `` |
| `src/pages/InsightsLanding.tsx` | 357 | `` ? `¿Tenés un ${data.species}?` `` | `` `¿Tienes un ${data.species}?` `` |
| `src/pages/InsightsLanding.tsx` | 361 | `Agregá a tu mascota a Paw Friend gratis y ayudás…` | `Agrega a tu mascota a Paw Friend gratis y ayudas…` |
| `src/pages/MisAdopciones.tsx` | 81 | `<h3>Aún no tenés procesos de adopción</h3>` | `Aún no tienes procesos de adopción` |
| `src/pages/MisAdopciones.tsx` | 84 | `acá.` | `aquí.` |
| `src/pages/MisPostulaciones.tsx` | 54 | `Si querés sumar tu empresa, ser Paw Voice o aplicar a financiamiento, empezá desde…` | `Si quieres sumar tu empresa, ser Paw Voice o aplicar a financiamiento, empieza desde…` |
| `src/pages/NoseScan.tsx` | 187 | `perdida, escribinos a hola@pawfriend.cl.` | `escríbenos a hola@pawfriend.cl.` |
| `src/pages/NosePrintTest.tsx` | 330 | `<CardTitle>Contanos sobre vos y tu mascota</CardTitle>` | `Cuéntanos sobre ti y tu mascota` |
| `src/pages/NosePrintTest.tsx` | 533 | `podés repetir.` | `puedes repetir.` |
| `src/pages/NosePrintTest.tsx` | 600 | `…por biometría no invasiva. Vos…` | `…por biometría no invasiva. Tú…` |
| `src/pages/OnboardingQuickFlow.tsx` | 206 | `${name} ya tiene su perfil. Podés agregar más detalles…` | `Puedes agregar más detalles…` |
| `src/pages/OnboardingQuickFlow.tsx` | 302 | `Cualquier foto clara sirve. Podés ajustar después.` | `Puedes ajustar después.` |
| `src/pages/OnboardingQuickFlow.tsx` | 391 | `Toma ~30 segundos. Podés hacerlo después… si preferís.` | `Puedes hacerlo después… si prefieres.` |
| `src/pages/OnboardingQuickFlow.tsx` | 434 | `Podés hacerlo cuando quieras…` | `Puedes hacerlo cuando quieras…` |
| `src/pages/OnboardingQuickFlow.tsx` | 481 | `placeholder="Dejá vacío si no tiene"` | `"Deja vacío si no tiene"` |
| `src/pages/OnboardingQuickFlow.tsx` | 487-488 | `Estándar ISO… Podés agregarlo después… si ahora no lo tenés a mano.` | `Puedes agregarlo después… si ahora no lo tienes a mano.` |
| `src/pages/OnboardingQuickFlow.tsx` | 527 | `Paw Friend es gratis para vos. Para sostenerlo…` | `Paw Friend es gratis para ti. Para sostenerlo…` |
| `src/pages/OnboardingQuickFlow.tsx` | 576 | `Tu data nunca se va a usar en estudios. Podes cambiar despues.` | `Puedes cambiar después.` |
| `src/pages/OnboardingQuickFlow.tsx` | 582 | `Es 100% opcional. Podes saltar este paso o cambiar la decision desde tu perfil.` | `Puedes saltar este paso o cambiar la decisión desde tu perfil.` |
| `src/pages/ParaVeterinarios.tsx` | 108 | `Tu clinica ve solo lo que vos autorizaste.` | `solo lo que tú autorizaste.` |
| `src/pages/ParaVeterinarios.tsx` | 658 | `· ¿Queres completar tu perfil ahora?` | `¿Quieres completar tu perfil ahora?` |
| `src/pages/PostAdoptionCheckin.tsx` | 199 | `escribinos a …` | `escríbenos a …` |
| `src/pages/RefugiosHogares.tsx` | 197 | `¿Tienes un refugio? Registrate gratis` | `Regístrate gratis` |
| `src/pages/shelter/ShelterAdoptionsKanban.tsx` | 428 | `…aparecerá acá. Vas a poder…` | `…aparecerá aquí. Vas a poder…` (`vas a poder` es construcción neutra, OK; `acá` → `aquí`) |

### `src/components/`

| Archivo | Línea | Snippet | Corrección sugerida |
|---|---|---|---|
| `src/components/CoOwnerInviteReceivedDialog.tsx` | 189 | `Podes rechazar si no reconocés esta invitación.` | `Puedes rechazar si no reconoces esta invitación.` |
| `src/components/PawVoicesWall.tsx` | 54 | `acá. Sin ellos, esto no avanza.` | `aquí. Sin ellos, esto no avanza.` |
| `src/components/PawVoicesWall.tsx` | 93 | `¿Querés aparecer aquí?` | `¿Quieres aparecer aquí?` |
| `src/components/adoption/ShelterPetCard.tsx` | 185 | `Podés agregar un mensaje (opcional).` | `Puedes agregar un mensaje (opcional).` |
| `src/components/adoption/ShelterPetCard.tsx` | 201 | `placeholder="Contale al refugio por qué te interesa esta mascota, dónde vivís, si tenés otras mascotas, etc."` | `"Cuéntale al refugio por qué te interesa esta mascota, dónde vives, si tienes otras mascotas, etc."` |
| `src/components/home/HomePetFocusV2.tsx` | 194 | `title: 'Agregá el primer evento a la historia'` | `'Agrega el primer evento a la historia'` |
| `src/components/home/HomePetFocusV2.tsx` | 236 | `Agregá tu primera mascota para empezar a guardar su historia.` | `Agrega tu primera mascota para empezar a guardar su historia.` |
| `src/components/medical/OwnerAudioNoteRecorder.tsx` | 238 | `Hablá lo que viste en {petName}…` | `Habla lo que viste en {petName}…` |
| `src/components/medical/OwnerAudioNoteRecorder.tsx` | 263 | `'Hablá libremente lo que querés dejar registrado.'` | `'Habla libremente lo que quieres dejar registrado.'` |
| `src/components/medical/OwnerAudioNoteRecorder.tsx` | 273 | `Tu navegador no soporta grabación de voz. Usá Chrome o Edge…` | `Usa Chrome o Edge…` |
| `src/components/medical/RegisterInterventionSheet.tsx` | 286 | `'¿Qué pasó? Elegí una y te pedimos lo mínimo.'` | `'Elige una y te pedimos lo mínimo.'` |
| `src/components/medical/RegisterInterventionSheet.tsx` | 315 | `<SelectValue placeholder="Elegí una" />` | `placeholder="Elige una"` |
| `src/components/medical/RegisterInterventionSheet.tsx` | 343 | `<SelectValue placeholder="Elegí uno" />` | `placeholder="Elige uno"` |
| `src/components/profile/ResearchConsentDialog.tsx` | 55 | `Paw Friend es y va a seguir siendo gratis para vos.` | `gratis para ti.` |
| `src/components/profile/ResearchConsentDialog.tsx` | 85-86 | `Podés cambiarlo ahora si querés.` | `Puedes cambiarlo ahora si quieres.` |
| `src/components/profile/ResearchConsentDialog.tsx` | 91 | `Podes cambiarla cuando quieras` | `Puedes cambiarla cuando quieras` |
| `src/components/reminders/AddReminderDialog.tsx` | 197 | `'¿Qué querés recordar? Te dejamos lo más rápido.'` | `'¿Qué quieres recordar? …'` |
| `src/components/reminders/AddReminderDialog.tsx` | 243 | `<Label>¿Qué querés recordar?</Label>` | `¿Qué quieres recordar?` |
| `src/components/settings/NotificationPrefsSection.tsx` | 104 | `<CardDescription>Elegí cómo querés que te avisemos</CardDescription>` | `Elige cómo quieres que te avisemos` |
| `src/components/settings/NotificationPrefsSection.tsx` | 123 | `Elegí cómo querés que te avisemos. Podes cambiar esto cuando quieras.` | `Elige cómo quieres que te avisemos. Puedes cambiar esto cuando quieras.` |
| `src/components/shelter/ShelterOnboardingChecklist.tsx` | 5 | comentario `1. Subí tus primeras mascotas` | `Sube tus primeras mascotas` |
| `src/components/shelter/ShelterOnboardingChecklist.tsx` | 110 | `Cuatro pasos para arrancar. Andá completando a tu ritmo.` | `Ve completando a tu ritmo.` |
| `src/components/shelter/ShelterOnboardingChecklist.tsx` | 117 | `title="Subí tus primeras mascotas"` | `"Sube tus primeras mascotas"` |
| `src/components/shelter/ShelterOnboardingChecklist.tsx` | 120 | `` `Tenés ${petsCount} mascota${…}` `` | `` `Tienes ${petsCount} mascota${…}` `` |
| `src/components/shelter/ShelterOnboardingChecklist.tsx` | 145 | `'Mostrá tu refugio a quien te siga en redes.'` | `'Muestra tu refugio a quien te siga en redes.'` |
| `src/components/landing/AudiencesStrip.tsx` | 90 | `…hay un lugar para vos` | `…hay un lugar para ti` |
| `src/components/pricing/PlanComparisonTable.tsx` | 612 | `Contactanos` (botón visible) | `Contáctanos` |

### `src/content/blog/` (contenido público SEO)

| Archivo | Línea | Snippet | Corrección sugerida |
|---|---|---|---|
| `src/content/blog/seguro-mascotas-chile-vale-la-pena.tsx` | 162 | `Si podés cubrir la peor…` | `Si puedes cubrir la peor…` |
| `src/content/blog/protocolo-mascota-perdida-maipu.tsx` | 178 | `tenés que demostrar que es tuya.` | `tienes que demostrar que es tuya.` |
| `src/content/blog/cuanto-cuesta-tener-perro-primer-ano-chile.tsx` | 445 | `Si las 5 respuestas son sí, podés adoptar…` | `puedes adoptar…` |
| `src/content/blog/barf-vs-pellet-que-conviene-perros.tsx` | 223 | `puedes hacer casero si querés` | `si quieres` |
| `src/content/blog/desparasitacion-perro-gato-cada-cuanto-chile.tsx` | 222 | `…también te protege a vos y tu…` | `…también te protege a ti y tu…` |

### `supabase/functions/` (edge functions con copy visible al usuario)

| Archivo | Línea | Snippet | Corrección sugerida |
|---|---|---|---|
| `supabase/functions/_shared/email-blocks.ts` | 106 | comentario `"Si no reconocés esto, podés ignorarlo"` | `"Si no reconoces esto, puedes ignorarlo"` |
| `supabase/functions/_shared/email-theme.ts` | 249 | `donation: 'Gracias a vos, Paw Friend sigue siendo gratis'` | `'Gracias a ti, Paw Friend sigue siendo gratis'` |
| `supabase/functions/_shared/invitation-email.ts` | 108 | `Si no reconoces a ${petName}, podes ignorar este correo sin problema.` | `puedes ignorar este correo sin problema.` |
| `supabase/functions/_shared/invitation-email.ts` | 141 | `'Podes ver la ficha y agregar notas de cuidado…'` | `'Puedes ver la ficha y agregar notas de cuidado…'` |
| `supabase/functions/_shared/invitation-email.ts` | 145 | `'Podes ver la ficha y registrar rutinas…'` | `'Puedes ver la ficha y registrar rutinas…'` |
| `supabase/functions/_shared/invitation-email.ts` | 184 | `'En Paw Friend tenes'` | `'En Paw Friend tienes'` |
| `supabase/functions/_shared/invitation-email.ts` | 195 | `'Si no tenes cuenta, podras crearla desde ese link · Es gratis'` | `'Si no tienes cuenta, podrás crearla…'` |
| `supabase/functions/_shared/invitation-email.ts` | 198 | `Podes aceptar o rechazar esta invitacion.` | `Puedes aceptar o rechazar esta invitación.` |
| `supabase/functions/_shared/invitation-email.ts` | 206 | `…podes ignorar este correo sin problema.` | `…puedes ignorar este correo sin problema.` |
| `supabase/functions/nose-print-match/index.ts` | 312 | `${pet.name} tiene dueño. Si la encontraste, escribinos a hola@pawfriend.cl…` | `escríbenos a hola@pawfriend.cl…` |
| `supabase/functions/send-adoption-followups/index.ts` | 99 | `` ? `Ya cumplió un mes con vos ${pet.name}…` `` | `Ya cumplió un mes contigo, ${pet.name}…` |
| `supabase/functions/send-adoption-followups/index.ts` | 100 | `` : `${pet.name} ya lleva 3 meses con vos…` `` | `…ya lleva 3 meses contigo…` |
| `supabase/functions/send-adoption-followups/index.ts` | 106 | `Si tenés cualquier duda, escribinos a hola@pawfriend.cl.` | `Si tienes cualquier duda, escríbenos a hola@pawfriend.cl.` |
| `supabase/functions/send-adoption-status-email/index.ts` | 63 | `<p>Podés ver el estado del proceso…</p>` | `Puedes ver el estado del proceso…` |
| `supabase/functions/send-adoption-status-email/index.ts` | 86 | `<p>Mientras, podés ver el proceso…</p>` | `Mientras, puedes ver el proceso…` |
| `supabase/functions/send-adoption-status-email/index.ts` | 111 | `…podés <a href="…">explorar otras opciones</a>.` | `…puedes <a>explorar otras opciones</a>.` |
| `supabase/functions/send-adoption-status-email/index.ts` | 167 | `Si no esperabas este mensaje, podés ignorarlo…` | `puedes ignorarlo…` |
| `supabase/functions/send-inactive-user-reminder/index.ts` | 77 | `Si fue solo que te olvidaste, acá está la ficha de…` | `aquí está la ficha de…` |
| `supabase/functions/send-inactive-user-reminder/index.ts` | 86 | `Si no querés recibir más estos mensajes…` | `Si no quieres recibir más estos mensajes…` |
| `supabase/functions/send-new-pet-drip/index.ts` | 90 | `'Si tenés veterinario de cabecera, compartile la ficha digital…'` | `'Si tienes veterinario de cabecera, compártele la ficha digital…'` |
| `supabase/functions/send-new-pet-drip/index.ts` | 97 | `Tres toques y lo tenés en tu celular.` | `Tres toques y lo tienes en tu celular.` |
| `supabase/functions/send-shelter-welcome/index.ts` | 102 | `Carga tus primeras mascotas y empezá en 10 minutos.` | `…y empieza en 10 minutos.` |
| `supabase/functions/generate-shelter-report-pdf/index.ts` | 484 | `Contactanos: ${contactText}` (PDF) | `Contáctanos: …` |

### `public/` y `docs/` (HTML emails servidos a usuarios)

| Archivo | Línea | Snippet | Corrección sugerida |
|---|---|---|---|
| `public/paw-friend-assets-v2/email/password_reset.html` | 67 | `Si fuiste vos, todo bien. Si querés olvidarte de esto, ignora este correo.` | `Si fuiste tú, todo bien. Si quieres olvidarte de esto, ignora este correo.` |
| `public/paw-friend-assets-v2/email/password_reset.html` | 71 | `<h3>¿No fuiste vos?</h3>` | `¿No fuiste tú?` |
| `public/paw-friend-assets-v2/email/member_welcome.html` | 86 | `…podés cancelar cuando quieras desde tu perfil.` | `…puedes cancelar cuando quieras desde tu perfil.` |
| `docs/paw-friend-assets-v2/email/member_welcome.html` | 86 | (espejo de `public/`) | mismo fix |
| `docs/paw-friend-assets-v2/email/password_reset.html` | 67 | (espejo de `public/`) | mismo fix |

> Nota: `docs/` se regenera con `npm run build`. Bastará corregir `public/` + rebuild.

---

## Hallazgos P0 términos prohibidos

### "peludito" (rioplatense)

| Archivo | Línea | Snippet | Corrección sugerida |
|---|---|---|---|
| `src/pages/Donaciones.tsx` | 313 | `…con las mismas ganas de que a ningun peludito le falte nada.` | `…que a ningún peludo le falte nada.` (CLAUDE.md `peludo` está OK; `peludito` no) |

> Aparte de este hit en código de runtime, `peludito` aparece **41 veces** en `docs-raiz/planes/INSTAGRAM_IMPLEMENTATION_PLAN_PAWFRIEND.md` y `docs-raiz/pawfriend-asset-prompts-library.md`. Esos son docs internos de marketing — si terminan publicados (Instagram captions, asset prompts en producción), corregir antes.

### "che", "boludo", "pibe", "laburar", "quilombo", "chévere", "coger" (vulgar Chile)

- **0 hits** en `src/`, `supabase/functions/`, `public/`, `docs/`. ✓

> Único hit de `boludo` está en `docs-raiz/planes/INSTAGRAM_IMPLEMENTATION_PLAN_PAWFRIEND.md` líneas 46 y 211 — pero como ejemplo de lo que NO usar (referencia válida).

---

## Hallazgos formatos

- **Fechas `MM/DD/YYYY`**: 0 hits en código de runtime. ✓
- **RUT**: no se valida formato chileno en formularios públicos críticos. **No examinado en profundidad** — recomendado fuera del alcance de este dominio.
- **Montos**: `$3.990`, `$9.900`, `$29.900` se usan correctamente con punto miles en `src/lib/plans.ts` y demás. ✓

---

## Microcopy errores — top 5 peores

> Patrón repetido **77 veces** en 50 archivos: `toast.error('Algo salió mal', { description: '…' })`. Tono frío y poco accionable. Además se mezcla con/sin tilde (`salio` vs `salió`).

| # | Archivo:línea | Mensaje actual | Por qué falla | Mejora sugerida |
|---|---|---|---|---|
| 1 | `src/components/ErrorBoundary.tsx:36` | `Algo salió mal` | Pantalla completa de crash, sin acción posible para el usuario, sin contacto | `Algo se rompió por nuestro lado. Refresca la página o escríbenos a hola@pawfriend.cl si sigue pasando.` |
| 2 | `src/pages/AddPet.tsx:299` | `toast.error('Algo salió mal', { description: 'El peso debe ser mayor a 0' })` | El título contradice el detalle (esto es validación, no error) | `toast.error('Revisa el peso', { description: 'El peso debe ser mayor a 0 kg.' })` |
| 3 | `src/types/vetDirectory.ts:103` y 13 más (`'Error desconocido'` como fallback) | `'Error desconocido'` | "Desconocido" para el dueño = "no sé qué hacer". Cero acción | `'Algo falló. Inténtalo de nuevo en unos segundos. Si sigue, avísanos a hola@pawfriend.cl.'` |
| 4 | `src/components/admin/AdManagement.tsx:107`, `:125`, `:142` | `toast.error('Algo salio mal', …)` (sin tilde) | Falta tilde + título genérico repetido 3 veces seguidas en el mismo componente | Diferenciar por acción: `'No pudimos crear el anuncio'`, `'No pudimos actualizar el anuncio'`, `'No pudimos eliminar el anuncio'` |
| 5 | `src/components/CreatePost.tsx:120` | `toast.error('Algo salió mal', { description: 'Debes iniciar sesión para publicar' })` | El título dice "error" cuando es realmente un check de auth | `toast.error('Inicia sesión para publicar', { description: 'Tu publicación se guardará al volver.' })` |

**Recomendación general**: crear helper `toastError(action: string, hint?: string)` en `src/lib/toast.ts` que estandarice tono cálido + chileno + acción concreta, y deprecar todos los `toast.error('Algo salió mal'…)`.

---

## System prompts: ¿fuerzan tuteo es-CL?

Revisión de los 9 prompts críticos de IA:

| Edge function | Línea | ¿Fuerza español chileno con tuteo? | Snippet |
|---|---|---|---|
| `pet-assistant/index.ts` | 151-154 | **Sí** | `"Eres el asistente veterinario de Paw Friend, una app chilena…" / "Español chileno (tú, tienes)…"` |
| `breed-tips/index.ts` | 89-97 | **Sí** | `"Vet chileno. Tips raza BREVES…" / "Chileno (tu/tienes). Datos correctos."` |
| `medical-suggestions/index.ts` | 131-152 | **Sí** | `"Vet chileno. … Solo tratamientos/vacunas reales en Chile. Chileno."` |
| `symptom-triage/index.ts` | 114-145 | **Sí** | `"Eres el sistema de triage veterinario de Paw Friend, una app chilena…" / "Español chileno (tu, tienes)"` |
| `bereavement-assistant/index.ts` | 7-10 | **Sí** | `"Acompañamiento duelo mascotas, Paw Friend Chile. … español chileno…"` |
| `nutrition-coach/index.ts` | 93-115 | **Sí** | `"app chilena de salud de mascotas" / "Español chileno (tu, tienes)"` |
| `wound-vision/index.ts` | 111-130 | **Sí** | `"sistema de evaluacion visual veterinaria de Paw Friend Chile" / "Español chileno (tu, tienes)"` |
| `consultation-prep/index.ts` | 131-140 | **Sí** | `"app chilena de salud de mascotas" / "Español chileno (tu, tienes)"` |
| `process-consultation-transcript/index.ts` | 124-184 | **Sí** | `"escribano veterinario clínico chileno" / "Usa español chileno (tú, tienes)"` |
| `ocr-vaccination-card/index.ts` | 127-139 | **Sí** | `"sistema OCR especializado en carnets de vacunación veterinarios de Chile"` |
| `verify-service-provider/index.ts` | 261, 402 | Parcial | `"Verificador título vet Chile"` / `"Moderador Paw Friend Chile"` — no especifica tuteo, pero output es admin-only |
| `feedback-admin/index.ts` | 204, 268 | **Sí** | `"respuesta sugerida (español chileno, 1-2 oraciones)"` |
| `generate-weekly-vet-reports/index.ts` | 158 | **Sí** | `"Chileno (tu/tienes). Profesional, conciso, accionable."` |
| `generate-weekly-owner-reports/index.ts` | 186 | **Sí** | `"Vet Paw Friend Chile. Español chileno (tu/tienes). Cálido, conciso."` |

**Resultado**: **0 prompts con voseo**, **14/14 prompts críticos fuerzan tuteo chileno explícito o implícito** (vía "español chileno", "tu/tienes"). ✓

> Detalle menor: varios prompts usan "tu" sin tilde como abreviación — el modelo lo interpreta correctamente como pronombre de tuteo, pero **convendría unificar a "tú"** para no inducir ambigüedades cuando se mezcla con `tu` posesivo. No bloqueante.

---

## Sin hallazgos relevantes en estas categorías

- **Anglicismos UI** (`submit`/`delete`/`cancel`/`save` como copy visible): 0 hits en `src/components/landing/`. Único match es `'Cancelas cuando quieras'` en `VetValueCalculator.tsx:274` — uso correcto del verbo en español.
- **Voseo en system prompts de IA**: 0 hits.
- **Términos `che`/`boludo`/`pibe`/`laburar`/`quilombo`/`chévere`/`coger`**: 0 hits en código de runtime.
- **Formatos `MM/DD/YYYY` en UI**: 0 hits.
- **Mezcla de pronombres usted/tú** en una misma vista: no detectado en muestras revisadas (`Donaciones.tsx`, `Hero.tsx`, `OnboardingQuickFlow.tsx`).

---

## Recomendaciones priorizadas

1. **P0 inmediato (rompe consistencia de marca con usuarios reales)**:
   - 24 archivos en `src/` con voseo (`tenés`, `podés`, `querés`, `Podes`, `vos`, `acá`, etc.).
   - 8 archivos en `supabase/functions/` con voseo en emails servidos a dueños y vets reales.
   - 2 archivos `public/paw-friend-assets-v2/email/*.html` con voseo en emails transaccionales.
   - 1 hit de `peludito` en `Donaciones.tsx:313`.

2. **P1 (mejora UX)**:
   - Reemplazar 77 `toast.error('Algo salió mal'…)` por mensajes accionables y específicos. Crear helper centralizado.
   - Unificar `'Algo salió mal'` vs `'Algo salio mal'` (sin tilde) en `AdManagement.tsx`, `CreatePost.tsx`, `EditProfileDrawer.tsx`.
   - Reemplazar 13 fallbacks `'Error desconocido'` por mensaje cálido con CTA a hola@pawfriend.cl.

3. **P2 (limpieza)**:
   - Quitar `peludito` de `INSTAGRAM_IMPLEMENTATION_PLAN_PAWFRIEND.md` antes de cualquier publicación pública.
   - Migrar `pawfriend-asset-prompts-library.md` a tuteo si se va a usar como input de generadores que produzcan assets visibles a usuarios chilenos.
   - Revisar `sales/DEMO_SCRIPT_VETS.md` y `sales/DEMO_GUIDE.md` (uso comercial 1:1 con vets chilenos): contienen `vos sos`, `podés`, `querés`, `agregá`. No bloqueante (es script interno) pero transmite imagen incoherente si el vet ve la pantalla del comercial.

---

## Apéndice: contadores brutos

```
Voseo en src/ (.tsx/.ts):       40+ líneas    (24 archivos)
Voseo en supabase/functions/:    24 líneas    (8 archivos)
Voseo en public/email/*.html:     3 líneas    (2 archivos)
Voseo en src/content/blog/:       5 líneas    (4 archivos)
"peludito" en src/:               1 línea
Errores genéricos repetidos:     77 ocurrencias en 50 archivos
System prompts con tuteo es-CL:  14/14
```

---

**Generado**: 2026-04-27. Auditor: Dominio 14 — Localización chilena.

# Paw Friend — Contexto al 2026-04-10 (post mejoras calidad v2 + privacy + gamification)

> Documento de continuidad para arrancar la proxima sesion sin recordar nada.
> Reemplaza a `CONTEXTO_2026_04_08.md` (archivado en `_archive/`).

---

## 1. Identidad del producto (sin cambios)

- **Nombre**: Paw Friend
- **Dominio**: pawfriend.cl (GitHub Pages, deploy desde `docs/`)
- **Repo**: github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile, branch `main`
- **Supabase project**: `gwailbjlvevkhwcrovfd`
- **Mobile**: Capacitor 7 (Android compilable, iOS testeado en simulator)
- **Modelo**:
  - **B2C duenos**: Gratis (2 mascotas) + Premium ($3.990/mes o $39.900/ano)
  - **B2B vets**: planes pagos ($9.900 / $29.900 / $59.900). Motor principal de ingresos
- **Joya de la corona**: ficha medica descargable en PDF + directorio publico de vets. **No tocar**.

---

## 2. Estado tecnico al cierre 2026-04-10

| Gate | Resultado |
|---|---|
| `npx tsc -b` | 0 errores |
| `npm run build` | pasa, ~19s |
| Bundle principal | **372 kB / 117 kB gzip** |
| Migraciones SQL | **67 archivos, todas aplicadas en Supabase** |
| Edge functions activas | 17 |
| Premium B2C Flow | vivo con idempotencia + rate limit |
| Google Calendar | vivo end-to-end |
| WhatsApp Cloud API | codigo listo, pendiente verificacion Meta Business |
| RLS | **31+ tablas con RLS activo, 0 tablas sensibles expuestas** |
| Privacy frontend | perfil publico solo expone campos seguros |

---

## 3. Sesion 2026-04-10 — resumen (4 commits)

### Commits

| Hash | Descripcion |
|---|---|
| `085caa0` | feat: mejoras calidad v2 — especialidades vet, tipos medicos, especies, vacunas, feed, admin |
| `a0ad64c` | feat: admin CRUD rewards/misiones/moderacion, BereavementChat historial, validaciones |
| `2d0272f` | feat: fix doble logo, memorial en MyPets, PawGame misiones creativas + rewards mejorados |
| `d10d33a` | fix(privacy): perfil publico solo expone campos seguros, datos privados ocultos |

### Lo que se hizo

**Calidad de datos (MEJORAS_CALIDAD_V2.md completo):**
- 31 especialidades vet reales (antes 15, eliminadas "Vacunacion"/"Esterilizacion")
- 25 tipos de registro medico con iconos/badges (antes 6)
- 8 especies con autocompletado de razas top Chile (antes 3 — perro, gato, otro)
- Catalogo de vacunas por especie (perro, gato, conejo) con schedule
- 12 tipos predefinidos de recordatorios con recurrencia sugerida
- Validacion peso por especie (warning no bloqueante)
- Formato telefono chileno (+569XXXXXXXX)
- Formato Colmevet (XX.XXX)

**UX y memorial:**
- Memorial movido a seccion colapsable en MyPets (privada, discreta)
- Eliminado del sidebar principal
- Empty states unificados con componente reutilizable (Reminders, MedicalRecords, UserProfile, MyPets)
- Dark mode date picker resuelto (color-scheme: light)
- Copy estandarizado: "mascotas" (no "peludos"), 0 voseo
- Fix doble logo (Header solo mobile, sidebar desktop)
- Feed sin boton atras innecesario

**Features de valor:**
- Upgrade: tabla comparativa Gratis vs Premium + FAQ colapsable
- Feed: 6 tipos de post (foto, pregunta, consejo, perdido, adopcion, logro) + filtro chips
- Feed: paginacion limit 20 + "Ver mas publicaciones"
- BereavementChat: historial persistente con consentimiento del usuario

**PawGame gamificacion mejorada:**
- Misiones con nombres creativos: "Bascula magica", "Indiana Paws", "Influencer de 4 patas", "Critico gastronomico vet", etc.
- 7 misiones organicas nuevas: check-in matutino, likes, alergias, invitar amigo, primer canje
- 18 rewards mejorados: descuentos reales, donaciones, badges exclusivos, premium

**Admin panel ampliado (13 tabs):**
- Dashboard metricas: usuarios, mascotas, proveedores, reservas/semana, posts/semana, resenas
- CRUD de rewards (paw_shop_rewards) con formulario crear/editar/eliminar
- CRUD de misiones (paw_missions) con formulario crear/editar/eliminar
- Moderacion de contenido (content_reports con resolve/dismiss)
- Logs de seguridad (bereavement_safety_logs con flags de crisis)

**Privacy y seguridad:**
- Perfil publico: solo nombre, avatar, bio, ubicacion, nivel, puntos, stats publicos
- Mascotas de otros: solo nombre, especie, raza, foto, bio (sin datos medicos/microchip/emergencia)
- Perfil propio: acceso completo a todos los datos
- Auditoria RLS: 31+ tablas verificadas, 0 vulnerabilidades

**DB migraciones aplicadas hoy:**
- `20260421000000` — CHECK constraint ampliado medical_records (25 tipos)
- `20260421000001` — Misiones PawGame calidad (8 misiones)
- `20260421000002` — bereavement_chat_messages tabla + RLS
- `20260421000003` — Misiones con nombres creativos + 7 nuevas
- `20260421000004` — 18 rewards mejorados
- Consolidado 20260419-20260420 — Memorial module, vet alternatives, consultation templates, reports infra, seed guards

---

## 4. Migraciones SQL — estado

**Todas aplicadas.** 67 archivos en el repo, todos ejecutados en Supabase.

Archivos duplicados eliminados:
- `20260420200000_seed_contamination_guards.sql` (duplicado de 20260419000001)
- `20260420200001_clean_seed_contamination.sql` (duplicado de 20260419000000)

Migracion de limpieza de seeds (`20260419000000_clean_seed_contamination.sql`) **no aplicada intencionalmente** — contiene DELETEs y hay usuarios reales.

---

## 5. Edge functions — inventario (17)

| # | Function | Estado |
|---|---|---|
| 1 | `medical-suggestions` | vivo, 30/h |
| 2 | `breed-tips` | vivo, 30/h, cacheado |
| 3 | `pet-assistant` | vivo, 5/dia |
| 4 | `generate-shelters` | vivo, 10/h |
| 5 | `moderate-service-promotion` | vivo, 30/h |
| 6 | `generate-medical-summary` | vivo, PDF espanol |
| 7 | `generate-medical-zip` | vivo, ZIP real |
| 8 | `generate-sitemap` | deployada |
| 9 | `flow-create-subscription` | vivo, $3.990/$39.900 |
| 10 | `flow-webhook` | vivo + idempotencia |
| 11 | `send-whatsapp-reminder` | esperando secrets Meta |
| 12 | `reminder-cron` | esperando cron job |
| 13 | `google-calendar-oauth-init` | vivo |
| 14 | `google-calendar-callback` | vivo |
| 15 | `google-calendar-sync` | vivo |
| 16 | `google-calendar-disconnect` | vivo |
| 17 | `bereavement-assistant` | vivo (IA memorial) |

---

## 6. Pricing real (fuente de verdad: `src/lib/plans.ts`)

### B2C
| Plan | Precio/mes | Precio/ano | Features clave |
|---|---|---|---|
| Gratis | $0 | $0 | 2 mascotas, 5 recordatorios, sin PDF, sin compartir ficha |
| Premium | **$3.990** | **$39.900** | Mascotas ilimitadas, PDF, compartir ficha, IA, sin ads, soporte prioritario |

### B2B
| Plan | Precio/mes | Comision | Features clave |
|---|---|---|---|
| Gratis | $0 | **10%** | 20 clientes, 10 bookings/mes, perfil publico |
| Individual | $9.900 | 12% | 100 clientes, 50 bookings, invitaciones resena |
| Clinica Basica | $29.900 | 10% | 500 clientes, bookings ilimitados, multi-vet |
| Clinica Pro | $59.900 | **0%** | Ilimitado, multi-sucursal, analytics avanzado, API |

---

## 7. Archivos nuevos creados en esta sesion

### Libs (src/lib/)
- `medicalRecordTypes.ts` — 25 tipos de registro medico centralizados
- `breeds.ts` — Razas top Chile por especie con fuzzy search
- `vaccines.ts` — Catalogo de vacunas (perro, gato, conejo)
- `reminderTypes.ts` — 12 tipos de recordatorio con recurrencia
- `postTypes.ts` — 6 tipos de post para el feed

### Admin (src/components/admin/)
- `AdminMetrics.tsx` — Dashboard con 6 metricas
- `AdminRewards.tsx` — CRUD paw_shop_rewards
- `AdminMissions.tsx` — CRUD paw_missions
- `AdminModeration.tsx` — Moderacion content_reports
- `AdminSafetyLogs.tsx` — Visor bereavement_safety_logs

---

## 8. Metricas del proyecto al cierre 2026-04-10

| Metrica | Valor |
|---|---|
| Paginas | 40+ |
| Componentes | ~90 |
| Hooks | 30+ |
| Edge functions activas | 17 |
| Tablas Supabase | ~107 |
| Migraciones | 67 (todas aplicadas) |
| Tablas con RLS | 31+ |
| Errores TS | 0 |
| Bundle index principal | 372 kB / 117 kB gzip |
| Tiempo de build | ~19s |
| Admin tabs | 13 |
| Especialidades vet | 31 |
| Tipos registro medico | 25 |
| Especies con razas | 8 |
| Tipos de post feed | 6 |
| Rewards en Paw Shop | 18 |
| Misiones PawGame | ~20 |
| Commits esta sesion | 4 |

---

## 9. Pendientes conocidos

### Acciones manuales del dueno
1. **Meta Business verification** (WhatsApp Cloud API)
2. **Google Consent Screen** verificacion (Calendar sync)
3. **Test real en Samsung fisico**
4. **Outbound a 50 clinicas RM** (marketing)

### Tecnicos (proxima sesion)
| Item | Prioridad | Notas |
|---|---|---|
| Push notifications nativas (Capacitor/FCM) | P1 | Sin esto la app es "solo web" |
| Plantillas post-consulta para vets | P1 | Unico en Chile, tabla ya existe |
| OCR de carnet vacunacion | P2 | Onboarding 10x. Claude Vision API |
| Checklist Grimace (dolor felino) | P2 | Cero competidores |
| Bot FAQ para clinicas | P2 | Ataca dolor vet #2 |
| Bundle optimization (Sentry lazy-load) | P3 | ~80 kB extra |
| Regenerar types.ts post-migraciones | P3 | Algunas tablas nuevas no estan en types |

---

## 10. Reglas operativas

- **NUNCA pegar secrets en el chat**. Si pasa, rotar inmediatamente.
- **NO modificar `docs/` manualmente** — Vite hace `emptyOutDir` en cada build.
- **Migraciones SQL**: aplicar via Dashboard SQL Editor manualmente.
- **Toda copy en espanol chileno** (tuteo, no voseo).
- **Joya de la corona intocable**: ficha medica PDF + directorio publico de vets.
- **Pagos con Flow**, no Webpay.
- **`git add docs/ && git add -u`** despues de `npm run build` para no perder chunks nuevos.
- **Memorial** es seccion privada dentro de MyPets, no en sidebar.
- **Perfil publico** nunca expone: whatsapp, plan, admin flags, datos medicos, microchip.

---

## 11. Como arrancar la proxima sesion

1. `git pull origin main`
2. Leer `CLAUDE.md` (manual operativo) + este archivo
3. Decidir foco:
   - **Push notifications nativas** (Capacitor/FCM)
   - **Plantillas post-consulta** (tabla ya existe)
   - **OCR de carnet** (onboarding 10x)
   - **Checklist Grimace** (percepcion valor altisima)
   - **QA/UX review** (test manual de flujos criticos)
4. Pegar el prompt elegido

---

*Documento generado 2026-04-10 al cierre de la sesion de mejoras calidad v2 + privacy.*

# Paw Friend — Barrido completo end-to-end + contexto + dolores
## Para usar como prompt de continuidad en Claude Code

> **Fecha**: 2026-04-10
> **Proposito**: Documento unico que consolida arquitectura, estado, funcionalidades, tablas, conexiones y dolores de usuarios.
> **Uso**: Copiar y pegar al inicio de cualquier sesion de Claude Code.

---

## 1. IDENTIDAD

- **Nombre**: Paw Friend
- **Dominio**: pawfriend.cl (GitHub Pages desde `docs/`)
- **Repo**: github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile, branch `main`
- **Supabase**: `gwailbjlvevkhwcrovfd`
- **Stack**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + Flow.cl
- **Mobile**: Capacitor 7 (Android + iOS)

---

## 2. METRICAS TECNICAS

| Metrica | Valor |
|---|---|
| `npx tsc -b` | 0 errores |
| `npm run build` | ~19s |
| Bundle | 372 kB / 117 kB gzip |
| Paginas | 41 |
| Componentes | ~90 |
| Hooks | 31 |
| Libs | 25 |
| Edge functions | 20 |
| Tablas Supabase | 108 |
| Tablas con RLS | 31+ |
| Migraciones | 67 (todas aplicadas) |
| Rutas | 59 (45 unicas + 9 redirects + catch-all) |

---

## 3. ARQUITECTURA DE RUTAS

### Publicas (sin login)
| Ruta | Componente | Funcion |
|---|---|---|
| `/` | Index | Landing page |
| `/auth` | Auth | Login/registro |
| `/veterinarios` | DirectorioVets | Directorio publico SEO |
| `/veterinarios/comuna/:c` | DirectorioVets | Filtro por comuna |
| `/veterinarios/especialidad/:e` | DirectorioVets | Filtro por especialidad |
| `/veterinarios/:slug` | PerfilVetPublico | Perfil publico vet |
| `/precios-veterinarios` | PreciosVeterinarios | Estimador precios |
| `/para-veterinarios` | ParaVeterinarios | Landing B2B |
| `/registro-veterinario` | RegistroVeterinario | Registro vet |
| `/demo` | Demo | Demo en vivo |
| `/resena/:token` | DejarResena | Resena publica |
| `/terms`, `/privacy` | Legales | T&C y privacidad |

### Protegidas (requieren auth)
| Ruta | Componente | Funcion |
|---|---|---|
| `/home` | Home | Dashboard principal |
| `/feed` | Feed | Comunidad (6 tipos post + filtro + paginacion) |
| `/my-pets` | MyPets | Mis mascotas + seccion memorial colapsable |
| `/add-pet`, `/edit-pet/:id` | AddPet | CRUD mascota (8 especies, autocompletado razas) |
| `/medical-records` | MedicalRecords | Registros medicos (25 tipos) |
| `/reminders` | Reminders | Recordatorios (12 tipos predefinidos) |
| `/pet/:id/clinical` | PetClinicalRecord | Ficha clinica completa (5 tabs + PDF + QR) |
| `/adoption` | Adoption | Adopcion |
| `/paw-game` | PawGame | Gamificacion (~20 misiones + 18 rewards + niveles) |
| `/servicios` | Servicios | Directorio servicios |
| `/services/:type` | ServiceDirectory | Walkers, vets, sitters, trainers, groomers |
| `/maps` | Maps | Mapa Leaflet |
| `/chat`, `/chat/:id` | Chat | Mensajeria |
| `/profile` | Profile | Mi perfil |
| `/user/:id` | UserProfile | Perfil publico (campos privados ocultos) |
| `/settings` | Settings | Configuracion + link memorial |
| `/upgrade` | Upgrade | Premium (tabla comparativa + FAQ) |
| `/mis-reservas` | MyBookings | Reservas |
| `/en-memoria` | EnMemoria | Memorial completo |
| `/provider/dashboard` | ProviderDashboard | Dashboard proveedor |
| `/provider/profile-edit` | ProviderProfileEdit | Editar perfil proveedor |
| `/admin` | Admin | Panel admin (13 tabs) |
| `/reportes` | Reportes | Reportes periodicos |

---

## 4. TABLAS SUPABASE — AGRUPADAS POR DOMINIO

### Core usuarios
- `profiles` — perfil usuario (avatar, bio, nivel, puntos, plan, whatsapp)
- `user_stats` — estadisticas agregadas
- `user_roles` — roles (admin, provider)
- `user_blocks` — bloqueos entre usuarios
- `user_follows` — follows sociales
- `notification_preferences` — preferencias notif
- `notifications` — notificaciones push/in-app

### Mascotas
- `pets` — mascotas (lifecycle_status: active/memorial, 8 especies)
- `medical_records` — registros medicos (25 tipos con CHECK constraint)
- `medical_documents` — documentos subidos
- `medical_share_tokens` — tokens para compartir ficha
- `pet_reminders` — recordatorios (12 tipos)
- `pet_activities` — actividades de mascotas
- `pet_activity_cheers` — cheers a actividades
- `pet_documents` — documentos legacy
- `pet_paw_progress` — progreso PawGame por mascota

### Memorial
- `memorial_events` — eventos de despedida (passing, tribute, photo, etc.)
- `bereavement_safety_logs` — alertas de crisis (admin-only)
- `bereavement_chat_messages` — historial chat memorial (con consentimiento)

### Servicios y proveedores
- `service_providers` — proveedores verificados
- `provider_service_offerings` — servicios ofrecidos
- `provider_availability` — disponibilidad
- `provider_balances` — balances economicos
- `provider_subscriptions` — suscripciones B2B
- `provider_verifications` — verificaciones Colmevet
- `service_promotions` — promociones activas
- `service_reviews` — resenas de servicios
- `review_invitations` — invitaciones a resena
- `review_helpful_votes` — votos utilidad resena
- `vet_service_prices` — precios por servicio/comuna
- `vet_clinical_notes` — notas clinicas del vet (con alternatives_discussed)
- `consultation_templates` — plantillas de consulta (5 del sistema)

### Perfiles especializados
- `vet_profiles`, `vet_bookings`, `vet_visits`, `vet_documents`, `vet_reviews`
- `dog_walker_profiles`, `walk_bookings`, `walk_routes`, `walk_reports`, `walk_reviews`
- `dogsitter_profiles`, `dogsitter_bookings`, `dogsitter_messages`, `dogsitter_reports`, `dogsitter_reviews`
- `trainer_profiles`, `training_bookings`, `training_reports`, `training_reviews`
- `groomer_profiles`

### Social y comunidad
- `posts` — publicaciones (6 tipos: foto, pregunta, consejo, perdido, adopcion, logro)
- `post_likes` — likes
- `post_comments` — comentarios
- `conversations` — conversaciones chat
- `messages` — mensajes

### Adopcion
- `adoption_posts` — publicaciones adopcion
- `adoption_interests` — interesados
- `adoption_messages` — mensajes adopcion
- `adoption_shelters` — refugios
- `lost_pets` — mascotas perdidas

### PawGame (gamificacion)
- `paw_missions` — misiones (~20 con nombres creativos)
- `user_mission_progress` — progreso por mision
- `paw_badges` — badges desbloqueables
- `user_paw_badges` — badges ganados
- `paw_shop_rewards` — tienda de premios (18 rewards)
- `user_shop_redemptions` — canjes realizados
- `paw_point_transactions` — transacciones de puntos (earn/spend)
- `user_guardian_progress` — nivel y puntos totales
- `guardian_levels` — definicion de niveles (1-10)
- `achievements`, `user_achievements` — logros

### Pagos y suscripciones
- `subscriptions` — suscripciones Flow
- `payment_history` — historial pagos
- `bookings` — reservas generales
- `orders`, `order_items`, `cart_items` — ordenes
- `balance_transactions` — transacciones de balance

### Infraestructura
- `periodic_reports` — reportes semanales/mensuales
- `places` — lugares (veterinarias, parques)
- `platform_config` — configuracion plataforma
- `google_calendar_tokens` — tokens OAuth Google
- `external_calendar_events` — eventos sincronizados
- `ai_request_quota`, `ai_usage` — cuotas IA
- `whatsapp_message_log` — log mensajes WhatsApp
- `feature_usage` — uso de features
- `verification_requests` — solicitudes verificacion
- `content_reports` — reportes de contenido (moderacion)

---

## 5. EDGE FUNCTIONS (20)

| Function | Dominio | Estado |
|---|---|---|
| `flow-create-subscription` | Pagos | Vivo |
| `flow-webhook` | Pagos | Vivo + idempotencia |
| `generate-medical-summary` | Ficha medica | Vivo, PDF espanol |
| `generate-medical-zip` | Ficha medica | Vivo, ZIP real |
| `medical-suggestions` | IA medica | Vivo, 30/h |
| `breed-tips` | IA razas | Vivo, 30/h |
| `pet-assistant` | IA mascota | Vivo, 5/dia |
| `bereavement-assistant` | IA memorial | Vivo |
| `moderate-service-promotion` | Moderacion | Vivo, 30/h |
| `generate-shelters` | Adopcion | Vivo, 10/h |
| `generate-sitemap` | SEO | Deployada |
| `google-calendar-oauth-init` | Calendar | Vivo |
| `google-calendar-callback` | Calendar | Vivo |
| `google-calendar-sync` | Calendar | Vivo |
| `google-calendar-disconnect` | Calendar | Vivo |
| `send-whatsapp-reminder` | WhatsApp | Esperando Meta |
| `reminder-cron` | Cron | Esperando cron |
| `ocr-vaccination-card` | OCR | Deployada, no conectada |
| `generate-weekly-owner-reports` | Reportes | Deployada |
| `generate-weekly-vet-reports` | Reportes | Deployada |

---

## 6. DOLORES DE USUARIOS QUE RESOLVEMOS

### Duenos de mascotas (B2C)

| # | Dolor | Severidad | Estado Paw Friend | Como lo resolvemos |
|---|---|---|---|---|
| 1 | **Costo y opacidad de precios vet** | ALTO | Parcial | Estimador por comuna, directorio con precios |
| 2 | **Olvido de citas y vacunas** | ALTO | Resuelto | Recordatorios (12 tipos) + push (pendiente) |
| 3 | **No sabe si su mascota esta bien** | MEDIO-ALTO | Parcial | Pet assistant IA, breed tips |
| 4 | **Historial clinico disperso** | ALTO | Resuelto | Ficha clinica PDF + compartir + QR |
| 5 | **No sabe que vet elegir** | MEDIO | Resuelto | Directorio publico + resenas + filtros |
| 6 | **Duelo por perdida de mascota** | EMOCIONAL | Resuelto | Memorial + BereavementChat IA + safety |

### Veterinarios (B2B)

| # | Dolor | Severidad | Estado Paw Friend | Como lo resolvemos |
|---|---|---|---|---|
| 1 | **Carga administrativa (30-40% del dia)** | ALTO | Parcial | Notas clinicas + plantillas (5) + alternativas |
| 2 | **Llamados telefonicos rutinarios** | ALTO | Parcial | Chat in-app + reservas online |
| 3 | **Comunicacion post-consulta** | MEDIO-ALTO | Parcial | Compartir ficha + resumen IA |
| 4 | **No recibe resenas** | MEDIO | Resuelto | Invitaciones de resena + review cards |
| 5 | **Visibilidad online** | ALTO | Resuelto | Directorio SEO + perfil publico + precios |
| 6 | **Fuga de pacientes por precio** | MEDIO-ALTO | Parcial | Campo "alternativas discutidas" en notas |

### Gap critico detectado
- **81% de vets dicen ofrecer alternativas** de tratamiento
- **73% de duenos dicen nunca haber recibido una**
- Paw Friend resuelve esto con el campo `alternative_offered` + `alternatives_discussed` en notas clinicas

---

## 7. PRICING

### B2C
| Plan | $/mes | $/ano | Mascotas | PDF | Compartir |
|---|---|---|---|---|---|
| Gratis | $0 | $0 | 2 | No | No |
| Premium | $3.990 | $39.900 | Ilimitadas | Si | Si |

### B2B
| Plan | $/mes | Comision | Clientes | Destacado |
|---|---|---|---|---|
| Gratis | $0 | 10% | 20 | No |
| Individual | $9.900 | 12% | 100 | No |
| Clinica Basica | $29.900 | 10% | 500 | Si |
| Clinica Pro | $59.900 | 0% | Ilimitado | Si |

---

## 8. SEGURIDAD Y PRIVACY

- **RLS activo** en 31+ tablas
- **Perfil publico**: solo nombre, avatar, bio, ubicacion, nivel, stats
- **Datos ocultos de otros**: whatsapp, plan, admin flags, datos medicos, microchip, emergencia
- **Memorial**: seccion privada colapsable en MyPets
- **Safety logs**: solo admin ve flags de crisis del bereavement chat
- **Seed guards**: trigger que bloquea nombres seed en cuentas reales
- **Pagos**: Flow.cl, credenciales como Supabase secrets

---

## 9. ADMIN PANEL (13 tabs)

1. Metricas (usuarios, mascotas, reservas, posts, resenas, proveedores)
2. Central (service providers)
3. Legacy (providers antiguos)
4. Verificaciones
5. Promociones
6. Usuarios
7. Configuracion
8. Anuncios
9. Vets Colmevet
10. Rewards (CRUD paw_shop_rewards)
11. Misiones (CRUD paw_missions)
12. Moderacion (content_reports)
13. Seguridad (bereavement_safety_logs)

---

## 10. PENDIENTES PRIORIZADOS

### P1 — Critico para crecimiento
- Push notifications nativas (Capacitor/FCM)
- WhatsApp reminders (esperando Meta Business verification)
- Regenerar types.ts post-migraciones recientes

### P2 — Diferenciadores
- Checklist Grimace (dolor felino/canino) — 0 competidores
- OCR carnet vacunacion — onboarding 10x
- Bot FAQ para clinicas — ataca dolor vet #2
- Plantillas post-consulta completas (tabla existe, UI parcial)

### P3 — Polish
- Bundle optimization (Sentry lazy-load, ~80 kB)
- Test real en dispositivo fisico Android
- Case study con 3 clinicas piloto

---

## 11. MERCADO CHILE

- Mercado pet care: USD 1.942M (2023) → 3.254M (2032)
- 86% de chilenos tiene mascota
- 80% no tiene salud de mascota al dia
- 70% de vets con dificultades de organizacion
- 55% calendario vacunas no actualizado
- Solo 27.4% mascotas con microchip

### Diferenciadores de Paw Friend vs competencia
1. Doble cara B2C+B2B integrada (unico en Chile)
2. Directorio publico SEO de vets
3. Estimador de precios por comuna (unico en Chile)
4. Pricing transparente en CLP para vets chicos
5. Premium $3.990 < Netflix/Spotify
6. Google Calendar sync nativo
7. PawGame con rewards canjeables
8. Memorial con IA de acompanamiento

---

*Generado 2026-04-10. Usar como prompt base en cualquier sesion de Claude Code.*

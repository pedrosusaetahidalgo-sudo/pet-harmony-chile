# Paw Friend — Mapa Funcional Completo

> Documento de referencia: cada modulo, sus archivos, flujo end-to-end y oportunidades de mejora.
> Generado: 2026-04-10. Verificado contra el codigo real.
> Ultima sync de metricas: 2026-04-11 (88 migraciones, 21 edge functions + `_shared/`).

---

## Indice

1. [Autenticacion](#1-autenticacion)
2. [Mascotas](#2-mascotas)
3. [Ficha Clinica y Registros Medicos](#3-ficha-clinica)
4. [Recordatorios](#4-recordatorios)
5. [Directorio de Veterinarios](#5-directorio-vets)
6. [Dashboard y Panel Vet](#6-dashboard-vet)
7. [Chat y Mensajeria](#7-chat)
8. [Social (Feed, Follows)](#8-social)
9. [Inteligencia Artificial](#9-ia)
10. [Pagos y Planes](#10-pagos)
11. [Reviews y Resenas](#11-reviews)
12. [Adopcion](#12-adopcion)
13. [Servicios y Reservas](#13-servicios)
14. [Mapas](#14-mapas)
15. [Admin Panel](#15-admin)
16. [Paw Game (Gamificacion)](#16-paw-game)
17. [Google Calendar](#17-google-calendar)
18. [Sistema QR](#18-qr)
19. [Onboarding](#19-onboarding)
20. [Perfil y Settings](#20-perfil-settings)
21. [Home y Landing](#21-home-landing)
22. [Memorial](#22-memorial)
23. [Reportes Semanales](#23-reportes)
24. [SEO y Sitemap](#24-seo)
25. [Infraestructura y Layout](#25-infraestructura)

---

## 1. AUTENTICACION <a id="1-autenticacion"></a>

```
Autenticacion
├── Paginas
│   └── src/pages/Auth.tsx                          # Login/registro (email, magic link, Google, Facebook)
├── Hooks
│   ├── src/hooks/useAuth.tsx                       # Contexto de sesion, estado auth
│   ├── src/hooks/useGoogleAuth.tsx                 # OAuth Google (web + nativo Capacitor)
│   └── src/hooks/useFacebookAuth.tsx               # OAuth Facebook
├── Componentes
│   ├── src/components/GoogleSignInButton.tsx        # Boton Google
│   ├── src/components/ProtectedRoute.tsx            # Guard: redirige a /auth si no logueado
│   └── src/components/AdminRoute.tsx                # Guard: requiere rol admin
├── Integracion
│   ├── src/integrations/supabase/client.ts          # Cliente Supabase (auth + DB)
│   └── src/lib/platform.ts                          # Deteccion web/nativo para OAuth
├── Config
│   ├── .env                                         # VITE_GOOGLE_CLIENT_ID_WEB
│   └── capacitor.config.ts                          # serverClientId para nativo
└── Migraciones
    └── supabase/migrations/20251217225144_initial-setup.sql
```

### Flujo end-to-end
```
Usuario abre /auth
  → Elige metodo (email magic link / Google / Facebook)
  → [Google] useGoogleAuth → signInWithOAuth (web) o signInWithIdToken (nativo)
  → [Email] supabase.auth.signInWithOtp({ email })
  → Supabase verifica → onAuthStateChange dispara
  → ProtectedRoute detecta sesion → redirige a /home o returnTo
  → Si es primera vez → redirige a /onboarding-mascota o /onboarding-vet
```

### Oportunidades de mejora
- **A1**: Email magic link como opcion principal (ya implementado)
- Agregar recuperacion de contrasena explicita
- Rate limit visual en intentos fallidos
- Verificacion de email pendiente con banner persistente

---

## 2. MASCOTAS <a id="2-mascotas"></a>

```
Mascotas
├── Paginas
│   ├── src/pages/AddPet.tsx                        # Crear + editar mascota (mismo componente)
│   └── src/pages/MyPets.tsx                        # Lista de mascotas del usuario
├── Componentes
│   ├── src/components/PetCard.tsx                   # Card de mascota en lista
│   ├── src/components/PetProfileCard.tsx            # Perfil detallado
│   └── src/components/onboarding/VaccinationCardOCR.tsx  # OCR carnet vacunas
├── Hooks
│   ├── src/hooks/useCanAddPet.ts                    # Limite segun plan (2 gratis, ilimitado premium)
│   └── src/hooks/useOrganicRewards.ts               # Puntos por crear mascota
├── Librerias
│   ├── src/lib/breeds.ts                            # 8 especies, razas por especie
│   └── src/lib/vaccines.ts                          # Catalogo vacunas por especie
├── Edge Functions
│   └── supabase/functions/ocr-vaccination-card/     # OCR con IA para carnet
└── Migraciones
    ├── supabase/migrations/20260402000000_clinical_pet_fields.sql
    └── supabase/migrations/20260422000001_pending_owner_pets.sql
```

### Flujo end-to-end
```
Usuario va a /add-pet
  → Llena: foto, nombre, especie, raza (autocomplete), fecha nacimiento
  → Validacion por especie (max edad: perro 25, hamster 5, tortuga 50, etc.)
  → Opcional: sube foto carnet vacunas → OCR extrae datos
  → useCanAddPet verifica limite del plan
  → INSERT en tabla pets (owner_id = auth.uid())
  → Trigger BD: auto-crea recordatorios segun especie + edad
  → useOrganicRewards: suma PawPoints
  → Toast: "Luna agregada. Creamos 4 recordatorios automaticos"
  → Redirige a /my-pets
```

### Oportunidades de mejora
- Wizard paso a paso para primera mascota (actualmente es form unico)
- Preview de recordatorios que se van a crear antes de guardar
- Importar datos desde otra app (CSV/JSON)
- Campo "veterinario de cabecera" para vincular vet directamente

---

## 3. FICHA CLINICA Y REGISTROS MEDICOS <a id="3-ficha-clinica"></a>

```
Ficha Clinica
├── Paginas
│   ├── src/pages/MedicalRecords.tsx                 # Agregador de registros medicos
│   └── src/pages/PetClinicalRecord/
│       ├── index.tsx                                # Pagina principal con tabs
│       ├── tabs/TabResumen.tsx                      # Tab resumen general
│       ├── tabs/TabHistorial.tsx                    # Tab timeline de registros
│       ├── tabs/TabAlimentacion.tsx                  # Tab nutricion
│       ├── tabs/TabDocumentos.tsx                   # Tab documentos subidos
│       ├── tabs/TabCompartir.tsx                    # Tab compartir (QR + link + PDF)
│       ├── helpers.ts                               # Funciones auxiliares
│       ├── pdf.ts                                   # Generacion PDF (joya de la corona)
│       ├── shared.tsx                               # Componentes compartidos
│       └── types.ts                                 # Tipos TypeScript
├── Componentes
│   ├── src/components/AddMedicalRecord.tsx           # Form agregar registro
│   ├── src/components/medical/
│   │   ├── MedicalDocumentsTab.tsx                   # Gestion documentos
│   │   ├── UploadMedicalDocumentDialog.tsx           # Upload dialog
│   │   ├── PetQRDisplay.tsx                          # QR de la mascota
│   │   ├── MedicalSummaryButton.tsx                  # Boton descarga resumen
│   │   └── GrimaceChecklist.tsx                      # Escala dolor felino
├── Hooks
│   ├── src/hooks/useMedicalRecords.tsx               # CRUD registros medicos
│   ├── src/hooks/useMedicalDocuments.tsx             # Upload/gestion documentos
│   └── src/hooks/useMedicalSharing.tsx               # Tokens de compartir
├── Librerias
│   └── src/lib/medicalRecordTypes.ts                 # 25 tipos de registro
├── Edge Functions
│   ├── supabase/functions/generate-medical-summary/  # PDF con IA
│   ├── supabase/functions/generate-medical-zip/      # ZIP documentos
│   └── supabase/functions/ocr-vaccination-card/      # OCR carnet
└── Migraciones
    └── supabase/migrations/20251223000000_comprehensive_medical_records.sql
```

### Flujo end-to-end
```
Usuario va a /pet/:petId/clinical
  → Tab Resumen: estado general, peso, alergias, medicamentos
  → Tab Historial: timeline de 25 tipos de registro (vacunas, cirugias, controles...)
     → Click "Agregar registro" → AddMedicalRecord form
     → Selecciona tipo, fecha, vet, clinica, notas
     → INSERT en medical_records
  → Tab Documentos: sube PDFs, fotos, examenes
     → Upload a Supabase Storage → INSERT en medical_documents
  → Tab Compartir:
     → Muestra QR unico de la mascota (PetQRDisplay)
     → Genera link temporal 30 dias (useMedicalSharing)
     → Opciones: copiar, WhatsApp, descargar QR
  → Tab Alimentacion: tipo dieta, alergias alimentarias
  → Boton PDF: genera ficha completa descargable (pdf.ts)
```

### Oportunidades de mejora
- **Busqueda** dentro de registros medicos (actualmente solo scroll)
- **Graficos** de peso/salud a lo largo del tiempo
- **Adjuntar fotos** directamente a cada registro (no solo tab documentos)
- **Notificacion al vet** cuando dueno agrega registro nuevo
- **Historial de cambios** (audit trail) en registros editados

---

## 4. RECORDATORIOS <a id="4-recordatorios"></a>

```
Recordatorios
├── Paginas
│   └── src/pages/Reminders.tsx                      # Lista completa de recordatorios
├── Hooks
│   ├── src/hooks/useReminders.tsx                    # Fetch overdue + upcoming + complete
│   └── src/hooks/useNotifications.tsx                # Preferencias notificacion
├── Librerias
│   └── src/lib/reminderTypes.ts                      # 12 tipos de recordatorio
├── Edge Functions
│   ├── supabase/functions/reminder-cron/             # Cron diario 9AM Chile
│   └── supabase/functions/send-whatsapp-reminder/    # WhatsApp (pendiente Meta)
├── Migraciones
│   └── supabase/migrations/20260423000001_auto_create_pet_reminders.sql
└── Dashboard
    └── src/pages/Home.tsx                            # Card "Requiere atencion" / "Proximos cuidados"
```

### Flujo end-to-end
```
Auto-creacion (al agregar mascota):
  → Trigger BD: create_default_reminders_for_new_pet()
  → Consulta vaccination_protocols segun especie + edad
  → Crea recordatorios: Antirrabica, Sextuple, Antiparasitario, etc.

Visualizacion:
  → /home: card con 2 overdue + 2 upcoming (colores rojo/amarillo)
  → /reminders: lista completa agrupada por estado

Completar:
  → Click check → completeReminder.mutate(id)
  → UPDATE pet_reminders SET is_completed = true

Cron:
  → reminder-cron se ejecuta diario a las 9AM
  → Envia notificaciones de recordatorios proximos
  → WhatsApp: codigo listo, pendiente verificacion Meta Business
```

### Oportunidades de mejora
- **Snooze** (posponer 1 dia, 1 semana)
- **Recordatorios recurrentes** automaticos (cada 3 meses antiparasitario)
- **Push notifications** nativas via Capacitor (infraestructura lista, falta FCM/APNs)
- **Calendario visual** de recordatorios (vista mensual)
- Integrar con **Google Calendar** automaticamente (no solo manual)

---

## 5. DIRECTORIO DE VETERINARIOS <a id="5-directorio-vets"></a>

```
Directorio Vets
├── Paginas
│   ├── src/pages/DirectorioVets.tsx                  # Directorio con filtros + SEO
│   ├── src/pages/PerfilVetPublico.tsx                # Perfil publico del vet
│   ├── src/pages/PreciosVeterinarios.tsx             # Estimador precios por comuna
│   └── src/pages/RegistroVeterinario.tsx             # Registro nuevo vet
├── Componentes
│   ├── src/components/provider/ProviderDirectoryCard.tsx  # Card en directorio
│   ├── src/components/ProviderRatingSummary.tsx       # Rating con estrellas
│   ├── src/components/PriceEstimatorWidget.tsx        # Widget precios
│   └── src/components/TopRatedProviders.tsx           # Top vets
├── Hooks
│   ├── src/hooks/useDirectoryVets.tsx                 # Busqueda + paginacion infinita
│   └── src/hooks/useVetPriceEstimator.ts             # Calculo estimador
├── Librerias
│   └── src/lib/vetDirectory.ts                       # Comunas, especialidades, SEO utils
│   └── src/types/vetDirectory.ts                     # Tipos
├── Rutas publicas
│   ├── /veterinarios                                 # Directorio general
│   ├── /veterinarios/comuna/:comuna                  # Filtro por comuna
│   ├── /veterinarios/especialidad/:especialidad      # Filtro por especialidad
│   ├── /veterinarios/:slug                           # Perfil publico
│   ├── /precios-veterinarios                         # Estimador general
│   └── /precios-veterinarios/comuna/:comuna          # Estimador por comuna
└── Migraciones
    ├── supabase/migrations/20260406000000_provider_directory_and_plans.sql
    ├── supabase/migrations/20260408130000_vet_service_prices.sql
    └── supabase/migrations/20260408140000_seed_vet_service_prices.sql
```

### Flujo end-to-end
```
Publico (sin login):
  → /veterinarios → DirectorioVets.tsx
  → Filtros: comuna (prominente), tipo, especialidad, rating minimo
  → Seccion "Nuevos en Paw Friend" (carousel, vets < 90 dias)
  → Click vet → /veterinarios/:slug → PerfilVetPublico
     → Foto, bio, especialidades, zonas, verificacion Colmevet
     → Reviews verificadas (o "Sin resenas aun" si nuevo)
     → Precio desde $X
     → CTA: Agendar consulta / Enviar mensaje
  → /precios-veterinarios → Estimador por comuna y tipo consulta

SEO:
  → Helmet con meta tags dinamicos por comuna/especialidad
  → Canonical URLs
  → Sitemap edge function
```

### Oportunidades de mejora
- **Mapa integrado** en directorio (actualmente separado en /maps)
- **Disponibilidad en tiempo real** ("Atiende hoy" badge)
- **Comparar vets** side-by-side (seleccionar 2-3)
- **Filtro por precio** (rango min-max)
- **Ordenar por distancia** (con geolocalizacion)
- **Perfil mas completo**: horarios, fotos clinica, certificaciones

---

## 6. DASHBOARD Y PANEL VET <a id="6-dashboard-vet"></a>

```
Panel Veterinario
├── Paginas
│   ├── src/pages/ParaVeterinarios.tsx                # Landing B2B
│   ├── src/pages/ProviderProfileEdit.tsx             # Editor perfil publico
│   └── src/pages/GroomerProfileEdit.tsx              # Editor perfil groomer
├── Componentes
│   ├── src/components/provider/
│   │   ├── ProviderDashboard.tsx                     # Dashboard principal
│   │   ├── VetPatientsList.tsx                       # Lista mis pacientes
│   │   ├── NewPatientForm.tsx                        # Crear paciente + invitar dueno
│   │   ├── VetNoteEditor.tsx                         # Editor nota clinica
│   │   ├── ConsultationTemplateSelector.tsx          # Selector plantillas (5 sistema)
│   │   ├── SharedFichasCard.tsx                      # Fichas compartidas (ultimos 7 dias)
│   │   ├── VetFollowupsCard.tsx                      # Seguimientos esta semana
│   │   ├── ProviderDirectoryCard.tsx                 # Visibilidad en directorio
│   │   ├── BioTemplateSelector.tsx                   # Templates bio
│   │   ├── MisPreciosEditor.tsx                      # Editor de precios
│   │   ├── ProviderAvailabilityManager.tsx           # Gestion disponibilidad
│   │   └── SaveTemplateButton.tsx                    # Guardar plantilla custom
├── Hooks
│   ├── src/hooks/useProviderProfile.tsx               # Perfil proveedor
│   ├── src/hooks/useVetClinicalNotes.ts               # CRUD notas clinicas
│   ├── src/hooks/useConsultationTemplates.ts          # Plantillas consulta
│   └── src/hooks/useGroomerProfile.tsx                # Perfil groomer
├── Edge Functions
│   └── supabase/functions/generate-weekly-vet-reports/ # Reporte semanal
└── Migraciones
    ├── supabase/migrations/20260408150000_vet_clinical_notes.sql
    ├── supabase/migrations/20260419000002_vet_notes_alternatives.sql
    ├── supabase/migrations/20260419000003_consultation_templates.sql
    ├── supabase/migrations/20260423000002_clinical_note_followup_trigger.sql
    └── supabase/migrations/20260423000003_auto_review_invitation.sql
```

### Flujo end-to-end
```
Vet entra a /provider/dashboard
  → VetFollowupsCard: seguimientos proximos 7 dias
  → SharedFichasCard: fichas compartidas recientes
  → Onboarding (si nuevo): 3 pasos para completar perfil
  → Balance: disponible, pendiente, total ganado, retirado
  → Stats: visitas perfil, rating, clientes unicos
  → VetPatientsList: lista de pacientes
     → Click "Nuevo paciente" → NewPatientForm
        → 5 campos + email dueno
        → INSERT pet + send-pet-invitation edge function
        → Dueno recibe email → acepta → mascota se vincula
     → Click paciente → ver ficha clinica
        → VetNoteEditor + ConsultationTemplateSelector
        → Selecciona plantilla → edita campos
        → Marca "Requiere seguimiento" + fecha
        → SAVE → trigger auto-crea recordatorio + invitacion review
```

### Oportunidades de mejora
- **Agenda del dia** con pacientes agendados (vista calendario)
- **Notas por voz** (Whisper transcription) — planificado v1.2
- **Estadisticas mensuales** mas detalladas (graficos Recharts)
- **Comunicacion directa** con dueno desde la nota (sin ir a chat)
- **Plantillas customizables** por vet (actualmente solo 5 del sistema + custom)
- **Export de datos** del panel (CSV/Excel)

---

## 7. CHAT Y MENSAJERIA <a id="7-chat"></a>

```
Chat
├── Paginas
│   ├── src/pages/Chat.tsx                            # Lista conversaciones
│   └── src/pages/ChatConversation.tsx                # Conversacion individual
├── Hooks
│   └── src/hooks/useStartConversation.tsx            # Iniciar conversacion
├── Features
│   ├── Realtime via Supabase postgres_changes
│   ├── Busqueda por nombre
│   ├── Badge mensajes no leidos
│   ├── Quick replies (5 respuestas rapidas)
│   └── "Nuevo mensaje" a usuarios que sigues mutuamente
└── Migraciones
    └── supabase/migrations/20251128024709_*.sql       # Tabla conversations + messages
```

### Flujo end-to-end
```
/chat → lista conversaciones ordenada por ultimo mensaje
  → Busqueda por nombre
  → "Nuevo" → muestra usuarios con follow mutuo
     → Click usuario → startConversation → INSERT conversations
     → Redirige a /chat/:conversationId
  → Conversacion:
     → Mensajes con realtime (INSERT detectado por channel)
     → Quick replies (primeros mensajes): 5 opciones pre-cargadas
     → Enviar: INSERT messages → auto-scroll → mark as read
```

### Oportunidades de mejora
- **Enviar fotos/imagenes** en chat
- **Indicador "escribiendo..."** (typing indicator)
- **Mensajes de voz**
- **Reacciones** a mensajes
- **Respuestas rapidas contextuales** (segun rol vet/dueno)
- **Notificaciones push** de nuevos mensajes
- **Chat con vet desde perfil publico** (sin follow mutuo previo)

---

## 8. SOCIAL (FEED, FOLLOWS) <a id="8-social"></a>

```
Social
├── Paginas
│   ├── src/pages/Feed.tsx                            # Feed social
│   ├── src/pages/Profile.tsx                         # Mi perfil
│   └── src/pages/UserProfile.tsx                     # Perfil de otro usuario
├── Componentes
│   ├── src/components/social/ActivityFeed.tsx         # Feed component
│   ├── src/components/CreatePost.tsx                  # Crear post
│   ├── src/components/PostComments.tsx                # Comentarios
│   ├── src/components/FollowButton.tsx                # Follow/unfollow
│   ├── src/components/BlockUserButton.tsx             # Bloquear
│   └── src/components/ReportUserDialog.tsx            # Reportar
├── Hooks
│   ├── src/hooks/useFollows.tsx                       # Follow/unfollow + blocking
│   └── src/hooks/useBlockedUsers.tsx                  # Lista bloqueados
└── Migraciones
    ├── supabase/migrations/20251202000001_add_follows_blocks_system.sql
    └── supabase/migrations/20260411000000_pet_activities_social.sql
```

### Flujo end-to-end
```
/feed → ActivityFeed carga posts recientes
  → CreatePost: texto + foto opcional
  → Like / comentar posts
  → Click usuario → /user/:userId → UserProfile
     → FollowButton, BlockUserButton, ReportUserDialog
  → Feed en /home (3 posts recientes en card "Actividad de la comunidad")
```

### Oportunidades de mejora
- **Feed algoritmico** (actualmente cronologico)
- **Hashtags** y busqueda por tema
- **Historias** (stories efimeras)
- **Compartir posts** externamente
- **Feed de mascotas** (seguir mascotas, no solo personas)
- Considerar si el social agrega valor real o distrae del core (ficha medica + vets)

---

## 9. INTELIGENCIA ARTIFICIAL <a id="9-ia"></a>

```
IA
├── Componentes
│   ├── src/components/ai/
│   │   ├── PetAssistant.tsx                          # Chat IA principal
│   │   ├── AIDisclaimer.tsx                          # Disclaimer medico
│   │   ├── AIErrorState.tsx                          # Error handling
│   │   ├── AILoadingState.tsx                        # Loading
│   │   ├── AIRateLimitState.tsx                      # Limite alcanzado
│   │   └── AIResultCard.tsx                          # Card resultado
│   ├── src/components/BreedTips.tsx                   # Tips por raza
│   └── src/components/memorial/BereavementChat.tsx    # Chat duelo
├── Hooks
│   └── src/hooks/useAISkill.ts                       # Interface generica para skills IA
├── Edge Functions
│   ├── supabase/functions/pet-assistant/              # Asistente veterinario (5/dia)
│   │   → Modelo: claude-sonnet-4-5
│   │   → Contexto: ficha completa + historial + recordatorios
│   │   → Output: respuesta + nivel_urgencia + requiere_veterinario + sugerencias
│   ├── supabase/functions/medical-suggestions/        # Sugerencias medicas (30/h)
│   ├── supabase/functions/breed-tips/                 # Tips por raza
│   ├── supabase/functions/bereavement-assistant/      # Apoyo en duelo
│   ├── supabase/functions/generate-medical-summary/   # Resumen PDF con IA
│   └── supabase/functions/_shared/ai-base.ts          # Utilidades compartidas
└── Migraciones
    └── supabase/migrations/20260410000000_ai_request_quota.sql
```

### Flujo end-to-end (Pet Assistant)
```
Usuario abre PetAssistant (desde ficha clinica o home)
  → Disclaimer medico (AIDisclaimer type="medical")
  → Escribe pregunta (ej: "Luna no quiere comer")
  → useAISkill invoca edge function pet-assistant
  → Edge function:
     → Verifica auth + rate limit (5/dia)
     → Carga ficha completa: datos, historial, recordatorios, alergias
     → System prompt con datos reales + reglas estrictas
     → Llama a Claude (claude-sonnet-4-5, max 600 tokens)
     → Parsea JSON: respuesta, nivel_urgencia, requiere_veterinario, sugerencias
  → Frontend muestra:
     → Burbuja con respuesta
     → Badge color: verde (bajo) / amarillo (medio) / rojo (alto)
     → Si requiere_veterinario: banner rojo "Consultar con veterinario"
     → Sugerencias de accion
     → Recordatorios relevantes
```

### Oportunidades de mejora
- **Historial de conversaciones** persistente (actualmente se pierde al cerrar)
- **Mas consultas/dia** para premium (actualmente 5 para todos)
- **Triage mas visual** con CTA "Ver clinicas 24h" para urgencias
- **Sugerencias proactivas** basadas en historial (ej: "Luna no se ha pesado en 6 meses")
- **Asistente de voz** (Whisper) — planificado v1.2
- **Deteccion de fotos** (analisis de imagenes de sintomas)

---

## 10. PAGOS Y PLANES <a id="10-pagos"></a>

```
Pagos
├── Paginas
│   ├── src/pages/Upgrade.tsx                         # Seleccion de plan
│   ├── src/pages/UpgradeSuccess.tsx                  # Exito
│   ├── src/pages/UpgradeCancel.tsx                   # Cancelacion
│   └── src/pages/PaymentResult.tsx                   # Resultado generico
├── Hooks
│   └── src/hooks/usePlan.tsx                         # Plan actual + limites
├── Librerias
│   └── src/lib/plans.ts                              # Definiciones de planes + precios
├── Edge Functions
│   ├── supabase/functions/flow-create-subscription/   # Crear suscripcion Flow.cl
│   ├── supabase/functions/flow-webhook/               # Webhook de Flow.cl
│   └── supabase/functions/_shared/payment-gateway.ts  # Utilidades pago
└── Migraciones
    ├── supabase/migrations/20260413000000_premium_b2c_flow.sql
    └── supabase/migrations/20260414000000_flow_hardening.sql
```

### Flujo end-to-end
```
/upgrade → muestra planes B2C (Gratis vs Premium $3.990/mes)
  → Click "Suscribirse" → flow-create-subscription edge function
  → Redirige a Flow.cl (pasarela chilena)
  → Usuario paga → Flow envia webhook
  → flow-webhook verifica + actualiza BD (idempotente + rate limited)
  → Redirige a /upgrade/success o /upgrade/cancel
  → usePlan refleja nuevo estado (is_premium = true)
  → Desbloquea: mascotas ilimitadas, PDF, compartir ficha
```

### Oportunidades de mejora
- **Trial 7 dias** de Premium
- **Planes anuales** con descuento (definidos en plans.ts pero no expuestos en UI)
- **Planes B2B** en UI (actualmente solo B2C visible)
- **Dashboard de suscripcion** (ver plan actual, proxima facturacion, cancelar)
- **Cupones de descuento**
- **Facturacion** (boleta/factura electronica Chile)

---

## 11. REVIEWS Y RESENAS <a id="11-reviews"></a>

```
Reviews
├── Paginas
│   └── src/pages/DejarResena.tsx                     # Review publica via token
├── Componentes
│   ├── src/components/reviews/
│   │   ├── ReviewForm.tsx                            # Formulario review
│   │   ├── ReviewCard.tsx                            # Card individual
│   │   ├── ReviewsList.tsx                           # Lista reviews
│   │   ├── ReviewSummary.tsx                         # Resumen rating
│   │   └── StarRating.tsx                            # Estrellas
│   ├── src/components/CreateReviewForm.tsx            # Form interno
│   ├── src/components/PendingReviewsList.tsx          # Reviews pendientes
│   └── src/components/EnhancedReviewCard.tsx          # Card mejorada
├── Hooks
│   ├── src/hooks/useReviewInvitations.tsx             # Invitaciones
│   ├── src/hooks/useUserReviews.tsx                   # Reviews del usuario
│   └── src/hooks/usePendingReviews.ts                 # Pendientes (count en Home)
└── Migraciones
    ├── supabase/migrations/20260407000000_review_triggers_and_limits.sql
    ├── supabase/migrations/20260422000003_pending_reviews.sql
    └── supabase/migrations/20260423000003_auto_review_invitation.sql
```

### Flujo end-to-end
```
Trigger automatico:
  → Vet crea nota clinica → trigger crea pending_review
  → (Futuro: email 24h despues con link /resena/:token)

Review manual:
  → /resena/:token → DejarResena
  → Valida token + muestra datos del vet
  → Usuario pone estrellas + comentario
  → INSERT service_reviews → actualiza avg_rating del vet
  → pending_review marcada como completed

Visualizacion:
  → /home: banner "X resenas pendientes"
  → /veterinarios/:slug: lista reviews en perfil publico
```

### Oportunidades de mejora
- **Email automatico** 24h post-consulta con link de review
- **Respuesta del vet** a reviews (actualmente solo lectura)
- **Reviews con fotos** (antes/despues del tratamiento)
- **Filtrar reviews** por tipo de consulta
- **Verificacion** mas fuerte (vincular review a consulta real)

---

## 12. ADOPCION <a id="12-adopcion"></a>

```
Adopcion
├── Paginas
│   └── src/pages/Adoption.tsx                        # Posts de adopcion + refugios
├── Componentes
│   ├── src/components/AdoptionPostCard.tsx             # Card post
│   ├── src/components/CreateAdoptionPost.tsx           # Crear post adopcion
│   ├── src/components/AdoptionSheltersList.tsx         # Lista refugios
│   └── src/components/maps/AdoptionDetailCard.tsx      # Popup mapa
└── Edge Functions
    └── supabase/functions/generate-shelters/           # Generar data refugios
```

### Oportunidades de mejora
- **Filtros** por especie, tamano, edad, comuna
- **Match** automatico segun preferencias del adoptante
- **Seguimiento post-adopcion** (como esta la mascota 1 mes despues)
- **Coordinacion con refugios** reales (API/integración)

---

## 13. SERVICIOS Y RESERVAS <a id="13-servicios"></a>

```
Servicios
├── Paginas
│   ├── src/pages/Servicios.tsx                        # Categorias rapidas
│   ├── src/pages/ServiceDirectory.tsx                 # Directorio por tipo
│   └── src/pages/MyBookings.tsx                       # Mis reservas
├── Componentes
│   ├── src/components/AdvancedServiceFilters.tsx
│   ├── src/components/BookingCalendarView.tsx
│   ├── src/components/ServiceAvailabilityCalendar.tsx
│   ├── src/components/EnhancedBookingDialog.tsx
│   ├── src/components/CreateServicePromotion.tsx
│   ├── src/components/ServicePromotionsList.tsx
│   ├── src/components/MyBookingsHistory.tsx
│   ├── src/components/OfferServiceButton.tsx
│   └── src/components/calendar/
│       ├── BookingModal.tsx
│       ├── CalendarGrid.tsx
│       ├── DaySlotsList.tsx
│       └── SlotCard.tsx
├── Hooks
│   └── src/hooks/useServiceProviders.tsx
├── Tipos de servicio
│   ├── /services/walkers      → Paseadores
│   ├── /services/vets         → Veterinarios
│   ├── /services/sitters      → Cuidadores
│   ├── /services/trainers     → Entrenadores
│   └── /services/groomers     → Peluqueros
└── Edge Functions
    └── supabase/functions/moderate-service-promotion/
```

### Oportunidades de mejora
- **Pago integrado** en la reserva (actualmente solo agenda)
- **Confirmacion automatica** vs manual
- **Cancelacion con politica** (24h antes gratis, etc.)
- **Rating post-servicio** automatico
- **Historial de servicios** por mascota

---

## 14. MAPAS <a id="14-mapas"></a>

```
Mapas
├── Paginas
│   └── src/pages/Maps.tsx                             # Mapa multi-capa
├── Componentes
│   ├── src/components/LostPetsMap.tsx                  # Capa mascotas perdidas
│   └── src/components/maps/
│       ├── MapFilters.tsx                              # Filtros
│       ├── MapPinPopup.tsx                             # Popup base
│       ├── LostPetDetailCard.tsx                       # Popup mascota perdida
│       ├── AdoptionDetailCard.tsx                      # Popup adopcion
│       ├── ServiceDetailCard.tsx                       # Popup servicio
│       └── ShelterDetailCard.tsx                       # Popup refugio
├── Librerias
│   ├── src/lib/leafletConfig.ts                       # Config Leaflet
│   ├── src/lib/distance.ts                            # Calculo distancia
│   └── src/lib/locations.ts                           # Data ubicaciones
└── Dependencias
    └── react-leaflet 4.2.1 + leaflet
```

### Oportunidades de mejora
- **Geolocalizacion** del usuario (mostrar "cerca de mi")
- **Direcciones** con routing (como llegar)
- **Clustering** de pins cuando hay muchos
- **Integrar directorio vets** en mapa (actualmente separados)

---

## 15. ADMIN PANEL <a id="15-admin"></a>

```
Admin (13 tabs)
├── Paginas
│   └── src/pages/Admin.tsx                            # Router admin
├── Componentes
│   ├── src/components/AdminRoute.tsx                   # Guard admin
│   └── src/components/admin/
│       ├── AdminUsers.tsx                              # Gestion usuarios
│       ├── AdminProviders.tsx                          # Gestion proveedores
│       ├── AdminVerificationRequests.tsx               # Cola verificacion Colmevet
│       ├── AdminVetVerifications.tsx                   # Decisiones verificacion
│       ├── AdminModeration.tsx                         # Moderacion contenido
│       ├── AdminMetrics.tsx                            # Metricas y analytics
│       ├── AdminMissions.tsx                           # Editor misiones PawGame
│       ├── AdminRewards.tsx                            # Gestion rewards
│       ├── AdminSafetyLogs.tsx                         # Logs seguridad
│       ├── AdManagement.tsx                            # Ads partners
│       ├── AdminServicePromotions.tsx                  # Moderacion promos
│       ├── AdminServiceProviders.tsx                   # Directorio proveedores
│       └── AdminSettings.tsx                           # Settings admin
└── Hooks
    └── src/hooks/useIsAdmin.tsx                        # Verificacion rol
```

### Oportunidades de mejora
- **Dashboard con graficos** (usuarios activos, retention, revenue)
- **Bulk actions** (verificar multiples vets, banear, etc.)
- **Export** de datos a CSV
- **Logs de auditoria** (quien hizo que y cuando)
- **Notificaciones admin** para eventos criticos

---

## 16. PAW GAME (GAMIFICACION) <a id="16-paw-game"></a>

```
Paw Game
├── Paginas
│   └── src/pages/PawGame.tsx                          # Hub gamificacion
├── Componentes
│   ├── src/components/pawgame/
│   │   ├── MissionCard.tsx                            # Card mision
│   │   ├── PetPawProgress.tsx                         # Progreso por mascota
│   │   ├── GuardianProgress.tsx                       # Nivel guardian
│   │   ├── BadgeGallery.tsx                           # Galeria badges
│   │   └── PawShopRewards.tsx                         # Tienda de rewards
│   ├── src/components/MissionCard.tsx                  # Card generica
│   └── src/components/AchievementBadge.tsx             # Badge
├── Hooks
│   ├── src/hooks/useGamification.tsx                   # Estado gamificacion
│   └── src/hooks/useOrganicRewards.ts                  # Rewards organicos
├── Librerias
│   ├── src/lib/gamification.ts                        # Utilidades
│   ├── src/lib/levels.ts                              # Niveles + XP
│   └── src/lib/points.ts                              # Calculo puntos
└── Migraciones (6)
    ├── 20251202000000_add_gamification_system.sql
    ├── 20260420100000_seed_paw_shop_rewards.sql
    ├── 20260421000001_seed_quality_missions.sql
    ├── 20260421000003_pawgame_level_up_missions.sql
    ├── 20260421000004_seed_better_rewards.sql
    └── 20260422000002_paw_game_monthly_rankings.sql
```

### Oportunidades de mejora
- **Ocultar en primeros 7 dias** (segun plan v1.1, no implementado)
- **Rewards canjeables** con partners reales (petshops, clinicas)
- **Desafios entre amigos**
- **Streaks** mas visibles y motivadores
- **Notificaciones** de misiones completables

---

## 17. GOOGLE CALENDAR <a id="17-google-calendar"></a>

```
Google Calendar
├── Componentes
│   └── src/components/settings/IntegrationsCard.tsx   # UI conexion
├── Librerias
│   └── src/lib/googleCalendar.ts                      # Utilidades Calendar API
├── Edge Functions
│   ├── supabase/functions/google-calendar-oauth-init/  # Iniciar OAuth
│   ├── supabase/functions/google-calendar-callback/    # Callback OAuth
│   ├── supabase/functions/google-calendar-sync/        # Sincronizar eventos
│   └── supabase/functions/google-calendar-disconnect/  # Desconectar
└── Migraciones
    ├── supabase/migrations/20260416000000_whatsapp_and_google_calendar.sql
    └── supabase/migrations/20260417000000_google_email_and_view.sql
```

### Flujo end-to-end
```
/settings → IntegrationsCard → "Conectar Google Calendar"
  → google-calendar-oauth-init → genera URL OAuth
  → Redirige a Google → usuario autoriza
  → Callback → google-calendar-callback → guarda refresh_token
  → Sync: recordatorios de Paw Friend → eventos en Google Calendar
  → Disconnect: revoca tokens
```

### Oportunidades de mejora
- **Sync bidireccional** (eventos de Google → recordatorios Paw Friend)
- **Seleccionar calendario** especifico (actualmente usa el principal)
- **Sync automatico** cuando se crea recordatorio (actualmente manual)

---

## 18. SISTEMA QR <a id="18-qr"></a>

```
QR
├── Paginas
│   └── src/pages/QRLanding.tsx                        # Landing publica /qr/:token
├── Componentes
│   └── src/components/medical/PetQRDisplay.tsx         # Display QR en ficha
├── Generacion
│   └── qrcode.react (libreria)
└── Migraciones
    └── Campo qr_token en tabla pets (20260422000001)
```

### Flujo end-to-end
```
Generacion:
  → Al crear mascota: trigger genera qr_token unico (hex 16 bytes)
  → PetQRDisplay muestra QR con URL pawfriend.cl/qr/:token

Escaneo:
  → /qr/:token → QRLanding.tsx
  → Busca mascota por qr_token
  → Detecta rol del visitante:
     → Vet verificado: registra relacion + muestra ficha completa
     → Dueno: muestra ficha propia
     → Otro: muestra info basica publica
```

### Oportunidades de mejora
- **QR imprimible** con diseno bonito (collar tag, tarjeta)
- **QR dinamico** que muestra info de emergencia (alergias, vet de cabecera)
- **Estadisticas** de escaneos (cuantas veces, quien)
- **QR de emergencia** con datos criticos sin login

---

## 19. ONBOARDING <a id="19-onboarding"></a>

```
Onboarding
├── Paginas
│   ├── src/pages/OnboardingDuenoMinimal.tsx           # Onboarding dueno (1 paso)
│   └── src/pages/OnboardingVetMinimal.tsx             # Onboarding vet (1 paso)
├── Componentes
│   ├── src/components/OnboardingTutorial.tsx           # Tutorial tooltips (skipeable)
│   ├── src/components/HomeOnboardingHints.tsx           # Hints en home
│   └── src/components/onboarding/VaccinationCardOCR.tsx # OCR carnet
```

### Oportunidades de mejora
- **Multi-step wizard** (actualmente es form unico minimal)
- **Tour guiado** del dashboard con tooltips interactivos
- **Video introductorio** de 30 segundos
- **Checklist de completitud** del perfil

---

## 20. PERFIL Y SETTINGS <a id="20-perfil-settings"></a>

```
Perfil & Settings
├── Paginas
│   ├── src/pages/Profile.tsx                          # Editor perfil propio
│   ├── src/pages/UserProfile.tsx                      # Perfil de otro usuario
│   └── src/pages/Settings.tsx                         # Configuracion
├── Componentes
│   └── src/components/settings/IntegrationsCard.tsx   # Integraciones
└── Hooks
    └── src/hooks/useNotifications.tsx                 # Preferencias notificacion
```

### Oportunidades de mejora
- **Eliminar cuenta** (requerido por ley Chile)
- **Exportar mis datos** (GDPR-like)
- **Tema oscuro** — planificado v1.2
- **Idioma** (actualmente solo espanol)

---

## 21. HOME Y LANDING <a id="21-home-landing"></a>

```
Home & Landing
├── Paginas
│   ├── src/pages/Home.tsx                             # Dashboard autenticado
│   └── src/pages/Index.tsx                            # Landing publica
├── Componentes Home
│   ├── src/components/home/StatusCard.tsx              # Cards estado (cita, vacunas, ficha, racha)
│   ├── src/components/home/PriceEstimatorCard.tsx      # Card precios
│   └── src/components/home/WeeklyReportCard.tsx        # Card reporte semanal
├── Componentes Landing
│   ├── src/components/Hero.tsx                         # Hero section
│   ├── src/components/FeatureCard.tsx                  # Features
│   └── src/components/PartnerAd.tsx                    # Ads partners
└── Secciones Home (orden)
    ├── 1. Header (saludo + avatar)
    ├── 2. PawGame widget (puntos + nivel)
    ├── 3. Resenas pendientes banner
    ├── 4. Onboarding hints (si no tiene mascotas)
    ├── 5. Pet switcher (avatares stories)
    ├── 6. Status cards 2x2 (cita, vacunas, ficha, racha)
    ├── 7. Price estimator card
    ├── 8. Weekly report card
    ├── 9. Health alerts (overdue/upcoming reminders)
    ├── 10. Integrations prompt (Google Calendar, WhatsApp)
    ├── 11. Activity feed (3 posts recientes)
    └── 12. Acciones rapidas (reservar vet, ficha, precios, mapa, paw game, agregar)
```

---

## 22. MEMORIAL <a id="22-memorial"></a>

```
Memorial
├── Paginas
│   └── src/pages/EnMemoria.tsx                        # Hub memorial
├── Componentes
│   ├── src/components/memorial/MemorialCard.tsx        # Card memorial
│   ├── src/components/memorial/BereavementChat.tsx     # Chat duelo con IA
│   └── src/components/memorial/MemorialFlow.tsx        # Flujo creacion
├── Edge Functions
│   └── supabase/functions/bereavement-assistant/       # IA duelo
└── Migraciones
    ├── supabase/migrations/20260420000000_memorial_module.sql
    └── supabase/migrations/20260421000002_bereavement_chat_history.sql
```

---

## 23. REPORTES SEMANALES <a id="23-reportes"></a>

```
Reportes
├── Paginas
│   └── src/pages/Reportes.tsx                         # Dashboard reportes
├── Componentes
│   └── src/components/home/WeeklyReportCard.tsx        # Widget en home
├── Edge Functions
│   ├── supabase/functions/generate-weekly-owner-reports/ # Reporte dueno
│   └── supabase/functions/generate-weekly-vet-reports/   # Reporte vet
└── Migraciones
    └── supabase/migrations/20260419000004_reports_infrastructure.sql
```

---

## 24. SEO Y SITEMAP <a id="24-seo"></a>

```
SEO
├── Edge Functions
│   └── supabase/functions/generate-sitemap/            # sitemap.xml
├── Librerias
│   └── src/lib/vetDirectory.ts                         # setSeoTags()
├── Dependencias
│   └── react-helmet-async                              # Meta tags por pagina
└── Paginas con SEO
    ├── DirectorioVets.tsx (meta dinamico por comuna/especialidad)
    ├── PerfilVetPublico.tsx (meta por vet)
    ├── PreciosVeterinarios.tsx (meta por comuna)
    ├── TermsOfService.tsx
    └── PrivacyPolicy.tsx
```

---

## 25. INFRAESTRUCTURA Y LAYOUT <a id="25-infraestructura"></a>

```
Infraestructura
├── Layout
│   ├── src/components/AppLayout.tsx                    # Wrapper principal (sidebar + header + content)
│   ├── src/components/AppSidebar.tsx                   # Sidebar (7 items + provider + admin)
│   ├── src/components/BottomTabBar.tsx                 # Tab bar mobile
│   ├── src/components/Header.tsx                       # Header app
│   ├── src/components/PageHeader.tsx                   # Header por pagina
│   └── src/components/PageSkeleton.tsx                 # Skeleton loading
├── UI Primitivos (shadcn/ui)
│   └── src/components/ui/                              # 50+ componentes (button, card, dialog, etc.)
├── Librerias Core
│   ├── src/lib/analytics.ts                            # Event tracking
│   ├── src/lib/logger.ts                               # Logging
│   ├── src/lib/sentry.ts                               # Error tracking (lazy)
│   ├── src/lib/utils.ts                                # cn(), utilidades
│   ├── src/lib/format.ts                               # Formateo fechas, moneda
│   ├── src/lib/icons.ts                                # Re-export iconos (tree-shake)
│   ├── src/lib/links.ts                                # URLs centralizadas
│   ├── src/lib/featureFlags.ts                         # Feature flags
│   └── src/lib/commissions.ts                          # Calculo comisiones
├── Mobile (Capacitor 7)
│   ├── src/lib/platform.ts                             # isNative, isAndroid, isIOS
│   ├── src/lib/nativeDownload.ts                       # Descarga archivos nativo
│   ├── src/lib/nativeNavigation.ts                     # Links externos InAppBrowser
│   └── capacitor.config.ts                             # Config iOS/Android
├── Navegacion (47 rutas)
│   ├── Publicas: 14 rutas (landing, auth, directorio, legales, QR, review)
│   ├── Protegidas con layout: 22 rutas (home, mascotas, medico, social, etc.)
│   ├── Protegidas sin layout: 9 rutas (chat, pagos, onboarding)
│   └── Redirects: 9 legacy redirects
└── Edge Functions: 22 activas
    └── supabase/functions/_shared/                     # Rate limit, AI base, payment
```

---

## RESUMEN CUANTITATIVO

| Metrica | Valor |
|---|---|
| Paginas (lazy-loaded) | 35+ |
| Componentes custom | 60+ |
| Componentes UI (shadcn) | 50+ |
| Hooks custom | 30+ |
| Edge Functions | 21 (+ `_shared/` helpers) |
| Migraciones SQL | 88 (hasta `20260428000000` + flag `99999999000000`) |
| Rutas totales | 47 |
| Modulos funcionales | 25 |
| Tipos registro medico | 25 |
| Especies soportadas | 8 |
| Especialidades vet | 31 |
| Comunas Santiago | 52 |
| Plantillas consulta | 5 sistema + custom |
| Skills IA | 5 (pet-assistant, medical-suggestions, breed-tips, bereavement, OCR) |

---

## TOP 10 OPORTUNIDADES DE MEJORA (priorizadas)

| # | Mejora | Modulo | Impacto | Esfuerzo |
|---|---|---|---|---|
| 1 | Push notifications nativas (FCM/APNs) | Recordatorios | ALTO | MEDIO |
| 2 | Historial conversaciones IA persistente | IA | ALTO | BAJO |
| 3 | Enviar fotos en chat | Chat | ALTO | MEDIO |
| 4 | Agenda del dia para vets (calendario visual) | Dashboard Vet | ALTO | MEDIO |
| 5 | Trial 7 dias Premium | Pagos | ALTO | BAJO |
| 6 | Mas consultas IA/dia para Premium | IA | MEDIO | BAJO |
| 7 | Chat con vet desde perfil publico | Chat + Directorio | ALTO | MEDIO |
| 8 | Graficos peso/salud en ficha clinica | Ficha Clinica | MEDIO | MEDIO |
| 9 | Eliminar cuenta (requerido legalmente) | Settings | CRITICO | BAJO |
| 10 | Snooze de recordatorios | Recordatorios | MEDIO | BAJO |

---

*Documento generado automaticamente. Verificar contra estado actual del codigo antes de ejecutar cambios.*

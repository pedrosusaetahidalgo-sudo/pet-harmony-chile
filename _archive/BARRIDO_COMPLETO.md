# Barrido completo Paw Friend

> Ejecutar este prompt en una sesion limpia de Claude Code.
> Objetivo: auditoria end-to-end del estado actual del proyecto.

---

## Instrucciones

Realiza un barrido completo del proyecto Paw Friend siguiendo cada seccion en orden. Para cada seccion, reporta hallazgos concretos con archivo y linea. Al final, genera un resumen ejecutivo con prioridades.

**Formato de reporte**: genera un archivo `BARRIDO_RESULTADO_<fecha>.md` en la raiz del repo con todos los hallazgos organizados por seccion.

---

## 1. Salud del build y tipos

1. Ejecuta `npx tsc -b` y reporta todos los errores de tipos.
2. Ejecuta `npm run build` y reporta warnings o errores de Vite.
3. Revisa si hay imports sin usar, variables declaradas sin usar, o `any` explicitos en archivos de `src/`.
4. Verifica que todos los lazy imports en `App.tsx` apunten a archivos que existen.

---

## 2. Consistencia de rutas

1. Extrae todas las rutas definidas en `src/App.tsx`.
2. Busca todos los `<Link to=`, `navigate(`, `useNavigate()` en el proyecto.
3. Identifica links rotos: rutas referenciadas en el codigo que no estan definidas en App.tsx.
4. Identifica rutas huerfanas: definidas en App.tsx pero sin ningun link que apunte a ellas.

---

## 3. Supabase: esquema vs codigo

1. Lee todas las migraciones en `supabase/migrations/` en orden cronologico.
2. Extrae la lista completa de tablas, columnas y relaciones que deberian existir.
3. Lee `src/integrations/supabase/types.ts` y compara contra las migraciones.
4. Busca todas las queries a Supabase en `src/` (`.from(`, `.rpc(`, `.select(`).
5. Identifica:
   - Tablas/columnas referenciadas en el codigo que no existen en migraciones.
   - Tablas creadas en migraciones que nunca se usan en el codigo.
   - Tipos desactualizados en `types.ts` vs migraciones.
   - Queries con columnas que no coinciden con el esquema.

---

## 4. Row Level Security (RLS)

1. Extrae todas las politicas RLS de las migraciones.
2. Para cada tabla con datos sensibles (profiles, pets, medical_records, conversations, messages, payments):
   - Verifica que tenga RLS habilitado.
   - Verifica que las politicas SELECT/INSERT/UPDATE/DELETE sean correctas.
   - Identifica tablas sin RLS o con politicas demasiado permisivas (ej: `USING (true)` en tablas con datos privados).
3. Verifica que no haya tablas nuevas sin `ENABLE ROW LEVEL SECURITY`.

---

## 5. Autenticacion y rutas protegidas

1. Revisa el componente `ProtectedRoute` y como se aplica.
2. Verifica que todas las rutas que deberian ser protegidas lo esten.
3. Busca llamadas a Supabase que asuman `user` sin verificar null.
4. Revisa el flujo de auth: login, registro, logout, recuperacion de contrasena.
5. Identifica paginas que muestran datos sin verificar permisos del usuario.

---

## 6. Edge Functions

1. Lee cada Edge Function en `supabase/functions/`.
2. Verifica:
   - Que tengan validacion de input.
   - Que manejen errores correctamente (no swallow errors).
   - Que las que requieren auth verifiquen el JWT.
   - Que no haya secrets hardcodeados.
   - Que los CORS headers esten configurados.
3. Verifica consistencia entre lo que el frontend espera y lo que la funcion retorna.

---

## 7. Estado de features criticas

### 7.1 Ficha medica PDF
- Verifica el flujo completo: crear registro medico -> generar PDF -> descargar.
- Revisa que los datos del PDF coincidan con los campos del formulario.
- Identifica edge cases no manejados (mascota sin datos, campos vacios).

### 7.2 Directorio de veterinarios
- Verifica que el directorio publico funcione sin auth.
- Revisa filtros por comuna y especialidad.
- Verifica que los perfiles de vets carguen correctamente.

### 7.3 Pagos Flow.cl
- Revisa el flujo: seleccionar plan -> crear suscripcion -> webhook -> activar plan.
- Verifica idempotencia en el webhook.
- Identifica race conditions o estados inconsistentes.

### 7.4 Google Calendar
- Revisa el flujo OAuth completo.
- Verifica que la sincronizacion de eventos funcione.

---

## 8. Performance y bundle

1. Revisa la configuracion de vendor splitting en `vite.config.ts`.
2. Identifica imports pesados que no esten lazy-loaded.
3. Busca componentes que hagan fetches innecesarios (queries sin `enabled`, re-fetches en cada render).
4. Revisa si hay imagenes grandes sin optimizar en `src/assets/` o referenciadas externamente.
5. Busca `console.log` o `console.error` que deberian eliminarse en produccion.

---

## 9. UX y copy

1. Busca textos en ingles que deberian estar en espanol.
2. Busca voseo argentino (vos, tenes, podes) que deberia ser tuteo chileno (tu, tienes, puedes).
3. Identifica toasts o mensajes de error genericos que no ayudan al usuario.
4. Busca estados de carga (loading) sin feedback visual.
5. Busca estados vacios (empty states) sin mensaje orientador.

---

## 10. Mobile / Capacitor

1. Revisa `capacitor.config.ts` y verifica coherencia con el proyecto.
2. Busca usos de APIs web que no funcionan en mobile (ej: `window.location` directo, `localStorage` sin fallback).
3. Verifica que los deep links esten configurados.
4. Revisa si hay estilos que se rompen en mobile (viewport, safe areas, notch).

---

## 11. Seguridad general

1. Busca API keys, tokens o secrets en el codigo fuente (excluyendo `.env`).
2. Revisa que `.env` y archivos sensibles esten en `.gitignore`.
3. Busca vulnerabilidades XSS: `dangerouslySetInnerHTML`, inputs sin sanitizar.
4. Busca SQL injection en queries raw.
5. Verifica que no haya endpoints sin rate limiting que deberian tenerlo.
6. Busca dependencias con vulnerabilidades conocidas (`npm audit`).

---

## 12. Codigo muerto y deuda tecnica

1. Busca archivos en `src/` que no se importen desde ningun otro archivo.
2. Busca funciones y hooks exportados que nunca se usen.
3. Busca componentes comentados o bloques de codigo comentados grandes.
4. Identifica TODO/FIXME/HACK en el codigo.
5. Busca duplicacion de logica entre archivos.

---

## 13. Migraciones SQL pendientes o problematicas

1. Verifica que las migraciones sean idempotentes donde sea posible (`IF NOT EXISTS`, `DO $$ ... EXCEPTION`).
2. Busca migraciones que hagan DROP sin respaldo.
3. Verifica que no haya migraciones que conflicten entre si (misma tabla, misma columna).
4. Identifica migraciones que crean datos demo/test que deberian limpiarse.

---

## 14. Flujos sin salida y callejones sin retorno

Objetivo: identificar pantallas, botones o flujos donde el usuario queda atrapado, sin CTA claro, sin navegacion de vuelta, o sin proposito final.

### 14.1 Deteccion de callejones sin salida
1. Para cada pagina en `src/pages/`, verifica:
   - Que tenga al menos un CTA o accion primaria visible.
   - Que tenga navegacion de vuelta (boton atras, breadcrumb, link, o sidebar).
   - Que los estados vacios (sin datos) ofrezcan un camino al usuario (ej: "Agrega tu primera mascota").
   - Que los estados de exito (ej: pago completado) redirijan o den un siguiente paso claro.
   - Que los estados de error den opciones (reintentar, volver, contactar soporte).
2. Identifica botones o links que no llevan a ninguna parte (`onClick` vacio, `href="#"`, `to=""`, funciones stub).
3. Busca modales o dialogs que se abren pero no tienen forma de cerrarse o confirmar.
4. Busca formularios sin feedback post-submit (ni toast, ni redirect, ni estado de exito).

### 14.2 Flujos incompletos
1. Revisa los siguientes flujos end-to-end y marca donde se cortan:
   - **Registro dueno** → onboarding → agregar mascota → dashboard. Hay pasos que se saltan o quedan en el aire?
   - **Registro vet** → onboarding vet → dashboard proveedor. Llega al final?
   - **Agregar mascota** → ver en lista → ver ficha clinica → agregar registro medico → generar PDF. Todos los pasos conectan?
   - **Buscar servicio** → ver proveedor → reservar → ver reserva. Hay cortes?
   - **Upgrade a Premium** → pago Flow → webhook → plan activo → features premium desbloqueadas. Funciona el loop completo?
   - **Feed social** → crear post → interactuar → seguir usuario → ver perfil. Todo conecta?
   - **Chat** → iniciar conversacion → enviar mensaje → recibir respuesta. Hay dead ends?
   - **Paw Game** → ganar puntos → ver ranking → achievements. Es un ciclo o se corta?
   - **Adopcion** → ver posts → contactar → (que pasa despues?).
   - **Mapa** → ver servicios → seleccionar → (lleva al perfil del proveedor?).
2. Para cada flujo, reporta:
   - Paso exacto donde se corta o no hay siguiente accion.
   - Archivo y linea del componente responsable.
   - Sugerencia de conexion (si aplica).

### 14.3 Funciones y componentes sin proposito conectado
1. Busca componentes que se renderizan pero cuyo output no produce ninguna accion util (ej: un widget decorativo que no lleva a nada).
2. Busca hooks que fetchean datos que ningun componente consume.
3. Busca Edge Functions que el frontend nunca invoca.
4. Busca tablas en migraciones que ningun query lee ni escribe.

---

## 15. Checklist completo: que existe y para que

Genera una tabla exhaustiva de TODA la app. Para cada elemento, evalua:
- **Proposito**: para que existe, que problema resuelve.
- **Estado**: funcional / parcial / stub / muerto.
- **Veredicto**: se queda / se mejora / se elimina / se fusiona con otro.

### 15.1 Paginas (src/pages/)

Evalua cada una de las 42 paginas:

| Pagina | Proposito esperado | Estado real | Conectada a flujo? | Veredicto |
|---|---|---|---|---|
| Index.tsx | Landing publica, captar usuarios | ? | ? | ? |
| Auth.tsx | Login y registro | ? | ? | ? |
| Home.tsx | Dashboard principal post-login | ? | ? | ? |
| Feed.tsx | Feed social, posts de la comunidad | ? | ? | ? |
| MyPets.tsx | Lista de mascotas del usuario | ? | ? | ? |
| AddPet.tsx | Crear/editar mascota | ? | ? | ? |
| MedicalRecords.tsx | Registros medicos de mascotas | ? | ? | ? |
| Reminders.tsx | Recordatorios (vacunas, citas, etc) | ? | ? | ? |
| Adoption.tsx | Feed de adopcion | ? | ? | ? |
| PawGame.tsx | Mini-juego gamificacion | ? | ? | ? |
| Servicios.tsx | Directorio de servicios por tipo | ? | ? | ? |
| ServiceDirectory.tsx | Lista de proveedores por tipo | ? | ? | ? |
| Maps.tsx | Mapa Leaflet de servicios | ? | ? | ? |
| Chat.tsx | Lista de conversaciones | ? | ? | ? |
| ChatConversation.tsx | Conversacion individual | ? | ? | ? |
| Profile.tsx | Mi perfil | ? | ? | ? |
| UserProfile.tsx | Perfil de otro usuario | ? | ? | ? |
| Settings.tsx | Configuracion de la cuenta | ? | ? | ? |
| Upgrade.tsx | Pantalla upgrade a Premium | ? | ? | ? |
| UpgradeSuccess.tsx | Confirmacion upgrade exitoso | ? | ? | ? |
| UpgradeCancel.tsx | Upgrade cancelado | ? | ? | ? |
| PaymentResult.tsx | Resultado del pago Flow | ? | ? | ? |
| MyBookings.tsx | Mis reservas de servicios | ? | ? | ? |
| DirectorioVets.tsx | Directorio publico de vets | ? | ? | ? |
| PerfilVetPublico.tsx | Perfil publico de un vet | ? | ? | ? |
| PreciosVeterinarios.tsx | Estimador de precios por comuna | ? | ? | ? |
| ParaVeterinarios.tsx | Landing B2B para vets | ? | ? | ? |
| RegistroVeterinario.tsx | Registro de vet nuevo | ? | ? | ? |
| ProviderProfileEdit.tsx | Editar perfil de proveedor | ? | ? | ? |
| GroomerProfileEdit.tsx | Editar perfil de peluquero | ? | ? | ? |
| Demo.tsx | Demo en vivo para ventas | ? | ? | ? |
| Admin.tsx | Panel de administracion | ? | ? | ? |
| DejarResena.tsx | Dejar resena publica via token | ? | ? | ? |
| QRLanding.tsx | Landing desde escaneo de QR | ? | ? | ? |
| OnboardingDuenoMinimal.tsx | Onboarding post-registro dueno | ? | ? | ? |
| OnboardingVetMinimal.tsx | Onboarding post-registro vet | ? | ? | ? |
| Reportes.tsx | Reportes para proveedores | ? | ? | ? |
| Actividad.tsx | (posible redirect a /feed) | ? | ? | ? |
| EnMemoria.tsx | Memorial de mascotas fallecidas | ? | ? | ? |
| TermsOfService.tsx | Terminos legales | ? | ? | ? |
| PrivacyPolicy.tsx | Politica de privacidad | ? | ? | ? |
| NotFound.tsx | 404 | ? | ? | ? |

Llena cada `?` leyendo el archivo real.

### 15.2 Componentes principales (src/components/ sin ui/)

Evalua cada componente top-level y cada subdirectorio:

| Componente / Grupo | Proposito | Usado por | Estado | Veredicto |
|---|---|---|---|---|
| AppLayout.tsx | Layout principal (sidebar + header) | Todas las paginas protegidas | ? | ? |
| ProtectedRoute.tsx | Gate de autenticacion | App.tsx | ? | ? |
| AdminRoute.tsx | Gate de admin | App.tsx | ? | ? |
| ErrorBoundary.tsx | Captura errores React | App.tsx | ? | ? |
| Header.tsx | Header superior | ? | ? | ? |
| AppSidebar.tsx | Sidebar navegacion | ? | ? | ? |
| BottomTabBar.tsx | Tabs mobile inferior | ? | ? | ? |
| PublicHeader.tsx | Header para paginas publicas | ? | ? | ? |
| Hero.tsx | Hero de la landing | ? | ? | ? |
| LegalFooter.tsx | Footer legal | ? | ? | ? |
| PageHeader.tsx | Header generico de pagina | ? | ? | ? |
| Breadcrumbs.tsx | Breadcrumbs de navegacion | ? | ? | ? |
| PageSkeleton.tsx | Skeleton de carga | ? | ? | ? |
| EmptyState.tsx | Estado vacio generico | ? | ? | ? |
| LazyImage.tsx | Imagen con lazy loading | ? | ? | ? |
| DateTimePicker.tsx | Selector de fecha/hora | ? | ? | ? |
| PetCard.tsx | Tarjeta de mascota | ? | ? | ? |
| PetProfileCard.tsx | Tarjeta perfil de mascota | ? | ? | ? |
| AddMedicalRecord.tsx | Form agregar registro medico | ? | ? | ? |
| CreatePost.tsx | Form crear post social | ? | ? | ? |
| PostComments.tsx | Comentarios de un post | ? | ? | ? |
| FollowButton.tsx | Boton seguir usuario | ? | ? | ? |
| BlockUserButton.tsx | Boton bloquear usuario | ? | ? | ? |
| ReportUserDialog.tsx | Dialog reportar usuario | ? | ? | ? |
| CreateReviewForm.tsx | Form crear resena | ? | ? | ? |
| EnhancedReviewCard.tsx | Card de resena | ? | ? | ? |
| ServiceReviewsSection.tsx | Seccion resenas de servicio | ? | ? | ? |
| PendingReviewsList.tsx | Lista de resenas pendientes | ? | ? | ? |
| ProviderProfileCard.tsx | Card de perfil proveedor | ? | ? | ? |
| ProviderRatingSummary.tsx | Resumen rating proveedor | ? | ? | ? |
| ProviderAvailabilityManager.tsx | Gestionar disponibilidad | ? | ? | ? |
| TopRatedProviders.tsx | Top proveedores destacados | ? | ? | ? |
| EnhancedBookingDialog.tsx | Dialog de reserva | ? | ? | ? |
| BookingCalendarView.tsx | Vista calendario reservas | ? | ? | ? |
| ServiceAvailabilityCalendar.tsx | Calendario disponibilidad | ? | ? | ? |
| AdvancedServiceFilters.tsx | Filtros avanzados servicios | ? | ? | ? |
| CreateServicePromotion.tsx | Crear promocion de servicio | ? | ? | ? |
| ServicePromotionsList.tsx | Lista de promociones | ? | ? | ? |
| OfferServiceButton.tsx | Boton ofrecer servicio | ? | ? | ? |
| RequestRoleVerification.tsx | Solicitar verificacion de rol | ? | ? | ? |
| VerificationBadge.tsx | Badge de verificacion | ? | ? | ? |
| ProfessionalBadges.tsx | Badges profesionales | ? | ? | ? |
| TrustBadge.tsx | Badge de confianza | ? | ? | ? |
| AchievementBadge.tsx | Badge de logro | ? | ? | ? |
| MissionCard.tsx | Card de mision (gamificacion) | ? | ? | ? |
| PointsWidget.tsx | Widget de puntos | ? | ? | ? |
| FeatureCard.tsx | Card de feature (landing) | ? | ? | ? |
| BreedTips.tsx | Tips por raza (IA) | ? | ? | ? |
| AdoptionPostCard.tsx | Card de post adopcion | ? | ? | ? |
| AdoptionSheltersList.tsx | Lista de refugios | ? | ? | ? |
| CreateAdoptionPost.tsx | Crear post adopcion | ? | ? | ? |
| LostPetsMap.tsx | Mapa mascotas perdidas | ? | ? | ? |
| ReportLostPetForm.tsx | Form reportar mascota perdida | ? | ? | ? |
| PartnerAd.tsx | Anuncio de partner | ? | ? | ? |
| PriceEstimatorWidget.tsx | Widget estimador precios | ? | ? | ? |
| GoogleSignInButton.tsx | Boton login Google | ? | ? | ? |
| HomeOnboardingHints.tsx | Hints onboarding en home | ? | ? | ? |
| OnboardingTutorial.tsx | Tutorial onboarding | ? | ? | ? |
| MyBookingsHistory.tsx | Historial de reservas | ? | ? | ? |
| NavLink.tsx | Link de navegacion | ? | ? | ? |
| UserReviewHistory.tsx | Historial resenas usuario | ? | ? | ? |

Para cada grupo en subdirectorios (`admin/`, `ai/`, `calendar/`, `home/`, `maps/`, `medical/`, `memorial/`, `onboarding/`, `pawgame/`, `provider/`, `reviews/`, `settings/`, `social/`), lee los archivos y evalua igual.

### 15.3 Hooks (src/hooks/)

| Hook | Proposito | Usado por | Estado | Veredicto |
|---|---|---|---|---|
| useAuth.tsx | Autenticacion y sesion | Global | ? | ? |
| usePlan.tsx | Plan actual del usuario (free/premium) | Upgrade, gates | ? | ? |
| use-mobile.tsx | Detectar mobile | Layout | ? | ? |
| use-toast.ts | Toasts (shadcn) | Global | ? | ? |
| useMedicalRecords.tsx | CRUD registros medicos | MedicalRecords, ficha | ? | ? |
| useMedicalDocuments.tsx | Documentos medicos | Medical | ? | ? |
| useMedicalSharing.tsx | Compartir ficha medica | Medical | ? | ? |
| useReminders.tsx | CRUD recordatorios | Reminders | ? | ? |
| useNotifications.tsx | Notificaciones | Global | ? | ? |
| useServiceProviders.tsx | Proveedores de servicios | ServiceDirectory | ? | ? |
| useDirectoryVets.tsx | Directorio veterinarios | DirectorioVets | ? | ? |
| useProviderProfile.tsx | Perfil proveedor | Provider pages | ? | ? |
| useGroomerProfile.tsx | Perfil peluquero | GroomerProfileEdit | ? | ? |
| useFollows.tsx | Seguir/dejar de seguir | Social | ? | ? |
| useBlockedUsers.tsx | Usuarios bloqueados | Social | ? | ? |
| useUserReviews.tsx | Resenas de usuario | Reviews | ? | ? |
| useReviewInvitations.tsx | Invitaciones a resenar | Reviews | ? | ? |
| usePendingReviews.ts | Resenas pendientes | Reviews | ? | ? |
| useGamification.tsx | Puntos y logros | PawGame, Home | ? | ? |
| useOrganicRewards.ts | Rewards organicos | Gamification | ? | ? |
| useCanAddPet.ts | Gate: puede agregar mascota? | AddPet | ? | ? |
| useIsAdmin.tsx | Es admin? | AdminRoute | ? | ? |
| useDemoMode.ts | Modo demo | Demo | ? | ? |
| useStartConversation.tsx | Iniciar chat | Chat | ? | ? |
| useGoogleAuth.tsx | Auth Google | Auth | ? | ? |
| useFacebookAuth.tsx | Auth Facebook | Auth | ? | ? |
| useAISkill.ts | Skill IA (tips) | AI components | ? | ? |
| useVetPriceEstimator.ts | Estimador precios vet | PreciosVeterinarios | ? | ? |
| useAdoptionShelters.tsx | Refugios adopcion | Adoption | ? | ? |
| useVetClinicalNotes.ts | Notas clinicas vet | Provider | ? | ? |
| useConsultationTemplates.ts | Plantillas consulta vet | Provider | ? | ? |

Llena cada `?` verificando imports reales.

### 15.4 Librerias y utilidades (src/lib/)

| Archivo | Proposito | Usado por | Estado | Veredicto |
|---|---|---|---|---|
| utils.ts | cn() y utilidades generales | Global | ? | ? |
| logger.ts | Logging | ? | ? | ? |
| sentry.ts | Integracion Sentry | ? | ? | ? |
| analytics.ts | Analytics/tracking | ? | ? | ? |
| format.ts | Formateo de datos | ? | ? | ? |
| distance.ts | Calculo distancias geo | Maps | ? | ? |
| icons.ts | Mapa de iconos | ? | ? | ? |
| featureFlags.ts | Feature flags | ? | ? | ? |
| plans.ts | Definicion de planes/pricing | Upgrade, gates | ? | ? |
| points.ts | Sistema de puntos | Gamification | ? | ? |
| gamification.ts | Logica gamificacion | PawGame | ? | ? |
| levels.ts | Niveles de gamificacion | PawGame | ? | ? |
| commissions.ts | Comisiones B2B | Provider | ? | ? |
| design-tokens.ts | Tokens de diseno | Estilos | ? | ? |
| leafletConfig.ts | Config Leaflet | Maps | ? | ? |
| locations.ts | Datos de ubicaciones/comunas | Filtros | ? | ? |
| googleCalendar.ts | Helpers Google Calendar | Calendar | ? | ? |
| links.ts | URLs y links externos | ? | ? | ? |
| routing.ts | Helpers de routing | ? | ? | ? |
| supabaseErrors.ts | Mapeo errores Supabase | ? | ? | ? |
| vetDirectory.ts | Helpers directorio vets | DirectorioVets | ? | ? |
| medicalRecordTypes.ts | Tipos registros medicos | Medical | ? | ? |
| breeds.ts | Data de razas | AddPet, tips | ? | ? |
| vaccines.ts | Data de vacunas | Medical, reminders | ? | ? |
| reminderTypes.ts | Tipos de recordatorios | Reminders | ? | ? |
| postTypes.ts | Tipos de posts | Feed | ? | ? |

### 15.5 Edge Functions (supabase/functions/)

| Funcion | Proposito | Invocada desde frontend? | Estado | Veredicto |
|---|---|---|---|---|
| breed-tips/ | Tips IA por raza | ? | ? | ? |
| flow-create-subscription/ | Crear suscripcion Flow.cl | ? | ? | ? |
| flow-webhook/ | Webhook pagos Flow | ? | ? | ? |
| generate-medical-summary/ | PDF ficha medica | ? | ? | ? |
| generate-medical-zip/ | ZIP documentos medicos | ? | ? | ? |
| generate-shelters/ | Generar data refugios | ? | ? | ? |
| generate-sitemap/ | Sitemap SEO | ? | ? | ? |
| google-calendar-callback/ | OAuth callback | ? | ? | ? |
| google-calendar-disconnect/ | Desconectar calendar | ? | ? | ? |
| google-calendar-oauth-init/ | Iniciar OAuth | ? | ? | ? |
| google-calendar-sync/ | Sync eventos | ? | ? | ? |
| medical-suggestions/ | Sugerencias medicas IA | ? | ? | ? |
| moderate-service-promotion/ | Moderacion promociones | ? | ? | ? |
| pet-assistant/ | Asistente IA mascotas | ? | ? | ? |
| reminder-cron/ | Cron recordatorios | ? | ? | ? |
| send-whatsapp-reminder/ | WhatsApp reminders | ? | ? | ? |

### 15.6 Migraciones SQL (supabase/migrations/)

1. Lee todas las migraciones y genera una lista de tablas con su proposito.
2. Identifica tablas que no se usan desde el frontend.
3. Identifica tablas duplicadas o redundantes.

---

## 16. Categorizacion por importancia

Clasifica TODOS los modulos del proyecto en las siguientes categorias. Un modulo puede ser una pagina, componente, hook, lib, edge function o tabla.

### Categoria CORE (sin esto la app no existe)
> Funcionalidades que definen el producto y sin las cuales Paw Friend no tiene razon de ser.

Esperados: auth, mascotas CRUD, ficha medica/PDF, directorio vets, dashboard home.

Lista cada modulo CORE con:
- Archivo(s) involucrado(s)
- Dependencias directas
- Estado: completo / parcial / roto

### Categoria REVENUE (genera o habilita ingresos)
> Todo lo relacionado con monetizacion: planes, pagos, suscripciones, comisiones.

Esperados: upgrade, Flow.cl, plans, commissions, provider dashboard.

### Categoria ENGAGEMENT (retiene usuarios)
> Features que hacen que el usuario vuelva: feed social, gamificacion, recordatorios, chat.

Para cada modulo de engagement, evalua:
- Tiene loop completo? (accion → feedback → motivacion para volver)
- O es un callejon sin salida?

### Categoria GROWTH (atrae usuarios nuevos)
> SEO, landing pages, directorio publico, QR, compartir ficha.

### Categoria ADMIN/OPS (operacion interna)
> Admin panel, demo, reportes, moderacion.

### Categoria SOPORTE (infraestructura tecnica)
> Layouts, UI primitivos, hooks de utilidad, configs, error handling.

### Categoria EXPERIMENTAL/STUB (existe pero no aporta valor aun)
> Features a medio hacer, paginas placeholder, hooks sin uso, tablas vacias.

Para esta categoria, recomendar explicitamente:
- **Completar**: si esta cerca de ser util.
- **Eliminar**: si es codigo muerto.
- **Congelar**: si tiene potencial futuro pero no es prioridad ahora.

---

## 17. Mapa de dependencias criticas

Genera un diagrama textual (formato arbol o lista) que muestre:

1. **Flujos principales** y que modulos dependen de cuales:
```
Auth → Home → MyPets → AddPet → MedicalRecords → PDF
                    ↘ Reminders
                    ↘ Feed → CreatePost → PostComments
                    ↘ PawGame → Achievements
```

2. **Modulos isla** (no conectados a ningun flujo principal).
3. **Single points of failure** (modulos de los que depende todo pero que no tienen fallback).

---

## Resumen ejecutivo

Al finalizar, genera una seccion de resumen con:

1. **Criticos** (bloquean produccion o son vulnerabilidades): listar con archivo y linea.
2. **Importantes** (bugs o inconsistencias que afectan UX): listar con archivo y linea.
3. **Mejoras** (tech debt, optimizaciones): listar brevemente.
4. **Metricas**: errores tsc, warnings build, archivos muertos, TODO count, npm audit.

---

*Generado para uso con Claude Code. No editar manualmente — regenerar si el proyecto cambia significativamente.*

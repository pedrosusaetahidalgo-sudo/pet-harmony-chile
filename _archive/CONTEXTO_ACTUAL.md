# PAW FRIEND - Estado actual del proyecto
## Fecha: 02/04/2026 | pawfriend.cl

---

## STACK
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (50+ componentes)
- React Query (staleTime 5min, retry 1, no refetch on focus)
- React Router v6 (40+ rutas, lazy loading)
- Supabase (PostgreSQL + Auth + Storage + 11 Edge Functions)
- Claude API (Anthropic) para IA
- Webpay Plus (Transbank Chile - simulado)
- Capacitor (iOS/Android)
- GitHub Pages (docs/) con dominio pawfriend.cl
- Chunk splitting: react-vendor, query-vendor, ui-vendor (bundle 366KB)

## REPOSITORIO
- github.com/pedrosusaetahidalgo-sudo/pet-harmony-chile
- Branch: main
- Supabase project ref: gwailbjlvevkhwcrovfd

---

## QUÉ FUNCIONA HOY

### Auth
- Login email/password, Google OAuth
- "¿Olvidaste tu contraseña?" con resetPasswordForEmail
- Nuevos usuarios sin mascotas → redirect a /add-pet
- Usuarios existentes → redirect a /home
- Email confirmation configurable (actualmente OFF)

### Sidebar
- Siempre abierto en desktop (200px, compact, texto + iconos)
- Offcanvas en mobile (hamburguesa en header)
- Sticky top-0 h-screen, scroll independiente
- Logo clickable → Home
- Sin toggle expand/collapse en desktop
- Iconos h-3.5, items h-8, text-xs

### Header
- Logo Paw Friend clickable
- Campanita → popover de notificaciones (sin punto rojo si vacío)
- Mensajes → popover con count de no leídos
- Avatar/nombre/nivel → navega a /home
- SidebarTrigger solo visible en mobile (md:hidden)
- Avatar muestra imagen seleccionada de Settings

### Ficha Clínica (/pet/:petId/clinical)
- 5 tabs: Resumen, Historial, Hábitos, Documentos, Compartir
- 25 campos clínicos en tabla pets (alergias, medicamentos, dieta, etc.)
- PDF profesional HTML con logo SVG, márgenes 24mm, centrado A4
- Selector de mascotas si tiene más de 1
- Privacidad: solo owner puede ver
- Botones "Editar datos clínicos" en tabs
- Formulario de recordatorios (vacuna, checkup, medicamento, etc.)
- Tab "Compartir" con PremiumGate

### Mascotas
- AddPet con sección médica colapsable
- Auto-crea 3 recordatorios al agregar mascota (checkup 90d, vacuna 30d, grooming mensual)
- Ficha clínica accesible desde MyPets
- Toggle esterilizado/adoptado
- Analytics: PET_CREATED event

### Gamification (Paw Game)
- Daily streak con check-in (botón + barra semanal L-D)
- +5pts por día de racha (max +50)
- Milestones: 7 días (+25 bonus), 30 días (+100 bonus)
- 10 tiers de nivel con colores e íconos únicos
- Puntos se sincronizan en profiles.points Y user_guardian_progress
- Misiones, badges, tienda de recompensas
- Analytics: STREAK_CLAIMED event

### Settings
- Edición de perfil real (nombre, bio, ubicación)
- 10 avatares seleccionables × 6 colores (DiceBear thumbs + paleta morada)
- Barra de progreso de completación (X% completo)
- Switches de notificaciones (UI, no persistidos)
- Sign out con redirect a /auth

### Premium
- $3.990/mes o $39.900/año
- PremiumGate component (blur + upgrade prompt)
- Aplicado en tab "Compartir" de ficha clínica
- Banner flotante en Home (fixed bottom, dismissible con X, sessionStorage)
- Analytics: PREMIUM_VIEWED, PREMIUM_CONVERTED events

### Feed Social
- Posts con fotos, likes, comentarios
- Tabs: Mascotas, Ranking, Siguiendo
- Posts del feed mostrados arriba de los tabs
- Empty state "Siguiendo" con CTA "Explorar Mascotas"
- Usuarios demo con 8 posts seed

### Recordatorios
- Hook useReminders con React Query
- Home muestra alertas: vencidos (rojo), próximos (normal)
- Completar con botón check
- Auto-creados al agregar mascota

### Onboarding
- 4 pasos (Welcome, Add Pet, Services, Rewards)
- CTAs de acción: "Agregar mi mascota ahora", "Explorar servicios"
- Cierra tutorial Y navega a la acción
- localStorage persistence

### Profile
- Botón "Compartir" (Web Share API + clipboard)
- Stats: posts, followers, following, pets
- Tabs: Posts, Pets, Reviews, Achievements, Services

### Edge Functions (11 deployadas)
- analyze-dog-behavior (Claude vision)
- breed-tips (Claude)
- medical-suggestions (Claude)
- moderate-service-promotion (Claude)
- generate-shelters (Claude)
- generate-places (Claude)
- generate-medical-summary (PDF)
- generate-medical-zip
- get-google-maps-key
- webpay-init (simulado)
- webpay-confirm (simulado)

### Otros
- ErrorBoundary global con mensaje de error
- 404.html para SPA routing en GitHub Pages
- CNAME: pawfriend.cl
- Favicon SVG (corazón blanco en cuadrado morado)
- TrustBadge component (verified, top_rated, responsive)
- Analytics foundation (40+ eventos, track() function, console en dev)

---

## BASE DE DATOS

### Tablas principales (68 total)
- profiles (points, level, is_premium, avatar_url, display_name, bio, location)
- pets (25+ campos clínicos)
- medical_records, medical_documents, medical_share_tokens
- pet_reminders (vaccine, checkup, medication, grooming, weight, custom)
- posts, post_likes, post_comments
- user_follows, user_blocks
- service_providers, provider_service_offerings
- walk_bookings, dogsitter_bookings, training_bookings, vet_bookings
- conversations, messages
- adoption_posts, adoption_shelters
- paw_missions, paw_badges, user_guardian_progress
- orders, order_items, cart_items, subscriptions
- places, lost_pets, shared_walks

### Seed data
- 8 usuarios demo (password: demo1234) - camila.silva@demo.cl, etc.
- 17 mascotas con fotos Unsplash
- 8 posts en feed

### RLS
- Todas las tablas con RLS
- Políticas: profiles/pets/posts visibles para authenticated
- Medical records solo owner
- Follows visibles para todos

---

## QUÉ QUEDÓ PENDIENTE

### Alta prioridad
- Push notifications (Firebase/OneSignal) para recordatorios
- Email sequence post-signup (Supabase cron o Resend)
- Webpay real (actualmente simulado)
- Unificar 4 páginas de servicios en 1 componente genérico
- Aplicar TrustBadge en cards de proveedores

### Media prioridad
- Integrar analytics real (Mixpanel/PostHog) - foundation lista
- Google Maps API funcional (necesita billing en Google Cloud)
- Perfil de veterinario con credenciales
- Marketplace de tiendas pet
- N+1 queries en useUserReviews y CartContext

### Baja prioridad
- Dark mode (variables CSS definidas pero sin ThemeProvider)
- i18n (todo en español hardcoded)
- Tests (0 tests escritos)
- 14 instancias de `as any` en código
- ~35 console.log en producción

---

## ARQUITECTURA DE ARCHIVOS CLAVE

```
src/
├── App.tsx              # Router + QueryClient + ErrorBoundary
├── index.css            # Design system (paleta morada, sombras, animaciones)
├── components/
│   ├── AppSidebar.tsx   # Sidebar siempre abierto 200px
│   ├── AppLayout.tsx    # Layout con sidebar sticky
│   ├── Header.tsx       # Header con popovers
│   ├── ErrorBoundary.tsx
│   ├── PremiumGate.tsx  # Blur + upgrade prompt
│   ├── TrustBadge.tsx   # Verified/TopRated/Responsive
│   ├── Hero.tsx         # Landing page hero
│   └── OnboardingTutorial.tsx
├── hooks/
│   ├── useAuth.tsx
│   ├── useReminders.tsx
│   ├── useGamification.tsx
│   ├── useServiceProviders.tsx
│   └── [12 más]
├── pages/
│   ├── Home.tsx         # Dashboard + gamification + reminders + premium banner
│   ├── Auth.tsx         # Login/signup + forgot password + redirect logic
│   ├── PetClinicalRecord.tsx  # Ficha clínica 5 tabs + PDF
│   ├── PawGame.tsx      # Streaks + missions + badges + shop
│   ├── AddPet.tsx       # Formulario + auto-reminders + analytics
│   ├── Settings.tsx     # Profile edit + avatars + progress bar
│   ├── Feed.tsx         # Social feed + tabs
│   ├── Premium.tsx      # Plans + analytics
│   └── [24 más]
├── lib/
│   ├── analytics.ts     # Event tracking foundation
│   └── utils.ts
└── integrations/supabase/
    ├── client.ts
    └── types.ts         # 3700 líneas auto-generadas
```

---

## DESIGN SYSTEM

- Primary: 270° 70% 60% (morado)
- Secondary: 280° 55% 70% (rosa-morado)
- Background: 270° 20% 98% (off-white)
- Foreground: 270° 15% 10% (casi negro)
- Radius: 12px (lg), 10px (md), 8px (sm)
- Sombras: 6 niveles (xs → xl) con tinte morado
- Tipografía: h1-h6 definidos en base layer
- Animaciones: fadeIn, fadeInUp, scaleIn (0.25-0.35s)
- Scrollbar custom (6px, thumb translúcido)
- Touch targets: 44px min en mobile
- Font: 16px en inputs mobile (previene zoom iOS)

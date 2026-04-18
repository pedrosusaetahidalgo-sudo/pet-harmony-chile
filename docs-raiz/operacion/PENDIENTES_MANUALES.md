# Pendientes manuales — Post sesión 2026-04-15

Estos items requieren trabajo manual (no son código automatizable).

---

## 1. App Store / Play Store — Assets gráficos

- [ ] **App icon** en todas las resoluciones requeridas
  - iOS: 1024x1024 (App Store), 180x180, 120x120, 87x87, 80x80, 60x60, 58x58, 40x40, 29x29
  - Android: 512x512 (Play Store), 192x192, 144x144, 96x96, 72x72, 48x48
  - Usar `paw_friend_icon_principal.svg` como base
- [ ] **Splash screen** — ya configurado en `capacitor.config.ts` (color #8B5CF6), pero necesita assets PNG/XML para Android (`android/app/src/main/res/`) y storyboard para iOS
- [ ] **Screenshots para tiendas** (5-8 por plataforma):
  - Dueño: Home, Ficha clínica, Calendario, My Paws, Timeline
  - Vet: Provider Dashboard, Pacientes, Ficha con notas rápidas
  - Tomar en iPhone 14 Pro (1290x2796) y Pixel 7 (1080x2400)

## 2. Stores — Metadata y compliance

- [ ] **Descripción corta** (80 chars): "Cuida la salud de tu mascota con veterinarios verificados"
- [ ] **Descripción larga** (4000 chars): features, diferenciadores, audiencia
- [ ] **Categoría**: Medical / Lifestyle
- [ ] **Clasificación de contenido**: Completar cuestionarios de Play Store y App Store
- [ ] **Política de privacidad**: Ya existe en `/privacy`, verificar que URL esté activa
- [ ] **Términos de servicio**: Ya existe en `/terms`, verificar URL

## 3. Verificaciones pendientes

- [ ] **Meta Business verification** para WhatsApp Cloud API (código listo, pendiente verificación)
- [ ] **Google OAuth verification** (app en review, usuarios ven advertencia mientras tanto)
- [ ] **Rotar API keys** si no se hizo el 2026-04-11 (memoria: `project_rotate_keys_2026_04_11.md`)

## 4. Testing manual recomendado

- [ ] Probar flujo completo en **dispositivo real Android** (Capacitor)
- [ ] Probar flujo completo en **simulador iOS** (Xcode)
- [ ] Verificar que **Google Calendar OAuth** funciona end-to-end para providers
- [ ] Verificar que las **8 misiones core** aparecen en la página de Misiones
- [ ] Verificar **modo silencioso** toggle en Perfil > Notificaciones
- [ ] Verificar **recomendación IA** aparece después de guardar registro médico

---

> Generado automáticamente — sesión 2026-04-15, 10 commits.

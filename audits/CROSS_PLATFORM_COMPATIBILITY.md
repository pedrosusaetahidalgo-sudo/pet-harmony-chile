# Cross-Platform Compatibility — Paw Friend

> Documento consolidado de compatibilidad multiplataforma. Fuente unica para iOS, Android, Web y Chrome.
> Actualizado: 2026-04-11.

---

## 1. Targets oficiales

| # | Target | Motor | Estado | Notas |
|---|---|---|---|---|
| 1 | Chrome desktop (Win/Mac/Linux) | Chromium | OK | Mayoria de usuarios B2C |
| 2 | Edge desktop | Chromium | OK | Igual que Chrome |
| 3 | Firefox desktop | Gecko | OK | Cobertura adicional |
| 4 | Safari desktop (macOS) | WebKit | OK | Vets en Mac |
| 5 | Safari iOS | WebKit | **Con issues** | Ver §4.1 |
| 6 | Chrome Android | Chromium | OK | Mascoteros en Android |
| 7 | WebView Capacitor Android | Chromium del sistema | OK (excepto Android <=11) | Ver §4.3 |
| 8 | WebView Capacitor iOS | WKWebView | **Con issues** | Ver §4.1 |

---

## 2. Stack de abstraccion nativa (ya implementado)

El proyecto ya tiene una capa de abstraccion para manejar diferencias entre plataformas:

| Archivo | Funcion | Descripcion |
|---|---|---|
| [platform.ts](../src/lib/platform.ts) | `isNative()`, `isAndroid()`, `isIOS()`, `isWeb()` | Detecta plataforma via `@capacitor/core` |
| [nativeNavigation.ts](../src/lib/nativeNavigation.ts) | `openExternalUrl()`, `openInAppUrl()` | Abre URLs externas con `@capacitor/browser` en nativo, `window.open` en web |
| [nativeDownload.ts](../src/lib/nativeDownload.ts) | `downloadFile()` | Descarga con `@capacitor/filesystem` + `@capacitor/share` en nativo, `window.open` en web |
| [use-mobile.tsx](../src/hooks/use-mobile.tsx) | `useIsMobile()` | Detecta viewport < 768px para UI responsiva |

**Patron correcto ya en uso**: [MedicalSummaryButton.tsx:48](../src/components/medical/MedicalSummaryButton.tsx#L48) (la joya de la corona) ya usa `nativeDownload.ts` correctamente.

---

## 3. Configuracion nativa

### 3.1 Capacitor

| Campo | Valor |
|---|---|
| Capacitor | 7.4 (core, android, ios) |
| appId | `cl.pawfriend.app` |
| webDir | `docs` (output de Vite) |
| Config dev | [capacitor.config.ts](../capacitor.config.ts) |
| Config prod | [capacitor.config.production.ts](../capacitor.config.production.ts) |

**Plugins Capacitor activos**:
- `@capacitor/splash-screen` — Splash 2s, color `#8B5CF6`
- `@capacitor/status-bar` — Estilo dark, color `#8B5CF6`
- `@capacitor/keyboard` — Resize body
- `@codetrix-studio/capacitor-google-auth` — Google Sign-In nativo
- `@capacitor/push-notifications` — Badge + sound + alert
- `@capacitor/filesystem` — Descarga de archivos en nativo
- `@capacitor/share` — Compartir archivos nativos
- `@capacitor/browser` — Abrir URLs externas

### 3.2 Android

| Campo | Valor |
|---|---|
| Min SDK | 24 (Android 7.0) |
| Target SDK | 35 |
| Proyecto | [android/](../android/) (committed) |
| Manifest | [AndroidManifest.xml](../android/app/src/main/AndroidManifest.xml) |
| Keystore | `pawfriend-release-key.keystore` (alias: `pawfriend`) |

**Permisos Android declarados**:
- `INTERNET`, `ACCESS_NETWORK_STATE`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `CAMERA`
- `READ_EXTERNAL_STORAGE` (API <= 32), `WRITE_EXTERNAL_STORAGE` (API <= 29), `READ_MEDIA_IMAGES` (API 33+)
- `POST_NOTIFICATIONS`, `VIBRATE`
- Features opcionales: camera, GPS

### 3.3 iOS

| Campo | Valor |
|---|---|
| Proyecto | `ios/` (requiere Mac + Xcode, no committed) |
| contentInset | `automatic` |
| backgroundColor | `#8B5CF6` |
| Estado | Testeado en simulator, no publicado en App Store |

### 3.4 PWA

| Campo | Valor |
|---|---|
| Manifest | [public/manifest.json](../public/manifest.json) |
| Display | `standalone` |
| Orientacion | `portrait` |
| Idioma | `es-CL` |
| Iconos | 192px, 512px, 1024px |
| Service Worker | No implementado |

---

## 4. Issues conocidos por plataforma

### 4.1 Safari iOS / WKWebView iOS (BLOCKERS)

Estos son los targets que mas rompen en el stack React + Capacitor.

| # | Severidad | Archivo | Problema | Fix |
|---|---|---|---|---|
| 1 | **BLOCKER** | [PetQRDisplay.tsx:25-28](../src/components/medical/PetQRDisplay.tsx#L25) | `<a download>` + data URL no funciona en WKWebView iOS ni Safari iOS | Envolver en `isNative()` y usar `Filesystem.writeFile` como `nativeDownload.ts` |
| 2 | **BLOCKER** | [TabCompartir.tsx:132-135](../src/pages/PetClinicalRecord/tabs/TabCompartir.tsx#L132) | Mismo patron `<a download>` + data URL | Mismo fix: usar `nativeDownload.ts` |
| 3 | **BLOCKER** | [MedicalDocumentsTab.tsx:162](../src/components/medical/MedicalDocumentsTab.tsx#L162) | `navigator.share` / `clipboard.writeText` sin try/catch; `NotAllowedError` no capturado rompe el handler | Envolver en try/catch con fallback |
| 4 | **BLOCKER** | [ProviderDirectoryCard.tsx:102/109/144](../src/components/provider/ProviderDirectoryCard.tsx#L102) | Mismo problema `navigator.share` sin try/catch | Envolver en try/catch |
| 5 | **WARN** | [PetClinicalRecord/pdf.ts:223](../src/pages/PetClinicalRecord/pdf.ts#L223) | `window.open("", "_blank")` + `document.write(html)`. Safari iOS bloquea popups async | Usar `URL.createObjectURL(new Blob(...))` + `location.assign` |

### 4.2 WebView Capacitor (ambas plataformas)

| # | Severidad | Archivo | Problema | Fix |
|---|---|---|---|---|
| 6 | **WARN** | [MedicalShare.tsx:164](../src/pages/MedicalShare.tsx#L164) | `window.open('https://wa.me/...', '_blank')` abre en mismo WebView | Usar `openExternalUrl()` de `nativeNavigation.ts` |
| 7 | **INFO** | Links `<a target="_blank">` en general | Abren en mismo contexto WebView | Usar plugin `@capacitor/browser` via `openExternalUrl()` |

### 4.3 WebView Android <= 11 (Chromium 104-)

| # | Severidad | Archivo | Problema | Fix |
|---|---|---|---|---|
| 8 | **INFO** | [ui/calendar.tsx:31](../src/components/ui/calendar.tsx#L31) | `:has()` CSS degrada esteticamente | Funcional pero feo; dar fallback CSS si es critico |
| 9 | **INFO** | [ui/table.tsx:49,60](../src/components/ui/table.tsx#L49) | `:has()` CSS degrada esteticamente | Mismo: funcional, no bloqueante |

### 4.4 Firefox desktop

| # | Severidad | Problema | Fix |
|---|---|---|---|
| 10 | **INFO** | `navigator.share()` no disponible | Ya tiene fallback a clipboard en la mayoria de componentes |

### 4.5 Chrome / Edge / Safari desktop

Sin issues conocidos. Todo funcional.

---

## 5. APIs JS y compatibilidad por target

### 5.1 APIs seguras (usadas en el proyecto, universalmente soportadas)

- `Array.prototype.at()` — Safari 15.4+, todos los targets OK
- `Promise.any()` — Safari 14+, OK
- `String.prototype.replaceAll()` — Safari 13.1+, OK
- `globalThis` — universal
- `import.meta` / `import.meta.env.VITE_*` — universal en Vite
- `IntersectionObserver`, `ResizeObserver` — universal
- `Intl.DateTimeFormat` con `America/Santiago` — universal
- Dynamic imports `import()` — universal
- `structuredClone()` — Safari 15.4+, OK

### 5.2 APIs a evitar

| API | Problema | Alternativa |
|---|---|---|
| Regex lookbehind `(?<=...)` | No en Safari < 16.4 | Usar grupo de captura |
| `File System Access API` | Solo Chromium | Usar `@capacitor/filesystem` en nativo |
| `field-sizing: content` CSS | No universal | Evitar |
| CSS nesting nativo sin `&` | No universal | Usar Tailwind o `&` |
| `new Date('YYYY-MM-DD')` | Safari interpreta como UTC | Usar `parseISO` de date-fns |
| `showPicker()` en `<input type="date">` | Safari no soporta | Usar `react-day-picker` / shadcn calendar |

### 5.3 APIs con soporte parcial (requieren fallback)

| API | Soporte | Patron recomendado |
|---|---|---|
| `navigator.share()` | No en Firefox desktop ni Chrome desktop sin HTTPS | try/catch + fallback a clipboard |
| `navigator.clipboard.writeText()` | Requiere HTTPS o localhost | try/catch + fallback visual |
| `Web Share API` con archivos | Desktop NO, mobile SI | Fallback a download |
| `:has()` CSS | Safari 15.4+, Firefox 121+, Chrome 105+ | Dar fallback si es critico visualmente |
| `@container` queries CSS | Safari 16+, Chrome 105+ | OK si degrada aceptablemente |
| `backdrop-filter` | Safari requiere `-webkit-` | Tailwind lo maneja automaticamente |

---

## 6. CSS cross-platform

### 6.1 Safe area insets (iOS notch)

Para iPhones con notch, usar `env(safe-area-inset-*)`:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

Ya configurado en Capacitor con `contentInset: 'automatic'` para iOS.

### 6.2 Tailwind y compatibilidad

Tailwind CSS 3 genera prefijos vendor automaticamente para:
- `-webkit-backdrop-filter`
- `-webkit-line-clamp`
- Flexbox gap (sin prefijo, universal desde Safari 14.1+)

---

## 7. Checklist de desarrollo cross-platform

Antes de mergear cualquier PR que toque UI, navegacion, o APIs del navegador:

### Obligatorio
- [ ] `npx tsc -b` pasa sin errores
- [ ] `npm run build` pasa sin errores
- [ ] No usa `<a download>` + data URL (roto en iOS) — usar `nativeDownload.ts`
- [ ] No usa `window.open()` para URLs externas en componentes que corren en mobile — usar `openExternalUrl()`
- [ ] `navigator.share()` y `clipboard.writeText()` estan en try/catch
- [ ] No usa regex lookbehind `(?<=...)`
- [ ] No usa `new Date('YYYY-MM-DD')` — usar `parseISO` de date-fns
- [ ] Links externos no usan `<a target="_blank">` sin considerar WebView

### Recomendado
- [ ] Testar en viewport 320px (mobile mas pequeno)
- [ ] Touch targets minimo 44x44px
- [ ] Verificar que modals/dialogs no desbordan en mobile
- [ ] Si toca APIs nativas: `npx cap sync` despues del build

### Si hay riesgo Safari/iOS
- [ ] Correr `npx playwright test --project="Mobile Safari"` (si disponible)
- [ ] Verificar en simulator iOS o dispositivo real

---

## 8. Build y deploy por plataforma

### 8.1 Web (GitHub Pages)

```bash
npm run build          # Genera docs/
git add docs/ && git add -u
git push               # GitHub Pages sirve desde docs/
```

### 8.2 Android

```bash
npm run build
npx cap sync android
npx cap run android    # Debug en emulador/dispositivo

# Produccion:
# 1. cp capacitor.config.production.ts capacitor.config.ts
# 2. npm run build && npx cap sync android
# 3. Android Studio > Build > Generate Signed Bundle (AAB)
# 4. Subir a Google Play Console
```

### 8.3 iOS

```bash
# Requiere Mac + Xcode
npm run build
npx cap sync ios
npx cap open ios       # Abre Xcode
# Build desde Xcode para simulator o dispositivo
```

### 8.4 PWA

El manifest ya esta configurado en [public/manifest.json](../public/manifest.json). La app es instalable como PWA en Chrome y Safari. No hay Service Worker activo (no hay offline support).

---

## 9. Vulnerabilidades conocidas (npm)

**9 vulnerabilidades high** via `@capacitor/cli` (dependencias transitivas: `xmldom`, `lodash`, `minimatch`, `tar`). Fix disponible:

```bash
npm audit fix
```

No afectan runtime de la app (son dependencias de CLI), pero deben resolverse para CI limpio.

---

## 10. Documentos relacionados (NO duplicar)

| Documento | Que cubre | Relacion |
|---|---|---|
| [.claude/agents/cross-platform-validator.md](../.claude/agents/cross-platform-validator.md) | Checklist detallada de APIs JS/CSS/Browser por target. **Agente IA para validar PRs** | Complementario: es el agente que ejecuta la validacion; este doc es la referencia estatica |
| [.claude/agents/capacitor-mobile-specialist.md](../.claude/agents/capacitor-mobile-specialist.md) | Diagnostico Capacitor, Google Auth, build mobile, logs | Complementario: especialista en problemas mobile puntuales |
| [audits/REPORTE_CONSOLIDADO_2026_04_11.md §5.7](REPORTE_CONSOLIDADO_2026_04_11.md) | Hallazgos cross-platform de la auditoria del 2026-04-11 | Fuente original de los issues §4.1-4.4 de este documento |
| [junk/task_docs/MOBILE_CAPACITOR_TASKS.md](../junk/task_docs/MOBILE_CAPACITOR_TASKS.md) | Checklist de tareas mobile/Capacitor (setup, Google OAuth, keystore, Play Store) | Complementario: tareas pendientes de configuracion mobile |
| [junk/task_docs/MOBILE_CREDENTIALS_ONLY.md](../junk/task_docs/MOBILE_CREDENTIALS_ONLY.md) | Credenciales necesarias (3 strings, 4 archivos) | Subset: solo la parte de credenciales |
| [junk/GOOGLE_PLAY_README.md](../junk/GOOGLE_PLAY_README.md) | Guia end-to-end de publicacion en Play Store | Complementario: proceso de publicacion |
| [audits/AUDIT_2026_04_08.md §1.5](AUDIT_2026_04_08.md) | Issues mobile viewport 360x800 (`w-screen`, `inputMode`) | Historico: algunos ya corregidos |

---

## 11. Resumen ejecutivo

### Lo que funciona bien
- Capa de abstraccion nativa (`platform.ts`, `nativeDownload.ts`, `nativeNavigation.ts`) es solida
- La joya de la corona (ficha PDF) usa correctamente el patron nativo
- Capacitor 7 configurado para Android e iOS
- PWA manifest correcto
- Build verde en todas las plataformas
- Permisos Android declarados correctamente

### Lo que necesita fix (priorizados)
1. **BLOCKER**: 4 componentes usan `<a download>` o `navigator.share` sin proteccion iOS (§4.1, items 1-4)
2. **WARN**: `window.open` para WhatsApp y PDF popup bloqueado en Safari iOS (§4.1-4.2, items 5-6)
3. **INFO**: `:has()` CSS degrada en Android viejo (§4.3, items 8-9)
4. **INFO**: 9 vulns npm en dependencias de CLI (§9)

### Credenciales pendientes para completar mobile
- Google OAuth Web Client ID (ya configurado pero verificar en prod)
- Android keystore (creado, pendiente firma real para Play Store)
- Apple Developer account (necesario para App Store)

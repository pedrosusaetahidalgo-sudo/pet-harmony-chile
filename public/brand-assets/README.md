# Paw Friend Brand Assets

> Librería omnicanal del brand 2.0. Ver [docs-raiz/pawfriend-omnichannel-brand-assets-and-prompts.md](../../docs-raiz/pawfriend-omnichannel-brand-assets-and-prompts.md) para la taxonomía completa, naming conventions, prompts Claude-ready y prioridades.

## Estructura

```
brand-assets/
├── logo/                   # 5 variantes oficiales del logo (SVG)
├── icons/
│   ├── brand-squircle/     # Squircle SVG brand (31_donation.svg a 40_qr_code.svg)
│   └── lineart/            # Lineart inline pitch/deck
├── badges/                 # Paw Member / Voice / Company / Vet Verified
├── illustrations/
│   ├── hero/               # Landing hero art
│   ├── empty-states/       # 6 ilustraciones producto
│   └── onboarding/         # 5 ilustraciones welcome
├── mockups/
│   ├── devices/            # iPhone / Pixel / iPad / MacBook
│   └── dashboards/         # Admin / Provider / Sample
├── social/
│   ├── instagram/          # feed / story / reel / carousel / highlights
│   ├── facebook/           # cover / post / event
│   ├── whatsapp/           # profile / status / catalog / broadcast
│   ├── tiktok/             # cover / end-card / watermark
│   └── youtube/            # thumb / banner / end-screen
├── print/
│   ├── press-kit/          # Logo pack, fact sheet, quotes bank
│   ├── partner-kit/        # One-pager, badge, banner
│   ├── investor-kit/       # Deck cover, sample dashboard, data room
│   └── event-kit/          # Roll-up, backdrop, swag
├── store-listings/
│   ├── app-store/          # iOS screenshots, preview video
│   └── play-store/         # Android screenshots, feature graphic
└── patterns/               # Tileable backgrounds
```

## Reglas

1. **Master files = SVG** (no raster). Los derivados (PNG/JPG/WebP) van en sub-carpetas `delivery/` cuando sea necesario, no sobrescriben el master.
2. **Naming**: `<category>_<role>_<variant>.<ext>` — ver §12 del asset doc.
3. **Sin "v2", "final", "definitive"** en filenames. Git history versiona.
4. **Optimizar con SVGO** antes de commit (target < 2 KB por ícono).
5. **Cada familia nueva** actualiza este README + añade un README.md propio dentro de su folder.

## Paleta oficial brand 2.0

```
Purple brand:  50 #faf5ff → 600 #9333ea → 900 #581c87
Gold brand:    50 #fffbeb → 500 #f59e0b → 700 #b45309
Audience invest:     #9333ea → #eab308
Audience companys:   #581c87 → #9333ea
Audience partners:   #047857 → #10b981
Audience voices:     #be185d → #ec4899
```

## Tipografía

- **Display**: Fredoka (500-700)
- **Body**: Plus Jakarta Sans (400-800)
- **Mono**: JetBrains Mono (500, 700)

## Prompts reproducibles

Ver §11 del [asset doc](../../docs-raiz/pawfriend-omnichannel-brand-assets-and-prompts.md#11-prompts-base-para-generación-de-assets) — 18 prompts Claude-ready para generar nuevos assets manteniendo consistencia.

---

*Última actualización: 2026-04-19*

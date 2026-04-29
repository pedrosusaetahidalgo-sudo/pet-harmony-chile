# Paw Friend assets v2 — bundle completo

**102 SVGs · 7 documentos · 21 secciones del brief cubiertas**  
Bundle alineado al master icon + wordmark de referencia.

## Master spec aplicada en todos los SVGs

- **Squircle iOS** (no rect rx): `M 340 40 C 540 40, 640 140, 640 340 ...`
- **Fondo:** `#9333EA` sólido (excepto variantes gold/investor)
- **Patitas:** 4 elipses con rotaciones específicas en `cx=200/288/392/480 cy=270/180`
- **Pad central:** elipse `cx=340 cy=430 rx=155 ry=135` con corazón vaciado por mask
- **Wordmark:** "paw" Fredoka 600 #6B21A8 + "friend" Fredoka 500 #9333EA
- **Tipografía:** Fredoka (display) · Plus Jakarta Sans (body) · JetBrains Mono (mono)

## Estructura

```
paw-friend-assets-v2/
├── logo/                           # §3.1 — 5 variantes
├── icons/
│   ├── brand-squircle/             # §3.2 — 10 iconos concepto
│   └── categories/                 # §3.3 — 4 audiences B2B
├── public/
│   ├── favicon/                    # §3.4
│   └── brand-assets/
│       ├── illustrations/
│       │   ├── hero/               # §4.1
│       │   ├── empty-states/       # §4.2 — 6
│       │   └── onboarding/         # §4.3 — 5
│       ├── badges/                 # §4.4 — 4 seals
│       ├── mockups/dashboards/     # §4.5 — Bronze/Silver/Gold
│       ├── store-listings/
│       │   ├── app-store/          # §5.1 + §5.4 — icon + 6 screenshots
│       │   ├── play-store/         # §5.5 + §5.6 — feature + 8 screenshots
│       │   └── splash/             # §5.3 — 6 splash
│       ├── social/
│       │   ├── instagram/feed/     # §6.1 — 6
│       │   ├── instagram/stories/  # §6.2 — 4
│       │   ├── tiktok/             # §6.3 — 4
│       │   ├── youtube/            # §6.4 — 4
│       │   ├── whatsapp/           # §6.5 — 9
│       │   └── facebook/           # §6.6 — 3
│       ├── presentations/
│       │   ├── investor-kit/       # §7.1 — deck cover
│       │   ├── partner-kit/        # §7.4 + §7.5 — one-pager HTML + banner
│       │   └── paw-voice-kit/      # §7.6 — 4 assets creator
│       ├── press-kit/              # §8.1 — release MD + fact sheet HTML + quotes + B2B emails
│       ├── email-templates/        # §9.1 + §9.2 — welcome + newsletter
│       └── patterns/               # §10.1 — 3 patterns
└── android/
    ├── adaptive-foreground/        # §5.2
    └── adaptive-background/        # §5.2
```

## Notas importantes

- **App Store + Play Store screenshots** son **templates** — la zona dashed
  reservada (736×1376 iOS / 544×904 Android) es donde va la captura real
  de la app cuando esté lista.
- **Email templates** entregados como **HTML email-safe** (table layout +
  inline styles) en lugar de MJML. El brief sugería MJML pero el HTML
  generado es directamente usable y ya tiene los breakpoints + fallbacks
  Arial/Helvetica para Outlook/Gmail/Apple Mail.
- **Founder photos + product screenshots reales** del press kit (§8.1
  punto 5 y 6) requieren captura real — quedan fuera del scope generativo.
- **Variables** en emails: `{{name}}`, `{{pet_name}}`, `{{email}}`, `{{month}}`.
- **Variables** en B2B emails: `{{contacto}}`, `{{empresa}}`, `{{calendar_link}}`,
  `{{deck_link}}`.

## Datos canónicos legales

- Razón social: SUSAETA GARNHAM SOFTWARE ENGINEERING SpA
- RUT: 78.328.659-9
- Founder: Paw Founder
- Sede: Vitacura, Santiago de Chile
- Fundación: 2026
- URL: pawfriend.cl
- Contacto: pawfriendcl@gmail.com
- Stack: React + TypeScript + Vite + Supabase + Capacitor
- Lanzamiento: junio 2026
- Seed: USD $150k cap $1.2M

---

Hecho en Chile · Sostenido por la comunidad B2B

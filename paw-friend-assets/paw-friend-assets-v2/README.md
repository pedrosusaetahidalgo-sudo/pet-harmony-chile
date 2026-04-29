# Paw Friend assets v2 — Tanda P0 (27 SVGs · master-aligned)

**Generado:** 29 abr 2026 · **Bundle size:** 109 KB

## Construcción master (verificada)

Todos los assets que muestran el isotipo Paw Friend usan estos parámetros canónicos
extraídos del archivo master `paw_friend_icon_principal.svg`:

```
viewBox: 680×680
squircle path: M 340 40 C 540 40, 640 140, 640 340 C 640 540, 540 640, 340 640
               C 140 640, 40 540, 40 340 C 40 140, 140 40, 340 40 Z
fondo: #9333EA  (sólido — NO gradient salvo gold/investor)
mark fill: #FFFFFF

toes (4 ellipses):
  cx=200 cy=270 rx=55 ry=68  rotate(-22)
  cx=288 cy=180 rx=50 ry=62  rotate(-10)
  cx=392 cy=180 rx=50 ry=62  rotate(10)
  cx=480 cy=270 rx=55 ry=68  rotate(22)

main pad: ellipse cx=340 cy=430 rx=155 ry=135  (con mask heart-cutout)

heart (negative space):
  M 340 480 C 332 470, 318 460, 310 450 C 302 440, 305 425, 318 422
  C 327 420, 335 425, 340 432 C 345 425, 353 420, 362 422
  C 375 425, 378 440, 370 450 C 362 460, 348 470, 340 480 Z

wordmark:
  "paw"     Fredoka 600  fill=#6B21A8  letter-spacing=-1.5
  "friend"  Fredoka 500  fill=#9333EA  letter-spacing=-1.5
```

## Estructura de archivos

```
paw-friend-assets-v2/
├── logo/                                      [§3.1]
│   ├── paw_friend_mark_square.svg             (680×680 · master con squircle)
│   ├── paw_friend_wordmark_vertical.svg       (400×500 · mark + paw friend stacked)
│   ├── paw_friend_lockup_tagline.svg          (800×200 · horizontal + tagline)
│   ├── paw_friend_icon_gold.svg               (680×680 · gold gradient para Member)
│   └── paw_friend_sticker.svg                 (680×680 · outline only / monocroma)
│
├── icons/brand-squircle/                      [§3.2 · 200×200 rx 40]
│   ├── 31_donation.svg                        (gold gradient · paw + heart)
│   ├── 32_shield_data.svg                     (purple · escudo + candado + chispa)
│   ├── 33_ai_brain.svg                        (purple · cerebro + circuito + estrella)
│   ├── 34_map_pin_paw.svg                     (emerald · pin con master paw inside)
│   ├── 35_pdf_record.svg                      (purple · doc esquina doblada + tag PDF)
│   ├── 36_handshake_paws.svg                  (emerald · 2 patas estrechadas)
│   ├── 37_invoice.svg                         (purple · recibo + sello rosa)
│   ├── 38_shelter.svg                         (emerald · casa chueca + master paw)
│   ├── 39_badge_member.svg                    (gold gradient · escudo + crown + master paw)
│   └── 40_qr_code_paw.svg                     (purple · QR + master paw central)
│
├── public/favicon/
│   └── favicon.svg                            (32×32 · iOS-style squircle path)              [§3.4]
│
├── public/brand-assets/store-listings/
│   ├── app-store/icon_1024.svg                (1024×1024 sólido · sin clip · iOS aplica máscara)  [§5.1]
│   ├── play-store/feature_graphic_1024x500.svg (split panel + phone mockup ficha)             [§5.5]
│   └── splash/                                                                                [§5.3]
│       ├── splash_iphone_1290x2796.svg
│       ├── splash_iphone_1170x2532.svg
│       ├── splash_ipad_2048x2732.svg
│       ├── splash_android_1080x1920.svg
│       ├── splash_android_1440x2560.svg
│       └── splash_tablet_1600x2560.svg
│
├── android/                                   [§5.2]
│   ├── adaptive-foreground/adaptive_foreground.svg  (432×432 · master mark en safe-zone)
│   └── adaptive-background/adaptive_background.svg  (432×432 · sólido #9333EA)
│
└── public/brand-assets/presentations/investor-kit/
    └── deck_cover_investors.svg               (1920×1080 · gradient cinematográfico)         [§7.1]
```

## Notas críticas de exportación

### iOS App Icon (`icon_1024.svg`)
- **Submission requiere PNG.** El SVG es `1024×1024` SÓLIDO sin clip path porque iOS 17+ aplica
  su propia máscara squircle automáticamente. NO incluir esquinas redondeadas.
- Convertir: `rsvg-convert -w 1024 -h 1024 icon_1024.svg > icon_1024.png` (instalar `librsvg2-bin`)
  o abrir en Sketch/Figma → exportar PNG.

### Android Adaptive Icon
- `adaptive_foreground.svg` lleva el mark dentro de la safe-zone 264×264 centrada.
- `adaptive_background.svg` es solo color sólido (Android compone los dos via launcher mask).
- Importar ambos via Android Studio → Image Asset Studio → Adaptive icon.

### Splash screens
- Cada SVG tiene aspect-ratio nativo del device target — convertir a PNG en su resolución exacta.
- Para Capacitor: ubicar PNGs en `resources/splash/` y ejecutar `npx capacitor-resources`.

### Favicon
- Reemplazar `public/favicon.svg` directo en el repo.
- Generar adicionalmente `favicon.ico` 32×32 + `apple-touch-icon.png` 180×180 desde el SVG.

## Pendientes — siguientes olas

| Ola | Sección | Output | Tiempo |
|---|---|---|---|
| 2 | §3.3 audience icons + §4.4 badges seals + §4.2 empty states | 14 SVGs | 60 min |
| 3 | §4.1 hero + §4.3 onboarding + §4.5 dashboards | 9 SVGs (más complejos) | 90 min |
| 4 | §6.1 IG feed + §6.2 IG stories + §6.3 TikTok | 14 SVGs | 75 min |
| 5 | §6.4 YouTube + §6.5 WhatsApp + §6.6 Facebook | 16 SVGs | 75 min |

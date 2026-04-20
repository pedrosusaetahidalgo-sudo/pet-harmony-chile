# Icons — Categorias de audiencia

Iconos SVG por categoria para usar en la app y los pitch decks.

Cada archivo debe ser un SVG cuadrado viewBox `0 0 120 120` (igual que el
set `brand-squircle/`), fondo transparente o squircle brand, simbolo
centrado. Tamaños esperados: se renderizan entre 32px y 80px en la app.

## Archivos esperados

| Archivo | Categoria | Uso en la app |
|---|---|---|
| `voice.svg` | Paw Voices (creadores) | `/paw-voices`, `/aplicar?tipo=paw_voices`, muralla de voices en `/donaciones`, admin `AdminPawVoices` |
| `partner.svg` | Paw Partners (tiendas/alianzas) | `/paw-partners`, `/aplicar?tipo=paw_partners`, `/paw-member`, admin `AdminPawCompanys` (partner) |
| `company.svg` | Paw Companys (sponsors) | `/donaciones` grid, `/paw-companys`, `/aplicar?tipo=paw_companys`, admin `AdminPawCompanys` (sponsor) |
| `shelter.svg` | Hogares de adopcion | `/refugios-hogares`, `/refugios/:slug`, `/onboarding-shelter`, `/aplicar?tipo=refugio`, admin `AdminShelters` |
| `investor.svg` | Inversionistas (angels, VC, fondos publicos) | Landing seccion investors, `/aplicar?tipo=corfo|startup_chile|angels_vc` |
| `vet.svg` | Veterinarios | `/veterinarios`, `/para-veterinarios`, `/registro-veterinario`, `/aplicar?tipo=vet`, admin `AdminServiceProviders` / `AdminVetVerifications` |

## Como usar desde React

Todos los iconos se consumen via `<CategoryIcon />` en
`src/components/CategoryIcon.tsx` que tiene fallback automatico a
lucide-react si el SVG aun no existe.

```tsx
import { CategoryIcon } from '@/components/CategoryIcon';

<CategoryIcon kind="shelter" className="h-10 w-10" />
```

Mientras el SVG no este en esta carpeta, se renderiza el icono Lucide
equivalente. Al soltar el archivo `shelter.svg` aqui, la app lo toma
automaticamente en el proximo build sin tocar codigo.

## Cache

Los paths son estaticos bajo `/paw-friend-assets-v2/icons/categories/`.
Vite no hashea los archivos de `public/`, asi que GitHub Pages puede
cachear 1h. Si cambias un SVG ya subido, aumenta el timestamp en el
componente via prop `version` (no implementado aun).

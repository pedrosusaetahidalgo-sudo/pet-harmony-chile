# Icons — Categorias de audiencia (brand v2, 2026-04-20)

Los iconos oficiales de cada categoria viven en la raiz de
`public/paw-friend-assets-v2/`, no en esta subcarpeta. Cada kind tiene
dos variantes:

| Kind | Icon (squircle) | Full (con wordmark) |
|---|---|---|
| `voice` | `paw_voices_icon.svg` | `paw_voices_full.svg` |
| `partner` | `paw_partners_icon.svg` | `paw_partners_full.svg` |
| `shelter` | `paw_shelter_icon.svg` | `paw_shelter_full.svg` |
| `investor` | `paw_investors_icon.svg` | `paw_investors_full.svg` |
| `vet` | `paw_vets_icon.svg` | `paw_vets_full.svg` |
| `company` (bronze) | `paw_companys_bronze_icon.svg` | `paw_companys_bronze_full.svg` |
| `company` (silver) | `paw_companys_silver_icon.svg` | `paw_companys_silver_full.svg` |
| `company` (gold) | `paw_companys_gold_icon.svg` | `paw_companys_gold_full.svg` |

## Como usar desde React

Usar siempre `<CategoryIcon />` en `src/components/CategoryIcon.tsx`. El
componente maneja el path + fallback a Lucide automaticamente.

```tsx
import { CategoryIcon } from '@/components/CategoryIcon';

// Icono compacto inline (ej. avatar fallback):
<CategoryIcon kind="shelter" className="h-14 w-14" />

// Badge grande para hero sections:
<CategoryIcon kind="partner" badge size="lg" />

// Wordmark completo (con texto) para headers:
<CategoryIcon kind="voice" variant="full" className="h-28 w-auto" />

// Paw Company con tier:
<CategoryIcon kind="company" tier="gold" variant="icon" className="h-10 w-10" />
```

## Paths canonicos

- Icon squircle: `/paw-friend-assets-v2/paw_<kind>s_icon.svg` (singular
  `paw_shelter_icon.svg` para shelter, `paw_investors_icon.svg` para investor).
- Full wordmark: `/paw-friend-assets-v2/paw_<kind>s_full.svg`.
- Company: `/paw-friend-assets-v2/paw_companys_<tier>_<variant>.svg`.

## Esta subcarpeta

La carpeta `icons/categories/` se mantiene por si mas adelante queremos
variantes adicionales (dark mode, animadas, etc). Hoy no tiene SVGs.

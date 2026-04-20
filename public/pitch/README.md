# `public/pitch/` — 4 pitch decks listos para enviar por link

> **Creado**: 2026-04-19 · **Estado**: producción (deployed a `pawfriend.cl/pitch/`)
>
> Esta carpeta está adentro de `public/` a propósito: Vite copia `public/`
> tal cual a `docs/` en cada `npm run build` sin borrar nada. Así los 4 HTML
> **sobreviven rebuilds** y siempre quedan deployed.

---

## URLs públicas

| Audiencia | URL | Archivo |
|---|---|---|
| **Landing** (índice con las 4) | https://pawfriend.cl/pitch/ | [index.html](index.html) |
| **Inversionistas** (CORFO / Start-Up Chile / Angels LATAM) | https://pawfriend.cl/pitch/inversionistas.html | [inversionistas.html](inversionistas.html) |
| **Paw Companys** (empresas sponsor) | https://pawfriend.cl/pitch/companys.html | [companys.html](companys.html) |
| **Paw Partners** (tiendas / barter) | https://pawfriend.cl/pitch/partners.html | [partners.html](partners.html) |
| **Paw Voices** (creadores / influencers) | https://pawfriend.cl/pitch/voices.html | [voices.html](voices.html) |

Todas tienen `noindex, nofollow` — no aparecen en Google, solo quien
recibe el link llega.

---

## Cómo enviarlos

### Opción A — Link directo (recomendado)
Pega la URL en WhatsApp, email o LinkedIn. El receptor ve un **preview
rico** con imagen + título + descripción (Open Graph + Twitter Card ya
configurados). Siempre abre la versión más reciente.

### Opción B — PDF adjunto
Abrir el HTML en Chrome/Edge → `Ctrl+P` → **Guardar como PDF** →
margen "Ninguno" + "Gráficos de fondo" activado. Los 4 tienen
`@media print` que limpia chrome, navegación y scrollsnap.

### Opción C — Imprimir (print-friendly)
Mismo flujo que PDF pero destino impresora. Page-break por slide está
configurado.

### Opción D — Deck standalone offline
Los 4 HTML son autocontenidos: CSS inline, Google Fonts por CDN. Puedes
bajarlos y adjuntar el `.html` a un correo — se abren sin conexión
(excepto la tipografía fancy, que cae a fallback `system-ui`).

---

## Regla de mantenimiento — NO TOCAR SIN AUTORIZACIÓN

> Estos 4 HTML son **enlaces que van a estar viviendo afuera**: en
> correos enviados a inversionistas, en chats con empresas, en DMs a
> creadores. Cambiar una URL o romper un archivo significa **romper
> links que ya están enviados**.

**Qué NO hacer sin autorización explícita del Paw Founder:**
- Renombrar cualquier archivo de `public/pitch/*.html`.
- Borrar o mover la carpeta.
- Cambiar el diseño base (tipografía, paleta, estructura de slides).
- Eliminar los tags Open Graph / Twitter Card del `<head>`.

**Qué SÍ se puede hacer (ajustes puntuales):**
- Corregir typos / copy obsoleto (siempre alineado al modelo
  [CLAUDE.md §5](../../CLAUDE.md) + [memory `project_monetization_motors.md`](../../~/.claude/projects/.../memory/)).
- Actualizar números (MRR, usuarios, Paw Companys activos) cuando
  exista métrica real.
- Reemplazar placeholders con assets reales (logos, fotos).
- Agregar nuevas slides sin renumerar las existentes.

Después de CUALQUIER ajuste:
1. Verificar que la URL canónica sigue respondiendo con `200`.
2. Verificar preview OG pegando el link en
   [metatags.io](https://metatags.io) o [opengraph.xyz](https://opengraph.xyz).
3. Bump de versión en el footer: `Versión YYYY-MM-DD`.
4. Commit con mensaje `docs(pitch): <qué se cambió>`.

---

## Fuentes que gatillan actualización (docs vivos)

Si cambias cualquiera de estos archivos, **revisa si los 4 HTMLs
necesitan actualizarse**:

| Fuente | Por qué afecta |
|---|---|
| [`src/lib/plans.ts`](../../src/lib/plans.ts) | Precios y features vet (Free / Premium $9.900 / Pro Max $29.900) |
| [`CLAUDE.md §5`](../../CLAUDE.md) | Modelo de negocio (5 tipos de monetización, Paw Companys tiers) |
| `~/.claude/.../memory/project_monetization_motors.md` | Referencia canónica de los 6 motores |
| `~/.claude/.../memory/project_session_2026_04_19_pivot_monetizacion.md` | Pivot base del modelo actual |
| [`src/pages/PawCore.tsx`](../../src/pages/PawCore.tsx) | Visión, misión, identidad pública |
| [`src/pages/PawVoices.tsx`](../../src/pages/PawVoices.tsx) | Beneficios oficiales para creadores |
| [`src/pages/PawCompanys.tsx`](../../src/pages/PawCompanys.tsx) | Tiers y beneficios Bronze/Silver/Gold |
| [`marketing/PITCH_DECKS_MASTERPLANS.md`](../../docs-raiz/marketing/PITCH_DECKS_MASTERPLANS.md) | Masterplan de diseño y decisiones de copy |

El hook [`scripts/check-docs-vivos.mjs`](../../scripts/check-docs-vivos.mjs)
recuerda esta relación al editar `plans.ts` o cualquiera de los archivos
"dueño".

---

## Fuente original (snapshot histórico)

La versión **fuente** (pre-deploy) está en
[`pitch-inversionistas/`](../../pitch-inversionistas/) — ese es el
snapshot histórico con nombres largos (`PRESENTACION.html` etc.).
`public/pitch/` es la versión servida al público, con nombres cortos y
metadata OG.

**No editar en dos lugares a la vez.** Si hay que iterar:
1. Editar en `public/pitch/`.
2. Copiar al snapshot `pitch-inversionistas/` SOLO si el cambio es
   mayor y conviene versionar.
3. El master plan [`PITCH_DECKS_MASTERPLANS.md`](../../docs-raiz/marketing/PITCH_DECKS_MASTERPLANS.md)
   documenta decisiones.

---

## Contacto

**Paw Founder** · `pedrosusaeta@pawfriend.cl` · pawfriend.cl
SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT 78.328.659-9
Luis Pasteur 6111 Dp 201, Vitacura, Santiago de Chile

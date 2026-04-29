# Paw Friend — Pitch Folder · Indice maestro

> **Set consolidado** de pitch decks por audiencia. Cada HTML es un deck navegable con teclado (`←` `→` `F` `P`). Cada MD es un brief detallado.
>
> Última revision: 2026-04-29.

---

## Pitch decks HTML (presentables)

| Deck | Audiencia | Slides |
|---|---|---|
| [PITCH_INVESTORS_LIVE.html](PITCH_INVESTORS_LIVE.html) | **Master generico** — cualquier inversionista | 13 |
| [PITCH_FONDOS.html](PITCH_FONDOS.html) ⭐ | **CORFO + Start-Up Chile + Angeles/VC** (con tabs por audiencia) | 9 |
| [PITCH_PHARMA.html](PITCH_PHARMA.html) | **Pharma animal** — Centrovet · Virbac · Zoetis · MSD | 8 |
| [PITCH_ASEGURADORAS.html](PITCH_ASEGURADORAS.html) ⭐ | **Pet insurance** — Sura · BCI · Mapfre · Consorcio | 8 |
| [PITCH_RETAIL.html](PITCH_RETAIL.html) ⭐ | **Retail pet** — Master Dog · Falabella · Puppis · Pet Star | 8 |
| [PITCH_GOBIERNO.html](PITCH_GOBIERNO.html) ⭐ | **Municipios + SAG + Subdere** (Ley 21.020) | 8 |
| [PITCH_BANCOS.html](PITCH_BANCOS.html) ⭐ | **Banca retail** — BCI · Santander · Itau · BancoEstado · Falabella | 8 |
| [PITCH_EDIFICIOS.html](PITCH_EDIFICIOS.html) ⭐ | **Inmobiliarias + administradoras + HOAs** | 8 |
| [PITCH_LONGTAIL.html](PITCH_LONGTAIL.html) ⭐ | **B2B residual** — aerolineas · hoteles · academia · hardware · plataformas · cremacion | 8 |
| [PITCH_REFUGIOS_PARTNERS.html](PITCH_REFUGIOS_PARTNERS.html) ⭐ | **Refugios + Paw Partners** (alianzas no-pago) | 6 |
| [INSIGHTS_DASHBOARDS_MOCK.html](INSIGHTS_DASHBOARDS_MOCK.html) ⭐ | **Apendice transversal** — data room visual | 10 |

⭐ = creado o reescrito 2026-04-29.

---

## Briefs MD (talking points · ask especifico)

| Brief | Para usar junto con |
|---|---|
| [01_CORFO_SSAF-I.md](01_CORFO_SSAF-I.md) | `PITCH_FONDOS.html` (tab CORFO) |
| [02_START_UP_CHILE.md](02_START_UP_CHILE.md) | `PITCH_FONDOS.html` (tab Start-Up) |
| [03_PAW_COMPANYS_EMPRESAS.md](03_PAW_COMPANYS_EMPRESAS.md) | `PRESENTACION_COMPANYS.html` |
| [04_ANGELES_VC_LATAM.md](04_ANGELES_VC_LATAM.md) | `PITCH_FONDOS.html` (tab Angels/VC) |
| [05_HOGARES_DE_ADOPCION.md](05_HOGARES_DE_ADOPCION.md) | `PITCH_REFUGIOS_PARTNERS.html` |
| [06_PAW_PARTNERS.md](06_PAW_PARTNERS.md) | `PITCH_REFUGIOS_PARTNERS.html` |

## Decks de presentacion legacy (publica)

| Deck | Audiencia |
|---|---|
| [PRESENTACION.html](PRESENTACION.html) | Master historico (puede archivarse) |
| [PRESENTACION_COMPANYS.html](PRESENTACION_COMPANYS.html) | Empresas Paw Company sponsors |
| [PRESENTACION_VOICES.html](PRESENTACION_VOICES.html) | Creadores Paw Voices |
| [PRESENTACION_PARTNERS.html](PRESENTACION_PARTNERS.html) | Partners legacy |

## Documentacion transversal

| Archivo | Para |
|---|---|
| [CONSOLIDADO_INVERSIONISTAS.md](CONSOLIDADO_INVERSIONISTAS.md) | Fuente de verdad unificada — narrativa + datos |
| [BRAND_KIT_PITCHES.md](BRAND_KIT_PITCHES.md) ⭐ | Paletas + assets a generar (Claude Web) por cada pitch |
| [PRESENTACION_AUDIENCE_NOTES.md](PRESENTACION_AUDIENCE_NOTES.md) | Notas de tono por audiencia |

## Assets

| Folder | Contenido |
|---|---|
| [assets/IDS/](assets/IDS/) | Carnet frente/reverso · Paw Passport · preview combinado (SVG) |

---

## Como usar (cheat sheet)

### Para una reunión presencial / Zoom

1. Abrir el deck HTML correspondiente a la audiencia (doble clic).
2. Modo pantalla completa (tecla `F`).
3. Navegar con `←` / `→`.
4. Si la audiencia pide profundidad técnica → abrir [INSIGHTS_DASHBOARDS_MOCK.html](INSIGHTS_DASHBOARDS_MOCK.html) en otra pestaña.
5. Demo en vivo del producto en otra pestaña.

### Para enviar por correo

1. Abrir el deck HTML.
2. `Ctrl+P` (Cmd+P en Mac) → Guardar como PDF.
3. Margenes ninguno · graficos de fondo activado · papel carta horizontal.
4. Adjuntar PDF + brief MD correspondiente (ver tabla "Briefs MD").

### Para actualizar metricas pre-pitch

1. Abrir `/admin?section=sala-inversion` en produccion.
2. Copiar numeros reales (no inventar).
3. Si la metrica diverge del valor canonico en `BRAND_KIT_PITCHES.md` seccion 4 → actualizar TODOS los HTMLs en el mismo commit.

---

## Flujo cronologico de pitches (90 dias post-launch)

| Mes | Accion |
|---|---|
| **Mes 0 (pre-launch)** | Outreach a 13 refugios chilenos (en curso). Outreach Petify (en curso). Definir SpA Flow (en curso). |
| **Mes 1** | Lanzar producto. Conseguir 50-80 vets activos. Cerrar 3 Paw Companys. |
| **Mes 2** | Postular Start-Up Chile Ignite (`PITCH_FONDOS.html` tab Start-Up + brief). |
| **Mes 3** | Postular CORFO SSAF-I (`PITCH_FONDOS.html` tab CORFO + brief). Outreach pharma (Centrovet, Virbac) con `PITCH_PHARMA.html`. |
| **Mes 4-5** | Outreach aseguradoras (Sura, BCI). Outreach retail (Master Dog). Outreach municipio piloto. |
| **Mes 6** | Cerrar pre-seed USD $150K via angeles LATAM. Cerrar 1-2 pilotos B2B firmados. |
| **Mes 7-9** | Ejecutar pilotos. Outreach banca + edificios. Long-tail oportunista. |
| **Mes 10-12** | Convertir pilotos a contratos anuales. Preparar Seed con tracción. |

---

## Reglas de oro

1. **No pedir NDA** a inversionistas antes de decidir si les interesa.
2. **No inventar numeros** — si MRR es $0, decir $0 + contexto.
3. **No esconder uso de IA** — es moat, no debilidad.
4. **No mezclar audiencias** — no enviar deck de CORFO a un angel LATAM y viceversa.
5. **No cambiar el modelo durante el pitch** — el dueno NUNCA paga, B2B paga.
6. **Sincronizar numeros canonicos** — ver [BRAND_KIT_PITCHES.md seccion 4](BRAND_KIT_PITCHES.md#4-numeros-canonicos-compartidos).

---

## Que SI hacer

1. **Ensayar 3 min** (pitch corto) y **10 min** (deep). Si no cabe en 3, la historia no está clara.
2. **Preparar 10 preguntas incomodas** (ver seccion 7 de `04_ANGELES_VC_LATAM.md`).
3. **Actualizar metricas en vivo** antes de cada meeting.
4. **Mostrar producto vivo** — la demo siempre cierra mejor que el deck.
5. **Cerrar con ask explicito** — nunca terminar en "y bueno, eso es".
6. **Documentar cada reunion**: a quien pitcheaste, feedback, proximos pasos.

---

## Mantenimiento

- **Post-reunion** con inversionista → agregar feedback al `CONSOLIDADO_INVERSIONISTAS.md`.
- **Post-milestone** (cada ronda, cada hito de tracción) → actualizar numeros canonicos en TODOS los pitches en un solo commit.
- **Cada 30-60 dias** → revisar [BRAND_KIT_PITCHES.md](BRAND_KIT_PITCHES.md) y refrescar lo que haga falta.

---

## Contacto

**Paw Founder** · Paw Friend
✉️ pawfriendcl@gmail.com · 🌐 pawfriend.cl
SpA SUSAETA GARNHAM SOFTWARE ENGINEERING · RUT 78.328.659-9
Luis Pasteur 6111 Dp 201, Vitacura, Santiago

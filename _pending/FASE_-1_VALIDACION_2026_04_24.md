# Fase -1 — Validación pre-refactor (2 semanas: 2026-04-24 → 2026-05-07)

> **Propósito**: validar las 2 hipótesis centrales del [Plan Maestro Refactor](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md) ANTES de invertir 6 meses de trabajo en Fases 0–2. Mejor perder 2 semanas ahora que 3 meses después.
> **Costo estimado**: $0 en infra, ~20–30 horas de tiempo.
> **Owner**: Pedro + Claude
> **Fecha inicio**: 2026-04-24
> **Fecha cierre**: 2026-05-07

---

## Las 2 hipótesis a validar (las otras ya están confirmadas)

| # | Hipótesis | Estado | Experimento |
|---|---|---|---|
| H1 | Los dueños chilenos quieren la **Pet ID Card** como artefacto emocional + utilitario con QR al dashboard | ✅ Confirmado por Pedro 2026-04-23 (test 1 aprobado) | Ya validado directamente |
| H2 | El **nose print** funciona con >95% accuracy en razas mixtas chilenas usando cámara celular promedio | ❓ Desconocido, crítico para Fase 1 | **Experimento técnico 1 semana** |
| H3 | Al menos 1 aseguradora chilena (iki / Mapfre / Sura) está interesada en integración con Paw Friend | ❓ Desconocido, define Fase 2 | **Conversación exploratoria 1 semana** |

H1 ya se validó con tu confirmación directa ("emocional y utilitario con QR al dashboard"). H2 y H3 requieren experimento real.

---

## Experimento H2 — Nose print accuracy en razas chilenas

### Objetivo
Validar en 1 semana si el nose print es viable tecnológicamente en el mercado chileno real (razas mixtas dominantes) antes de invertir 4–6 semanas construyendo infraestructura pgvector + edge functions.

### Método (baja complejidad, $0 costo)

**Día 1–2: recolectar fotos**

1. Pedro solicita a 10 dueños beta (Sofia, Paloma, amigos cercanos con mascota) 3 fotos de nariz de su mascota:
   - Buena iluminación natural
   - Distancia ~15cm de la cámara del celular
   - Enfoque nítido en la nariz
   - Guía gráfica simple en PDF o mensaje WhatsApp
2. Objetivo: 30 fotos totales, 10 mascotas, mix razas (mestizo, labrador, golden, bulldog francés, cruces, 1–2 gatos para comparar)

**Día 3–4: procesar embeddings**

Opción A (la más barata):
- Usar API de Petnow Developer en modo trial gratuito (Korea-based, ofrece demo keys)
- Endpoint `/api/v1/embeddings` acepta imagen y devuelve vector
- Costo: $0 en modo trial hasta 100 requests

Opción B (si Petnow no responde):
- Usar modelo open source MobileNetV3 pre-entrenado en ImageNet + fine-tuning con Pet Biometric Challenge CVPR 2022 dataset público
- Correrlo local en Python (laptop Pedro sirve)
- Librería: `torch`, `torchvision`, `PIL`. Tiempo setup: 2h.

**Día 5: análisis de accuracy**

Script Python (~50 líneas) que:
1. Para cada par de fotos (Ci, Cj) calcular similaridad coseno entre embeddings
2. Agrupar: "same-pet pairs" vs "cross-pet pairs"
3. Métricas:
   - Accuracy same-pet: >90% debe tener similaridad > umbral (ej 0.85)
   - False positive cross-pet: <5% con similaridad > umbral
4. Reporte: `H2_nose_print_validation_report_20260429.md`

### Criterios de éxito

| Resultado | Decisión |
|---|---|
| Accuracy >95% same-pet, <2% false positive | ✅ Seguir con plan, modelo base funciona |
| Accuracy 85–95%, <5% false positive | ⚠️ Usar con fine-tuning local en Fase 1 ($3–8k GPU training) |
| Accuracy <85% o >5% false positive | ❌ Repensar Fase 1, posiblemente usar Petnow API comercial ($0.0005/match) en vez de modelo propio |

### Entregables

- [ ] 30 fotos recolectadas en carpeta privada (no committear)
- [ ] Script Python en `scripts/nose_print_validation.py` (no public)
- [ ] Reporte `_pending/H2_nose_print_validation_report_20260429.md`
- [ ] Decisión go/no-go/adjust documentada

---

## Experimento H3 — Interés aseguradora

### Objetivo
Confirmar si al menos 1 aseguradora chilena está abierta a conversación de integración Paw Friend, antes de diseñar el flujo de seguros embebidos en Fase 2.

### Método (alto retorno, bajo esfuerzo)

**Día 1–2: preparar material**

1. Documento de 1 página "Paw Friend × Aseguradoras" explicando:
   - Qué es Paw Friend (trinidad corazón + timeline + biometría)
   - Qué data tenemos hoy (con números reales)
   - Qué valor aporta a una aseguradora (score de riesgo, pre-llenado, menor fricción onboarding, retención)
   - Qué queremos (conversación exploratoria, no compromiso)
2. Formato: PDF de 1 hoja con diseño limpio

**Día 3–6: contactar**

Lista priorizada:
1. **iki** (Chile nativo, tech-forward, el más probable) — buscar contacto en LinkedIn, mandar el 1-pager
2. **Mapfre Pet** (escala pero burocrático) — contacto vía formulario B2B
3. **Sura Pet** (emergente) — LinkedIn o cold email

Objetivo mínimo: **1 reunión exploratoria agendada antes del día 14**.

**Día 7–14: reunión y decisión**

Con quien responda, tener 1 call de 30 min:
- Entender su apetito por data externa
- Validar rango de comisión que pagarían (si ofrecen 10–15% mínimo, el modelo funciona)
- Acordar siguientes pasos si hay interés

### Criterios de éxito

| Resultado | Decisión |
|---|---|
| 1+ aseguradora quiere avanzar | ✅ Seguros embebidos confirmado como motor Fase 2 |
| 1+ dice "volvamos en 6 meses cuando tengan más usuarios" | ⚠️ Motor aplazado Y2, no Y3 |
| Ninguna responde ni muestra interés | ❌ Seguros no es motor principal. Repriorizar insights pharma como core. |

### Entregables

- [ ] PDF "Paw Friend × Aseguradoras" en `docs-raiz/pitch/PAW_FRIEND_ASEGURADORAS_20260424.pdf`
- [ ] Lista de contactos + status en `_pending/H3_insurance_outreach_log.md`
- [ ] Reporte post-reunión si hubo alguna

---

## Timeline de 2 semanas

| Semana | H2 (nose print) | H3 (seguros) |
|---|---|---|
| 1 (24/4–30/4) | Recolectar 30 fotos + setup script + embeddings extraídos | Preparar 1-pager + contactar 3 aseguradoras |
| 2 (1/5–7/5) | Análisis accuracy + reporte + decisión | Reuniones + decisión |

---

## Cierre Fase -1

**Lunes 2026-05-08 Pedro decide**:

- Si H2 ✅ y H3 ✅ → **Proceder con Plan Maestro completo tal como está escrito**
- Si H2 ⚠️ y H3 ✅ → **Proceder con Plan Maestro ajustando Fase 1 con training local ML**
- Si H2 ✅ y H3 ❌ → **Proceder con Plan Maestro reordenando: Fase 2 pivota a insights pharma como motor #1**
- Si H2 ❌ → **Revisión mayor: considerar Petnow API como dependencia externa + nose print secundario, ficha médica como core único**
- Si H3 ❌ → **Seguros no es motor Y2. Reforzar pharma + retail + Paw Companys como motores alternativos**

---

## Mientras tanto (trabajo paralelo sin riesgo)

Durante estas 2 semanas Pedro / Claude pueden avanzar en:

- [ ] Limpiar working tree del repo (archivos sueltos)
- [ ] Rename tablas huérfanas a `_deprecated_20260424` (sección 9.0.bis.5 del plan maestro)
- [ ] Regenerar types.ts post-renames
- [ ] Crear branch `feature/refactor-maestro-2026-04` limpio
- [ ] Diseño visual de Pet ID Card en Figma o similar
- [ ] Reescritura de [NOSE_PRINT_ID.md](../docs-specs/NOSE_PRINT_ID.md) con framing ético primary biometric
- [ ] Creación de [POSTURA_BIOMETRIA_2026_04_23.md](../docs-raiz/pitch/POSTURA_BIOMETRIA_2026_04_23.md) — manifiesto público

Estas son tareas de **preparación que no rompen nada en prod** y que ahorran tiempo cuando Fase 0 arranque.

---

## Acciones bloqueantes que requieren Pedro

- [ ] **Backup Supabase completo** (Dashboard → Database → Backups → Download) antes de cualquier migración
- [ ] **Habilitar pgvector** (Dashboard → Database → Extensions → Enable vector) — solo necesario si H2 pasa
- [ ] **Contacto aseguradoras H3**: requiere Pedro personalmente, no se puede delegar a Claude
- [ ] **Solicitar fotos H2**: requiere Pedro contactando a Sofia, Paloma, amigos

---

**Cierre**: esto es 2 semanas de validación barata que previenen 3 meses de refactor mal dirigido. El plan maestro sigue válido; solo queremos saber si las 2 hipótesis centrales soportan peso antes de construir sobre ellas.

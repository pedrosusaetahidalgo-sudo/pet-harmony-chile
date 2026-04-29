# Paw Friend — Plan Contingency Petify COGS (2026-04-29)

> Doc operacional para gestionar el riesgo de costo lineal Petify
> USD 0.75/mascota Shield activada/mes a medida que crece el volumen.
>
> Acompaña [MODELO_FINANCIERO_2026_04_29.md](MODELO_FINANCIERO_2026_04_29.md)
> y la memoria [project_nose_print_master_plan](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_nose_print_master_plan.md).

---

## 1. El problema

**Petify Pro tier**: USD 0.75/mascota con Paw Shield activado/mes.

Asunción base modelo financiero: **30% Paw Member opt-in + 60% Manada opt-in**.

| Escala MAU | Mascotas Shield activas | COGS Petify USD/mes | COGS CLP/mes (FX 905) |
|---|---|---|---|
| 1.000 | 39 | $29 | $26.245 |
| 10.000 | 590 | $443 | $400.815 |
| 50.000 | 2.950 | $2.213 | $2.002.765 |
| 100.000 | 5.900 | $4.425 | $4.005.625 |

**Punto crítico**: a 50k MAU el COGS Petify mensual es ~CLP 2M (~USD 2.2k). Si el ARR conservador es USD 120k anuales (10k MAU), Petify come 25-40% del revenue solo en biometría.

**Si Petify sube precio x2** (escenario stress) — duplica el problema.

---

## 2. Plan A — escenario base (lo que estamos haciendo)

**Acciones**:
- Paw Shield es **opt-in**, NO universal. Solo activan los duenos que pagan Paw Member o Manada.
- Free tier: NO Paw Shield (PremiumGate bloquea).
- Disclaimer transparente al usuario: "biometría incluida en tu plan paid".

**Impacto**:
- COGS lineal pero proporcional a revenue (los que pagan, generan COGS).
- Margen Paw Member 86% / Manada 62% absorben el costo.

**Cuándo este plan deja de funcionar**:
- A 100k MAU si conversión Paw Member cae a <5% (free → no Shield → Petify no cobra, pero también no hay revenue).
- O si pharma/seguros/retail no firman al mes 12 → ARR depende solo B2C → margen consolidado se ajusta.

**Límite estimado**: hasta 50k MAU sin partners B2B firmados es viable. Pasado eso, activar Plan B.

---

## 3. Plan B — Renegociar tier custom Petify

**Trigger**: ≥ 5.000 mascotas Shield activas concurrentes (≈ 25k MAU).

**Acción**:
- Pedro contacta Johnny / equipo Petify.
- Propone tier custom Volume con descuento por escala.

**Targets razonables**:

| Volumen mascotas Shield | Precio actual | Target negociación |
|---|---|---|
| < 1.000 | $0.75 | Sin cambio |
| 1.000 - 5.000 | $0.75 | $0.55 (-27%) |
| 5.000 - 20.000 | $0.75 | $0.40 (-47%) |
| 20.000 + | $0.75 | $0.25 (-67%) |

**Justificación a Petify**: Paw Friend es su mayor cliente CL/LatAm a esa escala. Volumen + brand = leverage.

**Si rechaza**: documentar la razón y pasar a Plan C/D simultáneo.

**Documentos preparados**: si Pedro consigue tier custom, actualizar:
- [MODELO_FINANCIERO_2026_04_29.md sección 6.2](MODELO_FINANCIERO_2026_04_29.md) — sensibilidad Petify x0.5 (~50% margen mejor).
- [src/lib/featureFlags.ts](../src/lib/featureFlags.ts) PAW_SHIELD_PETIFY comentario.
- [docs-raiz/REVENUE_MASTER_PLAN_2026.md](REVENUE_MASTER_PLAN_2026.md).

---

## 4. Plan C — Modelo propio in-house (DINOv2 + pipeline)

**Trigger**: Plan B falla (Petify no negocia) Y volumen ≥ 10.000 mascotas Shield.

**Estado actual del Plan C** (memoria 2026-04-27):
- DINOv2-large probado: gap 0.445 (insuficiente).
- Fine-tune NO mejoró.
- SigLIP2-base mean 0.923 (mejor pero aún borderline).
- Outreach 13 refugios chilenos enviado 2026-04-27 para ampliar dataset entrenamiento.

**Necesario para activar**:

1. **Dataset propio ≥ 1.000 pares** (foto-pet_id) con consent ARCO.
   - Fuente: archive `paw_shield_data_archive` con consent opt-in (ya existe).
   - Tiempo estimado para alcanzar 1k pares: 6-9 meses post-launch con cohorte Paw Member real.

2. **Modelo entrenado** con ≥ 0.85 cosine similarity intra-pet.
   - Iteraciones DINOv2-large fine-tune con dataset propio.
   - Comparar vs SigLIP2-base + ConvNeXt-V2.

3. **Pipeline edge fn** para enrollment + identify usando modelo propio.
   - Edge fn `paw-shield-register` recibe foto, extrae embedding propio, guarda en `nose_print_embeddings` (ya existe schema).
   - Edge fn `paw-shield-identify` busca cosine match en pgvector HNSW (ya existe infra).

**Tiempo estimado migración**: 3-6 meses entre cuando empezamos training y switchear traffic.

**Costos Plan C**:
- Training: USD 200-500 (Hugging Face GPU spot).
- Hosting modelo: USD 50-100/mes (HF Inference Endpoints o Replicate).
- Dev: 80-120 horas founder + IA = USD ~5-10k valor capitalizable.

**Margen vs Petify**: si volumen es 10k mascotas Shield, Petify cuesta ~$7.5k/mes. Plan C cuesta ~$100/mes infra. **Ahorro mensual: ~$7.4k = USD 89k/año**.

---

## 5. Plan D — Híbrido (recomendado a escala media)

**Trigger**: Plan C entrenado pero con accuracy < Petify (probable inicio).

**Estrategia**:
- **Tier Paw Member**: usa Plan C (modelo propio) — accuracy "good enough" para anti-extravío. Costo $0/mes incremental.
- **Tier Manada**: usa Petify (modelo comercial) — accuracy premium para hogares power user. COGS solo Manada.
- **Free tier**: sin biometría (sin cambios).

**Impacto financiero a 100k MAU**:

| Tier | Mascotas Shield | Modelo | COGS USD/mes |
|---|---|---|---|
| Paw Member | 4.680 (30% × 13k) | Plan C propio | $0 |
| Manada | 1.200 (60% × 2k) | Petify | $900 |
| **Total** | **5.880** | | **$900/mes** vs $4.425 Plan A |

**Ahorro**: 80% de COGS biométrico a 100k MAU.

**Trade-off**: Paw Member tiene biometría con accuracy ligeramente menor. Si la diferencia es notable (ej: false negatives en encontrar mascota perdida), upgrade a Manada por accuracy premium.

**Comunicación al usuario**:
- Paw Member: "Identificación biométrica con tecnología propia Paw Friend".
- Manada: "Identificación biométrica premium con red global Petify".

---

## 6. Trigger criteria — cuándo activar cada plan

```
┌─────────────────────────────────────────────────────────┐
│ Volumen mascotas con Paw Shield activado                │
│                                                         │
│ < 5.000:    Plan A (statu quo Petify)                  │
│ 5.000-10.000: Plan A + iniciar conversación Petify     │
│ 10.000-20.000: Plan B (negociar) + Plan C en marcha    │
│ > 20.000:   Plan D (híbrido) si Plan B no logra <$0.40 │
└─────────────────────────────────────────────────────────┘
```

**Métrica para monitorear** (ya existe en AdminRevenueDashboard):
```sql
SELECT COUNT(*) AS shield_active_pets
FROM pets p
JOIN paw_shield_registrations psr ON psr.pet_id = p.id
WHERE psr.status = 'active';
```

Cuando supere 5k → alarma a Pedro.

---

## 7. Riesgo: Petify deja de operar / cambia ToS

**Probabilidad**: Baja-media (B2B SaaS pet-tech todavía emergente).

**Mitigaciones**:
1. **Plan C en marcha continua** (entrenamiento dataset propio, no esperar a urgencia).
2. **Backup raw photos** en `paw_shield_data_archive` ya implementado — permite re-procesar con cualquier modelo futuro.
3. **Cláusula contractual** con Petify (cuando firme contrato real): notice period 90 días + portabilidad de embeddings si es posible.
4. **Multi-vendor strategy**: evaluar Animo (UK), Pip Identity (US) como Plan E si surge necesidad.

---

## 8. Decisión inmediata para Pedro

**Acción ahora**:
- Mantener Plan A (statu quo) hasta launch.
- **Iniciar Plan C en paralelo**: continuar outreach refugios para ampliar dataset (5 refugios sin email pendientes DM Instagram según memoria).
- **Pre-firmar relación con Petify**: confirmar tier estándar, NO comprometer volumen aún.

**Próximas acciones (mes 6 post-launch)**:
- Si MAU ≥ 5k: agendar llamada con Johnny/Petify para conversación tier volumen (Plan B prep).
- Si dataset propio ≥ 500 pares: arrancar fine-tune con SigLIP2-base + ConvNeXt-V2 comparativos.

**Punto de no-retorno**:
- Mes 12 post-launch debe haber decisión tomada: Plan B firmado O Plan C entrenado a accuracy aceptable. Si ninguno, modelo financiero a 50k+ MAU se rompe.

---

## 9. Documentos relacionados

- [MODELO_FINANCIERO_2026_04_29.md](MODELO_FINANCIERO_2026_04_29.md) — sensibilidad Petify x2 modelado.
- [PAW_SHIELD_PLAYBOOK.md](PAW_SHIELD_PLAYBOOK.md) — playbook Paw Shield existente.
- [PAW_SHIELD_DATA_ARCHIVE.md](PAW_SHIELD_DATA_ARCHIVE.md) — spec del archive de fotos para entrenar modelo propio.
- Memoria [project_nose_print_master_plan](C:\Users\psusa\.claude\projects\c--Users-psusa-Desktop-pet-harmony-chile-main\memory\project_nose_print_master_plan.md) — estado real de modelos probados.

**Conclusión**: el riesgo COGS Petify es REAL pero gestionable con disciplina. Plan A funciona hasta 5-10k mascotas Shield. Después escalar Plan B/C/D progresivamente.

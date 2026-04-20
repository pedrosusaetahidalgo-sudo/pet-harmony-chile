# Deck audience toggle — CORFO vs VC pro-IA

> Origen: INIT-25 del [Plan de Éxito 90 días](../docs-raiz/planes/PLAN_EXITO_90D_20260420.md).
> Pedro pidió 2026-04-20: "No tan explícito apalancamiento IA, encuentra la mejor alternativa para ambos tipos de persona".
> Este doc define los 2 framings y el snippet JS para que `PRESENTACION.html` muestre uno u otro según `?audience=corfo|vc`.

---

## Dos audiencias, dos framings

### Variante A — **Pragmatic** (default, CORFO / Start-Up Chile / angels no-tech)

**Tono**: Founder sólido con herramientas modernas. Lo que se pide con el fondo es **equipo humano**.

**Slide "Apalancamiento" copy**:

> **De MVP a producto en 6 meses, con 1 fundador**
>
> Construí Paw Friend usando un stack moderno de ingeniería (TypeScript + Supabase + IA asistida de desarrollo) que permitió llegar al MVP con 502+ archivos, 41 edge functions y 188 migraciones en 6 meses.
>
> **Con el fondo, contrato equipo humano**: 2 developers + 1 comercial + 1 community manager. La infraestructura ya está; lo que se construye con capital es escala comercial, producto avanzado y soporte operacional 24/7.

**Stats que SÍ se muestran**:
- "502 archivos fuente | 41 edge functions | 188 migraciones SQL"
- "6 meses a MVP"
- "0 deuda técnica mayor"
- "Roadmap 90d ejecutándose semana a semana"

**Stats que NO se muestran**:
- "320 hrs vs 4.800 hrs equipo"
- "USD 720K-1.44M equivalente en horas"
- Ratios explícitos IA/humano

**Por qué**: CORFO y similares pueden percibir "voy a reemplazar equipo con IA" como riesgo de sostenibilidad (tooling externo que puede cambiar precio). Queremos que vean un founder eficiente que invertirá el fondo en gente.

---

### Variante B — **Performance** (VC pro-IA, Platanus, Magma, angels tech-forward)

**Tono**: Eficiencia extrema es ventaja competitiva. Menor burn + velocidad igualan a scorecard alto.

**Slide "Apalancamiento" copy**:

> **Founder + stack IA = 15× throughput, 32-65× costo reducido**
>
> 320 horas de founder asistidas con IA han producido output equivalente a ~4.800 horas de un equipo tradicional. Costo real: USD 4.800-9.600 en herramientas + tiempo founder. Costo de equipo equivalente: USD 720K-1.44M.
>
> Esto significa: con el mismo capital, Paw Friend itera 15× más rápido en features y tiene runway defendible vs competidores que queman presupuesto en equipo humano + infra sin diferenciación.

**Stats que SÍ se muestran**:
- "320 hrs fundador ≈ 4.800 hrs equipo"
- "USD 720K-1.44M valor construido con <USD 10k de herramientas"
- "15× throughput vs empresa tradicional en build phase"
- "Defensible moat: la proficiencia IA del founder no escala linealmente con capital"

**Stats que NO se muestran**:
- Framing "voy a contratar humano" (contradice el pitch).
- Referencias a equipo pequeño futuro (crea dudas de si la eficiencia se mantiene).

**Por qué**: VCs pro-IA como Platanus valoran explícitamente la productividad founder+IA. Para ellos este slide es "credenciales de capacidad", no un riesgo.

---

## Implementación del toggle en `PRESENTACION.html`

### Opción A — Snippet JS automático

Insertar antes del `</body>` de `PRESENTACION.html` el siguiente bloque. Detecta `?audience=corfo|vc` y muestra/oculta slides con `data-audience`.

```html
<script>
(function() {
  const params = new URLSearchParams(window.location.search);
  const audience = params.get('audience');

  // Default: pragmatic (corfo). VC activa solo con ?audience=vc.
  const mode = audience === 'vc' ? 'performance' : 'pragmatic';

  // Mostrar/ocultar slides según data-audience attribute.
  document.querySelectorAll('[data-audience]').forEach((el) => {
    const target = el.getAttribute('data-audience');
    el.style.display = target === mode ? '' : 'none';
  });

  // Indicador visible arriba (solo dev)
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;background:rgba(147,51,234,.9);color:white;padding:6px 12px;border-radius:8px;font-family:sans-serif;font-size:11px;letter-spacing:.05em;pointer-events:none';
  banner.textContent = 'MODE: ' + mode.toUpperCase();
  document.body.appendChild(banner);
  setTimeout(() => banner.style.transition = 'opacity .5s', 1000);
  setTimeout(() => banner.style.opacity = '0', 4000);
})();
</script>
```

### Cómo marcar los slides

Cada variante del slide "apalancamiento" debe tener `data-audience`:

```html
<!-- Variante PRAGMATIC (default) -->
<section class="slide" data-audience="pragmatic">
  <h2>De MVP a producto en 6 meses, con 1 fundador</h2>
  ...
</section>

<!-- Variante PERFORMANCE (solo ?audience=vc) -->
<section class="slide" data-audience="performance">
  <h2>Founder + stack IA = 15× throughput, 32-65× costo reducido</h2>
  ...
</section>
```

### URLs resultantes

- **Default (CORFO, angels no-tech)**:
  `https://pawfriend.cl/pitch/inversionistas.html`
  → muestra slide Pragmatic.

- **VC pro-IA**:
  `https://pawfriend.cl/pitch/inversionistas.html?audience=vc`
  → muestra slide Performance.

### Opción B — Duplicar archivos (más simple pero más duplicación)

Si prefieres cero JS:

- `pitch-inversionistas/PRESENTACION.html` → versión PRAGMATIC.
- `pitch-inversionistas/PRESENTACION_VC.html` → versión PERFORMANCE.

Pedro elige URL al enviar. Más simple de mantener, más archivos.

---

## Slides adicionales que cambian por audiencia

Además del slide de apalancamiento, valorar revisar en cada variante:

| Slide | Pragmatic | Performance |
|---|---|---|
| Traction | "X usuarios + Y vets pagando + Z donaciones" (números reales) | Agregar "growth rate semanal %", "LTV/CAC proxy" |
| Equipo | "Pedro Susaeta, CEO & founder único. Con fondo: contrato 3 FTE" | "Pedro Susaeta + stack de agentes IA. Plan: contratación híbrida según necesidad escalable" |
| Ask | "USD 100k SAFE @ cap 3M, 12m runway + equipo" | "USD 200k SAFE @ cap 4-6M, permite contratar key hires + acelerar growth IA-first" |
| Uso de fondos | "60% equipo · 20% marketing · 20% producto" | "30% equipo · 30% marketing · 40% infra IA + data science" |

---

## Checklist de actualización del deck (para próximo sprint)

Cuando haya tracción real post INIT-02 + INIT-09 + INIT-11:

- [ ] Reemplazar placeholders "[X usuarios]", "[$Y CLP MRR]" con números reales del admin.
- [ ] Insertar 2-3 quotes de testimoniales INIT-18 (ya sean vet o dueño).
- [ ] Logo primer Paw Company firmada (si aplica).
- [ ] Screenshot del widget North Star del admin como proof of instrumentation.
- [ ] Implementar snippet JS toggle (Opción A).
- [ ] Marcar 3-4 slides con `data-audience="pragmatic"` y/o `data-audience="performance"`.
- [ ] Probar ambas URLs antes de enviar.
- [ ] Actualizar `FUNDRAISING_TRACKER.md` con version del deck (v2-pragmatic / v2-performance).

---

## Regla de oro

Pedro: **nunca envíes VC a CORFO ni viceversa**. Una mala lectura de audiencia puede matar una postulación. Si dudas, manda Pragmatic — es neutral y funciona para ambos grupos, solo es menos impactante con VCs pro-IA.

La variante Performance es **solo** cuando sabes que la persona está en equipo con builders-AI-first (Platanus, Magma, YC, Kaszek) o han tuiteado positivo sobre founder-led AI leverage en el último año.

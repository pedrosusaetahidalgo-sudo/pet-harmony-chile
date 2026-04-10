# Embedded Analytics — Evaluacion de Opciones

> Comparativa tecnica para visualizacion dentro de la app.
> Fecha: 2026-04-10.

---

## 1. Contexto

Paw Friend necesita visualizaciones de datos embebidas en la app (web + Capacitor mobile). Las opciones van desde charts nativos hasta plataformas BI embebibles. La evaluacion prioriza: costo, experiencia mobile, facilidad de integracion, y percepcion premium.

---

## 2. Comparativa

### Opcion A: Recharts nativo (RECOMENDADA para V1)

| Aspecto | Evaluacion |
|---------|-----------|
| **Costo** | $0 — ya instalado en package.json |
| **Licencia** | MIT, libre |
| **Integracion** | Nativa — wrapper ya existe en `src/components/ui/chart.tsx` (shadcn) |
| **Performance** | Excelente — rendering client-side, sin llamadas externas |
| **Mobile (Capacitor)** | Funciona perfecto — SVG nativo, responsive |
| **Offline** | Si — datos locales via React Query cache |
| **Personalizacion** | Total — CSS/Tailwind, temas light/dark |
| **Seguridad** | Maxima — datos nunca salen del browser |
| **Export** | Requiere jsPDF + html2canvas (client-side) |
| **Escalabilidad** | Buena hasta ~1000 data points por chart |
| **Percepcion premium** | Alta — animaciones suaves, diseno consistente con la app |
| **Mantenimiento** | Bajo — sin servidor adicional, sin licencias |

**Veredicto**: Ideal para V1-V3. Cero costo, control total, funciona offline.

### Opcion B: Power BI Embedded

| Aspecto | Evaluacion |
|---------|-----------|
| **Costo** | ~$5 USD/usuario/mes (Power BI Embedded A1) o $10/usuario/mes (Pro) |
| **Licencia** | Microsoft 365, requiere Azure AD |
| **Integracion** | Compleja — requiere backend proxy para tokens, iframe embedding |
| **Performance** | Media — carga inicial lenta (2-4s), requiere internet |
| **Mobile (Capacitor)** | Problematica — iframes en WebView tienen limitaciones, touch interactions limitadas |
| **Offline** | No |
| **Personalizacion** | Limitada — temas Power BI, no se integra nativamente con Tailwind |
| **Seguridad** | Buena (RLS a nivel Power BI) pero requiere config Azure |
| **Export** | Nativa (PDF, Excel, CSV desde Power BI) |
| **Escalabilidad** | Excelente — datasets grandes, DAX queries |
| **Percepcion premium** | Media — se nota que es "embebido", no nativo |
| **Mantenimiento** | Alto — Azure AD, token refresh, sincronizacion de datos |

**Veredicto**: Overkill para el estado actual. Relevante solo si se necesitan dashboards complejos con >10 metricas cruzadas. Mala experiencia mobile.

### Opcion C: Metabase Embedded

| Aspecto | Evaluacion |
|---------|-----------|
| **Costo** | Gratis (self-hosted) o $85/mes (Cloud Pro) |
| **Licencia** | AGPL (self-hosted), comercial (Cloud) |
| **Integracion** | Media — iframe con JWT auth, requiere servidor Metabase |
| **Performance** | Media — depende del hosting, carga 2-3s |
| **Mobile (Capacitor)** | Problematica — iframes en WebView |
| **Offline** | No |
| **Personalizacion** | Media — CSS limitado, temas basicos |
| **Seguridad** | Buena con sandboxing JWT |
| **Export** | Nativa (CSV, PDF basico) |
| **Escalabilidad** | Buena |
| **Percepcion premium** | Media |
| **Mantenimiento** | Alto — servidor adicional, actualizaciones |

**Veredicto**: Buen middle-ground para equipos con ops. No viable para Paw Friend (no hay infra de servers dedicados).

### Opcion D: Grafana Embedded

| Aspecto | Evaluacion |
|---------|-----------|
| **Costo** | Gratis (self-hosted) o $8/usuario/mes (Cloud) |
| **Licencia** | AGPLv3 |
| **Integracion** | Iframe con auth proxy |
| **Performance** | Buena para time-series |
| **Mobile** | Problematica — diseñado para desktop |
| **Percepcion premium** | Baja — se ve como "herramienta de infra", no consumer app |

**Veredicto**: Orientado a observabilidad, no a consumer analytics. Descartado.

### Opcion E: Apache Superset

| Aspecto | Evaluacion |
|---------|-----------|
| **Costo** | Gratis (self-hosted), Preset.io ~$20/mes |
| **Integracion** | Iframe, requiere servidor |
| **Mobile** | Problematica |
| **Percepcion premium** | Media |

**Veredicto**: Similar a Metabase pero mas complejo. Descartado para V1.

---

## 3. Recomendacion

### V1 (ahora): Recharts nativo

- **Razon**: ya instalado, wrapper shadcn listo, cero costo, funciona perfecto en mobile/Capacitor, control total del diseno, offline-capable.
- **Charts implementados**: AreaChart (actividad), BarChart (comparativo), RadialBarChart (bienestar).
- **Export**: cuando se active, usar `jsPDF` + `html2canvas` para PDF y `json2csv` para CSV. Todo client-side, sin servidor adicional.

### V2 (futuro, si >5000 usuarios): Evaluar PostHog

- PostHog ofrece product analytics + dashboards embebibles.
- Plan gratuito generoso (1M eventos/mes).
- Mejor que Power BI para entender comportamiento de usuario.
- Se integra con React via SDK ligero.

### V3 (futuro, si vets piden reporteria avanzada): Considerar Metabase Cloud

- Solo para el segmento B2B (Clinica Pro).
- Embeber dashboards de Metabase via iframe con JWT.
- Mantener charts nativos para B2C (mejor UX mobile).

---

## 4. Decision de descarga/export

| Formato | Caso de uso | Tier | Implementacion |
|---------|------------|------|----------------|
| PDF | Reporte mensual formal (duenos y vets) | Premium | jsPDF + html2canvas (client-side) |
| CSV | Export operativo para analisis | Premium | json2csv (client-side) |
| Excel | No prioritario — CSV cubre el caso | Futuro | SheetJS si se necesita |
| Snapshot (imagen) | Compartir grafico en redes | Futuro | html2canvas |

---

## 5. Arquitectura de datos para BI

Los hooks `useProAnalytics` y `useVetAnalytics` retornan arrays de objetos planos, listos para:
- Renderizar con Recharts (actual)
- Serializar a CSV/JSON (export)
- Enviar a un endpoint de Supabase Edge Function (futuro API)
- Consumir desde Power BI / Metabase via conector Postgres directo a Supabase

No se necesita ETL adicional. Supabase Postgres ES la fuente de datos, y los hooks son la capa de transformacion.

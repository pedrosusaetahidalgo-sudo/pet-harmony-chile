# 06 — Análisis de costos

> Generado: 2026-04-10 | Versión: 1.0
> Costos mensuales en USD salvo que se indique otra moneda.

---

## Costos actuales (antes del plan)

| Servicio | Plan | Costo/mes |
|---|---|---|
| Supabase | Free | $0 |
| GitHub | Free (repo privado) | $0 |
| GitHub Pages | Free (hosting) | $0 |
| Anthropic API | Pay-as-you-go | ~$5-10 (spend cap pendiente confirmar) |
| Flow.cl | Comisión por transacción | Variable (% de ventas) |
| Dominio pawfriend.cl | Anual | ~$15/año ≈ $1.25/mes |
| **Total actual** | | **~$7-12/mes** |

---

## Costos con el plan implementado

### Servicios pagos

| Servicio | Plan | Costo/mes | Qué resuelve |
|---|---|---|---|
| **Supabase Pro** | Pro | **$25** | Backups diarios, PITR, 8 GB DB, 250 MB file uploads |
| Anthropic API | Pay-as-you-go | ~$5-10 | Sin cambio |
| Flow.cl | Comisión | Variable | Sin cambio |
| Dominio | Anual | ~$1.25 | Sin cambio |
| **Subtotal pagos** | | **~$32-37/mes** |

### Servicios free tier (costo $0)

| Servicio | Free tier | Límites relevantes | Cuándo se paga |
|---|---|---|---|
| **Sentry** | Free | 5K errors/mes, 1 user | >5K errors o >1 user: Team $26/mes |
| **PostHog** | Free | 1M eventos/mes, 5K replays/mes | >1M eventos: ~$0.00031/evento |
| **Helicone** | Free | 100K requests/mes | >100K req: $20/mes |
| **Axiom** | Free | 500 MB/mes ingest | >500 MB: $25/mes |
| **Betterstack Uptime** | Free | 10 monitores, 3 min intervalo | SMS alerts: $25/mes |
| **Resend** | Free | 100 emails/día, 3K/mes | >3K/mes: $20/mes |
| **GitHub Actions** | Free | 2K min/mes (privado), ilimitado (público) | >2K min: $0.008/min |
| **Firebase FCM** | Free | Ilimitado | Nunca (FCM es gratis) |
| **Cloudflare Pages** | Free | 500 builds/mes, BW ilimitado | >500 builds: $20/mes (Pro) |
| **Dependabot** | Free | Incluido en GitHub | Nunca |

---

## Escenarios de escala

### Escenario A: 100 usuarios activos/mes (actual + 3 meses)

| Servicio | Uso estimado | Costo |
|---|---|---|
| Supabase Pro | ~1 GB DB, ~50 MB storage | $25 |
| Sentry | ~500 errors/mes | $0 |
| PostHog | ~50K eventos/mes | $0 |
| Helicone | ~2K requests/mes | $0 |
| Axiom | ~50 MB/mes | $0 |
| Resend | ~300 emails/mes | $0 |
| Anthropic | ~$5/mes | $5 |
| **Total** | | **~$30/mes** |

### Escenario B: 1,000 usuarios activos/mes (6-12 meses)

| Servicio | Uso estimado | Costo |
|---|---|---|
| Supabase Pro | ~5 GB DB, ~500 MB storage | $25 |
| Sentry | ~3K errors/mes | $0 |
| PostHog | ~500K eventos/mes | $0 |
| Helicone | ~20K requests/mes | $0 |
| Axiom | ~200 MB/mes | $0 |
| Resend | ~2K emails/mes | $0 |
| Anthropic | ~$15/mes | $15 |
| **Total** | | **~$40/mes** |

### Escenario C: 5,000 usuarios activos/mes (12-18 meses)

| Servicio | Uso estimado | Costo |
|---|---|---|
| Supabase Pro | ~20 GB DB, ~2 GB storage | $25 (o upgrade a $599 si necesita más compute) |
| Sentry Team | ~15K errors/mes | $26 |
| PostHog | ~2M eventos/mes | ~$0.31 por 1M extra = $0.31 |
| Helicone | ~80K requests/mes | $0 |
| Axiom | ~400 MB/mes | $0 |
| Resend | ~8K emails/mes | $20 |
| Anthropic | ~$40/mes | $40 |
| **Total** | | **~$112/mes** |

---

## Comparación: costo de tooling vs costo de NO tenerlo

| Incidente | Costo estimado del incidente | Tooling que lo previene | Costo del tooling |
|---|---|---|---|
| Data breach por RLS rota | Pérdida total de confianza, posible multa legal | pgTAP tests + auditoría | $0 |
| Pérdida total de DB (sin backups) | Fin del producto | Supabase Pro | $25/mes |
| Pago procesado sin activar Premium | Pérdida de revenue + churn | Sentry en edge functions | $0 |
| Bug en producción no detectado por 3 días | 10-50 usuarios afectados | Sentry + Betterstack | $0 |
| Deploy roto que tumba pawfriend.cl | Downtime hasta detección manual (~horas) | CI/CD + Betterstack | $0 |
| Factura sorpresa de Anthropic ($500) | Costo directo | Helicone con alertas | $0 |
| Decisiones de producto sin data | Meses de desarrollo en features que nadie usa | PostHog | $0 |

**Conclusión**: USD 25/mes (Supabase Pro) es el único costo duro. Todo lo demás es gratis y previene incidentes que podrían costar el producto entero.

---

## ROI del plan

| Inversión | Valor |
|---|---|
| Costo mensual adicional | USD 25 (Supabase Pro) |
| Horas de implementación (8 semanas) | ~80-100 horas |
| Costo de oportunidad | Features no construidas durante 8 semanas |
| **Retorno** | |
| Backups de datos de ~80 tablas | Protección contra pérdida total |
| Detección automática de errores | ~20 horas/mes ahorradas en debugging manual |
| Métricas de producto reales | Decisiones de producto data-driven |
| Deploy automático sin errores | ~2 horas/semana ahorradas + 0 deploys rotos |
| Confianza para refactors | Hacer cambios sin miedo a romper producción |

---

*Ver `07_CHECKLIST_PRODUCCION.md` para la checklist de producción.*

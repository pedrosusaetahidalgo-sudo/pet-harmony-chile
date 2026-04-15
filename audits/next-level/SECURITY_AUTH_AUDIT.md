# SECURITY_AUTH_AUDIT.md — Registro de Riesgos de Seguridad — Paw Friend
<!-- Auditoria generada: 2026-04-14 | Agentes paralelos: 5 -->

## Resumen ejecutivo

Se identificaron 16 items de seguridad. 2 riesgos P0 nuevos encontrados en esta sesion. 6 items resueltos en sesiones anteriores. Los riesgos restantes mas urgentes son: rotacion de keys (manual, owner), fix del bypass logico en log-error, y hardening de CORS en send-whatsapp-reminder.

---

## Registro de riesgos — 16 items

### #1 — Open redirect bypass via `//evil.com`

| Campo | Valor |
|---|---|
| Severidad | Critica — P0 |
| Estado | FIX APLICADO en sesion 2026-04-14 |
| Descripcion | El fix basico de open redirect bloqueaba `http://evil.com` pero no `//evil.com`. Los browsers tratan `//evil.com` como URL relativa al protocolo actual (https://evil.com). Un atacante podia usar `?redirect=//evil.com` para redirigir usuarios a sitios maliciosos post-login. |
| Fix aplicado | Regex `/^\/[^\/]/` — solo acepta paths que empiezan con `/` seguido de un caracter que no sea `/` |
| Accion restante | Verificar que el fix se aplique en TODOS los puntos de redirect post-login en la app |

### #2 — log-error: bypass de auth via `includes(supabaseAnonKey)`

| Campo | Valor |
|---|---|
| Severidad | Alta — P0 |
| Estado | PENDIENTE |
| Descripcion | La funcion `log-error` agrego autenticacion en una sesion anterior, pero la verificacion usa `authHeader.includes(supabaseAnonKey)`. Un atacante puede construir un header que incluya la anon key como substring y pasar la verificacion sin ser el cliente real. La anon key es publica (se expone en el frontend). |
| Fix recomendado | Comparar el header completo con igualdad estricta (`=== `Bearer ${supabaseAnonKey}``) o mejor aun, verificar el JWT del usuario con `verify_jwt=true` y aceptar solo solicitudes autenticadas. |
| Impacto | Un atacante puede saturar los logs con entradas falsas, contaminando el sistema de monitoreo. |

### #3 — CORS bereavement-assistant wildcard

| Campo | Valor |
|---|---|
| Severidad | Media |
| Estado | FIJO — sesion anterior |
| Descripcion | CORS ahora especifica origenes permitidos. |

### #4 — CORS log-error wildcard

| Campo | Valor |
|---|---|
| Severidad | Media |
| Estado | FIJO — sesion anterior |

### #5 — CORS generate-sitemap wildcard

| Campo | Valor |
|---|---|
| Severidad | Baja |
| Estado | ACEPTABLE |
| Descripcion | generate-sitemap es de solo lectura publica. El wildcard es correcto — cualquier cliente puede pedir el sitemap. No hay datos sensibles. |

### #6 — CORS send-whatsapp-reminder wildcard

| Campo | Valor |
|---|---|
| Severidad | Media |
| Estado | PENDIENTE |
| Descripcion | send-whatsapp-reminder deberia ser una funcion interna (invocada por reminder-cron o por el backend, nunca directamente por el browser del usuario). Con CORS wildcard, cualquier origen puede invocarla. |
| Fix recomendado | Cambiar a CORS restrictivo: solo permitir el dominio de Supabase interno o eliminar CORS completamente si la funcion solo se invoca server-side. |

### #7 — rate-limit.ts fail-open

| Campo | Valor |
|---|---|
| Severidad | Baja-Media |
| Estado | PENDIENTE (decision de arquitectura) |
| Descripcion | El rate limiter esta en modo fail-open: si la DB de rate limit no responde, las solicitudes pasan sin limitacion. |
| Recomendacion | Documentar como decision intencional (disponibilidad sobre seguridad) o evaluar fail-closed para funciones criticas como flow-create-subscription. |

### #8 — verify_jwt=false en todas las edge functions

| Campo | Valor |
|---|---|
| Severidad | Media |
| Estado | PENDIENTE — decision sistemica |
| Descripcion | Ninguna edge function tiene `verify_jwt=true` en `config.toml`. Esto significa que las funciones no validan automaticamente el JWT del usuario. La validacion se hace manualmente en cada funcion (o no se hace). |
| Implicacion | Las funciones que requieren autenticacion deben verificar el JWT manualmente. Funcion por funcion. |
| Recomendacion | Para funciones que requieren usuario autenticado, habilitar `verify_jwt=true` en config.toml. Afecta: generate-medical-summary, generate-vet-patient-summary, google-calendar-*, send-pet-invitation. |
| Funciones OK sin verify_jwt | generate-sitemap, breed-tips, pet-assistant (publicos), flow-webhook (usa firma Flow.cl). |

### #9 — RoleGuard solo en frontend

| Campo | Valor |
|---|---|
| Severidad | Informacional |
| Estado | POR DISENO — aceptable |
| Descripcion | RoleGuard es un componente React que solo protege la navegacion del browser. No hay validacion de rol en el backend para endpoints REST. |
| Por que es aceptable | Las politicas RLS de Supabase protegen los datos. Un usuario owner que acceda a rutas de provider solo vera sus propios datos filtrados por RLS. No hay datos de otros usuarios expuestos. |
| Validar | Que las politicas RLS en tablas de provider (patient records, appointments, etc.) filtren correctamente por el rol del usuario autenticado. |

### #10 — .env en working tree

| Campo | Valor |
|---|---|
| Severidad | Informacional |
| Estado | INFORMACIONAL — gitignored |
| Descripcion | `.env` esta en `.gitignore`. La anon key de Supabase es publica por diseno (se usa en el frontend). Las claves sensibles (service_role, Flow secret, etc.) no estan en el codigo fuente. |
| Accion pendiente | Rotar las claves que estuvieron en el historial de git (ver #11 abajo). |

### #11 — Claves en historial de git — rotacion pendiente

| Campo | Valor |
|---|---|
| Severidad | Alta |
| Estado | PENDIENTE — accion manual del owner |
| Descripcion | En una sesion anterior (2026-04-11), una clave fue bloqueada por GitHub Push Protection. Aunque el commit fue revertido, la clave puede estar en el historial. |
| Accion requerida | 1. Rotar Supabase service_role key desde Supabase Dashboard. 2. Rotar Google OAuth client secret. 3. Verificar si hay otras claves en el historial con `git log -p | grep -E '(key|secret|token)='`. 4. Considerar `git filter-repo` si las claves sensibles persisten en historial. |

### #12 — No hay secretos hardcodeados en src/

| Campo | Valor |
|---|---|
| Severidad | — |
| Estado | LIMPIO |
| Descripcion | Auditoria de `src/` confirma 0 API keys, tokens, o secretos hardcodeados. Todo usa variables de entorno o secrets de Supabase. |

### #13 — dangerouslySetInnerHTML en chart.tsx

| Campo | Valor |
|---|---|
| Severidad | Baja |
| Estado | ACEPTABLE |
| Descripcion | `chart.tsx` (shadcn/ui) usa dangerouslySetInnerHTML para inyectar estilos CSS de Recharts. El contenido es generado internamente por la libreria, no por input de usuario. XSS no es posible en este contexto. |

### #14 — RLS en migraciones nuevas (20260515)

| Campo | Valor |
|---|---|
| Severidad | — |
| Estado | LIMPIO |
| Descripcion | Las 3 migraciones de la sesion 2026-04-14 (vet_quick_notes, feedback_in_app, core_action_missions) tienen politicas RLS correctas verificadas por el agente de seguridad. |

### #15 — /panel-pro sin RoleGuard

| Campo | Valor |
|---|---|
| Severidad | — |
| Estado | INTENCIONAL |
| Descripcion | La ruta /panel-pro no tiene RoleGuard porque ProDashboard.tsx maneja internamente la logica de mostrar contenido segun el rol. Correcto. |

### #16 — Google Maps API key — restriccion de referrer

| Campo | Valor |
|---|---|
| Severidad | Media |
| Estado | VERIFICAR |
| Descripcion | Si se usa Google Maps API key en el frontend, debe estar restringida por referrer a `pawfriend.cl` desde la Google Cloud Console. Sin esta restriccion, la key puede ser usada por terceros. |
| Accion | Verificar en Google Cloud Console que la key tenga restriccion de referrer HTTP. |

---

## Acciones prioritarias — ordenadas

| # | Accion | Urgencia | Responsable |
|---|---|---|---|
| 1 | Rotar claves Supabase + Google (ver #11) | URGENTE — manual | Owner (Pedro) |
| 2 | Fix log-error bypass logico (ver #2) | Alta | Dev |
| 3 | Hardening CORS send-whatsapp-reminder (ver #6) | Media | Dev |
| 4 | Verificar Google Maps key con restriccion de referrer (ver #16) | Media | Owner |
| 5 | Habilitar verify_jwt=true en funciones criticas (ver #8) | Media | Dev |
| 6 | Verificar filtro explicito user_id en appointments query | Media | Dev |

---

## Notas sobre el modelo de seguridad

### Por que verify_jwt=false no es catastrofico hoy

Supabase RLS protege los datos a nivel de base de datos. Incluso si un cliente no autenticado llega a una edge function sin verify_jwt, las consultas a Supabase desde la funcion usando el JWT del usuario solo retornaran datos permitidos por RLS. El riesgo es que funciones de escritura (insertar logs falsos, enviar emails) pueden ser invocadas sin autenticacion.

### Modelo de confianza actual

```
Browser -> Edge Function (sin verify_jwt) -> Supabase (con RLS)
```

El punto de defensa es RLS en Supabase, no la edge function. Correcto para la mayoria de casos, pero insuficiente para funciones que ejecutan efectos secundarios (envio de emails, WhatsApp, pagos).

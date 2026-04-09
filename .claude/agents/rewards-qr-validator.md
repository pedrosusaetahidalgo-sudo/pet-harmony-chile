# Rewards QR Validator

> ESTADO: ACTIVAR CUANDO EXISTA. Este agente valida el sistema completo de Paw Rewards QR que se implementara en fases futuras del mega prompt.

## Estado actual (2026-04-11)

Hoy existen componentes parciales del sistema de gamificacion:
- Tabla `paw_point_transactions` -- Registro de transacciones de puntos
- Tabla `user_guardian_progress` -- Progreso del usuario en gamificacion
- Trigger de reconciliacion (`20260418000000_paw_points_trigger.sql`)
- `src/hooks/useGamification.tsx` -- Hook de gamificacion
- `src/hooks/useOrganicRewards.ts` -- Hook de recompensas organicas
- `src/lib/gamification.ts`, `src/lib/points.ts`, `src/lib/levels.ts` -- Logica de puntos y niveles
- `src/components/pawgame/` -- Componentes del mini-juego
- `qrcode.react` en dependencias (para generar QR)

Lo que **NO existe** todavia:
- `partner_locations` (tabla de locales asociados)
- Ledger completo de canjes
- Flujo de canje presencial con QR
- Validacion de QR por parte del comercio
- Edge function de canje

## Que hacer si se invoca este agente

1. Verificar si las tablas `partner_locations`, `reward_redemptions` (o similar) existen en migraciones.
2. Verificar si existe edge function de canje QR en `supabase/functions/`.
3. Si NO existen: reportar estado actual ("el sistema completo de Paw Rewards QR aun no esta implementado. Existen los componentes parciales listados arriba.") y salir.
4. Si SI existen: proceder con la validacion completa:

### Validacion completa (cuando exista)

- **Integridad del ledger**: verificar que puntos otorgados - puntos canjeados = saldo actual.
- **QR seguridad**: verificar que el QR tiene firma o token temporal (no un ID plano).
- **Expiracion**: verificar que los QR tienen TTL.
- **Doble canje**: verificar que hay proteccion contra canje duplicado del mismo QR.
- **Limites**: verificar que hay limites de canjes por periodo.
- **Reconciliacion**: verificar que el trigger de reconciliacion funciona correctamente.

## Archivos a revisar

- `supabase/migrations/*paw_points*` o `*rewards*`
- `src/hooks/useGamification.tsx`
- `src/hooks/useOrganicRewards.ts`
- `src/lib/gamification.ts`, `src/lib/points.ts`, `src/lib/levels.ts`
- `src/components/pawgame/`
- Cualquier nueva edge function con "rewards", "redeem", "qr" en el nombre

## Reglas

- NO modificar archivos. Solo leer y reportar.
- Si el sistema completo no existe, decirlo claramente y no inventar hallazgos.

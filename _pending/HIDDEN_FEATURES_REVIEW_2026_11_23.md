# Features Escondidas — Revisión 2026-11-23 (+6 meses post-refactor)

> **Propósito**: lista de features que se escondieron con feature flag durante el refactor maestro (Plan 2026-04-23) para revisar tras 6 meses de uso post-refactor. Cada feature se evalúa para **eliminar definitivamente** (borrar código + tablas) o **reactivar** si demostró valor latente.
>
> **Fecha revisión**: 2026-11-23 (6 meses post inicio refactor)
> **Owner**: Pedro
> **Criterios de decisión**:
> - Si >5% de usuarios activos la usaron o preguntaron por ella → evaluar reactivar
> - Si <1% y sin tracción → eliminar definitivamente
> - Si 1–5% → mantener escondida 6 meses más, decidir en 2027-05-23
>
> **Referencia**: [Plan Maestro §2.10.3 Ritual mensual de limpieza](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md) y [§9.0.4 Features escondidas ≠ data eliminada](../docs-raiz/planes/REFACTOR_MAESTRO_2026_04_23.md).

---

## Features a revisar

### 1. Feed social (posts, comments, likes, follows)

- **Feature flag**: `FEED`
- **Tablas involucradas**: `posts`, `post_comments`, `post_likes`, `post_saves`, `user_follows`, `content_reports`
- **Código afectado**: `src/pages/Feed.tsx`, `src/components/feed/*`, `src/hooks/useFeed*.ts`
- **Estado al 2026-04-23**: flag `false`, código presente, data histórica
- **Preguntas a responder 2026-11-23**:
  - ¿Cuántos posts existen en prod?
  - ¿Último post cuándo fue?
  - ¿Algún usuario preguntó por feed en feedback?
  - ¿Alguna feature del plan terminó necesitando feed (ej: memorial viral, insights públicos)?
- **Decisión a tomar**: eliminar | mantener oculto | reactivar con rediseño

### 2. Chat

- **Feature flag**: `CHAT`
- **Tablas**: `conversations`, `messages`, `chat_conversations`, `chat_messages`
- **Código**: `src/pages/Chat.tsx`, `src/components/chat/*`
- **Estado**: flag `false`, feature nunca se completó
- **Decisión probable**: eliminar — reemplazable con WhatsApp link directo

### 3. Marketplace B2C (carrito, orders)

- **Feature flag**: `MARKETPLACE`
- **Tablas**: `orders`, `order_items`, `cart_items`, `advertisements`, `partners`, `partner_submissions`
- **Estado**: flag `false`
- **Decisión probable**: eliminar marketplace B2C — retail fulfillment en Fase 2 es distinto modelo

### 4. Paseos compartidos

- **Feature flag**: `SHARED_WALKS`
- **Tablas**: `shared_walks`, `shared_walk_participants`, `walk_routes`, `walk_bookings`, `walk_reports`, `walk_reviews`
- **Estado**: flag `false`
- **Decisión probable**: eliminar — fuera del foco trinidad

### 5. Dogsitter flow completo

- **Tablas**: `dogsitter_profiles`, `dogsitter_bookings`, `dogsitter_messages`, `dogsitter_reports`, `dogsitter_reviews`
- **Estado**: perfil activo como legacy, booking/reviews en desuso
- **Decisión probable**: mantener perfil activo via `service_providers`, eliminar tablas `dogsitter_*` específicas

### 6. Training booking completo

- **Tablas**: `training_bookings`, `training_reports`, `training_reviews`, `trainer_profiles`
- **Estado**: similar dogsitter
- **Decisión probable**: similar dogsitter

### 7. Mascotas perdidas como sección propia

- **Feature flag**: `LOST_PETS_SECTION`
- **Tabla**: `lost_pets`
- **Estado**: flag `false`, integrado en mapa
- **Decisión probable**: mantener mapa, eliminar sección propia, mantener tabla (útil para Paw Passport memorial)

### 8. Lugares pet-friendly

- **Feature flag**: `MAP_PET_FRIENDLY`
- **Tabla**: `places`
- **Estado**: flag `false`, data hardcoded
- **Decisión probable**: si pgvector + partners integrados en Fase 2 aportan places reales → reactivar. Si no → eliminar.

### 9. Gamificación masiva (20 tablas)

- **Tablas**: `achievements`, `activities`, `daily_challenges`, `guardian_levels`, `missions`, `paw_badges`, `paw_card_collections`, `paw_game_monthly_rankings`, `paw_missions`, `paw_shop_rewards`, `pet_activities`, `pet_activity_cheers`, `pet_paw_progress`, `points_history`, `rewards`, `user_achievements`, `user_activities`, `user_challenges`, `user_guardian_progress`, `user_mission_progress`, `user_missions`, `user_paw_badges`, `user_rewards`, `user_shop_redemptions`
- **Estado**: data parcial, feature ocultado post-refactor
- **Decisión**: mantener 3 tablas canónicas (`paw_point_transactions`, `paw_badges`, `user_paw_badges`), eliminar el resto si tienen <100 filas. Auditar en detalle.

### 10. Tablas huérfanas (sin uso en código)

- `comprehensive_medical_records` (renombrada `_deprecated` en Fase 0)
- `vet_pet_relationships` (renombrada `_deprecated`)
- `points_history` (renombrada `_deprecated`)
- `virtual_routes` (renombrada `_deprecated`)
- `activities` (investigar si duplica `pet_activities`)
- **Decisión probable 2026-11-23**: si 6 meses con `_deprecated` y código no las toca → `DROP TABLE` definitivo

---

## Proceso de revisión 2026-11-23

1. **Inventario con numeración real**: para cada tabla, ejecutar `SELECT COUNT(*) FROM tabla;` y `SELECT MAX(created_at) FROM tabla;`
2. **Grep de código**: `grep -rln "tabla_name" src/` para confirmar uso real
3. **Data sample**: si <100 filas, revisar manualmente si son test/real
4. **Decisión por tabla**: ELIMINAR / MANTENER OCULTO / REACTIVAR
5. **Migración de backup**: antes de drops masivos, snapshot final en caso de restore
6. **Ejecutar drops**: migración `20261123000000_drop_deprecated_tables.sql` con smoke test
7. **Actualizar types.ts**: regenerar
8. **Cerrar este documento**: agregar changelog de decisiones tomadas

---

## Changelog

| Fecha | Evento |
|---|---|
| 2026-04-23 | Documento creado por Claude durante plan refactor maestro |
| 2026-11-23 (pendiente) | Revisión primera, decisiones |

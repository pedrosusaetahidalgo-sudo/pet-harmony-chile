/**
 * Constantes y helpers del sistema de donaciones.
 *
 * IMPORTANTE: DONATIONS_GOAL_CLP debe estar sincronizado con la constante
 * hardcoded en supabase/migrations/20260606000000_donations_goal_and_user_stats.sql
 * (funcion get_donations_goal_progress). Si cambia, actualizar ambos lugares.
 */

export const DONATIONS_GOAL_CLP = 20_000_000;

export const DONATIONS_CONTACT_EMAIL = 'pedrosusaeta@pawfriend.cl';

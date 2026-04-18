import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isFeatureEnabled, type FeatureFlag } from '@/lib/featureFlags';

interface FeatureGuardProps {
  /** Feature flag key (ej: 'FEED', 'CHAT', 'LOST_PETS_SECTION'). */
  flag: FeatureFlag;
  /** Ruta a donde redirigir si la flag esta desactivada. Default: /home. */
  fallback?: string;
  children: ReactNode;
}

/**
 * Guard de ruta por feature flag (2026-04-19, P2 #12).
 *
 * Si la flag esta activada, renderiza `children`. Si no, redirige al fallback.
 * Uso tipico: envolver rutas que pueden estar deshabilitadas en el modelo
 * actual pero se conservan en el codebase para reactivar en el futuro
 * (ej: /feed, /chat, /comunidad con FEED/CHAT/LABS_COMMUNITY=false).
 *
 * Beneficios:
 * - Previene que usuarios lleguen a paginas vacias por deeplink directo.
 * - Permite toggle instantaneo via featureFlags.ts (reactivar sin cambiar
 *   rutas).
 * - Mantiene el codigo de las features disabled accesible para desarrollo.
 */
export function FeatureGuard({ flag, fallback = '/home', children }: FeatureGuardProps) {
  if (!isFeatureEnabled(flag)) {
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

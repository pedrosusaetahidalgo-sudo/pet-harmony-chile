/**
 * ============================================================================
 * Audit Export System — Paw Friend
 * ============================================================================
 *
 * Genera un .xlsx con multiples sheets representando tablas del sistema,
 * mas un Data Quality Report con checks de integridad.
 *
 * ## Guia para agentes IA
 *
 * Este archivo esta disenado para ser facilmente modificable por un agente:
 *
 * 1. **Agregar/quitar sheets**: editar el array `SHEET_DEFINITIONS` (linea ~50).
 *    Cada entry define tabla, columnas, nombre del sheet, y campo de fecha.
 *    El sistema genera automaticamente el sheet a partir de la definicion.
 *
 * 2. **Agregar/quitar DQ checks**: editar el array `QUALITY_CHECK_DEFINITIONS` (linea ~140).
 *    Cada entry tiene nombre, query builder, y logica de severidad.
 *
 * 3. **Cambiar visibilidad de un sheet**: poner `enabled: false` en su definicion.
 *
 * 4. **Cambiar orden de sheets**: reordenar entries en SHEET_DEFINITIONS.
 *
 * 5. **Filtrar columnas sensibles**: agregar regex a REDACTED_KEY_PATTERNS.
 *
 * NO es necesario tocar la funcion `generateAuditExport` para cambios normales.
 * ============================================================================
 */
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { BREEDS_BY_SPECIES } from '@/lib/breeds';
import { COMUNAS_SANTIAGO } from '@/lib/locations';

// ── Types ──────────────────────────────────────────────────
export type ExportType = 'full' | 'period';

export interface ExportFilters {
  from_date?: string;
  to_date?: string;
}

export interface QualityCheck {
  name: string;
  result: string;
  severity: 'ok' | 'warn' | 'error';
  detail: string;
}

interface SheetResult {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  error?: string;
  truncated?: boolean;
}

const FETCH_LIMIT = 10000;

// ── Sheet Definitions (CONFIGURABLE) ───────────────────────
//
// Agente: para agregar un sheet, agrega un objeto aqui.
// Para ocultarlo, pon `enabled: false`.
// Para cambiar columnas, edita `select`.
//
interface SheetDefinition {
  /** ID unico interno */
  id: string;
  /** Nombre visible en el Excel */
  sheetName: string;
  /** Nombre de la tabla en Supabase */
  table: string;
  /** Columnas a exportar (formato PostgREST select). '*' = todas */
  select: string;
  /** Campo usado para filtro por periodo. null = no filtrar por fecha */
  dateField: string | null;
  /** Si es false, no se incluye en el export */
  enabled: boolean;
  /** Descripcion para el sheet README */
  description: string;
  /** Transformacion opcional post-fetch */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform?: (rows: any[]) => any[];
}

export const SHEET_DEFINITIONS: SheetDefinition[] = [
  {
    id: 'profiles',
    sheetName: 'Usuarios',
    table: 'profiles',
    select:
      'id, display_name, location, is_premium, is_admin, is_demo, level, points, plan_id, premium_plan, created_at, updated_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Perfiles de usuarios registrados',
  },
  {
    id: 'pets',
    sheetName: 'Mascotas',
    table: 'pets',
    select:
      'id, name, species, breed, gender, birth_date, weight, neutered, microchip_number, lifecycle_status, owner_id, created_by_vet_id, paw_card_id, vaccination_status, created_at, updated_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Todas las mascotas registradas',
  },
  {
    id: 'medical_records',
    sheetName: 'Fichas_Medicas',
    table: 'medical_records',
    select:
      'id, pet_id, owner_id, record_type, title, date, description, diagnosis, treatment, vet_name, clinic_name, batch_number, serial_number, antiparasitic_type, product_brand, next_date, created_at',
    dateField: 'date',
    enabled: true,
    description: 'Registros medicos (consultas, vacunas, antiparasitarios, etc.)',
    transform: (rows) =>
      rows.map((r) => ({
        ...r,
        treatment: r.treatment ? JSON.stringify(r.treatment) : null,
      })),
  },
  {
    id: 'service_providers',
    sheetName: 'Proveedores',
    table: 'service_providers',
    select:
      'id, user_id, display_name, business_name, provider_type, primary_service_type, status, commune, city, is_verified, is_directory_visible, is_featured, avg_rating, total_reviews, total_services_completed, provider_plan, experience_years, license_number, slug, is_demo, created_at, updated_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Veterinarios y profesionales registrados',
  },
  {
    id: 'bookings',
    sheetName: 'Reservas',
    table: 'bookings',
    select:
      'id, user_id, provider_id, pet_id, service_type, status, payment_status, total_price, notes, booked_at, confirmed_at, completed_at, cancelled_at',
    dateField: 'booked_at',
    enabled: true,
    description: 'Reservas de servicios',
  },
  {
    id: 'payment_history',
    sheetName: 'Pagos',
    table: 'payment_history',
    select:
      'id, user_id, payment_type, description, amount, net_amount, commission, status, payment_method, payment_reference, completed_at, refunded_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Historial de pagos Flow.cl',
  },
  {
    id: 'provider_subscriptions',
    sheetName: 'Suscripciones_B2B',
    table: 'provider_subscriptions',
    select:
      'id, user_id, provider_id, plan_id, price, status, billing_cycle, current_period_start, current_period_end, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Suscripciones de proveedores (planes B2B)',
  },
  {
    id: 'service_reviews',
    sheetName: 'Resenas',
    table: 'service_reviews',
    select: '*',
    dateField: 'created_at',
    enabled: true,
    description: 'Resenas de servicios',
  },
  {
    id: 'pet_reminders',
    sheetName: 'Recordatorios',
    table: 'pet_reminders',
    select:
      'id, pet_id, owner_id, title, description, due_date, type, is_recurring, recurrence_interval, is_completed, completed_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Recordatorios de mascotas',
  },
  {
    id: 'posts',
    sheetName: 'Posts_Feed',
    table: 'posts',
    select: 'id, user_id, content, image_url, likes_count, comments_count, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Posts del feed social',
  },
  {
    id: 'adoption_posts',
    sheetName: 'Adopciones',
    table: 'adoption_posts',
    select:
      'id, user_id, pet_name, species, breed, age_years, age_months, gender, size, description, location, status, photos, views_count, interests_count, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Posts de adopcion',
  },
  {
    id: 'paw_point_transactions',
    sheetName: 'Paw_Points',
    table: 'paw_point_transactions',
    select:
      'id, user_id, points_amount, transaction_type, source_type, source_id, description, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Transacciones de Paw Points (gamificacion)',
  },
  {
    id: 'community_groups',
    sheetName: 'Comunidades',
    table: 'community_groups',
    select:
      'id, name, slug, description, category, group_type, is_public, member_count, created_by, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Grupos de comunidad',
  },
  {
    id: 'platform_config',
    sheetName: 'Config_Sistema',
    table: 'platform_config',
    select: 'config_key, config_value, description, updated_at',
    dateField: null, // no filtrar por fecha
    enabled: true,
    description: 'Configuracion del sistema (keys sensibles redactadas)',
    transform: (rows) => {
      const BLOCKED = /key|secret|token|password|api_key/i;
      return rows.map((r) => ({
        config_key: r.config_key,
        config_value: BLOCKED.test(r.config_key)
          ? '[REDACTED]'
          : typeof r.config_value === 'object'
            ? JSON.stringify(r.config_value)
            : r.config_value,
        description: r.description,
        updated_at: r.updated_at,
      }));
    },
  },
  {
    id: 'subscriptions',
    sheetName: 'Suscripciones_B2C',
    table: 'subscriptions',
    select:
      'id, user_id, plan_type, status, start_date, end_date, payment_amount_clp, auto_renew, cancelled_at, cancellation_reason, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Suscripciones Premium B2C (Flow.cl)',
  },
  {
    id: 'orders',
    sheetName: 'Ordenes',
    table: 'orders',
    select:
      'id, user_id, order_number, subtotal_clp, platform_fee_clp, total_clp, payment_method, payment_status, paid_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Ordenes de pago (incluye webpay legacy)',
  },
  {
    id: 'vet_bookings',
    sheetName: 'Consultas_Vet',
    table: 'vet_bookings',
    select:
      'id, owner_id, vet_id, pet_id, scheduled_date, service_type, status, is_emergency, total_price, payment_status, canceled_at, cancellation_reason, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Reservas veterinarias (flow vet domicilio)',
  },
  {
    id: 'content_reports',
    sheetName: 'Reportes_Contenido',
    table: 'content_reports',
    select:
      'id, post_id, reporter_id, reason, status, admin_notes, reviewed_by, reviewed_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Denuncias de contenido del feed (moderacion)',
  },
  {
    id: 'error_logs',
    sheetName: 'Errores',
    table: 'error_logs',
    select:
      'id, source, severity, message, context, user_id, resolved, resolved_at, resolved_by, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Log centralizado de errores (frontend + edge functions)',
  },
  {
    id: 'feedback_in_app',
    sheetName: 'Feedback_Usuarios',
    table: 'feedback_in_app',
    select:
      'id, user_id, type, description, route, role, status, admin_notes, app_rating, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Feedback in-app (bugs, ideas, experiencias, rating)',
  },
  {
    id: 'verification_requests',
    sheetName: 'Verificaciones',
    table: 'verification_requests',
    select: 'id, user_id, requested_role, status, notes, reviewed_by, reviewed_at, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Solicitudes de verificacion de roles',
  },
  {
    id: 'partner_submissions',
    sheetName: 'Partners_Solicitudes',
    table: 'partner_submissions',
    select:
      'id, categoria, nombre_negocio, nombre_contacto, email, telefono, website, comuna, ciudad, status, notas_admin, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Solicitudes de ingreso como partner',
  },
  {
    id: 'partners',
    sheetName: 'Partners_Activos',
    table: 'partners',
    select:
      'id, brand_name, ad_text, ad_link, placement, category, is_active, impressions, clicks, priority, start_date, end_date, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Anuncios de partners activos (ads)',
  },
  {
    id: 'admin_audit_log',
    sheetName: 'Audit_Log',
    table: 'admin_audit_log',
    select: 'id, admin_user_id, action, target_type, target_id, details, created_at',
    dateField: 'created_at',
    enabled: true,
    description: 'Registro de acciones admin (compliance)',
    transform: (rows) =>
      rows.map((r) => ({
        ...r,
        details: r.details ? JSON.stringify(r.details) : null,
      })),
  },
  {
    id: 'provider_availability_rules',
    sheetName: 'Horarios_Providers',
    table: 'provider_availability_rules',
    select:
      'id, provider_id, day_of_week, start_time, end_time, service_type, slot_duration_minutes, is_active, created_at',
    dateField: 'created_at',
    enabled: true,
    description:
      'Reglas de disponibilidad semanal (booking V2) — indica que providers tienen horarios configurados.',
  },
  {
    id: 'provider_availability_exceptions',
    sheetName: 'Horarios_Excepciones',
    table: 'provider_availability_exceptions',
    select:
      'id, provider_id, exception_date, exception_type, start_time, end_time, reason, created_at',
    dateField: 'exception_date',
    enabled: true,
    description: 'Bloqueos (vacaciones) y aperturas puntuales por encima de las reglas semanales.',
  },
  {
    id: 'user_roles',
    sheetName: 'Roles_Usuarios',
    table: 'user_roles',
    select: 'id, user_id, role, created_at',
    dateField: 'created_at',
    enabled: true,
    description:
      'Roles asignados (veterinarian/dogsitter/dog_walker/trainer/grooming/admin) — auditoria de accesos.',
  },
  {
    id: 'ai_usage',
    sheetName: 'Uso_IA',
    table: 'ai_usage',
    select: 'id, user_id, skill_name, calls_today, calls_total, last_called_at',
    dateField: 'last_called_at',
    enabled: true,
    description:
      'Uso de IA por usuario y skill (monitoreo de costos Anthropic/OpenAI + rate limits).',
  },
];

// ── Quality Check Definitions (CONFIGURABLE) ───────────────
//
// Agente: para agregar un check, agrega un objeto aqui.
// Para desactivarlo, pon `enabled: false`.
//
interface QualityCheckDefinition {
  id: string;
  name: string;
  enabled: boolean;
  run: () => Promise<QualityCheck>;
}

const QUALITY_CHECK_DEFINITIONS: QualityCheckDefinition[] = [
  {
    id: 'orphan_pets',
    name: 'Mascotas sin dueno ni email pendiente',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .is('owner_id', null)
        .is('pending_owner_email', null);
      const n = count ?? 0;
      return {
        name: 'Mascotas sin dueno ni email pendiente',
        result: `${n} encontradas`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Mascotas creadas por vet sin invitacion enviada' : 'OK',
      };
    },
  },
  {
    id: 'orphan_medical_records',
    name: 'Fichas medicas sin pet_id',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('medical_records')
        .select('id', { count: 'exact', head: true })
        .is('pet_id', null);
      const n = count ?? 0;
      return {
        name: 'Fichas medicas sin pet_id',
        result: `${n} encontradas`,
        severity: n > 0 ? 'error' : 'ok',
        detail: n > 0 ? 'Registros huerfanos — integridad referencial rota' : 'OK',
      };
    },
  },
  {
    id: 'stale_pending_providers',
    name: 'Proveedores pending >7 dias',
    enabled: true,
    run: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('created_at', sevenDaysAgo);
      const n = count ?? 0;
      return {
        name: 'Proveedores pending >7 dias',
        result: `${n} encontrados`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Revisar y aprobar o rechazar' : 'OK',
      };
    },
  },
  {
    id: 'stale_verification_requests',
    name: 'Verification requests pending >7 dias',
    enabled: true,
    run: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase
        .from('verification_requests')
        .select('id, requested_role, notes, created_at')
        .eq('status', 'pendiente')
        .lt('created_at', sevenDaysAgo);
      const rows = data ?? [];
      const n = rows.length;
      // Clasificar: junk (ruido claro) vs legitimate (requiere decision humana)
      const JUNK_RE = /^[a-z]{1,12}$|^(asd|qwe|test|prueba|jhq|wes|wed|hhh|bbb|yyy|ydu|wdw)/i;
      const junk = rows.filter((r) => {
        const txt = String(r.notes ?? '').trim();
        if (txt.length < 5) return true;
        if (!/\s/.test(txt) && JUNK_RE.test(txt)) return true;
        return false;
      }).length;
      const legit = n - junk;
      return {
        name: 'Verification requests pending >7 dias',
        result: `${n} pending (${junk} ruido auto-fixable, ${legit} requieren revision)`,
        severity: legit > 0 ? 'warn' : n > 0 ? 'ok' : 'ok',
        detail:
          legit > 0
            ? `Revisar desde Admin > Verificaciones. El auto-fixer ya purga los ${junk} junk en su proxima corrida.`
            : n > 0
              ? `Los ${junk} seran auto-rechazados en la proxima corrida de run_daily_auto_fixers().`
              : 'OK',
      };
    },
  },
  {
    id: 'stale_bookings',
    name: 'Reservas confirmadas sin cierre',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .is('completed_at', null)
        .is('cancelled_at', null);
      const n = count ?? 0;
      return {
        name: 'Reservas confirmadas sin cierre',
        result: `${n} encontradas`,
        severity: n > 5 ? 'warn' : 'ok',
        detail: n > 0 ? 'Reservas que nunca se completaron ni cancelaron' : 'OK',
      };
    },
  },
  {
    id: 'pending_payments',
    name: 'Pagos en estado pending',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('payment_history')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      const n = count ?? 0;
      return {
        name: 'Pagos en estado pending',
        result: `${n} encontrados`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Pagos que no se completaron — revisar con Flow' : 'OK',
      };
    },
  },
  {
    id: 'expired_premium',
    name: 'Usuarios premium con plan expirado',
    enabled: true,
    run: async () => {
      const now = new Date().toISOString();
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_premium', true)
        .lt('premium_expires_at', now);
      const n = count ?? 0;
      return {
        name: 'Usuarios premium con plan expirado',
        result: `${n} encontrados`,
        severity: n > 0 ? 'error' : 'ok',
        detail: n > 0 ? 'is_premium=true pero plan ya vencio' : 'OK',
      };
    },
  },
  {
    id: 'providers_no_slug',
    name: 'Proveedores verificados sin slug',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('service_providers')
        .select('id', { count: 'exact', head: true })
        .eq('is_verified', true)
        .is('slug', null);
      const n = count ?? 0;
      return {
        name: 'Proveedores verificados sin slug',
        result: `${n} encontrados`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'No tienen URL publica en directorio' : 'OK',
      };
    },
  },
  {
    id: 'providers_no_availability_rules',
    name: 'Providers aprobados sin reglas de horario',
    enabled: true,
    run: async () => {
      const { data: providers } = await supabase
        .from('service_providers')
        .select('id, display_name, primary_service_type')
        .eq('status', 'aprobado')
        .eq('is_directory_visible', true);
      const allProviderIds = (providers ?? []).map((p) => p.id);
      if (allProviderIds.length === 0) {
        return {
          name: 'Providers aprobados sin reglas de horario',
          result: '0 providers aprobados',
          severity: 'ok' as const,
          detail: 'OK',
        };
      }
      const { data: rules } = await supabase
        .from('provider_availability_rules')
        .select('provider_id')
        .eq('is_active', true)
        .in('provider_id', allProviderIds);
      const withRules = new Set((rules ?? []).map((r) => r.provider_id));
      const without = (providers ?? []).filter((p) => !withRules.has(p.id));
      const n = without.length;
      const examples = without
        .slice(0, 3)
        .map((p) => `${p.display_name} (${p.primary_service_type})`)
        .join(', ');
      return {
        name: 'Providers aprobados sin reglas de horario',
        result: `${n} de ${allProviderIds.length}`,
        severity: n > 0 ? 'warn' : 'ok',
        detail:
          n > 0
            ? `Aparecen en directorio pero sin horarios — booking V2 no matchea. Ej: ${examples}. Fix: que editen horarios en /provider/profile-edit?tab=schedule`
            : 'Todos los providers visibles tienen reglas configuradas',
      };
    },
  },
  {
    id: 'owner_activated_services_24h',
    name: 'Servicios activados por duenos (24h)',
    enabled: true,
    run: async () => {
      const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count } = await supabase
        .from('admin_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('action', 'owner.activate_service')
        .gte('created_at', dayAgo);
      const n = count ?? 0;
      return {
        name: 'Servicios activados por duenos (24h)',
        result: `${n} activaciones`,
        severity: 'ok' as const,
        detail:
          n > 0
            ? `${n} duenos auto-aprobaron servicios (paseo/cuidado/entrenador) en las ultimas 24h`
            : 'Sin nuevas activaciones de servicios owner-driven',
      };
    },
  },
  {
    id: 'deceased_no_date',
    name: 'Mascotas deceased sin fecha de fallecimiento',
    enabled: true,
    run: async () => {
      const { count } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('lifecycle_status', 'deceased')
        .is('passed_away_at', null);
      const n = count ?? 0;
      return {
        name: 'Mascotas deceased sin fecha de fallecimiento',
        result: `${n} encontradas`,
        severity: n > 0 ? 'warn' : 'ok',
        detail: n > 0 ? 'Inconsistencia en datos memorial' : 'OK',
      };
    },
  },
  {
    id: 'overdue_reminders',
    name: 'Recordatorios vencidos sin completar',
    enabled: true,
    run: async () => {
      const now = new Date().toISOString();
      const { count } = await supabase
        .from('pet_reminders')
        .select('id', { count: 'exact', head: true })
        .eq('is_completed', false)
        .lt('due_date', now);
      const n = count ?? 0;
      return {
        name: 'Recordatorios vencidos sin completar',
        result: `${n} encontrados`,
        severity: n > 10 ? 'warn' : 'ok',
        detail: n > 0 ? 'Recordatorios pasados que siguen activos' : 'OK',
      };
    },
  },
  {
    id: 'demo_data',
    name: 'Datos demo en produccion',
    enabled: true,
    run: async () => {
      const [{ count: dp }, { count: dv }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_demo', true),
        supabase
          .from('service_providers')
          .select('id', { count: 'exact', head: true })
          .eq('is_demo', true),
      ]);
      const total = (dp ?? 0) + (dv ?? 0);
      return {
        name: 'Datos demo en produccion',
        result: `${total} registros demo`,
        severity: total > 0 ? 'warn' : 'ok',
        detail: total > 0 ? `${dp ?? 0} perfiles + ${dv ?? 0} proveedores demo` : 'OK',
      };
    },
  },
  {
    id: 'sensitive_config',
    name: 'Config con keys sensibles',
    enabled: true,
    run: async () => {
      const { data } = await supabase.from('platform_config').select('config_key');
      const suspicious = (data ?? []).filter((r) =>
        /key|secret|token|password/i.test(r.config_key)
      );
      return {
        name: 'Config con keys sensibles',
        result: `${suspicious.length} keys detectadas`,
        severity: suspicious.length > 0 ? 'warn' : 'ok',
        detail:
          suspicious.length > 0
            ? `Keys: ${suspicious.map((k) => k.config_key).join(', ')} — redactadas en export`
            : 'OK',
      };
    },
  },
  {
    id: 'empty_tables',
    name: 'Tablas con 0 registros',
    enabled: true,
    run: async () => {
      // Tablas estructuralmente vacias (features sin trafico aun): no son warning.
      // Solo warn si aparece una NUEVA tabla inesperadamente vacia.
      const expectedEmpty = new Set([
        'bookings',
        'payment_history',
        'service_reviews',
        'provider_subscriptions',
        'orders',
        'vet_bookings',
        'content_reports',
        'partner_submissions',
      ]);
      const tables = Array.from(expectedEmpty);
      const results = await Promise.all(
        tables.map(async (t) => {
          const { count } = await supabase.from(t).select('id', { count: 'exact', head: true });
          return { table: t, count: count ?? 0 };
        })
      );
      const empty = results.filter((r) => r.count === 0).map((r) => r.table);
      const unexpectedEmpty = empty.filter((t) => !expectedEmpty.has(t));
      return {
        name: 'Tablas con 0 registros',
        result:
          empty.length > 0
            ? `${empty.length} esperadas vacias: ${empty.join(', ')}`
            : 'Todas tienen datos',
        severity: unexpectedEmpty.length > 0 ? 'warn' : 'ok',
        detail:
          unexpectedEmpty.length > 0
            ? `Inesperado: ${unexpectedEmpty.join(', ')}`
            : empty.length > 0
              ? 'Features nuevas sin trafico aun — esperado'
              : 'OK',
      };
    },
  },
  {
    id: 'invalid_breeds',
    name: 'Mascotas con raza fuera del catalogo',
    enabled: true,
    run: async () => {
      const { data } = await supabase.from('pets').select('id, name, species, breed');
      const pets = data ?? [];
      const catalogBySpecies = new Map<string, Set<string>>();
      for (const [sp, breeds] of Object.entries(BREEDS_BY_SPECIES)) {
        const set = new Set<string>();
        for (const b of breeds) {
          set.add(b.value.toLowerCase().trim());
          set.add(b.label.toLowerCase().trim());
        }
        catalogBySpecies.set(sp, set);
      }
      const invalid = pets.filter((p) => {
        if (!p.breed) return false;
        const sp = (p.species ?? '').toLowerCase();
        const cat = catalogBySpecies.get(sp);
        if (!cat) return false;
        const normalized = String(p.breed).toLowerCase().trim();
        return !cat.has(normalized);
      });
      const n = invalid.length;
      const uniqueValues = Array.from(new Set(invalid.map((p) => String(p.breed).trim())));
      const examples = uniqueValues
        .slice(0, 5)
        .map((v) => `"${v}"`)
        .join(', ');
      return {
        name: 'Mascotas con raza fuera del catalogo',
        result: `${n} filas / ${uniqueValues.length} valores unicos (de ${pets.length} total)`,
        severity: n > 10 ? 'warn' : n > 0 ? 'warn' : 'ok',
        detail:
          n > 0
            ? `Free-text o typo. Valores: ${examples}${uniqueValues.length > 5 ? ` (+${uniqueValues.length - 5} mas)` : ''}. Fix causa raiz: usar Combobox en AddPet/EditPet.`
            : 'Todas las razas existen en el catalogo',
      };
    },
  },
  {
    id: 'invalid_locations',
    name: 'Perfiles con comuna fuera del catalogo',
    enabled: true,
    run: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, location')
        .not('location', 'is', null);
      const profiles = data ?? [];
      const catalog = new Set(COMUNAS_SANTIAGO.map((c) => c.toLowerCase().trim()));
      const invalid = profiles.filter((p) => {
        const loc = String(p.location ?? '')
          .toLowerCase()
          .trim();
        return loc && !catalog.has(loc);
      });
      const n = invalid.length;
      const uniqueValues = Array.from(new Set(invalid.map((p) => String(p.location).trim())));
      const examples = uniqueValues
        .slice(0, 5)
        .map((v) => `"${v}"`)
        .join(', ');
      return {
        name: 'Perfiles con comuna fuera del catalogo',
        result: `${n} filas / ${uniqueValues.length} valores unicos (de ${profiles.length} con location)`,
        severity: n > 0 ? 'warn' : 'ok',
        detail:
          n > 0
            ? `Free-text no matcheable con comunas RM. Valores: ${examples}${uniqueValues.length > 5 ? ` (+${uniqueValues.length - 5} mas)` : ''}. Fix causa raiz: usar Combobox con COMUNAS_SANTIAGO en formulario de perfil.`
            : 'Todas las comunas existen en el catalogo',
      };
    },
  },
  {
    id: 'generic_profiles',
    name: 'Perfiles con display_name generico',
    enabled: true,
    run: async () => {
      const { data } = await supabase.from('profiles').select('id, display_name');
      const profiles = data ?? [];
      const genericPattern = /^(usuario|user|pending|anon)$|^(perro|gato|ave|conejo)[a-z]*_?\d+$/i;
      const generic = profiles.filter((p) => {
        const name = String(p.display_name ?? '').trim();
        if (!name) return true;
        return genericPattern.test(name);
      });
      const n = generic.length;
      const total = profiles.length;
      const pct = total > 0 ? Math.round((n / total) * 100) : 0;
      return {
        name: 'Perfiles con display_name generico',
        result: `${n} de ${total} (${pct}%)`,
        severity: pct > 30 ? 'warn' : 'ok',
        detail:
          n > 0
            ? 'Usuarios que no completaron su nombre real (auto-generado o "Usuario")'
            : 'Todos tienen nombre personalizado',
      };
    },
  },
];

// ── Public API para panel de Data Quality ──────────────────
export async function runAllQualityChecks(): Promise<QualityCheck[]> {
  const enabled = QUALITY_CHECK_DEFINITIONS.filter((d) => d.enabled);
  return Promise.all(
    enabled.map(async (def) => {
      try {
        return await def.run();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          name: def.name,
          result: 'Error al ejecutar',
          severity: 'error' as const,
          detail: message,
        };
      }
    })
  );
}

// ── Helpers ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDateFilter(rows: any[], filters: ExportFilters, dateField: string | null): any[] {
  if (!dateField || (!filters.from_date && !filters.to_date)) return rows;
  return rows.filter((r) => {
    const d = r[dateField] as string | null;
    if (!d) return true;
    if (filters.from_date && d < filters.from_date) return false;
    if (filters.to_date && d > filters.to_date + 'T23:59:59') return false;
    return true;
  });
}

async function fetchSheet(def: SheetDefinition, filters: ExportFilters): Promise<SheetResult> {
  try {
    const { data, error } = await supabase.from(def.table).select(def.select).limit(FETCH_LIMIT);
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows = (data ?? []) as any[];
    // Si devolvio exactamente el limite, probablemente hay mas filas truncadas.
    const truncated = rows.length === FETCH_LIMIT;
    rows = applyDateFilter(rows, filters, def.dateField);
    if (def.transform) rows = def.transform(rows);
    return { name: def.sheetName, rows, truncated };
  } catch (err) {
    // Error resilience: si una tabla falla, devolver sheet vacio con warning
    return {
      name: def.sheetName,
      rows: [],
      error: `Error consultando ${def.table}: ${err instanceof Error ? err.message : 'desconocido'}`,
    };
  }
}

// ── README Sheet ───────────────────────────────────────────

function buildReadmeSheet(
  exportType: ExportType,
  filters: ExportFilters,
  userEmail: string,
  sheets: SheetResult[],
  totalRows: number,
  errors: string[]
): SheetResult {
  const rows = [
    { Campo: 'Tipo de export', Valor: exportType === 'full' ? 'Full Snapshot' : 'Periodo' },
    { Campo: 'Generado por', Valor: userEmail },
    {
      Campo: 'Generado el',
      Valor: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }),
    },
    {
      Campo: 'Rango de fechas',
      Valor: filters.from_date ? `${filters.from_date} a ${filters.to_date}` : 'Todo el historico',
    },
    { Campo: 'Total de sheets', Valor: String(sheets.length + 2) },
    { Campo: 'Total de registros', Valor: String(totalRows) },
    { Campo: 'Errores durante export', Valor: errors.length > 0 ? errors.join('; ') : 'Ninguno' },
    { Campo: 'Sistema', Valor: 'Paw Friend — pawfriend.cl' },
    { Campo: '', Valor: '' },
    { Campo: '--- Contenido ---', Valor: '--- Registros ---' },
    ...sheets.map((s) => ({
      Campo: s.name + (s.error ? ' [ERROR]' : ''),
      Valor: String(s.rows.length),
    })),
  ];
  return { name: 'README', rows };
}

// ── Claude-readable JSON helpers ───────────────────────────
//
// El JSON plano de tablas+checks es util, pero para que un LLM pueda accionar
// directo sin leer 200KB de filas, enriquecemos con:
//   - executive_summary (KPIs top + health score)
//   - aggregates por tabla (distribuciones automaticas)
//   - anomaly_rows (filas problematicas detectadas)
//   - error_logs_grouped (281 errores iguales → 5 grupos con count)
//   - recommended_actions (acciones P0/P1/P2 con ubicacion del fix)

interface ErrorGroup {
  message: string;
  count: number;
  first_seen: string | null;
  last_seen: string | null;
  severity: string;
  sources: string[]; // 'edge_function', 'frontend', etc.
  sample_user_ids: (string | null)[];
  sample_contexts: Array<Record<string, unknown>>; // hasta 3 contextos (incluye function_name, http_status, etc)
  unresolved_count: number;
}

/** Agrupa error_logs por mensaje (colapsa duplicados). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groupErrorLogs(rows: any[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();
  for (const r of rows) {
    const key = r.message ?? '(sin mensaje)';
    let g = groups.get(key);
    if (!g) {
      g = {
        message: key,
        count: 0,
        first_seen: r.created_at,
        last_seen: r.created_at,
        severity: r.severity ?? 'error',
        sources: [],
        sample_user_ids: [],
        sample_contexts: [],
        unresolved_count: 0,
      };
      groups.set(key, g);
    }
    g.count++;
    if (!r.resolved) g.unresolved_count++;
    if (r.created_at < (g.first_seen ?? '')) g.first_seen = r.created_at;
    if (r.created_at > (g.last_seen ?? '')) g.last_seen = r.created_at;
    if (r.source && !g.sources.includes(r.source)) g.sources.push(r.source);
    if (g.sample_user_ids.length < 3 && r.user_id && !g.sample_user_ids.includes(r.user_id)) {
      g.sample_user_ids.push(r.user_id);
    }
    if (g.sample_contexts.length < 3 && r.context && typeof r.context === 'object') {
      g.sample_contexts.push(r.context as Record<string, unknown>);
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

interface SchemaErrorInfo {
  raw: string;
  type: 'missing_column' | 'missing_table' | 'unknown';
  table?: string;
  column?: string;
}

/** Parsea "column X does not exist" a forma accionable. */
function parseFetchError(raw: string): SchemaErrorInfo {
  const colMatch = raw.match(/column\s+(\w+)\.(\w+)\s+does not exist/i);
  if (colMatch) {
    return {
      raw,
      type: 'missing_column',
      table: colMatch[1],
      column: colMatch[2],
    };
  }
  const tblMatch = raw.match(/relation\s+"(\w+)"\s+does not exist/i);
  if (tblMatch) {
    return { raw, type: 'missing_table', table: tblMatch[1] };
  }
  return { raw, type: 'unknown' };
}

/** Calcula agregados automaticos segun tabla. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcAggregates(tableId: string, rows: any[]): Record<string, unknown> | null {
  if (rows.length === 0) return null;
  const agg: Record<string, unknown> = {};
  const countBy = (field: string): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const r of rows) {
      const v = r[field] ?? '(null)';
      out[String(v)] = (out[String(v)] ?? 0) + 1;
    }
    return out;
  };
  switch (tableId) {
    case 'profiles':
      agg.by_plan_id = countBy('plan_id');
      agg.is_premium_true = rows.filter((r) => r.is_premium).length;
      agg.is_admin_true = rows.filter((r) => r.is_admin).length;
      agg.is_demo_true = rows.filter((r) => r.is_demo).length;
      agg.with_location = rows.filter((r) => r.location).length;
      agg.display_name_generic = rows.filter((r) => r.display_name === 'Usuario').length;
      break;
    case 'pets':
      agg.by_species = countBy('species');
      agg.by_lifecycle_status = countBy('lifecycle_status');
      agg.orphan_no_owner = rows.filter((r) => !r.owner_id).length;
      agg.created_by_vet = rows.filter((r) => r.created_by_vet_id).length;
      break;
    case 'service_providers':
      agg.by_status = countBy('status');
      agg.by_provider_plan = countBy('provider_plan');
      agg.is_verified_true = rows.filter((r) => r.is_verified).length;
      agg.without_slug = rows.filter((r) => !r.slug).length;
      agg.is_directory_visible_true = rows.filter((r) => r.is_directory_visible).length;
      break;
    case 'subscriptions':
      agg.by_status = countBy('status');
      agg.by_plan_type = countBy('plan_type');
      break;
    case 'verification_requests':
      agg.by_status = countBy('status');
      agg.by_requested_role = countBy('requested_role');
      break;
    case 'error_logs':
      agg.by_severity = countBy('severity');
      agg.by_source = countBy('source');
      agg.unresolved = rows.filter((r) => !r.resolved).length;
      break;
    case 'bookings':
      agg.by_status = countBy('status');
      agg.by_service_type = countBy('service_type');
      break;
    case 'partners':
      agg.by_placement = countBy('placement');
      agg.by_category = countBy('category');
      agg.is_active_true = rows.filter((r) => r.is_active).length;
      break;
    case 'medical_records':
      agg.by_record_type = countBy('record_type');
      break;
    case 'feedback_in_app':
      agg.by_type = countBy('type');
      agg.by_status = countBy('status');
      break;
  }
  return Object.keys(agg).length > 0 ? agg : null;
}

/** Detecta filas problematicas para acciones dirigidas. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectAnomalies(tableId: string, rows: any[]): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any[] = [];
  switch (tableId) {
    case 'service_providers':
      for (const r of rows) {
        if (r.is_verified && !r.slug) {
          out.push({
            id: r.id,
            issue: 'verified_without_slug',
            display_name: r.display_name,
            commune: r.commune,
          });
        }
      }
      break;
    case 'profiles':
      for (const r of rows) {
        if (r.is_premium && r.plan_id !== 'premium') {
          out.push({
            id: r.id,
            issue: 'premium_but_plan_id_not_premium',
            display_name: r.display_name,
            plan_id: r.plan_id,
          });
        }
        // Gamificacion inconsistente: formula real es level = floor(sqrt(points/100))+1.
        // 100 pts -> level 2, 400 -> level 3. Flag solo si el level en DB esta por
        // debajo del esperado (trigger SQL no ejecuto, frontend-only calc fallo).
        const expectedLevel = Math.floor(Math.sqrt(Math.max(r.points ?? 0, 0) / 100)) + 1;
        const actualLevel = r.level ?? 1;
        if (expectedLevel > actualLevel) {
          out.push({
            id: r.id,
            issue: 'points_level_mismatch',
            display_name: r.display_name,
            points: r.points,
            level_actual: actualLevel,
            level_expected: expectedLevel,
          });
        }
      }
      break;
    case 'pets':
      for (const r of rows) {
        // birth_date en el futuro = typo de data entry
        if (r.birth_date) {
          const bd = new Date(r.birth_date);
          if (bd.getTime() > Date.now()) {
            out.push({
              id: r.id,
              issue: 'future_birth_date',
              name: r.name,
              birth_date: r.birth_date,
              species: r.species,
            });
          }
        }
      }
      break;
    case 'adoption_posts':
      for (const r of rows) {
        if (r.status === 'disponible') {
          const noPhotos = !Array.isArray(r.photos) || r.photos.length === 0;
          const shortDesc = String(r.description ?? '').trim().length < 20;
          if (noPhotos || shortDesc) {
            out.push({
              id: r.id,
              issue:
                noPhotos && shortDesc
                  ? 'no_photos_and_weak_desc'
                  : noPhotos
                    ? 'no_photos'
                    : 'weak_description',
              pet_name: r.pet_name,
              description_length: String(r.description ?? '').trim().length,
            });
          }
        }
      }
      break;
    case 'verification_requests':
      for (const r of rows) {
        if (r.status === 'pendiente') {
          const age = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (86400 * 1000));
          if (age > 3) {
            out.push({
              id: r.id,
              issue: 'pending_too_long',
              days_pending: age,
              requested_role: r.requested_role,
            });
          }
        }
      }
      break;
    case 'subscriptions':
      for (const r of rows) {
        if (r.status === 'pending') {
          const age = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (86400 * 1000));
          if (age > 1) {
            out.push({
              id: r.id,
              issue: 'pending_subscription_stale',
              days_pending: age,
              plan_type: r.plan_type,
            });
          }
        }
      }
      break;
  }
  return out;
}

interface RecommendedAction {
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  category: string;
  issue: string;
  count?: number;
  location?: string;
  fix_hint: string;
}

interface EdgeFnForActions {
  function_name: string;
  executions_24h: number;
  avg_latency_ms: number | null;
}

/** Construye acciones priorizadas desde checks + errors + anomalies. */
function buildRecommendedActions(
  qualityChecks: QualityCheck[],
  errorGroups: ErrorGroup[],
  fetchErrors: SchemaErrorInfo[],
  sheets: SheetResult[],
  edgeFunctions: EdgeFnForActions[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // Fetch errors = schema mismatches → P0
  for (const fe of fetchErrors) {
    if (fe.type === 'missing_column' && fe.table && fe.column) {
      actions.push({
        priority: 'P0',
        category: 'schema_mismatch',
        issue: `Tabla '${fe.table}' no tiene columna '${fe.column}'`,
        location: `src/lib/auditExport.ts — SHEET_DEFINITIONS para id: '${fe.table}'`,
        fix_hint: `Revisar migracion real de ${fe.table} y actualizar el campo 'select' con nombres vigentes.`,
      });
    }
  }

  // Error logs de alto volumen → P1 (>100 = runaway)
  for (const eg of errorGroups.slice(0, 5)) {
    if (eg.count >= 100) {
      actions.push({
        priority: 'P1',
        category: 'error_spike',
        issue: `'${eg.message}' ocurrio ${eg.count} veces`,
        count: eg.count,
        fix_hint: eg.message.includes('Lock was stolen')
          ? 'Supabase auth race condition: revisar multiples instancias del client o lockAcquire config.'
          : eg.message.includes('foreign key constraint')
            ? 'FK violation: revisar flow de insert para validar existencia del referente antes.'
            : 'Revisar stack trace y agrupar error en fix comun.',
      });
    } else if (eg.count >= 10) {
      actions.push({
        priority: 'P2',
        category: 'recurring_error',
        issue: `'${eg.message}' ocurrio ${eg.count} veces`,
        count: eg.count,
        fix_hint: 'Error recurrente, revisar contexto de usuario y agregar manejo especifico.',
      });
    }
  }

  // Quality checks en error → P1
  for (const qc of qualityChecks) {
    if (qc.severity === 'error' && !qc.detail.includes('Error consultando')) {
      actions.push({
        priority: 'P1',
        category: 'data_integrity',
        issue: qc.name,
        fix_hint: qc.detail,
      });
    } else if (qc.severity === 'warn') {
      actions.push({
        priority: 'P2',
        category: 'data_warning',
        issue: qc.name,
        fix_hint: qc.detail,
      });
    }
  }

  // Anomalias detectadas en tablas → P2
  for (const s of sheets) {
    if (s.rows.length === 0) continue;
    const def = SHEET_DEFINITIONS.find((d) => d.sheetName === s.name);
    if (!def) continue;
    const anomalies = detectAnomalies(def.id, s.rows);
    if (anomalies.length > 0) {
      // location por tipo de anomalia conocido
      let location: string | undefined;
      if (def.id === 'pets') location = 'src/pages/AddPet.tsx + src/pages/EditPet.tsx';
      else if (def.id === 'profiles') location = 'src/pages/Profile.tsx';
      else if (def.id === 'adoption_posts') location = 'src/pages/AdoptionForm.tsx';
      else if (def.id === 'service_providers') location = 'Admin > Verificaciones';
      else if (def.id === 'verification_requests') location = 'Admin > Verificaciones';
      else if (def.id === 'subscriptions') location = 'Admin > Finance + Flow webhook';
      actions.push({
        priority: 'P2',
        category: 'anomaly',
        issue: `${anomalies.length} filas con anomalias en '${def.id}'`,
        count: anomalies.length,
        location,
        fix_hint: `Ver tables[id='${def.id}'].anomaly_rows para detalle`,
      });
    }
  }

  // Tablas truncadas al limite → P1 (dataset incompleto invalida el reporte)
  for (const s of sheets) {
    if (!s.truncated) continue;
    const def = SHEET_DEFINITIONS.find((d) => d.sheetName === s.name);
    actions.push({
      priority: 'P1',
      category: 'truncated_dataset',
      issue: `Tabla '${def?.id ?? s.name}' alcanzo el limite de ${FETCH_LIMIT} filas`,
      count: s.rows.length,
      location: 'src/lib/auditExport.ts — fetchSheet (FETCH_LIMIT)',
      fix_hint:
        'El export se trunco. Implementar paginacion (range/keyset) en fetchSheet o usar filtro por periodo mas acotado.',
    });
  }

  // Edge fns con latencia alta → P3 (no bloquea pero vale la pena mirar)
  for (const fn of edgeFunctions) {
    if ((fn.avg_latency_ms ?? 0) > 3000 && fn.executions_24h > 0) {
      actions.push({
        priority: 'P3',
        category: 'slow_edge_function',
        issue: `'${fn.function_name}' promedio ${fn.avg_latency_ms}ms`,
        count: fn.executions_24h,
        location: `supabase/functions/${fn.function_name}/index.ts`,
        fix_hint:
          'Revisar llamadas externas (OpenAI/Anthropic, Google APIs, Flow). Evaluar caching, batching o prompt mas corto.',
      });
    }
  }

  // Ordenar por prioridad
  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]);
}

/** Instrucciones embebidas para que un LLM use el reporte correctamente. */
function buildClaudeInstructions(): Record<string, unknown> {
  return {
    purpose:
      'Este reporte es la fuente de verdad del estado de Paw Friend. Úsalo para priorizar fixes, nunca para hacer refactors grandes ni features nuevas sin autorización explícita del dueño.',
    golden_rule:
      'REGLA DE ORO (Pedro 2026-04-17): JAMAS alterar datos de usuarios ni su experiencia. Si un fix puede caer la pagina o afectar UX → consultar a Pedro antes de pushear. Si hay duda, no pushear. Auto-fixes solo se aplican a ruido (testing data, logs benignos, metadata derivada).',
    workflow: [
      '1. Lee primero `executive_summary.health_score` y `top_issues`.',
      '2. Revisa `recommended_actions` en orden P0 → P1 → P2.',
      '3. Chequea `edge_functions.with_failures_24h` — si > 0, mira `edge_functions.functions[i].recent_errors` para la causa raiz.',
      '4. Chequea `device_compatibility` para detectar plataformas con uso bajo o bugs especificos (ej. iOS=0 pero Android>100 → sospechar crash iOS).',
      '5. Para cada acción: lee `fix_hint` + `location` y navega al código.',
      '6. Antes de editar: verifica que el fix no afecte datos de usuarios reales (regla §9.8 CLAUDE.md).',
      '7. Ejecuta `npx tsc -b` + `npm run lint` + `npm run test:ci` post-fix.',
      '8. Commit con mensaje claro (tipo + scope + descripción).',
      '9. Push solo cuando 1-3 fixes están agrupados; no pushes fixes aislados.',
      '10. Si un fix es reversible y afecta prod (migración SQL, edge fn deploy): pide confirmación antes.',
    ],
    new_sections_v3: {
      edge_functions:
        'Telemetria por edge fn (system_health_log). Campos: executions_24h, real_failures_24h (5xx + timeouts + excepciones), client_errors_24h (4xx no son fallas), avg_latency_ms, last_status, recent_errors. Prioriza funciones con real_failures_24h > 0.',
      device_compatibility:
        'Sesiones por platform_family (ios_app/android_app/mobile_web/desktop_web), os, browser_family, screen. Ventana 30d. Si una plataforma clave (ej. ios_app) tiene 0 sesiones mientras otras tienen tráfico, investiga posible crash o incompatibilidad.',
      error_logs_grouped_enhanced:
        'Cada grupo trae: message, count, unresolved_count, sources[], sample_user_ids[], sample_contexts[] (incluye function_name, http_status, stack parcial, etc). Usa sample_contexts para diagnosticar la causa raiz sin abrir Supabase Dashboard.',
    },
    priority_rules: {
      P0: 'Bloquean funcionalidad o exponen bug visible al usuario (ej. export admin roto, schema mismatch). Fix inmediato.',
      P1: 'Alto volumen o riesgo (ej. 281 errores idénticos, FK violation recurrente). Fix en el commit actual.',
      P2: 'Calidad de datos o UX degradada no crítica (ej. providers sin slug, verifications stale). Fix cuando haya margen.',
      P3: 'Cosmético / tech debt / performance marginal. Solo si sobra tiempo.',
    },
    user_protection_rules: [
      'REGLA DE ORO: Jamás alterar datos de usuarios reales ni su experiencia. Si hay duda, NO pushear.',
      'Si un fix puede romper la página o afectar UX (aunque sea remotamente) → consultar a Pedro antes. No pushear ese fix particular hasta tener OK explícito.',
      'NUNCA hacer DROP TABLE ni DELETE sin WHERE en tablas con datos reales.',
      'Si agregas columna NOT NULL: dale DEFAULT o haz UPDATE previo para rellenar filas existentes.',
      'Si renombras columna: usa ALTER TABLE RENAME (no drop+create). Frontend lee valor antiguo como fallback 1 release.',
      'Migraciones SQL: generar archivo en `supabase/migrations/` con timestamp. NO aplicar automáticamente — Pedro lo hace desde Dashboard.',
      'localStorage/sessionStorage/IndexedDB: si renombras una key, migra el valor antiguo la primera vez que el usuario abre la app post-update.',
      'Edge functions con cambio de contrato: frontend + backend en el mismo commit. Si hay clientes mobile con caché, considerar versionado.',
      'Verifica siempre: "¿Un usuario que creó su cuenta ayer seguirá viendo sus datos?" Si no es un "sí" claro, falta migración/fallback.',
      'Para auto-fixers: solo se permiten fixes sobre ruido claro (testing data, logs benignos, slugs faltantes). NUNCA sobre datos de mascota/ficha/recordatorio/reserva de un usuario.',
    ],
    do_not_touch: [
      'Ficha médica PDF (generate-medical-summary) y directorio público de vets: joya de la corona. Solo fixes puntuales, nada de refactor.',
      'Flow.cl edge functions (flow-create-subscription, flow-webhook): manejan dinero real. Fix solo con autorización explícita.',
      'docs/ folder: es output de `npm run build`. Nunca editar a mano.',
      'Archivos generados: supabase/types.ts (se regenera con CLI), docs/, dist/.',
    ],
    commit_conventions: {
      types: [
        'feat: nueva funcionalidad',
        'fix: bug fix',
        'chore: maintenance (lint, deps)',
        'refactor: cambio interno sin cambiar comportamiento',
        'docs: solo documentación',
        'test: tests',
        'build: sistema de build / docs/',
      ],
      copy_style:
        'Español chileno tuteado (tú, tienes). Títulos ≤70 caracteres. Cuerpo describe el porqué no el qué.',
      always_include_coauthor:
        'Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>',
    },
    before_push_checklist: [
      'tsc -b con 0 errors',
      'npm run lint con 0 errors (warnings OK si son pre-existentes)',
      'npm run test:ci con 100% pass',
      'No hay secretos/tokens en el diff (grep por ANTHROPIC_API_KEY, FLOW_, SUPABASE_SERVICE_)',
      'No estás pusheando a main con force (--force). Si necesitás rebase, confirma con Pedro primero.',
    ],
    escalate_to_human: [
      'Cualquier cambio a tablas con >100 filas sin backup reciente.',
      'Cambios de contrato en edge functions que afecten apps mobile (Capacitor).',
      'Desactivar/cambiar pagos Flow.',
      'Migraciones que toquen auth.users directamente.',
      'Drop de columnas que frontend aún usa.',
    ],
  };
}

/** Resumen ejecutivo: KPIs + health score. */
function buildExecutiveSummary(
  sheets: SheetResult[],
  qualityChecks: QualityCheck[],
  errorGroups: ErrorGroup[],
  fetchErrors: SchemaErrorInfo[],
  recommendedActions: RecommendedAction[]
): Record<string, unknown> {
  const findRows = (id: string) =>
    sheets.find((s) => {
      const def = SHEET_DEFINITIONS.find((d) => d.sheetName === s.name);
      return def?.id === id;
    })?.rows ?? [];

  const profiles = findRows('profiles');
  const pets = findRows('pets');
  const providers = findRows('service_providers');
  const bookings = findRows('bookings');
  const errorLogs = findRows('error_logs');

  const errors24h = errorLogs.filter((e) => {
    const created = new Date(e.created_at).getTime();
    return Date.now() - created < 24 * 3600 * 1000;
  }).length;

  // Health score: 100 - (errors × factor). Max 100, min 0.
  const errorFactor = qualityChecks.filter((c) => c.severity === 'error').length * 10;
  const warnFactor = qualityChecks.filter((c) => c.severity === 'warn').length * 3;
  const errorLogsFactor = Math.min(30, errorGroups.filter((g) => g.count > 50).length * 10);
  const health = Math.max(0, 100 - errorFactor - warnFactor - errorLogsFactor);

  return {
    health_score: health,
    health_label: health >= 85 ? 'healthy' : health >= 60 ? 'degraded' : 'critical',
    quick_stats: {
      total_users: profiles.length,
      premium_users: profiles.filter((p) => p.is_premium).length,
      active_pets: pets.filter((p) => p.lifecycle_status === 'active').length,
      orphan_pets: pets.filter((p) => !p.owner_id).length,
      verified_providers: providers.filter((p) => p.is_verified).length,
      providers_without_slug: providers.filter((p) => p.is_verified && !p.slug).length,
      total_bookings: bookings.length,
      error_logs_24h: errors24h,
      error_logs_total: errorLogs.length,
      unique_error_patterns: errorGroups.length,
    },
    top_issues: (() => {
      // Prioriza: schema errors -> error spikes -> top acciones P0/P1 -> anomalias de volumen P2
      const issues: Array<{ type: string; description: string; priority?: string }> = [];
      for (const e of fetchErrors.slice(0, 3)) {
        issues.push({
          type: 'schema_mismatch',
          priority: 'P0',
          description: `${e.table}.${e.column} no existe`,
        });
      }
      for (const g of errorGroups.slice(0, 3)) {
        if (g.count >= 10) {
          issues.push({
            type: 'error_spike',
            priority: g.count >= 100 ? 'P1' : 'P2',
            description: `${g.message.slice(0, 80)} (${g.count}x)`,
          });
        }
      }
      // Anomalias de volumen: top 3 acciones con count >= 5
      const highVolume = recommendedActions
        .filter((a) => a.category === 'anomaly' && (a.count ?? 0) >= 5)
        .slice(0, 3);
      for (const a of highVolume) {
        issues.push({
          type: a.category,
          priority: a.priority,
          description: a.issue,
        });
      }
      // Si no hay nada urgente, muestra el error mas reciente aunque sea 1 vez
      if (issues.length === 0 && errorGroups.length > 0) {
        const g = errorGroups[0];
        issues.push({
          type: 'error_spike',
          priority: 'P3',
          description: `${g.message.slice(0, 80)} (${g.count}x)`,
        });
      }
      return issues.slice(0, 5);
    })(),
  };
}

// ── Edge Functions Report ──────────────────────────────────
// Agrega telemetria por funcion desde system_health_log + error_logs
// Usa misma logica que AdminSystemHealth (filtrando 4xx como no-falla)

interface EdgeFunctionSummary {
  function_name: string;
  executions_24h: number;
  real_failures_24h: number; // 5xx + timeouts + excepciones
  client_errors_24h: number; // 4xx (rate limit, input invalido)
  avg_latency_ms: number | null;
  last_status: 'success' | 'error' | 'timeout' | 'unknown';
  last_run: string | null;
  recent_errors: Array<{
    message: string;
    created_at: string;
    severity: string;
  }>;
}

async function fetchEdgeFunctionsReport(): Promise<{
  total_functions: number;
  with_traffic_24h: number;
  with_failures_24h: number;
  functions: EdgeFunctionSummary[];
}> {
  try {
    const [healthRes, errorsRes] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('system_health_log') as any)
        .select('function_name, status, execution_time_ms, error_message, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(2000),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('error_logs') as any)
        .select('message, created_at, context, severity')
        .eq('source', 'edge_function')
        .order('created_at', { ascending: false })
        .limit(500),
    ]);

    const healthEntries = (healthRes.data as Array<Record<string, unknown>>) ?? [];
    const errorEntries = (errorsRes.data as Array<Record<string, unknown>>) ?? [];

    const dayAgo = Date.now() - 24 * 3600 * 1000;
    const rowMap = new Map<string, EdgeFunctionSummary>();
    const latencies = new Map<string, number[]>();

    const isRealFailure = (entry: Record<string, unknown>): boolean => {
      if (entry.status === 'timeout') return true;
      if (entry.status !== 'error') return false;
      const md = entry.metadata as Record<string, unknown> | null | undefined;
      const httpStatus = md?.http_status;
      if (httpStatus == null) return true;
      if (typeof httpStatus === 'number' && httpStatus >= 500) return true;
      return false;
    };
    const isClientError = (entry: Record<string, unknown>): boolean => {
      if (entry.status !== 'error') return false;
      const md = entry.metadata as Record<string, unknown> | null | undefined;
      const httpStatus = md?.http_status;
      return typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500;
    };

    for (const entry of healthEntries) {
      const fn = entry.function_name as string;
      if (!fn) continue;
      let row = rowMap.get(fn);
      if (!row) {
        row = {
          function_name: fn,
          executions_24h: 0,
          real_failures_24h: 0,
          client_errors_24h: 0,
          avg_latency_ms: null,
          last_status: 'unknown',
          last_run: null,
          recent_errors: [],
        };
        rowMap.set(fn, row);
      }
      if (!row.last_run) {
        row.last_status = isRealFailure(entry)
          ? 'error'
          : entry.status === 'timeout'
            ? 'timeout'
            : 'success';
        row.last_run = entry.created_at as string;
      }
      const t = new Date(entry.created_at as string).getTime();
      if (t >= dayAgo) {
        row.executions_24h++;
        if (isRealFailure(entry)) row.real_failures_24h++;
        else if (isClientError(entry)) row.client_errors_24h++;
      }
      if (entry.execution_time_ms != null) {
        const arr = latencies.get(fn) || [];
        arr.push(entry.execution_time_ms as number);
        latencies.set(fn, arr);
      }
    }
    for (const [fn, vals] of latencies) {
      const row = rowMap.get(fn);
      if (row && vals.length > 0) {
        row.avg_latency_ms = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      }
    }

    // Asocia errores desde error_logs (solo fallas reales)
    for (const err of errorEntries) {
      const ctx = err.context as Record<string, unknown> | null;
      const ctxFn = ctx?.function_name as string | undefined;
      let fnName = ctxFn;
      if (!fnName && typeof err.message === 'string') {
        const prefix = err.message.split(':')[0]?.trim();
        if (prefix && rowMap.has(prefix)) fnName = prefix;
      }
      if (!fnName) continue;
      const row = rowMap.get(fnName);
      if (!row) continue;
      const httpStatus = ctx?.http_status;
      const is4xx =
        (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) ||
        (typeof err.message === 'string' && /\bHTTP 4\d\d\b/.test(err.message));
      if (is4xx) continue;
      if (row.recent_errors.length < 5) {
        row.recent_errors.push({
          message: String(err.message ?? '').slice(0, 300),
          created_at: err.created_at as string,
          severity: err.severity as string,
        });
      }
    }

    const functions = Array.from(rowMap.values()).sort((a, b) => {
      if (a.real_failures_24h !== b.real_failures_24h)
        return b.real_failures_24h - a.real_failures_24h;
      return b.executions_24h - a.executions_24h;
    });

    return {
      total_functions: functions.length,
      with_traffic_24h: functions.filter((f) => f.executions_24h > 0).length,
      with_failures_24h: functions.filter((f) => f.real_failures_24h > 0).length,
      functions,
    };
  } catch {
    return { total_functions: 0, with_traffic_24h: 0, with_failures_24h: 0, functions: [] };
  }
}

// ── Device Compatibility Report ────────────────────────────
// Agrega sesiones por platform_family + os + browser del analytics_events

async function fetchDeviceCompatibilityReport(): Promise<{
  total_sessions_30d: number;
  by_platform_family: Record<string, number>;
  by_os: Record<string, number>;
  by_browser: Record<string, number>;
  top_combinations: Array<{
    platform_family: string;
    os: string;
    browser_family: string;
    screen: string;
    count: number;
  }>;
}> {
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('analytics_events') as any)
      .select('session_id, created_at, metadata')
      .eq('event_type', 'session_start')
      .gte('created_at', since)
      .limit(5000);

    const sessions = (data as Array<Record<string, unknown>>) ?? [];
    const byPlatform: Record<string, number> = {};
    const byOS: Record<string, number> = {};
    const byBrowser: Record<string, number> = {};
    const comboMap = new Map<
      string,
      { platform_family: string; os: string; browser_family: string; screen: string; count: number }
    >();
    const seen = new Set<string>();

    // Fallbacks para sesiones pre-2026-04-17 (sin platform_family/os/browser_family).
    // Infieren desde user agent guardado en metadata.browser (UA string truncado a 200).
    const inferPlatform = (ua: string): string => {
      if (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua)) return 'ios_app';
      if (/Android/i.test(ua) && /wv\)/i.test(ua)) return 'android_app';
      if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile_web';
      if (/Mozilla/i.test(ua)) return 'desktop_web';
      return 'legacy';
    };
    const inferOS = (ua: string): string => {
      if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
      if (/Android/i.test(ua)) return 'Android';
      if (/Windows/i.test(ua)) return 'Windows';
      if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
      if (/Linux/i.test(ua)) return 'Linux';
      return 'Unknown';
    };
    const inferBrowser = (ua: string): string => {
      if (/Edg\//i.test(ua)) return 'Edge';
      if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
      if (/Firefox\//i.test(ua)) return 'Firefox';
      if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
      if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet';
      return 'Unknown';
    };

    for (const row of sessions) {
      const sessionKey = (row.session_id as string) ?? (row.created_at as string);
      if (seen.has(sessionKey)) continue;
      seen.add(sessionKey);
      const md = (row.metadata as Record<string, unknown> | null) ?? {};
      const ua = typeof md.browser === 'string' ? md.browser : '';
      const platform = (md.platform_family as string) || (ua ? inferPlatform(ua) : 'legacy');
      const os = (md.os as string) || (ua ? inferOS(ua) : 'Unknown');
      const browser = (md.browser_family as string) || (ua ? inferBrowser(ua) : 'Unknown');
      const screen = (md.screen as string) || 'Unknown';
      byPlatform[platform] = (byPlatform[platform] ?? 0) + 1;
      byOS[os] = (byOS[os] ?? 0) + 1;
      byBrowser[browser] = (byBrowser[browser] ?? 0) + 1;
      const key = `${platform}|${os}|${browser}|${screen}`;
      const cur = comboMap.get(key);
      if (cur) cur.count++;
      else
        comboMap.set(key, {
          platform_family: platform,
          os,
          browser_family: browser,
          screen,
          count: 1,
        });
    }

    const top = Array.from(comboMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      total_sessions_30d: seen.size,
      by_platform_family: byPlatform,
      by_os: byOS,
      by_browser: byBrowser,
      top_combinations: top,
    };
  } catch {
    return {
      total_sessions_30d: 0,
      by_platform_family: {},
      by_os: {},
      by_browser: {},
      top_combinations: [],
    };
  }
}

// ── Main Export Generator ──────────────────────────────────

export interface ExportProgress {
  step: string;
  pct: number;
}

/** Limite de exports por dia. El hook lo valida antes de llamar a esta funcion.
 *  Valor alto = practicamente ilimitado para admin. Cuando quieras volver a
 *  limitar, bajalo a 10 o al numero que tenga sentido por usuario. */
export const MAX_EXPORTS_PER_DAY = 999;

export async function generateAuditExport(
  exportType: ExportType,
  filters: ExportFilters,
  userEmail: string,
  onProgress?: (p: ExportProgress) => void
): Promise<{
  blob: Blob;
  jsonBlob: Blob;
  totalRows: number;
  sheetsCount: number;
}> {
  const report = (step: string, pct: number) => onProgress?.({ step, pct });
  const enabledSheets = SHEET_DEFINITIONS.filter((d) => d.enabled);
  const enabledChecks = QUALITY_CHECK_DEFINITIONS.filter((d) => d.enabled);

  // 1. Fetch all sheets (sequential for progress reporting, but with error resilience)
  const sheets: SheetResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < enabledSheets.length; i++) {
    const def = enabledSheets[i];
    const pct = Math.round(5 + (i / enabledSheets.length) * 70);
    report(`Consultando ${def.sheetName}...`, pct);
    const result = await fetchSheet(def, filters);
    if (result.error) errors.push(result.error);
    sheets.push(result);
  }

  // 2. Run quality checks + edge fns + devices reports en PARALELO
  report('Ejecutando checks de calidad y monitoreo...', 80);
  const [qualityChecksRaw, edgeFunctionsReport, deviceCompatReport] = await Promise.all([
    Promise.all(
      enabledChecks.map(async (def) => {
        try {
          return await def.run();
        } catch (err) {
          return {
            name: def.name,
            result: 'Error ejecutando check',
            severity: 'error' as const,
            detail: err instanceof Error ? err.message : 'Error desconocido',
          };
        }
      })
    ),
    fetchEdgeFunctionsReport(),
    fetchDeviceCompatibilityReport(),
  ]);
  const qualityChecks = qualityChecksRaw;

  // Add errors from sheet fetching as additional DQ checks
  for (const err of errors) {
    qualityChecks.push({
      name: 'Error de fetch en sheet',
      result: 'Error',
      severity: 'error',
      detail: err,
    });
  }

  const totalRows = sheets.reduce((sum, s) => sum + s.rows.length, 0);

  // 3. Build README
  const readme = buildReadmeSheet(exportType, filters, userEmail, sheets, totalRows, errors);

  report('Generando archivo Excel...', 92);

  // 4. Create workbook
  const wb = XLSX.utils.book_new();

  // README sheet
  const readmeWs = XLSX.utils.json_to_sheet(readme.rows);
  readmeWs['!cols'] = [{ wch: 35 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, readmeWs, 'README');

  // Data sheets
  for (const sheet of sheets) {
    if (sheet.rows.length === 0) {
      const msg = sheet.error ? `Error: ${sheet.error}` : 'Sin datos para este periodo';
      const emptyWs = XLSX.utils.aoa_to_sheet([[msg]]);
      XLSX.utils.book_append_sheet(wb, emptyWs, sheet.name);
    } else {
      const ws = XLSX.utils.json_to_sheet(sheet.rows);
      const keys = Object.keys(sheet.rows[0]);
      ws['!cols'] = keys.map((key) => {
        const maxLen = Math.max(
          key.length,
          ...sheet.rows.slice(0, 100).map((r) => String(r[key] ?? '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    }
  }

  // Data Quality Report sheet
  const dqRows = qualityChecks.map((c) => ({
    Check: c.name,
    Resultado: c.result,
    Severidad: c.severity === 'ok' ? 'OK' : c.severity === 'warn' ? 'ADVERTENCIA' : 'ERROR',
    Detalle: c.detail,
  }));
  const dqWs = XLSX.utils.json_to_sheet(dqRows);
  dqWs['!cols'] = [{ wch: 42 }, { wch: 28 }, { wch: 15 }, { wch: 65 }];
  XLSX.utils.book_append_sheet(wb, dqWs, 'Calidad_Datos');

  report('Finalizando...', 98);

  // 5. Generate Excel blob
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // 6. Generate Claude-readable JSON blob ENRIQUECIDO.
  //
  //    En vez de dumpear ~500 filas completas, agregamos:
  //      - executive_summary: health score + KPIs top
  //      - tables[].aggregates: distribuciones automaticas
  //      - tables[].anomaly_rows: filas problematicas detectadas
  //      - tables[].sample_rows: solo 5 si count > 50 (full_rows si < 50)
  //      - error_logs_grouped: 281 errores iguales → 5 grupos con count
  //      - schema_errors: errores de fetch parseados con tabla + columna
  //      - recommended_actions: P0/P1/P2 con ubicacion y fix_hint
  //
  //    Proposito: que un LLM (Claude Code) pueda leer y proponer/ejecutar
  //    fixes sin tener que procesar miles de filas duplicadas.

  // Parsea errores de schema para accion dirigida
  const fetchErrorsParsed = errors.map(parseFetchError);

  // Separa error_logs del resto para agrupar
  const errorLogsRows =
    sheets.find((s) => {
      const def = enabledSheets.find((d) => d.sheetName === s.name);
      return def?.id === 'error_logs';
    })?.rows ?? [];
  const errorGroups = groupErrorLogs(errorLogsRows);

  // Agrega recomendaciones priorizadas
  const recommendedActions = buildRecommendedActions(
    qualityChecks,
    errorGroups,
    fetchErrorsParsed,
    sheets,
    edgeFunctionsReport.functions
  );

  const executiveSummary = buildExecutiveSummary(
    sheets,
    qualityChecks,
    errorGroups,
    fetchErrorsParsed,
    recommendedActions
  );

  const ROWS_FULL_THRESHOLD = 50;
  const SAMPLE_SIZE = 5;

  const jsonPayload = {
    meta: {
      app: 'Paw Friend',
      schema_version: 4,
      export_type: exportType,
      filters: exportType === 'period' ? filters : null,
      generated_at: new Date().toISOString(),
      generated_by: userEmail,
      total_rows: totalRows,
      tables_count: sheets.length,
      sheets_count: sheets.length + 2,
    },
    claude_instructions: buildClaudeInstructions(),
    executive_summary: executiveSummary,
    recommended_actions: recommendedActions,
    schema_errors: fetchErrorsParsed,
    tables: sheets.map((s) => {
      const def = enabledSheets.find((d) => d.sheetName === s.name);
      const id = def?.id ?? s.name;
      // Para error_logs, no dumpeamos filas (ya estan en error_logs_grouped)
      const isErrorLogs = id === 'error_logs';
      const rows = s.rows;
      const includeFullRows = !isErrorLogs && rows.length < ROWS_FULL_THRESHOLD;
      return {
        id,
        sheet_name: s.name,
        table: def?.table ?? null,
        description: def?.description ?? null,
        row_count: rows.length,
        truncated: s.truncated ?? false,
        error: s.error ?? null,
        aggregates: calcAggregates(id, rows),
        anomaly_rows: detectAnomalies(id, rows),
        sample_rows: isErrorLogs ? [] : rows.slice(0, SAMPLE_SIZE),
        full_rows: includeFullRows ? rows : null,
      };
    }),
    error_logs_grouped: errorGroups,
    error_logs_by_source: (() => {
      // Agrupa error_logs por source (frontend, supabase_client, edge_function,
      // console) para ver rapidamente de donde viene el ruido. Incluye top 3
      // mensajes por source para diagnostico sin abrir Supabase.
      const bySource: Record<
        string,
        {
          count: number;
          unresolved: number;
          top_messages: Array<{ message: string; count: number }>;
        }
      > = {};
      for (const row of errorLogsRows) {
        const src = String(row.source ?? 'unknown');
        if (!bySource[src]) bySource[src] = { count: 0, unresolved: 0, top_messages: [] };
        bySource[src].count++;
        if (!row.resolved) bySource[src].unresolved++;
      }
      for (const src of Object.keys(bySource)) {
        const msgCounts = new Map<string, number>();
        for (const row of errorLogsRows) {
          if (String(row.source ?? 'unknown') !== src) continue;
          const msg = String(row.message ?? '(sin mensaje)').slice(0, 120);
          msgCounts.set(msg, (msgCounts.get(msg) ?? 0) + 1);
        }
        bySource[src].top_messages = Array.from(msgCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([message, count]) => ({ message, count }));
      }
      return bySource;
    })(),
    quality_checks: qualityChecks.map((c) => ({
      name: c.name,
      severity: c.severity,
      result: c.result,
      detail: c.detail,
    })),
    quality_summary: {
      total: qualityChecks.length,
      ok: qualityChecks.filter((c) => c.severity === 'ok').length,
      warn: qualityChecks.filter((c) => c.severity === 'warn').length,
      error: qualityChecks.filter((c) => c.severity === 'error').length,
    },
    edge_functions: edgeFunctionsReport,
    device_compatibility: deviceCompatReport,
  };
  const jsonBlob = new Blob([JSON.stringify(jsonPayload, null, 2)], {
    type: 'application/json',
  });

  return {
    blob,
    jsonBlob,
    totalRows,
    sheetsCount: sheets.length + 2, // +README +DQ
  };
}

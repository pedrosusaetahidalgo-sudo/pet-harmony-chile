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

// ── Types ──────────────────────────────────────────────────
export type ExportType = 'full' | 'period';

export interface ExportFilters {
  from_date?: string;
  to_date?: string;
}

interface QualityCheck {
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
}

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
      'id, source, severity, message, user_id, resolved, resolved_at, resolved_by, created_at',
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
        .eq('status', 'active')
        .lt('reminder_date', now);
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
      const { data } = await supabase.from('platform_config').select('key');
      const suspicious = (data ?? []).filter((r) => /key|secret|token|password/i.test(r.key));
      return {
        name: 'Config con keys sensibles',
        result: `${suspicious.length} keys detectadas`,
        severity: suspicious.length > 0 ? 'warn' : 'ok',
        detail:
          suspicious.length > 0
            ? `Keys: ${suspicious.map((k) => k.key).join(', ')} — redactadas en export`
            : 'OK',
      };
    },
  },
  {
    id: 'empty_tables',
    name: 'Tablas con 0 registros',
    enabled: true,
    run: async () => {
      const tables = ['bookings', 'payment_history', 'service_reviews', 'provider_subscriptions'];
      const results = await Promise.all(
        tables.map(async (t) => {
          const { count } = await supabase.from(t).select('id', { count: 'exact', head: true });
          return { table: t, count: count ?? 0 };
        })
      );
      const empty = results.filter((r) => r.count === 0).map((r) => r.table);
      return {
        name: 'Tablas con 0 registros',
        result: empty.length > 0 ? empty.join(', ') : 'Todas tienen datos',
        severity: empty.length > 0 ? 'warn' : 'ok',
        detail: empty.length > 0 ? 'Puede ser normal si la feature no se ha usado aun' : 'OK',
      };
    },
  },
];

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
    const { data, error } = await supabase.from(def.table).select(def.select).limit(10000);
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows = (data ?? []) as any[];
    rows = applyDateFilter(rows, filters, def.dateField);
    if (def.transform) rows = def.transform(rows);
    return { name: def.sheetName, rows };
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
  sample_user_ids: (string | null)[];
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
        sample_user_ids: [],
      };
      groups.set(key, g);
    }
    g.count++;
    if (r.created_at < (g.first_seen ?? '')) g.first_seen = r.created_at;
    if (r.created_at > (g.last_seen ?? '')) g.last_seen = r.created_at;
    if (g.sample_user_ids.length < 3 && r.user_id && !g.sample_user_ids.includes(r.user_id)) {
      g.sample_user_ids.push(r.user_id);
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

/** Construye acciones priorizadas desde checks + errors + anomalies. */
function buildRecommendedActions(
  qualityChecks: QualityCheck[],
  errorGroups: ErrorGroup[],
  fetchErrors: SchemaErrorInfo[],
  sheets: SheetResult[]
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
      actions.push({
        priority: 'P2',
        category: 'anomaly',
        issue: `${anomalies.length} filas con anomalias en '${def.id}'`,
        count: anomalies.length,
        fix_hint: `Ver tables[id='${def.id}'].anomaly_rows para detalle`,
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
    workflow: [
      '1. Lee primero `executive_summary.health_score` y `top_issues`.',
      '2. Revisa `recommended_actions` en orden P0 → P1 → P2.',
      '3. Para cada acción: lee `fix_hint` + `location` y navega al código.',
      '4. Antes de editar: verifica que el fix no afecte datos de usuarios reales (regla §9.8 CLAUDE.md).',
      '5. Ejecuta `npx tsc -b` + `npm run lint` + `npm run test:ci` post-fix.',
      '6. Commit con mensaje claro (tipo + scope + descripción).',
      '7. Push solo cuando 1-3 fixes están agrupados; no pushes fixes aislados.',
      '8. Si un fix es reversible y afecta prod (migración SQL, edge fn deploy): pide confirmación antes.',
    ],
    priority_rules: {
      P0: 'Bloquean funcionalidad o exponen bug visible al usuario (ej. export admin roto, schema mismatch). Fix inmediato.',
      P1: 'Alto volumen o riesgo (ej. 281 errores idénticos, FK violation recurrente). Fix en el commit actual.',
      P2: 'Calidad de datos o UX degradada no crítica (ej. providers sin slug, verifications stale). Fix cuando haya margen.',
      P3: 'Cosmético / tech debt / performance marginal. Solo si sobra tiempo.',
    },
    user_protection_rules: [
      'NUNCA hacer DROP TABLE ni DELETE sin WHERE en tablas con datos reales.',
      'Si agregas columna NOT NULL: dale DEFAULT o haz UPDATE previo para rellenar filas existentes.',
      'Si renombras columna: usa ALTER TABLE RENAME (no drop+create). Frontend lee valor antiguo como fallback 1 release.',
      'Migraciones SQL: generar archivo en `supabase/migrations/` con timestamp. NO aplicar automáticamente — Pedro lo hace desde Dashboard.',
      'localStorage/sessionStorage/IndexedDB: si renombras una key, migra el valor antiguo la primera vez que el usuario abre la app post-update.',
      'Edge functions con cambio de contrato: frontend + backend en el mismo commit. Si hay clientes mobile con caché, considerar versionado.',
      'Verifica siempre: "¿Un usuario que creó su cuenta ayer seguirá viendo sus datos?" Si no es un "sí" claro, falta migración/fallback.',
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
  fetchErrors: SchemaErrorInfo[]
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
    top_issues: [
      ...fetchErrors.slice(0, 3).map((e) => ({
        type: 'schema_mismatch',
        description: `${e.table}.${e.column} no existe`,
      })),
      ...errorGroups.slice(0, 3).map((g) => ({
        type: 'error_spike',
        description: `${g.message.slice(0, 80)} (${g.count}x)`,
      })),
    ],
  };
}

// ── Main Export Generator ──────────────────────────────────

export interface ExportProgress {
  step: string;
  pct: number;
}

/** Limite de exports por dia. El hook lo valida antes de llamar a esta funcion. */
export const MAX_EXPORTS_PER_DAY = 5;

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

  // 2. Run quality checks in PARALLEL
  report('Ejecutando checks de calidad...', 80);
  const qualityChecks = await Promise.all(
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
  );

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
    sheets
  );

  const executiveSummary = buildExecutiveSummary(
    sheets,
    qualityChecks,
    errorGroups,
    fetchErrorsParsed
  );

  const ROWS_FULL_THRESHOLD = 50;
  const SAMPLE_SIZE = 5;

  const jsonPayload = {
    meta: {
      app: 'Paw Friend',
      schema_version: 2,
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
        error: s.error ?? null,
        aggregates: calcAggregates(id, rows),
        anomaly_rows: detectAnomalies(id, rows),
        sample_rows: isErrorLogs ? [] : rows.slice(0, SAMPLE_SIZE),
        full_rows: includeFullRows ? rows : null,
      };
    }),
    error_logs_grouped: errorGroups,
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

/**
 * AdminDataExport — export CSV de datos clave para análisis cohort / investor DD.
 *
 * Origen: plan 90d — "admin sistema export CSV usuarios + pets".
 * Casos de uso:
 *   - Cohort analysis offline (BigQuery, Sheets).
 *   - Adjuntar a postulación CORFO / deck angels.
 *   - Backup rapido antes de migración riesgosa.
 *   - Snapshot para ritual semanal.
 *
 * Scope: export CSV client-side (no guarda blob en storage). Data sensible
 * se omite (email parcial hasheado, sin phone, sin address). Para export
 * completo con PII, admin usa pg_dump desde Supabase Dashboard.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Users, PawPrint, Briefcase, Heart } from '@/lib/icons';
import { toast } from 'sonner';
import { errorMessageForUser } from '@/lib/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type ExportKey = 'users' | 'pets' | 'vets' | 'donations';

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce<Set<string>>((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set())
  );
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(','));
  }
  return lines.join('\n');
}

function downloadCSV(filename: string, csv: string) {
  const bom = '\uFEFF'; // BOM para que Excel lea UTF-8 correcto
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Partial-hash email for privacy: "pedro@example.com" → "p***@example.com" */
function maskEmail(email: string | null): string {
  if (!email) return '';
  const at = email.indexOf('@');
  if (at <= 1) return '***' + email.slice(at);
  return email[0] + '***' + email.slice(at);
}

// ─────────────────────────────────────────────────────────────
// Exports por categoria
// ─────────────────────────────────────────────────────────────

async function exportUsers(): Promise<Record<string, unknown>[]> {
  const { data } = await sb
    .from('profiles')
    .select('id, display_name, plan_id, is_premium, pet_count, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(5000);
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id,
    display_name: r.display_name,
    plan_id: r.plan_id,
    is_premium: r.is_premium,
    pet_count: r.pet_count ?? 0,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

async function exportPets(): Promise<Record<string, unknown>[]> {
  const { data } = await sb
    .from('pets')
    .select(
      'id, species, breed, birth_date, gender, neutered, lifecycle_status, owner_id, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(10000);
  return data || [];
}

async function exportVets(): Promise<Record<string, unknown>[]> {
  const { data } = await sb
    .from('service_providers')
    .select(
      'id, display_name, provider_type, provider_plan, status, commune, is_directory_visible, directory_views, created_at'
    )
    .order('created_at', { ascending: false });
  return (data || []).map((r: Record<string, unknown>) => ({
    ...r,
    // Anonymize display_name parcial solo si no está publicado en directorio
    display_name: r.is_directory_visible ? r.display_name : maskEmail(r.display_name as string),
  }));
}

async function exportDonations(): Promise<Record<string, unknown>[]> {
  const { data } = await sb
    .from('donations')
    .select('id, amount_clp, status, frequency, source, created_at, paid_at, beneficiary_type')
    .order('created_at', { ascending: false });
  return data || [];
}

const EXPORTERS: Record<
  ExportKey,
  { label: string; icon: typeof Users; fetch: () => Promise<Record<string, unknown>[]> }
> = {
  users: { label: 'Usuarios', icon: Users, fetch: exportUsers },
  pets: { label: 'Mascotas', icon: PawPrint, fetch: exportPets },
  vets: { label: 'Veterinarios', icon: Briefcase, fetch: exportVets },
  donations: { label: 'Donaciones', icon: Heart, fetch: exportDonations },
};

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────

export default function AdminDataExport() {
  const [loading, setLoading] = useState<ExportKey | null>(null);
  const [lastCount, setLastCount] = useState<Partial<Record<ExportKey, number>>>({});

  const run = async (key: ExportKey) => {
    setLoading(key);
    try {
      const rows = await EXPORTERS[key].fetch();
      if (rows.length === 0) {
        toast.info(`No hay datos en ${EXPORTERS[key].label.toLowerCase()}`);
        return;
      }
      const csv = toCSV(rows);
      const today = new Date().toISOString().slice(0, 10);
      downloadCSV(`paw-friend-${key}-${today}.csv`, csv);
      setLastCount((prev) => ({ ...prev, [key]: rows.length }));
      toast.success(`${rows.length} filas exportadas`, {
        description: `paw-friend-${key}-${today}.csv`,
      });
    } catch (err: unknown) {
      const message = errorMessageForUser(err);
      toast.error(`No se pudo exportar ${EXPORTERS[key].label}`, { description: message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exportar datos a CSV</CardTitle>
        <p className="text-xs text-muted-foreground">
          Snapshots para análisis cohort, postulaciones y backup. Data sensible se omite. Para
          export completo con PII, usar <code>pg_dump</code> desde Supabase Dashboard.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(EXPORTERS) as ExportKey[]).map((key) => {
            const { label, icon: Icon } = EXPORTERS[key];
            const isLoading = loading === key;
            const count = lastCount[key];
            return (
              <Button
                key={key}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2"
                onClick={() => run(key)}
                disabled={loading !== null}
              >
                <div className="flex items-center gap-2 w-full">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-sm font-medium">{label}</span>
                  <Download className="h-3.5 w-3.5 ml-auto opacity-60" />
                </div>
                {count !== undefined && (
                  <span className="text-[10px] text-muted-foreground">
                    Última export: {count} filas
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

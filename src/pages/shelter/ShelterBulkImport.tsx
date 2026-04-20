/**
 * Carga masiva de mascotas en bloque desde CSV o Excel.
 *
 * Flujo:
 *   1. Descargar template (CSV)
 *   2. Subir archivo (CSV o XLSX) via xlsx library
 *   3. Validar rows con zod row-by-row
 *   4. Mostrar preview con errores destacados
 *   5. Confirmar -> insert batch en pets + log en adoption_bulk_imports
 *
 * Limite: 500 filas por import (soft limit en UI, hard cuando hagamos
 * edge function dedicada).
 */
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useShelter } from '@/hooks/useShelter';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';

const MAX_ROWS = 500;

const TEMPLATE_HEADERS = [
  'name',
  'species',
  'breed',
  'sex',
  'birth_year',
  'birth_month',
  'size',
  'description',
  'temperament',
  'photo_url',
  'sterilized',
  'vaccinated',
  'dewormed',
  'microchip',
  'health_status',
  'shelter_notes',
] as const;

const TEMPLATE_SAMPLE_ROWS: Record<string, string>[] = [
  {
    name: 'Luna',
    species: 'perro',
    breed: 'Mestizo',
    sex: 'hembra',
    birth_year: '2022',
    birth_month: '3',
    size: 'mediano',
    description: 'Cariñosa, se lleva bien con otros perros.',
    temperament: 'tranquila, sociable',
    photo_url: '',
    sterilized: 'si',
    vaccinated: 'si',
    dewormed: 'si',
    microchip: '',
    health_status: 'Sana, controles al dia',
    shelter_notes: 'Rescatada en diciembre 2025',
  },
  {
    name: 'Rocco',
    species: 'perro',
    breed: 'Labrador mix',
    sex: 'macho',
    birth_year: '2019',
    birth_month: '',
    size: 'grande',
    description: 'Buena onda, necesita familia activa.',
    temperament: 'juguetón',
    photo_url: '',
    sterilized: 'si',
    vaccinated: 'si',
    dewormed: 'si',
    microchip: '',
    health_status: 'Controlado, sin condiciones',
    shelter_notes: '',
  },
];

const rowSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(80),
  species: z
    .string()
    .min(1, 'Especie requerida')
    .transform((s) => s.toLowerCase().trim()),
  breed: z.string().optional(),
  sex: z.enum(['macho', 'hembra', 'desconocido']).optional().or(z.literal('')),
  birth_year: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : Number(v)))
    .refine((v) => v === null || (v >= 1990 && v <= new Date().getFullYear()), 'Año invalido'),
  birth_month: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : Number(v)))
    .refine((v) => v === null || (v >= 1 && v <= 12), 'Mes invalido'),
  size: z.enum(['pequeño', 'mediano', 'grande', 'gigante']).optional().or(z.literal('')),
  description: z.string().optional(),
  temperament: z.string().optional(),
  photo_url: z
    .string()
    .url()
    .optional()
    .or(z.literal(''))
    .or(z.null())
    .transform((v) => v || null),
  sterilized: z.string().optional(),
  vaccinated: z.string().optional(),
  dewormed: z.string().optional(),
  microchip: z.string().optional(),
  health_status: z.string().optional(),
  shelter_notes: z.string().optional(),
});

type ValidatedRow = z.infer<typeof rowSchema>;

interface ParsedRow {
  rowIndex: number;
  raw: Record<string, unknown>;
  parsed?: ValidatedRow;
  error?: string;
}

function toBool(v?: string): boolean | null {
  if (!v) return null;
  const s = v.toString().trim().toLowerCase();
  if (['si', 'sí', 'yes', 'true', '1'].includes(s)) return true;
  if (['no', 'false', '0'].includes(s)) return false;
  return null;
}

function downloadTemplate() {
  const csv = [
    TEMPLATE_HEADERS.join(','),
    ...TEMPLATE_SAMPLE_ROWS.map((r) =>
      TEMPLATE_HEADERS.map((h) => {
        const v = r[h] ?? '';
        return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'paw-friend-mascotas-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ShelterBulkImport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { shelter, isLoading: shelterLoading } = useShelter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [filename, setFilename] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);

  const validCount = useMemo(() => rows.filter((r) => r.parsed && !r.error).length, [rows]);
  const errorCount = useMemo(() => rows.filter((r) => r.error).length, [rows]);

  const handleFile = async (file: File) => {
    setResult(null);
    setFilename(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (raw.length === 0) {
        toast.error('El archivo esta vacio');
        return;
      }
      if (raw.length > MAX_ROWS) {
        toast.error(`Maximo ${MAX_ROWS} filas por import. Divide el archivo.`);
        return;
      }
      const parsed: ParsedRow[] = raw.map((row, i) => {
        const parse = rowSchema.safeParse(row);
        if (parse.success) {
          return { rowIndex: i + 2, raw: row, parsed: parse.data };
        }
        return {
          rowIndex: i + 2,
          raw: row,
          error: parse.error.issues.map((is) => `${is.path.join('.')}: ${is.message}`).join('; '),
        };
      });
      setRows(parsed);
      toast.success(`${parsed.length} filas leidas`);
    } catch (err) {
      console.error(err);
      toast.error('No pudimos leer el archivo. Usa CSV o XLSX.');
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const clear = () => {
    setRows([]);
    setFilename(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleImport = async () => {
    if (!shelter || !user) return;
    const validRows = rows.filter((r) => r.parsed && !r.error);
    if (validRows.length === 0) {
      toast.error('No hay filas validas para importar');
      return;
    }
    setImporting(true);
    try {
      // Enviar al edge fn bulk-import-pets: evita timeouts cliente +
      // rate limit server-side + auth verificada en edge.
      const rowsPayload = validRows.map((r) => {
        const p = r.parsed!;
        const raw = r.raw as Record<string, string>;
        return {
          name: p.name,
          species: p.species,
          breed: p.breed,
          sex: p.sex,
          birth_year: p.birth_year,
          birth_month: p.birth_month,
          size: p.size,
          description: p.description,
          temperament: p.temperament,
          photo_url: p.photo_url,
          microchip: p.microchip,
          health_status: p.health_status,
          shelter_notes: p.shelter_notes,
          sterilized: raw.sterilized,
          vaccinated: raw.vaccinated,
          dewormed: raw.dewormed,
        };
      });

      const { data, error } = await supabase.functions.invoke('bulk-import-pets', {
        body: {
          adoption_center_id: shelter.id,
          filename,
          rows: rowsPayload,
        },
      });

      if (error) throw error;
      const result = data as {
        success?: boolean;
        inserted?: number;
        batch_errors?: number;
        invalid_rows?: number;
        error?: string;
      } | null;

      if (!result || result.error) {
        throw new Error(result?.error || 'Respuesta invalida de bulk-import-pets');
      }

      await queryClient.invalidateQueries({ queryKey: ['shelter'] });
      await queryClient.invalidateQueries({ queryKey: ['shelter-pets'] });

      const inserted = result.inserted ?? 0;
      const fail = (result.batch_errors ?? 0) + (result.invalid_rows ?? 0);
      setResult({ ok: inserted, fail });
      toast.success(`${inserted} mascotas cargadas`);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  if (shelterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Carga masiva de mascotas"
        subtitle={shelter?.legal_name}
        onBack={() => navigate('/shelter/dashboard')}
      />
      <div className="container max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Paso 1: template */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-sm">1. Descarga el template</h2>
            <p className="text-sm text-muted-foreground">
              Abrelo en Excel o Google Sheets y completa una fila por mascota. Sube el archivo
              abajo. Maximo {MAX_ROWS} filas por carga.
            </p>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-1" /> Descargar template CSV
            </Button>
          </CardContent>
        </Card>

        {/* Paso 2: upload */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-sm">2. Sube tu archivo</h2>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onChange}
              aria-label="Subir archivo CSV o Excel con mascotas"
              className="block text-sm file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
            {filename && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" /> {filename}
                </span>
                <Button variant="ghost" size="sm" onClick={clear}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paso 3: preview */}
        {rows.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">3. Revisa y confirma</h2>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" /> {validCount} validas
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" /> {errorCount} con
                      errores
                    </Badge>
                  )}
                </div>
              </div>

              {errorCount > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Hay {errorCount} filas con errores que no se importaran. Corrige en Excel y sube
                    el archivo de nuevo, o continua e importa solo las validas.
                  </AlertDescription>
                </Alert>
              )}

              <div className="max-h-96 overflow-auto border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Nombre</th>
                      <th className="text-left p-2">Especie</th>
                      <th className="text-left p-2">Raza</th>
                      <th className="text-left p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.rowIndex} className="border-t">
                        <td className="p-2 text-muted-foreground">{r.rowIndex}</td>
                        <td className="p-2 font-medium">
                          {(r.raw as Record<string, unknown>).name?.toString() || '-'}
                        </td>
                        <td className="p-2">
                          {(r.raw as Record<string, unknown>).species?.toString() || '-'}
                        </td>
                        <td className="p-2">
                          {(r.raw as Record<string, unknown>).breed?.toString() || '-'}
                        </td>
                        <td className="p-2">
                          {r.error ? (
                            <span className="text-amber-700" title={r.error}>
                              Error
                            </span>
                          ) : (
                            <span className="text-green-700">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clear} disabled={importing}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={importing || validCount === 0}>
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importando
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" /> Importar {validCount} mascotas
                    </>
                  )}
                </Button>
              </div>

              {result && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    {result.ok} mascotas importadas correctamente.
                    {result.fail > 0 && ` ${result.fail} fallaron (revisa el log en admin).`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

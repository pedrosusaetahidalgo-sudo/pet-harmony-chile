import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, Download, Loader2, AlertTriangle, CheckCircle2, X } from '@/lib/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  parseCSV,
  generateTemplate,
  rowToCreatePatientPayload,
  type ParsedRow,
} from '@/lib/importPatients';

interface ImportPatientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'done';

interface ImportResult {
  total: number;
  created: number;
  invited: number;
  errors: number;
  errorDetails: string[];
}

export function ImportPatientsModal({ open, onOpenChange, onComplete }: ImportPatientsModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setRows([]);
    setPasteText('');
    setResult(null);
    setImportProgress(0);
  }, []);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    },
    [onOpenChange, reset]
  );

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error('No se encontraron datos', {
          description: 'El archivo debe tener un encabezado y al menos una fila de datos.',
        });
        return;
      }
      setRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const handlePaste = useCallback(() => {
    if (!pasteText.trim()) return;
    const parsed = parseCSV(pasteText);
    if (parsed.length === 0) {
      toast.error('No se pudieron parsear los datos', {
        description:
          'Asegurate de incluir un encabezado (nombre_mascota, especie, ...) en la primera fila.',
      });
      return;
    }
    setRows(parsed);
    setStep('preview');
  }, [pasteText]);

  const handleDownloadTemplate = useCallback(() => {
    const csv = generateTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_pacientes_pawfriend.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const toggleRow = useCallback((index: number) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, _selected: !r._selected } : r)));
  }, []);

  const selectedRows = rows.filter((r) => r._selected);

  const handleImport = useCallback(async () => {
    if (selectedRows.length === 0) return;

    setStep('importing');
    setImportProgress(0);

    const importResult: ImportResult = {
      total: selectedRows.length,
      created: 0,
      invited: 0,
      errors: 0,
      errorDetails: [],
    };

    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i];
      try {
        const payload = rowToCreatePatientPayload(row);
        const { data, error } = await supabase.functions.invoke('create-patient', {
          body: payload,
        });

        if (error) {
          importResult.errors++;
          importResult.errorDetails.push(
            `Fila ${row._rowIndex}: ${row.nombre_mascota} — ${error.message}`
          );
        } else if (data?.success) {
          importResult.created++;
          if (data.email_sent) importResult.invited++;
        } else {
          importResult.errors++;
          importResult.errorDetails.push(
            `Fila ${row._rowIndex}: ${row.nombre_mascota} — ${data?.message || 'Error desconocido'}`
          );
        }
      } catch (err: unknown) {
        importResult.errors++;
        importResult.errorDetails.push(
          `Fila ${row._rowIndex}: ${row.nombre_mascota} — ${(err as Error).message}`
        );
      }

      setImportProgress(Math.round(((i + 1) / selectedRows.length) * 100));
    }

    setResult(importResult);
    setStep('done');

    if (importResult.created > 0) {
      onComplete();
    }
  }, [selectedRows, onComplete]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-600" />
            Importar pacientes
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Sube un archivo CSV o pega datos desde Excel.'}
            {step === 'preview' &&
              `${rows.length} filas encontradas. Revisa y selecciona antes de importar.`}
            {step === 'importing' && `Importando... ${importProgress}%`}
            {step === 'done' && 'Importación completada.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-4 mt-2">
            {/* CSV upload */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-24 border-dashed border-2 flex flex-col gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm">Seleccionar archivo CSV</span>
                <span className="text-[10px] text-muted-foreground">
                  .csv, .tsv o .txt con columnas separadas
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                aria-label="Subir archivo CSV de pacientes"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">o pega desde Excel</span>
              <div className="flex-1 border-t" />
            </div>

            {/* Paste area */}
            <div className="space-y-2">
              <Textarea
                placeholder={`nombre_mascota\tespecie\traza\tnombre_dueno\temail_dueno\nMax\tPerro\tGolden\tMaría\tmaria@email.com`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              <Button onClick={handlePaste} disabled={!pasteText.trim()} className="w-full">
                Parsear datos
              </Button>
            </div>

            {/* Download template */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs gap-1"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-3.5 w-3.5" />
              Descargar plantilla CSV
            </Button>
          </div>
        )}

        {/* ── Step: Preview ── */}
        {step === 'preview' && (
          <div className="space-y-3 mt-2">
            {/* Summary */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium">{rows.length} filas</span>
              <span className="text-green-600">
                {rows.filter((r) => r._errors.length === 0).length} válidas
              </span>
              {rows.some((r) => r._errors.length > 0) && (
                <span className="text-red-500">
                  {rows.filter((r) => r._errors.length > 0).length} con errores
                </span>
              )}
              {rows.some((r) => r._isDuplicate) && (
                <span className="text-amber-500">
                  {rows.filter((r) => r._isDuplicate).length} posibles duplicados
                </span>
              )}
            </div>

            {/* Table */}
            <ScrollArea className="h-[350px] rounded-md border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="p-2 text-left w-8">
                      <span className="sr-only">Seleccionar</span>
                    </th>
                    <th className="p-2 text-left">Mascota</th>
                    <th className="p-2 text-left">Especie</th>
                    <th className="p-2 text-left">Raza</th>
                    <th className="p-2 text-left">Dueño</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left w-16">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b hover:bg-muted/30 ${row._errors.length > 0 ? 'bg-red-50/50' : ''} ${row._isDuplicate ? 'bg-amber-50/50' : ''}`}
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={row._selected}
                          onCheckedChange={() => toggleRow(idx)}
                          disabled={row._errors.length > 0}
                        />
                      </td>
                      <td className="p-2 font-medium">{row.nombre_mascota}</td>
                      <td className="p-2">{row.especie}</td>
                      <td className="p-2 text-muted-foreground">{row.raza || '—'}</td>
                      <td className="p-2">{row.nombre_dueno}</td>
                      <td className="p-2 text-muted-foreground">{row.email_dueno || '—'}</td>
                      <td className="p-2">
                        {row._errors.length > 0 ? (
                          <Badge
                            variant="destructive"
                            className="text-[9px]"
                            title={row._errors.join(', ')}
                          >
                            Error
                          </Badge>
                        ) : row._isDuplicate ? (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-amber-100 text-amber-700"
                          >
                            Duplicado
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-green-100 text-green-700"
                          >
                            OK
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={reset}>
                Volver
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {selectedRows.length} de {rows.length} seleccionados
                </span>
                <Button onClick={handleImport} disabled={selectedRows.length === 0}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar {selectedRows.length} pacientes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step: Importing ── */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <div className="text-center">
              <p className="text-sm font-medium">Importando pacientes...</p>
              <p className="text-xs text-muted-foreground mt-1">{importProgress}% completado</p>
            </div>
            <div className="w-full max-w-xs h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === 'done' && result && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  {result.created} pacientes creados
                </p>
                <p className="text-xs text-green-600">
                  {result.invited > 0 && `${result.invited} invitaciones enviadas. `}
                  {result.errors > 0 && `${result.errors} errores.`}
                </p>
              </div>
            </div>

            {result.errorDetails.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Errores ({result.errorDetails.length})
                </p>
                <div className="max-h-32 overflow-y-auto text-[11px] text-red-500 space-y-0.5 bg-red-50/50 rounded p-2">
                  {result.errorDetails.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={() => handleClose(false)}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

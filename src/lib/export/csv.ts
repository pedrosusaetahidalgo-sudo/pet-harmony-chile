/**
 * CC-33 (Booking V3 Master Plan §28 TICKET-30) — util mínimo para
 * exportar datos a CSV. UTF-8 con BOM para que Excel español abra
 * correctamente.
 *
 * Preferimos este utility sobre la dep `papaparse` para mantener el
 * bundle chico: el CSV que generamos siempre es simple (sin quoted
 * newlines ni binary fields).
 */

/** Escapa un valor celular según RFC 4180 (comillas + coma + newline). */
function escapeCsvCell(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  // Si contiene ", , o newline → envolver en comillas y duplicar comillas internas.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Construye un CSV string.
 *
 * @param rows Array de objetos. Cada key aparece como columna.
 * @param headers Opcional: orden + display names de columnas. Si no se pasa,
 *                usa `Object.keys(rows[0])`.
 */
export function buildCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers?: Array<{ key: keyof T & string; label: string }>
): string {
  if (rows.length === 0) return '';

  const cols = headers ?? Object.keys(rows[0]).map((k) => ({ key: k, label: k }));

  const lines: string[] = [];

  // Header row
  lines.push(cols.map((c) => escapeCsvCell(c.label)).join(','));

  // Data rows
  for (const row of rows) {
    lines.push(cols.map((c) => escapeCsvCell(row[c.key])).join(','));
  }

  return lines.join('\r\n');
}

/**
 * Dispara descarga de un CSV. BOM UTF-8 al inicio para compatibilidad Excel.
 * SSR-safe.
 */
export function downloadCsv(content: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

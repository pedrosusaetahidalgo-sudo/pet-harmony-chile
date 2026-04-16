import { z } from 'zod';

export const importRowSchema = z.object({
  nombre_mascota: z.string().min(1, 'Nombre requerido').max(50),
  especie: z.string().min(1, 'Especie requerida'),
  raza: z.string().optional().default(''),
  fecha_nacimiento: z.string().optional().default(''),
  sexo: z.string().optional().default(''),
  nombre_dueno: z.string().min(2, 'Nombre dueño requerido'),
  email_dueno: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono_dueno: z.string().optional().default(''),
  notas: z.string().optional().default(''),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export interface ParsedRow extends ImportRow {
  _rowIndex: number;
  _errors: string[];
  _isDuplicate: boolean;
  _selected: boolean;
}

const HEADERS = [
  'nombre_mascota',
  'especie',
  'raza',
  'fecha_nacimiento',
  'sexo',
  'nombre_dueno',
  'email_dueno',
  'telefono_dueno',
  'notas',
] as const;

const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  nombre_mascota: 'nombre_mascota',
  nombre: 'nombre_mascota',
  mascota: 'nombre_mascota',
  pet_name: 'nombre_mascota',
  especie: 'especie',
  species: 'especie',
  raza: 'raza',
  breed: 'raza',
  fecha_nacimiento: 'fecha_nacimiento',
  birth_date: 'fecha_nacimiento',
  nacimiento: 'fecha_nacimiento',
  sexo: 'sexo',
  sex: 'sexo',
  genero: 'sexo',
  nombre_dueno: 'nombre_dueno',
  dueno: 'nombre_dueno',
  owner_name: 'nombre_dueno',
  owner: 'nombre_dueno',
  email_dueno: 'email_dueno',
  email: 'email_dueno',
  owner_email: 'email_dueno',
  telefono_dueno: 'telefono_dueno',
  telefono: 'telefono_dueno',
  phone: 'telefono_dueno',
  notas: 'notas',
  notes: 'notas',
  observaciones: 'notas',
};

function detectDelimiter(firstLine: string): string {
  // Count occurrences of common delimiters
  const counts = {
    ',': (firstLine.match(/,/g) || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return best[0][1] > 0 ? best[0][0] : ',';
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCSVLine(lines[0], delimiter);

  // Map headers to known fields
  const headerMap: (keyof ImportRow | null)[] = rawHeaders.map((h) => {
    const normalized = h.toLowerCase().replace(/[^a-z_]/g, '');
    return HEADER_ALIASES[normalized] || null;
  });

  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row: Record<string, string> = {};

    headerMap.forEach((key, idx) => {
      if (key && idx < values.length) {
        row[key] = values[idx] || '';
      }
    });

    // Validate with zod
    const result = importRowSchema.safeParse(row);
    const errors: string[] = [];

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      });
    }

    const data = result.success ? result.data : (row as unknown as ImportRow);

    rows.push({
      ...data,
      _rowIndex: i,
      _errors: errors,
      _isDuplicate: false,
      _selected: errors.length === 0,
    });
  }

  // Detect duplicates (same name + species + email)
  const seen = new Map<string, number>();
  rows.forEach((row, idx) => {
    const key = `${row.nombre_mascota?.toLowerCase()}|${row.especie?.toLowerCase()}|${row.email_dueno?.toLowerCase()}`;
    if (seen.has(key)) {
      row._isDuplicate = true;
      const firstIdx = seen.get(key)!;
      rows[firstIdx]._isDuplicate = true;
    } else {
      seen.set(key, idx);
    }
  });

  return rows;
}

/** Generate a downloadable CSV template */
export function generateTemplate(): string {
  const header = HEADERS.join(',');
  const example =
    'Max,Perro,Golden Retriever,2023-05-15,Macho,María López,maria@email.com,+56912345678,Alérgico a pollo';
  return `${header}\n${example}`;
}

/** Convert ParsedRow to the payload expected by create-patient edge function */
export function rowToCreatePatientPayload(row: ImportRow) {
  return {
    name: row.nombre_mascota,
    species: row.especie,
    breed: row.raza || undefined,
    birth_date: row.fecha_nacimiento || undefined,
    sex: normalizeSex(row.sexo),
    owner_name: row.nombre_dueno,
    owner_email: row.email_dueno || undefined,
    owner_phone: row.telefono_dueno || undefined,
    notes: row.notas || undefined,
    force_create: true, // Skip duplicate check for imports (already handled in preview)
  };
}

function normalizeSex(sex: string | undefined): string | undefined {
  if (!sex) return undefined;
  const lower = sex.toLowerCase().trim();
  if (lower === 'macho' || lower === 'm' || lower === 'male') return 'macho';
  if (lower === 'hembra' || lower === 'h' || lower === 'female' || lower === 'f') return 'hembra';
  return undefined;
}

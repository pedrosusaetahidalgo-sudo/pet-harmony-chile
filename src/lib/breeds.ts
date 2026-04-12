/**
 * Razas mas comunes por especie en Chile.
 * Se usa para combobox con búsqueda en el formulario de agregar mascota.
 */

export interface BreedOption {
  value: string;
  label: string;
}

export const BREEDS_BY_SPECIES: Record<string, BreedOption[]> = {
  perro: [
    { value: 'quiltro_mestizo', label: 'Quiltro (mestizo)' },
    { value: 'pastor_aleman', label: 'Pastor alemán' },
    { value: 'labrador_retriever', label: 'Labrador retriever' },
    { value: 'golden_retriever', label: 'Golden retriever' },
    { value: 'bulldog_frances', label: 'Bulldog francés' },
    { value: 'poodle_caniche', label: 'Poodle / Caniche' },
    { value: 'chihuahua', label: 'Chihuahua' },
    { value: 'yorkshire_terrier', label: 'Yorkshire terrier' },
    { value: 'schnauzer', label: 'Schnauzer' },
    { value: 'cocker_spaniel', label: 'Cocker spaniel' },
    { value: 'beagle', label: 'Beagle' },
    { value: 'husky_siberiano', label: 'Husky siberiano' },
    { value: 'rottweiler', label: 'Rottweiler' },
    { value: 'dalmata', label: 'Dálmata' },
    { value: 'boxer', label: 'Boxer' },
    { value: 'doberman', label: 'Doberman' },
    { value: 'border_collie', label: 'Border collie' },
    { value: 'jack_russell_terrier', label: 'Jack russell terrier' },
    { value: 'dachshund_salchicha', label: 'Dachshund / Salchicha' },
    { value: 'pastor_suizo_blanco', label: 'Pastor suizo blanco' },
    { value: 'shih_tzu', label: 'Shih tzu' },
    { value: 'pug_carlino', label: 'Pug / Carlino' },
    { value: 'bichon_frise', label: 'Bichón frisé' },
    { value: 'maltes', label: 'Maltés' },
    { value: 'bull_terrier', label: 'Bull terrier' },
    { value: 'pit_bull_terrier', label: 'Pit bull terrier' },
    { value: 'weimaraner', label: 'Weimaraner' },
    { value: 'pointer_aleman', label: 'Pointer alemán' },
    { value: 'san_bernardo', label: 'San bernardo' },
    { value: 'gran_danes', label: 'Gran danés' },
    { value: 'akita_inu', label: 'Akita inu' },
    { value: 'shar_pei', label: 'Shar pei' },
    { value: 'pomerania', label: 'Pomerania' },
    { value: 'basenji', label: 'Basenji' },
    { value: 'samoyedo', label: 'Samoyedo' },
    { value: 'chow_chow', label: 'Chow chow' },
    { value: 'galgo', label: 'Galgo' },
    { value: 'fox_terrier', label: 'Fox terrier' },
    { value: 'pastor_australiano', label: 'Pastor australiano' },
    { value: 'cavalier_king_charles', label: 'Cavalier king charles' },
  ],
  gato: [
    { value: 'mestizo', label: 'Mestizo' },
    { value: 'siames', label: 'Siamés' },
    { value: 'persa', label: 'Persa' },
    { value: 'maine_coon', label: 'Maine coon' },
    { value: 'ragdoll', label: 'Ragdoll' },
    { value: 'bengali', label: 'Bengalí' },
    { value: 'british_shorthair', label: 'British shorthair' },
    { value: 'angora', label: 'Angora' },
    { value: 'sphynx', label: 'Sphynx' },
    { value: 'scottish_fold', label: 'Scottish fold' },
    { value: 'abisinio', label: 'Abisinio' },
    { value: 'birmano', label: 'Birmano / Sagrado de birmania' },
    { value: 'ruso_azul', label: 'Ruso azul' },
    { value: 'exotico_pelo_corto', label: 'Exótico de pelo corto' },
    { value: 'chartreux', label: 'Chartreux' },
  ],
  conejo: [
    { value: 'mestizo', label: 'Mestizo' },
    { value: 'mini_lop', label: 'Mini lop' },
    { value: 'holland_lop', label: 'Holland lop' },
    { value: 'rex', label: 'Rex' },
    { value: 'angora', label: 'Angora' },
    { value: 'cabeza_de_leon', label: 'Cabeza de león' },
    { value: 'enano_holandes', label: 'Enano holandés' },
    { value: 'belier', label: 'Belier' },
  ],
  hamster: [
    { value: 'sirio_dorado', label: 'Sirio / Dorado' },
    { value: 'ruso_campbell', label: 'Ruso / Campbell' },
    { value: 'roborovski', label: 'Roborovski' },
    { value: 'chino', label: 'Chino' },
  ],
  ave: [
    { value: 'periquito_australiano', label: 'Periquito australiano' },
    { value: 'canario', label: 'Canario' },
    { value: 'cacatua', label: 'Cacatúa' },
    { value: 'agapornis', label: 'Agapornis' },
    { value: 'ninfa_cockatiel', label: 'Ninfa / Cockatiel' },
    { value: 'loro_amazona', label: 'Loro amazona' },
    { value: 'guacamayo', label: 'Guacamayo' },
    { value: 'jilguero', label: 'Jilguero' },
  ],
  tortuga: [
    { value: 'orejas_rojas', label: 'Tortuga de orejas rojas' },
    { value: 'rusa', label: 'Tortuga rusa' },
    { value: 'sulcata', label: 'Tortuga sulcata' },
    { value: 'de_caja', label: 'Tortuga de caja' },
    { value: 'estrellada', label: 'Tortuga estrellada' },
  ],
  pez: [
    { value: 'betta', label: 'Betta' },
    { value: 'goldfish', label: 'Goldfish / Carassius' },
    { value: 'neon', label: 'Neón' },
    { value: 'guppy', label: 'Guppy' },
    { value: 'angel_escalar', label: 'Ángel / Escalar' },
    { value: 'disco', label: 'Disco' },
    { value: 'pleco', label: 'Pleco' },
    { value: 'molly', label: 'Molly' },
    { value: 'corydora', label: 'Corydora' },
  ],
};

/**
 * Filtra razas por texto de búsqueda (fuzzy simple).
 */
export function filterBreeds(species: string, query: string): BreedOption[] {
  const breeds = BREEDS_BY_SPECIES[species] || [];
  if (!query.trim()) return breeds;
  const q = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return breeds.filter((b) =>
    b.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(q)
  );
}

/**
 * Resolve a breed value to its display label.
 * Handles "otro:texto" values from ComboboxWithOther.
 */
export function getBreedLabel(species: string, value: string): string {
  if (!value) return '';
  if (value.startsWith('otro:')) return value.slice(5) || 'Otro';
  const breeds = BREEDS_BY_SPECIES[species] || [];
  return breeds.find((b) => b.value === value)?.label ?? value;
}

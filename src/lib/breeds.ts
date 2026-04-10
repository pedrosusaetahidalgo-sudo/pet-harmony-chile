/**
 * Razas mas comunes por especie en Chile.
 * Se usa para autocompletado fuzzy en el formulario de agregar mascota.
 */

export const BREEDS_BY_SPECIES: Record<string, string[]> = {
  perro: [
    "Quiltro (mestizo)",
    "Pastor Alemán",
    "Labrador Retriever",
    "Golden Retriever",
    "Bulldog Francés",
    "Poodle / Caniche",
    "Chihuahua",
    "Yorkshire Terrier",
    "Schnauzer",
    "Cocker Spaniel",
    "Beagle",
    "Husky Siberiano",
    "Rottweiler",
    "Dálmata",
    "Boxer",
    "Doberman",
    "Border Collie",
    "Jack Russell Terrier",
    "Dachshund / Salchicha",
    "Pastor Suizo Blanco",
    "Shih Tzu",
    "Pug / Carlino",
    "Bichón Frisé",
    "Maltés",
    "Bull Terrier",
    "Pit Bull Terrier",
    "Weimaraner",
    "Pointer Alemán",
    "San Bernardo",
    "Gran Danés",
    "Akita Inu",
    "Shar Pei",
    "Pomerania",
    "Basenji",
    "Samoyedo",
    "Chow Chow",
    "Galgo",
    "Fox Terrier",
    "Pastor Australiano",
    "Cavalier King Charles",
  ],
  gato: [
    "Mestizo",
    "Siamés",
    "Persa",
    "Maine Coon",
    "Ragdoll",
    "Bengalí",
    "British Shorthair",
    "Angora",
    "Sphynx",
    "Scottish Fold",
    "Abisinio",
    "Birmano / Sagrado de Birmania",
    "Ruso Azul",
    "Exótico de Pelo Corto",
    "Chartreux",
  ],
  conejo: [
    "Mestizo",
    "Mini Lop",
    "Holland Lop",
    "Rex",
    "Angora",
    "Cabeza de León",
    "Enano Holandés",
    "Belier",
  ],
  hamster: [
    "Sirio / Dorado",
    "Ruso / Campbell",
    "Roborovski",
    "Chino",
  ],
  ave: [
    "Periquito Australiano",
    "Canario",
    "Cacatúa",
    "Agapornis",
    "Ninfa / Cockatiel",
    "Loro Amazona",
    "Guacamayo",
    "Jilguero",
  ],
  tortuga: [
    "Tortuga de Orejas Rojas",
    "Tortuga Rusa",
    "Tortuga Sulcata",
    "Tortuga de Caja",
    "Tortuga Estrellada",
  ],
  pez: [
    "Betta",
    "Goldfish / Carassius",
    "Neón",
    "Guppy",
    "Ángel / Escalar",
    "Disco",
    "Pleco",
    "Molly",
    "Corydora",
  ],
};

/**
 * Filtra razas por texto de búsqueda (fuzzy simple).
 */
export function filterBreeds(species: string, query: string): string[] {
  const breeds = BREEDS_BY_SPECIES[species] || [];
  if (!query.trim()) return breeds;
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return breeds.filter((b) =>
    b.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
  );
}

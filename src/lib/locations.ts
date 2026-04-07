/**
 * Comunas de la Región Metropolitana de Santiago + coordenadas centroide.
 *
 * Reemplaza Google Places Autocomplete: en lugar de pedir dirección exacta,
 * el usuario elige una comuna del dropdown y guardamos el centroide para
 * mostrar en el mapa. Suficiente para un directorio de servicios.
 */

export const COMUNAS_SANTIAGO = [
  "Cerrillos",
  "Cerro Navia",
  "Conchalí",
  "El Bosque",
  "Estación Central",
  "Huechuraba",
  "Independencia",
  "La Cisterna",
  "La Florida",
  "La Granja",
  "La Pintana",
  "La Reina",
  "Las Condes",
  "Lo Barnechea",
  "Lo Espejo",
  "Lo Prado",
  "Macul",
  "Maipú",
  "Ñuñoa",
  "Pedro Aguirre Cerda",
  "Peñalolén",
  "Providencia",
  "Pudahuel",
  "Quilicura",
  "Quinta Normal",
  "Recoleta",
  "Renca",
  "San Joaquín",
  "San Miguel",
  "San Ramón",
  "Santiago",
  "Vitacura",
] as const;

export type ComunaSantiago = (typeof COMUNAS_SANTIAGO)[number];

/** Coordenadas aproximadas (centroide) de cada comuna. */
export const COMUNA_COORDS: Record<ComunaSantiago, [number, number]> = {
  Cerrillos: [-33.4969, -70.7176],
  "Cerro Navia": [-33.4214, -70.7378],
  Conchalí: [-33.3811, -70.6750],
  "El Bosque": [-33.5614, -70.6750],
  "Estación Central": [-33.4569, -70.6839],
  Huechuraba: [-33.3681, -70.6303],
  Independencia: [-33.4181, -70.6597],
  "La Cisterna": [-33.5333, -70.6664],
  "La Florida": [-33.5226, -70.5983],
  "La Granja": [-33.5408, -70.6294],
  "La Pintana": [-33.5828, -70.6342],
  "La Reina": [-33.4458, -70.5378],
  "Las Condes": [-33.4172, -70.5476],
  "Lo Barnechea": [-33.3522, -70.5189],
  "Lo Espejo": [-33.5217, -70.6914],
  "Lo Prado": [-33.4444, -70.7250],
  Macul: [-33.4928, -70.5972],
  Maipú: [-33.5111, -70.7581],
  Ñuñoa: [-33.4569, -70.5972],
  "Pedro Aguirre Cerda": [-33.4856, -70.6722],
  Peñalolén: [-33.4844, -70.5333],
  Providencia: [-33.4314, -70.6094],
  Pudahuel: [-33.4406, -70.7639],
  Quilicura: [-33.3667, -70.7333],
  "Quinta Normal": [-33.4344, -70.6906],
  Recoleta: [-33.4053, -70.6406],
  Renca: [-33.4042, -70.7283],
  "San Joaquín": [-33.4944, -70.6336],
  "San Miguel": [-33.4969, -70.6517],
  "San Ramón": [-33.5414, -70.6422],
  Santiago: [-33.4378, -70.6504],
  Vitacura: [-33.3978, -70.5817],
};

export function getComunaCoords(comuna: string): [number, number] | null {
  return COMUNA_COORDS[comuna as ComunaSantiago] ?? null;
}

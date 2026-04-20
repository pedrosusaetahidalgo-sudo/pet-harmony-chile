/**
 * Match scoring entre adoption_posts y preferencias del adoptante.
 *
 * Heuristica simple (client-side, ordenamiento en /adoption):
 *   +5 pts  species coincide con preferencia del user
 *   +3 pts  location / comuna coincide
 *   +2 pts  size coincide con preferencia
 *   +2 pts  temperament traits compartidos (hasta 3)
 *   +1 pt   good_with_kids si user tiene flag "has_kids"
 *   +1 pt   good_with_dogs si user tiene flag "has_dogs"
 *   +1 pt   good_with_cats si user tiene flag "has_cats"
 *
 * Las preferencias del user vienen de localStorage (key `pf_adoption_prefs`)
 * o del form de "Me interesa" que ya usa AdoptionInterestDialog. Si no hay
 * preferencias, el score es 0 y se mantiene el orden original (created_at desc).
 */

export interface AdopterPreferences {
  species?: string[]; // ['perro', 'gato']
  communes?: string[]; // ['Las Condes', 'Providencia']
  sizes?: string[]; // ['mediano', 'grande']
  temperaments?: string[]; // traits deseados
  has_kids?: boolean;
  has_dogs?: boolean;
  has_cats?: boolean;
}

export interface MatchablePost {
  id: string;
  species?: string | null;
  location?: string | null;
  size?: string | null;
  temperament?: string[] | null;
  good_with_kids?: boolean | null;
  good_with_dogs?: boolean | null;
  good_with_cats?: boolean | null;
}

const LS_KEY = 'pf_adoption_prefs';

export function loadPreferences(): AdopterPreferences {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AdopterPreferences;
    return parsed || {};
  } catch {
    return {};
  }
}

export function savePreferences(prefs: AdopterPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* noop */
  }
}

export function scoreMatch(post: MatchablePost, prefs: AdopterPreferences): number {
  let score = 0;

  if (prefs.species?.length && post.species) {
    const petSpecies = post.species.toLowerCase();
    if (prefs.species.some((s) => s.toLowerCase() === petSpecies)) score += 5;
  }

  if (prefs.communes?.length && post.location) {
    const petLoc = post.location.toLowerCase();
    if (prefs.communes.some((c) => petLoc.includes(c.toLowerCase()))) score += 3;
  }

  if (prefs.sizes?.length && post.size) {
    if (prefs.sizes.some((s) => s.toLowerCase() === post.size!.toLowerCase())) score += 2;
  }

  if (prefs.temperaments?.length && post.temperament?.length) {
    const prefTraits = new Set(prefs.temperaments.map((t) => t.toLowerCase()));
    const matchCount = post.temperament.filter((t) => prefTraits.has(t.toLowerCase())).length;
    score += Math.min(matchCount, 3) * 2;
  }

  if (prefs.has_kids && post.good_with_kids) score += 1;
  if (prefs.has_dogs && post.good_with_dogs) score += 1;
  if (prefs.has_cats && post.good_with_cats) score += 1;

  return score;
}

/**
 * Ordena posts por match score descendente. Si no hay preferencias, no
 * reordena (respeta el orden original de created_at).
 */
export function rankByMatch<T extends MatchablePost>(posts: T[], prefs: AdopterPreferences): T[] {
  const hasAnyPref =
    !!prefs.species?.length ||
    !!prefs.communes?.length ||
    !!prefs.sizes?.length ||
    !!prefs.temperaments?.length ||
    !!prefs.has_kids ||
    !!prefs.has_dogs ||
    !!prefs.has_cats;
  if (!hasAnyPref) return posts;

  return [...posts]
    .map((p) => ({ post: p, score: scoreMatch(p, prefs) }))
    .sort((a, b) => b.score - a.score)
    .map((r) => r.post);
}

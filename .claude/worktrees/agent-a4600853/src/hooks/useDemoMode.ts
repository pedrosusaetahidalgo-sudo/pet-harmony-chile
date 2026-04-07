import { useSearchParams } from "react-router-dom";

/**
 * Detecta si la app se está mostrando en modo demo (`?demo=true` en la URL).
 * Solo afecta la UI: agrega badges "Perfil de demostración" y reordena listas
 * para mostrar los demos primero.
 *
 * Uso:
 *   const isDemo = useDemoMode();
 *   {isDemo && <Badge>Perfil de demostración</Badge>}
 */
export function useDemoMode(): boolean {
  const [searchParams] = useSearchParams();
  return searchParams.get("demo") === "true";
}

/**
 * Slugs canónicos de los 5 perfiles de demostración.
 * Coinciden con los generados por `generate_provider_slug()` en el seed SQL.
 */
export const DEMO_VET_SLUGS = {
  javieraMunoz: "dra-javiera-munoz",
  matiasFernandez: "dr-matias-fernandez",
  clinicaPatitas: "clinica-veterinaria-patitas",
  clinicaAltamira: "clinica-veterinaria-altamira",
  cristianRojas: "dr-cristian-rojas",
} as const;

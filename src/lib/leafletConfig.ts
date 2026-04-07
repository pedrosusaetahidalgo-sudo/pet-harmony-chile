import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix iconos default de Leaflet con Vite (bug conocido)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Icono Paw Friend (verde médico) — usado para vets / refugios médicos
export const pawFriendIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path fill="#10b981" stroke="#fff" stroke-width="2" d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>`
    ),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Icono rojo (mascotas perdidas)
export const lostPetIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path fill="#ef4444" stroke="#fff" stroke-width="2" d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>`
    ),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Icono ámbar (refugios de adopción)
export const shelterIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path fill="#f59e0b" stroke="#fff" stroke-width="2" d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>`
    ),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

export const SANTIAGO_CENTER: [number, number] = [-33.4489, -70.6693];
export const DEFAULT_ZOOM = 12;

// Tile layer estándar OpenStreetMap (gratis, sin API key)
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

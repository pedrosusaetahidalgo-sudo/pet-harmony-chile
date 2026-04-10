import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./lib/leafletConfig";

initSentry();

// Auto-reload si un chunk dinámico ya no existe (deploy nuevo + HTML stale en cache).
// Solo recarga una vez por sesión para evitar loops.
const CHUNK_KEY = "chunk-reload";
function handleChunkError() {
  if (sessionStorage.getItem(CHUNK_KEY) === "1") return;
  sessionStorage.setItem(CHUNK_KEY, "1");
  window.location.reload();
}
window.addEventListener("vite:preloadError", handleChunkError);
window.addEventListener("error", (e) => {
  if (e.message?.includes("Failed to fetch dynamically imported module") ||
      e.message?.includes("Importing a module script failed")) {
    handleChunkError();
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

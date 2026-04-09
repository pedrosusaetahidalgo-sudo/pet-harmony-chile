import { createRoot } from "react-dom/client";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import "./lib/leafletConfig";

initSentry();

// Auto-reload si un chunk dinámico ya no existe (deploy nuevo + HTML stale en cache).
// Solo recarga una vez por sesión para evitar loops.
window.addEventListener("vite:preloadError", () => {
  if (sessionStorage.getItem("chunk-reload") === "1") return;
  sessionStorage.setItem("chunk-reload", "1");
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);

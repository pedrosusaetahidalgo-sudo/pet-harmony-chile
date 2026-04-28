import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from '@/lib/icons';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  isChunkError: boolean;
}

/**
 * Sprint 1 P1 MOB-010 (2026-04-28): detecta ChunkLoadError. Tipico cuando hay
 * un deploy nuevo y el cliente con pestana abierta intenta navegar a una ruta
 * lazy cuyo chunk ya no existe en /docs/assets (Vite emite hashes nuevos).
 *
 * Patron: el chunk pide un .js que devuelve 404 → React lanza error con
 * `name === 'ChunkLoadError'` o mensaje que incluye "Loading chunk" /
 * "dynamically imported module". Recovery: hard reload una sola vez (auto)
 * para que el browser tome el nuevo HTML y los hashes actualizados.
 *
 * Para evitar loops infinitos (caso edge: el reload no resuelve), persistimos
 * un flag en sessionStorage: si ya intentamos auto-reload y vuelve a fallar,
 * mostramos UI manual.
 */
const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
];
const CHUNK_RELOAD_FLAG = 'pf_chunk_reload_attempted';

function isChunkLoadError(error: Error): boolean {
  if (error?.name === 'ChunkLoadError') return true;
  const msg = error?.message ?? '';
  return CHUNK_ERROR_PATTERNS.some((p) => p.test(msg));
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Error desconocido',
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught:', error, errorInfo.componentStack);

    // Sprint 1 P1 MOB-010: si es ChunkLoadError y no hemos intentado reload
    // todavia en esta sesion, hard-reload automatico para tomar el HTML nuevo.
    if (isChunkLoadError(error)) {
      try {
        const alreadyAttempted = sessionStorage.getItem(CHUNK_RELOAD_FLAG);
        if (!alreadyAttempted) {
          sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
          // No reportamos a Sentry — es esperado post-deploy.
          window.location.reload();
          return;
        }
      } catch {
        // sessionStorage puede fallar en modo privado; caer a UI manual.
      }
      // Si ya intentamos antes, reportamos (puede ser red rota / CDN issue).
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack, reloadAttempted: true },
      });
      return;
    }

    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      // Sprint 1 P1 MOB-010: copy especifico para ChunkLoadError (post-deploy).
      // El usuario entiende "actualizar" mejor que "reintentar" cuando se le
      // dice que hay version nueva.
      if (this.state.isChunkError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
            <RefreshCw className="h-12 w-12 text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Hay una versión nueva</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Lanzamos una actualización mientras tenías la app abierta. Recarga la página para
              tomarla.
            </p>
            <Button
              onClick={() => {
                try {
                  sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
                } catch {
                  // ignorar
                }
                window.location.reload();
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Algo se rompió por nuestro lado</h2>
          <p className="text-muted-foreground mb-4">
            Hubo un error al cargar esta página. Si vuelve a pasar, escríbenos a{' '}
            <a href="mailto:hola@pawfriend.cl" className="text-purple-600 underline">
              hola@pawfriend.cl
            </a>
            .
          </p>
          <p className="text-xs text-muted-foreground bg-muted rounded p-2 mb-6 max-w-md font-mono break-all">
            {this.state.errorMessage}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() =>
                this.setState({ hasError: false, errorMessage: '', isChunkError: false })
              }
            >
              Reintentar
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/home')}>
              Ir al inicio
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * useWalkSession — paseo en vivo con GPS tracking.
 *
 * Flujo:
 *   1. start(petId) → crea row pet_walks status='in_progress', captura GPS inicial,
 *      arranca watchPosition + timer interno.
 *   2. Sampling: cada 10s agrega punto al path (filtra accuracy > 50m).
 *      Distancia se calcula incrementalmente con Haversine.
 *   3. stop() → UPDATE pet_walks status='completed' con duration, distance,
 *      end_lat/lng, path final. Trigger DB inserta evento en pet_timeline_events.
 *   4. cancel() → UPDATE status='cancelled'.
 *
 * Persistencia: si el user refresca o cierra la app mid-paseo, el row queda
 * status='in_progress'. Al re-mount el hook detecta el walk activo y ofrece
 * resumir (no implementado aun en MVP — solo cancel desde UI).
 *
 * Permisos: requiere geolocation user gesture. Si denied, hook reporta error.
 *
 * Ver mig 20261005000003_pet_walks_timer.sql para schema y RLS.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WalkSample {
  lat: number;
  lng: number;
  t: number;
  accuracy?: number;
}

export interface WalkSessionState {
  isActive: boolean;
  walkId: string | null;
  startedAt: Date | null;
  durationSeconds: number;
  distanceMeters: number;
  path: WalkSample[];
  error: string | null;
  isStarting: boolean;
  isStopping: boolean;
}

const SAMPLE_INTERVAL_MS = 10_000;
const ACCURACY_THRESHOLD_M = 50;
const PATH_MAX_POINTS = 720;

function haversineMeters(a: WalkSample, b: WalkSample): number {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada en este navegador.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
  });
}

export function useWalkSession() {
  const [state, setState] = useState<WalkSessionState>({
    isActive: false,
    walkId: null,
    startedAt: null,
    durationSeconds: 0,
    distanceMeters: 0,
    path: [],
    error: null,
    isStarting: false,
    isStopping: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSampleRef = useRef<WalkSample | null>(null);
  const lastSampleTimeRef = useRef<number>(0);
  const pathRef = useRef<WalkSample[]>([]);
  const distanceRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    lastSampleRef.current = null;
    lastSampleTimeRef.current = 0;
    pathRef.current = [];
    distanceRef.current = 0;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const handlePositionUpdate = useCallback((pos: GeolocationPosition) => {
    const accuracy = pos.coords.accuracy;
    if (accuracy && accuracy > ACCURACY_THRESHOLD_M) return;

    const now = Date.now();
    if (now - lastSampleTimeRef.current < SAMPLE_INTERVAL_MS) return;

    const sample: WalkSample = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      t: now,
      accuracy: accuracy ?? undefined,
    };

    if (lastSampleRef.current) {
      const delta = haversineMeters(lastSampleRef.current, sample);
      if (delta < 500) {
        distanceRef.current += delta;
      }
    }

    if (pathRef.current.length < PATH_MAX_POINTS) {
      pathRef.current.push(sample);
    }
    lastSampleRef.current = sample;
    lastSampleTimeRef.current = now;

    setState((s) => ({
      ...s,
      distanceMeters: Math.round(distanceRef.current * 100) / 100,
      path: [...pathRef.current],
    }));
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Permiso de ubicación denegado. Activá el GPS para grabar el paseo.',
      2: 'Ubicación no disponible. Revisá la señal del GPS.',
      3: 'GPS tardó demasiado en responder.',
    };
    setState((s) => ({ ...s, error: messages[err.code] ?? err.message }));
  }, []);

  const start = useCallback(
    async (petId: string) => {
      if (state.isActive || state.isStarting) return;
      setState((s) => ({ ...s, isStarting: true, error: null }));

      try {
        const pos = await getCurrentPosition();
        const startSample: WalkSample = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: Date.now(),
          accuracy: pos.coords.accuracy ?? undefined,
        };

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error('Tenés que iniciar sesión para grabar paseos.');
        }

        const { data: walk, error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('pet_walks' as any)
          .insert({
            pet_id: petId,
            owner_id: userData.user.id,
            started_at: new Date(startSample.t).toISOString(),
            start_lat: startSample.lat,
            start_lng: startSample.lng,
            path: [startSample],
            status: 'in_progress',
            source: 'manual',
          })
          .select('id, started_at')
          .single();

        if (error || !walk) {
          throw new Error(error?.message ?? 'No se pudo crear el paseo.');
        }

        pathRef.current = [startSample];
        lastSampleRef.current = startSample;
        lastSampleTimeRef.current = startSample.t;
        distanceRef.current = 0;

        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePositionUpdate,
          handleError,
          { enableHighAccuracy: true, timeout: 30_000, maximumAge: 5_000 }
        );

        timerRef.current = setInterval(() => {
          setState((s) => {
            if (!s.startedAt) return s;
            return {
              ...s,
              durationSeconds: Math.floor((Date.now() - s.startedAt.getTime()) / 1000),
            };
          });
        }, 1_000);

        setState({
          isActive: true,
          walkId: walk.id,
          startedAt: new Date(walk.started_at),
          durationSeconds: 0,
          distanceMeters: 0,
          path: [startSample],
          error: null,
          isStarting: false,
          isStopping: false,
        });
      } catch (err) {
        cleanup();
        setState((s) => ({
          ...s,
          isStarting: false,
          error: err instanceof Error ? err.message : 'Error al iniciar paseo.',
        }));
      }
    },
    [state.isActive, state.isStarting, handlePositionUpdate, handleError, cleanup]
  );

  const stop = useCallback(
    async (note?: string) => {
      if (!state.isActive || !state.walkId || state.isStopping) return null;
      setState((s) => ({ ...s, isStopping: true }));

      try {
        const lastSample = lastSampleRef.current;
        const endedAt = new Date();
        const startedAt = state.startedAt ?? endedAt;
        const durationSeconds = Math.max(
          1,
          Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000)
        );

        const { error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from('pet_walks' as any)
          .update({
            status: 'completed',
            ended_at: endedAt.toISOString(),
            duration_seconds: durationSeconds,
            distance_meters: Math.round(distanceRef.current * 100) / 100,
            end_lat: lastSample?.lat,
            end_lng: lastSample?.lng,
            path: pathRef.current,
            note: note?.trim() || null,
          })
          .eq('id', state.walkId);

        if (error) throw error;

        const result = {
          walkId: state.walkId,
          durationSeconds,
          distanceMeters: distanceRef.current,
        };

        cleanup();
        setState({
          isActive: false,
          walkId: null,
          startedAt: null,
          durationSeconds: 0,
          distanceMeters: 0,
          path: [],
          error: null,
          isStarting: false,
          isStopping: false,
        });

        return result;
      } catch (err) {
        setState((s) => ({
          ...s,
          isStopping: false,
          error: err instanceof Error ? err.message : 'Error al guardar el paseo.',
        }));
        return null;
      }
    },
    [state.isActive, state.walkId, state.startedAt, state.isStopping, cleanup]
  );

  const cancel = useCallback(async () => {
    if (!state.walkId) {
      cleanup();
      setState((s) => ({ ...s, isActive: false, walkId: null, startedAt: null }));
      return;
    }
    try {
      await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('pet_walks' as any)
        .update({ status: 'cancelled', ended_at: new Date().toISOString() })
        .eq('id', state.walkId);
    } finally {
      cleanup();
      setState({
        isActive: false,
        walkId: null,
        startedAt: null,
        durationSeconds: 0,
        distanceMeters: 0,
        path: [],
        error: null,
        isStarting: false,
        isStopping: false,
      });
    }
  }, [state.walkId, cleanup]);

  return {
    state,
    start,
    stop,
    cancel,
  };
}

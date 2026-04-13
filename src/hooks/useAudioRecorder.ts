import { useState, useRef, useCallback, useEffect } from 'react';

// ----------------------------------------------------------------
// SpeechRecognition type declarations (not in default TS DOM lib)
// ----------------------------------------------------------------
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// ----------------------------------------------------------------
// Hook
// ----------------------------------------------------------------

export interface UseAudioRecorderReturn {
  /** Mic is active and capturing */
  isRecording: boolean;
  /** Recording is paused (mic muted but not stopped) */
  isPaused: boolean;
  /** Elapsed seconds since recording started */
  duration: number;
  /** Finalized transcript text */
  transcript: string;
  /** Current interim (partial) recognition text */
  interimText: string;
  /** Browser supports SpeechRecognition + getUserMedia */
  browserSupported: boolean;
  /** Start recording + speech recognition */
  start: () => Promise<void>;
  /** Pause recognition (keeps mic stream alive) */
  pause: () => void;
  /** Resume recognition after pause */
  resume: () => void;
  /** Stop recording entirely and finalize transcript */
  stop: () => void;
  /** Reset all state to initial */
  reset: () => void;
}

const getSpeechRecognitionCtor = (): SpeechRecognitionConstructor | null =>
  window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef(''); // Mutable copy to avoid stale closures

  const browserSupported =
    typeof window !== 'undefined' &&
    !!getSpeechRecognitionCtor() &&
    !!navigator.mediaDevices?.getUserMedia;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'es-CL';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalPart = '';
      let interimPart = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalPart += result[0].transcript;
        } else {
          interimPart += result[0].transcript;
        }
      }
      if (finalPart) {
        transcriptRef.current += (transcriptRef.current ? ' ' : '') + finalPart.trim();
        setTranscript(transcriptRef.current);
      }
      setInterimText(interimPart);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are non-fatal — recognition restarts automatically
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('[useAudioRecorder] SpeechRecognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording and not paused
      // SpeechRecognition stops after silence; we want continuous capture
      if (streamRef.current && !isPaused) {
        try {
          recognition.start();
        } catch {
          // Already started or mic revoked — ignore
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, [isPaused]);

  const start = useCallback(async () => {
    if (!browserSupported) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    setIsRecording(true);
    setIsPaused(false);
    setDuration(0);
    setTranscript('');
    setInterimText('');
    transcriptRef.current = '';

    startTimer();
    startRecognition();
  }, [browserSupported, startTimer, startRecognition]);

  const pause = useCallback(() => {
    if (!isRecording || isPaused) return;
    setIsPaused(true);
    stopTimer();
    recognitionRef.current?.stop();
  }, [isRecording, isPaused, stopTimer]);

  const resume = useCallback(() => {
    if (!isRecording || !isPaused) return;
    setIsPaused(false);
    startTimer();
    startRecognition();
  }, [isRecording, isPaused, startTimer, startRecognition]);

  const stop = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    setInterimText('');
    stopTimer();

    recognitionRef.current?.stop();
    recognitionRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [stopTimer]);

  const reset = useCallback(() => {
    stop();
    setDuration(0);
    setTranscript('');
    transcriptRef.current = '';
  }, [stop]);

  return {
    isRecording,
    isPaused,
    duration,
    transcript,
    interimText,
    browserSupported,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}

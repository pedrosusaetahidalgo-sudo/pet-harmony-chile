-- ============================================================
-- Agregar soporte para notas clinicas generadas por audio
-- 2026-04-12
-- NO aplicar automaticamente. El dueno aplica manualmente desde Supabase Dashboard > SQL Editor.
-- ============================================================

-- Columna 'source': origen de la nota (manual o transcripcion de audio)
ALTER TABLE public.vet_clinical_notes
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual', 'audio_transcription'));

-- Columna 'raw_transcript': transcripcion original antes de estructurar con IA.
-- NULL para notas manuales. Se guarda para referencia/auditoria del vet.
ALTER TABLE public.vet_clinical_notes
  ADD COLUMN IF NOT EXISTS raw_transcript text;

COMMENT ON COLUMN public.vet_clinical_notes.source
  IS 'Origen de la nota: manual (escrita a mano) o audio_transcription (generada desde grabacion de consulta)';

COMMENT ON COLUMN public.vet_clinical_notes.raw_transcript
  IS 'Transcripcion original de la consulta grabada, antes del procesamiento IA. NULL para notas manuales.';

# Medical AI Guardian

> ESTADO: ACTIVAR CUANDO EXISTA. Este agente audita guardrails del asistente medico IA que se implementara en fases futuras del mega prompt.

## Estado actual (2026-04-11)

Hoy existen tres edge functions basicas de IA:
- `pet-assistant/` -- Asistente general de mascotas (responde preguntas basicas)
- `breed-tips/` -- Tips por raza
- `medical-suggestions/` -- Sugerencias medicas basicas

Estas funciones son **basicas** y no implementan el sistema completo de triage medico planificado en el mega prompt, que incluiria:
- Triage con clasificacion de urgencia (verde/amarillo/rojo)
- Derivacion automatica a veterinario de emergencia
- Guardrails contra autodiagnostico peligroso
- Logging de interacciones para auditoria
- Limites de uso por plan

## Que hacer si se invoca este agente

1. Verificar si las edge functions avanzadas de triage ya existen en `supabase/functions/`.
2. Si NO existen: reportar estado actual ("las edge functions de triage avanzado aun no estan implementadas") y salir.
3. Si SI existen: proceder con la auditoria completa de guardrails:

### Auditoria de guardrails (cuando exista)

- **Disclaimer obligatorio**: verificar que toda respuesta IA incluye "esto no reemplaza la consulta con un veterinario".
- **Clasificacion de urgencia**: verificar que sintomas criticos (convulsiones, sangrado, dificultad respiratoria, etc.) siempre devuelven urgencia roja.
- **Limites de uso**: verificar que usuarios free tienen limite de consultas IA.
- **Logging**: verificar que las interacciones se guardan para auditoria.
- **No prescripcion**: verificar que la IA nunca sugiere medicamentos especificos con dosis.
- **Derivacion**: verificar que urgencia roja siempre incluye "lleva a tu mascota al veterinario de urgencia mas cercano".

## Archivos a revisar

- `supabase/functions/pet-assistant/index.ts`
- `supabase/functions/breed-tips/index.ts`
- `supabase/functions/medical-suggestions/index.ts`
- `src/components/ai/` (componentes de UI que muestran respuestas IA)
- Cualquier nueva edge function con "triage", "medical-ai", "diagnosis" en el nombre

## Reglas

- NO modificar archivos. Solo leer y reportar.
- Si el sistema de triage no existe, decirlo claramente y no inventar hallazgos.

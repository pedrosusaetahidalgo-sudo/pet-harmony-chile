# Audio de Consulta Veterinaria — Transcripcion Inteligente en Vivo

> **Estado**: Idea / Propuesta
> **Fecha**: 2026-04-12
> **Target**: Premium B2B (veterinarios y clinicas)
> **Potencial**: Joya de la corona para vets — diferenciador unico en Chile

---

## Problema que resuelve

Los veterinarios durante una consulta estan enfocados en el animal y en la conversacion con el dueno. Tomar notas al mismo tiempo es incomodo, lento, y se pierden detalles clave: correos, nombres de medicamentos, fechas de proxima visita, instrucciones de cuidado, etc.

Resultado: fichas clinicas incompletas, seguimiento deficiente, informacion perdida.

---

## Solucion propuesta

Un boton **"Grabar consulta"** dentro del dashboard del veterinario que:

1. **Graba el audio** de la consulta en tiempo real desde el dispositivo (celular o PC)
2. **Transcribe en vivo** mostrando el texto mientras se habla (speech-to-text streaming)
3. **Al finalizar**, un modelo de IA procesa la transcripcion completa y genera automaticamente:
   - Resumen estructurado de la consulta (punteo detallado)
   - Datos capturados: nombres, correos, telefonos, direcciones mencionadas
   - Diagnostico y observaciones clinicas mencionadas
   - Medicamentos recetados o mencionados (nombre, dosis, frecuencia)
   - Instrucciones de cuidado para el dueno
   - Pendientes y tareas de seguimiento (proxima cita, examenes, derivaciones)
   - Senales de alerta mencionadas
4. **El audio se descarta** inmediatamente despues del procesamiento — nunca se sube ni almacena
5. El vet puede **editar, confirmar y guardar** el resumen como nota clinica asociada a la ficha de la mascota

---

## Flujo de usuario (UX)

```
Vet abre ficha de mascota o dashboard
  → Boton "Grabar consulta" (icono microfono)
    → Modal/pantalla de grabacion:
      ┌─────────────────────────────────────┐
      │  🔴 Grabando consulta   00:12:34    │
      │                                     │
      │  Transcripcion en vivo:             │
      │  ─────────────────────              │
      │  "...entonces le estamos dando      │
      │  el antiparasitario cada 3 meses,   │
      │  la proxima dosis seria en julio.   │
      │  El correo de la duena es           │
      │  maria@gmail.com para enviarle      │
      │  los resultados del hemograma..."   │
      │                                     │
      │  [ Pausar ]  [ Detener y procesar ] │
      └─────────────────────────────────────┘
    → Procesamiento IA (5-15 seg)
    → Pantalla de resultados editables:
      ┌─────────────────────────────────────┐
      │  Resumen de consulta                │
      │  Mascota: Luna | Dueno: Maria       │
      │  Fecha: 2026-04-12                  │
      │                                     │
      │  RESUMEN                            │
      │  • Control rutinario, buen estado   │
      │  • Peso: 8.2 kg (estable)           │
      │  • Antiparasitario al dia           │
      │                                     │
      │  MEDICAMENTOS                       │
      │  • Antiparasitario c/3 meses        │
      │    Proxima dosis: julio 2026        │
      │                                     │
      │  DATOS CAPTURADOS                   │
      │  • Email duena: maria@gmail.com     │
      │                                     │
      │  PENDIENTES                         │
      │  • Enviar resultados hemograma      │
      │    a maria@gmail.com                │
      │  • Proxima cita: julio 2026         │
      │                                     │
      │  INSTRUCCIONES PARA EL DUENO        │
      │  • Mantener dieta actual            │
      │  • Observar si aparece letargia     │
      │                                     │
      │  [ Editar ] [ Guardar en ficha ]    │
      │  [ Descartar ] [ Exportar PDF ]     │
      └─────────────────────────────────────┘
```

---

## Arquitectura tecnica propuesta

### Frontend (React)

| Componente | Responsabilidad |
|---|---|
| `ConsultationRecorder.tsx` | UI principal: boton grabar, modal, timer |
| `LiveTranscript.tsx` | Muestra transcripcion en vivo (streaming) |
| `ConsultationSummary.tsx` | Resultados editables post-procesamiento |
| `useAudioRecorder.ts` | Hook: MediaRecorder API, chunks, estado |
| `useTranscription.ts` | Hook: envio de audio a STT, recepcion streaming |

### Audio y transcripcion (Speech-to-Text)

**Opcion A — Web Speech API (gratis, solo Chrome/Edge)**
- `SpeechRecognition` / `webkitSpeechRecognition`
- Pro: costo cero, transcripcion en vivo nativa
- Contra: no funciona en Safari iOS ni Firefox; calidad variable en espanol chileno

**Opcion B — Whisper via Edge Function (recomendada)**
- Grabar audio completo con `MediaRecorder` (WebM/Opus o WAV)
- Enviar chunks periodicos (cada 15-30s) a una Edge Function
- La Edge Function llama a OpenAI Whisper API o Groq Whisper
- Pro: funciona en todos los navegadores + Capacitor, excelente espanol
- Contra: costo por minuto de audio (~$0.006/min Whisper, ~$0.002/min Groq)

**Opcion C — Hibrida (recomendada para MVP)**
- Usar Web Speech API donde este disponible para la vista previa en vivo
- Enviar el audio completo al final a Whisper para la transcripcion definitiva
- Mejor UX (feedback en vivo) + mejor calidad (transcripcion final precisa)

### Procesamiento IA (Edge Function)

Nueva Edge Function: `process-consultation-audio/`

```
Input:
  - transcripcion completa (texto)
  - pet_id (opcional, para contexto de la mascota)
  - provider_id

Prompt IA (Claude/GPT):
  "Eres un asistente veterinario. A partir de la siguiente transcripcion
   de una consulta veterinaria, genera un resumen estructurado con:
   1. Resumen general (bullet points)
   2. Diagnostico y observaciones clinicas
   3. Medicamentos mencionados (nombre, dosis, frecuencia)
   4. Datos de contacto capturados (emails, telefonos, nombres)
   5. Instrucciones de cuidado para el dueno
   6. Pendientes y seguimiento
   7. Senales de alerta
   Responde en JSON estructurado."

Output: JSON con secciones parseables
```

### Almacenamiento (Supabase)

Nueva tabla: `consultation_recordings`

```sql
CREATE TABLE consultation_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES profiles(id) NOT NULL,
  pet_id uuid REFERENCES pets(id),
  appointment_id uuid REFERENCES appointments(id),
  -- Audio (NO se almacena el archivo, solo metadata)
  duration_seconds integer,         -- duracion de la grabacion original
  -- Transcripcion
  raw_transcript text,              -- transcripcion completa
  -- Resumen IA
  ai_summary jsonb,                 -- resumen estructurado
  ai_model text,                    -- modelo usado (trazabilidad)
  -- Datos extraidos
  extracted_contacts jsonb,         -- emails, telefonos, nombres
  extracted_medications jsonb,      -- medicamentos mencionados
  extracted_followups jsonb,        -- pendientes y proximas citas
  -- Estado
  status text DEFAULT 'processing', -- recording | processing | ready | archived
  -- Vinculo con ficha clinica
  clinical_note_id uuid REFERENCES clinical_notes(id),
  saved_to_clinical_record boolean DEFAULT false,
  -- Timestamps
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: solo el vet que grabo puede ver sus grabaciones
ALTER TABLE consultation_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vets own their recordings"
  ON consultation_recordings
  FOR ALL
  USING (provider_id = auth.uid());
```

---

## Restricciones y consideraciones

### Privacidad y legal (principio: audio efimero)
- **El audio NUNCA se almacena**. Se procesa en memoria (transcripcion + resumen IA) y se descarta inmediatamente. Solo se persiste la nota estructurada resultante. Esto elimina riesgos de almacenamiento de datos biometricos/voz, reduce costos de storage a practicamente cero, y simplifica compliance
- **Consentimiento obligatorio**: antes de grabar, el vet debe confirmar que informo al dueno y tiene su consentimiento. Checkbox o modal de confirmacion obligatorio
- **Aviso visible**: durante la grabacion, mostrar indicador claro de que se esta grabando
- **Sin audio del paciente (mascota)**: el sistema procesa solo voz humana, pero los sonidos del animal pueden aparecer — no es problema para la transcripcion

### Costos estimados

| Concepto | Costo por consulta (15 min promedio) |
|---|---|
| Whisper transcripcion | ~$0.09 (Whisper) o ~$0.03 (Groq) |
| IA resumen (Claude Haiku) | ~$0.01-0.02 |
| Storage audio | $0 (no se almacena) |
| Storage nota (JSON ~2-5 KB) | despreciable |
| **Total por consulta** | **~$0.04-0.11** |

Con un vet que haga 15 consultas/dia = ~$0.60-1.65/dia = ~$18-50/mes de costo variable.
Esto cabe holgadamente dentro del margen del plan Clinica Basica ($29.900) o Pro ($59.900).

### Limites por plan B2B

| Plan | Grabaciones/mes | Duracion max |
|---|---|---|
| Gratis | 0 (no disponible) | — |
| Individual | 30 | 30 min |
| Clinica Basica | 150 | 45 min |
| Clinica Pro | Ilimitadas | 60 min |

---

## Diferenciadores vs competencia

1. **Nadie en Chile ofrece esto** para veterinarios. Las apps vet existentes (PetPro, Puppis, Mascota Comunal) no tienen grabacion ni transcripcion
2. **Reduce tiempo administrativo** del vet en ~10-15 min por consulta
3. **Mejora la calidad de la ficha clinica** — informacion mas completa y precisa
4. **Captura datos accionables** (emails, pendientes) que normalmente se pierden
5. **Se integra directo con la ficha clinica** de Paw Friend — no es una app separada
6. **Genera follow-ups automaticos** — el sistema puede crear recordatorios a partir de los pendientes detectados

---

## MVP minimo (Fase 1)

Para validar la idea con el menor esfuerzo:

1. Boton "Grabar consulta" en la ficha clinica (solo vets premium)
2. Grabacion con `MediaRecorder` API (funciona en todos los navegadores modernos + Capacitor)
3. Envio del audio a Edge Function (procesado en memoria, nunca almacenado)
4. Edge Function: Whisper (transcripcion) → Claude Haiku (resumen estructurado)
5. Mostrar resumen editable
6. Boton "Guardar en ficha clinica" → inserta como nota clinica

**NO incluir en MVP**: transcripcion en vivo, extraccion automatica de recordatorios, exportar PDF individual de la consulta.

---

## Fases de implementacion

### Fase 1 — MVP (1-2 semanas)
- [ ] Tabla `consultation_recordings` + RLS
- [ ] Edge Function `process-consultation-audio/` (Whisper + Claude Haiku)
- [ ] `useAudioRecorder.ts` hook
- [ ] `ConsultationRecorder.tsx` — UI basica de grabacion
- [ ] `ConsultationSummary.tsx` — resultados editables
- [ ] Integracion con ficha clinica (guardar como nota)
- [ ] Gate por plan B2B (solo Individual+)

### Fase 2 — Transcripcion en vivo (1 semana)
- [ ] Web Speech API para preview en vivo (Chrome/Edge)
- [ ] Fallback: indicador de "grabando..." en otros navegadores
- [ ] Chunks periodicos a Whisper para transcripcion parcial

### Fase 3 — Inteligencia avanzada (1-2 semanas)
- [ ] Extraccion automatica de recordatorios → crear en tabla `reminders`
- [ ] Deteccion de medicamentos → sugerir agregar a historial
- [ ] Deteccion de proxima cita → sugerir crear appointment
- [ ] Envio automatico de resumen al dueno por email/WhatsApp

### Fase 4 — Analytics y mejora continua
- [ ] Dashboard de uso: consultas grabadas, tiempo ahorrado
- [ ] Feedback del vet sobre calidad del resumen (pulgar arriba/abajo)
- [ ] Fine-tuning del prompt basado en feedback
- [ ] Templates de resumen por tipo de consulta (control, urgencia, cirugia)

---

## Integracion con features existentes

| Feature existente | Integracion |
|---|---|
| Ficha clinica | Guardar resumen como nota clinica |
| Plantillas post-consulta (`ClinicalNoteEditor`) | Pre-llenar plantilla con datos del audio |
| Recordatorios | Crear recordatorios desde pendientes detectados |
| Chat/WhatsApp | Enviar resumen al dueno |
| PDF ficha medica | Incluir notas de consultas grabadas |
| Reportes semanales vet | Stats de consultas grabadas |
| Google Calendar | Vincular grabacion con cita del calendario |

---

## Ejemplo de output IA

**Input** (transcripcion):
> "Hola Maria, como esta Luna hoy? Ah mira, se ve bien de peso, dejame pesarla... 8.2 kilos, perfecto, esta estable. El antiparasitario lo dieron en abril cierto? Bien, la proxima dosis seria en julio entonces. Mira, le voy a pedir un hemograma de control porque ya tiene 7 anos y es bueno hacer chequeos anuales. Te lo mando por correo cuando esten los resultados, tu correo es maria punto gonzalez arroba gmail punto com cierto? Perfecto. Mientras tanto sigan con la misma dieta, y si notan que esta mas letargica o deja de comer me avisan altiro. La proxima visita la agendamos para julio, junto con el antiparasitario."

**Output** (JSON procesado):

```json
{
  "resumen": [
    "Control rutinario de Luna, perra de 7 anos",
    "Peso estable: 8.2 kg",
    "Antiparasitario al dia, proxima dosis julio 2026",
    "Se solicita hemograma de control por edad"
  ],
  "diagnostico": "Control de rutina. Paciente en buen estado general.",
  "medicamentos": [
    {
      "nombre": "Antiparasitario",
      "frecuencia": "Cada 3 meses",
      "proxima_dosis": "Julio 2026"
    }
  ],
  "examenes_solicitados": [
    "Hemograma de control"
  ],
  "contactos": [
    {
      "nombre": "Maria Gonzalez",
      "email": "maria.gonzalez@gmail.com",
      "rol": "Duena de Luna"
    }
  ],
  "instrucciones_dueno": [
    "Mantener dieta actual",
    "Observar si aparece letargia o inapetencia",
    "Contactar si hay cambios"
  ],
  "pendientes": [
    "Enviar resultados hemograma a maria.gonzalez@gmail.com",
    "Agendar proxima cita julio 2026",
    "Aplicar antiparasitario julio 2026"
  ],
  "alertas": [
    "Paciente geriatrica (7 anos) — iniciar chequeos anuales"
  ]
}
```

---

## Por que es una joya de la corona

1. **Alto valor percibido**: el vet ahorra 10-15 min de notas por consulta
2. **Lock-in fuerte**: una vez que el vet se acostumbra, no puede volver atras
3. **Datos unicos**: cada grabacion enriquece la ficha clinica de Paw Friend
4. **Dificil de copiar**: requiere integracion profunda con la ficha clinica + IA
5. **Monetizable**: justifica facilmente los planes Clinica Basica y Pro
6. **Escalable**: el costo por consulta es bajo y baja con volumen

# Nose Print UX de captura — Notas de inspiración (2026-04-24)

> **Origen**: Pedro compartió imagen de Knowse.ai con overlay "scanner biométrico" sobre nariz canina. Discutimos técnicamente: el overlay es UI marketing, no algoritmo. Pero la UX de captura SÍ vale copiar.

## Lo que vamos a copiar (cuando integremos nose print real)

Cuando el modelo DINOv2 fine-tuneado supere 0.65 separación y podamos activar `NOSE_PRINT_ENABLED=true`, el componente de captura debería tener:

### 1. Overlay de guía en tiempo real
- Círculo/óvalo blanco que rodea la nariz detectada
- **Cambia a verde** cuando nariz está bien encuadrada, **rojo** si está fuera del área
- Texto que se actualiza: "Alineá la nariz con el círculo" → "Perfecto, quedate quieto" → captura

### 2. Detección pre-captura con MediaPipe
- Reject automático si la foto no tiene nariz detectable
- Reject si la nariz está demasiado lejos (< 200px) o demasiado cerca (> 800px)
- Reject si no es frontal (usa face pose estimation)
- No permite tomar foto hasta que el score pase threshold

### 3. Feedback visual de "scanning"
- Después del click, animación de 2-3 segundos con líneas barriendo la imagen
- NO hace nada técnico adicional (el embedding ya se calculó), pero **le da al usuario percepción de seguridad**
- Importante: tiene que sentirse **confiable**, no solo funcional

### 4. Progresión clara
- Paso 1: "Acerca la cámara a la nariz de [mascota]"
- Paso 2: "Cuando la guía se ponga verde, tocá capturar"
- Paso 3: "Procesando..." (animación)
- Paso 4: "Listo, identidad guardada ✓"

## Por qué esto importa

Aunque técnicamente DINOv2 (nuestro approach) es equivalente a lo que usan competidores, el **usuario no evalúa el algoritmo, evalúa la experiencia**. Knowse vende "scanner biométrico" con estética de Face ID, y eso **sola** (sin algoritmo distinto) genera más confianza.

La ventaja nuestra va a ser:
1. Mismo algoritmo (state of the art embedding)
2. **+ UX igual o mejor** de captura
3. **+ Datos chilenos específicos** (refugios locales, cuando tengamos dataset)
4. **+ Producto integrado** (ficha clínica + Paw ID + adopción + B2B Vets)

## Stack técnico estimado

- **MediaPipe Pose** o **face-api.js** para detección en browser
- **Canvas API** para overlay
- **Framer Motion** para la animación de scanning
- **Capacitor Camera** plugin para mobile (mejor calidad que WebRTC)

## Cuándo implementarlo

Cuando se cumplan ambas condiciones:
1. Modelo fine-tuneado alcanza separación > 0.65 (hoy: 0.348 con DogFaceNet)
2. Tenemos 200+ individuos etiquetados (refugios + crowdsource)

Fecha estimada: **2026-06 o posterior**. No antes del lanzamiento público (1 junio).

## Referencia visual

Inspiración: https://www.knowse.ai/ (screenshot en el chat 2026-04-24).
Inspiración bancaria: Face ID iOS, BankID Noruega, Passkit Google.

## NO hacer prematuramente

- **NO implementar** antes de tener modelo production-grade. UX sin backend confiable es peor que backend confiable sin UX.
- **NO vender "AI biometric scan"** sin datos reales. Es la trampa en la que probablemente cae Knowse.

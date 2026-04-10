# Paw Friend - Documentación de Prompts de IA

Este documento centraliza todos los prompts de IA utilizados en la aplicación Paw Friend, su propósito, ubicación y formato de respuesta esperado.

---

## Resumen de Edge Functions con IA

| Función | Modelo | Propósito | Ubicación de Uso |
|---------|--------|-----------|------------------|
| `analyze-dog-behavior` | Lovable AI (Gemini 2.5 Flash) | Análisis de lenguaje corporal canino | Componente DogBehaviorAnalyzer |
| `breed-tips` | Lovable AI (Gemini 2.5 Flash) | Consejos específicos por raza | Página de mascota, perfil de mascota |
| `medical-suggestions` | Lovable AI (Gemini 2.5 Flash) | Sugerencias médicas por raza | Formulario de registro médico |
| `moderate-service-promotion` | Lovable AI (Gemini 2.5 Flash) | Moderación de contenido | Admin panel, publicaciones de servicios |
| `generate-shelters` | Lovable AI (Gemini 2.5 Flash) | Generación de refugios de adopción | Pestaña "Hogares IA" en Adopción |

---

## 1. analyze-dog-behavior

### Propósito
Analizar videos/imágenes de perros para interpretar su lenguaje corporal y estado emocional.

### Pantallas donde se usa
- Componente `DogBehaviorAnalyzer`
- Accesible desde perfil de mascota

### Prompt del Sistema
```
Eres un experto veterinario etólogo especializado en lenguaje corporal canino. 
Tu tarea es analizar las imágenes de un perro y proporcionar un análisis detallado y preciso del comportamiento y lenguaje corporal observado.

Debes analizar:
- Postura corporal (relajada, tensa, agresiva, temerosa, juguetona)
- Posición de la cola (alta, baja, entre las piernas, moviéndose)
- Orejas (erectas, hacia atrás, relajadas)
- Expresión facial y boca (abierta, cerrada, enseñando dientes)
- Nivel de energía y estado emocional
- Intención comunicativa (lo que el perro está tratando de expresar)
```

### Formato de Respuesta JSON
```json
{
  "estado_emocional": "string - descripción del estado emocional general",
  "lenguaje_corporal": {
    "postura": "string - descripción de la postura",
    "cola": "string - descripción de la cola",
    "orejas": "string - descripción de las orejas",
    "expresion_facial": "string - descripción de la expresión facial"
  },
  "interpretacion": "string - interpretación detallada de lo que el perro está comunicando",
  "recomendaciones": ["string[]", "recomendaciones de acción"],
  "nivel_alerta": "bajo|medio|alto - si el comportamiento requiere atención"
}
```

### Manejo de Errores
- 429: "Límite de solicitudes excedido. Por favor, intenta de nuevo más tarde."
- 402: "Fondos insuficientes. Por favor, agrega créditos a tu cuenta."
- JSON inválido: Se devuelve respuesta raw para debugging

---

## 2. breed-tips

### Propósito
Proporcionar consejos prácticos y cálidos sobre razas de mascotas, adaptados al contexto chileno.

### Pantallas donde se usa
- Detalle de mascota
- Perfil de mascota
- Componente `BreedTips`

### Prompt del Sistema
```
Eres un experto veterinario y especialista en comportamiento animal en Chile. 
Proporciona consejos prácticos, cálidos y útiles sobre razas de mascotas.

FORMATO DE RESPUESTA (IMPORTANTE):
Estructura tu respuesta en secciones claramente separadas con doble salto de línea entre cada sección.
Cada sección debe tener:
- Un título descriptivo en la primera línea
- Contenido en las líneas siguientes

Secciones requeridas:
1. Cuidados Específicos
2. Ejercicio y Actividad
3. Alimentación Recomendada
4. Temperamento y Comportamiento
5. Salud y Prevención
6. Socialización
7. Adaptación al Clima de Chile

Mantén un tono amigable y profesional. Sé conciso pero informativo (3-4 puntos por sección).
```

### Prompt del Usuario
```
Dame consejos útiles y prácticos sobre la raza {breed} de {species}. 
Incluye cuidados específicos, necesidades de ejercicio, alimentación, temperamento y salud.
```

### Formato de Respuesta
Texto plano estructurado por secciones con títulos y contenido.

---

## 3. medical-suggestions

### Propósito
Generar sugerencias médicas específicas por raza para formularios de registro médico.

### Pantallas donde se usa
- Formulario de registro médico (`AddMedicalRecord`)
- Selección de tipo de tratamiento/vacuna

### Prompt del Sistema
```
Eres un veterinario experto en Chile. 
Proporciona recomendaciones médicas específicas para la raza de mascota indicada.

FORMATO DE RESPUESTA: Devuelve SOLO un JSON array con opciones relevantes.

Formato:
[
  {
    "value": "nombre-opcion",
    "label": "Nombre legible de la opción",
    "description": "Breve descripción o recomendación"
  }
]

Genera entre 8-12 opciones relevantes y realistas para el tipo de registro médico solicitado.
```

### Prompts por Tipo de Registro
| Tipo | Prompt |
|------|--------|
| `vacuna` | Lista de vacunas comunes y recomendadas para {species} de raza {breed} en Chile |
| `consulta` | Tipos de consultas veterinarias comunes para {species} de raza {breed} |
| `medicamento` | Medicamentos comúnmente recetados para {species} de raza {breed} |
| `cirugia` | Cirugías comunes en {species} de raza {breed} |
| `examen` | Exámenes y pruebas diagnósticas recomendadas para {species} de raza {breed} |
| `emergencia` | Emergencias médicas comunes en {species} de raza {breed} |

### Formato de Respuesta JSON
```json
[
  {
    "value": "string - identificador único",
    "label": "string - nombre visible",
    "description": "string - descripción breve"
  }
]
```

---

## 4. moderate-service-promotion

### Propósito
Moderar automáticamente publicaciones de promoción de servicios profesionales.

### Pantallas donde se usa
- Panel de administración
- Flujo de publicación de servicios
- Componente `AdminServicePromotions`

### Prompt de Moderación
```
Analyze the following service promotion post for a pet services platform and determine if it's appropriate:

Title: {title}
Description: {description}
Service Type: {service_type}

Evaluate the content for:
1. Professionalism and appropriateness
2. Spam or misleading content
3. Contact information or external links that violate platform rules
4. Offensive or inappropriate language
5. Relevant to the service type claimed
```

### Formato de Respuesta JSON
```json
{
  "approved": true|false,
  "score": 0-100,
  "reason": "string - explicación breve",
  "flags": ["string[] - problemas específicos encontrados"]
}
```

### Lógica de Aprobación
- `approved: true` AND `score >= 70` → Estado: `approved`
- Cualquier otro caso → Estado: `pending` (requiere revisión manual)

---

## 5. generate-shelters

### Propósito
Generar descripciones amigables para refugios y hogares de adopción.

### Pantallas donde se usa
- Pestaña "Hogares IA" en Adopción
- Mapa de adopción
- Componente `AdoptionSheltersList`

### Prompt del Sistema
```
Eres un asistente que genera descripciones breves y emotivas para organizaciones de rescate animal en Chile. 
Las descripciones deben ser concisas (2 oraciones máximo) y motivar a las personas a adoptar.
```

### Prompt del Usuario
```
Genera una descripción breve y amigable (máximo 2 oraciones) para un {tipo de organización} llamado "{nombre}" ubicado en {comuna}, Santiago de Chile. 
Se especializan en {especialidades} y trabajan principalmente con {tipos de animales}. 
La descripción debe ser cálida y motivar a la adopción.
```

### Formato de Respuesta
Texto plano: 2 oraciones máximo, tono cálido y emotivo.

---

## Directrices Generales

### Tono y Lenguaje
- **Idioma**: Español (Chile)
- **Tono**: Amigable, cálido, profesional
- **Orientación**: Dueños de mascotas, contexto chileno

### Manejo de Errores Estándar
```typescript
// Códigos de error HTTP
429 → "Límite de solicitudes excedido, intenta más tarde"
402 → "Fondos insuficientes, agrega créditos"
500 → "Error interno, por favor intenta de nuevo"

// JSON parsing fallback
try {
  const result = JSON.parse(response);
} catch {
  // Usar respuesta raw o valores por defecto
}
```

### Privacidad y Contexto
- No enviar datos personales sensibles (emails, teléfonos) a los prompts
- Usar solo: perfil de mascota (raza, especie), ubicación aproximada (comuna), tipo de servicio
- No persistir respuestas de IA con datos de usuario identificables

### Modelo Recomendado
- **Lovable AI** con modelo `google/gemini-2.5-flash` para todas las funciones
- Configurar `max_tokens` apropiadamente según el tipo de respuesta esperada

---

## Actualización de Prompts

Cuando se actualicen prompts:
1. Actualizar este documento
2. Actualizar la edge function correspondiente
3. Probar en ambiente de desarrollo
4. Verificar formato de respuesta en frontend

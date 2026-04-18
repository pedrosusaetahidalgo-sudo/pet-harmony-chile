# Google Play — Data Safety Responses

> Copia estas respuestas al formulario de Data Safety en Google Play Console.
> Referencia: https://play.google.com/console/ > App content > Data safety

---

## Datos recolectados

### 1. Informacion personal
| Dato | Recolectado | Compartido | Proposito | Opcional |
|---|---|---|---|---|
| Nombre | SI | NO | Funcionalidad de la app, Personalizacion | NO |
| Email | SI | NO | Gestion de cuenta, Comunicaciones | NO |
| Foto de perfil | SI | NO | Funcionalidad de la app | SI |

### 2. Informacion financiera
| Dato | Recolectado | Compartido | Proposito | Opcional |
|---|---|---|---|---|
| Historial de compras | SI | NO | Funcionalidad de la app (suscripciones) | SI |

### 3. Fotos y videos
| Dato | Recolectado | Compartido | Proposito | Opcional |
|---|---|---|---|---|
| Fotos | SI | NO | Funcionalidad de la app (fotos de mascotas, documentos medicos) | SI |

### 4. Informacion de salud
| Dato | Recolectado | Compartido | Proposito | Opcional |
|---|---|---|---|---|
| Informacion de salud | SI | SI (con veterinario elegido por el usuario) | Funcionalidad de la app (fichas medicas de mascotas) | NO |

### 5. Identificadores del dispositivo
| Dato | Recolectado | Compartido | Proposito | Opcional |
|---|---|---|---|---|
| Device ID | SI | SI (Firebase Analytics) | Analytics | SI |

### 6. Datos de uso de la app
| Dato | Recolectado | Compartido | Proposito | Opcional |
|---|---|---|---|---|
| Interacciones en la app | SI | SI (Firebase Analytics) | Analytics, Mejora del producto | SI |
| Historial de busqueda | SI | NO | Funcionalidad de la app | SI |

---

## Preguntas del formulario

| Pregunta | Respuesta |
|---|---|
| Does your app collect or share any of the required user data types? | SI |
| Is all of the user data collected by your app encrypted in transit? | SI (HTTPS/TLS) |
| Do you provide a way for users to request that their data is deleted? | SI (perfil > eliminar cuenta) |
| Does your app collect data from users under 13? | NO |
| Is your app a game? | NO |

---

## Seguridad de datos

- **Datos encriptados en transito**: SI (Supabase usa HTTPS, Flow.cl usa HTTPS)
- **Solicitar eliminacion de datos**: SI (usuario puede eliminar cuenta desde perfil)
- **Comprometido con Play Families Policy**: NO (no es app para ninos)

> **NOTA sobre datos de salud**: Los datos de salud son exclusivamente de **mascotas** (no de humanos).
> Esto es relevante para la clasificacion IARC y puede ayudar a simplificar la revision.
